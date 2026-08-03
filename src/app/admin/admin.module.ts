import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
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

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminLoginComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminFakerHubComponent,
    AdminFakerUsersComponent,
    AdminFakerContactsComponent,
    AdminFakerGroupsComponent,
    AdminFakerMessagesComponent,
    AdminSettingsComponent,
    AdminProfileComponent
  ],
  imports: [
    SharedModule,
    AdminRoutingModule
  ]
})
export class AdminModule {}
