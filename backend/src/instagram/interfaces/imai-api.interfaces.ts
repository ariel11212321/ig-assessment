export interface ImaiSearchResult {
  userId: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  isVerified: boolean;
  followerCount: number;
}

export interface ImaiProfileInfo {
  userId: string;
  username: string;
  fullName: string;
  biography: string;
  profilePicUrl: string;
  profilePicUrlHd: string;
  followerCount: number;
  followingCount: number;
  mediaCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  externalUrl: string | null;
  category: string | null;
}

export interface ImaiMediaItem {
  id: string;
  shortcode: string;
  mediaType: 'image' | 'video' | 'carousel';
  thumbnailUrl: string;
  mediaUrl: string;
  videoUrl: string | null;
  caption: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number | null;
  timestamp: number;
  carouselMedia: CarouselItem[];
  owner: {
    username: string;
    profilePicUrl: string;
  };
}

export interface CarouselItem {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  videoUrl: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ContactInfo {
  emails: string[];
  phones: string[];
  socialLinks: SocialLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
  username: string;
}
