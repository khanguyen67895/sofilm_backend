import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { User, AuthProvider } from '../entities/user.entity';
import { Role } from '../entities/role.entity';

/**
 * One-off CLI script — not a REST endpoint. Creates the account (with the given
 * password) if it doesn't exist yet, otherwise just grants ADMIN to the existing one.
 * Usage: npm run promote-admin -- <email> [password]
 */
async function run() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email) {
    console.error('Usage: npm run promote-admin -- <email> [password]');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    const users = app.get<Repository<User>>(getRepositoryToken(User));
    const roles = app.get<Repository<Role>>(getRepositoryToken(Role));

    let adminRole = await roles.findOne({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await roles.save(roles.create({ name: 'ADMIN', permissions: [] }));
    }

    let user = await users.findOne({ where: { email }, relations: ['roles'] });

    if (!user) {
      if (!password) {
        console.error(
          `No user found with email "${email}". Pass a password to create one: ` +
            `npm run promote-admin -- ${email} <password>`,
        );
        process.exit(1);
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      user = await users.save(
        users.create({
          email,
          name: 'Admin',
          passwordHash,
          provider: AuthProvider.LOCAL,
          isEmailVerified: true,
          roles: [adminRole],
        }),
      );
      console.log(`Created "${email}" and granted ADMIN.`);
      return;
    }

    if (user.roles.some((r) => r.name === 'ADMIN')) {
      console.log(`"${email}" is already an ADMIN.`);
    } else {
      user.roles = [...user.roles, adminRole];
      await users.save(user);
      console.log(`"${email}" promoted to ADMIN.`);
    }
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
