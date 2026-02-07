import { Controller, Get, Param, Query } from '@nestjs/common';
import { InstagramService } from '../services/instagram.service';
import { FeedQueryDto } from '../dto/feed.dto';

@Controller('instagram/hashtag')
export class HashtagController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get(':tag')
  async getHashtagFeed(@Param('tag') tag: string, @Query() query: FeedQueryDto) {
    const feed = await this.instagramService.getHashtagFeed(tag, query.cursor);
    return { success: true, ...feed };
  }
}
