import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { GroupService } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import { IGroup, IGroupMember } from '../../core/models/group.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

/**
 * GroupManageComponent - View/manage group details and members.
 *
 * Angular Concepts Used:
 * - ActivatedRoute params (route parameters)
 * - MatDialog for confirmation dialogs
 * - Component method calls
 */
@Component({
  selector: 'app-group-manage',
  templateUrl: './group-manage.component.html',
  styleUrls: ['./group-manage.component.scss']
})
export class GroupManageComponent implements OnInit {

  group: IGroup;
  isOwner: boolean = false;
  isLoading: boolean = true;
  currentUserId: string;

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;
    const groupId = this.route.snapshot.paramMap.get('groupId');
    if (groupId) {
      this.loadGroup(groupId);
    }
  }

  loadGroup(groupId: string): void {
    this.groupService.getGroupById(groupId).subscribe(
      (group) => {
        this.group = group;
        this.isOwner = group.ownerId === this.currentUserId;
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  removeMember(member: IGroupMember): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove Member',
        message: `Are you sure you want to remove ${member.fullName} from the group?`,
        confirmText: 'Remove'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.removeMember(this.group.id, member.userId).subscribe(
          () => {
            this.group.members = this.group.members.filter(m => m.userId !== member.userId);
          }
        );
      }
    });
  }
}
