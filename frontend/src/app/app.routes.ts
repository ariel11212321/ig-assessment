import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
  },
  {
    path: 'profile/:username',
    loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
  },
  {
    path: 'hashtag/:tag',
    loadComponent: () => import('./features/hashtag/hashtag').then((m) => m.HashtagComponent),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
