import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'stars',
    loadComponent: () => import('./stars/stars'),
  },
  {
    path: '',
    redirectTo: '/stars',
    pathMatch: 'full',
  }
];
