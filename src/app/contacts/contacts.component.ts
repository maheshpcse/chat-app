import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { ContactService } from '../core/services/contact.service';
import { ChatService } from '../core/services/chat.service';
import { PresenceService } from '../core/services/presence.service';
import { SocketService } from '../core/services/socket.service';
import { UserService } from '../core/services/user.service';
import { AuthService } from '../core/services/auth.service';
import { IContact, IContactRequest } from '../core/models/contact.model';
import { IUser } from '../core/models/user.model';
import { withMinLoading, MIN_LOADING_PAGE_MS } from '../shared/utilities/min-loading.util';

/**
 * ContactsComponent - Full contacts page with alphabetical grouping and multi-view modes.
 * Supports List, Grid, and Table views with search filtering.
 */
export interface IContactGroup {
  letter: string;
  contacts: IContact[];
}

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit, OnDestroy {

  contacts: IContact[] = [];
  filteredContacts: IContact[] = [];
  groupedContacts: IContactGroup[] = [];
  searchTerm = '';
  showSearchDropdown = false;
  viewMode: 'list' | 'grid' | 'table' = 'list';
  isLoading = true;

  // Add-people / friend-request state
  showAddPanel = false;
  userSearchQuery = '';
  searchResults: IUser[] = [];
  searching = false;
  receivedRequests: IContactRequest[] = [];
  sentRequests: IContactRequest[] = [];
  private currentUserId: string;
  private userSearchSubject = new Subject<string>();

  private subscription: Subscription;
  private realtimeSubs: Subscription[] = [];

  constructor(
    private contactService: ContactService,
    private chatService: ChatService,
    private presenceService: PresenceService,
    private socketService: SocketService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;
    this.loadContacts();
    this.contactService.getReceivedRequests().subscribe();
    this.contactService.getSentRequests().subscribe();

    // Live request lists (shared service state)
    this.realtimeSubs.push(
      this.contactService.receivedRequests$.subscribe(r => this.receivedRequests = r),
      this.contactService.sentRequests$.subscribe(r => {
        this.sentRequests = r;
        this.buildAndGroup();   // pending (sent) people also appear in the list
      })
    );

    // Keep the contacts page in sync with accept / block / unblock / remove.
    this.realtimeSubs.push(
      this.socketService.contactListUpdated$.subscribe(() => this.loadContacts()),
      this.socketService.contactAccepted$.subscribe(() => { this.loadContacts(); this.refreshRequests(); }),
      this.socketService.contactRequest$.subscribe(() => this.refreshRequests())
    );

    // Debounced user search (only when the Add panel is open)
    this.realtimeSubs.push(
      this.userSearchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query || query.trim().length < 2) {
            this.searching = false;
            this.searchResults = [];
            return [];
          }
          this.searching = true;
          return this.userService.searchUsers({ search: query.trim() });
        })
      ).subscribe(
        (users: IUser[]) => {
          this.searching = false;
          this.searchResults = (users || []).filter(u => (u.userId || u.id) !== this.currentUserId);
        },
        () => { this.searching = false; }
      )
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.realtimeSubs.forEach(s => s.unsubscribe());
  }

  private refreshRequests(): void {
    this.contactService.getReceivedRequests().subscribe();
    this.contactService.getSentRequests().subscribe();
  }

  // ===========================
  // Add People / Friend Requests
  // ===========================

  toggleAddPanel(): void {
    this.showAddPanel = !this.showAddPanel;
    this.userSearchQuery = '';
    this.searchResults = [];
    this.searching = false;
    this.showSearchDropdown = false;
    this.searchTerm = '';
    if (this.showAddPanel) {
      this.refreshRequests();
    } else {
      this.buildAndGroup();
    }
  }

  onUserSearch(query: string): void {
    this.userSearchQuery = query;
    this.userSearchSubject.next(query);
  }

  /** Relation of a searched user relative to me: 'contact' | 'sent' | 'received' | 'none'. */
  getRelation(user: IUser): string {
    const uid = user.userId || user.id;
    if (this.contacts.some(c => c.contactUserId === uid)) { return 'contact'; }
    if (this.sentRequests.some(r => r.receiverUserId === uid)) { return 'sent'; }
    if (this.receivedRequests.some(r => r.senderUserId === uid)) { return 'received'; }
    return 'none';
  }

  sendRequest(user: IUser): void {
    const uid = user.userId || user.id;
    this.contactService.sendRequest(uid).subscribe(
      () => this.refreshRequests(),
      err => console.error('Send request failed:', err)
    );
  }

  acceptRequest(req: IContactRequest): void {
    this.contactService.acceptRequest(req.requestId).subscribe(
      () => { this.refreshRequests(); this.loadContacts(); },
      err => console.error('Accept failed:', err)
    );
  }

  rejectRequest(req: IContactRequest): void {
    this.contactService.rejectRequest(req.requestId).subscribe(
      () => this.refreshRequests(),
      err => console.error('Reject failed:', err)
    );
  }

  cancelRequest(req: IContactRequest): void {
    this.contactService.cancelRequest(req.requestId).subscribe(
      () => {
        this.contactService.removeSentRequest(req.requestId);
        this.refreshRequests();
        this.buildAndGroup();
      },
      err => console.error('Cancel failed:', err)
    );
  }

  /** Withdraw pending request from list/grid/table pending row. */
  withdrawPendingContact(contact: IContact, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.isPending(contact) || !contact.contactId) {
      return;
    }
    this.contactService.cancelRequest(contact.contactId).subscribe(
      () => {
        this.contactService.removeSentRequest(contact.contactId);
        this.refreshRequests();
        this.buildAndGroup();
      },
      err => console.error('Withdraw failed:', err)
    );
  }

  getUserFullName(user: IUser): string {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
  }

  togglePin(contact: IContact): void {
    const pinned = !contact.pinned;
    contact.pinned = pinned; // optimistic
    this.contactService.updateContactSettings(contact.contactUserId, { pinned }).subscribe(
      () => this.groupContacts(this.contacts),
      () => { contact.pinned = !pinned; } // revert on error
    );
  }

  toggleMute(contact: IContact): void {
    const muted = !contact.muted;
    contact.muted = muted; // optimistic
    this.contactService.updateContactSettings(contact.contactUserId, { muted }).subscribe(
      () => {},
      () => { contact.muted = !muted; } // revert on error
    );
  }

  private loadContacts(): void {
    this.isLoading = true;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = withMinLoading(
      this.contactService.getContacts().pipe(catchError(err => {
        console.error('Failed to load contacts:', err);
        return of([] as IContact[]);
      })),
      MIN_LOADING_PAGE_MS
    ).subscribe(contacts => {
      this.contacts = contacts || [];
      this.buildAndGroup();
      this.isLoading = false;
    });
  }

  /** Accepted contacts + pending (sent-request) people, grouped for display. */
  private buildAndGroup(): void {
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

    // Avoid duplicates if a pending person somehow also appears as a contact.
    const acceptedIds = new Set(this.contacts.map(c => c.contactUserId));
    const merged = [...this.contacts, ...pending.filter(p => !acceptedIds.has(p.contactUserId))];

    // filteredContacts drives list/grid/table + autocomplete — must apply search
    const filtered = this.searchTerm
      ? this.applyTextFilter(merged, this.searchTerm)
      : merged;
    this.filteredContacts = filtered;
    this.groupContacts(filtered);
  }

  private applyTextFilter(list: IContact[], term: string): IContact[] {
    const lower = (term || '').toLowerCase().trim();
    if (!lower) { return list; }
    return list.filter(c => {
      const first = (c.firstName || '').toLowerCase();
      const last = (c.lastName || '').toLowerCase();
      const user = (c.username || '').toLowerCase();
      const full = `${first} ${last}`.trim();
      return first.includes(lower)
        || last.includes(lower)
        || user.includes(lower)
        || full.includes(lower);
    });
  }

  isPending(contact: IContact): boolean {
    return contact.status === 'pending';
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.showSearchDropdown = true;
    this.buildAndGroup();
  }

  onSearchBlur(): void {
    // Small delay so mousedown on dropdown items fires before hiding
    setTimeout(() => this.showSearchDropdown = false, 200);
  }

  private groupContacts(contacts: IContact[]): void {
    const map = new Map<string, IContact[]>();

    contacts.forEach(contact => {
      const letter = (contact.firstName || contact.username || '?').charAt(0).toUpperCase();
      if (!map.has(letter)) {
        map.set(letter, []);
      }
      map.get(letter).push(contact);
    });

    // Sort by letter
    this.groupedContacts = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, letterContacts]) => ({
        letter,
        contacts: letterContacts.sort((a, b) => a.firstName.localeCompare(b.firstName))
      }));
  }

  setViewMode(mode: 'list' | 'grid' | 'table'): void {
    this.viewMode = mode;
  }

  startChat(contact: IContact): void {
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
      () => this.router.navigate(['/chat']),
      error => console.error('Failed to start conversation:', error)
    );
  }

  isOnline(userId?: string | null): boolean {
    if (userId == null || userId === '') { return false; }
    return this.presenceService.isOnline(String(userId));
  }

  getFullName(contact: IContact): string {
    return `${contact.firstName} ${contact.lastName}`.trim();
  }

  getInitials(contact: IContact): string {
    const first = contact.firstName ? contact.firstName.charAt(0) : '';
    const last = contact.lastName ? contact.lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  }

}
