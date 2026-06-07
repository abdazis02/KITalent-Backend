import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildMeta, normalizePagination, type Paginated } from '@kitalent/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FileService } from '../files/file.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { QueryDocumentDto, UploadDocumentDto } from './dto/upload-document.dto';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly files: FileService,
  ) {}

  private requireTenant(tenantId: string | null): string {
    if (!tenantId) throw new ForbiddenException('A tenant context is required');
    return tenantId;
  }

  async upload(user: AuthenticatedUser, file: UploadedFile | undefined, dto: UploadDocumentDto) {
    const tid = this.requireTenant(user.tenantId);
    if (!file) throw new BadRequestException('A file is required');

    const ownerType = dto.ownerType ?? 'general';
    const objectKey = this.files.buildKey(tid, ownerType, file.originalname);
    await this.files.put(objectKey, file.buffer, file.mimetype);

    const document = await this.prisma.document.create({
      data: {
        tenantId: tid,
        ownerType,
        ownerId: dto.ownerId,
        type: dto.type,
        fileName: file.originalname,
        objectKey,
        mimeType: file.mimetype,
        size: file.size,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        createdBy: user.id,
      },
    });
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'document.upload', entityType: 'Document', entityId: document.id, metadata: { type: dto.type, ownerType } });
    return document;
  }

  async list(tenantId: string | null, query: QueryDocumentDto): Promise<Paginated<unknown>> {
    const tid = this.requireTenant(tenantId);
    const { page, pageSize } = normalizePagination(query);
    const where: Prisma.DocumentWhereInput = {
      tenantId: tid,
      deletedAt: null,
      ...(query.ownerType ? { ownerType: query.ownerType } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search ? { fileName: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.document.findMany({ where, orderBy: { createdAt: query.sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.document.count({ where }),
    ]);
    return { data, meta: buildMeta(page, pageSize, total) };
  }

  private async load(tenantId: string, id: string) {
    const document = await this.prisma.document.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  /** Returns a short-lived presigned download URL (PRD §10.26). */
  async downloadUrl(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const document = await this.load(tid, id);
    const url = await this.files.presignedGetUrl(document.objectKey, 300);
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'document.download', entityType: 'Document', entityId: id });
    return { url, fileName: document.fileName, expiresInSeconds: 300 };
  }

  async remove(user: AuthenticatedUser, id: string) {
    const tid = this.requireTenant(user.tenantId);
    const document = await this.load(tid, id);
    await this.prisma.document.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: user.id } });
    // Best-effort object removal; the metadata soft-delete is the source of truth.
    await this.files.remove(document.objectKey).catch(() => undefined);
    await this.audit.record({ tenantId: tid, actorId: user.id, action: 'document.delete', entityType: 'Document', entityId: id });
    return { id, deleted: true };
  }
}
