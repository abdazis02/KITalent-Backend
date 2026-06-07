import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TrainingsService } from './trainings.service';
import { CompleteEnrollmentDto, CreateTrainingDto, EnrollDto, QueryTrainingDto } from './dto/training.dto';

@ApiTags('Training')
@ApiBearerAuth()
@Controller('trainings')
export class TrainingsController {
  constructor(private readonly service: TrainingsService) {}

  @Get()
  @RequirePermissions('training.read.tenant')
  @ApiOperation({ summary: 'List trainings' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryTrainingDto) {
    return this.service.list(tenantId, query);
  }

  @Get('certifications/expiring')
  @RequirePermissions('training.read.tenant')
  @ApiQuery({ name: 'before', required: true, example: '2026-12-31' })
  @ApiOperation({ summary: 'List certifications expiring on/before a date' })
  expiring(@CurrentTenant() tenantId: string | null, @Query('before') before: string) {
    return this.service.expiringCertifications(tenantId, before);
  }

  @Post()
  @RequirePermissions('training.create.tenant')
  @ApiOperation({ summary: 'Create a training' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTrainingDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/enroll')
  @RequirePermissions('training.update.tenant')
  @ApiOperation({ summary: 'Enroll an employee in a training' })
  enroll(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: EnrollDto) {
    return this.service.enroll(user, id, dto);
  }

  @Get(':id/enrollments')
  @RequirePermissions('training.read.tenant')
  @ApiOperation({ summary: 'List enrollments of a training' })
  enrollments(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.listEnrollments(tenantId, id);
  }

  @Post('enrollments/:enrollmentId/complete')
  @RequirePermissions('training.update.tenant')
  @ApiOperation({ summary: 'Record an enrollment result + certificate' })
  complete(@CurrentUser() user: AuthenticatedUser, @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string, @Body() dto: CompleteEnrollmentDto) {
    return this.service.completeEnrollment(user, enrollmentId, dto);
  }
}
