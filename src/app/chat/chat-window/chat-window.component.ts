import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { PresenceService } from '../../core/services/presence.service';
import { UserService } from '../../core/services/user.service';
import { ContactService } from '../../core/services/contact.service';
import { IMessage, ITypingEvent } from '../../core/models/message.model';
import { IConversation, ConversationType } from '../../core/models/conversation.model';
import { IUser } from '../../core/models/user.model';
import { GroupService } from '../../core/services/group.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: IMessage[] = [];
  activeConversation: IConversation | null = null;
  typingUsers: ITypingEvent[] = [];
  currentUserId: string | null = null;
  showProfileSidebar = false;
  sidebarUser: IUser | null = null;
  groupMembers: any[] = [];

  private subscriptions: Subscription[] = [];
  private shouldScroll = true;
  private isNearBottom = true;

  // Older-message pagination state
  private currentPage = 1;
  isLoadingOlder = false;          // public: drives the in-window top loader
  isInitialLoading = false;        // public: drives the message-area shimmer
  private hasMoreMessages = true;
  private preserveScrollHeight = 0;
  private pendingAnchor = false;   // anchor viewport after older page renders
  private lastScrollTop = 0;       // detect scroll DIRECTION (up vs down)
  private lastLoadTimestamp = 0;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private socketService: SocketService,
    public presenceService: PresenceService,
    private userService: UserService,
    private contactService: ContactService,
    private groupService: GroupService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id || null;

    // Returning to chat-window: recompute Online / last seen from API + sockets
    this.presenceService.hydrateFromApi();
    this.socketService.getOnlineUsers();

    const convSub = this.chatService.activeConversation$.subscribe(conv => {
      this.activeConversation = conv ? this.enrichConversationPeer(conv) : null;
      // Reset pagination whenever the open conversation changes
      this.currentPage = 1;
      this.hasMoreMessages = true;
      this.isLoadingOlder = false;
      this.isInitialLoading = false;
      this.shouldScroll = true;
      this.isNearBottom = true;
      this.lastLoadTimestamp = 0;
      // Peer may change — refresh presence display
      this.presenceService.hydrateFromApi();
      this.cdr.detectChanges();
    });
    this.subscriptions.push(convSub);

    // Presence changes must refresh Online/Offline + avatar badge
    this.subscriptions.push(
      this.presenceService.onlineUsers$.subscribe(() => {
        // Default CD: touch field so template re-evaluates isOtherParticipantOnline()
        this.cdr.detectChanges();
      })
    );

    // Loading states are driven by the chat service's RxJS request pipeline
    // (switchMap-cancelled, finalize-reset) — not by component-side timers.
    this.subscriptions.push(
      this.chatService.messagesLoading$.subscribe(loading => {
        this.isInitialLoading = loading;
        if (!loading) { this.shouldScroll = true; }
      }),
      this.chatService.olderLoading$.subscribe(loading => {
        if (loading) {
          this.isLoadingOlder = true;
        } else if (this.isLoadingOlder) {
          // Request finished: anchor the scroll AFTER the prepended items render.
          this.pendingAnchor = true;
          this.isLoadingOlder = false;
        }
      })
    );

    const msgSub = this.chatService.messages$.subscribe(messages => {
      const previousCount = this.messages.length;
      this.messages = [...messages].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      if (this.isLoadingOlder) {
        // A page of older messages was prepended: keep the viewport anchored.
        this.hasMoreMessages = messages.length > previousCount;
      } else if (this.isNearBottom) {
        this.shouldScroll = true;
      }
    });
    this.subscriptions.push(msgSub);

    const typingSub = this.chatService.typingUsers$.subscribe(users => {
      this.typingUsers = users;
    });
    this.subscriptions.push(typingSub);
  }

  ngAfterViewChecked(): void {
    if (this.pendingAnchor && this.messagesContainer) {
      // Restore scroll position so prepended history doesn't jump the view.
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight - this.preserveScrollHeight;
      this.lastScrollTop = el.scrollTop;
      this.pendingAnchor = false;
    } else if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onScroll(): void {
    if (!this.messagesContainer) { return; }
    const el = this.messagesContainer.nativeElement;
    const threshold = 150;
    this.isNearBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < threshold;

    const scrolledUp = el.scrollTop < this.lastScrollTop - 2;
    this.lastScrollTop = el.scrollTop;

    const isScrollable = el.scrollHeight > el.clientHeight + 40;
    const now = Date.now();

    // User scrolled UP into the top zone → load one older page.
    if (scrolledUp && isScrollable && el.scrollTop < 60 &&
        !this.isLoadingOlder && !this.isInitialLoading &&
        this.hasMoreMessages && this.activeConversation &&
        (now - this.lastLoadTimestamp) > 800) {
      this.lastLoadTimestamp = now;
      this.isLoadingOlder = true;
      this.preserveScrollHeight = el.scrollHeight;
      this.currentPage += 1;
      this.chatService.loadMessages(this.activeConversation.conversationId, this.currentPage);
    }
  }

  isOwnMessage(message: IMessage): boolean {
    if (!message || this.currentUserId == null) { return false; }
    return String(message.senderId) === String(this.currentUserId);
  }

  trackByMessageId(index: number, message: IMessage): string {
    return message.messageId;
  }

  getOtherParticipantName(): string {
    if (!this.activeConversation) { return ''; }
    return this.chatService.getDisplayName(this.activeConversation);
  }

  /** Other user id for private chats (participantId + contact name fallback). */
  getOtherUserId(): string | null {
    const conv = this.activeConversation;
    if (!conv || this.isGroupConversation()) { return null; }

    const direct = conv.participantId
      || (conv as any).otherUserId
      || (conv as any).contactUserId;
    if (direct) { return String(direct); }

    const name = (conv.displayName || '').trim().toLowerCase();
    if (!name) { return null; }
    return this.resolvePeerFromContacts(name);
  }

  private resolvePeerFromContacts(nameLower: string): string | null {
    const list = this.contactService.getContactsSnapshot();
    if (!list.length) { return null; }
    const hit = list.find(c => {
      const full = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
      const user = (c.username || '').toLowerCase();
      return (full && full === nameLower) || (user && user === nameLower);
    });
    return hit?.contactUserId != null ? String(hit.contactUserId) : null;
  }

  private enrichConversationPeer(conv: IConversation): IConversation {
    if (conv.conversationType === ConversationType.GROUP) {
      return conv;
    }
    if (conv.participantId) {
      return { ...conv, participantId: String(conv.participantId) };
    }
    const name = (conv.displayName || '').trim().toLowerCase();
    const peer = name ? this.resolvePeerFromContacts(name) : null;
    return peer ? { ...conv, participantId: peer } : conv;
  }

  isOtherParticipantOnline(): boolean {
    const peerId = this.getOtherUserId();
    if (!peerId) { return false; }
    return this.presenceService.isOnline(peerId);
  }

  /** Open profile sidebar (header avatar / name). Does not toggle closed. */
  openProfileSidebar(): void {
    if (!this.showProfileSidebar) {
      this.toggleProfileSidebar();
      return;
    }
    // Already open — refresh peer data if private chat
    if (this.activeConversation && !this.isGroupConversation()) {
      this.loadPrivateSidebarProfile();
    }
  }

  toggleProfileSidebar(): void {
    this.showProfileSidebar = !this.showProfileSidebar;
    if (this.showProfileSidebar && this.activeConversation) {
      if (this.isGroupConversation()) {
        this.groupService.getGroupMembers(this.activeConversation.conversationId).subscribe(
          (members) => { this.groupMembers = members; },
          () => { this.groupMembers = []; }
        );
      } else {
        this.loadPrivateSidebarProfile();
      }
    }
  }

  /** Load peer profile for private-chat sidebar (soft-fail friendly). */
  private loadPrivateSidebarProfile(): void {
    if (!this.activeConversation || this.isGroupConversation()) {
      return;
    }
    const peerId = this.getOtherUserId() || (
      this.activeConversation.participantId != null
        ? String(this.activeConversation.participantId)
        : null
    );
    if (!peerId) {
      this.sidebarUser = this.buildFallbackSidebarUser();
      return;
    }
    this.userService.getUserById(peerId).subscribe(
      (user) => { this.sidebarUser = user; },
      () => { this.sidebarUser = this.buildFallbackSidebarUser(peerId); }
    );
  }

  /** Sidebar content when GET /users/:id fails or peer id unknown. */
  private buildFallbackSidebarUser(peerId?: string): IUser {
    const conv = this.activeConversation;
    const name = this.getOtherParticipantName();
    const parts = (name || '').trim().split(/\s+/);
    return {
      id: peerId || (conv?.participantId != null ? String(conv.participantId) : ''),
      firstName: conv?.firstName || parts[0] || name || '',
      lastName: conv?.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : ''),
      username: conv?.username || '',
      avatarUrl: conv?.avatarUrl || '',
      email: '',
      fullName: name
    } as IUser;
  }

  isGroupConversation(): boolean {
    return this.activeConversation?.conversationType === ConversationType.GROUP;
  }

  getLastSeenStatus(): string {
    const peerId = this.getOtherUserId();
    if (!peerId) { return 'Offline'; }
    return this.presenceService.getLastSeenDisplay(peerId);
  }

  // ===========================
  // Contact actions (Block / Remove)
  // ===========================

  onBlockContact(): void {
    const contactUserId = this.getOtherUserId() || this.activeConversation?.participantId;
    if (!contactUserId) { return; }
    const name = this.getOtherParticipantName();

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: {
        title: 'Block Contact',
        message: `Block ${name}? They will no longer be able to message you and you will not see their presence.`,
        confirmText: 'Block'
      }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) { return; }
      this.contactService.blockContact(contactUserId).subscribe(
        () => { this.showProfileSidebar = false; },
        () => { /* surfaced by global error handling */ }
      );
    });
  }

  onRemoveContact(): void {
    const contactUserId = this.getOtherUserId() || this.activeConversation?.participantId;
    if (!contactUserId) { return; }
    const name = this.getOtherParticipantName();

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: {
        title: 'Remove Contact',
        message: `Remove ${name} from your contacts? You will need a new accepted request to chat again.`,
        confirmText: 'Remove'
      }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) { return; }
      this.contactService.removeContact(contactUserId).subscribe(
        () => { this.showProfileSidebar = false; },
        () => { /* surfaced by global error handling */ }
      );
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    } catch (err) {}
  }
}
