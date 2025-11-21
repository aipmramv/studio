import { logger } from '../lib/logger.js';
import { ErrorRecovery, CircuitBreaker } from '../lib/error-recovery.js';

/**
 * API Service for backend with comprehensive error handling
 */
class ApiService {
  private baseURL: string;
  private maxRetries = 3;
  private retryDelay = 1000;
  private circuitBreaker: CircuitBreaker;

  constructor(baseURL: string = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
    this.circuitBreaker = new CircuitBreaker(5, 2);
  }

  /**
   * Make API request with automatic retry logic and circuit breaker
   */
  async request<T>(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`;

    return ErrorRecovery.retryWithBackoff(
      async () => {
        return this.circuitBreaker.execute(async () => {
          const response = await fetch(fullUrl, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            body: data ? JSON.stringify(data) : undefined,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error((errorData as any).message || response.statusText);
            (error as any).status = response.status;
            throw error;
          }

          return response.json() as Promise<T>;
        });
      },
      this.maxRetries,
      this.retryDelay
    );
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', url, undefined, headers);
  }

  async post<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', url, data, headers);
  }

  async put<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', url, data, headers);
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', url, undefined, headers);
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  async register(email: string, password: string, name: string) {
    return this.post('/auth/register', { email, password, name });
  }

  // Asset endpoints
  async getAssets(page: number = 1, pageSize: number = 10) {
    return this.get(`/assets?page=${page}&pageSize=${pageSize}`);
  }

  async getAsset(id: string) {
    return this.get(`/assets/${id}`);
  }

  async createAsset(data: any) {
    return this.post('/assets', data);
  }

  async updateAsset(id: string, data: any) {
    return this.put(`/assets/${id}`, data);
  }

  async deleteAsset(id: string) {
    return this.delete(`/assets/${id}`);
  }
}

export const apiService = new ApiService(
  process.env.API_URL || 'http://localhost:5000/api'
);
