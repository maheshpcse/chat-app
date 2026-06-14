import { Directive, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';

/**
 * ClickOutsideDirective - Detects clicks outside of the host element.
 * Used for closing dropdowns, menus, notification panels.
 *
 * Angular Concepts Used:
 * - @Directive with selector
 * - @Output EventEmitter
 * - @HostListener for document click events
 * - ElementRef for checking click target
 *
 * Usage:
 *   <div class="dropdown" (appClickOutside)="closeDropdown()">
 *     ...dropdown content...
 *   </div>
 */
@Directive({
  selector: '[appClickOutside]'
})
export class ClickOutsideDirective {

  @Output() appClickOutside = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  onClick(targetElement: HTMLElement): void {
    const clickedInside = this.el.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.appClickOutside.emit();
    }
  }
}
