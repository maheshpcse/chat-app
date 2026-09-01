import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

interface IHeroBubble {
  id: number;
  side: 'left' | 'right';
  avatar: string;
  text: string;
  typing?: boolean;
}

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
export class LandingComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('heroFeed') private heroFeed: ElementRef;

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

  /** Animated hero chat feed (random L/R). */
  heroBubbles: IHeroBubble[] = [];
  private nextBubbleId = 1;
  private demoTimer: any = null;
  private shouldScrollHero = false;
  private readonly maxHeroBubbles = 8;

  private readonly demoScript: Array<{ side: 'left' | 'right'; avatar: string; text: string }> = [
    { side: 'left', avatar: 'JB', text: 'Hey! Are you on Chat App yet? 👋' },
    { side: 'right', avatar: 'You', text: 'Just joined — this is fast! ⚡' },
    { side: 'left', avatar: 'SK', text: 'Group call later?' },
    { side: 'right', avatar: 'You', text: 'Yes — 6pm works for me.' },
    { side: 'left', avatar: 'JB', text: 'Sending the notes now…' },
    { side: 'right', avatar: 'You', text: 'Got them. Love the live presence.' },
    { side: 'left', avatar: 'SK', text: 'Typing indicators feel natural.' },
    { side: 'right', avatar: 'You', text: 'Private, real-time, done right.' }
  ];
  private demoIndex = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Already signed in? Go straight to the app.
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.startHeroDemo();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollHero) {
      this.scrollHeroFeed();
      this.shouldScrollHero = false;
    }
  }

  ngOnDestroy(): void {
    if (this.demoTimer) {
      clearTimeout(this.demoTimer);
      this.demoTimer = null;
    }
  }

  trackHeroBubble(_index: number, b: IHeroBubble): number {
    return b.id;
  }

  private startHeroDemo(): void {
    // Seed first bubble immediately
    this.queueNextHeroStep(400);
  }

  private queueNextHeroStep(delayMs: number): void {
    if (this.demoTimer) {
      clearTimeout(this.demoTimer);
    }
    this.demoTimer = setTimeout(() => this.runHeroStep(), delayMs);
  }

  private runHeroStep(): void {
    const item = this.demoScript[this.demoIndex % this.demoScript.length];
    this.demoIndex += 1;

    // Typing placeholder on that side
    const typingId = this.nextBubbleId++;
    this.heroBubbles = [
      ...this.heroBubbles,
      {
        id: typingId,
        side: item.side,
        avatar: item.avatar,
        text: '',
        typing: true
      }
    ].slice(-this.maxHeroBubbles);
    this.shouldScrollHero = true;

    // Replace typing with real message after short delay
    this.demoTimer = setTimeout(() => {
      this.heroBubbles = this.heroBubbles
        .filter(b => b.id !== typingId)
        .concat([{
          id: this.nextBubbleId++,
          side: item.side,
          avatar: item.avatar,
          text: item.text
        }])
        .slice(-this.maxHeroBubbles);
      this.shouldScrollHero = true;

      // Random-ish next delay between messages
      const nextDelay = 1600 + Math.floor(Math.random() * 1400);
      this.queueNextHeroStep(nextDelay);
    }, 700 + Math.floor(Math.random() * 500));
  }

  private scrollHeroFeed(): void {
    try {
      if (!this.heroFeed) { return; }
      const el = this.heroFeed.nativeElement as HTMLElement;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } catch (e) { /* ignore */ }
  }
}
