import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

const APPROVER_TYPES = ['role', 'user', 'supervisor', 'department_head', 'hr', 'finance', 'client'];

export class WorkflowStepDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @ApiProperty({ example: 'Persetujuan Atasan Langsung' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: APPROVER_TYPES, description: 'How the approver is resolved' })
  @IsIn(APPROVER_TYPES)
  approverType!: string;

  @ApiPropertyOptional({ description: 'Role key when approverType=role/hr/finance', example: 'hr_manager' })
  @IsOptional()
  @IsString()
  approverRoleKey?: string;

  @ApiPropertyOptional({ description: 'Explicit user when approverType=user' })
  @IsOptional()
  @IsUUID()
  approverUserId?: string;

  @ApiPropertyOptional({ description: 'Step only applies when request amount >= minAmount (conditional/amount-based)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class CreateWorkflowDto {
  @ApiProperty({ example: 'leave', description: 'Module this workflow governs' })
  @IsString()
  module!: string;

  @ApiProperty({ example: 'Approval Cuti Berjenjang' })
  @IsString()
  name!: string;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps!: WorkflowStepDto[];
}

export class StartInstanceDto {
  @ApiProperty()
  @IsUUID()
  workflowId!: string;

  @ApiProperty({ example: 'leave' })
  @IsString()
  module!: string;

  @ApiProperty({ description: 'Id of the record being approved' })
  @IsUUID()
  entityId!: string;

  @ApiPropertyOptional({ description: 'Subject employee — resolves supervisor/department head steps' })
  @IsOptional()
  @IsUUID()
  subjectEmployeeId?: string;

  @ApiPropertyOptional({ description: 'Amount that drives amount-based step conditions', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;
}

export class ActDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
