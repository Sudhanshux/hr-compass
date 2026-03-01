import { apiClient } from './api-client';
import { Role, User } from '@/types/models';


interface SpringPage<T> {
  content:          T[];
  totalElements:    number;
  totalPages:       number;
  size:             number;
  number:           number;
  first:            boolean;
  last:             boolean;
  numberOfElements: number;
  empty:            boolean;
}

export interface PageResponse<T> {
  timestamp: string;
  success: boolean;
  status: number;
  message: string;
  data: SpringPage<T>;
}

export interface ApiResponse<T> {
  timestamp: string;
  success: boolean;
  status: number;
  message: string;
  data: T;
}



/* ───────── ROLES ───────── */

export const settingsService = {

  // Roles
     getRoles: () =>
        apiClient.get<Role[]>('/roles'),

  createRole: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<Role>>('/roles', payload);
    return res.data;
  },

//   updateRole: async (id: string, payload: any) => {
//     const res = await apiClient.put(`/roles/${id}`, payload);
//     return res.data;
//   },

//   deleteRole: async (id: string) => {
//     return api.delete(`/roles/${id}`);
//   },

  /* ───────── USERS ───────── */

  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<SpringPage<User>>('/users');
    return res.content ?? [];
  },


//   createUser: async (payload: any) => {
//     const res = await apiClient.post('/users', payload);
//     return res.data;
//   },

//   updateUser: async (id: string, payload: any) => {
//     const res = await apiClient.put(`/users/${id}`, payload);
//     return res.data;
//   },

//   deleteUser: async (id: string) => {
//     return apiClient.delete(`/users/${id}`);
//   },

//   assignRole: async (userId: string, roleName: string) => {
//     return apiClient.put(`/users/${userId}/role`, { role: roleName });
//   }

};