import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, skip } from 'rxjs/operators';
import { ChatService } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ContactService } from '../../core/services/contact.service';
import { PresenceService } from '../../core/services/presence.service';
import { GroupService } from '../../core/services/group.service';
import { ConversationType, IConversation } from '../../core/models/conversation.model';
import { IUser } from '../../core/models/user.model';
import { IContact, IContactRequest } from '../../core/models/contact.model';
import { IGroup } from '../../core/models/group.model';
import { resolveMediaUrl } from '../../shared/utilities/media-url.util';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {

  @Output() minimizedChange = new EventEmitter<boolean>();

  // State
  isMinimized = false;
  activeTab: 'chats' | 'contacts' | 'requests' | 'search' | 'groups' = 'chats';

  // Conversations
  conversations: IConversation[] = [];
  conversationFilter = '';
  isLoadingConversations = true;
  activeConversationId: string | null = null;

  // Contacts
  contacts: IContact[] = [];
  displayContacts: IContact[] = [];
  onlineUsers: string[] = [];

  // Requests
  receivedRequests: IContactRequest[] = [];
  sentRequests: IContactRequest[] = [];

  // Groups (chat sidemenu tab)
  groups: IGroup[] = [];
  groupsFilter = '';
  isLoadingGroups = false;

  // User search
  searchQuery = '';
  searchResults: IUser[] = [];
  isSearching = false;

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];
  private currentUserId: string;

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private userService: UserService,
    private authService: AuthService,
    private contactService: ContactService,
    private presenceService: PresenceService,
    private groupService: GroupService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;

    // Load data
    this.chatService.loadConversations();
    this.contactService.getContacts().subscribe();
    this.contactService.getReceivedRequests().subscribe();
    this.contactService.getSentRequests().subscribe();

    // Subscribe to conversations
    this.subscriptions.push(
      this.chatService.conversations$.pipe(skip(1)).subscribe(c => {
        this.conversations = c;
        this.isLoadingConversations = false;
      })
    );

    // Track active chat for sidemenu highlight / skip re-open
    this.subscriptions.push(
      this.chatService.activeConversation$.subscribe(conv => {
        this.activeConversationId = conv?.conversationId
          ? String(conv.conversationId)
          : null;
      })
    );

    // Subscribe to contacts
    this.subscriptions.push(
      this.contactService.contacts$.subscribe(c => {
        this.contacts = c;
        this.buildDisplayContacts();
      })
    );

    // Subscribe to requests
    this.subscriptions.push(
      this.contactService.receivedRequests$.subscribe(r => this.receivedRequests = r)
    );
    this.subscriptions.push(
      this.contactService.sentRequests$.subscribe(r => {
        this.sentRequests = r;
        this.buildDisplayContacts();
      })
    );

    // PresenceService is source of truth (REST hydrate + sockets); keep list for legacy helpers
    this.subscriptions.push(
      this.presenceService.onlineUsers$.subscribe(set => {
        this.onlineUsers = Array.from(set || []).map(u => String(u));
      })
    );
    this.presenceService.hydrateFromApi();
    this.socketService.getOnlineUsers();

    // Subscribe to real-time contact events
    this.subscriptions.push(
      this.socketService.contactRequest$.subscribe(() => {
        this.contactService.getReceivedRequests().subscribe();
      })
    );
    this.subscriptions.push(
      this.socketService.contactAccepted$.subscribe(() => {
        this.contactService.getContacts().subscribe();
        this.chatService.loadConversations();
      })
    );
    // Block / unblock / remove / accept → keep the accepted-contact list in sync.
    this.subscriptions.push(
      this.socketService.contactListUpdated$.subscribe(() => {
        this.contactService.getContacts().subscribe();
        this.contactService.getReceivedRequests().subscribe();
        this.contactService.getSentRequests().subscribe();
      })
    );
    this.subscriptions.push(
      this.socketService.contactRejected$.subscribe(() => {
        this.contactService.getSentRequests().subscribe();
      })
    );

    // Setup user search with debounce
    this.subscriptions.push(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query || query.trim().length < 2) {
            this.searchResults = [];
            this.isSearching = false;
            return [];
          }
          this.isSearching = true;
          return this.userService.searchUsers({ search: query });
        })
      ).subscribe(users => {
        this.searchResults = (users as IUser[]).filter(u => (u.userId || u.id) !== this.currentUserId);
        this.isSearching = false;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ===========================
  // Minimize / Maximize
  // ===========================

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    this.minimizedChange.emit(this.isMinimized);
  }

  // ===========================
  // Tab Switching
  // ===========================

  setTab(tab: 'chats' | 'contacts' | 'requests' | 'search' | 'groups'): void {
    this.activeTab = tab;
    if (tab === 'search') {
      this.searchQuery = '';
      this.searchResults = [];
    }
    if (tab === 'groups') {
      this.loadGroups();
    }
  }

  loadGroups(): void {
    this.isLoadingGroups = true;
    this.groupService.getGroups().subscribe(
      (groups) => {
        this.groups = (groups || []).map(g => this.normalizeSidebarGroup(g));
        this.isLoadingGroups = false;
      },
      () => {
        this.groups = [];
        this.isLoadingGroups = false;
      }
    );
  }

  private normalizeSidebarGroup(group: any): IGroup {
    if (!group) { return group; }
    return {
      ...group,
      id: group.id || group.groupId,
      conversationId: group.conversationId || group.conversation_id,
      avatarUrl: group.avatarUrl || group.avatar || '',
      avatar: group.avatar || group.avatarUrl || '',
      members: Array.isArray(group.members) ? group.members : []
    } as IGroup;
  }

  filteredGroups(): IGroup[] {
    const q = (this.groupsFilter || '').trim().toLowerCase();
    if (!q) { return this.groups; }
    return this.groups.filter(g => {
      const name = (g.name || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      return name.indexOf(q) >= 0 || desc.indexOf(q) >= 0;
    });
  }

  groupAvatarSrc(group: IGroup): string {
    return resolveMediaUrl(group && (group.avatarUrl || group.avatar));
  }

  openGroupChat(group: IGroup): void {
    if (!group) { return; }
    const conversationId = group.conversationId;
    if (conversationId) {
      const conv: IConversation = {
        conversationId: String(conversationId),
        conversationType: ConversationType.GROUP,
        displayName: group.name,
        avatarUrl: group.avatarUrl || group.avatar,
        groupId: (group.id || (group as any).groupId)
          ? String(group.id || (group as any).groupId)
          : undefined,
        lastMessageContent: group.description || ''
      };
      this.chatService.setActiveConversation(conv);
      this.chatService.loadConversations();
      this.router.navigate(['/chat']);
      return;
    }
    if (group.id) {
      this.router.navigate(['/groups', group.id]);
    }
  }

  manageGroup(group: IGroup, event?: Event): void {
    if (event) { event.stopPropagation(); }
    if (group && group.id) {
      this.router.navigate(['/groups', group.id]);
    }
  }

  createGroupFromSidebar(): void {
    this.router.navigate(['/groups/create']);
  }

  trackByGroupId(index: number, group: IGroup): string {
    return group && group.id ? String(group.id) : String(index);
  }

  memberCount(group: IGroup): number {
    if (!group) { return 0; }
    if ((group as any).memberCount != null) { return (group as any).memberCount; }
    return (group.members && group.members.length) || 0;
  }

  // ===========================
  // Search
  // ===========================

  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  // ===========================
  // Contact Actions
  // ===========================

  sendContactRequest(user: IUser): void {
    this.contactService.sendRequest(user.userId || user.id).subscribe(
      () => {
        this.contactService.getSentRequests().subscribe();
        // Update search results to show "Request Sent"
        this.onSearchInput(this.searchQuery);
      },
      (error) => console.error('Failed to send request:', error)
    );
  }

  acceptRequest(request: IContactRequest): void {
    this.contactService.acceptRequest(request.requestId).subscribe(
      () => {
        this.contactService.removeReceivedRequest(request.requestId);
        this.contactService.getContacts().subscribe();
        this.chatService.loadConversations();
      },
      (error) => console.error('Failed to accept:', error)
    );
  }

  rejectRequest(request: IContactRequest): void {
    this.contactService.rejectRequest(request.requestId).subscribe(
      () => this.contactService.removeReceivedRequest(request.requestId),
      (error) => console.error('Failed to reject:', error)
    );
  }

  cancelRequest(request: IContactRequest): void {
    this.contactService.cancelRequest(request.requestId).subscribe(
      () => this.contactService.removeSentRequest(request.requestId),
      (error) => console.error('Failed to cancel:', error)
    );
  }

  // ===========================
  // Conversation Actions
  // ===========================

  selectConversation(conversation: IConversation): void {
    // Already open — do not re-join room / re-fetch messages
    const clickedId = conversation?.conversationId != null
      ? String(conversation.conversationId)
      : '';
    if (this.activeConversationId && clickedId && clickedId === String(this.activeConversationId)) {
      if (!this.router.url.startsWith('/chat')) {
        this.router.navigate(['/chat']);
      }
      return;
    }
    this.chatService.setActiveConversation(conversation);
    this.router.navigate(['/chat']);
  }

  isConversationActive(conversation: IConversation): boolean {
    if (!this.activeConversationId || !conversation?.conversationId) {
      return false;
    }
    return String(conversation.conversationId) === String(this.activeConversationId);
  }

  startChatWithContact(contact: IContact): void {
    const displayName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
      || contact.username
      || 'Unknown';
    this.chatService.startPrivateConversation(contact.contactUserId, {
      participantId: contact.contactUserId,
      displayName,
      firstName: contact.firstName,
      lastName: contact.lastName,
      username: contact.username,
      avatarUrl: contact.avatarUrl
    }).subscribe(
      () => {
        this.setTab('chats');
        // Navigate to chat page to show the conversation
        this.router.navigate(['/chat']);
      },
      (error) => console.error('Failed to start conversation:', error)
    );
  }

  // ===========================
  // Helpers
  // ===========================

  isUserOnline(userId?: string | null): boolean {
    if (userId == null || userId === '') { return false; }
    return this.presenceService.isOnline(String(userId));
  }

  /**
   * Resolve peer id for private chat list avatars.
   * Prefer participantId; fall back to contact match by display name.
   */
  resolveConversationPeerId(conv: IConversation): string | null {
    if (!conv) { return null; }
    const direct = conv.participantId
      || (conv as any).otherUserId
      || (conv as any).other_user_id
      || (conv as any).contactUserId;
    if (direct != null && direct !== '') {
      return String(direct);
    }
    const name = (conv.displayName || this.chatService.getDisplayName(conv) || '')
      .trim()
      .toLowerCase();
    if (!name) { return null; }
    const hit = (this.contacts || []).find(c => {
      const full = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
      const user = (c.username || '').toLowerCase();
      return (full && full === name) || (user && user === name);
    });
    return hit?.contactUserId != null ? String(hit.contactUserId) : null;
  }

  conversationLabel(conv: IConversation): string {
    return this.chatService.getDisplayName(conv);
  }

  isGroupConversation(conv: IConversation): boolean {
    if (!conv) { return false; }
    const t = (conv.conversationType || (conv as any).type || '').toString().toLowerCase();
    return t === ConversationType.GROUP || t === 'group';
  }

  goToGroups(): void {
    // Full groups page still available; sidemenu uses setTab('groups')
    this.router.navigate(['/groups']);
  }

  /** Merge accepted contacts + pending (sent-request) contacts for display. */
  private buildDisplayContacts(): void {
    const pending: IContact[] = this.sentRequests.map(r => ({
      contactId: r.requestId,
      contactUserId: r.receiverUserId,
      status: 'pending',
      firstName: r.firstName || '',
      lastName: r.lastName || '',
      username: r.username || '',
      avatarUrl: r.avatarUrl,
      createdAt: r.requestedAt
    } as IContact));
    const acceptedIds = new Set(this.contacts.map(c => c.contactUserId));
    this.displayContacts = [
      ...this.contacts,
      ...pending.filter(p => !acceptedIds.has(p.contactUserId))
    ];
  }

  isPending(contact: IContact): boolean {
    return contact.status === 'pending';
  }

  filteredConversations(): IConversation[] {
    if (!this.conversationFilter.trim()) {
      return this.conversations;
    }
    const q = this.conversationFilter.toLowerCase();
    return this.conversations.filter(c => c.displayName?.toLowerCase().includes(q));
  }

  trackByConversationId(index: number, conv: IConversation): string {
    return conv.conversationId;
  }

  trackByContactId(index: number, contact: IContact): string {
    return contact.contactId;
  }

  trackByRequestId(index: number, request: IContactRequest): string {
    return request.requestId;
  }

  trackByUserId(index: number, user: IUser): string {
    return user.userId || user.id;
  }

  get pendingRequestCount(): number {
    return this.receivedRequests.length;
  }
}
