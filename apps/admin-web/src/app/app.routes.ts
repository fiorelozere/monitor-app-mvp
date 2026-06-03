import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';

export const appRoutes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: '**', redirectTo: '' },
];
