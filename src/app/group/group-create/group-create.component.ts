import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupService } from '../../core/services/group.service';
import { UserService } from '../../core/services/user.service';
import { IUser } from '../../core/models/user.model';
import { Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

/**
 * GroupCreateComponent - Form to create a new group.
 *
 * Angular Concepts Used:
 * - Reactive Forms with FormBuilder
 * - MatChips for selected members display
 * - MatAutocomplete for user search
 * - Subject with debounceTime + switchMap for search-as-you-type
 * - Array manipulation for member list
 */
@Component({
  selector: 'app-group-create',
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.scss']
})
export class GroupCreateComponent implements OnInit {

  groupForm: FormGroup;
  searchResults: IUser[] = [];
  selectedMembers: IUser[] = [];
  searchSubject = new Subject<string>();
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private groupService: GroupService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });

    // Search users with debounce (RxJS Subject + switchMap)
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(query => this.userService.searchUsers({ search: query }))
    ).subscribe(users => {
      this.searchResults = users.filter(u =>
        !this.selectedMembers.find(m => (m.userId || m.id) === (u.userId || u.id))
      );
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value.trim().length >= 2) {
      this.searchSubject.next(value);
    } else {
      this.searchResults = [];
    }
  }

  addMember(user: IUser): void {
    if (!this.selectedMembers.find(m => m.id === user.id)) {
      this.selectedMembers.push(user);
    }
    this.searchResults = [];
  }

  removeMember(user: IUser): void {
    this.selectedMembers = this.selectedMembers.filter(m => m.id !== user.id);
  }

  onSubmit(): void {
    if (this.groupForm.invalid || this.selectedMembers.length === 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const groupData = {
      ...this.groupForm.value,
      memberIds: this.selectedMembers.map(m => m.id)
    };

    this.groupService.createGroup(groupData).subscribe(
      (group) => {
        this.isLoading = false;
        this.router.navigate(['/groups', group.id]);
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to create group';
      }
    );
  }
}
