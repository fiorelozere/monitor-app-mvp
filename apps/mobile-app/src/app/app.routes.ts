import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: 'tabs',
    loadChildren: () =>
      import('./pages/tabs/tabs.routes').then((m) => m.tabsRoutes),
  },
  {
    path: 'participant',
    redirectTo: 'tabs/participant',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'tabs/participant',
    pathMatch: 'full',
  },
];
