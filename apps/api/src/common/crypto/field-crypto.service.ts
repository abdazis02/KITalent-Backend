import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/** Ciphertext envelope marker — lets us tell encrypted values from legacy plaintext. */
const PREFIX = 'enc:v1:';

/**
 * AES-256-GCM field-level encryption for sensitive columns (PRD §22).
 *
 * Backwards/forwards compatible by design:
 * - If no key is configured, encrypt()/decrypt() are no-ops (plaintext passthrough),
 *   so the app still runs in dev without a key.
 * - decrypt() returns any value lacking the `enc:v1:` prefix unchanged, so rows
 *   written before encryption was enabled keep working.
 * - encrypt() is idempotent: an already-encrypted value is returned as-is.
 */
@Injectable()
export class FieldCryptoService {
  private readonly logger = new Logger(FieldCryptoService.name);
  private readonly key: Buffer | null;

  constructor(config: ConfigService) {
    const secret = config.get<string>('encryptionKey');
    // Derive a fixed 32-byte key from the secret of any length.
    this.key = secret ? createHash('sha256').update(secret).digest() : null;
    if (!this.key) this.logger.warn('FIELD_ENCRYPTION_KEY not set — sensitive fields stored as plaintext');
  }

  get enabled(): boolean {
    return this.key !== null;
  }

  encrypt(plain: string | null | undefined): string | null | undefined {
    if (plain == null || plain === '' || !this.key) return plain;
    if (plain.startsWith(PREFIX)) return plain; // already encrypted
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return PREFIX + [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
  }

  decrypt(value: string | null | undefined): string | null | undefined {
    if (value == null || !this.key || !value.startsWith(PREFIX)) return value;
    try {
      const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(':');
      const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivB64, 'base64'));
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
    } catch {
      // Tampered, wrong key, or malformed — return as stored rather than crash.
      this.logger.warn('Failed to decrypt a sensitive field; returning stored value');
      return value;
    }
  }
}
