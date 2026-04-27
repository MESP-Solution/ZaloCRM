import {
  SendZaloMessageCommand,
  SendZaloMessageResult,
} from './send-zalo-message.command';

export const ZALO_PROVIDER = Symbol('ZALO_PROVIDER');

export interface ZaloProviderPort {
  sendMessage(command: SendZaloMessageCommand): Promise<SendZaloMessageResult>;
}
