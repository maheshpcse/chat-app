import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-403',
  templateUrl: './error-403.component.html',
  styleUrls: ['./error-403.component.scss']
})
export class Error403Component {
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
