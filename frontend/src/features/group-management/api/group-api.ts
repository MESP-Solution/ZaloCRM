import { apiClient } from '../../../lib/api/api-client';
import type {
  FetchAllMembersResponse,
  GroupInfo,
  GroupMembersResponse,
  MyGroupSummary,
} from '../types';

export const groupApi = {
  async fetchGroupLinkInfo(
    zaloAccountId: string,
    link: string,
    memberPage?: number,
  ): Promise<GroupInfo> {
    return apiClient<GroupInfo>('/groups/fetch-link-info', {
      method: 'POST',
      body: { link, zaloAccountId, memberPage },
    });
  },

  async fetchAllMembers(
    zaloAccountId: string,
    link: string,
  ): Promise<FetchAllMembersResponse> {
    return apiClient<FetchAllMembersResponse>('/groups/fetch-all-members', {
      method: 'POST',
      body: { link, zaloAccountId },
    });
  },

  async fetchMyGroups(accountId: string): Promise<MyGroupSummary[]> {
    const params = new URLSearchParams({ accountId });
    return apiClient<MyGroupSummary[]>(`/groups/my-groups?${params}`);
  },

  async fetchGroupMembers(
    zaloAccountId: string,
    groupId: string,
  ): Promise<GroupMembersResponse> {
    return apiClient<GroupMembersResponse>('/groups/group-members', {
      method: 'POST',
      body: { zaloAccountId, groupId },
    });
  },
};
