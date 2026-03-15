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


export const settingsService = {

  /* ───────── ROLES ───────── */

  getRoles: (): Promise<Role[]> =>
    apiClient.get<Role[]>('/roles'),

  // Backend returns 201 with Role object inside `data`; apiClient unwraps it
  createRole: async (payload: {
    name:        string;
    description: string;
    permissions: string[];
  }): Promise<Role> => {
    return apiClient.post<Role>('/roles', payload);
  },

  // Permissions must be UPPERCASE enum values (e.g. VIEW_DASHBOARD)
  updateRole: async (id: string, payload: { permissions: string[] }): Promise<Role> => {
    return apiClient.put<Role>(`/roles/${id}`, payload);
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },

  /* ───────── USERS ───────── */

  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<SpringPage<User>>('/users');
    return res.content ?? [];
  },

  createUser: async (payload: {
    email:           string;
    password:        string;
    firstName:       string;
    lastName:        string;
    phone?:          string;
    departmentName?: string;
    departmentId?:   string;
    roles?:          string[];
  }): Promise<void> => {
    await apiClient.post('/auth/register', payload);
  },

  // No general update endpoint exists for users; status must be toggled via these two endpoints
  activateUser: async (id: string): Promise<void> => {
    await apiClient.put(`/users/${id}/activate`);
  },

  deactivateUser: async (id: string): Promise<void> => {
    await apiClient.put(`/users/${id}/deactivate`);
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Requires roleId (not role name); endpoint: PUT /users/{userId}/role
  assignRole: async (userId: string, roleId: string): Promise<void> => {
    await apiClient.put(`/users/${userId}/role`, { roleId });
  },
};
