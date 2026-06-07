import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PAYROLL_COMPONENT_TYPES } from '@kitalent/types';

export class CreateComponentDto {
  @ApiProperty({ example: 'TRANSPORT' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Tunjangan Transport' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: PAYROLL_COMPONENT_TYPES as unknown as string[] })
  @IsEnum(PAYROLL_COMPONENT_TYPES as unknown as object)
  type!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
