import { Component } from '@angular/core';

/**
 * AppFooterComponent — non-sticky site footer for authenticated shells + public pages.
 */
@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss']
})
export class AppFooterComponent {
  readonly currentYear = new Date().getFullYear();
}
