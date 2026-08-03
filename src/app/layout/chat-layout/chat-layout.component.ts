import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeSlideAnimation } from '../../shared/animations/route.animations';

/**
 * ChatLayoutComponent - Shell for the Chat page only.
 *
 * Renders the main header, the general app nav and the chat-specific side
 * menu (conversations, contacts, requests, search). The chat CONTENT slides
 * in via the shared route animation; header/side menus stay static.
 */
@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.scss'],
  animations: [routeSlideAnimation]
})
export class ChatLayoutComponent {
  isSidebarMinimized = false;

  /** Key per activated child route (animates chat content on entry). */
  getRouteKey(outlet: RouterOutlet): string {
    return outlet && outlet.isActivated ? outlet.activatedRoute.snapshot.pathFromRoot
      .map(r => (r.routeConfig && r.routeConfig.path) || '')
      .join('/') : '';
  }
}
