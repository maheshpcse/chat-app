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
      tap(settings => this.settingsSubject.next(settings))
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
      })
    );
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
