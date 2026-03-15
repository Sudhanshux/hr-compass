import { apiClient } from './api-client';

export interface AnnouncementComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  organizationId: string;
  authorId: string;
  authorName: string;
  text: string;
  imageBase64?: string;       // base64-encoded image, present only when an image was attached
  imageContentType?: string;
  reactions: Record<string, string[]>; // emoji → [userId, ...]
  comments: AnnouncementComment[];
  createdAt: string;
  updatedAt: string;
}

export const announcementService = {
  getAll: (): Promise<Announcement[]> =>
    apiClient.get<Announcement[]>('/announcements'),

  /** Admin/Manager: create with optional image file */
  create: (text: string, image?: File | null): Promise<Announcement> => {
    const form = new FormData();
    form.append('text', text);
    if (image) form.append('image', image);
    return apiClient.postForm<Announcement>('/announcements', form);
  },

  delete: (id: string): Promise<void> =>
    apiClient.delete<void>(`/announcements/${id}`),

  toggleReaction: (id: string, emoji: string): Promise<Announcement> =>
    apiClient.post<Announcement>(`/announcements/${id}/react`, { emoji }),

  addComment: (id: string, text: string): Promise<Announcement> =>
    apiClient.post<Announcement>(`/announcements/${id}/comments`, { text }),

  deleteComment: (announcementId: string, commentId: string): Promise<Announcement> =>
    apiClient.delete<Announcement>(`/announcements/${announcementId}/comments/${commentId}`),
};
