import { apiClient } from '../../../lib/api/api-client';
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
      credentials: 'include',
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
};
