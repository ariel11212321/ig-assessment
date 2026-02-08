import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  SearchResult,
  ProfileInfo,
  MediaItem,
  PaginatedResponse,
  ContactInfo,
  StoryItem,
  HighlightInfo,
  HighlightDetail,
  CommentItem,
} from '../models/instagram.models';

interface ApiResponse {
  success: boolean;
  [key: string]: unknown;
}

interface SearchResponse extends ApiResponse {
  results: SearchResult[];
}

interface ReelsSearchResponse extends ApiResponse {
  items: MediaItem[];
}

interface ProfileResponse extends ApiResponse {
  profile: ProfileInfo;
}

interface FeedResponse extends ApiResponse {
  items: MediaItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface ContactsResponse extends ApiResponse {
  contacts: ContactInfo;
}

interface StoriesResponse extends ApiResponse {
  items: StoryItem[];
}

interface HighlightsResponse extends ApiResponse {
  items: HighlightInfo[];
}

interface HighlightDetailResponse extends ApiResponse {
  highlight: HighlightDetail;
}

interface MediaDetailResponse extends ApiResponse {
  media: MediaItem;
}

interface CommentsResponse extends ApiResponse {
  items: CommentItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://ig-assessment-server.onrender.com/api';

  searchUsers(query: string): Observable<SearchResult[]> {
    return this.http
      .get<SearchResponse>(`${this.baseUrl}/instagram/search`, { params: { q: query } })
      .pipe(map((res) => res.results));
  }

  searchReels(query: string): Observable<MediaItem[]> {
    return this.http
      .get<ReelsSearchResponse>(`${this.baseUrl}/instagram/search/reels`, { params: { q: query } })
      .pipe(map((res) => res.items));
  }

  getProfile(username: string): Observable<ProfileInfo> {
    return this.http
      .get<ProfileResponse>(`${this.baseUrl}/instagram/profile/${username}`)
      .pipe(map((res) => res.profile));
  }

  getContacts(username: string): Observable<ContactInfo> {
    return this.http
      .get<ContactsResponse>(`${this.baseUrl}/instagram/profile/${username}/contacts`)
      .pipe(map((res) => res.contacts));
  }

  getUserFeed(username: string, cursor?: string): Observable<PaginatedResponse<MediaItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<FeedResponse>(`${this.baseUrl}/instagram/profile/${username}/feed`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getUserReels(username: string, cursor?: string): Observable<PaginatedResponse<MediaItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<FeedResponse>(`${this.baseUrl}/instagram/profile/${username}/reels`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getUserReposts(username: string, cursor?: string): Observable<PaginatedResponse<MediaItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<FeedResponse>(`${this.baseUrl}/instagram/profile/${username}/reposts`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getUserTagged(username: string, cursor?: string): Observable<PaginatedResponse<MediaItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<FeedResponse>(`${this.baseUrl}/instagram/profile/${username}/tagged`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getUserStories(username: string): Observable<StoryItem[]> {
    return this.http
      .get<StoriesResponse>(`${this.baseUrl}/instagram/profile/${username}/stories`)
      .pipe(map((res) => res.items));
  }

  getUserHighlights(username: string): Observable<HighlightInfo[]> {
    return this.http
      .get<HighlightsResponse>(`${this.baseUrl}/instagram/profile/${username}/highlights`)
      .pipe(map((res) => res.items));
  }

  getHighlightDetail(highlightId: string): Observable<HighlightDetail> {
    return this.http
      .get<HighlightDetailResponse>(`${this.baseUrl}/instagram/highlights/${highlightId}`)
      .pipe(map((res) => res.highlight));
  }

  getMediaDetail(mediaId: string): Observable<MediaItem> {
    return this.http
      .get<MediaDetailResponse>(`${this.baseUrl}/instagram/media/${mediaId}`)
      .pipe(map((res) => res.media));
  }

  getMediaComments(mediaId: string, cursor?: string): Observable<PaginatedResponse<CommentItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<CommentsResponse>(`${this.baseUrl}/instagram/media/${mediaId}/comments`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getCommentReplies(commentId: string, cursor?: string): Observable<PaginatedResponse<CommentItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<CommentsResponse>(`${this.baseUrl}/instagram/comments/${commentId}/replies`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getHashtagFeed(tag: string, cursor?: string): Observable<PaginatedResponse<MediaItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<FeedResponse>(`${this.baseUrl}/instagram/hashtag/${tag}`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

 getMediaProxyUrl(url: string): string {
    const cleanUrl = url.replace(/&amp;/g, '&');
    return `${this.baseUrl}/instagram/media/proxy?url=${encodeURIComponent(cleanUrl)}`;
}
}
