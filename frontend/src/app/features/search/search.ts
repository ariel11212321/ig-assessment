import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SearchResult } from '../../core/models/instagram.models';
import { VerifiedBadgeComponent } from '../../shared/components/verified-badge/verified-badge';
import { ShortNumberPipe } from '../../shared/pipes/short-number.pipe';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, VerifiedBadgeComponent, ShortNumberPipe, SkeletonComponent],
  template: `
    <div class="search-container">
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
        </svg>
        <input
          type="text"
          class="search-input"
          placeholder="Search"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          (focus)="showDropdown.set(true)"
          (blur)="onBlur()"
        />
        @if (searchQuery) {
          <button class="clear-btn" (mousedown)="clearSearch($event)">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <circle cx="12" cy="12" r="10" fill="#c7c7c7"/>
              <path d="M15.5 8.5l-7 7M8.5 8.5l7 7" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        }
      </div>

      @if (showDropdown()) {
        <div class="search-dropdown">
          @if (loading()) {
            @for (i of [1,2,3,4,5]; track i) {
              <div class="search-result-skeleton">
                <app-skeleton width="44px" height="44px" borderRadius="50%" />
                <div class="skeleton-text">
                  <app-skeleton width="120px" height="14px" />
                  <app-skeleton width="80px" height="12px" />
                </div>
              </div>
            }
          } @else if (results().length > 0) {
            @for (user of results(); track user.userId) {
              <div class="search-result" (mousedown)="selectUser(user)">
                <img
                  [src]="user.profilePicUrl"
                  [alt]="user.username"
                  class="result-avatar"
                  loading="lazy"
                />
                <div class="result-info">
                  <div class="result-username">
                    {{ user.username }}
                    @if (user.isVerified) {
                      <app-verified-badge size="12" />
                    }
                  </div>
                  <div class="result-details">
                    {{ user.fullName }}
                    <span class="result-followers">{{ user.followerCount | shortNumber }} followers</span>
                  </div>
                </div>
              </div>
            }
          } @else if (searchQuery.length > 0 && !loading()) {
            <div class="no-results">No results found.</div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './search.scss'
})
export class SearchComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  searchQuery = '';
  results = signal<SearchResult[]>([]);
  loading = signal(false);
  showDropdown = signal(false);

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => {
        if (!query || query.length < 1) {
          this.loading.set(false);
          return of([]);
        }
        this.loading.set(true);
        return this.api.searchUsers(query);
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
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

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  selectUser(user: SearchResult): void {
    this.showDropdown.set(false);
    this.searchQuery = user.username;
    this.router.navigate(['/profile', user.username]);
  }

  clearSearch(event: MouseEvent): void {
    event.preventDefault();
    this.searchQuery = '';
    this.results.set([]);
  }

  onBlur(): void {
    setTimeout(() => this.showDropdown.set(false), 200);
  }
}
