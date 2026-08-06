import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../core/services/auth.service';
import { UserService } from '../core/services/user.service';
import { IUser } from '../core/models/user.model';

/**
 * SettingsComponent - User settings page with multiple sections:
 * Profile, Privacy, Notifications, Chat, Theme, Security
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  currentUser: IUser | null = null;
  activeSection = 'profile';

  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;

  // Privacy settings
  privacySettings = {
    onlineStatus: 'everyone',
    lastSeen: 'everyone',
    profilePhoto: 'everyone'
  };

  // Notification settings
  notificationSettings = {
    messages: true,
    groups: true,
    contacts: true,
    sound: true
  };

  // Chat preferences
  chatPreferences = {
    enterSends: true,
    fontSize: 'medium'
  };

  // Theme
  themePreference = 'light';

  // State
  isProfileSaving = false;
  isPasswordSaving = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  sections = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'privacy', label: 'Privacy', icon: 'lock' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'chat', label: 'Chat', icon: 'chat' },
    { id: 'theme', label: 'Appearance', icon: 'palette' },
    { id: 'security', label: 'Security', icon: 'shield' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initProfileForm();
    this.initPasswordForm();
  }

  private initProfileForm(): void {
    this.profileForm = this.fb.group({
      firstName: [this.currentUser?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.currentUser?.lastName || '', [Validators.required, Validators.minLength(2)]],
      bio: [this.currentUser?.bio || '', [Validators.maxLength(200)]],
      phoneNumber: [this.currentUser?.phoneNumber || '']
    });
  }

  private initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  setActiveSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  // Profile
  saveProfile(): void {
    if (this.profileForm.invalid) { return; }
    this.isProfileSaving = true;
    this.userService.updateMyProfile(this.profileForm.value).subscribe(
      () => {
        this.isProfileSaving = false;
        this.showMessage('Profile updated successfully');
      },
      error => {
        this.isProfileSaving = false;
        this.showMessage('Failed to update profile', true);
      }
    );
  }

  // Password
  changePassword(): void {
    if (this.passwordForm.invalid) { return; }
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.showMessage('Passwords do not match', true);
      return;
    }
    this.isPasswordSaving = true;
    this.authService.changePassword({ currentPassword, newPassword }).subscribe(
      () => {
        this.isPasswordSaving = false;
        this.passwordForm.reset();
        this.showMessage('Password changed successfully');
      },
      error => {
        this.isPasswordSaving = false;
        this.showMessage(error.message || 'Failed to change password', true);
      }
    );
  }

  // Notification toggles
  toggleNotification(key: string): void {
    this.notificationSettings[key] = !this.notificationSettings[key];
    this.showMessage('Notification preference updated');
  }

  // Privacy
  setPrivacy(key: string, value: string): void {
    this.privacySettings[key] = value;
    this.showMessage('Privacy setting updated');
  }

  // Chat preferences
  toggleEnterSends(): void {
    this.chatPreferences.enterSends = !this.chatPreferences.enterSends;
    this.showMessage('Chat preference updated');
  }

  setFontSize(size: string): void {
    this.chatPreferences.fontSize = size;
    this.showMessage('Font size updated');
  }

  getUserInitials(): string {
    if (!this.currentUser) { return '?'; }
    const first = this.currentUser.firstName ? this.currentUser.firstName.charAt(0) : '';
    const last = this.currentUser.lastName ? this.currentUser.lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  }

  private showMessage(message: string, isError: boolean = false): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: isError ? 'snack-error' : 'snack-success',
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
