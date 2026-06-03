import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const tabsRoutes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'participant',
        loadComponent: () =>
          import('../participant/participant.page').then((m) => m.ParticipantPage),
      },
      {
        path: '',
        redirectTo: 'participant',
        pathMatch: 'full',
      },
    ],
  },
];
