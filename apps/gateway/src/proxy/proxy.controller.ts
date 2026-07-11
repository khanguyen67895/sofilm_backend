import { All, Controller, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { Public } from '@app/auth';
import { ProxyConfigService } from './proxy-config.service';

@Controller()
export class ProxyController {
  constructor(
    private readonly http: HttpService,
    private readonly proxyConfig: ProxyConfigService,
  ) {}

  /**
   * Every request is public *at the gateway* — JWT verification happens
   * downstream, in the target service, since that's where `@Public()`/`@Roles()`
   * are actually declared per-route. The gateway only forwards, rate-limits,
   * and logs.
   */
  @Public()
  @All('*')
  async forward(@Req() req: Request, @Res() res: Response) {
    if (req.path === '/health') {
      return res.status(200).json({ status: 'ok', service: 'gateway' });
    }

    const [, service] = req.path.split('/');
    const baseUrl = this.proxyConfig.resolve(service);

    if (!baseUrl) {
      return res
        .status(404)
        .json({ success: false, statusCode: 404, message: `Unknown service "${service}"` });
    }

    try {
      const upstream = await this.http.axiosRef.request({
        method: req.method as never,
        url: `${baseUrl}${req.originalUrl}`,
        data: req.body,
        headers: this.forwardableHeaders(req),
        validateStatus: () => true,
      });
      res.status(upstream.status).json(upstream.data);
    } catch {
      res
        .status(502)
        .json({ success: false, statusCode: 502, message: `${service} service unreachable` });
    }
  }

  private forwardableHeaders(req: Request): Record<string, string> {
    const { host: _host, connection: _connection, 'content-length': _len, ...rest } = req.headers;
    return rest as Record<string, string>;
  }
}
