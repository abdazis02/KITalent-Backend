import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/** Generate a client invoice from an approved/locked payroll run + management fee. */
export class GenerateFromPayrollDto {
  @ApiProperty()
  @IsUUID()
  clientId!: string;

  @ApiProperty()
  @IsUUID()
  payrollRunId!: string;

  @ApiProperty({ description: 'Management fee percent applied to payroll gross', example: 10 })
  @IsInt()
  @Min(0)
  @Max(100)
  managementFeePercent!: number;

  @ApiPropertyOptional({ description: 'VAT percent (e.g. 11 for PPN 11%)', default: 11 })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxPercent?: number;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  dueDate!: string;
}
