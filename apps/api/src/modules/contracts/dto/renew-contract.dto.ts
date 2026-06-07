import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

/** Renew an existing contract into a new draft period (PRD §18 contracts/:id/renew). */
export class RenewContractDto {
  @ApiProperty({ example: 'PKWT-2027-001', description: 'Number for the renewed contract' })
  @IsString()
  number!: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
