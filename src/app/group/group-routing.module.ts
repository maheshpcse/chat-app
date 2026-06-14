import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupListComponent } from './group-list/group-list.component';
import { GroupCreateComponent } from './group-create/group-create.component';
import { GroupManageComponent } from './group-manage/group-manage.component';

const routes: Routes = [
  { path: '', component: GroupListComponent },
  { path: 'create', component: GroupCreateComponent },
  { path: ':groupId', component: GroupManageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupRoutingModule {}
