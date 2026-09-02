import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GroupService } from '../../core/services/group.service';
import { ContactService } from '../../core/services/contact.service';
import { ChatService } from '../../core/services/chat.service';
import { IContact } from '../../core/models/contact.model';
import { ConversationType, IConversation } from '../../core/models/conversation.model';

/**
 * GroupCreateComponent - Create group from accepted friends only.
 */
@Component({
  selector: 'app-group-create',
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.scss']
})
export class GroupCreateComponent implements OnInit, OnDestroy {

  groupForm: FormGroup;
  friends: IContact[] = [];
  searchResults: IContact[] = [];
  selectedMembers: IContact[] = [];
  searchQuery = '';
  isSearching = false;
  isLoading = false;
  isFriendsLoading = true;
  errorMessage = '';
  private searchSubject = new Subject<string>();
  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private groupService: GroupService,
    private contactService: ContactService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });

    this.subs.push(
      this.contactService.contacts$.subscribe(list => {
        this.friends = list || [];
        this.isFriendsLoading = false;
        this.applyFriendFilter(this.searchQuery);
      })
    );

    // Ensure accepted friends loaded
    this.contactService.getContacts().subscribe(
      () => { this.isFriendsLoading = false; },
      () => { this.isFriendsLoading = false; }
    );

    this.subs.push(
      this.searchSubject.pipe(
        debounceTime(250),
        distinctUntilChanged()
      ).subscribe(q => this.applyFriendFilter(q))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  onSearchInput(event: Event): void {
    const value = ((event.target as HTMLInputElement).value || '').trim();
    this.searchQuery = value;
    this.isSearching = value.length >= 1;
    if (value.length < 1) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }
    this.searchSubject.next(value.toLowerCase());
  }

  private applyFriendFilter(query: string): void {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      this.searchResults = [];
      return;
    }
    const selectedIds = new Set(
      this.selectedMembers.map(m => String(m.contactUserId))
    );
    this.searchResults = (this.friends || []).filter(c => {
      const id = String(c.contactUserId || '');
      if (!id || selectedIds.has(id)) { return false; }
      const full = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
      const user = (c.username || '').toLowerCase();
      const nick = (c.nickname || '').toLowerCase();
      return full.indexOf(q) >= 0 || user.indexOf(q) >= 0 || nick.indexOf(q) >= 0;
    });
  }

  displayName(c: IContact): string {
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.username || 'Unknown';
  }

  addMember(contact: IContact): void {
    if (!contact) { return; }
    const id = String(contact.contactUserId);
    if (this.selectedMembers.find(m => String(m.contactUserId) === id)) {
      return;
    }
    this.selectedMembers = [...this.selectedMembers, contact];
    this.searchResults = this.searchResults.filter(m => String(m.contactUserId) !== id);
    this.searchQuery = '';
  }

  removeMember(contact: IContact): void {
    this.selectedMembers = this.selectedMembers.filter(
      m => String(m.contactUserId) !== String(contact.contactUserId)
    );
    this.applyFriendFilter(this.searchQuery);
  }

  onSubmit(): void {
    if (this.groupForm.invalid || this.selectedMembers.length === 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const groupData = {
      name: (this.groupForm.value.name || '').toString().trim(),
      description: (this.groupForm.value.description || '').toString().trim() || undefined,
      memberIds: this.selectedMembers.map(m => String(m.contactUserId))
    };

    this.groupService.createGroup(groupData).subscribe(
      (group) => {
        this.isLoading = false;
        const g: any = group || {};
        const conversationId = g.conversationId || g.conversation_id;
        if (conversationId) {
          const conv: IConversation = {
            conversationId: String(conversationId),
            conversationType: ConversationType.GROUP,
            displayName: g.name || groupData.name,
            avatarUrl: g.avatar || g.avatarUrl,
            lastMessageContent: groupData.description || ''
          };
          this.chatService.setActiveConversation(conv);
          this.chatService.loadConversations();
          this.router.navigate(['/chat']);
          return;
        }
        const id = g.id || g.groupId;
        this.chatService.loadConversations();
        this.router.navigate(id ? ['/groups', id] : ['/groups']);
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to create group';
      }
    );
  }

  // Keep shape helper if template needs IUser-like label
  asUserLabel(c: IContact): string {
    return this.displayName(c);
  }
}
