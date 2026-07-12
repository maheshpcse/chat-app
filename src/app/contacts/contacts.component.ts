import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ContactService } from '../core/services/contact.service';
import { ChatService } from '../core/services/chat.service';
import { PresenceService } from '../core/services/presence.service';
import { IContact } from '../core/models/contact.model';

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
  searchTerm: string = '';
  viewMode: 'list' | 'grid' | 'table' = 'list';
  isLoading: boolean = true;

  private subscription: Subscription;

  constructor(
    private contactService: ContactService,
    private chatService: ChatService,
    private presenceService: PresenceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadContacts(): void {
    this.isLoading = true;
    this.subscription = this.contactService.getContacts().subscribe(
      contacts => {
        this.contacts = contacts;
        this.filteredContacts = contacts;
        this.groupContacts(contacts);
        this.isLoading = false;
      },
      error => {
        console.error('Failed to load contacts:', error);
        this.isLoading = false;
      }
    );
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    if (!term.trim()) {
      this.filteredContacts = this.contacts;
    } else {
      const lower = term.toLowerCase();
      this.filteredContacts = this.contacts.filter(c =>
        c.firstName.toLowerCase().includes(lower) ||
        c.lastName.toLowerCase().includes(lower) ||
        c.username.toLowerCase().includes(lower)
      );
    }
    this.groupContacts(this.filteredContacts);
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
      .map(([letter, contacts]) => ({
        letter,
        contacts: contacts.sort((a, b) => a.firstName.localeCompare(b.firstName))
      }));
  }

  setViewMode(mode: 'list' | 'grid' | 'table'): void {
    this.viewMode = mode;
  }

  startChat(contact: IContact): void {
    this.chatService.startPrivateConversation(contact.contactUserId).subscribe(
      () => this.router.navigate(['/chat']),
      error => console.error('Failed to start conversation:', error)
    );
  }

  isOnline(userId: string): boolean {
    return this.presenceService.isOnline(userId);
  }

  getFullName(contact: IContact): string {
    return `${contact.firstName} ${contact.lastName}`.trim();
  }

  getInitials(contact: IContact): string {
    const first = contact.firstName ? contact.firstName.charAt(0) : '';
    const last = contact.lastName ? contact.lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  }

  getAlphabetLetters(): string[] {
    return this.groupedContacts.map(g => g.letter);
  }

  scrollToLetter(letter: string): void {
    const element = document.getElementById('group-' + letter);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
