import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { INVOICE_ITEM_TYPES } from '@kitalent/types';

export class InvoiceItemDto {
  @ApiProperty({ enum: INVOICE_ITEM_TYPES as unknown as string[], default: 'service' })
  @IsOptional()
  @IsEnum(INVOICE_ITEM_TYPES as unknown as object)
  type?: string;

  @ApiProperty({ example: 'Jasa Security 10 personel' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({ description: 'Unit price in whole IDR', example: 4500000 })
  @IsInt()
  @Min(0)
  unitPrice!: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  clientId!: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  issueDate!: string;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ example: '2026-06' })
  @IsOptional()
  @IsString()
  periodLabel?: string;

  @ApiPropertyOptional({ description: 'VAT percent (e.g. 11 for PPN 11%)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxPercent?: number;

  @ApiPropertyOptional({ description: 'Flat discount in whole IDR', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];
}
