import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ProfileInfo } from '../../../../core/models/instagram.models';
import { ApiService } from '../../../../core/services/api.service';
import { VerifiedBadgeComponent } from '../../../../shared/components/verified-badge/verified-badge';
import { ShortNumberPipe } from '../../../../shared/pipes/short-number.pipe';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [VerifiedBadgeComponent, ShortNumberPipe],
  template: `
    <div class="profile-header">
      <div class="profile-pic-container" (click)="onProfilePicClick()" [class.has-stories]="hasStories">
        <div class="profile-pic-border">
          <img
            [src]="api.getMediaProxyUrl(profile.profilePicUrlHd || profile.profilePicUrl)"
            [alt]="profile.username"
            class="profile-pic"
            loading="lazy"
          />
        </div>
      </div>

      <div class="profile-info">
        <div class="profile-username-row">
          <h2 class="username">
            {{ profile.username }}
            @if (profile.isVerified) {
              <app-verified-badge size="18" />
            }
          </h2>
        </div>

        <div class="profile-stats">
          <div class="stat">
            <span class="stat-value">{{ profile.mediaCount | shortNumber }}</span> posts
          </div>
          <div class="stat">
            <span class="stat-value">{{ profile.followerCount | shortNumber }}</span> followers
          </div>
          <div class="stat">
            <span class="stat-value">{{ profile.followingCount | shortNumber }}</span> following
          </div>
        </div>

        <div class="profile-bio">
          @if (profile.fullName) {
            <div class="full-name">{{ profile.fullName }}</div>
          }
          @if (profile.category) {
            <div class="category">{{ profile.category }}</div>
          }
          @if (profile.biography) {
            <div class="bio-text">{{ profile.biography }}</div>
          }
          @if (profile.externalUrl) {
            <a [href]="profile.externalUrl" class="external-url" target="_blank" rel="noopener">
              {{ getDisplayUrl(profile.externalUrl) }}
            </a>
          }
        </div>
      </div>
    </div>

    <!-- Mobile layout -->
    <div class="profile-header-mobile">
      <div class="mobile-top-row">
        <div class="profile-pic-container" (click)="onProfilePicClick()" [class.has-stories]="hasStories">
          <div class="profile-pic-border">
            <img
              [src]="api.getMediaProxyUrl(profile.profilePicUrlHd || profile.profilePicUrl)"
              [alt]="profile.username"
              class="profile-pic"
              loading="lazy"
            />
          </div>
        </div>
        <div class="mobile-stats">
          <div class="stat">
            <span class="stat-value">{{ profile.mediaCount | shortNumber }}</span>
            <span class="stat-label">posts</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ profile.followerCount | shortNumber }}</span>
            <span class="stat-label">followers</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ profile.followingCount | shortNumber }}</span>
            <span class="stat-label">following</span>
          </div>
        </div>
      </div>
      <div class="mobile-bio">
        <h2 class="username">
          {{ profile.username }}
          @if (profile.isVerified) {
            <app-verified-badge size="14" />
          }
        </h2>
        @if (profile.fullName) {
          <div class="full-name">{{ profile.fullName }}</div>
        }
        @if (profile.category) {
          <div class="category">{{ profile.category }}</div>
        }
        @if (profile.biography) {
          <div class="bio-text">{{ profile.biography }}</div>
        }
        @if (profile.externalUrl) {
          <a [href]="profile.externalUrl" class="external-url" target="_blank" rel="noopener">
            {{ getDisplayUrl(profile.externalUrl) }}
          </a>
        }
      </div>
    </div>
  `,
  styleUrl: './profile-header.scss',
})
export class ProfileHeaderComponent {
  readonly api = inject(ApiService);
  @Input({ required: true }) profile!: ProfileInfo;
  @Input() hasStories = false;
  @Output() profilePicClick = new EventEmitter<void>();

  onProfilePicClick(): void {
    this.profilePicClick.emit();
  }

  getDisplayUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
    } catch {
      return url;
    }
  }
}