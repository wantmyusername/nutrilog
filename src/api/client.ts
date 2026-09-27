export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// Base del API según el deploy (raíz o subcarpeta). En dev BASE_URL = '/'.
const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`

interface RequestOptions {
  method?: string
  body?: unknown
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin',
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(data?.error ?? `Error ${response.status}`, response.status)
  }

  return data as T
}
