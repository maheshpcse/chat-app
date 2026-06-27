import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { ConversationService } from '../../core/services/conversation.service';
import { IUser } from '../../core/models/user.model';
// conversation model not needed here

/**
 * NewConversationComponent - Search users and start a new private conversation.
 *
 * Angular Concepts Used:
 * - FormControl standalone (not part of FormGroup)
 * - Subject with debounceTime + distinctUntilChanged + switchMap
 * - RxJS flattening operator (switchMap cancels previous request)
 * - Router navigation after creation
 */
@Component({
  selector: 'app-new-conversation',
  templateUrl: './new-conversation.component.html',
  styleUrls: ['./new-conversation.component.scss']
})
export class NewConversationComponent implements OnInit {

  searchControl = new FormControl('');
  searchResults: IUser[] = [];
  isSearching: boolean = false;
  isCreating: boolean = false;
  private searchSubject = new Subject<string>();

  constructor(
    private userService: UserService,
    private conversationService: ConversationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // RxJS: Subject → debounceTime → distinctUntilChanged → switchMap
    // switchMap cancels previous HTTP request if user types again
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.isSearching = true;
        return this.userService.searchUsers({ search: query, limit: 10 });
      })
    ).subscribe(
      users => {
        this.searchResults = users;
        this.isSearching = false;
      },
      () => {
        this.isSearching = false;
      }
    );

    // Emit search value changes to subject
    this.searchControl.valueChanges.subscribe(value => {
      if (value && value.trim().length >= 2) {
        this.searchSubject.next(value.trim());
      } else {
        this.searchResults = [];
      }
    });
  }

  startConversation(user: IUser): void {
    this.isCreating = true;

    this.conversationService.createConversation({
      participantId: user.userId || user.id
    }).subscribe(
      conversation => {
        this.isCreating = false;
        // Navigate to chat with the new conversation active
        this.router.navigate(['/chat']);
      },
      () => {
        this.isCreating = false;
      }
    );
  }
}
