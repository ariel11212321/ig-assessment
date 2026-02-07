import { Controller, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { IsString, IsNotEmpty } from 'class-validator';

class MediaProxyQueryDto {
  @IsString()
  @IsNotEmpty()
  url!: string;
}

@Controller('instagram/media')
export class MediaProxyController {
  constructor(private readonly httpService: HttpService) {}

  @Get('proxy')
  async proxyMedia(@Query() query: MediaProxyQueryDto, @Res() res: Response) {
    const decodedUrl = decodeURIComponent(query.url);

    const allowedDomains = [
      'cdninstagram.com',
      'fbcdn.net',
      'instagram.com',
      'scontent.cdninstagram.com',
    ];

    let urlHost: string;
    try {
      urlHost = new URL(decodedUrl).hostname;
    } catch {
      throw new HttpException('Invalid URL', HttpStatus.BAD_REQUEST);
    }

    const isAllowed = allowedDomains.some((domain) => urlHost.endsWith(domain));
    if (!isAllowed) {
      throw new HttpException('Domain not allowed', HttpStatus.FORBIDDEN);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(decodedUrl, {
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }),
      );

      const contentType = response.headers['content-type'] as string;
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');

      response.data.pipe(res);
    } catch {
      throw new HttpException('Failed to fetch media', HttpStatus.BAD_GATEWAY);
    }
  }
}
