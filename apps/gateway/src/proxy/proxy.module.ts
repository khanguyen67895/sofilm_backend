import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyConfigService } from './proxy-config.service';

@Module({
  imports: [HttpModule.register({ timeout: 15_000 })],
  controllers: [ProxyController],
  providers: [ProxyConfigService],
})
export class ProxyModule {}
