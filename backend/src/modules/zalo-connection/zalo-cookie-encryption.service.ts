import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { AppConfigService } from '../../config/app-config.service';

export interface ZaloCookieData {
  imei: string;
  cookie: object;
  userAgent: string;
}

@Injectable()
export class ZaloCookieEncryptionService {
  private readonly key: Buffer;

  constructor(private readonly appConfig: AppConfigService) {
    this.key = Buffer.from(appConfig.zaloCookieEncryptionKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error(
        'ZALO_COOKIE_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)',
      );
    }
  }

  encrypt(data: ZaloCookieData): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);

    const json = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(json, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(encrypted: string): ZaloCookieData {
    const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':');
    if (!ivHex || !authTagHex || !ciphertextHex) {
      throw new Error('Invalid encrypted cookie format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }
}
