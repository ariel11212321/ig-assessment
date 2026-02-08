import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { MediaItem } from '../../core/models/instagram.models';
import { ContentGridComponent } from '../profile/components/content-grid/content-grid';
import { PostDetailComponent } from '../profile/components/post-detail/post-detail';

@Component({
  selector: 'app-hashtag',
  standalone: true,
  imports: [ContentGridComponent, PostDetailComponent],
  template: `
    <div class="hashtag-header">
      <h1 class="hashtag-title">#{{ tag() }}</h1>
    </div>

    <app-content-grid
      [items]="items()"
      [loading]="loading()"
      [hasMore]="hasMore()"
      (loadMore)="loadMore()"
      (itemClick)="onItemClick($event)"
    />

    @if (selectedPost()) {
      <app-post-detail
        [post]="selectedPost()!"
        (close)="selectedPost.set(null)"
        (navigatePost)="navigatePost($event)"
      />
    }
  `,
  styles: [`
    :host {
      display: block;
      max-width: 935px;
      margin: 0 auto;
      padding: 30px 20px 0;
    }
    .hashtag-header {
      padding: 20px 0 24px;
      border-bottom: 1px solid var(--border-color, #dbdbdb);
      margin-bottom: 20px;
    }
    .hashtag-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary, #262626);
      margin: 0;
    }
    @media (max-width: 735px) {
      :host { padding: 0 0 0; }
      .hashtag-header { padding: 16px; margin-bottom: 0; }
      .hashtag-title { font-size: 22px; }
    }
  `],
})
export class HashtagComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  tag = signal('');
  items = signal<MediaItem[]>([]);
  loading = signal(false);
  hasMore = signal(false);
  cursor = signal<string | null>(null);
  selectedPost = signal<MediaItem | null>(null);
  selectedIndex = signal(-1);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const tag = params.get('tag') || '';
        this.tag.set(tag);
        this.items.set([]);
        this.cursor.set(null);
        this.loading.set(true);
        return this.api.getHashtagFeed(tag);
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.cursor.set(res.nextCursor);
        this.hasMore.set(res.hasMore);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMore(): void {
    const c = this.cursor();
    if (!c || this.loading()) return;
    this.loading.set(true);
    this.api.getHashtagFeed(this.tag(), c).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.items.update((prev) => [...prev, ...res.items]);
        this.cursor.set(res.nextCursor);
        this.hasMore.set(res.hasMore);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onItemClick(event: { item: MediaItem; index: number }): void {
    this.selectedPost.set(event.item);
    this.selectedIndex.set(event.index);
  }

  navigatePost(direction: number): void {
    const newIndex = this.selectedIndex() + direction;
    const all = this.items();
    if (newIndex >= 0 && newIndex < all.length) {
      this.selectedPost.set(all[newIndex]);
      this.selectedIndex.set(newIndex);
    }
  }
}
