import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { VacanciesService } from './vacancies.service';
import { CreateVacancyDto, QueryVacancyDto } from './dto/vacancy.dto';

@ApiTags('Recruitment')
@ApiBearerAuth()
@Controller('vacancies')
export class VacanciesController {
  constructor(private readonly service: VacanciesService) {}

  @Get()
  @RequirePermissions('recruitment.read.tenant')
  @ApiOperation({ summary: 'List job vacancies' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryVacancyDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('recruitment.read.tenant')
  @ApiOperation({ summary: 'Get a vacancy (with candidate count)' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('recruitment.create.tenant')
  @ApiOperation({ summary: 'Create a job vacancy' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVacancyDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/open')
  @RequirePermissions('recruitment.update.tenant')
  @ApiOperation({ summary: 'Open a vacancy for applications' })
  open(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.setStatus(user, id, 'open', 'vacancy.open');
  }

  @Post(':id/close')
  @RequirePermissions('recruitment.update.tenant')
  @ApiOperation({ summary: 'Close a vacancy' })
  close(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.setStatus(user, id, 'closed', 'vacancy.close');
  }
}
