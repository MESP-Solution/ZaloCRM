import { apiClient } from "~lib/api";
import type { DashboardSummary } from "../types";

export const dashboardApi = {
  getSummary(accessToken?: string): Promise<DashboardSummary> {
    return apiClient<DashboardSummary>("/crm/dashboard/summary", {
      accessToken,
      cache: "no-store",
    });
  },
};
