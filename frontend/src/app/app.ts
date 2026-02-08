import { Component, inject, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SearchComponent } from './features/search/search';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SearchComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  goHome(): void {
    this.router.navigate(['/home']);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  @HostListener('click', ['$event'])
  onGlobalClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Handle clickable @mentions in captions
    const mention = target.getAttribute('data-mention');
    if (mention) {
      event.preventDefault();
      this.router.navigate(['/profile', mention]);
      return;
    }

    // Handle clickable #hashtags in captions
    const hashtag = target.getAttribute('data-hashtag');
    if (hashtag) {
      event.preventDefault();
      this.router.navigate(['/hashtag', hashtag]);
    }
  }
}
