import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Request, Response } from 'express';
import { ProxyConfigService } from './proxy-config.service';

/**
 * Registered as a raw Express middleware via `app.use()` in main.ts, NOT as
 * a Nest `@All('*')` route — @nestjs/core 10.4.x's LegacyRouteConverter
 * unconditionally rewrites a bare `'*'` route path to the Express-5-only
 * `'{*path}'` syntax before handing it to the platform adapter, regardless
 * of which Express major version is actually installed. This app runs
 * Express 4 (path-to-regexp 0.1.13), which has no idea what `{*path}` means,
 * so the "fixed" route silently matched nothing and every proxied request
 * 404'd. Bypassing Nest's router entirely for this catch-all sidesteps the
 * conversion. Every request is public *at the gateway* regardless — JWT
 * verification happens downstream, in the target service, since that's
 * where `@Public()`/`@Roles()` are actually declared per-route.
 */
@Injectable()
export class ProxyController {
  constructor(
    private readonly http: HttpService,
    private readonly proxyConfig: ProxyConfigService,
  ) {}

  async forward(req: Request, res: Response) {
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
