import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * LayoutStateService - Central store for app-shell UI state.
 *
 * Holds the general application side-menu collapse state and persists it to
 * localStorage so navigation between pages keeps the user's preference.
 *
 * Kept independent from the chat-specific sidebar state on purpose:
 * the chat side menu and the general app side menu evolve separately.
 */
@Injectable({ providedIn: 'root' })
export class LayoutStateService {

  private readonly STORAGE_KEY = 'appSideMenuCollapsed';

  private appMenuCollapsedSubject = new BehaviorSubject<boolean>(this.readInitial());
  /** Emits the general app side-menu collapse state. */
  public appMenuCollapsed$ = this.appMenuCollapsedSubject.asObservable();

  private readInitial(): boolean {
    try {
      return localStorage.getItem(this.STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  get isAppMenuCollapsed(): boolean {
    return this.appMenuCollapsedSubject.value;
  }

  toggleAppMenu(): void {
    this.setAppMenuCollapsed(!this.appMenuCollapsedSubject.value);
  }

  setAppMenuCollapsed(collapsed: boolean): void {
    this.appMenuCollapsedSubject.next(collapsed);
    try {
      localStorage.setItem(this.STORAGE_KEY, String(collapsed));
    } catch {
      // storage unavailable (private mode) - state still lives in memory
    }
  }
}
