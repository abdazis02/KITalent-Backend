import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: 'Kasbon renovasi rumah' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Principal in whole IDR', example: 6000000 })
  @IsInt()
  @Min(1)
  principal!: number;

  @ApiProperty({ description: 'Number of monthly installments', example: 6 })
  @IsInt()
  @Min(1)
  installmentCount!: number;
}
