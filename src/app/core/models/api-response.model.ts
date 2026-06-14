// ===========================
// API Response Model
// ===========================
export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiError {
  success: boolean;
  message: string;
  errors?: string[];
  statusCode: number;
}
