import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { IAdminUser } from '../../core/models/admin.model';
import { routeSlideAnimation } from '../../shared/animations/route.animations';

interface IAdminNavChild {
  label: string;
  route: string;
  icon: string;
}

interface IAdminNavItem {
  label: string;
  icon: string;
  route?: string;
  exact?: boolean;
  children?: IAdminNavChild[];
  expanded?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  animations: [routeSlideAnimation]
})
export class AdminLayoutComponent implements OnInit {
  admin: IAdminUser | null = null;
  sidenavOpen = true;

  navItems: IAdminNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', exact: true },
    { label: 'Users', icon: 'people', route: '/admin/users' },
    {
      label: 'Data Studio',
      icon: 'category',
      expanded: false,
      children: [
        { label: 'Overview', icon: 'hub', route: '/admin/faker' },
        { label: 'Users', icon: 'person_add', route: '/admin/faker/users' },
        { label: 'Contacts', icon: 'contacts', route: '/admin/faker/contacts' },
        { label: 'Groups', icon: 'groups', route: '/admin/faker/groups' },
        { label: 'Messages', icon: 'chat', route: '/admin/faker/messages' }
      ]
    },
    { label: 'Profile', icon: 'account_circle', route: '/admin/profile', exact: true },
    { label: 'Settings', icon: 'settings', route: '/admin/settings', exact: true }
  ];

  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.admin = this.adminAuthService.getCurrentAdmin();
    this.adminAuthService.currentAdmin$.subscribe(admin => {
      this.admin = admin;
    });
    this.syncDataStudioExpand();
  }

  toggleSidenav(): void {
    this.sidenavOpen = !this.sidenavOpen;
  }

  toggleGroup(item: IAdminNavItem, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!item.children) {
      return;
    }
    item.expanded = !item.expanded;
  }

  isGroupActive(item: IAdminNavItem): boolean {
    if (!item.children || !item.children.length) {
      return false;
    }
    const url = this.router.url.split('?')[0];
    return item.children.some(c => url === c.route || url.startsWith(c.route + '/'));
  }

  syncDataStudioExpand(): void {
    this.navItems.forEach(item => {
      if (item.children && this.isGroupActive(item)) {
        item.expanded = true;
      }
    });
  }

  getRouteKey(outlet: RouterOutlet): string {
    if (!outlet || !outlet.isActivated) {
      return '';
    }
    return outlet.activatedRoute.snapshot.pathFromRoot
      .map(r => (r.routeConfig && r.routeConfig.path) || '')
      .join('/');
  }

  logout(): void {
    this.adminAuthService.logout().subscribe(
      () => this.router.navigate(['/admin/login']),
      () => {
        this.adminAuthService.handleLogout();
        this.router.navigate(['/admin/login']);
      }
    );
  }
}
