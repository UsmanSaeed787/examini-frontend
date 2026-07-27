export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface MessageResponse {
  message: string;
}

