import { Component, Input } from '@angular/core';
import { APP_CONSTANTS } from '../../../core/constants/app.constants';
import { environment } from '../../../../environments/environment';

/**
 * AvatarComponent - Reusable user avatar with online indicator.
 *
 * Angular Concepts Used:
 * - @Input() for data binding from parent
 * - Conditional class binding [ngClass]
 * - Default value handling
 * - Getter to construct full avatar URL from relative path
 */
@Component({
  selector: 'app-avatar',
  template: `
    <div class="avatar-wrapper" [ngClass]="{'avatar-sm': size === 'sm', 'avatar-md': size === 'md', 'avatar-lg': size === 'lg'}">
      <img [src]="avatarSrc" [alt]="name" class="avatar-img">
      <span class="online-badge" *ngIf="showStatus" [ngClass]="{'online': isOnline, 'offline': !isOnline}"></span>
    </div>
  `,
  styles: [`
    .avatar-wrapper {
      position: relative;
      display: inline-block;
    }
    .avatar-img {
      border-radius: 50%;
      object-fit: cover;
    }
    .avatar-sm .avatar-img { width: 32px; height: 32px; }
    .avatar-md .avatar-img { width: 44px; height: 44px; }
    .avatar-lg .avatar-img { width: 64px; height: 64px; }
    .online-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid #fff;
    }
    .online-badge.online { background-color: #4caf50; }
    .online-badge.offline { background-color: #9e9e9e; }
  `]
})
export class AvatarComponent {
  @Input() imageUrl: string;
  @Input() name: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() isOnline: boolean = false;
  @Input() showStatus: boolean = true;

  defaultAvatar = APP_CONSTANTS.DEFAULT_AVATAR;

  /**
   * Constructs full avatar URL from relative path.
   * DB stores: /uploads/40056fd1-2ac3-4f6b-94a3-3c7c20422056.jpg
   * Returns:   http://localhost:3000/uploads/40056fd1-2ac3-4f6b-94a3-3c7c20422056.jpg
   *
   * Usage in templates:
   *   [imageUrl]="user?.avatar"       ← if backend returns 'avatar' field
   *   [imageUrl]="user?.avatarUrl"    ← if backend returns 'avatarUrl' field
   */
  get avatarSrc(): string {
    if (!this.imageUrl) {
      return this.defaultAvatar;
    }
    // If already a full URL (http/https), return as-is
    if (this.imageUrl.startsWith('http://') || this.imageUrl.startsWith('https://')) {
      return this.imageUrl;
    }
    // Construct full URL from relative path
    return `${environment.socketUrl}${this.imageUrl}`;
  }
}
