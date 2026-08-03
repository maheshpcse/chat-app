import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, NoopAnimationsModule],
      declarations: [AppComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            getAccessToken: () => null
          }
        },
        {
          provide: SocketService,
          useValue: {
            connect: () => {},
            disconnect: () => {}
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
