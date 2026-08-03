import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { IAdminUser } from '../../core/models/admin.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { withMinLoading } from '../utils/admin-rx.util';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss']
})
export class AdminProfileComponent implements OnInit {
  admin: IAdminUser | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private adminAuthService: AdminAuthService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.admin = this.adminAuthService.getCurrentAdmin();
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

  confirmLogout(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Sign out',
        message: 'End this admin session and return to the login screen?',
        confirmText: 'Logout'
      }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) {
        return;
      }
      this.adminAuthService.logout().subscribe(
        () => this.router.navigate(['/admin/login']),
        () => {
          this.adminAuthService.handleLogout();
          this.router.navigate(['/admin/login']);
        }
      );
    });
  }
}
