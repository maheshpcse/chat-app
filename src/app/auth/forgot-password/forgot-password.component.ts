import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { matchPasswordValidator } from '../../shared/validators/match-password.validator';

/**
 * ForgotPasswordComponent - Two-step password recovery.
 *
 * Step 1: user enters their email; it is verified against the database.
 * Step 2: on success the user sets a new password (using the short-lived
 *         reset token issued by the backend), then is sent to login.
 */
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.scss', './forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  step: 1 | 2 = 1;
  emailForm: FormGroup;
  resetForm: FormGroup;

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  verifiedEmail = '';
  hidePassword = true;
  hideConfirmPassword = true;

  private resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: matchPasswordValidator('newPassword', 'confirmPassword')
    });
  }

  get ef() { return this.emailForm.controls; }
  get rf() { return this.resetForm.controls; }

  /** Step 1: verify the email exists in the database. */
  onVerifyEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.get('email').markAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.emailForm.value.email;
    this.authService.forgotPassword(email).subscribe(
      (result) => {
        this.isLoading = false;
        this.resetToken = result.resetToken;
        this.verifiedEmail = email;
        this.successMessage = 'Email verified. Set your new password below.';
        this.step = 2;
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'No account found with this email address.';
      }
    );
  }

  /** Step 2: change the password using the reset token. */
  onResetPassword(): void {
    if (this.resetForm.invalid) {
      Object.keys(this.resetForm.controls).forEach(key => {
        this.resetForm.get(key).markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.resetToken, this.resetForm.value.newPassword).subscribe(
      () => {
        this.isLoading = false;
        this.successMessage = 'Password changed successfully. Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Could not reset the password. Please try again.';
      }
    );
  }

  backToEmail(): void {
    this.step = 1;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
