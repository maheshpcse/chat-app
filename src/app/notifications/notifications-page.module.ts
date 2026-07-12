import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { NotificationsPageRoutingModule } from './notifications-page-routing.module';
import { NotificationsPageComponent } from './notifications-page.component';

@NgModule({
  declarations: [
    NotificationsPageComponent
  ],
  imports: [
    SharedModule,
    NotificationsPageRoutingModule
  ]
})
export class NotificationsPageModule {}
