// API Client for PoolOps Mobile
// Binds JWT token to all requests and handles silent refresh on 401

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3003';

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string, token: string | null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async getAuthenticatedHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async refreshToken(): Promise<void> {
    // Get current token and user from secure store
    const [currentToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync('auth_token'),
      SecureStore.getItemAsync('refresh_token'),
    ]);

    if (!currentToken || !refreshToken) {
      // No refresh token available, force logout
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_role');
      await SecureStore.deleteItemAsync('auth_user');
      this.token = null;
      logoutCallback?.();
      return;
    }

    try {
      // Call refresh endpoint
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Store new token
        await SecureStore.setItemAsync('auth_token', data.token);
        this.token = data.token;
      } else {
        // Refresh failed, clear auth
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('auth_role');
        await SecureStore.deleteItemAsync('auth_user');
        this.token = null;
        logoutCallback?.();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth on error
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_role');
      await SecureStore.deleteItemAsync('auth_user');
      this.token = null;
      logoutCallback?.();
    }
  }

  public async request<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const headers = await this.getAuthenticatedHeaders();

    // Build query string
    let fullUrl = `${this.baseUrl}${url}`;
    if (options.params) {
      const params = new URLSearchParams(options.params as Record<string, string>);
      fullUrl += `?${params.toString()}`;
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.token) {
      await this.refreshToken();
      const retryHeaders = await this.getAuthenticatedHeaders();
      const retryResponse = await fetch(fullUrl, { ...options, headers: retryHeaders });
      return this.handleResponse<T>(retryResponse);
    }

    return this.handleResponse<T>(response);
  }

  public async get<T>(url: string, params?: Record<string, string | number>): Promise<T> {
    return this.request<T>(url, { method: 'GET', params });
  }

  public async post<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>(url, { method: 'POST', body: JSON.stringify(body) });
  }

  public async put<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body: JSON.stringify(body) });
  }

  public async patch<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>(url, { method: 'PATCH', body: JSON.stringify(body) });
  }

  public async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

// Module-level token so authenticated calls work after login
let currentToken: string | null = null;
let apiClient: ApiClient | null = null;
let logoutCallback: (() => void) | null = null;

export function setApiToken(token: string | null): void {
  currentToken = token;
  apiClient = new ApiClient(API_BASE_URL, token);
}

export function setLogoutCallback(fn: (() => void) | null): void {
  logoutCallback = fn;
}

export function getApiClient(): ApiClient {
  if (!apiClient) {
    apiClient = new ApiClient(API_BASE_URL, currentToken);
  }
  return apiClient;
}

export function createApiClient(token: string | null): ApiClient {
  return new ApiClient(API_BASE_URL, token);
}

export default getApiClient;
