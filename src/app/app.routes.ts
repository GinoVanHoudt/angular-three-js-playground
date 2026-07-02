import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'stars',
    loadComponent: () => import('./stars'),
  },
  {
    path: '',
    redirectTo: '/stars',
    pathMatch: 'full',
  }
];
