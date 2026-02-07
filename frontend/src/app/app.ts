import { Component, inject } from '@angular/core';
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
}
