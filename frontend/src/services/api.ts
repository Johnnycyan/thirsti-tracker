const API_BASE_URL = ''  // Empty for same-origin, or set to backend URL

interface ApiClientOptions {
  headers?: Record<string, string>
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  private getHeaders(options?: ApiClientOptions): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...options?.headers,
    })

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`)
    }

    return headers
  }

  async get<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(options),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async post<T>(endpoint: string, data?: unknown, options?: ApiClientOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(options),
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async put<T>(endpoint: string, data?: unknown, options?: ApiClientOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(options),
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async delete<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(options),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Auth helpers
export async function login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
  const response = await apiClient.post<{ token: string; user: { id: string; email: string } }>('/api/auth/login', { email, password })
  apiClient.setToken(response.token)
  return response
}

export async function register(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
  const response = await apiClient.post<{ token: string; user: { id: string; email: string } }>('/api/auth/register', { email, password })
  apiClient.setToken(response.token)
  return response
}

export function logout() {
  apiClient.setToken(null)
}

export function isAuthenticated(): boolean {
  return apiClient.getToken() !== null
}

export async function checkHasUsers(): Promise<boolean> {
  const response = await apiClient.get<{ has_users: boolean }>('/api/auth/has-users')
  return response.has_users
}
