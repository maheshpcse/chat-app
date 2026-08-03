import { Component, Input } from '@angular/core';

/**
 * ShimmerComponent - Smooth skeleton placeholder shown while page data loads.
 * Replaces the old full-screen spinner overlay.
 *
 * Usage:
 *   <app-shimmer variant="list" [rows]="6"></app-shimmer>   // avatar + two lines per row
 *   <app-shimmer variant="cards" [rows]="4"></app-shimmer>  // card blocks
 *   <app-shimmer variant="lines" [rows]="8"></app-shimmer>  // plain text lines
 */
@Component({
  selector: 'app-shimmer',
  template: `
    <div class="shimmer-wrap" [ngClass]="'variant-' + variant">
      <ng-container [ngSwitch]="variant">

        <!-- Avatar + text rows (contacts / conversations / notifications) -->
        <ng-container *ngSwitchCase="'list'">
          <div class="sh-row" *ngFor="let r of items">
            <div class="sh shimmer sh-avatar"></div>
            <div class="sh-lines">
              <div class="sh shimmer sh-line w-40"></div>
              <div class="sh shimmer sh-line w-70"></div>
            </div>
          </div>
        </ng-container>

        <!-- Card blocks (dashboard / settings sections) -->
        <ng-container *ngSwitchCase="'cards'">
          <div class="sh shimmer sh-card" *ngFor="let r of items"></div>
        </ng-container>

        <!-- Plain lines -->
        <ng-container *ngSwitchDefault>
          <div class="sh shimmer sh-line block" *ngFor="let r of items"></div>
        </ng-container>

      </ng-container>
    </div>
  `,
  styleUrls: ['./shimmer.component.scss']
})
export class ShimmerComponent {
  @Input() variant: 'list' | 'cards' | 'lines' = 'list';
  @Input() rows = 5;

  get items(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
