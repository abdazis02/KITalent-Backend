import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, Matches } from 'class-validator';

export class CreateRunDto {
  @ApiProperty({ example: '2026-06', description: 'Period label YYYY-MM (unique per tenant)' })
  @Matches(/^\d{4}-\d{2}$/, { message: 'periodLabel must be in YYYY-MM format' })
  periodLabel!: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  periodEnd!: string;
}
