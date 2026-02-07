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
} from '@angular/core';
import { MediaItem } from '../../../../core/models/instagram.models';
import { ShortNumberPipe } from '../../../../shared/pipes/short-number.pipe';
import { CaptionPipe } from '../../../../shared/pipes/caption.pipe';

@Component({
  selector: 'app-reel-viewer',
  standalone: true,
  imports: [ShortNumberPipe, CaptionPipe],
  template: `
    <div class="reel-viewer-overlay" (click)="onOverlayClick($event)">
      <button class="close-btn" (click)="close.emit()">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      <div class="reel-container" (click)="$event.stopPropagation()">
        <button class="reel-nav reel-nav-up" (click)="navigateReel(-1)">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
        </button>

        <div class="reel-content">
          @if (currentReel(); as reel) {
            <video
              #videoPlayer
              [src]="reel.videoUrl || reel.mediaUrl"
              class="reel-video"
              (click)="togglePlayPause()"
              [muted]="muted()"
              autoplay
              loop
              playsinline
            ></video>

            @if (paused()) {
              <div class="play-overlay" (click)="togglePlayPause()">
                <svg viewBox="0 0 24 24" width="80" height="80" fill="white" opacity="0.8">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            }

            <div class="reel-info">
              <div class="reel-username">
                <img [src]="reel.owner.profilePicUrl" class="reel-avatar" [alt]="reel.owner.username" />
                <span>{{ reel.owner.username }}</span>
              </div>
              @if (reel.caption) {
                <div class="reel-caption" [class.expanded]="captionExpanded()">
                  <span [innerHTML]="reel.caption | caption"></span>
                  @if (!captionExpanded() && reel.caption.length > 100) {
                    <button class="more-btn" (click)="captionExpanded.set(true)">more</button>
                  }
                </div>
              }
            </div>

            <div class="reel-actions">
              <div class="reel-action">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                  <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938z"/>
                </svg>
                <span>{{ reel.likeCount | shortNumber }}</span>
              </div>
              <div class="reel-action">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                  <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22z"/>
                </svg>
                <span>{{ reel.commentCount | shortNumber }}</span>
              </div>
              @if (reel.viewCount) {
                <div class="reel-action">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                    <path d="M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462z"/>
                  </svg>
                  <span>{{ reel.viewCount | shortNumber }}</span>
                </div>
              }
              <div class="reel-action" (click)="toggleMute()">
                @if (muted()) {
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                    <path d="M16.5 12A4.5 4.5 0 0 0 14 8.1V4l-5 4H5v8h4l5 4v-4.1c1.5-.7 2.5-2.2 2.5-3.9zM19 12c0 1.8-.8 3.4-2 4.5l1.4 1.4C20 16.3 21 14.3 21 12s-1-4.3-2.6-5.9L17 7.5c1.2 1.1 2 2.7 2 4.5z" fill="none"/>
                    <path d="M14 4l-5 4H5v8h4l5 4V4zM2 2l20 20" stroke="white" stroke-width="2" fill="none"/>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                    <path d="M14 4l-5 4H5v8h4l5 4V4zm2 4.1c1.5.7 2.5 2.2 2.5 3.9s-1 3.2-2.5 3.9v2.1c2.5-.8 4.5-3.2 4.5-6s-2-5.2-4.5-6v2.1z"/>
                  </svg>
                }
              </div>
            </div>
          }
        </div>

        <button class="reel-nav reel-nav-down" (click)="navigateReel(1)">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styleUrl: './reel-viewer.scss',
})
export class ReelViewerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) reels: MediaItem[] = [];
  @Input({ required: true }) currentIndex = 0;
  @Output() close = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;

  currentReel = signal<MediaItem | null>(null);
  paused = signal(false);
  muted = signal(false);
  captionExpanded = signal(false);

  ngOnInit(): void {
    this.updateCurrentReel();
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateReel(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateReel(1);
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  navigateReel(direction: number): void {
    const newIndex = this.currentIndex + direction;
    if (newIndex >= 0 && newIndex < this.reels.length) {
      this.currentIndex = newIndex;
      this.indexChange.emit(newIndex);
      this.captionExpanded.set(false);
      this.paused.set(false);
      this.updateCurrentReel();
    }
  }

  togglePlayPause(): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video) return;
    if (video.paused) {
      video.play();
      this.paused.set(false);
    } else {
      video.pause();
      this.paused.set(true);
    }
  }

  toggleMute(): void {
    this.muted.update((v) => !v);
  }

  private updateCurrentReel(): void {
    this.currentReel.set(this.reels[this.currentIndex] || null);
  }
}
