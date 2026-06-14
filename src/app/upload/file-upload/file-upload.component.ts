import { Component, Output, EventEmitter } from '@angular/core';
import { UploadService } from '../../core/services/upload.service';
import { APP_CONSTANTS } from '../../core/constants/app.constants';

/**
 * FileUploadComponent - Reusable file upload with drag-and-drop.
 *
 * Angular Concepts Used:
 * - @Output() EventEmitter (child-to-parent communication)
 * - HostListener (drag/drop events)
 * - Service injection for upload
 */
@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {

  @Output() fileUploaded = new EventEmitter<{ fileUrl: string; fileName: string }>();
  @Output() uploadError = new EventEmitter<string>();

  isUploading: boolean = false;
  isDragOver: boolean = false;
  uploadProgress: number = 0;

  constructor(private uploadService: UploadService) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  private uploadFile(file: File): void {
    // Validate file size
    if (file.size > APP_CONSTANTS.MAX_FILE_SIZE) {
      this.uploadError.emit('File size exceeds 10MB limit');
      return;
    }

    this.isUploading = true;

    this.uploadService.uploadLocal(file).subscribe(
      (result) => {
        this.isUploading = false;
        this.fileUploaded.emit(result);
      },
      (error) => {
        this.isUploading = false;
        this.uploadError.emit(error.message || 'Upload failed');
      }
    );
  }
}
