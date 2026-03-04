import { env } from "@/lib/env";
import { ApiClientError, ApiClientRequestOptions } from "@/lib/api/types/client";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 1;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildUrl = (path: string) => {
  if (!env.EXPO_PUBLIC_BACKEND_BASE_URL) {
    throw new ApiClientError({
      status: 500,
      message: "Missing EXPO_PUBLIC_BACKEND_BASE_URL",
    });
  }

  return new URL(path, env.EXPO_PUBLIC_BACKEND_BASE_URL).toString();
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiClientError({
      status: response.status,
      message:
        (isJson && (payload?.message ?? payload?.error)) ||
        `Request failed with status ${response.status}`,
      details: payload,
    });
  }

  return payload as T;
};

export const apiClient = async <T>({
  path,
  body,
  authToken,
  headers,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
  ...init
}: ApiClientRequestOptions): Promise<T> => {
  const url = buildUrl(path);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await parseResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      const isLastAttempt = attempt === retries;
      const isAbortError =
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("aborted"));

      if (isLastAttempt) {
        if (isAbortError) {
          throw new ApiClientError({
            status: 408,
            message: `Request timed out after ${timeoutMs}ms`,
          });
        }

        if (error instanceof ApiClientError) {
          throw error;
        }

        throw new ApiClientError({
          status: 500,
          message: error instanceof Error ? error.message : "Unknown network error",
          details: error,
        });
      }

      await delay(300 * (attempt + 1));
    }
  }

  throw new ApiClientError({
    status: 500,
    message: "Request failed unexpectedly",
  });
};
