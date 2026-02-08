import { Injectable, Logger } from '@nestjs/common';
import { ImaiApiService } from './imai-api.service';
import {
  ImaiSearchResult,
  ImaiProfileInfo,
  ImaiMediaItem,
  PaginatedResponse,
  ContactInfo,
  CarouselItem,
  SocialLink,
} from '../interfaces/imai-api.interfaces';

interface RawSearchUser {
  pk?: string;
  username?: string;
  full_name?: string;
  profile_pic_url?: string;
  is_verified?: boolean;
  follower_count?: number;
}

interface RawUserInfo {
  pk?: string;
  username?: string;
  full_name?: string;
  biography?: string;
  profile_pic_url?: string;
  hd_profile_pic_url_info?: { url?: string };
  follower_count?: number;
  following_count?: number;
  media_count?: number;
  is_verified?: boolean;
  is_private?: boolean;
  external_url?: string;
  category?: string;
  bio_links?: Array<{ url?: string }>;
  public_email?: string;
  public_phone_number?: string;
  public_phone_country_code?: string;
  contact_phone_number?: string;
  city_name?: string;
}

interface RawMediaNode {
  pk?: string;
  id?: string;
  code?: string;
  shortcode?: string;
  media_type?: number;
  image_versions2?: { candidates?: Array<{ url?: string; width?: number; height?: number }> };
  video_versions?: Array<{ url?: string; width?: number; height?: number }>;
  carousel_media?: RawMediaNode[];
  caption?: { text?: string };
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  play_count?: number;
  taken_at?: number;
  user?: { username?: string; profile_pic_url?: string };
  thumbnail_url?: string;
  display_url?: string;
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(private readonly imaiApi: ImaiApiService) {}

  async searchUsers(query: string): Promise<ImaiSearchResult[]> {
    try {
      // Documented: GET /raw/ig/search/users/
      const response = await this.imaiApi.get<{
        success: boolean;
        users?: RawSearchUser[];
      }>('/raw/ig/search/users/', { keyword: query });

      if (response.users && response.users.length > 0) {
        return response.users.map((user) => this.mapSearchResult(user));
      }
    } catch (err) {
      this.logger.warn(`Raw search failed, falling back to newv1 search: ${err}`);
    }

    // Fallback: Documented: POST /search/newv1/
    try {
      const response = await this.imaiApi.post<{
        success: boolean;
        data?: {
          results?: Array<{
            user_id?: string;
            username?: string;
            fullname?: string;
            picture?: string;
            is_verified?: boolean;
            followers?: number;
          }>;
        };
      }>('/search/newv1/', {
        keyword: query,
      });

      const results = response.data?.results || [];
      return results.map((user): ImaiSearchResult => ({
        userId: user.user_id || '',
        username: user.username || '',
        fullName: user.fullname || '',
        profilePicUrl: user.picture || '',
        isVerified: user.is_verified || false,
        followerCount: user.followers || 0,
      }));
    } catch (err) {
      this.logger.error(`Search newv1 also failed: ${err}`);
      return [];
    }
  }

  async searchReels(query: string): Promise<ImaiMediaItem[]> {
    // Documented: GET /raw/ig/search/reels/
    const response = await this.imaiApi.get<{
      success: boolean;
      items?: RawMediaNode[];
    }>('/raw/ig/search/reels/', { q: query });

    return (response.items || []).map((item) => this.mapMediaItem(item));
  }

  async getProfileInfo(username: string): Promise<ImaiProfileInfo> {
    // Documented: GET /raw/ig/user/info/
    const response = await this.imaiApi.get<{
      success: boolean;
      user_info?: RawUserInfo;
    }>('/raw/ig/user/info/', { username });

    const user = response.user_info;
    if (!user) {
      throw new Error('User not found');
    }

    return this.mapProfileInfo(user);
  }

