import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'stars',
    // Lazily loaded: the Three.js bundle only downloads when this route is visited.
    loadComponent: () => import('./stars').then((m) => m.Stars),
  },
];
