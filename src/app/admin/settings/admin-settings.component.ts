import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { IAdminUser } from '../../core/models/admin.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { withMinLoading } from '../utils/admin-rx.util';
import {
  readAdminConsolePrefs,
  writeAdminConsolePrefs
} from '../utils/admin-console-prefs.util';

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

  // Console preferences — browser local (no BE prefs API / column yet)
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
    const p = readAdminConsolePrefs();
    this.denseTables = p.denseTables;
    this.confirmBeforeSave = p.confirmBeforeSave;
    this.defaultFakerCount = p.defaultFakerCount;
  }

  savePrefs(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Save console settings',
        message: 'Store these admin console preferences in this browser? ' +
          'They apply to Users dense tables and Data Studio defaults. ' +
          '(No server preferences API is deployed yet.)',
        confirmText: 'Save'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) { return; }
      writeAdminConsolePrefs({
        denseTables: this.denseTables,
        confirmBeforeSave: this.confirmBeforeSave,
        defaultFakerCount: this.defaultFakerCount
      });
      this.successMessage =
        'Console preferences saved for this browser (Users + Data Studio).';
    });
  }

  goProfile(): void {
    this.router.navigate(['/admin/profile']);
  }
}
