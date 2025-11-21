import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Add token to requests if it exists
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    localStorage.removeItem('auth_token');
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Assets endpoints
  async getAssets(page: number = 1, pageSize: number = 10) {
    const response = await this.client.get('/assets', {
      params: { page, pageSize },
    });
    return response.data;
  }

  async getAsset(id: string) {
    const response = await this.client.get(`/assets/${id}`);
    return response.data;
  }

  async createAsset(data: any) {
    const response = await this.client.post('/assets', data);
    return response.data;
  }

  async updateAsset(id: string, data: any) {
    const response = await this.client.put(`/assets/${id}`, data);
    return response.data;
  }

  async deleteAsset(id: string) {
    const response = await this.client.delete(`/assets/${id}`);
    return response.data;
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export const apiClient = new ApiClient();
