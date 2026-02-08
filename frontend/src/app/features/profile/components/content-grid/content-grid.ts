import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MediaItem } from '../../../../core/models/instagram.models';
import { ShortNumberPipe } from '../../../../shared/pipes/short-number.pipe';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton';
import { IntersectionObserverDirective } from '../../../../shared/directives/intersection-observer.directive';

@Component({
  selector: 'app-content-grid',
  standalone: true,
  imports: [ShortNumberPipe, SkeletonComponent, IntersectionObserverDirective],
  template: `
    @if (loading && items.length === 0) {
      <!-- Skeleton loading state -->
      <div class="content-grid">
        @for (i of skeletonSlots; track i) {
          <div class="grid-cell skeleton-cell">
            <app-skeleton width="100%" height="100%" borderRadius="0" />
          </div>
        }
      </div>
    } @else if (items.length === 0) {
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" width="48" height="48">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"
                fill="currentColor"/>
        </svg>
        <p class="empty-text">No posts yet</p>
      </div>
    } @else {
      <div class="content-grid">
        @for (item of items; track item.id; let i = $index) {
          <div class="grid-cell" (click)="onItemClick(item, i)">
            <img
              [src]="item.thumbnailUrl"
              [alt]="item.caption || 'Post by ' + item.owner.username"
              class="grid-image"
              loading="lazy"
            />

            <!-- Video/Reel type indicator -->
            @if (item.mediaType === 'video') {
              <div class="type-indicator top-right">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                  <path d="M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462z"/>
                </svg>
                @if (item.viewCount) {
                  <span class="indicator-count">{{ item.viewCount | shortNumber }}</span>
                }
              </div>
            }

            <!-- Carousel type indicator -->
            @if (item.mediaType === 'carousel') {
              <div class="type-indicator top-right">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                  <path d="M19.5 5.5h-3V2a1 1 0 0 0-1-1h-12a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3v3.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-12a1 1 0 0 0-1-1zm-13 9V2.5h11V15h-11zm13 3.5h-11V16h7.5a1 1 0 0 0 1-1V7h2.5v11z"/>
                </svg>
              </div>
            }

            <!-- Hover overlay with engagement stats -->
            <div class="hover-overlay">
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
      </div>

      <!-- Loading indicator for additional pages -->
      @if (loading) {
        <div class="load-more-spinner">
          <div class="spinner"></div>
        </div>
      }

      <!-- Infinite scroll sentinel -->
      @if (hasMore && !loading) {
        <div class="scroll-sentinel" appIntersectionObserver (intersecting)="loadMore.emit()"></div>
      }
    }
  `,
  styleUrl: './content-grid.scss',
})
export class ContentGridComponent {
  @Input() items: MediaItem[] = [];
  @Input() loading = false;
  @Input() hasMore = false;
  @Output() loadMore = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<{ item: MediaItem; index: number }>();

  readonly skeletonSlots = Array.from({ length: 9 }, (_, i) => i);

  onItemClick(item: MediaItem, index: number): void {
    this.itemClick.emit({ item, index });
  }
}
