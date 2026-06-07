import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@ApiTags('Shifts')
@ApiBearerAuth()
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly service: ShiftsService) {}

  @Get()
  @RequirePermissions('shift.read.tenant')
  @ApiOperation({ summary: 'List shifts' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: PaginationQueryDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('shift.read.tenant')
  @ApiOperation({ summary: 'Get a shift' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('shift.create.tenant')
  @ApiOperation({ summary: 'Create a shift' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateShiftDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('shift.update.tenant')
  @ApiOperation({ summary: 'Update a shift' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateShiftDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('shift.delete.tenant')
  @ApiOperation({ summary: 'Soft-delete a shift' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
