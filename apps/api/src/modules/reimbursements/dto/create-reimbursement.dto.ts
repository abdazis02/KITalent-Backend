import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateReimbursementDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: 'transport' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 'Taksi ke lokasi client' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Amount in whole IDR', example: 250000 })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ description: 'MinIO object key of the receipt' })
  @IsOptional()
  @IsString()
  receiptKey?: string;
}
