export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'X-Requested-With': 'fetch',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (!res.ok) {
    let message = 'Request failed'
    try {
      message = ((await res.json()) as { error?: string }).error ?? message
    } catch {
      // Non-JSON error body (for example a host error page).
    }
    throw new ApiError(res.status, message)
  }
  return (await res.json()) as T
}
