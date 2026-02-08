import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import {
  ProfileInfo,
  ContactInfo,
  MediaItem,
  StoryItem,
  HighlightInfo,
  HighlightDetail,
  ContentTab,
} from '../../core/models/instagram.models';
import { ProfileHeaderComponent } from './components/profile-header/profile-header';
import { ContactInfoComponent } from './components/contact-info/contact-info';
import { HighlightsBarComponent } from './components/highlights-bar/highlights-bar';
import { ContentGridComponent } from './components/content-grid/content-grid';
import { PostDetailComponent } from './components/post-detail/post-detail';
import { ReelViewerComponent } from './components/reel-viewer/reel-viewer';
import { StoryViewerComponent } from './components/story-viewer/story-viewer';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ProfileHeaderComponent,
    ContactInfoComponent,
    HighlightsBarComponent,
    ContentGridComponent,
    PostDetailComponent,
    ReelViewerComponent,
    StoryViewerComponent,
    SkeletonComponent,
  ],
  template: `
    @if (loading()) {
      <div class="profile-skeleton">
        <div class="profile-skeleton-header">
          <app-skeleton width="150px" height="150px" borderRadius="50%" />
          <div class="profile-skeleton-info">
            <app-skeleton width="200px" height="24px" />
            <app-skeleton width="300px" height="20px" />
            <app-skeleton width="250px" height="16px" />
            <app-skeleton width="180px" height="16px" />
          </div>
        </div>
      </div>
    } @else if (profile()) {
      <app-profile-header
        [profile]="profile()!"
        [hasStories]="stories().length > 0"
        (profilePicClick)="openStories()"
      />

      <app-contact-info [contacts]="contacts()" />

      <app-highlights-bar
        [highlights]="highlights()"
        [loading]="highlightsLoading()"
        (highlightClick)="openHighlight($event)"
      />

      <!-- Tab Navigation -->
      <div class="tab-bar">
        <button
          class="tab-item"
          [class.active]="activeTab() === 'posts'"
          (click)="switchTab('posts')"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <rect x="1" y="1" width="9" height="9" rx="1" />
            <rect x="14" y="1" width="9" height="9" rx="1" />
            <rect x="1" y="14" width="9" height="9" rx="1" />
            <rect x="14" y="14" width="9" height="9" rx="1" />
          </svg>
          <span class="tab-label">POSTS</span>
        </button>
        <button
          class="tab-item"
          [class.active]="activeTab() === 'reels'"
          (click)="switchTab('reels')"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462z"/>
          </svg>
          <span class="tab-label">REELS</span>
        </button>
        <button
          class="tab-item"
          [class.active]="activeTab() === 'reposts'"
          (click)="switchTab('reposts')"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M19 7l-3-3v2H7c-1.1 0-2 .9-2 2v4h2V8h9v2l3-3zM5 17l3 3v-2h9c1.1 0 2-.9 2-2v-4h-2v4H8v-2l-3 3z"/>
          </svg>
          <span class="tab-label">REPOSTS</span>
        </button>
        <button
          class="tab-item"
          [class.active]="activeTab() === 'tagged'"
          (click)="switchTab('tagged')"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span class="tab-label">TAGGED</span>
        </button>
      </div>

      <!-- Content Grid -->
      <app-content-grid
        [items]="feedItems()"
        [loading]="feedLoading()"
        [hasMore]="feedHasMore()"
        (loadMore)="loadMoreFeed()"
        (itemClick)="onGridItemClick($event)"
      />
    }

    <!-- Post Detail Modal -->
    @if (selectedPost()) {
      <app-post-detail
        [post]="selectedPost()!"
        [username]="profile()?.username || ''"
        [profilePicUrl]="profile()?.profilePicUrl || ''"
        (close)="closePostDetail()"
        (navigatePost)="navigatePostDetail($event)"
      />
    }

    <!-- Reel Viewer -->
    @if (showReelViewer()) {
      <app-reel-viewer
        [reels]="feedItems()"
        [currentIndex]="selectedReelIndex()"
        (close)="closeReelViewer()"
        (indexChange)="onReelIndexChange($event)"
      />
    }

    <!-- Story Viewer -->
    @if (showStoryViewer()) {
      <app-story-viewer
        [items]="storyViewerItems()"
        [title]="storyViewerTitle()"
        [profilePicUrl]="profile()?.profilePicUrl || ''"
        (close)="closeStoryViewer()"
      />
    }
  `,
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  // Profile data
  profile = signal<ProfileInfo | null>(null);
  contacts = signal<ContactInfo>({ emails: [], phones: [], socialLinks: [] });
  loading = signal(true);

  // Stories & Highlights
  stories = signal<StoryItem[]>([]);
  highlights = signal<HighlightInfo[]>([]);
  highlightsLoading = signal(false);

  // Tabs & Feed
  activeTab = signal<ContentTab>('posts');
  feedItems = signal<MediaItem[]>([]);
  feedLoading = signal(false);
  feedHasMore = signal(false);
  feedCursor = signal<string | null>(null);

  // Post Detail
  selectedPost = signal<MediaItem | null>(null);
  selectedPostIndex = signal(-1);

  // Reel Viewer
  showReelViewer = signal(false);
  selectedReelIndex = signal(0);

  // Story Viewer
  showStoryViewer = signal(false);
  storyViewerItems = signal<StoryItem[]>([]);
  storyViewerTitle = signal('');

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const username = params.get('username') || '';
        this.resetState();
        this.loading.set(true);
        return this.api.getProfile(username);
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
        this.loadSideData(profile.username);
        this.loadFeed(profile.username);

        // Check if route has a post ID query param
        const postId = this.route.snapshot.queryParams['post'];
        if (postId) {
          this.openPostById(postId);
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchTab(tab: ContentTab): void {
    if (tab === this.activeTab()) return;
    this.activeTab.set(tab);
    this.feedItems.set([]);
    this.feedCursor.set(null);
    this.feedHasMore.set(false);
    const username = this.profile()?.username;
    if (username) {
      this.loadFeed(username);
    }
  }

  loadFeed(username: string): void {
    this.feedLoading.set(true);
    const tab = this.activeTab();
    const cursor = this.feedCursor() || undefined;

    let obs$;
    switch (tab) {
      case 'posts':
        obs$ = this.api.getUserFeed(username, cursor);
        break;
      case 'reels':
        obs$ = this.api.getUserReels(username, cursor);
        break;
      case 'reposts':
        obs$ = this.api.getUserReposts(username, cursor);
        break;
      case 'tagged':
        obs$ = this.api.getUserTagged(username, cursor);
        break;
    }

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.feedItems.update((prev) => [...prev, ...res.items]);
        this.feedCursor.set(res.nextCursor);
        this.feedHasMore.set(res.hasMore);
        this.feedLoading.set(false);
      },
      error: () => {
        this.feedLoading.set(false);
      },
    });
  }

  loadMoreFeed(): void {
    const username = this.profile()?.username;
    if (username && this.feedCursor() && !this.feedLoading()) {
      this.loadFeed(username);
    }
  }

  onGridItemClick(event: { item: MediaItem; index: number }): void {
    if (this.activeTab() === 'reels') {
      this.selectedReelIndex.set(event.index);
      this.showReelViewer.set(true);
    } else {
      this.openPostDetail(event.item, event.index);
    }
  }

  openPostDetail(post: MediaItem, index: number): void {
    this.selectedPost.set(post);
    this.selectedPostIndex.set(index);
    this.updateUrlWithPost(post.shortcode || post.id);
  }

  closePostDetail(): void {
    this.selectedPost.set(null);
    this.selectedPostIndex.set(-1);
    this.clearPostFromUrl();
  }

  navigatePostDetail(direction: number): void {
    const items = this.feedItems();
    const newIndex = this.selectedPostIndex() + direction;
    if (newIndex >= 0 && newIndex < items.length) {
      const post = items[newIndex];
      this.selectedPost.set(post);
      this.selectedPostIndex.set(newIndex);
      this.updateUrlWithPost(post.shortcode || post.id);
    }
  }

  openPostById(postId: string): void {
    this.api.getMediaDetail(postId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (media) => {
        this.selectedPost.set(media);
        this.selectedPostIndex.set(-1);
      },
    });
  }

  closeReelViewer(): void {
    this.showReelViewer.set(false);
  }

  onReelIndexChange(index: number): void {
    this.selectedReelIndex.set(index);
  }

  openStories(): void {
    if (this.stories().length > 0) {
      this.storyViewerItems.set(this.stories());
      this.storyViewerTitle.set(this.profile()?.username || '');
      this.showStoryViewer.set(true);
    }
  }

  openHighlight(highlight: HighlightInfo): void {
    this.api.getHighlightDetail(highlight.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (detail: HighlightDetail) => {
        this.storyViewerItems.set(detail.items);
        this.storyViewerTitle.set(detail.title || highlight.title);
        this.showStoryViewer.set(true);
      },
    });
  }

  closeStoryViewer(): void {
    this.showStoryViewer.set(false);
  }

  private loadSideData(username: string): void {
    this.highlightsLoading.set(true);

    forkJoin({
      contacts: this.api.getContacts(username).pipe(catchError(() => of({ emails: [], phones: [], socialLinks: [] } as ContactInfo))),
      stories: this.api.getUserStories(username).pipe(catchError(() => of([] as StoryItem[]))),
      highlights: this.api.getUserHighlights(username).pipe(catchError(() => of([] as HighlightInfo[]))),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.contacts.set(data.contacts);
        this.stories.set(data.stories);
        this.highlights.set(data.highlights);
        this.highlightsLoading.set(false);
      },
      error: () => {
        this.highlightsLoading.set(false);
      },
    });
  }

  private resetState(): void {
    this.profile.set(null);
    this.contacts.set({ emails: [], phones: [], socialLinks: [] });
    this.stories.set([]);
    this.highlights.set([]);
    this.activeTab.set('posts');
    this.feedItems.set([]);
    this.feedCursor.set(null);
    this.feedHasMore.set(false);
    this.selectedPost.set(null);
    this.showReelViewer.set(false);
    this.showStoryViewer.set(false);
  }

  private updateUrlWithPost(postId: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { post: postId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private clearPostFromUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { post: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
