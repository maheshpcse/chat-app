import { Component } from '@angular/core';
import { LoaderService } from '../../../core/services/loader.service';

/**
 * LoaderComponent - Global loading spinner overlay.
 *
 * Angular Concepts Used:
 * - async pipe in template (subscribes/unsubscribes automatically)
 * - Observable from service
 * - Conditional rendering with *ngIf
 */
@Component({
  selector: 'app-loader',
  template: `
    <div class="loader-overlay" *ngIf="loaderService.loading$ | async">
      <mat-spinner diameter="50"></mat-spinner>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
  `]
})
export class LoaderComponent {
  constructor(public loaderService: LoaderService) {}
}
