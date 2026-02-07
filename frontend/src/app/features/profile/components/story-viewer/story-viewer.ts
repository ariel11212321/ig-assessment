import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  HostListener,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  NgZone,
  inject,
} from '@angular/core';
import { StoryItem } from '../../../../core/models/instagram.models';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-story-viewer',
  standalone: true,
  imports: [TimeAgoPipe],
  template: `
    <div class="story-viewer-overlay" (click)="onOverlayClick($event)">
      <div class="story-container" (click)="$event.stopPropagation()">
        <div class="story-progress">
          @for (item of items; track item.id; let i = $index) {
            <div class="progress-segment">
              <div
                class="progress-fill"
                [style.width]="getProgressWidth(i)"
              ></div>
            </div>
          }
        </div>

        <div class="story-header">
          <img [src]="profilePicUrl" class="story-avatar" [alt]="title" />
          <span class="story-username">{{ title }}</span>
          <span class="story-time">{{ (currentItem()?.timestamp ?? 0) | timeAgo }}</span>
          <button class="story-close" (click)="close.emit()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="story-media-container">
          @if (currentItem(); as item) {
            @if (item.mediaType === 'video' && item.videoUrl) {
              <video
                #videoPlayer
                [src]="item.videoUrl"
                class="story-media"
                autoplay
                playsinline
                (ended)="goNext()"
                (loadedmetadata)="onVideoLoaded($event)"
              ></video>
            } @else {
              <img
                [src]="item.mediaUrl"
                class="story-media"
                [alt]="title"
              />
            }
          }
        </div>

        <div class="story-nav-areas">
          <div class="story-nav-left" (click)="goPrev()"></div>
          <div class="story-nav-right" (click)="goNext()"></div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './story-viewer.scss',
})
export class StoryViewerComponent implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);

  @Input({ required: true }) items: StoryItem[] = [];
  @Input() title = '';
  @Input() profilePicUrl = '';
  @Output() close = new EventEmitter<void>();

  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;

  currentIndex = signal(0);
  currentItem = signal<StoryItem | null>(null);
  progress = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly IMAGE_DURATION = 5000;
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;
  private duration = this.IMAGE_DURATION;

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.showItem(0);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.clearTimers();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    } else if (event.key === 'ArrowLeft') {
      this.goPrev();
    } else if (event.key === 'ArrowRight') {
      this.goNext();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  goNext(): void {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.items.length) {
      this.close.emit();
      return;
    }
    this.showItem(nextIndex);
  }

  goPrev(): void {
    const prevIndex = this.currentIndex() - 1;
    if (prevIndex < 0) return;
    this.showItem(prevIndex);
  }

  onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.duration = video.duration * 1000;
    this.startProgressTimer();
  }

  getProgressWidth(index: number): string {
    const current = this.currentIndex();
    if (index < current) return '100%';
    if (index > current) return '0%';
    return this.progress() + '%';
  }

  private showItem(index: number): void {
    this.clearTimers();
    this.currentIndex.set(index);
    this.currentItem.set(this.items[index]);
    this.progress.set(0);

    const item = this.items[index];
    if (item.mediaType !== 'video') {
      this.duration = this.IMAGE_DURATION;
      this.startProgressTimer();
      this.timer = setTimeout(() => this.goNext(), this.IMAGE_DURATION);
    }
  }

  private startProgressTimer(): void {
    this.startTime = Date.now();
    this.zone.runOutsideAngular(() => {
      this.progressInterval = setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        const pct = Math.min(100, (elapsed / this.duration) * 100);
        this.zone.run(() => this.progress.set(pct));
        if (pct >= 100 && this.progressInterval) {
          clearInterval(this.progressInterval);
        }
      }, 30);
    });
  }

  private clearTimers(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}
