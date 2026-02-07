import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import {
  ProfileInfo,
  MediaItem,
  StoryItem,
  Highlight,
  ContactInfo,
  ContentTab,
} from '../../core/models/instagram.models';
import { ProfileHeaderComponent } from './components/profile-header/profile-header';
import { StoriesHighlightsComponent } from './components/stories-highlights/stories-highlights';
import { TabNavigationComponent } from './components/tab-navigation/tab-navigation';
import { ContentGridComponent } from './components/content-grid/content-grid';
import { PostDetailComponent } from './components/post-detail/post-detail';
import { ReelViewerComponent } from './components/reel-viewer/reel-viewer';
import { StoryViewerComponent } from './components/story-viewer/story-viewer';
import { ContactInfoComponent } from './components/contact-info/contact-info';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ProfileHeaderComponent,
    StoriesHighlightsComponent,
    TabNavigationComponent,
    ContentGridComponent,
    PostDetailComponent,
    ReelViewerComponent,
    StoryViewerComponent,
    ContactInfoComponent,
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
        <div class="profile-skeleton-highlights">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="highlight-skeleton">
              <app-skeleton width="77px" height="77px" borderRadius="50%" />
              <app-skeleton width="60px" height="12px" />
            </div>
          }
        </div>
      </div>
    } @else if (profile()) {
      <app-profile-header
        [profile]="profile()!"
        [hasStories]="stories().length > 0"
        (profilePicClick)="openStoryViewer(-1)"
      />

      <app-contact-info [contacts]="contacts()" />

      <app-stories-highlights
        [stories]="stories()"
        [highlights]="highlights()"
        (storyClick)="openStoryViewer(-1)"
        (highlightClick)="openHighlightViewer($event)"
      />

      <app-tab-navigation
        [activeTab]="activeTab()"
        (tabChange)="onTabChange($event)"
      />

      <app-content-grid
        [items]="currentItems()"
        [loading]="feedLoading()"
        [hasMore]="currentHasMore()"
        [activeTab]="activeTab()"
        (loadMore)="loadMore()"
        (postClick)="onPostClick($event)"
        (reelClick)="onReelClick($event)"
      />
    }

    @if (selectedPost()) {
      <app-post-detail
        [post]="selectedPost()!"
        [profile]="profile()!"
        (close)="closePostDetail()"
        (navigatePost)="navigatePost($event)"
      />
    }

    @if (selectedReelIndex() !== null) {
      <app-reel-viewer
        [reels]="currentItems()"
        [currentIndex]="selectedReelIndex()!"
        (close)="closeReelViewer()"
        (indexChange)="selectedReelIndex.set($event)"
      />
    }

    @if (storyViewerOpen()) {
      <app-story-viewer
        [items]="storyViewerItems()"
        [title]="storyViewerTitle()"
        [profilePicUrl]="profile()?.profilePicUrl || ''"
        (close)="closeStoryViewer()"
      />
    }
  `,
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  profile = signal<ProfileInfo | null>(null);
  contacts = signal<ContactInfo>({ emails: [], phones: [], socialLinks: [] });
  stories = signal<StoryItem[]>([]);
  highlights = signal<Highlight[]>([]);
  loading = signal(true);
  feedLoading = signal(false);

  activeTab = signal<ContentTab>('posts');

  posts = signal<MediaItem[]>([]);
  postsCursor = signal<string | null>(null);
  postsHasMore = signal(true);

  reels = signal<MediaItem[]>([]);
  reelsCursor = signal<string | null>(null);
  reelsHasMore = signal(true);

  tagged = signal<MediaItem[]>([]);
  taggedCursor = signal<string | null>(null);
  taggedHasMore = signal(true);

  selectedPost = signal<MediaItem | null>(null);
  selectedReelIndex = signal<number | null>(null);

  storyViewerOpen = signal(false);
  storyViewerItems = signal<StoryItem[]>([]);
  storyViewerTitle = signal('');

  currentItems = computed(() => {
    switch (this.activeTab()) {
      case 'posts': return this.posts();
      case 'reels': return this.reels();
      case 'tagged': return this.tagged();
    }
  });

  currentHasMore = computed(() => {
    switch (this.activeTab()) {
      case 'posts': return this.postsHasMore();
      case 'reels': return this.reelsHasMore();
      case 'tagged': return this.taggedHasMore();
    }
  });

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
        this.loadFeed('posts');
        this.loadStoriesAndHighlights(profile.username);
        this.loadContacts(profile.username);
      },
      error: () => {
        this.loading.set(false);
      },
    });

    // Check for post detail route
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const postId = params.get('postId');
      if (postId) {
        this.api.getPostDetail(postId).subscribe((post) => {
          this.selectedPost.set(post);
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(tab: ContentTab): void {
    this.activeTab.set(tab);
    const items = this.currentItems();
    if (items.length === 0) {
      this.loadFeed(tab);
    }
  }

  loadMore(): void {
    this.loadFeed(this.activeTab());
  }

  onPostClick(post: MediaItem): void {
    this.selectedPost.set(post);
    const username = this.profile()?.username;
    if (username) {
      window.history.pushState({}, '', `/profile/${username}/post/${post.shortcode}`);
    }
  }

  onReelClick(index: number): void {
    this.selectedReelIndex.set(index);
  }

  closePostDetail(): void {
    this.selectedPost.set(null);
    const username = this.profile()?.username;
    if (username) {
      window.history.pushState({}, '', `/profile/${username}`);
    }
  }

  closeReelViewer(): void {
    this.selectedReelIndex.set(null);
  }

  navigatePost(direction: 'prev' | 'next'): void {
    const items = this.currentItems();
    const current = this.selectedPost();
    if (!current) return;
    const idx = items.findIndex((i) => i.id === current.id);
    if (direction === 'prev' && idx > 0) {
      this.onPostClick(items[idx - 1]);
    } else if (direction === 'next' && idx < items.length - 1) {
      this.onPostClick(items[idx + 1]);
    }
  }

  openStoryViewer(highlightIndex: number): void {
    if (highlightIndex === -1) {
      const s = this.stories();
      if (s.length === 0) return;
      this.storyViewerItems.set(s);
      this.storyViewerTitle.set(this.profile()?.username || '');
    }
    this.storyViewerOpen.set(true);
  }

  openHighlightViewer(index: number): void {
    const hl = this.highlights()[index];
    if (!hl) return;

    if (hl.items.length > 0) {
      this.storyViewerItems.set(hl.items);
      this.storyViewerTitle.set(hl.title);
      this.storyViewerOpen.set(true);
    } else {
      this.api.getHighlightDetail(hl.id).subscribe((detail) => {
        this.storyViewerItems.set(detail.items);
        this.storyViewerTitle.set(detail.title);
        this.storyViewerOpen.set(true);
      });
    }
  }

  closeStoryViewer(): void {
    this.storyViewerOpen.set(false);
  }

  private loadFeed(tab: ContentTab): void {
    const username = this.profile()?.username;
    if (!username) return;

    this.feedLoading.set(true);
    let cursor: string | null = null;

    switch (tab) {
      case 'posts':
        if (!this.postsHasMore()) { this.feedLoading.set(false); return; }
        cursor = this.postsCursor();
        this.api.getPosts(username, cursor || undefined).subscribe({
          next: (res) => {
            this.posts.update((prev) => [...prev, ...res.items]);
            this.postsCursor.set(res.nextCursor);
            this.postsHasMore.set(res.hasMore);
            this.feedLoading.set(false);
          },
          error: () => this.feedLoading.set(false),
        });
        break;
      case 'reels':
        if (!this.reelsHasMore()) { this.feedLoading.set(false); return; }
        cursor = this.reelsCursor();
        this.api.getReels(username, cursor || undefined).subscribe({
          next: (res) => {
            this.reels.update((prev) => [...prev, ...res.items]);
            this.reelsCursor.set(res.nextCursor);
            this.reelsHasMore.set(res.hasMore);
            this.feedLoading.set(false);
          },
          error: () => this.feedLoading.set(false),
        });
        break;
      case 'tagged':
        if (!this.taggedHasMore()) { this.feedLoading.set(false); return; }
        cursor = this.taggedCursor();
        this.api.getTagged(username, cursor || undefined).subscribe({
          next: (res) => {
            this.tagged.update((prev) => [...prev, ...res.items]);
            this.taggedCursor.set(res.nextCursor);
            this.taggedHasMore.set(res.hasMore);
            this.feedLoading.set(false);
          },
          error: () => this.feedLoading.set(false),
        });
        break;
    }
  }

  private loadStoriesAndHighlights(username: string): void {
    this.api.getStories(username).subscribe({
      next: (stories) => this.stories.set(stories),
    });
    this.api.getHighlights(username).subscribe({
      next: (highlights) => this.highlights.set(highlights),
    });
  }

  private loadContacts(username: string): void {
    this.api.getContacts(username).subscribe({
      next: (contacts) => this.contacts.set(contacts),
    });
  }

  private resetState(): void {
    this.profile.set(null);
    this.posts.set([]);
    this.postsCursor.set(null);
    this.postsHasMore.set(true);
    this.reels.set([]);
    this.reelsCursor.set(null);
    this.reelsHasMore.set(true);
    this.tagged.set([]);
    this.taggedCursor.set(null);
    this.taggedHasMore.set(true);
    this.stories.set([]);
    this.highlights.set([]);
    this.contacts.set({ emails: [], phones: [], socialLinks: [] });
    this.activeTab.set('posts');
    this.selectedPost.set(null);
    this.selectedReelIndex.set(null);
  }
}
