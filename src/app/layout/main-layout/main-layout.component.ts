import { Component } from '@angular/core';

/**
 * MainLayoutComponent - Shell layout with header + sidebar + content area.
 *
 * Angular Concepts Used:
 * - Component composition (header, sidebar, router-outlet)
 * - MatSidenav for responsive sidebar
 * - router-outlet for child route content
 */
@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {}
