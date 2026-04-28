import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ThreadType } from 'zca-js';
import { ZaloProviderPort } from './zalo-provider.port';
import {
  SendZaloMessageCommand,
  SendZaloMessageResult,
} from './send-zalo-message.command';
import { ZaloConnectionRegistry } from '../zalo-connection/zalo-connection-registry';
import { randomUUID } from 'crypto';

@Injectable()
export class ZaloProviderLiveService implements ZaloProviderPort {
  constructor(private readonly registry: ZaloConnectionRegistry) {}

  async sendMessage(
    command: SendZaloMessageCommand,
  ): Promise<SendZaloMessageResult> {
    const api = this.registry.getApi(command.zaloAccountId);
    if (!api) {
      throw new ServiceUnavailableException(
        `Zalo account ${command.zaloAccountId} is not connected`,
      );
    }

    await api.sendMessage(
      command.text,
      command.recipientId,
      ThreadType.User,
    );

    return {
      providerMessageId: randomUUID(),
      sentAt: new Date(),
    };
  }
}
