import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api.constants';
import { IApiResponse } from '../models/api-response.model';

/**
 * UploadService - Handles file uploads (local and S3) and downloads.
 *
 * Angular Concepts Used:
 * - HttpClient with FormData for file uploads
 * - Observable for async file operations
 * - HttpParams for download query params
 */
@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private http: HttpClient) {}

  /**
   * Upload file to local server storage.
   */
  uploadLocal(file: File): Observable<{ fileUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<IApiResponse<{ fileUrl: string; fileName: string }>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.UPLOADS.LOCAL}`,
      formData
    ).pipe(map(response => response.data));
  }

  /**
   * Upload file to AWS S3.
   */
  uploadS3(file: File): Observable<{ fileUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<IApiResponse<{ fileUrl: string; fileName: string }>>(
      `${environment.apiBaseUrl}${API_ENDPOINTS.UPLOADS.S3}`,
      formData
    ).pipe(map(response => response.data));
  }

  /**
   * Download file by key/filename.
   */
  downloadFile(fileKey: string): Observable<Blob> {
    const params = new HttpParams().set('key', fileKey);

    return this.http.get(
      `${environment.apiBaseUrl}${API_ENDPOINTS.UPLOADS.DOWNLOAD}`,
      { params, responseType: 'blob' }
    );
  }
}
