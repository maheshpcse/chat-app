import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ChatService } from '../../core/services/chat.service';
import { UploadService } from '../../core/services/upload.service';
import { MessageType } from '../../core/models/message.model';
import { APP_CONSTANTS } from '../../core/constants/app.constants';

/**
 * MessageInputComponent - Message text area with file upload and typing indicator.
 *
 * Angular Concepts Used:
 * - FormControl (standalone reactive form control)
 * - Subject with debounceTime (typing detection)
 * - distinctUntilChanged (avoid duplicate emissions)
 * - File input handling
 * - ViewChild not needed here - uses FormControl valueChanges
 */
@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponent implements OnInit, OnDestroy {

  messageControl = new FormControl('');
  isUploading: boolean = false;
  selectedFile: File | null = null;

  private typingSubject = new Subject<boolean>();
  private typingTimeout: any;
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    // Listen to input changes for typing indicator
    const valueSub = this.messageControl.valueChanges.pipe(
      debounceTime(APP_CONSTANTS.SEARCH_DEBOUNCE_TIME),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value && value.trim()) {
        this.handleTypingStart();
      }
    });
    this.subscriptions.push(valueSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  sendMessage(): void {
    const content = this.messageControl.value?.trim();
    if (!content && !this.selectedFile) { return; }

    if (this.selectedFile) {
      this.uploadAndSend();
    } else {
      this.chatService.sendMessage(content, MessageType.TEXT);
      this.messageControl.setValue('');
      this.handleTypingStop();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size
      if (file.size > APP_CONSTANTS.MAX_FILE_SIZE) {
        alert('File size exceeds 10MB limit');
        return;
      }

      this.selectedFile = file;
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
  }

  onKeyDown(event: KeyboardEvent): void {
    // Send on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private uploadAndSend(): void {
    if (!this.selectedFile) { return; }

    this.isUploading = true;
    const file = this.selectedFile;
    const type = this.getMessageType(file);

    this.uploadService.uploadLocal(file).subscribe(
      (result) => {
        this.isUploading = false;
        const content = this.messageControl.value?.trim() || file.name;
        this.chatService.sendMessage(content, type, result.fileUrl, result.fileName, file.size);
        this.messageControl.setValue('');
        this.selectedFile = null;
      },
      (error) => {
        this.isUploading = false;
        console.error('Upload failed:', error);
      }
    );
  }

  private getMessageType(file: File): MessageType {
    if (APP_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return MessageType.IMAGE;
    }
    return MessageType.FILE;
  }

  private handleTypingStart(): void {
    this.chatService.startTyping();

    // Auto-stop typing after timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = setTimeout(() => {
      this.handleTypingStop();
    }, APP_CONSTANTS.TYPING_TIMEOUT);
  }

  private handleTypingStop(): void {
    this.chatService.stopTyping();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }
}
