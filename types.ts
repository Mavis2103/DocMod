export interface DeployResponse {
  success: boolean;
  message: string;
  folder: string;
  filesProcessed: number;
}

export interface ErrorResponse {
  error: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface NotFoundResponse {
  error: string;
  availableEndpoints: string[];
}

export type ApiResponse = DeployResponse | ErrorResponse | HealthResponse | NotFoundResponse;
