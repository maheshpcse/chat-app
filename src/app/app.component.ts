import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';
import { SettingsService } from './core/services/settings.service';
import { PresenceService } from './core/services/presence.service';

/**
 * AppComponent - Root component. Connects socket if user is already authenticated.
 *
 * Route slide animation removed: enter opacity:0 left blank Pages UI when the
 * animation player stalled (no console error). Plain outlet only.
 */
@Component({
  selector: 'app-root',
  template: `
    <div class="route-animation-host">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      opacity: 1 !important;
      visibility: visible !important;
    }
    .route-animation-host {
      position: relative;
      min-height: 100vh;
      width: 100%;
      display: block;
      opacity: 1 !important;
      visibility: visible !important;
    }
    .route-animation-host > router-outlet {
      display: none;
    }
  `],
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  private authSub: Subscription;

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private settingsService: SettingsService,
    private presenceService: PresenceService
  ) {}

  ngOnInit(): void {
    // If user is already authenticated (page refresh), reconnect socket + settings
    if (this.authService.isAuthenticated()) {
      this.socketService.connect();
      this.bootstrapUserPrefs();
    }

    this.authSub = this.authService.isLoggedIn$.subscribe(loggedIn => {
      if (loggedIn) {
        this.bootstrapUserPrefs();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  /** Tab focus / visibility: refresh presence without marking self offline. */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState !== 'visible') {
      return;
    }
    if (!this.authService.isAuthenticated()) {
      return;
    }
    if (!this.socketService.isConnected()) {
      this.socketService.connect();
    } else {
      this.socketService.getOnlineUsers();
      this.presenceService.hydrateFromApi();
    }
  }

  private bootstrapUserPrefs(): void {
    this.settingsService.getSettings().subscribe(
      () => { /* applyRuntimeEffects runs in service tap */ },
      () => { /* soft-fail keep defaults */ }
    );
  }
}