  async getContactInfo(username: string): Promise<ContactInfo> {
    // Documented: GET /exports/contacts/
    const response = await this.imaiApi.get<{
      success: boolean;
      contacts?: {
        emails?: string[];
        phones?: string[];
        social_links?: Array<{ platform?: string; url?: string; username?: string }>;
      };
    }>('/exports/contacts/', { username });

    const contacts = response.contacts;
    return {
      emails: contacts?.emails || [],
      phones: contacts?.phones || [],
      socialLinks: (contacts?.social_links || []).map((link): SocialLink => ({
        platform: link.platform || '',
        url: link.url || '',
        username: link.username || '',
      })),
    };
  }

  async getHashtagFeed(hashtag: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    // Documented: GET /raw/ig/hashtag/feed/
    const params: Record<string, string> = { tag: hashtag };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      success: boolean;
      items?: RawMediaNode[];
      next_cursor?: string;
      has_more?: boolean;
    }>('/raw/ig/hashtag/feed/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.next_cursor || null,
      hasMore: response.has_more || false,
    };
  }

  private mapSearchResult(user: RawSearchUser): ImaiSearchResult {
    return {
      userId: user.pk || '',
      username: user.username || '',
      fullName: user.full_name || '',
      profilePicUrl: user.profile_pic_url || '',
      isVerified: user.is_verified || false,
      followerCount: user.follower_count || 0,
    };
  }

  private mapProfileInfo(user: RawUserInfo): ImaiProfileInfo {
    return {
      userId: user.pk || '',
      username: user.username || '',
      fullName: user.full_name || '',
      biography: user.biography || '',
      profilePicUrl: user.profile_pic_url || '',
      profilePicUrlHd: user.hd_profile_pic_url_info?.url || user.profile_pic_url || '',
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      mediaCount: user.media_count || 0,
      isVerified: user.is_verified || false,
      isPrivate: user.is_private || false,
      externalUrl: user.external_url || (user.bio_links?.[0]?.url ?? null),
      category: user.category || null,
    };
  }

  private mapMediaItem(node: RawMediaNode): ImaiMediaItem {
    const mediaType = this.getMediaType(node);
    const bestImage = this.getBestImage(node);
    const videoUrl = this.getVideoUrl(node);

    return {
      id: node.pk || node.id || '',
      shortcode: node.code || node.shortcode || '',
      mediaType,
      thumbnailUrl: bestImage,
      mediaUrl: bestImage,
      videoUrl,
      caption: node.caption?.text || null,
      likeCount: node.like_count || 0,
      commentCount: node.comment_count || 0,
      viewCount: node.view_count || node.play_count || null,
      timestamp: node.taken_at || 0,
      carouselMedia: (node.carousel_media || []).map((cm): CarouselItem => ({
        id: cm.pk || cm.id || '',
        mediaType: cm.video_versions?.length ? 'video' : 'image',
        mediaUrl: this.getBestImage(cm),
        videoUrl: this.getVideoUrl(cm),
      })),
      owner: {
        username: node.user?.username || '',
        profilePicUrl: node.user?.profile_pic_url || '',
      },
    };
  }

  private getMediaType(node: RawMediaNode): 'image' | 'video' | 'carousel' {
    if (node.carousel_media && node.carousel_media.length > 0) return 'carousel';
    if (node.media_type === 2 || node.video_versions?.length) return 'video';
    return 'image';
  }

  private getBestImage(node: RawMediaNode): string {
    if (node.thumbnail_url) return node.thumbnail_url;
    if (node.display_url) return node.display_url;
    const candidates = node.image_versions2?.candidates;
    if (candidates && candidates.length > 0) {
      const sorted = [...candidates].sort((a, b) => (b.width || 0) - (a.width || 0));
      return sorted[0].url || '';
    }
    return '';
  }

  private getVideoUrl(node: RawMediaNode): string | null {
    if (node.video_versions && node.video_versions.length > 0) {
      return node.video_versions[0].url || null;
    }
    return null;
  }
}
