import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { NotificationListComponent } from './notification-list/notification-list.component';

@NgModule({
  declarations: [
    NotificationListComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    NotificationListComponent
  ]
})
export class NotificationModule {}
