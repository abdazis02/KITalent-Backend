import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { randomUUID } from 'node:crypto';

/**
 * Object storage gateway (PRD §0.9: all uploads go through this service to
 * MinIO, never the backend filesystem). Other modules store only the returned
 * objectKey; bytes live in MinIO and are served via short-lived presigned URLs.
 */
@Injectable()
export class FileService implements OnModuleInit {
  private readonly logger = new Logger(FileService.name);
  private readonly client: MinioClient;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('minio.bucket')!;
    this.client = new MinioClient({
      endPoint: config.get<string>('minio.endPoint')!,
      port: config.get<number>('minio.port'),
      useSSL: config.get<boolean>('minio.useSSL')!,
      accessKey: config.get<string>('minio.accessKey')!,
      secretKey: config.get<string>('minio.secretKey')!,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created MinIO bucket "${this.bucket}"`);
      }
    } catch (err) {
      this.logger.error('MinIO connection/bucket check failed', err as Error);
    }
  }

  /** Deterministic, collision-resistant key namespaced by tenant + owner. */
  buildKey(tenantId: string, ownerType: string, fileName: string): string {
    const safe = fileName.replace(/[^\w.\-]/g, '_');
    return `${tenantId}/${ownerType}/${randomUUID()}-${safe}`;
  }

  async put(key: string, buffer: Buffer, mimeType?: string): Promise<void> {
    await this.client.putObject(this.bucket, key, buffer, buffer.length, mimeType ? { 'Content-Type': mimeType } : undefined);
  }

  /** Time-limited download URL (PRD §10.26 "secure URL"). */
  presignedGetUrl(key: string, expirySeconds = 300): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }

  async remove(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
