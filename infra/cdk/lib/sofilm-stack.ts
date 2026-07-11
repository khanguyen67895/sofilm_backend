import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Single EC2 host that runs the whole SoFilm stack via docker-compose
 * (docker-compose.prod.yml): all 11 NestJS apps + self-hosted Postgres,
 * Redis, Elasticsearch, MinIO, and a Caddy reverse proxy.
 *
 * Unlike the sibling `sofin` stack, this host never builds the image itself —
 * `.github/workflows/deploy.yml` builds+pushes to ECR and the host only
 * `docker pull`s (see gotcha #2 in ../../DEPLOY.md), so the instance only
 * needs runtime headroom, not build headroom.
 *
 * Tunables (override with `-c key=value` on `cdk deploy`):
 *   instanceType  EC2 size            (default t3.medium — 4 GB + 6 GB swap;
 *                                      Elasticsearch + MinIO + 11 Node
 *                                      processes want real memory, bump to
 *                                      t3.large if you see OOM kills)
 *   volumeSize    root EBS GB         (default 40 — ES index + MinIO media + Docker images)
 *   sshCidr       CIDR allowed on :22 (default '' → no SSH; use SSM Session Manager)
 *   keyName       existing EC2 keypair name for SSH (optional)
 *   repoUrl       git repo to clone   (default this project's GitHub repo)
 */
export class SofilmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const instanceType = this.node.tryGetContext('instanceType') ?? 't3.medium';
    const volumeSize = Number(this.node.tryGetContext('volumeSize') ?? 40);
    const sshCidr = (this.node.tryGetContext('sshCidr') ?? '') as string;
    const keyName = this.node.tryGetContext('keyName') as string | undefined;
    const repoUrl =
      (this.node.tryGetContext('repoUrl') as string | undefined) ??
      'https://github.com/khanguyen67895/sofilm_backend.git';

    // Minimal VPC: one AZ, a single public subnet, no NAT gateway (cost: $0
    // beyond the instance + EIP). The host gets a public IP directly.
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
      ],
    });

    const sg = new ec2.SecurityGroup(this, 'HostSg', {
      vpc,
      description: 'SoFilm host - public web + (optional) SSH',
      allowAllOutbound: true,
    });
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');
    if (sshCidr) {
      sg.addIngressRule(ec2.Peer.ipv4(sshCidr), ec2.Port.tcp(22), 'SSH');
    }

    // Instance role: SSM Session Manager (browser/CLI shell without SSH keys)
    // + ECR pull (the app image is built/pushed by CI, this role only reads it).
    const role = new iam.Role(this, 'HostRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
      ],
    });

    // ECR repository — CI (.github/workflows/deploy.yml) pushes here; the
    // EC2 host pulls via the instance role (no extra credentials needed on
    // the box beyond `aws ecr get-login-password`, which SSM's default AWS
    // CLI already has through this same role).
    const repo = new ecr.Repository(this, 'AppRepo', {
      repositoryName: 'sofilm-app',
      lifecycleRules: [{ maxImageCount: 5 }],
    });
    repo.grantPull(role);

    // Bootstrap: Docker + Compose v2 + git + a swapfile (protects against
    // memory spikes from Elasticsearch/MinIO on a smaller instance), then
    // clone the repo to /opt/sofilm-backend. Compose is NOT auto-started: it
    // needs .env.prod with real secrets, which the operator creates after
    // connecting (see ../../DEPLOY.md).
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'set -euxo pipefail',
      'dnf update -y',
      'dnf install -y docker git',
      'systemctl enable --now docker',
      'usermod -aG docker ec2-user || true',
      'mkdir -p /usr/local/lib/docker/cli-plugins',
      'curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose',
      'chmod +x /usr/local/lib/docker/cli-plugins/docker-compose',
      // swap compensates for RAM on smaller instances — ES + MinIO + 11 Node
      // processes can spike well above idle usage.
      'if [ ! -f /swapfile ]; then dd if=/dev/zero of=/swapfile bs=1M count=6144; chmod 600 /swapfile; mkswap /swapfile; swapon /swapfile; echo "/swapfile none swap sw 0 0" >> /etc/fstab; fi',
      `git clone ${repoUrl} /opt/sofilm-backend || true`,
      'chown -R ec2-user:ec2-user /opt/sofilm-backend || true',
      'echo "SoFilm host ready. Next: cd /opt/sofilm-backend, create .env.prod, then docker compose -f docker-compose.prod.yml --env-file .env.prod up -d" > /etc/motd',
    );

    const host = new ec2.Instance(this, 'Host', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: new ec2.InstanceType(instanceType),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      }),
      securityGroup: sg,
      role,
      userData,
      keyPair: keyName
        ? ec2.KeyPair.fromKeyPairName(this, 'KeyPair', keyName)
        : undefined,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(volumeSize, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
    });

    // Stable public IP so DNS A records (API domain) keep pointing here
    // across stops/starts.
    const eip = new ec2.CfnEIP(this, 'HostEip', { domain: 'vpc' });
    new ec2.CfnEIPAssociation(this, 'HostEipAssoc', {
      allocationId: eip.attrAllocationId,
      instanceId: host.instanceId,
    });

    new cdk.CfnOutput(this, 'PublicIp', { value: eip.ref, description: 'Elastic IP - point your DNS A record here' });
    new cdk.CfnOutput(this, 'InstanceId', { value: host.instanceId, description: 'Use as EC2_INSTANCE_ID GitHub secret' });
    new cdk.CfnOutput(this, 'SsmConnect', {
      value: `aws ssm start-session --target ${host.instanceId}`,
      description: 'Shell into the host (no SSH key needed)',
    });
    new cdk.CfnOutput(this, 'EcrUri', {
      value: repo.repositoryUri,
      description: 'ECR image URI - repo name (sofilm-app) is the ECR_REPOSITORY GitHub secret',
    });
  }
}
