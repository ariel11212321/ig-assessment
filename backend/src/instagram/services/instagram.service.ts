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
  StoryItem,
  HighlightInfo,
  HighlightDetail,
  CommentItem,
  MediaDetail,
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
  user?: {
    username?: string;
    profile_pic_url?: string;
    full_name?: string;
    is_verified?: boolean;
  };
  thumbnail_url?: string;
  display_url?: string;
  expiring_at?: number;
  reshare_count?: number;
  repost_count?: number;
}

interface RawReelItem {
  media?: RawMediaNode;
}

interface RawHighlightTray {
  id?: string;
  title?: string;
  cover_media?: {
    cropped_image_version?: { url?: string };
  };
  media_count?: number;
}

interface RawComment {
  pk?: string;
  text?: string;
  created_at?: number;
  comment_like_count?: number;
  child_comment_count?: number;
  user?: {
    username?: string;
    profile_pic_url?: string;
    is_verified?: boolean;
  };
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(private readonly imaiApi: ImaiApiService) {}

  async searchUsers(query: string): Promise<ImaiSearchResult[]> {
    try {
      const response = await this.imaiApi.get<{
        status?: string;
        users?: RawSearchUser[];
      }>('/raw/ig/search/users/', { url: query });

      if (response.users && response.users.length > 0) {
        return response.users.map((user) => this.mapSearchResult(user));
      }
    } catch (err) {
      this.logger.warn(`Raw search failed, falling back to dict/users search: ${err}`);
    }

    try {
      const response = await this.imaiApi.get<{
        success: boolean;
        data?: Array<{
          user_id?: string;
          username?: string;
          fullname?: string;
          picture?: string;
          is_verified?: boolean;
          followers?: number;
        }>;
      }>('/dict/users/', {
        q: query,
        type: 'search',
        platform: 'instagram',
      });

      const results = response.data || [];
      return results.map((user): ImaiSearchResult => ({
        userId: user.user_id || '',
        username: user.username || '',
        fullName: user.fullname || '',
        profilePicUrl: user.picture || '',
        isVerified: user.is_verified || false,
        followerCount: user.followers || 0,
      }));
    } catch (err) {
      this.logger.error(`Dict users search also failed: ${err}`);
      return [];
    }
  }

  async searchReels(query: string): Promise<ImaiMediaItem[]> {
    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
    }>('/raw/ig/search/reels/', { url: query });

