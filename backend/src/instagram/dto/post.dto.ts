import { IsString, MinLength } from 'class-validator';

export class PostParamsDto {
  @IsString()
  @MinLength(1)
  postId!: string;
}
