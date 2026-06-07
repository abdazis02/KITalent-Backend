import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PerformanceService } from './performance.service';
import { CreateReviewDto, QueryReviewDto } from './dto/create-review.dto';

@ApiTags('Performance')
@ApiBearerAuth()
@Controller('performance/reviews')
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  @Get()
  @RequirePermissions('performance.read.tenant')
  @ApiOperation({ summary: 'List performance reviews' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryReviewDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('performance.read.tenant')
  @ApiOperation({ summary: 'Get a performance review with KPI items' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('performance.create.tenant')
  @ApiOperation({ summary: 'Create a performance review (weighted KPI items)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReviewDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/submit')
  @RequirePermissions('performance.update.tenant')
  @ApiOperation({ summary: 'Submit a review for approval' })
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.submit(user, id);
  }

  @Post(':id/approve')
  @RequirePermissions('performance.approve.tenant')
  @ApiOperation({ summary: 'Approve a performance review' })
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(user, id);
  }

  @Post(':id/publish')
  @RequirePermissions('performance.update.tenant')
  @ApiOperation({ summary: 'Publish an approved review to the employee' })
  publish(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.publish(user, id);
  }
}
