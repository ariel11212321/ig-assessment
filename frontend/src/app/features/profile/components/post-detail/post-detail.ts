import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { MediaItem, CommentItem } from '../../../../core/models/instagram.models';
import { ApiService } from '../../../../core/services/api.service';
import { VerifiedBadgeComponent } from '../../../../shared/components/verified-badge/verified-badge';
import { ShortNumberPipe } from '../../../../shared/pipes/short-number.pipe';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { CaptionPipe } from '../../../../shared/pipes/caption.pipe';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton';

interface CommentWithReplies extends CommentItem {
  replies: CommentItem[];
  repliesVisible: boolean;
  repliesCursor: string | null;
  repliesHasMore: boolean;
  loadingReplies: boolean;
}

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    VerifiedBadgeComponent,
    ShortNumberPipe,
    TimeAgoPipe,
    CaptionPipe,
    SkeletonComponent,
  ],
  template: `
    <div class="post-detail-overlay" (click)="onOverlayClick($event)">
      <!-- Close button -->
      <button class="close-btn" (click)="close.emit()" aria-label="Close">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      <!-- Previous post arrow -->
      <button class="post-nav post-nav-prev" (click)="onNavigatePost(-1)" aria-label="Previous post">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>

      <!-- Modal content -->
      <div class="post-detail-modal" (click)="$event.stopPropagation()">
        <!-- LEFT: Media display -->
        <div class="media-container">
          @if (post.mediaType === 'carousel' && post.carouselMedia.length > 0) {
            <!-- Carousel -->
            <div class="carousel">
              @for (item of post.carouselMedia; track item.id; let i = $index) {
                @if (i === currentSlideIndex()) {
                  @if (item.mediaType === 'video') {
                    <video
                      [src]="api.getMediaProxyUrl(item.videoUrl || item.mediaUrl)"
                      class="media-content"
                      controls
                      playsinline
                    ></video>
                  } @else {
                    <img
                      [src]="api.getMediaProxyUrl(item.mediaUrl)"
                      [alt]="post.caption || 'Post image'"
                      class="media-content"
                      draggable="false"
                    />
                  }
                }
              }

              @if (currentSlideIndex() > 0) {
                <button class="carousel-nav carousel-nav-left" (click)="prevSlide()" aria-label="Previous slide">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                </button>
              }

              @if (currentSlideIndex() < post.carouselMedia.length - 1) {
                <button class="carousel-nav carousel-nav-right" (click)="nextSlide()" aria-label="Next slide">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                    <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                  </svg>
                </button>
              }

              <!-- Dot indicators -->
              @if (post.carouselMedia.length > 1) {
                <div class="carousel-dots">
                  @for (item of post.carouselMedia; track item.id; let i = $index) {
                    <span
                      class="dot"
                      [class.active]="i === currentSlideIndex()"
                      (click)="currentSlideIndex.set(i)"
                    ></span>
                  }
                </div>
              }
            </div>
          } @else if (post.mediaType === 'video') {
            <!-- Video -->
            <video
              [src]="api.getMediaProxyUrl(post.videoUrl || post.mediaUrl)"
              class="media-content"
              controls
              playsinline
            ></video>
          } @else {
            <!-- Single Image -->
            <img
              [src]="api.getMediaProxyUrl(post.mediaUrl)"
              [alt]="post.caption || 'Post image'"
              class="media-content"
              draggable="false"
            />
          }
        </div>

        <!-- RIGHT: Info panel -->
        <div class="info-panel">
          <!-- Header -->
          <div class="info-header">
            <img
              [src]="api.getMediaProxyUrl(profilePicUrl || post.owner.profilePicUrl)"
              [alt]="username || post.owner.username"
              class="header-avatar"
            />
            <div class="header-user">
              <span class="header-username">{{ username || post.owner.username }}</span>
              @if (post.owner.isVerified) {
                <app-verified-badge size="14" />
              }
            </div>
            <span class="header-timestamp">{{ post.timestamp | timeAgo }}</span>
          </div>

          <!-- Caption & Comments scrollable area -->
          <div class="comments-section">
            <!-- Caption as first "comment" -->
            @if (post.caption) {
              <div class="comment-row caption-row">
                <img
                  [src]="api.getMediaProxyUrl(profilePicUrl || post.owner.profilePicUrl)"
                  [alt]="username || post.owner.username"
                  class="comment-avatar"
                />
                <div class="comment-body">
                  <div class="comment-text">
                    <span class="comment-username">{{ username || post.owner.username }}</span>
                    <span [innerHTML]="post.caption | caption"></span>
                  </div>
                  <div class="comment-meta">
                    <span class="comment-time">{{ post.timestamp | timeAgo }}</span>
                  </div>
                </div>
              </div>
            }

            <!-- Loading skeleton -->
            @if (loadingComments() && comments().length === 0) {
              @for (i of skeletonRows; track i) {
                <div class="comment-row skeleton-row">
                  <app-skeleton width="32px" height="32px" borderRadius="50%" />
                  <div class="comment-body">
                    <app-skeleton width="60%" height="14px" />
                    <app-skeleton width="90%" height="14px" />
                    <app-skeleton width="40%" height="12px" />
                  </div>
                </div>
              }
            }

            <!-- Comments list -->
            @for (comment of comments(); track comment.id) {
              <div class="comment-row">
                <img
                  [src]="api.getMediaProxyUrl(comment.user.profilePicUrl)"
                  [alt]="comment.user.username"
                  class="comment-avatar"
                />
                <div class="comment-body">
                  <div class="comment-text">
                    <span class="comment-username">{{ comment.user.username }}</span>
                    @if (comment.user.isVerified) {
                      <app-verified-badge size="12" />
                    }
                    <span> {{ comment.text }}</span>
                  </div>
                  <div class="comment-meta">
                    <span class="comment-time">{{ comment.timestamp | timeAgo }}</span>
                    @if (comment.likeCount > 0) {
                      <span class="comment-likes">{{ comment.likeCount | shortNumber }} {{ comment.likeCount === 1 ? 'like' : 'likes' }}</span>
                    }
                  </div>

                  <!-- View replies -->
                  @if (comment.replyCount > 0) {
                    @if (!comment.repliesVisible) {
                      <button class="view-replies-btn" (click)="loadReplies(comment)">
                        <span class="replies-line"></span>
                        View replies ({{ comment.replyCount }})
                      </button>
                    } @else {
                      <!-- Replies list -->
                      @for (reply of comment.replies; track reply.id) {
                        <div class="comment-row reply-row">
                          <img
                            [src]="api.getMediaProxyUrl(reply.user.profilePicUrl)"
                            [alt]="reply.user.username"
                            class="comment-avatar reply-avatar"
                          />
                          <div class="comment-body">
                            <div class="comment-text">
                              <span class="comment-username">{{ reply.user.username }}</span>
                              @if (reply.user.isVerified) {
                                <app-verified-badge size="12" />
                              }
                              <span> {{ reply.text }}</span>
                            </div>
                            <div class="comment-meta">
                              <span class="comment-time">{{ reply.timestamp | timeAgo }}</span>
                              @if (reply.likeCount > 0) {
                                <span class="comment-likes">{{ reply.likeCount | shortNumber }} {{ reply.likeCount === 1 ? 'like' : 'likes' }}</span>
                              }
                            </div>
                          </div>
                        </div>
                      }

                      @if (comment.loadingReplies) {
                        <div class="loading-indicator replies-loading">
                          <app-skeleton width="80%" height="14px" />
                        </div>
                      }

                      @if (comment.repliesHasMore && !comment.loadingReplies) {
                        <button class="view-replies-btn" (click)="loadMoreReplies(comment)">
                          <span class="replies-line"></span>
                          View more replies
                        </button>
                      }

                      <button class="view-replies-btn" (click)="comment.repliesVisible = false">
                        <span class="replies-line"></span>
                        Hide replies
                      </button>
                    }
                  }
                </div>
              </div>
            }

            <!-- Load more comments -->
            @if (loadingComments() && comments().length > 0) {
              <div class="loading-indicator">
                <app-skeleton width="100%" height="14px" />
              </div>
            }

            @if (commentsHasMore() && !loadingComments()) {
              <button class="load-more-btn" (click)="loadMoreComments()">
                Load more comments
              </button>
            }
          </div>

          <!-- Bottom bar -->
          <div class="info-bottom">
            <div class="engagement-stats">
              <span class="stat-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--text-primary)">
                  <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938z"/>
                </svg>
                <strong>{{ post.likeCount | shortNumber }}</strong> {{ post.likeCount === 1 ? 'like' : 'likes' }}
              </span>
              <span class="stat-item">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--text-primary)">
                  <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22z"/>
                </svg>
                <strong>{{ post.commentCount | shortNumber }}</strong> {{ post.commentCount === 1 ? 'comment' : 'comments' }}
              </span>
              @if (post.viewCount) {
                <span class="stat-item">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--text-primary)">
                    <path d="M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462z"/>
                  </svg>
                  <strong>{{ post.viewCount | shortNumber }}</strong> views
                </span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Next post arrow -->
      <button class="post-nav post-nav-next" (click)="onNavigatePost(1)" aria-label="Next post">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
        </svg>
      </button>
    </div>
  `,
  styleUrl: './post-detail.scss',
})
export class PostDetailComponent implements OnInit, OnDestroy {
  @Input({ required: true }) post!: MediaItem;
  @Input() username: string = '';
  @Input() profilePicUrl: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() navigatePost = new EventEmitter<number>();

