import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-offline',
  templateUrl: './error-offline.component.html',
  styleUrls: ['./error-offline.component.scss']
})
export class ErrorOfflineComponent {
  constructor(private router: Router, private location: Location) {}

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  goBack(): void {
    this.location.back();
  }

  retry(): void {
    window.location.reload();
  }
}
