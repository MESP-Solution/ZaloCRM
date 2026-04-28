import { Module } from '@nestjs/common';
import { ZaloProviderLiveService } from './zalo-provider-live.service';
import { ZALO_PROVIDER } from './zalo-provider.port';
import { ZaloConnectionModule } from '../zalo-connection/zalo-connection.module';

@Module({
  imports: [ZaloConnectionModule],
  providers: [
    ZaloProviderLiveService,
    {
      provide: ZALO_PROVIDER,
      useExisting: ZaloProviderLiveService,
    },
  ],
  exports: [ZALO_PROVIDER],
})
export class ZaloProviderModule {}