    return (response.items || []).map((item) => this.mapMediaItem(item));
  }

  async getProfileInfo(username: string): Promise<ImaiProfileInfo> {
    const response = await this.imaiApi.get<{
      status?: string;
      user?: RawUserInfo;
    }>('/raw/ig/user/info/', { url: username });

    const user = response.user;
    if (!user) {
      throw new Error('User not found');
    }

    return this.mapProfileInfo(user);
  }

  async getContactInfo(username: string): Promise<ContactInfo> {
    const response = await this.imaiApi.get<{
      success: boolean;
      user_profile?: {
        user_id?: string;
        username?: string;
        fullname?: string;
        contacts?: Array<{ type?: string; value?: string }>;
      };
    }>('/exports/contacts/', { url: username, platform: 'instagram' });

    const contacts = response.user_profile?.contacts || [];
    return {
      emails: contacts.filter((c) => c.type === 'email').map((c) => c.value || ''),
      phones: contacts.filter((c) => c.type === 'phone').map((c) => c.value || ''),
      socialLinks: contacts
        .filter((c) => c.type !== 'email' && c.type !== 'phone')
        .map((c): SocialLink => ({
          platform: c.type || '',
          url: '',
          username: c.value || '',
        })),
    };
  }

  async getUserFeed(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { url: username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
      end_cursor?: string;
      more_available?: boolean;
    }>('/raw/ig/user/feed/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.end_cursor || null,
      hasMore: response.more_available || false,
    };
  }

  async getUserFeedMore(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { url: username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
      end_cursor?: string;
      more_available?: boolean;
    }>('/raw/ig/user/feed_more/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.end_cursor || null,
      hasMore: response.more_available || false,
    };
  }

  async getUserReels(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { url: username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawReelItem[];
      end_cursor?: string;
      more_available?: boolean;
    }>('/raw/ig/user/reels/', params);

    const items = (response.items || [])
      .map((item) => item.media)
      .filter((media): media is RawMediaNode => !!media)
      .map((media) => this.mapMediaItem(media));

    return {
      items,
      nextCursor: response.end_cursor || null,
      hasMore: response.more_available || false,
    };
  }

  async getUserReelsMore(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { url: username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawReelItem[];
      end_cursor?: string;
      more_available?: boolean;
    }>('/raw/ig/user/reels_more/', params);

    const items = (response.items || [])
      .map((item) => item.media)
      .filter((media): media is RawMediaNode => !!media)
      .map((media) => this.mapMediaItem(media));

    return {
      items,
      nextCursor: response.end_cursor || null,
      hasMore: response.more_available || false,
    };
  }

  async getUserReposts(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { url: username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
      end_cursor?: string;
      more_available?: boolean;
    }>('/raw/ig/user/reposted_feed/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.end_cursor || null,
      hasMore: response.more_available || false,
    };
  }

  async getUserTagged(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { url: username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
      end_cursor?: string;
      more_available?: boolean;
    }>('/raw/ig/usertags/feed/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.end_cursor || null,
      hasMore: response.more_available || false,
    };
  }

  async getUserStories(username: string): Promise<StoryItem[]> {
    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
    }>('/raw/ig/user/stories/', { url: username });

    return (response.items || []).map((item) => this.mapStoryItem(item));
  }

  async getUserHighlights(username: string): Promise<HighlightInfo[]> {
    const response = await this.imaiApi.get<{
      status?: string;
      tray?: RawHighlightTray[];
    }>('/raw/ig/user/highlights/', { url: username });

    return (response.tray || []).map((h): HighlightInfo => ({
      id: h.id || '',
      title: h.title || '',
      coverUrl: h.cover_media?.cropped_image_version?.url || '',
      mediaCount: h.media_count || 0,
    }));
  }

  async getHighlightDetail(highlightId: string): Promise<HighlightDetail> {
    const normalizedHighlightId = this.normalizeHighlightId(highlightId);
    const response = await this.imaiApi.get<{
      status?: string;
      title?: string;
      id?: string;
      cover_media?: { cropped_image_version?: { url?: string } };
      items?: RawMediaNode[];
    }>('/raw/ig/highlight/info/', { url: normalizedHighlightId, highlight_id: normalizedHighlightId });

    return {
      id: response.id || normalizedHighlightId,
      title: response.title || '',
      coverUrl: response.cover_media?.cropped_image_version?.url || '',
      items: (response.items || []).map((item) => this.mapStoryItem(item)),
    };
  }

  async getUserIgtv(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { url: username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
      end_cursor?: string;
      more_available?: boolean;
    }>('/raw/ig/user/igtv/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.end_cursor || null,
      hasMore: response.more_available || false,
    };
  }

  async getMediaDetail(mediaId: string): Promise<MediaDetail> {
    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
    }>('/raw/ig/media/info/', { url: mediaId });

    const item = response.items?.[0];
    if (!item) {
      throw new Error('Media not found');
    }

    const base = this.mapMediaItem(item);
    return {
      ...base,
      owner: {
        username: item.user?.username || '',
        profilePicUrl: item.user?.profile_pic_url || '',
        isVerified: item.user?.is_verified || false,
        fullName: item.user?.full_name || '',
      },
    };
  }

  async getMediaDetailMore(mediaId: string): Promise<MediaDetail> {
    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
    }>('/raw/ig/media/info_more/', { url: mediaId });

    const item = response.items?.[0];
    if (!item) {
      throw new Error('Media not found');
    }

    const base = this.mapMediaItem(item);
    return {
      ...base,
      owner: {
        username: item.user?.username || '',
        profilePicUrl: item.user?.profile_pic_url || '',
        isVerified: item.user?.is_verified || false,
        fullName: item.user?.full_name || '',
      },
    };
  }

  async getMediaComments(mediaId: string, cursor?: string): Promise<PaginatedResponse<CommentItem>> {
    const params: Record<string, string> = { url: mediaId };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      comments?: RawComment[];
      end_cursor?: string;
      has_more_comments?: boolean;
    }>('/raw/ig/media/comments/', params);

    return {
      items: (response.comments || []).map((c) => this.mapComment(c)),
      nextCursor: response.end_cursor || null,
      hasMore: response.has_more_comments || false,
    };
  }

  async getCommentReplies(commentId: string, cursor?: string): Promise<PaginatedResponse<CommentItem>> {
    const params: Record<string, string> = { url: commentId };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      comments?: RawComment[];
      end_cursor?: string;
      has_more_comments?: boolean;
    }>('/raw/ig/media/comments/replies/', params);

    return {
      items: (response.comments || []).map((c) => this.mapComment(c)),
      nextCursor: response.end_cursor || null,
      hasMore: response.has_more_comments || false,
    };
  }

  async getHashtagFeed(hashtag: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { url: hashtag };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
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

  async getHashtagInfo(hashtag: string): Promise<{ id: string; name: string; mediaCount: number }> {
    const response = await this.imaiApi.get<{
      status?: string;
      id?: string;
      name?: string;
      media_count?: number;
    }>('/raw/ig/hashtag/info/', { url: hashtag });

    return {
      id: response.id || '',
      name: response.name || hashtag,
      mediaCount: response.media_count || 0,
    };
  }

  async getAudioFeed(audioId: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { url: audioId };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      status?: string;
      items?: RawMediaNode[];
      end_cursor?: string;
      more_available?: boolean;
    }>('/raw/ig/audio/feed/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.end_cursor || null,
      hasMore: response.more_available || false,
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

  private mapStoryItem(node: RawMediaNode): StoryItem {
    const isVideo = node.media_type === 2 || (node.video_versions && node.video_versions.length > 0);
    return {
      id: node.pk || node.id || '',
      mediaType: isVideo ? 'video' : 'image',
      mediaUrl: this.getBestImage(node),
      videoUrl: this.getVideoUrl(node),
      timestamp: node.taken_at || 0,
      expiringAt: node.expiring_at || 0,
    };
  }

  private mapComment(c: RawComment): CommentItem {
    return {
      id: c.pk || '',
      text: c.text || '',
      timestamp: c.created_at || 0,
      likeCount: c.comment_like_count || 0,
      replyCount: c.child_comment_count || 0,
      user: {
        username: c.user?.username || '',
        profilePicUrl: c.user?.profile_pic_url || '',
        isVerified: c.user?.is_verified || false,
      },
    };
  }

  private getMediaType(node: RawMediaNode): 'image' | 'video' | 'carousel' {
    if (node.carousel_media && node.carousel_media.length > 0) return 'carousel';
    if (node.media_type === 2 || node.video_versions?.length) return 'video';
    return 'image';
  }

  private extractMediaCode(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';

    try {
      const parsed = new URL(trimmed);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || trimmed;
    } catch {
      const sanitized = trimmed.split('?')[0].split('#')[0];
      const parts = sanitized.split('/').filter(Boolean);
      return parts[parts.length - 1] || sanitized;
    }
  }

  private normalizeHighlightId(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';
    return trimmed.startsWith('highlight:') ? trimmed.slice('highlight:'.length) : trimmed;
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