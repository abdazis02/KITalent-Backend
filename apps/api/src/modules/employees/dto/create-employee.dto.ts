import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { EMPLOYEE_STATUSES } from '@kitalent/types';

const EMPLOYMENT_TYPES = ['permanent', 'contract', 'outsourcing', 'daily', 'internship'];

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-0001' })
  @IsString()
  employeeNo!: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  fullName!: string;

  @ApiPropertyOptional({ enum: EMPLOYEE_STATUSES as unknown as string[] })
  @IsOptional()
  @IsEnum(EMPLOYEE_STATUSES as unknown as object)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Link to a login account (PRD §10.30 self-service)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  positionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  jobLevelId?: string;

  @ApiPropertyOptional({ description: 'Direct supervisor / atasan langsung (PRD §10.4)' })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Sensitive — restricted by permission' })
  @IsOptional()
  @IsString()
  nik?: string;

  @ApiPropertyOptional({ description: 'Sensitive — restricted by permission' })
  @IsOptional()
  @IsString()
  npwp?: string;

  @ApiPropertyOptional({ description: 'Sensitive — restricted by permission' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  // ---- Personal data (PRD §17.5) ----
  @ApiPropertyOptional() @IsOptional() @IsString() preferredName?: string;
  @ApiPropertyOptional({ example: 'male' }) @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() birthPlace?: string;
  @ApiPropertyOptional({ example: '1990-01-01' }) @IsOptional() @IsDateString() birthDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() maritalStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() religion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nationality?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional({ enum: EMPLOYMENT_TYPES }) @IsOptional() @IsIn(EMPLOYMENT_TYPES) employmentType?: string;
  @ApiPropertyOptional({ example: '2026-01-15' }) @IsOptional() @IsDateString() joinDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() resignDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() payrollGroupId?: string;
}
