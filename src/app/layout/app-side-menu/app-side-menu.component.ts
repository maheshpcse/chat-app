import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
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
 * - HostBinding so host width collapses and main content expands
 */
@Component({
  selector: 'app-app-side-menu',
  templateUrl: './app-side-menu.component.html',
  styleUrls: ['./app-side-menu.component.scss']
})
export class AppSideMenuComponent implements OnInit, OnDestroy {

  /** When true, the menu is always a compact icon rail (used inside chat layout). */
  @Input() railMode = false;

  collapsed$: Observable<boolean>;
  @HostBinding('class.collapsed') isCollapsed = false;
  @HostBinding('class.rail-mode') isRailMode = false;

  readonly navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Chat', icon: 'chat', route: '/chat' },
    { label: 'Groups', icon: 'groups', route: '/groups' },
    { label: 'Contacts', icon: 'people', route: '/contacts' },
    { label: 'Notifications', icon: 'notifications', route: '/notifications' },
    { label: 'Settings', icon: 'settings', route: '/settings' }
  ];

  private sub: Subscription;

  constructor(private layoutState: LayoutStateService) {}

  ngOnInit(): void {
    this.isRailMode = !!this.railMode;
    if (this.railMode) {
      this.isCollapsed = true;
      this.collapsed$ = of(true);
      return;
    }
    this.collapsed$ = this.layoutState.appMenuCollapsed$;
    this.sub = this.collapsed$.subscribe(v => {
      this.isCollapsed = !!v;
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  toggle(): void {
    this.layoutState.toggleAppMenu();
  }
}
