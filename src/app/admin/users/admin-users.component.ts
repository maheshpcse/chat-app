import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { AdminApiService } from '../../core/services/admin-api.service';
import { IAdminManagedUser } from '../../core/models/admin.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { withMinLoading } from '../utils/admin-rx.util';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users: IAdminManagedUser[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  warningMessage = '';

  search = '';
  status = '';
  role = '';
  /** Last filters sent to API (Apply) — used to block no-op Apply/Clear */
  private appliedSearch = '';
  private appliedStatus = '';
  private appliedRole = '';
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;

  readonly limitOptions = [10, 20, 50, 100];

  statusOptions = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'banned', label: 'Banned' },
    { value: 'suspended', label: 'Suspended' }
  ];
  roleOptions = [
    { value: '', label: 'All' },
    { value: 'user', label: 'User' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Admin' }
  ];
  rowStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' }
  ];

  constructor(
    private adminApi: AdminApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get rangeFrom(): number {
    if (!this.total) {
      return 0;
    }
    return (this.page - 1) * this.limit + 1;
  }

  get rangeTo(): number {
    if (!this.total) {
      return 0;
    }
    return Math.min(this.page * this.limit, this.total);
  }

  get pageNumbers(): number[] {
    const maxButtons = 5;
    if (this.totalPages <= maxButtons) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  private normalizeSearch(value: string): string {
    return (value || '').trim();
  }

  private hasDraftFilters(): boolean {
    return !!(this.normalizeSearch(this.search) || this.status || this.role);
  }

  private hasAppliedFilters(): boolean {
    return !!(this.appliedSearch || this.appliedStatus || this.appliedRole);
  }

  private filtersMatchApplied(): boolean {
    return this.normalizeSearch(this.search) === this.appliedSearch
      && this.status === this.appliedStatus
      && this.role === this.appliedRole;
  }

  private clearBanners(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.warningMessage = '';
  }

  private showWarning(message: string): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.warningMessage = message;
  }

  private syncAppliedFromDraft(): void {
    this.appliedSearch = this.normalizeSearch(this.search);
    this.appliedStatus = this.status || '';
    this.appliedRole = this.role || '';
    this.search = this.appliedSearch;
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.warningMessage = '';
    withMinLoading(this.adminApi.listUsers({
      page: this.page,
      limit: this.limit,
      search: this.appliedSearch,
      status: this.appliedStatus,
      role: this.appliedRole
    }), 500)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(
        (res) => {
          this.users = res.users || [];
          const meta: any = res.meta || {};
          const pageMeta = meta.pagination || meta;
          this.total = pageMeta.totalItems || pageMeta.total || 0;
          this.totalPages = pageMeta.totalPages || Math.max(1, Math.ceil(this.total / this.limit) || 1);
          this.page = pageMeta.currentPage || pageMeta.page || this.page;
        },
        (err) => {
          this.errorMessage = err.message || 'Failed to load users';
        }
      );
  }

  onSearch(): void {
    if (!this.hasDraftFilters()) {
      this.showWarning('Select a status/role filter or enter search text before applying.');
      return;
    }
    if (this.filtersMatchApplied()) {
      this.showWarning('Filters already applied. Change search or filters before applying again.');
      return;
    }
    this.clearBanners();
    this.syncAppliedFromDraft();
    this.page = 1;
    this.load();
  }

  clearFilters(): void {
    const draftEmpty = !this.hasDraftFilters();
    const appliedEmpty = !this.hasAppliedFilters();

    // Nothing in form and nothing applied → warn, no API
    if (draftEmpty && appliedEmpty) {
      this.showWarning('No filters selected. Choose filters or enter search text before clearing.');
      return;
    }

    // Draft only (never applied) → reset fields, no API
    if (!draftEmpty && appliedEmpty) {
      this.search = '';
      this.status = '';
      this.role = '';
      this.clearBanners();
      return;
    }

    // Applied filters active (draft may match or differ) → clear + reload once
    this.clearBanners();
    this.search = '';
    this.status = '';
    this.role = '';
    this.appliedSearch = '';
    this.appliedStatus = '';
    this.appliedRole = '';
    this.page = 1;
    this.load();
  }

  onLimitChange(limit: number): void {
    const next = Number(limit) || 10;
    if (next === this.limit) {
      return;
    }
    this.limit = next;
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }
    this.page = page;
    this.load();
  }

  prevPage(): void {
    this.goToPage(this.page - 1);
  }

  nextPage(): void {
    this.goToPage(this.page + 1);
  }

  firstPage(): void {
    this.goToPage(1);
  }

  lastPage(): void {
    this.goToPage(this.totalPages);
  }

  displayLabel(value: string): string {
    if (!value) {
      return '';
    }
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  setStatus(user: IAdminManagedUser, status: string): void {
    if (!status || status === user.status) {
      return;
    }
    const previous = user.status;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Update user status',
        message: `Change @${user.username} from "${this.displayLabel(previous)}" to "${this.displayLabel(status)}"?`,
        confirmText: 'Save status'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) {
        user.status = previous;
        return;
      }
      this.successMessage = '';
      this.errorMessage = '';
      this.adminApi.updateUserStatus(user.userId, status).subscribe(
        (updated) => {
          user.status = updated.status;
          this.successMessage = `Updated ${updated.username} to ${this.displayLabel(updated.status)}`;
        },
        (err) => {
          user.status = previous;
          this.errorMessage = err.message || 'Status update failed';
        }
      );
    });
  }

  trackByUserId(_: number, user: IAdminManagedUser): string {
    return user.userId;
  }
}
