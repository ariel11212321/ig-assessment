import { Controller, Get, Param, Query } from '@nestjs/common';
import { InstagramService } from '../services/instagram.service';
import { ProfileParamsDto } from '../dto/profile.dto';
import { FeedQueryDto } from '../dto/feed.dto';

@Controller('instagram/profile')
export class ProfileController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get(':username')
  async getProfile(@Param() params: ProfileParamsDto) {
    const profile = await this.instagramService.getProfileInfo(params.username);
    return { success: true, profile };
  }

  @Get(':username/contacts')
  async getContacts(@Param() params: ProfileParamsDto) {
    const contacts = await this.instagramService.getContactInfo(params.username);
    return { success: true, contacts };
  }

  @Get(':username/feed')
  async getUserFeed(@Param() params: ProfileParamsDto, @Query() query: FeedQueryDto) {
    const feed = await this.instagramService.getUserFeed(params.username, query.cursor);
    return { success: true, ...feed };
  }

  @Get(':username/reels')
  async getUserReels(@Param() params: ProfileParamsDto, @Query() query: FeedQueryDto) {
    const feed = await this.instagramService.getUserReels(params.username, query.cursor);
    return { success: true, ...feed };
  }

  @Get(':username/reposts')
  async getUserReposts(@Param() params: ProfileParamsDto, @Query() query: FeedQueryDto) {
    const feed = await this.instagramService.getUserReposts(params.username, query.cursor);
    return { success: true, ...feed };
  }

  @Get(':username/tagged')
  async getUserTagged(@Param() params: ProfileParamsDto, @Query() query: FeedQueryDto) {
    const feed = await this.instagramService.getUserTagged(params.username, query.cursor);
    return { success: true, ...feed };
  }

  @Get(':username/stories')
  async getUserStories(@Param() params: ProfileParamsDto) {
    const items = await this.instagramService.getUserStories(params.username);
    return { success: true, items };
  }
  @Get(':username/highlights')
  async getUserHighlights(@Param() params: ProfileParamsDto) {
    const items = await this.instagramService.getUserHighlights(params.username);
    return { success: true, items };
  }
}
