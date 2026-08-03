import { Component, Input } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { getInitials, getAvatarColor } from '../../utilities/avatar-initials.util';

/**
 * AvatarComponent - Reusable user avatar with initials fallback + online badge.
 *
 * When an image is available it is shown; otherwise a colored circle with the
 * user's initials is rendered (e.g. "Pachapalam Mahesh" -> "PM"). The color is
 * derived deterministically from the name so it stays stable per user.
 *
 * Angular Concepts Used:
 * - @Input() data binding
 * - Conditional rendering (image vs initials)
 * - Getters to compute derived view state
 */
@Component({
  selector: 'app-avatar',
  template: `
    <div class="avatar-wrapper"
         [ngClass]="{
           'avatar-xs': size === 'xs',
           'avatar-sm': size === 'sm',
           'avatar-md': size === 'md',
           'avatar-lg': size === 'lg'
         }">
      <img *ngIf="hasImage" [src]="avatarSrc" [alt]="name" class="avatar-img">
      <span *ngIf="!hasImage" class="avatar-initials" [style.background-color]="initialsColor">
        {{ initials }}
      </span>
      <span class="online-badge" *ngIf="showStatus"
            [ngClass]="{'online': isOnline, 'offline': !isOnline}"></span>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
      vertical-align: middle;
    }
    .avatar-wrapper {
      position: relative;
      display: inline-block;
      flex-shrink: 0;
      line-height: 0;
      overflow: visible;
    }
    .avatar-img, .avatar-initials {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      object-fit: cover;
      box-sizing: border-box;
    }
    .avatar-initials {
      color: #fff;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      text-transform: uppercase;
      user-select: none;
    }
    .avatar-xs .avatar-img, .avatar-xs .avatar-initials { width: 28px; height: 28px; font-size: 11px; }
    .avatar-sm .avatar-img, .avatar-sm .avatar-initials { width: 32px; height: 32px; font-size: 13px; }
    .avatar-md .avatar-img, .avatar-md .avatar-initials { width: 44px; height: 44px; font-size: 16px; }
    .avatar-lg .avatar-img, .avatar-lg .avatar-initials { width: 64px; height: 64px; font-size: 22px; }
    .online-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-sizing: border-box;
      z-index: 2;
      pointer-events: none;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
      transform: translate(15%, 15%);
    }
    .avatar-xs .online-badge { width: 8px; height: 8px; border-width: 1.5px; }
    .avatar-sm .online-badge { width: 10px; height: 10px; }
    .avatar-md .online-badge { width: 12px; height: 12px; }
    .avatar-lg .online-badge { width: 14px; height: 14px; border-width: 2.5px; }
    .online-badge.online { background-color: #4caf50; }
    .online-badge.offline { background-color: #9e9e9e; }
  `]
})
export class AvatarComponent {
  @Input() imageUrl: string = '';
  @Input() name: string = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  @Input() isOnline: boolean = false;
  @Input() showStatus: boolean = true;

  get hasImage(): boolean {
    return !!this.imageUrl;
  }

  get initials(): string {
    return getInitials(this.name);
  }

  get initialsColor(): string {
    return getAvatarColor(this.name || '');
  }

  /**
   * Constructs full avatar URL from a relative path.
   * DB stores: /uploads/xxxx.jpg  ->  http://localhost:3000/uploads/xxxx.jpg
   */
  get avatarSrc(): string {
    if (!this.imageUrl) {
      return '';
    }
    if (this.imageUrl.startsWith('http://') || this.imageUrl.startsWith('https://')) {
      return this.imageUrl;
    }
    return `${environment.socketUrl}${this.imageUrl}`;
  }
}
