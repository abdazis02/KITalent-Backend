import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'PT Kamunara Pusat' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'BR-JKT' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Cabang Jakarta' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateWorkLocationDto {
  @ApiProperty({ example: 'LOC-001' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Plaza Indonesia' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: -6.193 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 106.823 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ default: 100, description: 'Geofence radius in metres' })
  @IsOptional()
  @IsInt()
  @Min(10)
  geofenceRadius?: number;
}
