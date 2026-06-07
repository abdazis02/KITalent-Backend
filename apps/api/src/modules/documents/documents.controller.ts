import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UploadedFile as UploadedFileParam, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DocumentsService, type UploadedFile } from './documents.service';
import { QueryDocumentDto, UploadDocumentDto } from './dto/upload-document.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  @RequirePermissions('document.read.tenant')
  @ApiOperation({ summary: 'List documents (filter by owner/type)' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryDocumentDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions('document.create.tenant')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string' },
        ownerType: { type: 'string' },
        ownerId: { type: 'string' },
        expiryDate: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a document to MinIO' })
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFileParam() file: UploadedFile,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.service.upload(user, file, dto);
  }

  @Get(':id/download')
  @RequirePermissions('document.read.tenant')
  @ApiOperation({ summary: 'Get a short-lived presigned download URL' })
  download(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.downloadUrl(user, id);
  }

  @Delete(':id')
  @RequirePermissions('document.delete.tenant')
  @ApiOperation({ summary: 'Soft-delete a document and remove the object' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
