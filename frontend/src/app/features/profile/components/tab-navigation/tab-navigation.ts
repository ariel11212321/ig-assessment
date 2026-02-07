import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ContentTab } from '../../../../core/models/instagram.models';

@Component({
  selector: 'app-tab-navigation',
  standalone: true,
  template: `
    <div class="tab-navigation">
      <button
        class="tab-btn"
        [class.active]="activeTab === 'posts'"
        (click)="tabChange.emit('posts')"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <rect x="0" y="0" width="7" height="7" rx="1"/>
          <rect x="8.5" y="0" width="7" height="7" rx="1"/>
          <rect x="17" y="0" width="7" height="7" rx="1"/>
          <rect x="0" y="8.5" width="7" height="7" rx="1"/>
          <rect x="8.5" y="8.5" width="7" height="7" rx="1"/>
          <rect x="17" y="8.5" width="7" height="7" rx="1"/>
          <rect x="0" y="17" width="7" height="7" rx="1"/>
          <rect x="8.5" y="17" width="7" height="7" rx="1"/>
          <rect x="17" y="17" width="7" height="7" rx="1"/>
        </svg>
        <span class="tab-label">POSTS</span>
      </button>

      <button
        class="tab-btn"
        [class.active]="activeTab === 'reels'"
        (click)="tabChange.emit('reels')"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm4.3 12.7l-6 4c-.2.1-.3.2-.5.2-.2 0-.3 0-.5-.1-.3-.2-.5-.5-.5-.9V8c0-.4.2-.7.5-.9.3-.2.7-.1 1 .1l6 4c.3.2.4.5.4.8s-.1.5-.4.7z"/>
        </svg>
        <span class="tab-label">REELS</span>
      </button>

      <button
        class="tab-btn"
        [class.active]="activeTab === 'tagged'"
        (click)="tabChange.emit('tagged')"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M10.201 3.797L12 1.997l1.799 1.8a1.59 1.59 0 0 0 1.124.465h2.547a1.591 1.591 0 0 1 1.591 1.591v2.547c0 .422.167.826.466 1.124L21.326 11.323a1.591 1.591 0 0 1 0 2.25l-1.8 1.799a1.59 1.59 0 0 0-.465 1.124v2.547a1.591 1.591 0 0 1-1.591 1.591h-2.547a1.59 1.59 0 0 0-1.124.465l-1.8 1.8a1.591 1.591 0 0 1-2.25 0l-1.799-1.8a1.59 1.59 0 0 0-1.124-.465H4.28a1.591 1.591 0 0 1-1.591-1.591v-2.547a1.59 1.59 0 0 0-.465-1.124l-1.8-1.8a1.591 1.591 0 0 1 0-2.25l1.8-1.798a1.59 1.59 0 0 0 .465-1.124V4.853a1.591 1.591 0 0 1 1.59-1.591h2.548a1.59 1.59 0 0 0 1.124-.465zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
        </svg>
        <span class="tab-label">TAGGED</span>
      </button>
    </div>
  `,
  styleUrl: './tab-navigation.scss',
})
export class TabNavigationComponent {
  @Input({ required: true }) activeTab!: ContentTab;
  @Output() tabChange = new EventEmitter<ContentTab>();
}
