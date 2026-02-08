import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchComponent),
  },
  {
    path: 'profile/:username',
    loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
