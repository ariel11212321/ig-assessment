import { Controller, Get, Query } from '@nestjs/common';
import { InstagramService } from '../services/instagram.service';
import { SearchQueryDto } from '../dto/search.dto';

@Controller('instagram/search')
export class SearchController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get()
  async search(@Query() query: SearchQueryDto) {
    const results = await this.instagramService.searchUsers(query.q);
    return { success: true, results };
  }

  @Get('reels')
  async searchReels(@Query() query: SearchQueryDto) {
    const items = await this.instagramService.searchReels(query.q);
    return { success: true, items };
  }
}
