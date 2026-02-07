import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton" [style.width]="width" [style.height]="height" [style.borderRadius]="borderRadius">
    </div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--skeleton-base, #efefef) 25%, var(--skeleton-shine, #f5f5f5) 50%, var(--skeleton-base, #efefef) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '16px';
  @Input() borderRadius = '4px';
}
