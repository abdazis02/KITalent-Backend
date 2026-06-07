import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ManpowerService } from './manpower.service';
import { ConvertToVacancyDto, CreateManpowerRequestDto, QueryManpowerDto } from './dto/manpower.dto';

@ApiTags('Manpower Request')
@ApiBearerAuth()
@Controller('manpower-requests')
export class ManpowerController {
  constructor(private readonly service: ManpowerService) {}

  @Get()
  @RequirePermissions('manpowerRequest.read.tenant')
  @ApiOperation({ summary: 'List manpower requests' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryManpowerDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('manpowerRequest.read.tenant')
  @ApiOperation({ summary: 'Get a manpower request' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('manpowerRequest.create.tenant')
  @ApiOperation({ summary: 'Create a manpower request' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateManpowerRequestDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/submit')
  @RequirePermissions('manpowerRequest.update.tenant')
  @ApiOperation({ summary: 'Submit a manpower request' })
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.submit(user, id);
  }

  @Post(':id/client-approve')
  @RequirePermissions('manpowerRequest.approve.tenant')
  @ApiOperation({ summary: 'Client approves the request' })
  clientApprove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.clientApprove(user, id);
  }

  @Post(':id/operator-review')
  @RequirePermissions('manpowerRequest.approve.tenant')
  @ApiOperation({ summary: 'Operator reviews the request' })
  operatorReview(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.operatorReview(user, id);
  }

  @Post(':id/convert-to-vacancy')
  @RequirePermissions('manpowerRequest.update.tenant')
  @ApiOperation({ summary: 'Convert the request into a recruitment vacancy' })
  convert(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ConvertToVacancyDto) {
    return this.service.convertToVacancy(user, id, dto);
  }

  @Post(':id/fulfill')
  @RequirePermissions('manpowerRequest.update.tenant')
  @ApiOperation({ summary: 'Mark the request fulfilled' })
  fulfill(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.fulfill(user, id);
  }

  @Post(':id/close')
  @RequirePermissions('manpowerRequest.update.tenant')
  @ApiOperation({ summary: 'Close the request' })
  close(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.close(user, id);
  }
}
