import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GroupService } from '../../core/services/group.service';
import { ChatService } from '../../core/services/chat.service';
import { IGroup } from '../../core/models/group.model';
import { ConversationType, IConversation } from '../../core/models/conversation.model';
import { environment } from '../../../environments/environment';
import { withMinLoading, MIN_LOADING_PAGE_MS } from '../../shared/utilities/min-loading.util';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent implements OnInit {
  groups: any[] = [];
  isLoading = true;
  viewMode: 'list' | 'grid' | 'table' = 'grid';
  filterText = '';

  constructor(
    private groupService: GroupService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void { this.loadGroups(); }

  loadGroups(): void {
    this.isLoading = true;
    withMinLoading(this.groupService.getGroups(), MIN_LOADING_PAGE_MS).subscribe(
      (groups) => {
        this.groups = (groups || []).map(g => this.normalizeGroup(g));
        this.isLoading = false;
      },
      () => { this.groups = []; this.isLoading = false; }
    );
  }

  setViewMode(mode: 'list' | 'grid' | 'table'): void { this.viewMode = mode; }

  get filteredGroups(): any[] {
    const q = (this.filterText || '').trim().toLowerCase();
    if (!q) { return this.groups; }
    return this.groups.filter(g => {
      const name = (g.name || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      return name.indexOf(q) >= 0 || desc.indexOf(q) >= 0;
    });
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
      conversationId: group.conversationId || group.conversation_id,
      avatarUrl: group.avatarUrl || group.avatar || '',
      ownerId: group.ownerId || group.owner_id || group.createdBy
    };
  }

  groupAvatarSrc(group: any): string {
    const url = group && (group.avatarUrl || group.avatar);
    if (!url) { return ''; }
    if (String(url).startsWith('http://') || String(url).startsWith('https://') || String(url).startsWith('blob:')) {
      return String(url);
    }
    return environment.socketUrl + url;
  }

  openGroup(group: IGroup, event?: Event): void {
    if (event) { event.stopPropagation(); }
    if (!group || !group.id) { return; }
    this.router.navigate(['/groups', group.id]);
  }

  openGroupChat(group: any, event?: Event): void {
    if (event) { event.stopPropagation(); }
    if (!group) { return; }
    const conversationId = group.conversationId;
    if (conversationId) {
      const conv: IConversation = {
        conversationId: String(conversationId),
        conversationType: ConversationType.GROUP,
        displayName: group.name,
        avatarUrl: group.avatar || group.avatarUrl,
        groupId: group.id ? String(group.id) : undefined,
        lastMessageContent: group.description || ''
      };
      this.chatService.setActiveConversation(conv);
      this.chatService.loadConversations();
      this.router.navigate(['/chat']);
      return;
    }
    this.router.navigate(['/groups', group.id]);
  }

  createGroup(): void { this.router.navigate(['/groups/create']); }

  memberCount(group: any): number {
    if (!group) { return 0; }
    if (group.memberCount != null) { return group.memberCount; }
    return (group.members && group.members.length) || 0;
  }
}
