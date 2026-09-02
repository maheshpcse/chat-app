import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupService } from '../../core/services/group.service';
import { ChatService } from '../../core/services/chat.service';
import { IGroup } from '../../core/models/group.model';
import { ConversationType, IConversation } from '../../core/models/conversation.model';
import { withMinLoading, MIN_LOADING_PAGE_MS } from '../../shared/utilities/min-loading.util';

/**
 * GroupListComponent - Displays user groups with shimmer loading and chat entry.
 */
@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent implements OnInit {

  groups: any[] = [];
  isLoading = true;

  constructor(
    private groupService: GroupService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.isLoading = true;
    withMinLoading(this.groupService.getGroups(), MIN_LOADING_PAGE_MS).subscribe(
      (groups) => {
        this.groups = (groups || []).map(g => this.normalizeGroup(g));
        this.isLoading = false;
      },
      () => {
        this.groups = [];
        this.isLoading = false;
      }
    );
  }

  private normalizeGroup(group: any): any {
    if (!group) { return group; }
    const id = group.id || group.groupId;
    const members = Array.isArray(group.members) ? group.members : [];
    return {
      ...group,
      id,
      members,
      memberCount: group.memberCount != null ? group.memberCount : members.length,
      conversationId: group.conversationId || group.conversation_id
    };
  }

  openGroup(group: IGroup, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!group || !group.id) { return; }
    this.router.navigate(['/groups', group.id]);
  }

  openGroupChat(group: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!group) { return; }
    const conversationId = group.conversationId;
    if (conversationId) {
      const conv: IConversation = {
        conversationId: String(conversationId),
        conversationType: ConversationType.GROUP,
        displayName: group.name,
        avatarUrl: group.avatar || group.avatarUrl,
        lastMessageContent: group.description || ''
      };
      this.chatService.setActiveConversation(conv);
      this.chatService.loadConversations();
      this.router.navigate(['/chat']);
      return;
    }
    this.router.navigate(['/groups', group.id]);
  }

  createGroup(): void {
    this.router.navigate(['/groups/create']);
  }
}
