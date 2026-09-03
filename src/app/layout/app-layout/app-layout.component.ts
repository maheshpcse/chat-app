import { Component } from '@angular/core';

/**
 * AppLayoutComponent - Shell for standard authenticated pages.
 *
 * Renders the main header and the general application side menu
 * (AppSideMenuComponent). Used for Dashboard, Contacts, Notifications,
 * Settings and other non-chat pages. The chat-specific side menu is
 * intentionally NOT part of this layout.
 */
@Component({
  selector: 'app-app-layout',
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss']
})
export class AppLayoutComponent {}

