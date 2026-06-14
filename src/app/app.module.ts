import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { LayoutModule } from './layout/layout.module';
import { NotificationModule } from './notification/notification.module';

/**
 * AppModule - Root module of the Angular application.
 *
 * Angular Concepts Used:
 * - BrowserModule (only imported once in root module)
 * - BrowserAnimationsModule (for Angular Material animations)
 * - CoreModule (singleton services, guards, interceptors)
 * - SharedModule (common components for layout)
 * - LayoutModule (main layout shell)
 * - AppRoutingModule (root routing)
 * - Feature modules are lazy-loaded (NOT imported here)
 */
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    LayoutModule,
    NotificationModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
