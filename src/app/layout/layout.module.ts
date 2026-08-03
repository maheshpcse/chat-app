import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { NotificationModule } from '../notification/notification.module';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { AppLayoutComponent } from './app-layout/app-layout.component';
import { ChatLayoutComponent } from './chat-layout/chat-layout.component';
import { AppSideMenuComponent } from './app-side-menu/app-side-menu.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

/**
 * LayoutModule - Contains the application shells (header, layouts, side menus).
 *
 * Two distinct layouts are exported:
 * - AppLayoutComponent  : general authenticated pages + general app side menu
 * - ChatLayoutComponent : chat page + chat-specific side menu
 * MainLayoutComponent is retained for backward compatibility.
 */
@NgModule({
  declarations: [
    MainLayoutComponent,
    AppLayoutComponent,
    ChatLayoutComponent,
    AppSideMenuComponent,
    HeaderComponent,
    SidebarComponent
  ],
  imports: [
    SharedModule,
    NotificationModule
  ],
  exports: [
    MainLayoutComponent,
    AppLayoutComponent,
    ChatLayoutComponent
  ]
})
export class LayoutModule {}
