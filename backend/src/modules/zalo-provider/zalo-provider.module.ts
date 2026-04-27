import { Module } from '@nestjs/common';
import { NotConfiguredZaloProviderService } from './not-configured-zalo-provider.service';
import { ZALO_PROVIDER } from './zalo-provider.port';

@Module({
  providers: [
    NotConfiguredZaloProviderService,
    {
      provide: ZALO_PROVIDER,
      useExisting: NotConfiguredZaloProviderService,
    },
  ],
  exports: [ZALO_PROVIDER],
})
export class ZaloProviderModule {}
