import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, switchMap, EMPTY } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import {
  ProfileInfo,
  ContactInfo,
} from '../../core/models/instagram.models';
import { ProfileHeaderComponent } from './components/profile-header/profile-header';
import { ContactInfoComponent } from './components/contact-info/contact-info';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ProfileHeaderComponent,
    ContactInfoComponent,
    SkeletonComponent,
  ],
  template: `
    @if (loading()) {
      <div class="profile-skeleton">
        <div class="profile-skeleton-header">
          <app-skeleton width="150px" height="150px" borderRadius="50%" />
          <div class="profile-skeleton-info">
            <app-skeleton width="200px" height="24px" />
            <app-skeleton width="300px" height="20px" />
            <app-skeleton width="250px" height="16px" />
            <app-skeleton width="180px" height="16px" />
          </div>
        </div>
      </div>
    } @else if (profile()) {
      <app-profile-header
        [profile]="profile()!"
        [hasStories]="false"
      />

      <app-contact-info [contacts]="contacts()" />
    }
  `,
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  profile = signal<ProfileInfo | null>(null);
  contacts = signal<ContactInfo>({ emails: [], phones: [], socialLinks: [] });
  loading = signal(true);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const username = params.get('username') || '';
        if (!username) {
          this.loading.set(false);
          return EMPTY;
        }
        this.resetState();
        this.loading.set(true);
        return this.api.getProfile(username);
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
        this.loadContacts(profile.username);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContacts(username: string): void {
    this.api.getContacts(username).subscribe({
      next: (contacts) => this.contacts.set(contacts),
    });
  }

  private resetState(): void {
    this.profile.set(null);
    this.contacts.set({ emails: [], phones: [], socialLinks: [] });
  }
}
