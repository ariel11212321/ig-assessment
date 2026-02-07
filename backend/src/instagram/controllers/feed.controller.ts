import { Controller, Get, Param, Query } from '@nestjs/common';
import { InstagramService } from '../services/instagram.service';
import { ProfileParamsDto } from '../dto/profile.dto';
import { FeedQueryDto } from '../dto/feed.dto';

@Controller('instagram/feed')
export class FeedController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get(':username/posts')
  async getPosts(@Param() params: ProfileParamsDto, @Query() query: FeedQueryDto) {
    const feed = await this.instagramService.getUserFeed(params.username, query.cursor);
    return { success: true, ...feed };
  }

  @Get(':username/reels')
  async getReels(@Param() params: ProfileParamsDto, @Query() query: FeedQueryDto) {
    const feed = await this.instagramService.getUserReels(params.username, query.cursor);
    return { success: true, ...feed };
  }

  @Get(':username/tagged')
  async getTagged(@Param() params: ProfileParamsDto, @Query() query: FeedQueryDto) {
    const feed = await this.instagramService.getUserTagged(params.username, query.cursor);
    return { success: true, ...feed };
  }

  @Get(':username/stories')
  async getStories(@Param() params: ProfileParamsDto) {
    const stories = await this.instagramService.getUserStories(params.username);
    return { success: true, stories };
  }

  @Get(':username/highlights')
  async getHighlights(@Param() params: ProfileParamsDto) {
    const highlights = await this.instagramService.getUserHighlights(params.username);
    return { success: true, highlights };
  }
}
