import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-401',
  templateUrl: './error-401.component.html',
  styleUrls: ['./error-401.component.scss']
})
export class Error401Component {
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
