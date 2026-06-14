import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UploadService } from '../../core/services/upload.service';
import { IUser } from '../../core/models/user.model';

/**
 * ProfileComponent - User profile view and edit.
 *
 * Angular Concepts Used:
 * - MatTabs for profile sections
 * - Reactive Forms for editing
 * - File upload for avatar
 * - OnInit lifecycle hook for data loading
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: IUser;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isEditing: boolean = false;
  isLoading: boolean = true;
  isSaving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.loadProfile();

    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(1)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  loadProfile(): void {
    this.userService.getMyProfile().subscribe(
      (user) => {
        this.user = user;
        this.profileForm.patchValue({ firstName: user.firstName, lastName: user.lastName });
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.profileForm.patchValue({ firstName: this.user.firstName, lastName: this.user.lastName });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { return; }

    this.isSaving = true;
    const { firstName, lastName } = this.profileForm.value;
    const fullName = `${firstName} ${lastName}`.trim();
    this.userService.updateMyProfile({ firstName, lastName, fullName }).subscribe(
      (updatedUser) => {
        this.user = updatedUser;
        this.isEditing = false;
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      (error) => {
        this.isSaving = false;
        this.errorMessage = error.message || 'Failed to update profile';
      }
    );
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.uploadService.uploadLocal(file).subscribe(
        (result) => {
          this.userService.updateMyProfile({ avatar: result['fileUrl'] || result['url'] }).subscribe(
            (updatedUser) => {
              this.user = updatedUser;
            }
          );
        }
      );
    }
  }

  changePassword(): void {
    if (this.passwordForm.invalid) { return; }

    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword({ currentPassword, newPassword }).subscribe(
      () => {
        this.successMessage = 'Password changed successfully!';
        this.passwordForm.reset();
        setTimeout(() => this.successMessage = '', 3000);
      },
      (error) => {
        this.errorMessage = error.message || 'Failed to change password';
      }
    );
  }
}
