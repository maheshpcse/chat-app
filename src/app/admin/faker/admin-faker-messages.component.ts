import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { AdminApiService } from '../../core/services/admin-api.service';
import { IFakerPreviewMessage } from '../../core/models/admin.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { withMinLoading } from '../utils/admin-rx.util';

@Component({
  selector: 'app-admin-faker-messages',
  templateUrl: './admin-faker-messages.component.html',
  styleUrls: ['./admin-faker-messages.component.scss']
})
export class AdminFakerMessagesComponent {
  count = 30;
  messageType = 'text';

  previewId: string | null = null;
  messages: IFakerPreviewMessage[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  typeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'system', label: 'System' }
  ];

  constructor(
    private adminApi: AdminApiService,
    private dialog: MatDialog
  ) {}

  generate(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    withMinLoading(this.adminApi.generateMessages({
      count: this.count,
      messageType: this.messageType || undefined
    }), 500)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(
        (res) => {
          this.previewId = res.previewId;
          this.messages = res.messages || [];
          this.successMessage = `Generated ${this.messages.length} preview messages (not saved yet)`;
        },
        (err) => {
          this.errorMessage = err.message || 'Generate failed';
        }
      );
  }

  remove(item: IFakerPreviewMessage): void {
    if (!this.previewId) {
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove preview message',
        message: 'Remove this message from the preview?',
        confirmText: 'Remove'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.adminApi.deleteFakerMessage(this.previewId, item.tempId).subscribe(
        () => { this.messages = this.messages.filter(m => m.tempId !== item.tempId); },
        (err) => { this.errorMessage = err.message || 'Delete failed'; }
      );
    });
  }

  regenerate(item: IFakerPreviewMessage): void {
    if (!this.previewId) {
      return;
    }
    this.adminApi.regenerateFakerMessage(this.previewId, item.tempId).subscribe(
      (fresh) => {
        this.messages = this.messages.map(m => m.tempId === fresh.tempId ? fresh : m);
      },
      (err) => {
        this.errorMessage = err.message || 'Regenerate failed';
      }
    );
  }

  discard(): void {
    if (!this.previewId) {
      this.messages = [];
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Discard preview',
        message: 'Discard all preview messages without saving?',
        confirmText: 'Discard'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.adminApi.discardFakerPreview(this.previewId, 'messages').subscribe(
        () => {
          this.previewId = null;
          this.messages = [];
          this.successMessage = 'Preview discarded';
        },
        () => {
          this.previewId = null;
          this.messages = [];
        }
      );
    });
  }

  saveToDb(): void {
    if (!this.previewId || !this.messages.length) {
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Save messages to database',
        message: `Persist ${this.messages.length} preview messages?`,
        confirmText: 'Save to database'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';
      withMinLoading(this.adminApi.saveFakerMessages(this.previewId), 500)
        .pipe(finalize(() => { this.saving = false; }))
        .subscribe(
          (res) => {
            this.successMessage = `Saved ${res.saved} messages` + (res.failed ? ` · ${res.failed} failed` : '');
            if (res.saved > 0) {
              this.previewId = null;
              this.messages = [];
            }
          },
          (err) => {
            this.errorMessage = err.message || 'Save failed';
          }
        );
    });
  }

  trackByTempId(_: number, item: IFakerPreviewMessage): string {
    return item.tempId;
  }
}
