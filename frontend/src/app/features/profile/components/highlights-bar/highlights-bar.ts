import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HighlightInfo } from '../../../../core/models/instagram.models';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-highlights-bar',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    @if (loading) {
      <div class="highlights-bar">
        <div class="highlights-scroll">
          @for (i of skeletonItems; track i) {
            <div class="highlight-item">
              <div class="highlight-circle skeleton-circle">
                <app-skeleton width="100%" height="100%" borderRadius="50%" />
              </div>
              <div class="highlight-title">
                <app-skeleton width="48px" height="10px" borderRadius="3px" />
              </div>
            </div>
          }
        </div>
      </div>
    } @else if (highlights.length > 0) {
      <div class="highlights-bar">
        <div class="highlights-scroll">
          @for (highlight of highlights; track highlight.id) {
            <button
              class="highlight-item"
              type="button"
              (click)="onHighlightClick(highlight)"
            >
              <div class="highlight-circle">
                <img
                  [src]="highlight.coverUrl"
                  [alt]="highlight.title"
                  class="highlight-cover"
                  loading="lazy"
                />
              </div>
              <span class="highlight-title">{{ highlight.title }}</span>
            </button>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './highlights-bar.scss',
})
export class HighlightsBarComponent {
  @Input() highlights: HighlightInfo[] = [];
  @Input() loading = false;
  @Output() highlightClick = new EventEmitter<HighlightInfo>();

  readonly skeletonItems = [0, 1, 2, 3, 4];

  onHighlightClick(highlight: HighlightInfo): void {
    this.highlightClick.emit(highlight);
  }
}
