import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { ChatLayoutComponent } from './layout/chat-layout/chat-layout.component';

/**
 * AppRoutingModule - Root routing configuration with lazy loading.
 */
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./landing/landing.module').then(m => m.LandingModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'errors',
    loadChildren: () => import('./errors/errors.module').then(m => m.ErrorsModule)
  },
  {
    path: 'chat',
    component: ChatLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./chat/chat.module').then(m => m.ChatModule)
      }
    ]
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'conversations',
        loadChildren: () => import('./conversation/conversation.module').then(m => m.ConversationModule)
      },
      {
        path: 'contacts',
        loadChildren: () => import('./contacts/contacts.module').then(m => m.ContactsModule)
      },
      {
        path: 'groups',
        loadChildren: () => import('./group/group.module').then(m => m.GroupModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)
      },
      {
        path: 'notifications',
        loadChildren: () => import('./notifications/notifications-page.module').then(m => m.NotificationsPageModule)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  { path: '**', redirectTo: 'errors/404' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
