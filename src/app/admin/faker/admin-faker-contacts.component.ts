import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { AdminApiService } from '../../core/services/admin-api.service';
import { IFakerPreviewContact } from '../../core/models/admin.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { withMinLoading } from '../utils/admin-rx.util';

@Component({
  selector: 'app-admin-faker-contacts',
  templateUrl: './admin-faker-contacts.component.html',
  styleUrls: ['./admin-faker-contacts.component.scss']
})
export class AdminFakerContactsComponent {
  count = 20;
  mode = '';

  previewId: string | null = null;
  contacts: IFakerPreviewContact[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  modeOptions = [
    { value: '', label: 'Mixed' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'pending', label: 'Pending' }
  ];

  constructor(
    private adminApi: AdminApiService,
    private dialog: MatDialog
  ) {}

  generate(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    withMinLoading(this.adminApi.generateContacts({
      count: this.count,
      mode: this.mode || undefined
    }), 500)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(
        (res) => {
          this.previewId = res.previewId;
          this.contacts = res.contacts || [];
          this.successMessage = `Generated ${this.contacts.length} preview contacts (not saved yet)`;
        },
        (err) => {
          this.errorMessage = err.message || 'Generate failed';
        }
      );
  }

  remove(item: IFakerPreviewContact): void {
    if (!this.previewId) {
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
      this.adminApi.deleteFakerContact(this.previewId, item.tempId).subscribe(
        () => { this.contacts = this.contacts.filter(c => c.tempId !== item.tempId); },
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
      },
      (err) => {
        this.errorMessage = err.message || 'Regenerate failed';
      }
    );
  }

  discard(): void {
    if (!this.previewId) {
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
      this.adminApi.discardFakerPreview(this.previewId, 'contacts').subscribe(
        () => {
          this.previewId = null;
          this.contacts = [];
          this.successMessage = 'Preview discarded';
        },
        () => {
          this.previewId = null;
          this.contacts = [];
        }
      );
    });
  }

  saveToDb(): void {
    if (!this.previewId || !this.contacts.length) {
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
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';
      withMinLoading(this.adminApi.saveFakerContacts(this.previewId), 500)
        .pipe(finalize(() => { this.saving = false; }))
        .subscribe(
          (res) => {
            this.successMessage = `Saved ${res.saved} contacts` + (res.failed ? ` · ${res.failed} failed` : '');
            if (res.saved > 0) {
              this.previewId = null;
              this.contacts = [];
            }
          },
          (err) => {
            this.errorMessage = err.message || 'Save failed';
          }
        );
    });
  }

  trackByTempId(_: number, item: IFakerPreviewContact): string {
    return item.tempId;
  }
}
