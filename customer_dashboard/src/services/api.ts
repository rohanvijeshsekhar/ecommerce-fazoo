import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1/';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// A small module-level state to hold the access token in memory
let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  _accessToken = token;
};

export const getAccessToken = () => {
  return _accessToken;
};

// Request Interceptor: Attach the access token if present
api.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401s and token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle blocked or soft-deleted user immediately
    const errorData = error.response?.data;
    const detail = errorData?.detail || errorData?.message || "";
    const isBlockedOrDeleted = 
      (error.response?.status === 401 || error.response?.status === 403) &&
      (detail.toLowerCase().includes("blocked") || detail.toLowerCase().includes("deleted"));

    if (isBlockedOrDeleted) {
      const userStr = localStorage.getItem('faazo_user');
      let shouldClear = true;
      if (userStr) {
        try {
          const storedUser = JSON.parse(userStr);
          if (storedUser.role === 'admin') {
            shouldClear = false;
          }
        } catch (e) {
          // ignore
        }
      }

      setAccessToken(null);
      if (shouldClear) {
        localStorage.removeItem('faazo_refresh_token');
        localStorage.removeItem('faazo_user');
      }
      window.dispatchEvent(new Event('faazo_auth_expired'));
      window.location.replace('/');
      return Promise.reject(error);
    }

    // If it's a 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('faazo_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        setAccessToken(null);
        localStorage.removeItem('faazo_user');
        window.dispatchEvent(new Event('faazo_auth_expired'));
        return Promise.reject(error);
      }

      try {
        // Request a new access token
        const response = await axios.post(`${API_BASE_URL}auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access, refresh: newRefresh } = response.data;

        // Store new tokens
        setAccessToken(access);
        if (newRefresh) {
          localStorage.setItem('faazo_refresh_token', newRefresh);
        }

        processQueue(null, access);
        isRefreshing = false;

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear tokens if refresh fails (e.g. refresh token expired/blacklisted)
        setAccessToken(null);
        localStorage.removeItem('faazo_refresh_token');
        localStorage.removeItem('faazo_user');

        // Dispatch a custom event to notify components (like AuthContext) to log out
        window.dispatchEvent(new Event('faazo_auth_expired'));

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const getAbsoluteImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = 'http://localhost:8000';
  if (url.startsWith('/')) return `${base}${url}`;
  return `${base}/${url}`;
};

