import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  SendZaloMessageCommand,
  SendZaloMessageResult,
} from './send-zalo-message.command';
import { ZaloProviderPort } from './zalo-provider.port';

@Injectable()
export class NotConfiguredZaloProviderService implements ZaloProviderPort {
  sendMessage(command: SendZaloMessageCommand): Promise<SendZaloMessageResult> {
    void command;

    throw new ServiceUnavailableException(
      'Zalo provider is not configured yet',
    );
  }
}
