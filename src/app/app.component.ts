import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';

/**
 * AppComponent - Root component. Connects socket if user is already authenticated.
 *
 * Angular Concepts Used:
 * - Root component (bootstrapped in AppModule)
 * - OnInit lifecycle hook for app initialization logic
 * - Service injection at root level
 */
@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    // If user is already authenticated (page refresh), reconnect socket
    if (this.authService.isAuthenticated()) {
      this.socketService.connect();
    }
  }
}
