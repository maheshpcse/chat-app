import { Component } from '@angular/core';

/**
 * AppFooterComponent — plain L/R copy for logged-in app shell only.
 * Landing / home page uses its own footer; do not reuse themed brand bar here.
 */
@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss']
})
export class AppFooterComponent {
  readonly currentYear = new Date().getFullYear();
}
