import { Controller, Get, Param } from '@nestjs/common';
import { InstagramService } from '../services/instagram.service';
import { ProfileParamsDto } from '../dto/profile.dto';

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
}
