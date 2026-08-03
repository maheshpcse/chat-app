import { Component, Input } from '@angular/core';

/**
 * PageHeaderComponent - Consistent page header for standard pages.
 *
 * Provides a single, reusable title/subtitle/icon layout so that Contacts,
 * Settings, Notifications (and future pages) all render their heading in the
 * same position, width, padding and typography.
 *
 * Usage:
 *   <app-page-header title="Contacts" subtitle="Manage your connections" icon="people">
 *     <button mat-stroked-button>Add</button>   <!-- optional projected actions -->
 *   </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
}
