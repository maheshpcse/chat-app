import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * NoWhitespaceValidator - Ensures field is not only whitespace.
 *
 * Angular Concepts Used:
 * - Custom validator function
 * - AbstractControl value checking
 *
 * Usage:
 *   this.form = this.fb.group({
 *     message: ['', [Validators.required, noWhitespaceValidator()]]
 *   });
 */
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) {
      return null; // Let 'required' handle empty
    }

    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { noWhitespace: true } : null;
  };
}
