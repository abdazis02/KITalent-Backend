import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @RequirePermissions('employee.read.tenant')
  @ApiOperation({ summary: 'List employees (sensitive fields masked without employee.read.sensitive)' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryEmployeeDto) {
    return this.service.list(user, query);
  }

  @Get('me')
  @RequirePermissions('employee.read.own')
  @ApiOperation({ summary: 'My linked employee profile (mobile self-service)' })
  myProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.service.myProfile(user);
  }

  @Get(':id')
  @RequirePermissions('employee.read.tenant')
  @ApiOperation({ summary: 'Get an employee by id (sensitive fields masked without employee.read.sensitive)' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user, id);
  }

  @Get(':id/team')
  @RequirePermissions('employee.read.tenant')
  @ApiOperation({ summary: 'Direct subordinates of an employee (org hierarchy)' })
  team(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.team(user, id);
  }

  @Post()
  @RequirePermissions('employee.create.tenant')
  @ApiOperation({ summary: 'Create an employee' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEmployeeDto) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('employee.update.tenant')
  @ApiOperation({ summary: 'Update an employee' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('employee.delete.tenant')
  @ApiOperation({ summary: 'Soft-delete an employee' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user, id);
  }
}
