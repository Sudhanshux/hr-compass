import { apiClient } from './api-client';
import { OrgNode } from '@/types/models';

export const orgChartService = {
  getFullOrgChart: () =>
    apiClient.get<OrgNode[]>('/org-chart'),

  getSubTree: (employeeId: string) =>
    apiClient.get<OrgNode>(`/org-chart/subtree/${employeeId}`),

  getReportingChain: (employeeId: string) =>
    apiClient.get<OrgNode[]>(`/org-chart/reporting-chain/${employeeId}`),

  getDirectReports: (employeeId: string) =>
    apiClient.get<OrgNode[]>(`/org-chart/direct-reports/${employeeId}`),
};
