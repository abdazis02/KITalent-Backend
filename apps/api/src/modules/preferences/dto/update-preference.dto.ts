import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { LOCALES, THEME_PREFERENCES } from '@kitalent/types';

/** PRD §14 / §10.34 — sync theme + locale preference to the backend. */
export class UpdatePreferenceDto {
  @ApiPropertyOptional({ enum: LOCALES as unknown as string[] })
  @IsOptional()
  @IsIn(LOCALES as unknown as string[])
  locale?: string;

  @ApiPropertyOptional({ enum: THEME_PREFERENCES as unknown as string[] })
  @IsOptional()
  @IsIn(THEME_PREFERENCES as unknown as string[])
  theme?: string;

  @ApiPropertyOptional({ example: 'Asia/Jakarta' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
