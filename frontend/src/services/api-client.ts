import { getErrorMessage, isNetworkError, isAuthError } from '../lib/error-handler.js';

interface ApiRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

/**
 * Frontend API Service with error handling and retry logic
 */
class ApiClient {
  private baseURL: string;
  private defaultTimeout = 10000;
  private defaultRetries = 3;

  constructor(baseURL: string = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      // Handle auth errors
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      } catch {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  }

  async request<T>(
    method: string,
    url: string,
    data?: any,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    let lastError: Error | null = null;
    const retries = options.retries ?? this.defaultRetries;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = options.timeout ?? this.defaultTimeout;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(fullUrl, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return await this.handleResponse(response);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (
          lastError.message.includes('401') ||
          lastError.message.includes('403') ||
          lastError.message.includes('404')
        ) {
          throw lastError;
        }

        // Retry on network errors and 5xx
        if (attempt < retries) {
          const delay = 1000 * Math.pow(2, attempt);
          await this.delay(delay);
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('POST', url, data, options);
  }

  async put<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('PUT', url, data, options);
  }

  async delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  async uploadFile<T>(url: string, file: File, options?: ApiRequestOptions): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const fullUrl = `${this.baseURL}${url}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...(options?.headers || {}),
    };

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  // Auth API methods
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    return this.post('/auth/login', { email, password });
  }

  async register(email: string, password: string, name: string): Promise<{ token: string; user: any }> {
    return this.post('/auth/register', { email, password, name });
  }

  async getCurrentUser(): Promise<any> {
    return this.get('/auth/me');
  }

  // Asset API methods
  async getAssets(page: number = 1, pageSize: number = 10): Promise<any> {
    return this.get(`/assets?page=${page}&pageSize=${pageSize}`);
  }

  async getAsset(id: string): Promise<any> {
    return this.get(`/assets/${id}`);
  }

  async createAsset(data: any): Promise<any> {
    return this.post('/assets', data);
  }

  async updateAsset(id: string, data: any): Promise<any> {
    return this.put(`/assets/${id}`, data);
  }

  async deleteAsset(id: string): Promise<any> {
    return this.delete(`/assets/${id}`);
  }
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const apiClient = new ApiClient(baseURL);
