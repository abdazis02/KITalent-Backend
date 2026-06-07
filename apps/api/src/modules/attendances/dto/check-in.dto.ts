import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CheckInDto {
  @ApiProperty({ description: 'Employee performing the check-in' })
  @IsUUID()
  employeeId!: string;

  @ApiPropertyOptional({ description: 'GPS latitude (PRD §10.13)' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'GPS longitude' })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'MinIO object key of the selfie' })
  @IsOptional()
  @IsString()
  selfieKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Work location to validate geofence against (PRD §10.13)' })
  @IsOptional()
  @IsUUID()
  workLocationId?: string;
}
