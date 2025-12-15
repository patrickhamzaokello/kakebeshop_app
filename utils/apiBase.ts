import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private baseURL = "https://backend.kakebeshop.com";
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private authEndpoints = ["/auth/login/", "/auth/register/", "/auth/request-reset-email/", "/auth/verify-reset-code", "/auth/verify-email/", "/auth/resend-verification-code/","/auth/password-reset-complete/"];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
  }

 
  private isAuthEndpoint(url: string): boolean {
    // Normalize to just the pathname (without baseURL)
    const path = url.replace(this.baseURL, "");
    return this.authEndpoints.some((endpoint) => path.startsWith(endpoint));
  }
  

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        if (this.isAuthEndpoint(config.url || "")) {
          return config;
        }
        if (__DEV__) {
          console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
        }

        try {
          const accessToken = await SecureStore.getItemAsync("accessToken");
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch (error) {
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (__DEV__) {
          console.log('📥 API Response:', response.config.url, response.status);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Skip token refresh for auth endpoints
        if (this.isAuthEndpoint(originalRequest.url || "")) {
          return Promise.reject(error);
        }

        // Check if error is due to expired token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              // Process all queued requests
              this.processQueue(null, newToken);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            // Redirect to login or handle logout
            this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(`${this.baseURL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      if (response.data?.access) {
        const newAccessToken = response.data.access;
        await SecureStore.setItemAsync("accessToken", newAccessToken);

        // If new refresh token is provided, update it too
        if (response.data.refresh) {
          await SecureStore.setItemAsync("refreshToken", response.data.refresh);
        }

        return newAccessToken;
      }

      throw new Error("Invalid refresh response");
    } catch (error) {
      throw error;
    }
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async handleAuthError() {
    try {
      // Clear all auth data
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      await SecureStore.deleteItemAsync("userData");
      await SecureStore.deleteItemAsync("email");
      await SecureStore.deleteItemAsync("username");
      await SecureStore.deleteItemAsync("user_id");

      // You might want to trigger a navigation to login here
      // This could be done through a callback or event system
    } catch (error) {}
  }

  // HTTP Methods
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(url, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(url, data, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(url, data, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch(url, data, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(url, config);
      return {
        data: response.data,
        success: true,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";

    const statusCode = error.response?.status;

    return {
      success: false,
      message: errorMessage,
      statusCode,
      data: error.response?.data || null,
    };
  }

  // Utility methods
  setAuthToken(token: string) {
    this.axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.axiosInstance.defaults.headers.Authorization;
  }

  // Get current instance for direct axios calls if needed
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;

// Also export the class for testing or multiple instances if needed
export { ApiService };
