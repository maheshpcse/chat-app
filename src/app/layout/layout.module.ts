import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { NotificationModule } from '../notification/notification.module';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

/**
 * LayoutModule - Contains the main application shell (header, sidebar, layout).
 * Imported in AppModule since it wraps the entire authenticated UI.
 */
@NgModule({
  declarations: [
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent
  ],
  imports: [
    SharedModule,
    NotificationModule
  ],
  exports: [
    MainLayoutComponent
  ]
})
export class LayoutModule {}
