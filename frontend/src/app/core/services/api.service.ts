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
} from '../models/instagram.models';

interface ApiResponse<T> {
  success: boolean;
  [key: string]: unknown;
}

interface SearchResponse extends ApiResponse<SearchResult[]> {
  results: SearchResult[];
}

interface ReelsSearchResponse extends ApiResponse<MediaItem[]> {
  items: MediaItem[];
}

interface ProfileResponse extends ApiResponse<ProfileInfo> {
  profile: ProfileInfo;
}

interface FeedResponse extends ApiResponse<MediaItem[]> {
  items: MediaItem[];
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
