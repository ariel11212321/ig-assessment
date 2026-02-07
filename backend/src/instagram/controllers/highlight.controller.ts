import { Controller, Get, Param } from '@nestjs/common';
import { InstagramService } from '../services/instagram.service';
import { HighlightParamsDto } from '../dto/highlight.dto';

@Controller('instagram/highlight')
export class HighlightController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get(':highlightId')
  async getHighlightDetail(@Param() params: HighlightParamsDto) {
    const highlight = await this.instagramService.getHighlightDetail(params.highlightId);
    return { success: true, highlight };
  }
}
