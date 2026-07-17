import { api } from '../api';

export interface UserMinimal {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'dealer' | 'admin';
  is_email_verified: boolean;
  phone_number?: string;
  dealer_status?: 'pending' | 'approved' | 'rejected' | null;
  /** Backend-authoritative flag. Frontend must use this for all purchase gating. */
  can_purchase: boolean;
  date_joined?: string;
}

export interface AuthResponseData {
  access: string;
  refresh: string;
  user: UserMinimal;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export const authService = {
  async register(payload: any): Promise<ApiResponse<AuthResponseData>> {
    const response = await api.post('auth/register/', payload);
    return response.data;
  },

  async dealerRegister(formData: FormData): Promise<ApiResponse<AuthResponseData>> {
    const response = await api.post('auth/dealer/register/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async login(payload: any): Promise<ApiResponse<AuthResponseData>> {
    const response = await api.post('auth/login/', payload);
    return response.data;
  },

  async logout(refreshToken: string): Promise<ApiResponse<null>> {
    const response = await api.post('auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  async getMe(): Promise<ApiResponse<any>> {
    const response = await api.get('auth/me/');
    return response.data;
  },

  async verifyEmail(token: string): Promise<ApiResponse<UserMinimal>> {
    const response = await api.get(`auth/verify-email/?token=${token}`);
    return response.data;
  },

  async resendVerification(): Promise<ApiResponse<null>> {
    const response = await api.post('auth/resend-verification/');
    return response.data;
  },

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    const response = await api.post('auth/forgot-password/', { email });
    return response.data;
  },

  async resetPassword(payload: any): Promise<ApiResponse<null>> {
    const response = await api.post('auth/reset-password/', payload);
    return response.data;
  },

  async changePassword(payload: any): Promise<ApiResponse<null>> {
    const response = await api.post('auth/change-password/', payload);
    return response.data;
  },
};
