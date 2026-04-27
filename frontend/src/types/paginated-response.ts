export interface PaginatedResponse<TItem> {
  data: TItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}
