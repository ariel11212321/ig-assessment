import { Injectable, Logger } from '@nestjs/common';
import { ImaiApiService } from './imai-api.service';
import {
  ImaiSearchResult,
  ImaiProfileInfo,
  ImaiMediaItem,
  ImaiStoryItem,
  ImaiHighlight,
  ImaiComment,
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

interface RawStoryItem {
  pk?: string;
  id?: string;
  media_type?: number;
  image_versions2?: { candidates?: Array<{ url?: string; width?: number; height?: number }> };
  video_versions?: Array<{ url?: string; width?: number; height?: number }>;
  taken_at?: number;
  expiring_at?: number;
}

interface RawHighlight {
  id?: string;
  title?: string;
  cover_media?: { cropped_image_version?: { url?: string } };
  items?: RawStoryItem[];
}

interface RawComment {
  pk?: string;
  text?: string;
  created_at?: number;
  comment_like_count?: number;
  user?: { username?: string; profile_pic_url?: string };
  child_comment_count?: number;
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(private readonly imaiApi: ImaiApiService) {}

  async searchUsers(query: string): Promise<ImaiSearchResult[]> {
    const response = await this.imaiApi.get<{
      success: boolean;
      users?: RawSearchUser[];
    }>('/raw/ig/search/users/', { q: query });

    if (!response.users) return [];

    return response.users.map((user) => this.mapSearchResult(user));
  }

  async getProfileInfo(username: string): Promise<ImaiProfileInfo> {
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

  async getUserFeed(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      success: boolean;
      items?: RawMediaNode[];
      next_cursor?: string;
      has_more?: boolean;
    }>('/raw/ig/user/feed/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.next_cursor || null,
      hasMore: response.has_more || false,
    };
  }

  async getUserReels(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      success: boolean;
      items?: RawMediaNode[];
      next_cursor?: string;
      has_more?: boolean;
    }>('/raw/ig/user/reels/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.next_cursor || null,
      hasMore: response.has_more || false,
    };
  }

  async getUserTagged(username: string, cursor?: string): Promise<PaginatedResponse<ImaiMediaItem>> {
    const params: Record<string, string> = { username };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      success: boolean;
      items?: RawMediaNode[];
      next_cursor?: string;
      has_more?: boolean;
    }>('/raw/ig/user/tagged/', params);

    return {
      items: (response.items || []).map((item) => this.mapMediaItem(item)),
      nextCursor: response.next_cursor || null,
      hasMore: response.has_more || false,
    };
  }

  async getUserStories(username: string): Promise<ImaiStoryItem[]> {
    const response = await this.imaiApi.get<{
      success: boolean;
      stories?: RawStoryItem[];
    }>('/raw/ig/user/stories/', { username });

    return (response.stories || []).map((item) => this.mapStoryItem(item));
  }

  async getUserHighlights(username: string): Promise<ImaiHighlight[]> {
    const response = await this.imaiApi.get<{
      success: boolean;
      highlights?: RawHighlight[];
    }>('/raw/ig/user/highlights/', { username });

    return (response.highlights || []).map((hl) => this.mapHighlight(hl));
  }

  async getHighlightDetail(highlightId: string): Promise<ImaiHighlight> {
    const response = await this.imaiApi.get<{
      success: boolean;
      highlight?: RawHighlight;
    }>('/raw/ig/highlight/', { highlight_id: highlightId });

    const hl = response.highlight;
    if (!hl) {
      throw new Error('Highlight not found');
    }

    return this.mapHighlight(hl);
  }

  async getPostDetail(postId: string): Promise<ImaiMediaItem> {
    const response = await this.imaiApi.get<{
      success: boolean;
      media?: RawMediaNode;
    }>('/raw/ig/media/info/', { shortcode: postId });

    const media = response.media;
    if (!media) {
      throw new Error('Post not found');
    }

    return this.mapMediaItem(media);
  }

  async getPostComments(postId: string, cursor?: string): Promise<PaginatedResponse<ImaiComment>> {
    const params: Record<string, string> = { shortcode: postId };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      success: boolean;
      comments?: RawComment[];
      next_cursor?: string;
      has_more?: boolean;
    }>('/raw/ig/media/comments/', params);

    return {
      items: (response.comments || []).map((c) => this.mapComment(c)),
      nextCursor: response.next_cursor || null,
      hasMore: response.has_more || false,
    };
  }

  async getCommentReplies(postId: string, commentId: string, cursor?: string): Promise<PaginatedResponse<ImaiComment>> {
    const params: Record<string, string> = { shortcode: postId, comment_id: commentId };
    if (cursor) params['after'] = cursor;

    const response = await this.imaiApi.get<{
      success: boolean;
      comments?: RawComment[];
      next_cursor?: string;
      has_more?: boolean;
    }>('/raw/ig/media/comments/replies/', params);

    return {
      items: (response.comments || []).map((c) => this.mapComment(c)),
      nextCursor: response.next_cursor || null,
      hasMore: response.has_more || false,
    };
  }

  async getContactInfo(username: string): Promise<ContactInfo> {
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

  private mapStoryItem(item: RawStoryItem): ImaiStoryItem {
    return {
      id: item.pk || item.id || '',
      mediaType: item.media_type === 2 ? 'video' : 'image',
      mediaUrl: this.getBestImageFromStory(item),
      videoUrl: item.media_type === 2 ? this.getVideoUrlFromStory(item) : null,
      timestamp: item.taken_at || 0,
      expiringAt: item.expiring_at || 0,
    };
  }

  private mapHighlight(hl: RawHighlight): ImaiHighlight {
    return {
      id: hl.id || '',
      title: hl.title || '',
      coverUrl: hl.cover_media?.cropped_image_version?.url || '',
      items: (hl.items || []).map((item) => this.mapStoryItem(item)),
    };
  }

  private mapComment(c: RawComment): ImaiComment {
    return {
      id: c.pk || '',
      text: c.text || '',
      createdAt: c.created_at || 0,
      likeCount: c.comment_like_count || 0,
      username: c.user?.username || '',
      profilePicUrl: c.user?.profile_pic_url || '',
      replyCount: c.child_comment_count || 0,
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

  private getBestImageFromStory(item: RawStoryItem): string {
    const candidates = item.image_versions2?.candidates;
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

  private getVideoUrlFromStory(item: RawStoryItem): string | null {
    if (item.video_versions && item.video_versions.length > 0) {
      return item.video_versions[0].url || null;
    }
    return null;
  }
}
