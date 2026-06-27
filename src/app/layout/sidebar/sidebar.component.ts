import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ChatService } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ContactService } from '../../core/services/contact.service';
import { IConversation } from '../../core/models/conversation.model';
import { IUser } from '../../core/models/user.model';
import { IContact, IContactRequest } from '../../core/models/contact.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {

  @Output() minimizedChange = new EventEmitter<boolean>();

  // State
  isMinimized: boolean = false;
  activeTab: 'chats' | 'contacts' | 'requests' | 'search' = 'chats';

  // Conversations
  conversations: IConversation[] = [];
  conversationFilter: string = '';

  // Contacts
  contacts: IContact[] = [];
  onlineUsers: string[] = [];

  // Requests
  receivedRequests: IContactRequest[] = [];
  sentRequests: IContactRequest[] = [];

  // User search
  searchQuery: string = '';
  searchResults: IUser[] = [];
  isSearching: boolean = false;

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];
  private currentUserId: string;

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private userService: UserService,
    private authService: AuthService,
    private contactService: ContactService
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
      this.chatService.conversations$.subscribe(c => this.conversations = c)
    );

    // Subscribe to contacts
    this.subscriptions.push(
      this.contactService.contacts$.subscribe(c => this.contacts = c)
    );

    // Subscribe to requests
    this.subscriptions.push(
      this.contactService.receivedRequests$.subscribe(r => this.receivedRequests = r)
    );
    this.subscriptions.push(
      this.contactService.sentRequests$.subscribe(r => this.sentRequests = r)
    );

    // Subscribe to online users
    this.subscriptions.push(
      this.socketService.onlineUsers$.subscribe(users => this.onlineUsers = users)
    );

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

  setTab(tab: 'chats' | 'contacts' | 'requests' | 'search'): void {
    this.activeTab = tab;
    if (tab === 'search') {
      this.searchQuery = '';
      this.searchResults = [];
    }
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
    this.chatService.setActiveConversation(conversation);
  }

  startChatWithContact(contact: IContact): void {
    this.chatService.startPrivateConversation(contact.contactUserId).subscribe(
      () => this.setTab('chats'),
      (error) => console.error('Failed to start conversation:', error)
    );
  }

  // ===========================
  // Helpers
  // ===========================

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.includes(userId);
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
