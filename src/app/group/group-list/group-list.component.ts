import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../core/services/group.service';
import { IGroup } from '../../core/models/group.model';
import { Router } from '@angular/router';

/**
 * GroupListComponent - Displays user's groups list.
 */
@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent implements OnInit {

  groups: IGroup[] = [];
  isLoading: boolean = true;

  constructor(
    private groupService: GroupService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.groupService.getGroups().subscribe(
      (groups) => {
        this.groups = groups;
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  openGroup(group: IGroup): void {
    this.router.navigate(['/groups', group.id]);
  }

  createGroup(): void {
    this.router.navigate(['/groups/create']);
  }
}
