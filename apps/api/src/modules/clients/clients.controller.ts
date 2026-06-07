import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  @RequirePermissions('client.read.tenant')
  @ApiOperation({ summary: 'List clients (paginated, searchable)' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: PaginationQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('client.read.tenant')
  @ApiOperation({ summary: 'Get a client by id' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('client.create.tenant')
  @ApiOperation({ summary: 'Create a client' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClientDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('client.update.tenant')
  @ApiOperation({ summary: 'Update a client' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('client.delete.tenant')
  @ApiOperation({ summary: 'Soft-delete a client' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
