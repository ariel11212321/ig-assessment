import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  HostListener,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  NgZone,
  inject,
} from '@angular/core';
import { StoryItem } from '../../../../core/models/instagram.models';
import { ApiService } from '../../../../core/services/api.service';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';

const IMAGE_DURATION_MS = 5000;
const PROGRESS_INTERVAL_MS = 50;

@Component({
  selector: 'app-story-viewer',
  standalone: true,
  imports: [TimeAgoPipe],
  template: `
    <div
      class="story-overlay"
      (mousedown)="onHoldStart()"
      (mouseup)="onHoldEnd()"
      (mouseleave)="onHoldEnd()"
      (touchstart)="onHoldStart()"
      (touchend)="onHoldEnd()"
      (touchcancel)="onHoldEnd()"
    >
      <!-- Progress bars -->
      <div class="progress-bar-container">
        @for (item of items; track item.id; let i = $index) {
          <div class="progress-segment">
            <div
              class="progress-fill"
              [style.width.%]="segmentProgress(i)"
            ></div>
          </div>
        }
      </div>

      <!-- Header -->
      <div class="story-header">
        <div class="story-user-info">
          @if (profilePicUrl) {
            <img
              [src]="api.getMediaProxyUrl(profilePicUrl)"
              class="story-avatar"
              [alt]="title"
            />
          }
          <div class="story-user-text">
            <span class="story-username">{{ title }}</span>
            @if (currentItem(); as item) {
              <span class="story-timestamp">{{ item.timestamp | timeAgo }}</span>
            }
          </div>
        </div>

        <div class="story-header-actions">
          @if (currentItem()?.mediaType === 'video') {
            <button class="header-btn mute-btn" (click)="toggleMute(); $event.stopPropagation()">
              @if (muted()) {
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M14 4l-5 4H5v8h4l5 4V4z"/>
                  <line x1="3" y1="3" x2="21" y2="21" stroke="white" stroke-width="2"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M14 4l-5 4H5v8h4l5 4V4zm2 4.1c1.5.7 2.5 2.2 2.5 3.9s-1 3.2-2.5 3.9v2.1c2.5-.8 4.5-3.2 4.5-6s-2-5.2-4.5-6v2.1z"/>
                </svg>
              }
            </button>
          }
          <button class="header-btn close-btn" (click)="close.emit(); $event.stopPropagation()">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Story content -->
      <div class="story-content">
        @if (currentItem(); as item) {
          @if (item.mediaType === 'image') {
            <img
              [src]="api.getMediaProxyUrl(item.mediaUrl)"
              class="story-media story-image"
              [alt]="'Story by ' + title"
              (load)="onImageLoaded()"
            />
          } @else {
            <video
              #videoPlayer
              [src]="api.getMediaProxyUrl(item.videoUrl || item.mediaUrl)"
              class="story-media story-video"
              [muted]="muted()"
              autoplay
              playsinline
              (ended)="onVideoEnded()"
              (loadeddata)="onVideoLoaded()"
            ></video>
          }
        }
      </div>

      <!-- Navigation tap zones -->
      <div class="tap-zones">
        <div class="tap-zone tap-zone-prev" (click)="goToPrevious()"></div>
        <div class="tap-zone tap-zone-next" (click)="goToNext()"></div>
      </div>
    </div>
  `,
  styleUrl: './story-viewer.scss',
})
export class StoryViewerComponent implements OnInit, OnDestroy {
  readonly api = inject(ApiService);
  @Input({ required: true }) items: StoryItem[] = [];
  @Input() title: string = '';
  @Input() profilePicUrl: string = '';
  @Output() close = new EventEmitter<void>();

  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;

  currentIndex = signal(0);
  muted = signal(true);

  private progress = signal(0);
  private isPaused = false;
  private progressTimerId: ReturnType<typeof setInterval> | null = null;
  private isVideoStory = false;

  currentItem = computed(() => {
    const idx = this.currentIndex();
    if (idx >= 0 && idx < this.items.length) {
      return this.items[idx];
    }
    return null;
  });

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.startProgressForCurrentItem();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.clearProgressTimer();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goToPrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.goToNext();
    }
  }

  segmentProgress(index: number): number {
    const current = this.currentIndex();
    if (index < current) return 100;
    if (index > current) return 0;
    return this.progress();
  }

  goToNext(): void {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.items.length) {
      this.close.emit();
      return;
    }
    this.navigateTo(nextIndex);
  }

  goToPrevious(): void {
    const prevIndex = this.currentIndex() - 1;
    if (prevIndex < 0) {
      this.progress.set(0);
      this.restartProgress();
      return;
    }
    this.navigateTo(prevIndex);
  }

  onImageLoaded(): void {
    this.isVideoStory = false;
    this.startImageTimer();
  }

  onVideoLoaded(): void {
    this.isVideoStory = true;
    this.startVideoProgress();
  }

  onVideoEnded(): void {
    this.goToNext();
  }

  toggleMute(): void {
    this.muted.update((v) => !v);
  }

  onHoldStart(): void {
    this.isPaused = true;
    if (this.isVideoStory && this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
    }
  }

  onHoldEnd(): void {
    this.isPaused = false;
    if (this.isVideoStory && this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.play();
    }
  }

  private navigateTo(index: number): void {
    this.clearProgressTimer();
    this.progress.set(0);
    this.currentIndex.set(index);
    this.startProgressForCurrentItem();
  }

  private startProgressForCurrentItem(): void {
    const item = this.items[this.currentIndex()];
    if (!item) return;

    if (item.mediaType === 'video') {
      this.isVideoStory = true;
    } else {
      this.isVideoStory = false;
      this.startImageTimer();
    }
  }

  private startImageTimer(): void {
    this.clearProgressTimer();
    this.progress.set(0);

    const increment = (PROGRESS_INTERVAL_MS / IMAGE_DURATION_MS) * 100;

    this.ngZone.runOutsideAngular(() => {
      this.progressTimerId = setInterval(() => {
        if (this.isPaused) return;

        const newProgress = this.progress() + increment;
        if (newProgress >= 100) {
          this.ngZone.run(() => {
            this.clearProgressTimer();
            this.progress.set(100);
            this.goToNext();
          });
        } else {
          this.ngZone.run(() => {
            this.progress.set(newProgress);
          });
        }
      }, PROGRESS_INTERVAL_MS);
    });
  }

  private startVideoProgress(): void {
    this.clearProgressTimer();
    this.progress.set(0);

    this.ngZone.runOutsideAngular(() => {
      this.progressTimerId = setInterval(() => {
        if (this.isPaused) return;

        const video = this.videoPlayer?.nativeElement;
        if (video && video.duration && isFinite(video.duration)) {
          const pct = (video.currentTime / video.duration) * 100;
          this.ngZone.run(() => {
            this.progress.set(Math.min(pct, 100));
          });
        }
      }, PROGRESS_INTERVAL_MS);
    });
  }

  private restartProgress(): void {
    const item = this.items[this.currentIndex()];
    if (!item) return;

    if (item.mediaType === 'video') {
      const video = this.videoPlayer?.nativeElement;
      if (video) {
        video.currentTime = 0;
        video.play();
      }
      this.startVideoProgress();
    } else {
      this.startImageTimer();
    }
  }

  private clearProgressTimer(): void {
    if (this.progressTimerId !== null) {
      clearInterval(this.progressTimerId);
      this.progressTimerId = null;
    }
  }
}