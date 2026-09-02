import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { IApiResponse } from '../models/api-response.model';

/** Flat key-value map returned by GET /settings */
export interface UserSettingsMap {
  [key: string]: any;
}

export interface IPrivacySettings {
  onlineStatus: string;
  lastSeen: string;
  profilePhoto: string;
}

export interface INotificationSettings {
  messages: boolean;
  groups: boolean;
  contacts: boolean;
  sound: boolean;
}

export interface IChatPreferences {
  enterSends: boolean;
  fontSize: string;
}

/**
 * SettingsService - HTTP client for /api/v1/settings free-form KV store.
 * Keys are dotted (privacy.onlineStatus, notifications.messages, …).
 * Applies theme + chat font size to document when values change.
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private settingsSubject = new BehaviorSubject<UserSettingsMap>({});
  public settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getSettings(): Observable<UserSettingsMap> {
    return this.http.get<IApiResponse<UserSettingsMap>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.SETTINGS.BASE}`
    ).pipe(
      map(response => response.data || {}),
      tap(settings => {
        this.settingsSubject.next(settings);
        this.applyRuntimeEffects(settings);
      })
    );
  }

  /** Bulk PUT of key → value pairs. */
  updateSettings(settings: UserSettingsMap): Observable<UserSettingsMap> {
    return this.http.put<IApiResponse<UserSettingsMap>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.SETTINGS.BASE}`,
      settings
    ).pipe(
      map(response => response.data || settings),
      tap(updated => {
        const merged = { ...this.settingsSubject.value, ...updated };
        this.settingsSubject.next(merged);
        this.applyRuntimeEffects(merged);
      })
    );
  }

  updateSetting(key: string, value: any): Observable<any> {
    return this.http.put<IApiResponse<any>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.SETTINGS.BASE}/${encodeURIComponent(key)}`,
      { value }
    ).pipe(
      map(response => response.data),
      tap(() => {
        const next = { ...this.settingsSubject.value, [key]: value };
        this.settingsSubject.next(next);
        this.applyRuntimeEffects(next);
      })
    );
  }

  /** Apply theme / font-size / enter-sends side effects to the live app shell. */
  applyRuntimeEffects(settingsMap?: UserSettingsMap): void {
    const snap = settingsMap || this.settingsSubject.value || {};
    const theme = this.pickString(snap, 'theme.preference', 'light');
    const fontSize = this.pickString(snap, 'chat.fontSize', 'medium');
    this.applyTheme(theme);
    this.applyFontSize(fontSize);
  }

  applyTheme(theme: string): void {
    const root = document.documentElement;
    const body = document.body;
    const t = (theme || 'light').toLowerCase();
    root.classList.remove('theme-light', 'theme-dark', 'theme-system');
    body.classList.remove('theme-light', 'theme-dark', 'theme-system');
    if (t === 'dark') {
      root.classList.add('theme-dark');
      body.classList.add('theme-dark');
      root.setAttribute('data-theme', 'dark');
    } else if (t === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'theme-dark' : 'theme-light', 'theme-system');
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light', 'theme-system');
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add('theme-light');
      body.classList.add('theme-light');
      root.setAttribute('data-theme', 'light');
    }
  }

  applyFontSize(size: string): void {
    const root = document.documentElement;
    const s = (size || 'medium').toLowerCase();
    root.classList.remove('chat-font-sm', 'chat-font-md', 'chat-font-lg');
    if (s === 'small') {
      root.classList.add('chat-font-sm');
      root.style.setProperty('--chat-font-scale', '0.9');
    } else if (s === 'large') {
      root.classList.add('chat-font-lg');
      root.style.setProperty('--chat-font-scale', '1.12');
    } else {
      root.classList.add('chat-font-md');
      root.style.setProperty('--chat-font-scale', '1');
    }
  }

  private pickString(settingsMap: UserSettingsMap, key: string, fallback: string): string {
    const v = settingsMap[key];
    if (v == null) { return fallback; }
    return typeof v === 'string' ? v : String(v);
  }

  /** Sound enabled for in-app notifications (default true). */
  isSoundEnabled(): boolean {
    return this.readBool('notifications.sound', true);
  }

  isMessageNotificationsEnabled(): boolean {
    return this.readBool('notifications.messages', true);
  }

  getSnapshot(): UserSettingsMap {
    return this.settingsSubject.value;
  }

  readString(key: string, fallback: string): string {
    const v = this.settingsSubject.value[key];
    if (v == null) { return fallback; }
    return typeof v === 'string' ? v : String(v);
  }

  readBool(key: string, fallback: boolean): boolean {
    const v = this.settingsSubject.value[key];
    if (v == null) { return fallback; }
    if (typeof v === 'boolean') { return v; }
    if (v === 'true' || v === 1 || v === '1') { return true; }
    if (v === 'false' || v === 0 || v === '0') { return false; }
    return !!v;
  }

  /** Map stored keys → privacy UI model. */
  toPrivacySettings(): IPrivacySettings {
    return {
      onlineStatus: this.readString('privacy.onlineStatus', 'everyone'),
      lastSeen: this.readString('privacy.lastSeen', 'everyone'),
      profilePhoto: this.readString('privacy.profilePhoto', 'everyone')
    };
  }

  toNotificationSettings(): INotificationSettings {
    return {
      messages: this.readBool('notifications.messages', true),
      groups: this.readBool('notifications.groups', true),
      contacts: this.readBool('notifications.contacts', true),
      sound: this.readBool('notifications.sound', true)
    };
  }

  toChatPreferences(): IChatPreferences {
    return {
      enterSends: this.readBool('chat.enterSends', true),
      fontSize: this.readString('chat.fontSize', 'medium')
    };
  }

  toThemePreference(): string {
    return this.readString('theme.preference', 'light');
  }
}
