import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/**
 * ConfirmDialogComponent - Reusable confirmation dialog.
 *
 * Angular Concepts Used:
 * - MatDialog (Angular Material)
 * - MAT_DIALOG_DATA injection token
 * - MatDialogRef for closing dialog
 *
 * Usage from any component:
 *   const dialogRef = this.dialog.open(ConfirmDialogComponent, {
 *     data: { title: 'Delete Message', message: 'Are you sure?' }
 *   });
 *   dialogRef.afterClosed().subscribe(result => { if (result) { ... } });
 */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string; confirmText?: string }
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
