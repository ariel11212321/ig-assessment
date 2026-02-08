import { Controller, Get, Param, Query } from '@nestjs/common';
import { IsString, MinLength, IsOptional } from 'class-validator';
import { InstagramService } from '../services/instagram.service';
import { FeedQueryDto } from '../dto/feed.dto';

class MediaIdParamsDto {
  @IsString()
  @MinLength(1)
  id!: string;
}

class HighlightIdParamsDto {
  @IsString()
  @MinLength(1)
  highlightId!: string;
}

class CommentIdParamsDto {
  @IsString()
  @MinLength(1)
  commentId!: string;
}

class UsernameParamsDto {
  @IsString()
  @MinLength(1)
  username!: string;
}

@Controller('instagram')
export class ContentController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get('media/:id')
  async getMediaDetail(@Param() params: MediaIdParamsDto) {
    const media = await this.instagramService.getMediaDetail(params.id);
    return { success: true, media };
  }

  @Get('media/:id/comments')
  async getMediaComments(@Param() params: MediaIdParamsDto, @Query() query: FeedQueryDto) {
    const result = await this.instagramService.getMediaComments(params.id, query.cursor);
    return { success: true, ...result };
  }

  @Get('comments/:commentId/replies')
  async getCommentReplies(@Param() params: CommentIdParamsDto, @Query() query: FeedQueryDto) {
    const result = await this.instagramService.getCommentReplies(params.commentId, query.cursor);
    return { success: true, ...result };
  }

  @Get('highlights/:highlightId')
  async getHighlightDetail(@Param() params: HighlightIdParamsDto) {
    const highlight = await this.instagramService.getHighlightDetail(params.highlightId);
    return { success: true, highlight };
  }

  @Get(':username/igtv')
  async getUserIgtv(@Param() params: UsernameParamsDto, @Query() query: FeedQueryDto) {
    const result = await this.instagramService.getUserIgtv(params.username, query.cursor);
    return { success: true, ...result };
  }
}