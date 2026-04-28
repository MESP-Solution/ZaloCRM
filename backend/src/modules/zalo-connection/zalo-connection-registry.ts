import { Injectable, Logger } from '@nestjs/common';
import type { API } from 'zca-js';
import { ZaloConnectionInfo } from './zalo-connection-info.interface';

export interface ConnectionEntry {
  api: API;
  providerOwnId: string;
  phoneNumber: string;
  proxyUrl?: string;
}

@Injectable()
export class ZaloConnectionRegistry {
  private readonly logger = new Logger(ZaloConnectionRegistry.name);
  private readonly connections = new Map<string, ConnectionEntry>();

  set(accountId: string, entry: ConnectionEntry): void {
    this.connections.set(accountId, entry);
    this.logger.log(
      `Registered account ${accountId} (ownId=${entry.providerOwnId})`,
    );
  }

  get(accountId: string): ConnectionEntry | undefined {
    return this.connections.get(accountId);
  }

  delete(accountId: string): boolean {
    const deleted = this.connections.delete(accountId);
    if (deleted) {
      this.logger.log(`Removed account ${accountId} from registry`);
    }
    return deleted;
  }

  has(accountId: string): boolean {
    return this.connections.has(accountId);
  }

  getApi(accountId: string): API | undefined {
    return this.connections.get(accountId)?.api;
  }

  listAll(): ZaloConnectionInfo[] {
    return Array.from(this.connections.entries()).map(([accountId, entry]) => ({
      accountId,
      providerOwnId: entry.providerOwnId,
      phoneNumber: entry.phoneNumber,
      proxyUrl: entry.proxyUrl,
      isConnected: true,
    }));
  }

  entries(): IterableIterator<[string, ConnectionEntry]> {
    return this.connections.entries();
  }

  clear(): void {
    this.connections.clear();
  }

  get size(): number {
    return this.connections.size;
  }
}
