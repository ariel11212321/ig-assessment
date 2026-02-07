import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  SearchResult,
  ProfileInfo,
  MediaItem,
  StoryItem,
  Highlight,
  Comment,
  PaginatedResponse,
  ContactInfo,
} from '../models/instagram.models';

interface ApiResponse<T> {
  success: boolean;
  [key: string]: unknown;
}

interface SearchResponse extends ApiResponse<SearchResult[]> {
  results: SearchResult[];
}

interface ProfileResponse extends ApiResponse<ProfileInfo> {
  profile: ProfileInfo;
}

interface FeedResponse extends ApiResponse<MediaItem[]> {
  items: MediaItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface StoriesResponse extends ApiResponse<StoryItem[]> {
  stories: StoryItem[];
}

interface HighlightsResponse extends ApiResponse<Highlight[]> {
  highlights: Highlight[];
}

interface HighlightDetailResponse extends ApiResponse<Highlight> {
  highlight: Highlight;
}

interface PostResponse extends ApiResponse<MediaItem> {
  post: MediaItem;
}

interface CommentsResponse extends ApiResponse<Comment[]> {
  items: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface ContactsResponse extends ApiResponse<ContactInfo> {
  contacts: ContactInfo;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';

  searchUsers(query: string): Observable<SearchResult[]> {
    return this.http
      .get<SearchResponse>(`${this.baseUrl}/instagram/search`, { params: { q: query } })
      .pipe(map((res) => res.results));
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

  getPosts(username: string, cursor?: string): Observable<PaginatedResponse<MediaItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<FeedResponse>(`${this.baseUrl}/instagram/feed/${username}/posts`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getReels(username: string, cursor?: string): Observable<PaginatedResponse<MediaItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<FeedResponse>(`${this.baseUrl}/instagram/feed/${username}/reels`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getTagged(username: string, cursor?: string): Observable<PaginatedResponse<MediaItem>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<FeedResponse>(`${this.baseUrl}/instagram/feed/${username}/tagged`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getStories(username: string): Observable<StoryItem[]> {
    return this.http
      .get<StoriesResponse>(`${this.baseUrl}/instagram/feed/${username}/stories`)
      .pipe(map((res) => res.stories));
  }

  getHighlights(username: string): Observable<Highlight[]> {
    return this.http
      .get<HighlightsResponse>(`${this.baseUrl}/instagram/feed/${username}/highlights`)
      .pipe(map((res) => res.highlights));
  }

  getHighlightDetail(highlightId: string): Observable<Highlight> {
    return this.http
      .get<HighlightDetailResponse>(`${this.baseUrl}/instagram/highlight/${highlightId}`)
      .pipe(map((res) => res.highlight));
  }

  getPostDetail(postId: string): Observable<MediaItem> {
    return this.http
      .get<PostResponse>(`${this.baseUrl}/instagram/post/${postId}`)
      .pipe(map((res) => res.post));
  }

  getComments(postId: string, cursor?: string): Observable<PaginatedResponse<Comment>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<CommentsResponse>(`${this.baseUrl}/instagram/post/${postId}/comments`, { params })
      .pipe(map((res) => ({ items: res.items, nextCursor: res.nextCursor, hasMore: res.hasMore })));
  }

  getCommentReplies(postId: string, commentId: string, cursor?: string): Observable<PaginatedResponse<Comment>> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http
      .get<CommentsResponse>(`${this.baseUrl}/instagram/post/${postId}/comments/${commentId}/replies`, { params })
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
    return `${this.baseUrl}/instagram/media/proxy?url=${encodeURIComponent(url)}`;
  }
}
