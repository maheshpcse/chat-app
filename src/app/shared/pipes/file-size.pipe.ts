import { Pipe, PipeTransform } from '@angular/core';

/**
 * FileSizePipe - Transforms bytes into human-readable file size.
 *
 * Angular Concepts Used:
 * - Custom pipe for data transformation
 * - Usage: {{ file.size | fileSize }}
 *
 * Example in file upload:
 *   <span>{{ attachment.fileSize | fileSize }}</span>
 *   Output: "2.5 MB", "340 KB"
 */
@Pipe({
  name: 'fileSize'
})
export class FileSizePipe implements PipeTransform {

  transform(bytes: number, decimals: number = 2): string {
    if (!bytes || bytes === 0) { return '0 Bytes'; }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
