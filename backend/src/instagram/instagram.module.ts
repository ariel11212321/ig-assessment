import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ImaiApiService } from './services/imai-api.service';
import { InstagramService } from './services/instagram.service';
import { SearchController } from './controllers/search.controller';
import { ProfileController } from './controllers/profile.controller';
import { HashtagController } from './controllers/hashtag.controller';
import { MediaProxyController } from './controllers/media-proxy.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [
    SearchController,
    ProfileController,
    HashtagController,
    MediaProxyController,
  ],
  providers: [ImaiApiService, InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
