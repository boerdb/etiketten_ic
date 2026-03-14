import { Routes } from '@angular/router';
import { LabelDashboardComponent } from './components/label-dashboard/label-dashboard.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  { path: '', component: LabelDashboardComponent }, // Hoofdscherm (standaard)
  { path: 'admin', component: AdminComponent },     // Beheerscherm
  { path: '**', redirectTo: '' }                   // Catch-all: terug naar start
];
