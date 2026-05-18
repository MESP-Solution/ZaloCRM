import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
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
  private readonly logger = new Logger(ZaloProviderLiveService.name);

  constructor(private readonly registry: ZaloConnectionRegistry) {}

  async sendMessage(
    command: SendZaloMessageCommand,
  ): Promise<SendZaloMessageResult> {
    const conn = this.registry.get(command.zaloAccountId);
    if (!conn) {
      throw new ServiceUnavailableException(
        `Zalo account ${command.zaloAccountId} is not connected`,
      );
    }

    const api = conn.api;

    if (command.recipientId === conn.providerOwnId) {
      throw new Error('Cannot send message to self (sender UID === recipient UID)');
    }

    const message = command.imageFilePaths?.length
      ? { msg: command.text, attachments: command.imageFilePaths }
      : command.text;

    try {
      const response = await api.sendMessage(
        message,
        command.recipientId,
        ThreadType.User,
      );

      const providerMessageId = this.extractMessageId(response);

      return {
        providerMessageId,
        sentAt: new Date(),
      };
    } catch (err) {
      const proxy = conn.proxyUrl || 'direct';
      this.logger.error(
        `sendMessage failed [account=${command.zaloAccountId}] [proxy=${proxy}] [recipient=${command.recipientId}]: ${err instanceof Error ? err.message : err}`,
      );
      throw err;
    }
  }

  async findUser(
    zaloAccountId: string,
    phoneNumber: string,
  ): Promise<string | null> {
    const api = this.registry.getApi(zaloAccountId);
    if (!api) return null;

    try {
      const response = await api.findUser(phoneNumber);
      if (
        typeof response === 'object' &&
        response !== null &&
        'uid' in response &&
        typeof (response as Record<string, unknown>).uid === 'string'
      ) {
        return (response as Record<string, unknown>).uid as string;
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractMessageId(response: unknown): string {
    if (typeof response !== 'object' || response === null) {
      return this.fallbackMessageId();
    }

    const res = response as Record<string, unknown>;

    // zca-js returns { message: { msgId: number } | null, attachment: [...] }
    if (
      typeof res.message === 'object' &&
      res.message !== null &&
      'msgId' in (res.message as Record<string, unknown>)
    ) {
      const msgId = (res.message as Record<string, unknown>).msgId;
      if (typeof msgId === 'number' || typeof msgId === 'string') {
        return String(msgId);
      }
    }

    return this.fallbackMessageId();
  }

  private fallbackMessageId(): string {
    this.logger.warn(
      'Could not extract msgId from sendMessage response, using fallback UUID',
    );
    return randomUUID();
  }
}
