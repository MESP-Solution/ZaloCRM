import { apiClient } from '../../../lib/api/api-client';
import type { DashboardSummary } from "../types";

export const dashboardApi = {
  getSummary(accessToken?: string): Promise<DashboardSummary> {
    return apiClient<DashboardSummary>("/MKT/dashboard/summary", {
      accessToken,
      cache: "no-store",
    });
  },
};
