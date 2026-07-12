import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

/**
 * AppRoutingModule - Root routing configuration with lazy loading.
 *
 * Angular Concepts Used:
 * - Lazy loading with loadChildren (loads modules on demand)
 * - Route guards (AuthGuard, RoleGuard)
 * - PreloadAllModules strategy (preloads after initial load)
 * - Route data for role-based access
 * - Nested routes (children within layout)
 * - Redirect routes
 */
const routes: Routes = [
  // Public routes (no auth required)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Protected routes (wrapped in main layout)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'chat',
        loadChildren: () => import('./chat/chat.module').then(m => m.ChatModule)
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

  // Wildcard redirect
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules // Preload lazy modules after app loads
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
