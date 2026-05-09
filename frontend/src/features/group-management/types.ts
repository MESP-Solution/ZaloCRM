export interface GroupMember {
  id: string;
  displayName: string;
  zaloName: string;
  avatar: string;
  type: number;
}

export interface GroupInfo {
  groupId: string;
  name: string;
  description: string;
  avatar: string;
  creatorId: string;
  adminIds: string[];
  totalMember: number;
  hasMoreMember: boolean;
  members: GroupMember[];
}

export interface GroupWithMembers extends GroupInfo {
  link: string;
  allMembers: GroupMember[];
  allMembersLoaded: boolean;
}

export interface MyGroupSummary {
  groupId: string;
  name: string;
  avatar: string;
  totalMember: number;
}

export interface GroupMembersResponse {
  groupId: string;
  name: string;
  avatar: string;
  creatorId: string;
  adminIds: string[];
  totalMember: number;
  members: GroupMember[];
}

export interface FetchAllMembersResponse {
  groupId: string;
  name: string;
  totalMember: number;
  members: GroupMember[];
  pagesLoaded: number;
}
