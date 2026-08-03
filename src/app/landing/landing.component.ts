import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

/**
 * LandingComponent - Public marketing/landing page for the site.
 *
 * This is the entry point for unauthenticated visitors. Login / Sign Up are
 * reached from here (they are NOT the landing page themselves).
 * Authenticated users are forwarded straight to the dashboard.
 */
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  readonly features = [
    {
      icon: 'forum',
      title: 'Real-Time Messaging',
      text: 'Instant one-to-one and group conversations powered by live sockets — with delivery and seen receipts.'
    },
    {
      icon: 'group_add',
      title: 'Contacts & Requests',
      text: 'Find people, send friend requests and build your own contact circle with full control.'
    },
    {
      icon: 'notifications_active',
      title: 'Smart Notifications',
      text: 'Live in-app notifications for messages and contact activity, with read tracking.'
    },
    {
      icon: 'wifi_tethering',
      title: 'Presence & Typing',
      text: 'See who is online, when they were last seen, and when they are typing.'
    },
    {
      icon: 'schedule_send',
      title: 'Scheduled Messages',
      text: 'Write now, deliver later — schedule messages for the right moment.'
    },
    {
      icon: 'lock',
      title: 'Private & Secure',
      text: 'JWT-secured sessions, blocked-user enforcement and privacy-first contact rules.'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Already signed in? Go straight to the app.
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }
}
