import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GroupService } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import { PresenceService } from '../../core/services/presence.service';
import { UploadService } from '../../core/services/upload.service';
import { ChatService } from '../../core/services/chat.service';
import { IGroup, IGroupMember } from '../../core/models/group.model';
import { ConversationType, IConversation } from '../../core/models/conversation.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../environments/environment';
import { withMinLoading, MIN_LOADING_PAGE_MS } from '../../shared/utilities/min-loading.util';

@Component({
  selector: 'app-group-manage',
  templateUrl: './group-manage.component.html',
  styleUrls: ['./group-manage.component.scss']
})
export class GroupManageComponent implements OnInit {

  group: IGroup;
  isOwner = false;
  isLoading = true;
  isSavingAvatar = false;
  currentUserId: string;
  private groupId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private authService: AuthService,
    private presenceService: PresenceService,
    private uploadService: UploadService,
    private chatService: ChatService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    if (this.groupId) {
      this.loadGroup(this.groupId);
    } else {
      this.isLoading = false;
    }
  }

  loadGroup(groupId: string): void {
    this.isLoading = true;
    withMinLoading(
      forkJoin({
        group: this.groupService.getGroupById(groupId),
        members: this.groupService.getGroupMembers(groupId).pipe(
          catchError(() => of(null))
        )
      }),
      MIN_LOADING_PAGE_MS
    ).subscribe(
      (result) => {
        const group = this.normalizeGroup(result.group);
        if (result.members && Array.isArray(result.members) && result.members.length) {
          group.members = result.members.map(m => this.normalizeMember(m));
        } else if (Array.isArray(group.members)) {
          group.members = group.members.map(m => this.normalizeMember(m));
        } else {
          group.members = [];
        }
        this.group = group;
        this.isOwner = String(group.ownerId || '') === String(this.currentUserId || '');
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  private normalizeGroup(group: any): IGroup {
    if (!group) { return group; }
    const id = group.id || group.groupId;
    const members = Array.isArray(group.members) ? group.members : [];
    return {
      ...group,
      id,
      members,
      conversationId: group.conversationId || group.conversation_id,
      avatarUrl: group.avatarUrl || group.avatar || '',
      avatar: group.avatar || group.avatarUrl || '',
      ownerId: group.ownerId || group.owner_id || group.createdBy
    } as IGroup;
  }

  private normalizeMember(member: any): IGroupMember {
    if (!member) { return member; }
    const firstName = member.firstName || member.first_name || '';
    const lastName = member.lastName || member.last_name || '';
    const fullName = member.fullName
      || member.displayName
      || (`${firstName} ${lastName}`.trim())
      || member.username
      || 'Member';
    const avatarUrl = member.avatarUrl || member.avatar || member.profileImage || '';
    return {
      ...member,
      userId: member.userId || member.id || member.user_id,
      firstName,
      lastName,
      fullName,
      username: member.username || '',
      avatar: avatarUrl,
      avatarUrl,
      role: member.role || 'member'
    } as IGroupMember;
  }

  memberAvatar(member: IGroupMember): string {
    return (member && (member.avatarUrl || member.avatar)) || '';
  }

  memberName(member: IGroupMember): string {
    if (!member) { return 'Member'; }
    return member.fullName
      || (`${member.firstName || ''} ${member.lastName || ''}`.trim())
      || member.username
      || 'Member';
  }

  groupAvatarSrc(): string {
    if (!this.group) { return ''; }
    const url = this.group.avatarUrl || this.group.avatar;
    if (!url) { return ''; }
    const s = String(url);
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:')) {
      return s;
    }
    return environment.socketUrl + s;
  }

  isMemberOnline(member: IGroupMember): boolean {
    const id = (member as any)?.userId || (member as any)?.id;
    return !!id && this.presenceService.isOnline(String(id));
  }

  backToGroups(): void {
    this.router.navigate(['/groups']);
  }

  openChat(): void {
    if (!this.group) { return; }
    const conversationId = this.group.conversationId;
    if (!conversationId) {
      this.router.navigate(['/chat']);
      return;
    }
    const conv: IConversation = {
      conversationId: String(conversationId),
      conversationType: ConversationType.GROUP,
      displayName: this.group.name,
      avatarUrl: this.group.avatarUrl || this.group.avatar,
      groupId: this.group.id ? String(this.group.id) : undefined,
      lastMessageContent: this.group.description || ''
    };
    this.chatService.setActiveConversation(conv);
    this.chatService.loadConversations();
    this.router.navigate(['/chat']);
  }

  onGroupImageSelected(event: Event): void {
    if (!this.isOwner || !this.group) { return; }
    const input = event.target as HTMLInputElement;
    const file = input && input.files && input.files[0];
    if (!file) { return; }
    this.isSavingAvatar = true;
    // Prefer generic local upload for group image (avatar endpoint mutates user profile)
    this.uploadService.uploadLocal(file).pipe(
      catchError(() => this.uploadService.uploadAvatar(file))
    ).subscribe(
      (res) => {
        const url = (res && (res.url || res.fileUrl)) || '';
        if (!url) {
          this.isSavingAvatar = false;
          if (input) { input.value = ''; }
          return;
        }
        this.groupService.updateGroup(this.group.id, { avatarUrl: url } as any).subscribe(
          (updated) => {
            const normalized = this.normalizeGroup(updated || { ...this.group, avatarUrl: url, avatar: url });
            this.group = {
              ...this.group,
              ...normalized,
              members: this.group.members
            };
            this.isSavingAvatar = false;
            if (input) { input.value = ''; }
          },
          () => {
            this.isSavingAvatar = false;
            if (input) { input.value = ''; }
          }
        );
      },
      () => {
        this.isSavingAvatar = false;
        if (input) { input.value = ''; }
      }
    );
  }

  removeGroupImage(): void {
    if (!this.isOwner || !this.group) { return; }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove group photo',
        message: 'Remove the group image?',
        confirmText: 'Remove'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) { return; }
      this.isSavingAvatar = true;
      this.groupService.updateGroup(this.group.id, { avatarUrl: '' } as any).subscribe(
        (updated) => {
          const normalized = this.normalizeGroup(updated || { ...this.group, avatarUrl: '', avatar: '' });
          this.group = {
            ...this.group,
            ...normalized,
            members: this.group.members,
            avatarUrl: '',
            avatar: ''
          };
          this.isSavingAvatar = false;
        },
        () => { this.isSavingAvatar = false; }
      );
    });
  }

  removeMember(member: IGroupMember): void {
    if (!this.isOwner || !member) { return; }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove Member',
        message: `Are you sure you want to remove ${this.memberName(member)} from the group?`,
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