  readonly api = inject(ApiService);

  currentSlideIndex = signal(0);
  comments = signal<CommentWithReplies[]>([]);
  loadingComments = signal(false);
  commentsHasMore = signal(false);
  commentsCursor = signal<string | null>(null);

  readonly skeletonRows = [0, 1, 2, 3];

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.loadComments();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (this.isCarousel() && this.currentSlideIndex() > 0) {
        this.prevSlide();
      } else if (!this.isCarousel() || this.currentSlideIndex() === 0) {
        this.onNavigatePost(-1);
      }
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (this.isCarousel() && this.currentSlideIndex() < this.post.carouselMedia.length - 1) {
        this.nextSlide();
      } else if (!this.isCarousel() || this.currentSlideIndex() === this.post.carouselMedia.length - 1) {
        this.onNavigatePost(1);
      }
      return;
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onNavigatePost(direction: number): void {
    this.navigatePost.emit(direction);
  }

  // Carousel navigation
  prevSlide(): void {
    this.currentSlideIndex.update((i) => Math.max(0, i - 1));
  }

  nextSlide(): void {
    this.currentSlideIndex.update((i) =>
      Math.min(this.post.carouselMedia.length - 1, i + 1)
    );
  }

  // Comments
  loadComments(): void {
    this.loadingComments.set(true);
    this.api.getMediaComments(this.post.shortcode || this.post.id).subscribe({
      next: (res) => {
        const enriched = res.items.map((c) => this.enrichComment(c));
        this.comments.set(enriched);
        this.commentsCursor.set(res.nextCursor);
        this.commentsHasMore.set(res.hasMore);
        this.loadingComments.set(false);
      },
      error: () => {
        this.loadingComments.set(false);
      },
    });
  }

