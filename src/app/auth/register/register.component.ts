import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { matchPasswordValidator } from '../../shared/validators/match-password.validator';
import { noWhitespaceValidator } from '../../shared/validators/no-whitespace.validator';

/**
 * RegisterComponent - User registration form.
 *
 * Angular Concepts Used:
 * - Reactive Forms with FormBuilder
 * - Custom Validators (matchPassword, noWhitespace)
 * - Built-in Validators (required, email, minLength, maxLength, pattern)
 * - Form Group level validation
 * - Error message handling
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/chat']);
      return;
    }

    // Initialize form with validators including custom validators
    this.registerForm = this.fb.group({
      fullName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        noWhitespaceValidator()
      ]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/) // Only alphanumeric and underscore
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(30)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, {
      // Form-group level custom validator
      validators: matchPasswordValidator('password', 'confirmPassword')
    });
  }

  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key).markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { confirmPassword, fullName, ...rest } = this.registerForm.value;
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const registerData = { ...rest, fullName, firstName, lastName };

    this.authService.register(registerData).subscribe(
      (response) => {
        this.isLoading = false;
        this.socketService.connect();
        this.router.navigate(['/chat']);
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Registration failed. Please try again.';
      }
    );
  }
}
