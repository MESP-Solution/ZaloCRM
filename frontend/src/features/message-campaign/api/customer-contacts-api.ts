import { apiClient } from '../../../lib/api/api-client';

export interface CustomerContactDto {
  id: string;
  phone: string;
  zaloUid?: string;
  zaloName?: string;
  avatarUrl?: string;
  gender?: number;
}

interface LookupResponse {
  results: CustomerContactDto[];
  failedCount: number;
}

export interface CustomerContactsListResponse {
  data: CustomerContactDto[];
  total: number;
}

export const customerContactsApi = {
  async list(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CustomerContactsListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return apiClient<CustomerContactsListResponse>(
      `/customer-contacts${query ? `?${query}` : ''}`,
    );
  },

  async lookup(phoneNumbers: string[]): Promise<LookupResponse> {
    return apiClient<LookupResponse>('/customer-contacts/lookup', {
      method: 'POST',
      body: { phoneNumbers },
    });
  },

  async bulkDelete(contactIds: string[]): Promise<{ deleted: number }> {
    return apiClient<{ deleted: number }>('/customer-contacts/bulk-delete', {
      method: 'POST',
      body: { contactIds },
    });
  },

  async remove(contactId: string): Promise<void> {
    await apiClient('/customer-contacts/' + contactId, { method: 'DELETE' });
  },

  async clearAll(): Promise<{ deleted: number }> {
    return apiClient<{ deleted: number }>('/customer-contacts', {
      method: 'DELETE',
    });
  },
};
