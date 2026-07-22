import axios from 'axios';
import toast from 'react-hot-toast';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // For HTTP-only refresh cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to unwrap backend format and handle 401s
apiClient.interceptors.response.use(
  (response) => {
    // Backend returns { success, data, message }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if it's a 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token using the httpOnly cookie
        const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh-token`, {}, {
          withCredentials: true 
        });
        
        if (res.data.success && res.data.data.accessToken) {
          localStorage.setItem('token', res.data.data.accessToken);
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed (cookie expired/invalid), force logout
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Extract standardized error message from backend
    const errorMessage = error.response?.data?.message || 'Something went wrong';
    
    // Show toast for server errors automatically
    if (error.response?.status >= 500) {
       toast.error(errorMessage);
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
