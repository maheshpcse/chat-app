import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../core/services/auth.service';
import { UserService } from '../core/services/user.service';
import { SettingsService } from '../core/services/settings.service';
import { UploadService } from '../core/services/upload.service';
import { IUser } from '../core/models/user.model';
import { APP_CONSTANTS } from '../core/constants/app.constants';
import { resolveMediaUrl } from '../shared/utilities/media-url.util';

/**
 * SettingsComponent - User settings page with multiple sections:
 * Profile (incl. avatar upload + initials badge), Privacy, Notifications,
 * Chat, Theme, Security.
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  currentUser: IUser | null = null;
  activeSection = 'profile';

  profileForm: FormGroup;
  passwordForm: FormGroup;

  privacySettings = {
    onlineStatus: 'everyone',
    lastSeen: 'everyone',
    profilePhoto: 'everyone'
  };

  notificationSettings = {
    messages: true,
    groups: true,
    contacts: true,
    sound: true
  };

  chatPreferences = {
    enterSends: true,
    fontSize: 'medium'
  };

  themePreference = 'light';

  isProfileSaving = false;
  isPasswordSaving = false;
  isSettingsLoading = false;
  isAvatarUploading = false;
  avatarPreviewUrl: string | null = null;
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
    private settingsService: SettingsService,
    private uploadService: UploadService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initProfileForm();
    this.initPasswordForm();
    this.loadRemoteSettings();
    this.userService.getMyProfile().subscribe(
      (user) => this.applyUserToLocal(user),
      () => { /* keep cached user */ }
    );
  }

  private loadRemoteSettings(): void {
    this.isSettingsLoading = true;
    this.settingsService.getSettings().subscribe(
      () => {
        this.applySettingsFromService();
        this.isSettingsLoading = false;
      },
      () => {
        this.isSettingsLoading = false;
      }
    );
  }

  private applySettingsFromService(): void {
    this.privacySettings = this.settingsService.toPrivacySettings();
    this.notificationSettings = this.settingsService.toNotificationSettings();
    this.chatPreferences = this.settingsService.toChatPreferences();
    this.themePreference = this.settingsService.toThemePreference();
    this.settingsService.applyRuntimeEffects();
  }

  private persistKeys(partial: { [key: string]: any }, okMsg: string): void {
    const keys = Object.keys(partial || {});
    if (keys.length === 1) {
      const key = keys[0];
      this.settingsService.updateSetting(key, partial[key]).subscribe(
        () => this.showMessage(okMsg),
        (err) => this.showMessage(
          (err && err.message) || 'Failed to save setting',
          true
        )
      );
      return;
    }
    this.settingsService.updateSettings(partial).subscribe(
      () => this.showMessage(okMsg),
      (err) => this.showMessage(
        (err && err.message) || 'Failed to save setting',
        true
      )
    );
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

  /** Profile — first/last required; phone + bio optional. */
  saveProfile(): void {
    if (this.profileForm.invalid) { return; }
    this.isProfileSaving = true;
    const raw = this.profileForm.value || {};
    const phone = (raw.phoneNumber || '').toString().trim();
    const bio = (raw.bio || '').toString();
    const payload: any = {
      firstName: (raw.firstName || '').toString().trim(),
      lastName: (raw.lastName || '').toString().trim(),
      bio,
      phoneNumber: phone || null
    };
    this.userService.updateMyProfile(payload).subscribe(
      (updated) => {
        this.isProfileSaving = false;
        this.applyUserToLocal(updated || payload);
        this.showMessage('Profile updated successfully');
      },
      error => {
        this.isProfileSaving = false;
        const msg = (error && error.message) || 'Failed to update profile';
        this.showMessage(msg, true);
      }
    );
  }

  /** Upload image → save avatarUrl. Empty avatar shows initials badge. */
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input?.files?.length) { return; }
    const file = input.files[0];
    input.value = '';
    if (file.size > APP_CONSTANTS.MAX_FILE_SIZE) {
      this.showMessage('Image must be under 10MB', true);
      return;
    }
    const allowed = APP_CONSTANTS.ALLOWED_IMAGE_TYPES || [];
    if (allowed.length && allowed.indexOf(file.type) < 0) {
      this.showMessage('Use JPEG, PNG, GIF, or WebP', true);
      return;
    }

    this.isAvatarUploading = true;
    try {
      this.avatarPreviewUrl = URL.createObjectURL(file);
    } catch (_e) {
      this.avatarPreviewUrl = null;
    }

    // Prefer /uploads/avatar (persists avatarUrl on BE). Fall back to local + profile PUT.
    this.uploadService.uploadAvatar(file).subscribe(
      (result) => {
        const fileUrl = (result && (result.fileUrl || result.url)) || '';
        if (!fileUrl) {
          this.isAvatarUploading = false;
          this.showMessage('Upload failed', true);
          return;
        }
        // Keep preview until profile hydrate; avatar endpoint already saved URL.
        this.userService.getMyProfile().subscribe(
          (updated) => {
            this.isAvatarUploading = false;
            this.applyUserToLocal(updated || { avatarUrl: fileUrl });
            this.clearAvatarPreview();
            this.showMessage('Profile photo updated');
          },
          () => {
            this.isAvatarUploading = false;
            this.applyUserToLocal({ avatarUrl: fileUrl });
            this.clearAvatarPreview();
            this.showMessage('Profile photo updated');
          }
        );
      },
      () => {
        // Fallback: generic local upload then profile update
        this.uploadService.uploadLocal(file).subscribe(
          (result) => {
            const fileUrl = (result && (result.fileUrl || result.url)) || '';
            if (!fileUrl) {
              this.isAvatarUploading = false;
              this.clearAvatarPreview();
              this.showMessage('Upload failed', true);
              return;
            }
            this.userService.updateMyProfile({ avatarUrl: fileUrl }).subscribe(
              (updated) => {
                this.isAvatarUploading = false;
                this.applyUserToLocal(updated || { avatarUrl: fileUrl });
                this.clearAvatarPreview();
                this.showMessage('Profile photo updated');
              },
              (err) => {
                this.isAvatarUploading = false;
                // Keep blob preview so user still sees selected image
                this.showMessage((err && err.message) || 'Failed to save photo', true);
              }
            );
          },
          (err) => {
            this.isAvatarUploading = false;
            this.clearAvatarPreview();
            this.showMessage((err && err.message) || 'Upload failed', true);
          }
        );
      }
    );
  }

  removeAvatar(): void {
    this.isAvatarUploading = true;
    this.userService.updateMyProfile({ avatarUrl: null as any }).subscribe(
      (updated) => {
        this.isAvatarUploading = false;
        this.clearAvatarPreview();
        this.applyUserToLocal({ ...(updated || {}), avatarUrl: '' });
        this.showMessage('Profile photo removed — initials badge in use');
      },
      (err) => {
        this.isAvatarUploading = false;
        this.showMessage((err && err.message) || 'Failed to remove photo', true);
      }
    );
  }

  resolveAvatarUrl(url?: string): string {
    return resolveMediaUrl(url);
  }

  private clearAvatarPreview(): void {
    if (this.avatarPreviewUrl) {
      try { URL.revokeObjectURL(this.avatarPreviewUrl); } catch (_e) { /* ignore */ }
      this.avatarPreviewUrl = null;
    }
  }

  private applyUserToLocal(user: Partial<IUser> | any): void {
    if (!user) { return; }
    const id = user.id || user.userId || this.currentUser?.id;
    const patch: Partial<IUser> = {
      id,
      userId: user.userId || id,
      firstName: user.firstName != null ? user.firstName : this.currentUser?.firstName,
      lastName: user.lastName != null ? user.lastName : this.currentUser?.lastName,
      username: user.username != null ? user.username : this.currentUser?.username,
      email: user.email != null ? user.email : this.currentUser?.email,
      bio: user.bio != null ? user.bio : this.currentUser?.bio,
      phoneNumber: user.phoneNumber != null ? user.phoneNumber : this.currentUser?.phoneNumber,
      avatarUrl: user.avatarUrl != null ? user.avatarUrl : this.currentUser?.avatarUrl
    };
    this.authService.patchCurrentUser(patch);
    this.currentUser = this.authService.getCurrentUser();
    if (this.profileForm && (user.firstName != null || user.lastName != null || user.bio != null || user.phoneNumber != null)) {
      this.profileForm.patchValue({
        firstName: patch.firstName,
        lastName: patch.lastName,
        bio: patch.bio || '',
        phoneNumber: patch.phoneNumber || ''
      }, { emitEvent: false });
    }
  }

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

  toggleNotification(key: string): void {
    this.notificationSettings[key] = !this.notificationSettings[key];
    this.persistKeys(
      { ['notifications.' + key]: this.notificationSettings[key] },
      'Notification preference updated'
    );
  }

  setPrivacy(key: string, value: string): void {
    this.privacySettings[key] = value;
    this.persistKeys(
      { ['privacy.' + key]: value },
      'Privacy setting updated'
    );
  }

  toggleEnterSends(): void {
    this.chatPreferences.enterSends = !this.chatPreferences.enterSends;
    this.persistKeys(
      { 'chat.enterSends': this.chatPreferences.enterSends },
      'Chat preference updated'
    );
  }

  setFontSize(size: string): void {
    this.chatPreferences.fontSize = size;
    this.settingsService.applyFontSize(size);
    this.persistKeys(
      { 'chat.fontSize': size },
      'Font size updated'
    );
  }

  setTheme(theme: string): void {
    this.themePreference = theme;
    this.settingsService.applyTheme(theme);
    this.persistKeys(
      { 'theme.preference': theme },
      'Appearance updated'
    );
  }

  getUserInitials(): string {
    if (!this.currentUser) { return '?'; }
    const first = this.currentUser.firstName ? this.currentUser.firstName.charAt(0) : '';
    const last = this.currentUser.lastName ? this.currentUser.lastName.charAt(0) : '';
    return (first + last).toUpperCase() || '?';
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
