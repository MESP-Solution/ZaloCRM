import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { JwtAuthService } from '../../common/jwt/jwt-auth.service';

function parseCookies(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of header.split(';')) {
    const [key, ...rest] = pair.split('=');
    if (key) result[key.trim()] = rest.join('=').trim();
  }
  return result;
}

interface AuthenticatedWebSocket extends WebSocket {
  customerId?: string;
}

@WebSocketGateway({ path: '/ws/zalo-qr' })
export class ZaloQrGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ZaloQrGateway.name);
  private readonly waitingClients = new Map<string, Set<AuthenticatedWebSocket>>();
  private readonly accountOwners = new Map<string, string>();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtAuthService: JwtAuthService) {}

  authorizeAccount(accountId: string, customerId: string): void {
    this.accountOwners.set(accountId, customerId);
  }

  revokeAccount(accountId: string): void {
    this.accountOwners.delete(accountId);
  }

  handleConnection(client: AuthenticatedWebSocket, req: IncomingMessage): void {
    const cookies = parseCookies(req.headers.cookie ?? '');
    const token = cookies['access_token'];
    if (!token) {
      client.close(4401, 'Unauthorized');
      return;
    }

    const payload = this.jwtAuthService.verifyToken(token);
    if (!payload) {
      client.close(4401, 'Invalid token');
      return;
    }

    client.customerId = payload.sub;
    this.logger.log('Authenticated WebSocket client connected');
    client.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'subscribe' && msg.data?.accountId) {
          this.addSubscription(client, msg.data.accountId);
        }
      } catch {
        // ignore malformed messages
      }
    });
  }

  handleDisconnect(client: WebSocket): void {
    for (const [accountId, clients] of this.waitingClients) {
      clients.delete(client);
      if (clients.size === 0) {
        this.waitingClients.delete(accountId);
      }
    }
  }

  emitQrCode(accountId: string, qrBase64: string): void {
    this.sendToSubscribers(accountId, {
      event: 'qr_code',
      data: { accountId, image: qrBase64 },
    });
  }

  emitQrScanned(
    accountId: string,
    data: { avatar: string; displayName: string },
  ): void {
    this.sendToSubscribers(accountId, {
      event: 'qr_scanned',
      data: { accountId, ...data },
    });
  }

  emitQrExpired(accountId: string): void {
    this.sendToSubscribers(accountId, {
      event: 'qr_expired',
      data: { accountId },
    });
  }

  emitQrDeclined(accountId: string): void {
    this.sendToSubscribers(accountId, {
      event: 'qr_declined',
      data: { accountId },
    });
  }

  emitLoginResult(accountId: string, success: boolean, error?: string): void {
    this.sendToSubscribers(accountId, {
      event: 'login_result',
      data: { accountId, success, error },
    });
    this.waitingClients.delete(accountId);
    this.accountOwners.delete(accountId);
  }

  clearSubscribers(accountId: string): void {
    this.waitingClients.delete(accountId);
  }

  private addSubscription(client: AuthenticatedWebSocket, accountId: string): void {
    const owner = this.accountOwners.get(accountId);
    if (!owner || owner !== client.customerId) {
      this.logger.warn(`Rejected subscription: client=${client.customerId} account=${accountId}`);
      return;
    }

    if (!this.waitingClients.has(accountId)) {
      this.waitingClients.set(accountId, new Set());
    }
    this.waitingClients.get(accountId)!.add(client);
    this.logger.log(`Client subscribed to QR events for account ${accountId}`);
  }

  private sendToSubscribers(
    accountId: string,
    payload: Record<string, unknown>,
  ): void {
    const clients = this.waitingClients.get(accountId);
    if (!clients) return;

    const message = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}
