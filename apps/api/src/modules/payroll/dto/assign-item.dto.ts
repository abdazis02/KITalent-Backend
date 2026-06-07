import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

/** Assign a recurring payroll component + monthly amount to an employee. */
export class AssignItemDto {
  @ApiProperty()
  @IsUUID()
  componentId!: string;

  @ApiProperty({ description: 'Monthly amount in whole IDR', example: 500000 })
  @IsInt()
  @Min(0)
  amount!: number;
}

export class SetBasicSalaryDto {
  @ApiProperty({ description: 'Base monthly salary in whole IDR', example: 5000000 })
  @IsInt()
  @Min(0)
  basicSalary!: number;
}
