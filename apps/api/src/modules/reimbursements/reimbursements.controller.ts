import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ReimbursementsService } from './reimbursements.service';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { QueryReimbursementDto, RejectReimbursementDto } from './dto/query-reimbursement.dto';

@ApiTags('Reimbursement')
@ApiBearerAuth()
@Controller('reimbursements')
export class ReimbursementsController {
  constructor(private readonly service: ReimbursementsService) {}

  @Get()
  @RequirePermissions('reimbursement.read.tenant')
  @ApiOperation({ summary: 'List reimbursements' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryReimbursementDto) {
    return this.service.list(tenantId, query);
  }

  @Post()
  @RequirePermissions('reimbursement.create.own')
  @ApiOperation({ summary: 'Submit a reimbursement' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReimbursementDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('reimbursement.approve.tenant')
  @ApiOperation({ summary: 'Approve a reimbursement' })
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(user, id);
  }

  @Post(':id/reject')
  @RequirePermissions('reimbursement.reject.tenant')
  @ApiOperation({ summary: 'Reject a reimbursement (reason required)' })
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectReimbursementDto) {
    return this.service.reject(user, id, dto);
  }

  @Post(':id/pay')
  @RequirePermissions('reimbursement.update.tenant')
  @ApiOperation({ summary: 'Mark an approved reimbursement as paid' })
  pay(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.pay(user, id);
  }
}
