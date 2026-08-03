import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LayoutStateService } from '../../core/services/layout-state.service';

/**
 * AppSideMenuComponent - General application navigation side menu.
 *
 * Mirrors the primary header navigation (Dashboard, Chat, Contacts,
 * Notifications, Settings, Profile) as a reusable vertical left menu for the
 * standard authenticated pages. Kept separate from the chat-specific side menu.
 *
 * Angular Concepts Used:
 * - Service-driven state (LayoutStateService) with localStorage persistence
 * - routerLink / routerLinkActive for active highlighting
 * - Async observable for collapse state
 */
@Component({
  selector: 'app-app-side-menu',
  templateUrl: './app-side-menu.component.html',
  styleUrls: ['./app-side-menu.component.scss']
})
export class AppSideMenuComponent implements OnInit {

  /** When true, the menu is always a compact icon rail (used inside chat layout). */
  @Input() railMode = false;

  collapsed$: Observable<boolean>;

  readonly navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Chat', icon: 'chat', route: '/chat' },
    { label: 'Contacts', icon: 'people', route: '/contacts' },
    { label: 'Notifications', icon: 'notifications', route: '/notifications' },
    { label: 'Settings', icon: 'settings', route: '/settings' }
  ];

  constructor(private layoutState: LayoutStateService) {}

  ngOnInit(): void {
    this.collapsed$ = this.railMode ? of(true) : this.layoutState.appMenuCollapsed$;
  }

  toggle(): void {
    this.layoutState.toggleAppMenu();
  }
}
