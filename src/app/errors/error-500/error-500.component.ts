import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-500',
  templateUrl: './error-500.component.html',
  styleUrls: ['./error-500.component.scss']
})
export class Error500Component {
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
