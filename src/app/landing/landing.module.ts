import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { LandingComponent } from './landing.component';

/**
 * LandingModule - Public site landing page (lazy loaded at the root URL).
 * Login / Sign Up are linked FROM here; they are not the entry page.
 */
const routes: Routes = [
  { path: '', component: LandingComponent }
];

@NgModule({
  declarations: [LandingComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class LandingModule {}