  loadMoreComments(): void {
    const cursor = this.commentsCursor();
    if (!cursor) return;
    this.loadingComments.set(true);
    this.api.getMediaComments(this.post.shortcode || this.post.id, cursor).subscribe({
      next: (res) => {
        const enriched = res.items.map((c) => this.enrichComment(c));
        this.comments.update((prev) => [...prev, ...enriched]);
        this.commentsCursor.set(res.nextCursor);
        this.commentsHasMore.set(res.hasMore);
        this.loadingComments.set(false);
      },
      error: () => {
        this.loadingComments.set(false);
      },
    });
  }

  loadReplies(comment: CommentWithReplies): void {
    comment.repliesVisible = true;
    comment.loadingReplies = true;
    this.api.getCommentReplies(comment.id).subscribe({
      next: (res) => {
        comment.replies = res.items;
        comment.repliesCursor = res.nextCursor;
        comment.repliesHasMore = res.hasMore;
        comment.loadingReplies = false;
      },
      error: () => {
        comment.loadingReplies = false;
      },
    });
  }

  loadMoreReplies(comment: CommentWithReplies): void {
    if (!comment.repliesCursor) return;
    comment.loadingReplies = true;
    this.api.getCommentReplies(comment.id, comment.repliesCursor).subscribe({
      next: (res) => {
        comment.replies = [...comment.replies, ...res.items];
        comment.repliesCursor = res.nextCursor;
        comment.repliesHasMore = res.hasMore;
        comment.loadingReplies = false;
      },
      error: () => {
        comment.loadingReplies = false;
      },
    });
  }

  private isCarousel(): boolean {
    return this.post.mediaType === 'carousel' && this.post.carouselMedia.length > 0;
  }

  private enrichComment(comment: CommentItem): CommentWithReplies {
    return {
      ...comment,
      replies: [],
      repliesVisible: false,
      repliesCursor: null,
      repliesHasMore: false,
      loadingReplies: false,
    };
  }
}
