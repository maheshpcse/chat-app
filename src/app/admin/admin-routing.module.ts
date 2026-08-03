import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminGuard } from '../core/guards/admin.guard';
import { AdminGuestGuard } from '../core/guards/admin-guest.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminLoginComponent } from './login/admin-login.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminFakerHubComponent } from './faker/admin-faker-hub.component';
import { AdminFakerUsersComponent } from './faker/admin-faker-users.component';
import { AdminFakerContactsComponent } from './faker/admin-faker-contacts.component';
import { AdminFakerGroupsComponent } from './faker/admin-faker-groups.component';
import { AdminFakerMessagesComponent } from './faker/admin-faker-messages.component';
import { AdminSettingsComponent } from './settings/admin-settings.component';
import { AdminProfileComponent } from './profile/admin-profile.component';

const routes: Routes = [
  {
    path: 'login',
    canActivate: [AdminGuestGuard],
    component: AdminLoginComponent
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'faker', component: AdminFakerHubComponent },
      { path: 'faker/users', component: AdminFakerUsersComponent },
      { path: 'faker/contacts', component: AdminFakerContactsComponent },
      { path: 'faker/groups', component: AdminFakerGroupsComponent },
      { path: 'faker/messages', component: AdminFakerMessagesComponent },
      { path: 'profile', component: AdminProfileComponent },
      { path: 'settings', component: AdminSettingsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
