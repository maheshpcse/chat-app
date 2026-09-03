import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { AdminApiService } from '../../core/services/admin-api.service';
import { IFakerLinkUser, IFakerPreviewContact } from '../../core/models/admin.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { withMinLoading } from '../utils/admin-rx.util';
import { readAdminConsolePrefs } from '../utils/admin-console-prefs.util';

@Component({
  selector: 'app-admin-faker-contacts',
  templateUrl: './admin-faker-contacts.component.html',
  styleUrls: ['./admin-faker-contacts.component.scss']
})
export class AdminFakerContactsComponent implements OnInit {
  /** Random generate */
  count = 20;
  mode = 'accepted';
  private confirmBeforeSave = true;

  /** Explicit link: owners × peers */
  linkUserIds: string[] = [];
  linkContactUserIds: string[] = [];
  linkMode = 'accepted';
  linkUsers: IFakerLinkUser[] = [];
  usersLoading = false;
  userSearch = '';
  linking = false;

  previewId: string | null = null;
  contacts: IFakerPreviewContact[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  /** Inline edit row */
  editingTempId: string | null = null;
  editUserId = '';
  editContactUserId = '';
  editMode = 'accepted';

  modeOptions = [
    { value: 'accepted', label: 'Accepted' },
    { value: 'pending', label: 'Pending' }
  ];

  generateModeOptions = [
    { value: '', label: 'Mixed' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'pending', label: 'Pending' }
  ];

  constructor(
    private adminApi: AdminApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const prefs = readAdminConsolePrefs();
    this.count = prefs.defaultFakerCount;
    this.confirmBeforeSave = prefs.confirmBeforeSave;
    this.loadLinkUsers();
  }

  loadLinkUsers(): void {
    this.usersLoading = true;
    this.adminApi.listContactLinkUsers({
      search: this.userSearch || undefined,
      limit: 300
    })
      .pipe(finalize(() => { this.usersLoading = false; }))
      .subscribe(
        (res) => {
          this.linkUsers = res.users || [];
        },
        (err) => {
          this.errorMessage = err.message || 'Failed to load users for linking';
        }
      );
  }

  get estimatedPairs(): number {
    const owners = this.linkUserIds || [];
    const peers = this.linkContactUserIds || [];
    if (!owners.length || !peers.length) {
      return 0;
    }
    let n = 0;
    owners.forEach(a => {
      peers.forEach(b => {
        if (a !== b) {
          n += 1;
        }
      });
    });
    return n;
  }

  compareById(a: string, b: string): boolean {
    return a === b;
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  generate(): void {
    this.loading = true;
    this.clearMessages();
    withMinLoading(this.adminApi.generateContacts({
      count: this.count,
      mode: this.mode || undefined
    }), 500)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(
        (res) => {
          this.previewId = res.previewId;
          this.contacts = res.contacts || [];
          this.editingTempId = null;
          this.successMessage = `Generated ${this.contacts.length} preview contacts (not saved yet)`;
        },
        (err) => {
          this.errorMessage = err.message || 'Generate failed';
        }
      );
  }

  addLinks(): void {
    if (!this.linkUserIds.length || !this.linkContactUserIds.length) {
      this.errorMessage = 'Select at least one user and one contact';
      return;
    }
    if (!this.estimatedPairs) {
      this.errorMessage = 'No valid pairs (user cannot link to self)';
      return;
    }
    this.linking = true;
    this.clearMessages();
    withMinLoading(this.adminApi.linkContacts({
      userIds: this.linkUserIds.slice(),
      contactUserIds: this.linkContactUserIds.slice(),
      mode: this.linkMode || 'accepted',
      previewId: this.previewId || undefined
    }), 400)
      .pipe(finalize(() => { this.linking = false; }))
      .subscribe(
        (res) => {
          this.previewId = res.previewId;
          this.contacts = res.contacts || [];
          this.successMessage = `Added ${res.added} link(s) to preview · ${this.contacts.length} total`;
        },
        (err) => {
          this.errorMessage = err.message || 'Link failed';
        }
      );
  }

  startEdit(item: IFakerPreviewContact): void {
    this.editingTempId = item.tempId;
    this.editUserId = item.userId;
    this.editContactUserId = item.contactUserId;
    this.editMode = item.mode === 'pending' ? 'pending' : 'accepted';
  }

  cancelEdit(): void {
    this.editingTempId = null;
  }

  saveEdit(item: IFakerPreviewContact): void {
    if (!this.previewId || !this.editingTempId) {
      return;
    }
    if (!this.editUserId || !this.editContactUserId) {
      this.errorMessage = 'Both sides required';
      return;
    }
    if (this.editUserId === this.editContactUserId) {
      this.errorMessage = 'User and contact must differ';
      return;
    }
    this.clearMessages();
    this.adminApi.updateFakerContact(this.previewId, item.tempId, {
      userId: this.editUserId,
      contactUserId: this.editContactUserId,
      mode: this.editMode
    }).subscribe(
      (fresh) => {
        this.contacts = this.contacts.map(c => c.tempId === fresh.tempId ? fresh : c);
        this.editingTempId = null;
        this.successMessage = 'Preview contact updated';
      },
      (err) => {
        this.errorMessage = err.message || 'Update failed';
      }
    );
  }

  remove(item: IFakerPreviewContact): void {
    const previewId = this.previewId;
    if (!previewId) {
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove preview contact',
        message: 'Remove this contact pair from the preview?',
        confirmText: 'Remove'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.adminApi.deleteFakerContact(previewId, item.tempId).subscribe(
        () => {
          this.contacts = this.contacts.filter(c => c.tempId !== item.tempId);
          if (this.editingTempId === item.tempId) {
            this.editingTempId = null;
          }
        },
        (err) => { this.errorMessage = err.message || 'Delete failed'; }
      );
    });
  }

  regenerate(item: IFakerPreviewContact): void {
    if (!this.previewId) {
      return;
    }
    this.adminApi.regenerateFakerContact(this.previewId, item.tempId).subscribe(
      (fresh) => {
        this.contacts = this.contacts.map(c => c.tempId === fresh.tempId ? fresh : c);
        if (this.editingTempId === fresh.tempId) {
          this.startEdit(fresh);
        }
      },
      (err) => {
        this.errorMessage = err.message || 'Regenerate failed';
      }
    );
  }

  discard(): void {
    const previewId = this.previewId;
    if (!previewId) {
      this.contacts = [];
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Discard preview',
        message: 'Discard all preview contacts without saving?',
        confirmText: 'Discard'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.adminApi.discardFakerPreview(previewId, 'contacts').subscribe(
        () => {
          this.previewId = null;
          this.contacts = [];
          this.editingTempId = null;
          this.successMessage = 'Preview discarded';
        },
        () => {
          this.previewId = null;
          this.contacts = [];
          this.editingTempId = null;
        }
      );
    });
  }

  saveToDb(): void {
    const previewId = this.previewId;
    if (!previewId || !this.contacts.length) {
      return;
    }
    if (!this.confirmBeforeSave) {
      this.persistContacts(previewId);
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Save contacts to database',
        message: `Persist ${this.contacts.length} preview contacts/friendships?`,
        confirmText: 'Save to database'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.persistContacts(previewId);
    });
  }

  private persistContacts(previewId: string): void {
    this.saving = true;
    this.clearMessages();
    withMinLoading(this.adminApi.saveFakerContacts(previewId), 500)
      .pipe(finalize(() => { this.saving = false; }))
      .subscribe(
        (res) => {
          this.successMessage = `Saved ${res.saved} contacts` + (res.failed ? ` · ${res.failed} failed` : '');
          if (res.saved > 0) {
            this.previewId = null;
            this.contacts = [];
            this.editingTempId = null;
          }
        },
        (err) => {
          this.errorMessage = err.message || 'Save failed';
        }
      );
  }

  trackByTempId(_: number, item: IFakerPreviewContact): string {
    return item.tempId;
  }

  trackByUserId(_: number, u: IFakerLinkUser): string {
    return u.userId;
  }
}
