import { Controller, Get, Param, Query } from '@nestjs/common';
import { InstagramService } from '../services/instagram.service';
import { PostParamsDto } from '../dto/post.dto';
import { FeedQueryDto } from '../dto/feed.dto';

@Controller('instagram/post')
export class PostController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get(':postId')
  async getPostDetail(@Param() params: PostParamsDto) {
    const post = await this.instagramService.getPostDetail(params.postId);
    return { success: true, post };
  }

  @Get(':postId/comments')
  async getPostComments(@Param() params: PostParamsDto, @Query() query: FeedQueryDto) {
    const comments = await this.instagramService.getPostComments(params.postId, query.cursor);
    return { success: true, ...comments };
  }

  @Get(':postId/comments/:commentId/replies')
  async getCommentReplies(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Query() query: FeedQueryDto,
  ) {
    const replies = await this.instagramService.getCommentReplies(postId, commentId, query.cursor);
    return { success: true, ...replies };
  }
}
