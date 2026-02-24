import { apiClient } from './api-client';
import { User } from '@/types/models';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: string;
  employeeId: string;
  email: string;
  roles: string[];
}

export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  logout: () =>
    apiClient.post<void>('/auth/logout'),

  me: () =>
    apiClient.get<User>('/auth/me'),
};
