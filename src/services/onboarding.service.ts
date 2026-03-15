import { apiClient } from './api-client';

export interface OnboardingDocument {
  name: string;
  status: 'uploaded' | 'pending';
}

export interface OnboardingRecord {
  id: string;
  organizationId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  reportingManagerId?: string;
  position?: string;
  dateOfJoining: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  documents: OnboardingDocument[];
  status: 'pending' | 'in-progress' | 'completed';
  completionPercent: number;
  createdAt?: string;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

export const onboardingService = {
  getAll: async (): Promise<OnboardingRecord[]> => {
    const res = await apiClient.get<SpringPage<OnboardingRecord>>('/onboarding', {
      params: { size: 100 },
    });
    return res.content ?? [];
  },

  getById: async (id: string): Promise<OnboardingRecord> => {
    return apiClient.get<OnboardingRecord>(`/onboarding/${id}`);
  },

  create: async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    departmentId: string;
    position?: string;
    dateOfJoining: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    emergencyContact?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    panNumber?: string;
    aadhaarNumber?: string;
    reportingManagerId?: string;
  }): Promise<OnboardingRecord> => {
    return apiClient.post<OnboardingRecord>('/onboarding', payload);
  },

  updateDocument: async (
    id: string,
    documentName: string,
    status: 'uploaded' | 'pending'
  ): Promise<OnboardingRecord> => {
    return apiClient.put<OnboardingRecord>(`/onboarding/${id}/documents`, {
      documentName,
      status,
    });
  },

  /** Upload actual file bytes — uses multipart/form-data */
  uploadDocument: async (
    id: string,
    documentName: string,
    file: File
  ): Promise<OnboardingRecord> => {
    const form = new FormData();
    form.append('documentName', documentName);
    form.append('file', file);

    const token = localStorage.getItem('hrms_token');
    const response = await fetch(`http://localhost:9090/api/onboarding/${id}/documents/upload`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: form,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || `Upload failed: ${response.status}`);
    }
    const json = await response.json();
    return json.data ?? json;
  },

  /** Returns a URL that opens/downloads the stored file in the browser */
  getDocumentFileUrl: (id: string, documentName: string): string => {
    const token = localStorage.getItem('hrms_token');
    // Encode doc name for URL safety
    const encoded = encodeURIComponent(documentName);
    return `http://localhost:9090/api/onboarding/${id}/documents/${encoded}/file`;
  },

  /** Fetch and open the file as an object URL (carries auth header) */
  openDocument: async (id: string, documentName: string): Promise<void> => {
    const token = localStorage.getItem('hrms_token');
    const encoded = encodeURIComponent(documentName);
    const response = await fetch(
      `http://localhost:9090/api/onboarding/${id}/documents/${encoded}/file`,
      { headers: { ...(token && { Authorization: `Bearer ${token}` }) } }
    );
    if (!response.ok) throw new Error('Failed to fetch document');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Revoke after a short delay so the tab has time to load
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },
};
