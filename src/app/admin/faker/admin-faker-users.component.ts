import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { AdminApiService } from '../../core/services/admin-api.service';
import { IFakerPreviewUser } from '../../core/models/admin.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { withMinLoading } from '../utils/admin-rx.util';

@Component({
  selector: 'app-admin-faker-users',
  templateUrl: './admin-faker-users.component.html',
  styleUrls: ['./admin-faker-users.component.scss']
})
export class AdminFakerUsersComponent {
  count = 10;
  defaultPassword = 'User@12345';
  role = '';
  status = '';

  previewId: string | null = null;
  users: IFakerPreviewUser[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  editingTempId: string | null = null;
  editDraft: Partial<IFakerPreviewUser> = {};

  roleOptions = [
    { value: '', label: 'Mixed' },
    { value: 'user', label: 'User' },
    { value: 'moderator', label: 'Moderator' }
  ];
  statusOptions = [
    { value: '', label: 'Mixed' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];
  editRoleOptions = [
    { value: 'user', label: 'User' },
    { value: 'moderator', label: 'Moderator' }
  ];
  editStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' }
  ];

  constructor(
    private adminApi: AdminApiService,
    private dialog: MatDialog
  ) {}

  generate(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    withMinLoading(this.adminApi.generateUsers({
      count: this.count,
      defaultPassword: this.defaultPassword || undefined,
      role: this.role || undefined,
      status: this.status || undefined
    }), 500)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(
        (res) => {
          this.previewId = res.previewId;
          this.users = res.users || [];
          this.successMessage = `Generated ${this.users.length} preview users (not saved yet)`;
        },
        (err) => {
          this.errorMessage = err.message || 'Generate failed';
        }
      );
  }

  startEdit(user: IFakerPreviewUser): void {
    this.editingTempId = user.tempId;
    this.editDraft = { ...user };
  }

  cancelEdit(): void {
    this.editingTempId = null;
    this.editDraft = {};
  }

  saveEdit(): void {
    if (!this.previewId || !this.editingTempId) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    withMinLoading(
      this.adminApi.updateFakerUser(this.previewId, this.editingTempId, this.editDraft),
      500
    ).pipe(finalize(() => { this.loading = false; })).subscribe(
      (updated) => {
        this.users = this.users.map(u => u.tempId === updated.tempId ? updated : u);
        this.cancelEdit();
      },
      (err) => {
        this.errorMessage = err.message || 'Update failed';
      }
    );
  }

  remove(user: IFakerPreviewUser): void {
    if (!this.previewId) {
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove preview user',
        message: `Remove @${user.username} from this preview?`,
        confirmText: 'Remove'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.adminApi.deleteFakerUser(this.previewId, user.tempId).subscribe(
        () => { this.users = this.users.filter(u => u.tempId !== user.tempId); },
        (err) => { this.errorMessage = err.message || 'Delete failed'; }
      );
    });
  }

  regenerate(user: IFakerPreviewUser): void {
    if (!this.previewId) {
      return;
    }
    this.adminApi.regenerateFakerUser(this.previewId, user.tempId).subscribe(
      (fresh) => {
        this.users = this.users.map(u => u.tempId === fresh.tempId ? fresh : u);
      },
      (err) => {
        this.errorMessage = err.message || 'Regenerate failed';
      }
    );
  }

  discard(): void {
    if (!this.previewId) {
      this.users = [];
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Discard preview',
        message: 'Discard all preview users without saving?',
        confirmText: 'Discard'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.adminApi.discardFakerPreview(this.previewId).subscribe(
        () => {
          this.previewId = null;
          this.users = [];
          this.successMessage = 'Preview discarded';
        },
        () => {
          this.previewId = null;
          this.users = [];
        }
      );
    });
  }

  saveToDb(): void {
    if (!this.previewId || !this.users.length) {
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Save users to database',
        message: `Persist ${this.users.length} preview users to the database? Passwords will be bcrypt-hashed.`,
        confirmText: 'Save to database'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';
      withMinLoading(this.adminApi.saveFakerUsers(this.previewId), 500)
        .pipe(finalize(() => { this.saving = false; }))
        .subscribe(
          (res) => {
            this.successMessage = `Saved ${res.saved} users` + (res.failed ? ` · ${res.failed} failed` : '');
            if (res.saved > 0) {
              this.previewId = null;
              this.users = [];
            }
          },
          (err) => {
            this.errorMessage = err.message || 'Save failed';
          }
        );
    });
  }

  trackByTempId(_: number, user: IFakerPreviewUser): string {
    return user.tempId;
  }
}
