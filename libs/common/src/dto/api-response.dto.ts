export class ApiResponseDto<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;

  constructor(data: T, message?: string) {
    this.success = true;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }
}

export class ApiErrorDto {
  success: boolean;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  path: string;
  timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    path: string,
    errors?: Record<string, string[]>,
  ) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.path = path;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }
}
