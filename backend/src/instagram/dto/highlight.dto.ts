import { IsString, MinLength } from 'class-validator';

export class HighlightParamsDto {
  @IsString()
  @MinLength(1)
  highlightId!: string;
}
