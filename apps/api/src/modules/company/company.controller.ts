import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CompanyService } from './company.service';
import { CreateBranchDto, CreateCompanyDto, CreateWorkLocationDto } from './dto/company.dto';

@ApiTags('Company')
@ApiBearerAuth()
@Controller()
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  @Get('companies')
  @RequirePermissions('company.read.tenant')
  @ApiOperation({ summary: 'List companies' })
  listCompanies(@CurrentTenant() tenantId: string | null) {
    return this.service.listCompanies(tenantId);
  }

  @Post('companies')
  @RequirePermissions('company.create.tenant')
  @ApiOperation({ summary: 'Create a company' })
  createCompany(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCompanyDto) {
    return this.service.createCompany(user, dto);
  }

  @Get('branches')
  @RequirePermissions('company.read.tenant')
  @ApiOperation({ summary: 'List branches' })
  listBranches(@CurrentTenant() tenantId: string | null) {
    return this.service.listBranches(tenantId);
  }

  @Post('branches')
  @RequirePermissions('company.create.tenant')
  @ApiOperation({ summary: 'Create a branch' })
  createBranch(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBranchDto) {
    return this.service.createBranch(user, dto);
  }

  @Get('work-locations')
  @RequirePermissions('company.read.tenant')
  @ApiOperation({ summary: 'List work locations (geofence)' })
  listLocations(@CurrentTenant() tenantId: string | null) {
    return this.service.listLocations(tenantId);
  }

  @Post('work-locations')
  @RequirePermissions('company.create.tenant')
  @ApiOperation({ summary: 'Create a work location with geofence' })
  createLocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWorkLocationDto) {
    return this.service.createLocation(user, dto);
  }
}
