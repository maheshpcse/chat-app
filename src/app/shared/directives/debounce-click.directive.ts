import { Directive, EventEmitter, HostListener, OnInit, OnDestroy, Output, Input } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * DebounceClickDirective - Prevents rapid multiple clicks (double-submit).
 * Used on send message button, form submit buttons.
 *
 * Angular Concepts Used:
 * - @Directive
 * - Subject with debounceTime (RxJS)
 * - Subscription cleanup in ngOnDestroy
 * - @HostListener
 *
 * Usage:
 *   <button appDebounceClick (debounceClick)="sendMessage()" [debounceTime]="500">
 *     Send
 *   </button>
 */
@Directive({
  selector: '[appDebounceClick]'
})
export class DebounceClickDirective implements OnInit, OnDestroy {

  @Input() debounceTime = 500;
  @Output() debounceClick = new EventEmitter<any>();

  private clicks = new Subject<any>();
  private subscription: Subscription;

  ngOnInit(): void {
    this.subscription = this.clicks.pipe(
      debounceTime(this.debounceTime)
    ).subscribe(event => {
      this.debounceClick.emit(event);
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  @HostListener('click', ['$event'])
  clickEvent(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }
}
