import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeSlideAnimation } from '../../shared/animations/route.animations';

/**
 * AppLayoutComponent - Shell for standard authenticated pages.
 *
 * Renders the main header and the general application side menu
 * (AppSideMenuComponent). Used for Dashboard, Contacts, Notifications,
 * Settings and other non-chat pages. The chat-specific side menu is
 * intentionally NOT part of this layout.
 *
 * Child pages transition with the shared slide/fade route animation.
 */
@Component({
  selector: 'app-app-layout',
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  animations: [routeSlideAnimation]
})
export class AppLayoutComponent {

  /** Unique key per activated child route so the slide runs on each switch. */
  getRouteKey(outlet: RouterOutlet): string {
    return outlet && outlet.isActivated ? outlet.activatedRoute.snapshot.pathFromRoot
      .map(r => (r.routeConfig && r.routeConfig.path) || '')
      .join('/') : '';
  }
}
