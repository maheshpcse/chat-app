import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { GroupRoutingModule } from './group-routing.module';
import { GroupListComponent } from './group-list/group-list.component';
import { GroupCreateComponent } from './group-create/group-create.component';
import { GroupManageComponent } from './group-manage/group-manage.component';

@NgModule({
  declarations: [
    GroupListComponent,
    GroupCreateComponent,
    GroupManageComponent
  ],
  imports: [
    SharedModule,
    GroupRoutingModule
  ]
})
export class GroupModule {}
