import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AdminApiService } from '../../core/services/admin-api.service';
import {
  IAdminActivityItem,
  IAdminDashboardStats
} from '../../core/models/admin.model';
import { withMinLoading } from '../utils/admin-rx.util';

interface IStatCard {
  key: keyof IAdminDashboardStats;
  label: string;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  errorMessage = '';
  stats: IAdminDashboardStats | null = null;
  recentUsers: IAdminActivityItem[] = [];
  recentMessages: IAdminActivityItem[] = [];

  cards: IStatCard[] = [
    { key: 'totalUsers', label: 'Total Users', icon: 'people', tone: 'mint' },
    { key: 'onlineUsers', label: 'Online Now', icon: 'sensors', tone: 'success' },
    { key: 'activeUsers', label: 'Active Users', icon: 'verified_user', tone: 'forsytha' },
    { key: 'bannedUsers', label: 'Banned', icon: 'block', tone: 'warn' },
    { key: 'totalGroups', label: 'Groups', icon: 'groups', tone: 'saffron' },
    { key: 'totalMessages', label: 'Messages', icon: 'chat', tone: 'mint' },
    { key: 'totalFriends', label: 'Friendships', icon: 'favorite', tone: 'success' },
    { key: 'pendingFriendRequests', label: 'Pending Requests', icon: 'hourglass_top', tone: 'saffron' }
  ];

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    // Min 1s shimmer + API in parallel via forkJoin inside withMinLoading
    withMinLoading(this.adminApi.getDashboardOverview(), 1000)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe(
        (data) => {
          this.stats = data.stats;
          this.recentUsers = data.recentUsers || [];
          this.recentMessages = data.recentMessages || [];
        },
        (err) => {
          this.errorMessage = err.message || 'Failed to load dashboard';
        }
      );
  }

  valueOf(key: keyof IAdminDashboardStats): number {
    return this.stats ? Number(this.stats[key] || 0) : 0;
  }

  trackByEntity(_: number, item: IAdminActivityItem): string {
    return item.entityId;
  }
}
