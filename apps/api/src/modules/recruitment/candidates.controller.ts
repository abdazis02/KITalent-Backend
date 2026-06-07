import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CandidatesService } from './candidates.service';
import { ConvertCandidateDto, CreateCandidateDto, MoveStageDto, QueryCandidateDto, RejectCandidateDto } from './dto/candidate.dto';

@ApiTags('Recruitment')
@ApiBearerAuth()
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly service: CandidatesService) {}

  @Get()
  @RequirePermissions('candidate.read.tenant')
  @ApiOperation({ summary: 'List candidates (filter by stage/vacancy)' })
  list(@CurrentTenant() tenantId: string | null, @Query() query: QueryCandidateDto) {
    return this.service.list(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('candidate.read.tenant')
  @ApiOperation({ summary: 'Get a candidate' })
  findOne(@CurrentTenant() tenantId: string | null, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('candidate.create.tenant')
  @ApiOperation({ summary: 'Register a candidate (apply)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCandidateDto) {
    return this.service.create(user, dto);
  }

  @Post(':id/move')
  @RequirePermissions('candidate.update.tenant')
  @ApiOperation({ summary: 'Move a candidate to a pipeline stage' })
  move(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveStageDto) {
    return this.service.move(user, id, dto);
  }

  @Post(':id/reject')
  @RequirePermissions('candidate.update.tenant')
  @ApiOperation({ summary: 'Reject a candidate' })
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectCandidateDto) {
    return this.service.reject(user, id, dto);
  }

  @Post(':id/blacklist')
  @RequirePermissions('candidate.update.tenant')
  @ApiOperation({ summary: 'Blacklist a candidate' })
  blacklist(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.blacklist(user, id);
  }

  @Post(':id/convert')
  @RequirePermissions('recruitment.process.tenant')
  @ApiOperation({ summary: 'Convert an accepted candidate into an employee' })
  convert(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ConvertCandidateDto) {
    return this.service.convert(user, id, dto);
  }
}
