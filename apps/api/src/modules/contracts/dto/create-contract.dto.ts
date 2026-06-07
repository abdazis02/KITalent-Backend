import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CONTRACT_TYPES } from '@kitalent/types';

export class CreateContractDto {
  @ApiProperty({ example: 'PKWT-2026-001' })
  @IsString()
  number!: string;

  @ApiProperty({ example: 'Kontrak Kerja PKWT — Budi Santoso' })
  @IsString()
  title!: string;

  @ApiProperty({ enum: CONTRACT_TYPES as unknown as string[] })
  @IsEnum(CONTRACT_TYPES as unknown as object)
  type!: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-05-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Employee contract' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Client agreement' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Contract value in whole IDR' })
  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ description: 'MinIO object key of the document' })
  @IsOptional()
  @IsString()
  fileKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
