/**
 * Validation Utility - Helper functions for form validation logic.
 */

export class ValidationUtility {

  static readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  static readonly PASSWORD_MIN_LENGTH = 8;
  static readonly USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

  /**
   * Get user-friendly error message for form field
   */
  static getErrorMessage(fieldName: string, errors: any): string {
    if (!errors) { return ''; }

    if (errors.required) {
      return `${fieldName} is required`;
    }
    if (errors.email) {
      return `Please enter a valid email address`;
    }
    if (errors.minlength) {
      return `${fieldName} must be at least ${errors.minlength.requiredLength} characters`;
    }
    if (errors.maxlength) {
      return `${fieldName} must not exceed ${errors.maxlength.requiredLength} characters`;
    }
    if (errors.pattern) {
      return `${fieldName} format is invalid`;
    }
    if (errors.passwordMismatch) {
      return `Passwords do not match`;
    }
    if (errors.noWhitespace) {
      return `${fieldName} cannot be only whitespace`;
    }

    return `${fieldName} is invalid`;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) { return '0 Bytes'; }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
