import { Component } from '@angular/core';

/**
 * ChatLayoutComponent - Shell for the Chat page only.
 *
 * Renders the main header, the general app nav and the chat-specific side
 * menu (conversations, contacts, requests, search).
 */
@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.scss']
})
export class ChatLayoutComponent {
  isSidebarMinimized = false;
}

