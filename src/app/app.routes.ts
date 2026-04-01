import { Routes } from '@angular/router';
import { LabelDashboardComponent } from './components/label-dashboard/label-dashboard.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { adminAuthGuard } from './guards/admin-auth.guard';

export const routes: Routes = [
  { path: '', component: LabelDashboardComponent }, // Hoofdscherm (standaard)
  { path: 'admin-login', component: AdminLoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [adminAuthGuard] },
  { path: '**', redirectTo: '' }                   // Catch-all: terug naar start
];
