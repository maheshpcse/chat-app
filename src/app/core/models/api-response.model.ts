// ===========================
// API Response Model
// ===========================
export interface IApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    pagination?: IPagination;
  };
}

export interface IPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IApiError {
  success: boolean;
  message: string;
  errors?: string[];
  statusCode: number;
}
