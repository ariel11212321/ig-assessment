import { IsString, MinLength } from 'class-validator';

export class ProfileParamsDto {
  @IsString()
  @MinLength(1)
  username!: string;
}
