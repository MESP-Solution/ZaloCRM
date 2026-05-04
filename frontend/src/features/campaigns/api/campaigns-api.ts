import { apiClient } from '../../../lib/api/api-client';
import type {
  Campaign,
  CampaignRecipientsResponse,
  CampaignStats,
} from '../types';

export const campaignsApi = {
  async list(customerId?: string): Promise<Campaign[]> {
    const query = customerId ? `?customerId=${customerId}` : '';
    return apiClient<Campaign[]>(`/messaging-campaigns${query}`);
  },

  async getById(campaignId: string): Promise<Campaign> {
    return apiClient<Campaign>(`/messaging-campaigns/${campaignId}`);
  },

  async getStats(campaignId: string): Promise<CampaignStats> {
    return apiClient<CampaignStats>(`/messaging-campaigns/${campaignId}/stats`);
  },

  async getRecipients(
    campaignId: string,
    params?: { status?: string; page?: number; limit?: number },
  ): Promise<CampaignRecipientsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return apiClient<CampaignRecipientsResponse>(
      `/messaging-campaigns/${campaignId}/recipients${query ? `?${query}` : ''}`,
    );
  },

  async dispatch(campaignId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(
      `/messaging-campaigns/${campaignId}/dispatch`,
      { method: 'POST' },
    );
  },

  async pause(campaignId: string): Promise<Campaign> {
    return apiClient<Campaign>(
      `/messaging-campaigns/${campaignId}/pause`,
      { method: 'POST' },
    );
  },

  async resume(campaignId: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(
      `/messaging-campaigns/${campaignId}/resume`,
      { method: 'POST' },
    );
  },

  async cancel(campaignId: string): Promise<Campaign> {
    return apiClient<Campaign>(
      `/messaging-campaigns/${campaignId}/cancel`,
      { method: 'POST' },
    );
  },
};
