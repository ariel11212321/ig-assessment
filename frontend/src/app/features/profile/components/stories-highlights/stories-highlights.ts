import { Component, Input, Output, EventEmitter } from '@angular/core';
import { StoryItem, Highlight } from '../../../../core/models/instagram.models';

@Component({
  selector: 'app-stories-highlights',
  standalone: true,
  template: `
    @if (highlights.length > 0) {
      <div class="highlights-bar">
        @for (highlight of highlights; track highlight.id; let i = $index) {
          <div class="highlight-item" (click)="highlightClick.emit(i)">
            <div class="highlight-cover">
              <img
                [src]="highlight.coverUrl"
                [alt]="highlight.title"
                loading="lazy"
              />
            </div>
            <span class="highlight-title">{{ highlight.title }}</span>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './stories-highlights.scss',
})
export class StoriesHighlightsComponent {
  @Input() stories: StoryItem[] = [];
  @Input() highlights: Highlight[] = [];
  @Output() storyClick = new EventEmitter<void>();
  @Output() highlightClick = new EventEmitter<number>();
}
