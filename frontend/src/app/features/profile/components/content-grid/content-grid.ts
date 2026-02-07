import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MediaItem, ContentTab } from '../../../../core/models/instagram.models';
import { ShortNumberPipe } from '../../../../shared/pipes/short-number.pipe';
import { IntersectionObserverDirective } from '../../../../shared/directives/intersection-observer.directive';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-content-grid',
  standalone: true,
  imports: [ShortNumberPipe, IntersectionObserverDirective, SkeletonComponent],
  template: `
    <div class="content-grid">
      @for (item of items; track item.id; let i = $index) {
        <div
          class="grid-item"
          (click)="onItemClick(item, i)"
        >
          <img
            [src]="item.thumbnailUrl || item.mediaUrl"
            [alt]="item.caption || 'Post'"
            class="grid-image"
            loading="lazy"
          />

          @if (item.mediaType === 'video' || activeTab === 'reels') {
            <div class="video-indicator">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                <path d="M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462z"/>
              </svg>
              @if (item.viewCount) {
                <span class="view-count">{{ item.viewCount | shortNumber }}</span>
              }
            </div>
          }

          @if (item.mediaType === 'carousel') {
            <div class="carousel-indicator">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                <path d="M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm-6 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
            </div>
          }

          <div class="grid-overlay">
            <div class="overlay-stats">
              <span class="overlay-stat">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938z"/>
                </svg>
                {{ item.likeCount | shortNumber }}
              </span>
              <span class="overlay-stat">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22z"/>
                </svg>
                {{ item.commentCount | shortNumber }}
              </span>
            </div>
          </div>
        </div>
      }

      @if (loading) {
        @for (i of [1,2,3,4,5,6]; track i) {
          <div class="grid-item skeleton-item">
            <app-skeleton width="100%" height="100%" borderRadius="0" />
          </div>
        }
      }
    </div>

    @if (hasMore && !loading) {
      <div class="load-trigger" appIntersectionObserver (intersecting)="loadMore.emit()"></div>
    }

    @if (!loading && items.length === 0) {
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 96 96" width="62" height="62">
            <circle cx="48" cy="48" r="47" fill="none" stroke="var(--text-primary, #262626)" stroke-width="2"/>
            <path d="M48 26v44M26 48h44" stroke="var(--text-primary, #262626)" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3 class="empty-title">No Content Yet</h3>
      </div>
    }
  `,
  styleUrl: './content-grid.scss',
})
export class ContentGridComponent {
  @Input() items: MediaItem[] = [];
  @Input() loading = false;
  @Input() hasMore = false;
  @Input() activeTab: ContentTab = 'posts';
  @Output() loadMore = new EventEmitter<void>();
  @Output() postClick = new EventEmitter<MediaItem>();
  @Output() reelClick = new EventEmitter<number>();

  onItemClick(item: MediaItem, index: number): void {
    if (this.activeTab === 'reels') {
      this.reelClick.emit(index);
    } else {
      this.postClick.emit(item);
    }
  }
}
