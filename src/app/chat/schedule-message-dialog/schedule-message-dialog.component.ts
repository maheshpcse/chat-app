import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScheduledMessageService } from '../../core/services/scheduled-message.service';
import { ICreateScheduledMessage } from '../../core/models/scheduled-message.model';

/**
 * ScheduleMessageDialogComponent - Dialog for scheduling a message.
 *
 * Angular Concepts Used:
 * - MatDialogRef + MAT_DIALOG_DATA for dialog I/O
 * - Reactive Forms with validators
 * - Custom date/time min validation
 */
@Component({
  selector: 'app-schedule-message-dialog',
  templateUrl: './schedule-message-dialog.component.html',
  styleUrls: ['./schedule-message-dialog.component.scss']
})
export class ScheduleMessageDialogComponent implements OnInit {

  scheduleForm: FormGroup;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  minDate: string;
  minTime: string;

  constructor(
    private fb: FormBuilder,
    private scheduledMessageService: ScheduledMessageService,
    public dialogRef: MatDialogRef<ScheduleMessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { conversationId: string; conversationName: string }
  ) {}

  ngOnInit(): void {
    // Set minimum date/time to now + 1 minute
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    this.minDate = this.formatDateForInput(now);
    this.minTime = this.formatTimeForInput(now);

    this.scheduleForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]],
      scheduledDate: [this.minDate, [Validators.required]],
      scheduledTime: [this.minTime, [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.scheduleForm.invalid) { return; }

    const { content, scheduledDate, scheduledTime } = this.scheduleForm.value;

    // Combine date + time into ISO string
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

    // Validate it's in the future
    if (scheduledAt <= new Date()) {
      this.errorMessage = 'Scheduled time must be in the future';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload: ICreateScheduledMessage = {
      conversationId: this.data.conversationId,
      content: content.trim(),
      scheduledAt: scheduledAt.toISOString()
    };

    this.scheduledMessageService.createScheduledMessage(payload).subscribe(
      (scheduled) => {
        this.isSubmitting = false;
        this.dialogRef.close(scheduled);
      },
      (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message || 'Failed to schedule message';
      }
    );
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
