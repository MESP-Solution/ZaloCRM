export interface DashboardMetric {
  label: string;
  value: number;
  trend?: number;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  pipelineByStage: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
}
