import { Directive, ElementRef, AfterViewInit, Input, OnDestroy } from '@angular/core';

/**
 * AutoScrollDirective - Automatically scrolls to bottom when new content is added.
 * Used in chat window to keep latest messages visible.
 *
 * Angular Concepts Used:
 * - @Directive decorator
 * - ElementRef for DOM access
 * - AfterViewInit lifecycle hook
 * - MutationObserver for DOM changes
 *
 * Usage:
 *   <div class="messages-container" appAutoScroll>
 *     <div *ngFor="let message of messages">...</div>
 *   </div>
 */
@Directive({
  selector: '[appAutoScroll]'
})
export class AutoScrollDirective implements AfterViewInit, OnDestroy {

  @Input() appAutoScroll = true;

  private observer: MutationObserver;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.observer = new MutationObserver(() => {
      if (this.appAutoScroll) {
        this.scrollToBottom();
      }
    });

    this.observer.observe(this.el.nativeElement, {
      childList: true,
      subtree: true
    });

    // Initial scroll
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private scrollToBottom(): void {
    const element = this.el.nativeElement;
    element.scrollTop = element.scrollHeight;
  }
}
