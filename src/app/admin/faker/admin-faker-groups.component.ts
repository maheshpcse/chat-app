import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { AdminApiService } from '../../core/services/admin-api.service';
import { IFakerPreviewGroup } from '../../core/models/admin.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { withMinLoading } from '../utils/admin-rx.util';

@Component({
  selector: 'app-admin-faker-groups',
  templateUrl: './admin-faker-groups.component.html',
  styleUrls: ['./admin-faker-groups.component.scss']
})
export class AdminFakerGroupsComponent {
  count = 5;
  membersPerGroup = 4;

  previewId: string | null = null;
  groups: IFakerPreviewGroup[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  editingTempId: string | null = null;
  editDraft: Partial<IFakerPreviewGroup> = {};

  constructor(
    private adminApi: AdminApiService,
    private dialog: MatDialog
  ) {}

  generate(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    withMinLoading(this.adminApi.generateGroups({
      count: this.count,
      membersPerGroup: this.membersPerGroup || undefined
    }), 500)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(
        (res) => {
          this.previewId = res.previewId;
          this.groups = res.groups || [];
          this.successMessage = `Generated ${this.groups.length} preview groups (not saved yet)`;
        },
        (err) => {
          this.errorMessage = err.message || 'Generate failed';
        }
      );
  }

  startEdit(group: IFakerPreviewGroup): void {
    this.editingTempId = group.tempId;
    this.editDraft = {
      name: group.name,
      description: group.description || ''
    };
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
      this.adminApi.updateFakerGroup(this.previewId, this.editingTempId, this.editDraft),
      500
    ).pipe(finalize(() => { this.loading = false; })).subscribe(
      (updated) => {
        this.groups = this.groups.map(g => g.tempId === updated.tempId ? updated : g);
        this.cancelEdit();
      },
      (err) => {
        this.errorMessage = err.message || 'Update failed';
      }
    );
  }

  remove(group: IFakerPreviewGroup): void {
    if (!this.previewId) {
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove preview group',
        message: `Remove group "${group.name}" from this preview?`,
        confirmText: 'Remove'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.adminApi.deleteFakerGroup(this.previewId, group.tempId).subscribe(
        () => { this.groups = this.groups.filter(g => g.tempId !== group.tempId); },
        (err) => { this.errorMessage = err.message || 'Delete failed'; }
      );
    });
  }

  regenerate(group: IFakerPreviewGroup): void {
    if (!this.previewId) {
      return;
    }
    this.adminApi.regenerateFakerGroup(this.previewId, group.tempId).subscribe(
      (fresh) => {
        this.groups = this.groups.map(g => g.tempId === fresh.tempId ? fresh : g);
      },
      (err) => {
        this.errorMessage = err.message || 'Regenerate failed';
      }
    );
  }

  discard(): void {
    if (!this.previewId) {
      this.groups = [];
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Discard preview',
        message: 'Discard all preview groups without saving?',
        confirmText: 'Discard'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.adminApi.discardFakerPreview(this.previewId, 'groups').subscribe(
        () => {
          this.previewId = null;
          this.groups = [];
          this.successMessage = 'Preview discarded';
        },
        () => {
          this.previewId = null;
          this.groups = [];
        }
      );
    });
  }

  saveToDb(): void {
    if (!this.previewId || !this.groups.length) {
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Save groups to database',
        message: `Persist ${this.groups.length} preview groups and members?`,
        confirmText: 'Save to database'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';
      withMinLoading(this.adminApi.saveFakerGroups(this.previewId), 500)
        .pipe(finalize(() => { this.saving = false; }))
        .subscribe(
          (res) => {
            this.successMessage = `Saved ${res.saved} groups` + (res.failed ? ` · ${res.failed} failed` : '');
            if (res.saved > 0) {
              this.previewId = null;
              this.groups = [];
            }
          },
          (err) => {
            this.errorMessage = err.message || 'Save failed';
          }
        );
    });
  }

  memberSummary(group: IFakerPreviewGroup): string {
    const members = group.members || [];
    if (!members.length) {
      return '0 members';
    }
    const labels = members.slice(0, 3).map(m => m.label || m.username || m.userId);
    const more = members.length > 3 ? ` +${members.length - 3}` : '';
    return `${members.length}: ${labels.join(', ')}${more}`;
  }

  trackByTempId(_: number, group: IFakerPreviewGroup): string {
    return group.tempId;
  }
}
