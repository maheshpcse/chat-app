import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  hidePassword = true;
  private returnUrl = '/admin/dashboard';

  constructor(
    private fb: FormBuilder,
    private adminAuthService: AdminAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.adminAuthService.isAuthenticated()) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';

    this.loginForm = this.fb.group({
      email: ['admin@chatapp.com', [Validators.required, Validators.email]],
      password: ['Admin@12345', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key).markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.adminAuthService.login(this.loginForm.value).subscribe(
      () => {
        this.isLoading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Admin login failed';
      }
    );
  }
}
