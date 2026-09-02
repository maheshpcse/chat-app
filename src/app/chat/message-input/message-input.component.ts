import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ChatService } from '../../core/services/chat.service';
import { UploadService } from '../../core/services/upload.service';
import { SettingsService } from '../../core/services/settings.service';
import { MessageType } from '../../core/models/message.model';
import { APP_CONSTANTS } from '../../core/constants/app.constants';
import { ScheduleMessageDialogComponent } from '../schedule-message-dialog/schedule-message-dialog.component';

/**
 * MessageInputComponent - footer composer.
 * Emoji panel uses header-notification open/close pattern (click + outside + fade).
 */
@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponent implements OnInit, OnDestroy {

  @ViewChild('emojiButton', { static: false }) emojiButton: ElementRef<HTMLElement>;
  @ViewChild('emojiPanel', { static: false }) emojiPanel: ElementRef<HTMLElement>;

  messageControl = new FormControl('');
  isUploading = false;
  selectedFile: File | null = null;
  showEmojiPicker = false;
  emojiClosing = false;

  private typingTimeout: any;
  private emojiHideTimer: any = null;
  private readonly emojiFadeMs = 420;
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private uploadService: UploadService,
    private settingsService: SettingsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
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
    this.clearEmojiHideTimer();
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
    if (event.key !== 'Enter') {
      return;
    }
    const enterSends = this.settingsService.toChatPreferences().enterSends !== false;
    if (enterSends && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
      return;
    }
    // enterSends off: Enter = newline; Ctrl/Cmd+Enter still sends
    if (!enterSends && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleEmojiPicker(): void {
    if (this.showEmojiPicker || this.emojiClosing) {
      this.closeEmojiPicker();
      return;
    }
    this.clearEmojiHideTimer();
    this.emojiClosing = false;
    this.showEmojiPicker = true;
    this.scheduleEmojiHide(4000);
  }

  insertEmoji(emoji: string): void {
    const current = this.messageControl.value || '';
    this.messageControl.setValue(current + emoji);
    this.clearEmojiHideTimer();
    this.scheduleEmojiHide(4000);
  }

  closeEmojiPicker(immediate: boolean = false): void {
    this.clearEmojiHideTimer();
    if (!this.showEmojiPicker && !this.emojiClosing) {
      return;
    }
    if (immediate || this.emojiClosing) {
      this.showEmojiPicker = false;
      this.emojiClosing = false;
      return;
    }
    this.emojiClosing = true;
    this.emojiHideTimer = setTimeout(() => {
      this.showEmojiPicker = false;
      this.emojiClosing = false;
      this.emojiHideTimer = null;
    }, this.emojiFadeMs);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showEmojiPicker && !this.emojiClosing) {
      return;
    }
    const target = event.target as Node | null;
    const inBtn = !!this.emojiButton?.nativeElement?.contains(target);
    const inPanel = !!this.emojiPanel?.nativeElement?.contains(target);
    if (!inBtn && !inPanel) {
      this.closeEmojiPicker();
    }
  }

  onEmojiPanelEnter(): void {
    if (!this.showEmojiPicker) {
      return;
    }
    this.clearEmojiHideTimer();
    this.emojiClosing = false;
  }

  onEmojiPanelLeave(): void {
    this.scheduleEmojiHide(600);
  }

  private scheduleEmojiHide(delay: number): void {
    this.clearEmojiHideTimer();
    this.emojiHideTimer = setTimeout(() => this.closeEmojiPicker(), delay);
  }

  private clearEmojiHideTimer(): void {
    if (this.emojiHideTimer) {
      clearTimeout(this.emojiHideTimer);
      this.emojiHideTimer = null;
    }
  }

  autoGrow(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    if (!el) { return; }
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 128);
    el.style.height = String(Math.max(next, 24)) + 'px';
  }

  openScheduleDialog(): void {
    const activeConv = this.chatService.getActiveConversation();
    if (!activeConv) { return; }

    const dialogRef = this.dialog.open(ScheduleMessageDialogComponent, {
      data: {
        conversationId: activeConv.conversationId,
        conversationName: activeConv.displayName || 'this conversation'
      },
      width: '480px',
      panelClass: 'schedule-message-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Message scheduled:', result);
      }
    });
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
        this.chatService.sendMessage(content, type, result.fileUrl);
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
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = setTimeout(() => this.handleTypingStop(), APP_CONSTANTS.TYPING_TIMEOUT);
  }

  private handleTypingStop(): void {
    this.chatService.stopTyping();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }
}
