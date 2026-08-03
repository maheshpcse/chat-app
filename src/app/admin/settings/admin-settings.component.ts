import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { IAdminUser } from '../../core/models/admin.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { withMinLoading } from '../utils/admin-rx.util';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {
  admin: IAdminUser | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Console preferences (local only)
  denseTables = true;
  confirmBeforeSave = true;
  defaultFakerCount = 10;

  constructor(
    private adminAuthService: AdminAuthService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.admin = this.adminAuthService.getCurrentAdmin();
    this.restoreLocalPrefs();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    withMinLoading(this.adminAuthService.me(), 500)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(
        (admin) => { this.admin = admin; },
        (err) => { this.errorMessage = err.message || 'Failed to load admin profile'; }
      );
  }

  restoreLocalPrefs(): void {
    try {
      const raw = localStorage.getItem('admin_console_prefs');
      if (!raw) { return; }
      const p = JSON.parse(raw);
      if (typeof p.denseTables === 'boolean') { this.denseTables = p.denseTables; }
      if (typeof p.confirmBeforeSave === 'boolean') { this.confirmBeforeSave = p.confirmBeforeSave; }
      if (typeof p.defaultFakerCount === 'number') { this.defaultFakerCount = p.defaultFakerCount; }
    } catch { /* ignore */ }
  }

  savePrefs(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Save console settings',
        message: 'Store these admin console preferences in this browser?',
        confirmText: 'Save'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      localStorage.setItem('admin_console_prefs', JSON.stringify({
        denseTables: this.denseTables,
        confirmBeforeSave: this.confirmBeforeSave,
        defaultFakerCount: this.defaultFakerCount
      }));
      this.successMessage = 'Console preferences saved for this browser.';
    });
  }

  goProfile(): void {
    this.router.navigate(['/admin/profile']);
  }
}
