import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * MatchPasswordValidator - Custom validator to ensure password and confirm password match.
 *
 * Angular Concepts Used:
 * - Custom validator function (ValidatorFn)
 * - FormGroup-level validation
 * - AbstractControl for accessing form controls
 *
 * Usage in Register component:
 *   this.registerForm = this.fb.group({
 *     password: ['', [Validators.required, Validators.minLength(8)]],
 *     confirmPassword: ['', [Validators.required]]
 *   }, { validators: matchPasswordValidator('password', 'confirmPassword') });
 */
export function matchPasswordValidator(passwordField: string, confirmField: string): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.get(passwordField);
    const confirm = control.get(confirmField);

    if (!password || !confirm) {
      return null;
    }

    if (password.value !== confirm.value) {
      confirm.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Clear the error if previously set
      if (confirm.hasError('passwordMismatch')) {
        confirm.setErrors(null);
      }
      return null;
    }
  };
}
