import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'OPS' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Operasional' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Parent department (sub-department)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  headEmployeeId?: string;
}

export class CreateJobLevelDto {
  @ApiProperty({ example: 'L3' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Staff' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  rank?: number;
}

export class CreatePositionDto {
  @ApiProperty({ example: 'SEC-OFF' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Security Officer' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  jobLevelId?: string;
}
