import { apiClient } from '../../../lib/api/api-client';
import { appConfig } from '../../../config/app-config';
import { ApiError } from '../../../lib/api/api-error';
import type { ZaloUserLookupResponse, ZaloUsersLookupResponse } from '../types';
import type { ParsedPhoneNumber } from '../utils/phone-normalization';

interface FindUserApiPayload {
  phoneNumber: string;
  avatar: string;
  uid: string;
  zalo_name: string;
  display_name: string;
}

interface FindUsersApiResponse {
  results: FindUserApiPayload[];
  failedCount: number;
}

interface CreateCampaignPayload {
  customerId: string;
  name: string;
  messageText: string;
  zaloAccountIds: string[];
  recipients: { phone?: string; zaloId?: string; name?: string; gender?: number }[];
  scheduleAt?: string;
  imageFilePath?: string;
  campaignType?: 'stranger' | 'friend';
}

interface CreateCampaignResponse {
  id: string;
  name: string;
  status: string;
  queuedCount: number;
}

interface DispatchResponse {
  message: string;
}

function isFindUserPayload(value: unknown): value is FindUserApiPayload {
  if (typeof value !== 'object' || value === null) return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.phoneNumber === 'string' &&
    typeof record.avatar === 'string' &&
    typeof record.uid === 'string' &&
    typeof record.zalo_name === 'string' &&
    typeof record.display_name === 'string'
  );
}

function isFindUsersResponse(value: unknown): value is FindUsersApiResponse {
  if (typeof value !== 'object' || value === null) return false;

  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.results) &&
    record.results.every(isFindUserPayload) &&
    typeof record.failedCount === 'number'
  );
}

function mapFindUserPayload(
  payload: FindUserApiPayload,
  inputPhoneNumber: string,
): ZaloUserLookupResponse {
  return {
    phoneNumber: payload.phoneNumber,
    inputPhoneNumber,
    zaloName: payload.zalo_name || payload.display_name,
    avatarUrl: payload.avatar,
    displayName: payload.display_name,
    uid: payload.uid,
  };
}

export const messageCampaignApi = {
  async findZaloUsers(phones: ParsedPhoneNumber[]): Promise<ZaloUsersLookupResponse> {
    const payload = await apiClient<unknown>('/zalo-connections/find-users', {
      method: 'POST',
      body: { phoneNumbers: phones.map((phone) => phone.lookupPhoneNumber) },
    });

    if (!isFindUsersResponse(payload)) {
      throw new Error('Zalo find users API response is invalid');
    }

    const inputByLookupPhone = new Map(
      phones.map((phone) => [phone.lookupPhoneNumber, phone.inputPhoneNumber]),
    );

    return {
      results: payload.results.map((result) =>
        mapFindUserPayload(
          result,
          inputByLookupPhone.get(result.phoneNumber) ?? result.phoneNumber,
        ),
      ),
      failedCount: payload.failedCount,
    };
  },

  async uploadImage(file: File): Promise<{ filePath: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const base = appConfig.apiBaseUrl.replace(/\/+$/, '');
    const response = await fetch(`${base}/messaging-campaigns/upload-image`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new ApiError(
        payload?.message ?? 'Image upload failed',
        response.status,
        payload,
      );
    }
    return payload as { filePath: string };
  },

  async createCampaign(payload: CreateCampaignPayload): Promise<CreateCampaignResponse> {
    return apiClient<CreateCampaignResponse>('/messaging-campaigns', {
      method: 'POST',
      body: payload,
    });
  },

  async dispatchCampaign(campaignId: string): Promise<DispatchResponse> {
    return apiClient<DispatchResponse>(`/messaging-campaigns/${campaignId}/dispatch`, {
      method: 'POST',
    });
  },
};
