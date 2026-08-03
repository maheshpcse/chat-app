import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { Error401Component } from './error-401/error-401.component';
import { Error403Component } from './error-403/error-403.component';
import { Error404Component } from './error-404/error-404.component';
import { Error500Component } from './error-500/error-500.component';
import { ErrorOfflineComponent } from './error-offline/error-offline.component';

const routes: Routes = [
  { path: '401', component: Error401Component },
  { path: '403', component: Error403Component },
  { path: '404', component: Error404Component },
  { path: '500', component: Error500Component },
  { path: 'offline', component: ErrorOfflineComponent },
  { path: '', redirectTo: '404', pathMatch: 'full' },
  { path: '**', component: Error404Component }
];

@NgModule({
  declarations: [
    Error401Component,
    Error403Component,
    Error404Component,
    Error500Component,
    ErrorOfflineComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ErrorsModule {}
