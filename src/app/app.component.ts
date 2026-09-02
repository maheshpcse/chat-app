import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';
import { SettingsService } from './core/services/settings.service';
import { PresenceService } from './core/services/presence.service';
import { routeSlideAnimation } from './shared/animations/route.animations';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { ChatLayoutComponent } from './layout/chat-layout/chat-layout.component';

/**
 * AppComponent - Root component. Connects socket if user is already authenticated.
 * Hosts the global route slide/fade transition for every page.
 *
 * Angular Concepts Used:
 * - Root component (bootstrapped in AppModule)
 * - OnInit lifecycle hook for app initialization logic
 * - Route animations via @angular/animations
 */
@Component({
  selector: 'app-root',
  template: `
    <div class="route-animation-host" [@routeSlide]="getRouteKey(outlet)">
      <router-outlet #outlet="outlet"></router-outlet>
    </div>
  `,
  styles: [`
    .route-animation-host {
      position: relative;
      min-height: 100vh;
      /* no overflow clipping here: it would break position:sticky in pages;
         html/body already clip horizontal overflow globally */
    }
  `],
  animations: [routeSlideAnimation],
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

  /**
   * Key for the root-level route animation.
   * Authenticated layouts (app / chat) and admin shell share stable keys so
   * switching child pages does NOT re-slide the whole outer shell.
   * Child page slides run on nested outlets inside each layout.
   * Do not import lazy Admin components here — path-based detection only.
   */
  getRouteKey(outlet: RouterOutlet): string {
    if (!outlet || !outlet.isActivated) { return ''; }

    const pathKey = outlet.activatedRoute.snapshot.pathFromRoot
      .map(r => (r.routeConfig && r.routeConfig.path) || '')
      .join('/');

    if (pathKey === 'admin' || pathKey.startsWith('admin/') || pathKey.indexOf('/admin') === 0) {
      return 'admin-shell';
    }

    const firstChild = outlet.activatedRoute.snapshot.firstChild;
    const firstPath = firstChild && firstChild.routeConfig ? firstChild.routeConfig.path : '';
    if (firstPath === 'admin') {
      return 'admin-shell';
    }

    const component = outlet.component;
    if (component instanceof AppLayoutComponent || component instanceof ChatLayoutComponent) {
      return 'app-shell';
    }

    return pathKey;
  }
}
