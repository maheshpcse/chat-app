import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';

/**
 * LoginComponent - User login form with JWT authentication.
 *
 * Angular Concepts Used:
 * - Reactive Forms (FormBuilder, FormGroup, Validators)
 * - Form validation (required, email pattern)
 * - OnInit lifecycle hook
 * - Router navigation after login
 * - ActivatedRoute for returnUrl query param
 * - Service injection (AuthService, SocketService)
 * - Error handling from API response
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  hidePassword: boolean = true;
  private returnUrl: string;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private socketService: SocketService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // Lifecycle Hook: ngOnInit - called once after component is initialized
  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/chat']);
      return;
    }

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/chat';

    // Initialize Reactive Form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Getter for easy template access to form controls
  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key).markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe(
      (response) => {
        this.isLoading = false;
        // Connect socket after successful login
        this.socketService.connect();
        // Navigate to return URL or chat
        this.router.navigate([this.returnUrl]);
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Login failed. Please try again.';
      }
    );
  }
}
