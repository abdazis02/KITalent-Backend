import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { RECRUITMENT_STAGES } from '@kitalent/types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateCandidateDto {
  @ApiProperty({ example: 'Andi Wijaya' })
  @IsString()
  fullName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Vacancy applied for' })
  @IsOptional()
  @IsUUID()
  vacancyId?: string;

  @ApiPropertyOptional({ example: 'jobstreet' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'MinIO object key of the CV' })
  @IsOptional()
  @IsString()
  cvKey?: string;
}

export class MoveStageDto {
  @ApiProperty({ enum: RECRUITMENT_STAGES as unknown as string[] })
  @IsIn(RECRUITMENT_STAGES as unknown as string[])
  stage!: string;
}

export class RejectCandidateDto {
  @ApiProperty()
  @IsString()
  reason!: string;
}

export class ConvertCandidateDto {
  @ApiProperty({ description: 'Employee number to assign', example: 'EMP-0100' })
  @IsString()
  employeeNo!: string;
}

export class QueryCandidateDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RECRUITMENT_STAGES as unknown as string[] })
  @IsOptional()
  @IsIn(RECRUITMENT_STAGES as unknown as string[])
  stage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vacancyId?: string;
}
