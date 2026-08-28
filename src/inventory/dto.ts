import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AdjustStockDto {
  @ApiProperty({ description: 'Positive = restock, negative = shrinkage' })
  @Type(() => Number)
  @IsInt()
  delta: number;
}
