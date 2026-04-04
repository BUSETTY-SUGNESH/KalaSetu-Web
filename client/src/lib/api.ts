import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './authToken';

type ApiEnvelope<T = unknown> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

const buildApiBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:5000/api';
  const normalized = raw.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const api = axios.create({
  baseURL: buildApiBaseUrl(),
  withCredentials: true,
  timeout: 15000,
});

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axios
    .post(`${api.defaults.baseURL}/auth/refresh-token`, {}, { withCredentials: true })
    .then((res) => {
      const payload = res.data as
        | ApiEnvelope<{ accessToken?: string }>
        | { accessToken?: string }
        | undefined;

      const accessToken =
        payload &&
        typeof payload === 'object' &&
        'data' in payload &&
        payload.data &&
        typeof payload.data === 'object' &&
        typeof payload.data.accessToken === 'string'
          ? payload.data.accessToken
          : payload &&
              typeof payload === 'object' &&
              'accessToken' in payload &&
              typeof payload.accessToken === 'string'
            ? payload.accessToken
            : undefined;

      if (!accessToken) {
        clearAccessToken();
        return null;
      }

      setAccessToken(accessToken);
      return accessToken;
    })
    .catch(() => {
      clearAccessToken();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiEnvelope;
    if (
      body &&
      typeof body === 'object' &&
      typeof body.success === 'boolean' &&
      Object.prototype.hasOwnProperty.call(body, 'data')
    ) {
      response.data = body.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/signup') ||
      requestUrl.includes('/auth/refresh-token');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const accessToken = await refreshAccessToken();
      if (accessToken) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      }

      clearAccessToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.error('API timeout:', error.config?.url);
    }

    console.error('API error:', error);

    return Promise.reject(error);
  }
);

/** Use when showing auth / form errors (handles network vs API body). */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ error?: string; message?: string }>;
    const fromBody = ax.response?.data?.error || ax.response?.data?.message;
    if (fromBody && typeof fromBody === 'string') {
      return fromBody;
    }
    if (ax.code === 'ECONNABORTED') {
      return 'The request timed out. Please try again.';
    }
    if (ax.code === 'ERR_NETWORK' || ax.message === 'Network Error') {
      const base = api.defaults.baseURL || '/api';
      return `Cannot reach the API (${base}). Start the server (cd server && npm run dev) and use the same host in the browser as NEXT_PUBLIC_API_URL / FRONTEND_URL.`;
    }
    return ax.message || 'Request failed';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
};

export default api;
