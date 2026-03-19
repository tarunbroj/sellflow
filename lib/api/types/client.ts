export interface ApiClientRequestOptions extends Omit<RequestInit, "body"> {
  path: string;
  body?: unknown;
  authToken?: string | null;
  timeoutMs?: number;
  retries?: number;
}

export interface ApiErrorShape {
  status: number;
  message: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor({ status, message, details }: ApiErrorShape) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}
