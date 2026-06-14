import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

/**
 * AuthModule - Feature module for authentication (login, register).
 * Lazy-loaded via app-routing.module.ts.
 *
 * Angular Concepts Used:
 * - Feature module with its own routing
 * - Imports SharedModule for Material + common utilities
 * - Lazy loading (loaded only when user navigates to /auth)
 */
@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent
  ],
  imports: [
    SharedModule,
    AuthRoutingModule
  ]
})
export class AuthModule {}
