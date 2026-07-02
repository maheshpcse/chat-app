import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Shared Components
import { LoaderComponent } from './components/loader/loader.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AvatarComponent } from './components/avatar/avatar.component';

// Shared Pipes
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { TruncatePipe } from './pipes/truncate.pipe';
import { FileSizePipe } from './pipes/file-size.pipe';
import { LastSeenPipe } from './pipes/last-seen.pipe';
import { MessageTimePipe } from './pipes/message-time.pipe';

// Shared Directives
import { AutoScrollDirective } from './directives/auto-scroll.directive';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { DebounceClickDirective } from './directives/debounce-click.directive';

/**
 * SharedModule - Contains reusable components, pipes, directives, and Angular Material modules.
 * Imported by all feature modules that need shared functionality.
 *
 * Angular Concepts Used:
 * - exports array (makes declarations available to importing modules)
 * - Re-exporting Angular Material modules
 * - Centralized Material imports (DRY principle)
 */

const MATERIAL_MODULES = [
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatFormFieldModule,
  MatCardModule,
  MatListModule,
  MatToolbarModule,
  MatSidenavModule,
  MatMenuModule,
  MatBadgeModule,
  MatDialogModule,
  MatProgressSpinnerModule,
  MatChipsModule,
  MatAutocompleteModule,
  MatTabsModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatDividerModule,
  MatProgressBarModule
];

@NgModule({
  declarations: [
    // Components
    LoaderComponent,
    ConfirmDialogComponent,
    AvatarComponent,
    // Pipes
    TimeAgoPipe,
    TruncatePipe,
    FileSizePipe,
    LastSeenPipe,
    MessageTimePipe,
    // Directives
    AutoScrollDirective,
    ClickOutsideDirective,
    DebounceClickDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES
  ],
  exports: [
    // Modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES,
    // Components
    LoaderComponent,
    ConfirmDialogComponent,
    AvatarComponent,
    // Pipes
    TimeAgoPipe,
    TruncatePipe,
    FileSizePipe,
    LastSeenPipe,
    MessageTimePipe,
    // Directives
    AutoScrollDirective,
    ClickOutsideDirective,
    DebounceClickDirective
  ],
  entryComponents: [
    ConfirmDialogComponent
  ]
})
export class SharedModule {}
