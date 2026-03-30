const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiTimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "ApiTimeoutError";
  }
}

export async function apiPost<T>(
  path: string,
  body: FormData | object,
  timeoutMs = 30000
): Promise<T> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isFormData = body instanceof FormData;
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: isFormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}

export async function apiPostBlob(
  path: string,
  body: FormData | object,
  timeoutMs = 30000
): Promise<Blob> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isFormData = body instanceof FormData;
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: isFormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}
