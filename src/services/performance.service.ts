import { apiClient } from './api-client';

export interface Goal {
  id:            string;
  title:         string;
  description:   string;
  progress:      number;
  dueDate:       string;
  status:        'on-track' | 'at-risk' | 'completed';
  employeeId?:   string;
  departmentId?: string;
  createdAt?:    string;
}

export interface Feedback {
  id:          string;
  date:        string;
  from:        string;
  type:        'appraisal' | '1-on-1' | 'peer';
  rating?:     number;
  summary:     string;
  employeeId?: string;
}

export interface Course {
  id:          string;
  title:       string;
  category:    'mandatory' | 'optional';
  duration:    string;
  progress:    number;
  deadline?:   string;
  employeeId?: string;
}

interface SpringPage<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  size:          number;
  number:        number;
}

export const performanceService = {
  /* ── Goals ── */
  getGoals: async (): Promise<Goal[]> => {
    const res = await apiClient.get<SpringPage<Goal>>('/performance/goals');
    return res.content ?? [];
  },

  createGoal: async (payload: {
    title:        string;
    description:  string;
    dueDate:      string;
    departmentId: string;
    employeeId?:  string;
    progress?:    number;
    status?:      string;
  }): Promise<Goal> => {
    return apiClient.post<Goal>('/performance/goals', { progress: 0, status: 'on-track', ...payload });
  },

  updateGoal: async (id: string, payload: Partial<Pick<Goal, 'progress' | 'status' | 'title' | 'description' | 'dueDate'>>): Promise<Goal> => {
    return apiClient.put<Goal>(`/performance/goals/${id}`, payload);
  },

  deleteGoal: async (id: string): Promise<void> => {
    await apiClient.delete(`/performance/goals/${id}`);
  },

  /* ── Feedback ── */
  getFeedback: async (): Promise<Feedback[]> => {
    const res = await apiClient.get<SpringPage<Feedback>>('/performance/feedback');
    return res.content ?? [];
  },

  createFeedback: async (payload: {
    employeeId: string;
    from:       string;
    date:       string;
    type:       string;
    rating?:    number;
    summary:    string;
  }): Promise<Feedback> => {
    return apiClient.post<Feedback>('/performance/feedback', payload);
  },

  /* ── Courses / LMS ── */
  getCourses: async (): Promise<Course[]> => {
    const res = await apiClient.get<SpringPage<Course>>('/performance/courses');
    return res.content ?? [];
  },

  createCourse: async (payload: {
    departmentId: string;
    employeeId?:  string;
    title:        string;
    category:     string;
    duration:     string;
    progress?:    number;
    deadline?:    string;
  }): Promise<Course> => {
    return apiClient.post<Course>('/performance/courses', { progress: 0, ...payload });
  },

  updateCourseProgress: async (id: string, progress: number): Promise<Course> => {
    return apiClient.put<Course>(`/performance/courses/${id}/progress`, { progress });
  },

  deleteCourse: async (id: string): Promise<void> => {
    await apiClient.delete(`/performance/courses/${id}`);
  },
};
