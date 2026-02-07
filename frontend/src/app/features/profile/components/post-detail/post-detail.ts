import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit,
  HostListener,
  ElementRef,
} from '@angular/core';
import { MediaItem, ProfileInfo, Comment, PaginatedResponse } from '../../../../core/models/instagram.models';
import { ApiService } from '../../../../core/services/api.service';
import { VerifiedBadgeComponent } from '../../../../shared/components/verified-badge/verified-badge';
import { ShortNumberPipe } from '../../../../shared/pipes/short-number.pipe';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { CaptionPipe } from '../../../../shared/pipes/caption.pipe';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [VerifiedBadgeComponent, ShortNumberPipe, TimeAgoPipe, CaptionPipe, SkeletonComponent],
  template: `
    <div class="post-detail-overlay" (click)="onOverlayClick($event)">
      <button class="close-btn" (click)="close.emit()">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      <button class="nav-btn nav-prev" (click)="navigatePost.emit('prev')">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>

      <button class="nav-btn nav-next" (click)="navigatePost.emit('next')">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
      </button>

      <div class="post-detail-modal" (click)="$event.stopPropagation()">
        <div class="post-media">
          @if (post.mediaType === 'carousel' && post.carouselMedia.length > 0) {
            <div class="carousel-container">
              @if (post.carouselMedia[carouselIndex()].mediaType === 'video') {
                <video
                  [src]="post.carouselMedia[carouselIndex()].videoUrl"
                  class="media-content"
                  controls
                  autoplay
                ></video>
              } @else {
                <img
                  [src]="post.carouselMedia[carouselIndex()].mediaUrl"
                  class="media-content"
                  [alt]="post.caption || 'Post image'"
                />
              }

              @if (carouselIndex() > 0) {
                <button class="carousel-nav carousel-prev" (click)="prevCarousel()">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                </button>
              }
              @if (carouselIndex() < post.carouselMedia.length - 1) {
                <button class="carousel-nav carousel-next" (click)="nextCarousel()">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </button>
              }

              <div class="carousel-dots">
                @for (item of post.carouselMedia; track item.id; let i = $index) {
                  <span class="dot" [class.active]="i === carouselIndex()"></span>
                }
              </div>
            </div>
          } @else if (post.mediaType === 'video' && post.videoUrl) {
            <video
              [src]="post.videoUrl"
              class="media-content"
              controls
              autoplay
            ></video>
          } @else {
            <img
              [src]="post.mediaUrl"
              class="media-content"
              [alt]="post.caption || 'Post image'"
            />
          }
        </div>

        <div class="post-sidebar">
          <div class="post-header">
            <img [src]="profile.profilePicUrl" class="post-avatar" [alt]="profile.username" />
            <div class="post-header-info">
              <span class="post-username">
                {{ profile.username }}
                @if (profile.isVerified) {
                  <app-verified-badge size="12" />
                }
              </span>
            </div>
          </div>

          <div class="post-comments-section">
            @if (post.caption) {
              <div class="comment-item caption-item">
                <img [src]="profile.profilePicUrl" class="comment-avatar" [alt]="profile.username" />
                <div class="comment-content">
                  <span class="comment-username">{{ profile.username }}</span>
                  <span class="comment-text" [innerHTML]="post.caption | caption"></span>
                  <div class="comment-meta">
                    <span class="comment-time">{{ post.timestamp | timeAgo }}</span>
                  </div>
                </div>
              </div>
            }

            @if (commentsLoading() && comments().length === 0) {
              @for (i of [1,2,3]; track i) {
                <div class="comment-skeleton">
                  <app-skeleton width="32px" height="32px" borderRadius="50%" />
                  <div class="comment-skeleton-text">
                    <app-skeleton width="200px" height="14px" />
                    <app-skeleton width="120px" height="12px" />
                  </div>
                </div>
              }
            }

            @for (comment of comments(); track comment.id) {
              <div class="comment-item">
                <img [src]="comment.profilePicUrl" class="comment-avatar" [alt]="comment.username" />
                <div class="comment-content">
                  <span class="comment-username">{{ comment.username }}</span>
                  <span class="comment-text" [innerHTML]="comment.text | caption"></span>
                  <div class="comment-meta">
                    <span class="comment-time">{{ comment.createdAt | timeAgo }}</span>
                    @if (comment.likeCount > 0) {
                      <span class="comment-likes">{{ comment.likeCount | shortNumber }} likes</span>
                    }
                    @if (comment.replyCount > 0) {
                      <button
                        class="view-replies-btn"
                        (click)="toggleReplies(comment)"
                      >
                        {{ expandedReplies().has(comment.id) ? 'Hide replies' : 'View replies (' + comment.replyCount + ')' }}
                      </button>
                    }
                  </div>

                  @if (expandedReplies().has(comment.id)) {
                    <div class="replies-section">
                      @for (reply of getReplies(comment.id); track reply.id) {
                        <div class="comment-item reply-item">
                          <img [src]="reply.profilePicUrl" class="comment-avatar" [alt]="reply.username" />
                          <div class="comment-content">
                            <span class="comment-username">{{ reply.username }}</span>
                            <span class="comment-text" [innerHTML]="reply.text | caption"></span>
                            <div class="comment-meta">
                              <span class="comment-time">{{ reply.createdAt | timeAgo }}</span>
                              @if (reply.likeCount > 0) {
                                <span class="comment-likes">{{ reply.likeCount | shortNumber }} likes</span>
                              }
                            </div>
                          </div>
                        </div>
                      }
                      @if (replyHasMore().has(comment.id)) {
                        <button class="load-more-replies" (click)="loadMoreReplies(comment)">
                          Load more replies
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            @if (commentsHasMore() && !commentsLoading()) {
              <button class="load-more-btn" (click)="loadMoreComments()">
                Load more comments
              </button>
            }
          </div>

          <div class="post-actions">
            <div class="post-stats">
              <span class="stat-likes">{{ post.likeCount | shortNumber }} likes</span>
            </div>
            <div class="post-time">{{ post.timestamp | timeAgo }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './post-detail.scss',
})
export class PostDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly elRef = inject(ElementRef);

  @Input({ required: true }) post!: MediaItem;
  @Input({ required: true }) profile!: ProfileInfo;
  @Output() close = new EventEmitter<void>();
  @Output() navigatePost = new EventEmitter<'prev' | 'next'>();

  comments = signal<Comment[]>([]);
  commentsCursor = signal<string | null>(null);
  commentsHasMore = signal(true);
  commentsLoading = signal(false);
  carouselIndex = signal(0);

  expandedReplies = signal<Set<string>>(new Set());
  repliesMap = signal<Map<string, Comment[]>>(new Map());
  replyCursors = signal<Map<string, string | null>>(new Map());
  replyHasMore = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadMoreComments();
    document.body.style.overflow = 'hidden';
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    } else if (event.key === 'ArrowLeft') {
      this.navigatePost.emit('prev');
    } else if (event.key === 'ArrowRight') {
      this.navigatePost.emit('next');
    }
  }

  prevCarousel(): void {
    this.carouselIndex.update((v) => v - 1);
  }

  nextCarousel(): void {
    this.carouselIndex.update((v) => v + 1);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
      document.body.style.overflow = '';
    }
  }

  loadMoreComments(): void {
    this.commentsLoading.set(true);
    this.api.getComments(this.post.shortcode, this.commentsCursor() || undefined).subscribe({
      next: (res) => {
        this.comments.update((prev) => [...prev, ...res.items]);
        this.commentsCursor.set(res.nextCursor);
        this.commentsHasMore.set(res.hasMore);
        this.commentsLoading.set(false);
      },
      error: () => this.commentsLoading.set(false),
    });
  }

  toggleReplies(comment: Comment): void {
    const expanded = new Set(this.expandedReplies());
    if (expanded.has(comment.id)) {
      expanded.delete(comment.id);
      this.expandedReplies.set(expanded);
    } else {
      expanded.add(comment.id);
      this.expandedReplies.set(expanded);
      if (!this.repliesMap().has(comment.id)) {
        this.loadMoreReplies(comment);
      }
    }
  }

  loadMoreReplies(comment: Comment): void {
    const cursor = this.replyCursors().get(comment.id);
    this.api.getCommentReplies(this.post.shortcode, comment.id, cursor || undefined).subscribe({
      next: (res) => {
        const map = new Map(this.repliesMap());
        const existing = map.get(comment.id) || [];
        map.set(comment.id, [...existing, ...res.items]);
        this.repliesMap.set(map);

        const cursors = new Map(this.replyCursors());
        cursors.set(comment.id, res.nextCursor);
        this.replyCursors.set(cursors);

        const hasMore = new Set(this.replyHasMore());
        if (res.hasMore) {
          hasMore.add(comment.id);
        } else {
          hasMore.delete(comment.id);
        }
        this.replyHasMore.set(hasMore);
      },
    });
  }

  getReplies(commentId: string): Comment[] {
    return this.repliesMap().get(commentId) || [];
  }
}
