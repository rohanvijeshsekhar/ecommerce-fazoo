import { api } from '../api';
import type { ApiResponse } from './auth';

export interface UserProfile {
  id: string;
  avatar: string | null;
  avatar_url: string | null;
  // Core user fields (read-only from API)
  full_name: string;
  phone_number: string | null;
  email: string;
  role: string;
  is_email_verified: boolean;
  // Commerce profile
  profession: string;
  // Clinic details
  clinic_name: string;
  gst_number: string;
  clinic_phone: string;
  clinic_email: string;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  label: string;
  full_name: string;
  mobile: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  address_type: 'shipping' | 'billing' | 'both';
  created_at: string;
  updated_at: string;
}

export const usersService = {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await api.get('users/profile/');
    return response.data;
  },

  async updateProfile(payload: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    const response = await api.patch('users/profile/', payload);
    return response.data;
  },

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('users/profile/avatar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteAvatar(): Promise<ApiResponse<null>> {
    const response = await api.delete('users/profile/avatar/');
    return response.data;
  },

  async getAddresses(): Promise<ApiResponse<Address[]>> {
    const response = await api.get('users/addresses/');
    return response.data;
  },

  async createAddress(payload: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Address>> {
    const response = await api.post('users/addresses/', payload);
    return response.data;
  },

  async updateAddress(id: string, payload: Partial<Address>): Promise<ApiResponse<Address>> {
    const response = await api.patch(`users/addresses/${id}/`, payload);
    return response.data;
  },

  async deleteAddress(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`users/addresses/${id}/`);
    return response.data;
  },

  async setDefaultAddress(id: string): Promise<ApiResponse<Address>> {
    const response = await api.post(`users/addresses/${id}/set-default/`);
    return response.data;
  },
};
