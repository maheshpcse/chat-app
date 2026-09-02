import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';
import { SettingsService } from './core/services/settings.service';
import { PresenceService } from './core/services/presence.service';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, NoopAnimationsModule],
      declarations: [AppComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            getAccessToken: () => null,
            isLoggedIn$: of(false)
          }
        },
        {
          provide: SocketService,
          useValue: {
            connect: () => {},
            disconnect: () => {},
            isConnected: () => false,
            getOnlineUsers: () => {}
          }
        },
        {
          provide: SettingsService,
          useValue: {
            getSettings: () => of({})
          }
        },
        {
          provide: PresenceService,
          useValue: {
            hydrateFromApi: () => {}
          }
        }
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
