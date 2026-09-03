import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

/**
 * Dismissible admin banner (success / error / warning).
 * Close icon clears message via dismiss output or two-way style clear.
 */
@Component({
  selector: 'app-admin-alert',
  templateUrl: './admin-alert.component.html',
  styleUrls: ['./admin-alert.component.scss']
})
export class AdminAlertComponent {
  /** success | error | warning */
  @Input() type: 'success' | 'error' | 'warning' = 'success';
  @Input() message = '';
  @Output() dismissed = new EventEmitter<void>();

  @HostBinding('class.has-message')
  get visible(): boolean {
    return !!(this.message && String(this.message).trim());
  }

  dismiss(): void {
    this.dismissed.emit();
  }
}
