import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ZaloConnectionRegistry } from '../zalo-connection/zalo-connection-registry';

const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 2;
const GROUPS_CACHE_TTL_MS = 5 * 60 * 1000;
const MEMBERS_CACHE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface GroupMember {
  id: string;
  displayName: string;
  zaloName: string;
  avatar: string;
  type: number;
}

export interface GroupLinkInfoResult {
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

export interface FetchAllMembersResult {
  groupId: string;
  name: string;
  totalMember: number;
  members: GroupMember[];
  pagesLoaded: number;
}

export interface MyGroupSummary {
  groupId: string;
  name: string;
  avatar: string;
  totalMember: number;
}

export interface GroupMembersResult {
  groupId: string;
  name: string;
  avatar: string;
  creatorId: string;
  adminIds: string[];
  totalMember: number;
  members: GroupMember[];
}

@Injectable()
export class ZaloGroupsService {
  private readonly logger = new Logger(ZaloGroupsService.name);
  private readonly groupsCache = new TtlCache<MyGroupSummary[]>();
  private readonly membersCache = new TtlCache<GroupMembersResult>();

  constructor(private readonly registry: ZaloConnectionRegistry) {}

  async getGroupLinkInfo(
    zaloAccountId: string,
    link: string,
    memberPage = 1,
  ): Promise<GroupLinkInfoResult> {
    const api = this.registry.getApi(zaloAccountId);
    if (!api) {
      throw new ServiceUnavailableException(
        `Zalo account ${zaloAccountId} is not connected`,
      );
    }

    if (!link.includes('zalo.me/g/')) {
      throw new BadRequestException('Invalid Zalo group link');
    }

    let response: any;
    let lastError: any;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.log(
            `Retry ${attempt}/${MAX_RETRIES} for link=${link}, waiting ${RETRY_DELAY_MS}ms`,
          );
          await sleep(RETRY_DELAY_MS);
        }
        response = await (api as any).getGroupLinkInfo({ link, memberPage });
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message?.toLowerCase?.() ?? '';
        const isRetryable =
          msg.includes('rate') ||
          msg.includes('limit') ||
          msg.includes('too many') ||
          msg.includes('timeout') ||
          msg.includes('ECONNRESET') ||
          msg === '';

        if (!isRetryable) break;
      }
    }

    if (lastError) {
      this.logger.warn(
        `getGroupLinkInfo failed for account=${zaloAccountId} link=${link}: ${lastError?.message ?? lastError}`,
      );

      const msg = lastError?.message?.toLowerCase?.() ?? '';
      if (msg.includes('not found') || msg.includes('invalid')) {
        throw new BadRequestException(
          'Link nhóm không hợp lệ hoặc đã bị vô hiệu hóa',
        );
      }
      if (msg.includes('permission') || msg.includes('denied')) {
        throw new BadRequestException(
          'Tài khoản không có quyền truy cập nhóm này (nhóm riêng tư hoặc bị chặn)',
        );
      }
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) {
        throw new ServiceUnavailableException(
          'Zalo đang giới hạn tần suất truy cập. Vui lòng thử lại sau vài phút',
        );
      }
      throw new BadRequestException(
        `Không thể lấy thông tin nhóm: ${lastError?.message ?? 'Lỗi không xác định'}`,
      );
    }

    if (!response || !response.groupId) {
      throw new BadRequestException(
        'Link nhóm không hợp lệ hoặc nhóm đã bị tắt chia sẻ link',
      );
    }

    return {
      groupId: response.groupId,
      name: response.name,
      description: response.desc,
      avatar: response.fullAvt || response.avt,
      creatorId: response.creatorId,
      adminIds: response.adminIds ?? [],
      totalMember: response.totalMember,
      hasMoreMember: response.hasMoreMember > 0,
      members: (response.currentMems ?? []).map((m: any) => ({
        id: m.id,
        displayName: m.dName,
        zaloName: m.zaloName,
        avatar: m.avatar,
        type: m.type,
      })),
    };
  }

  async fetchAllMembers(
    zaloAccountId: string,
    link: string,
  ): Promise<FetchAllMembersResult> {
    const firstPage = await this.getGroupLinkInfo(zaloAccountId, link, 1);
    const allMembers: GroupMember[] = [...firstPage.members];
    let page = 2;
    let hasMore = firstPage.hasMoreMember;

    while (hasMore) {
      await sleep(RETRY_DELAY_MS);
      this.logger.log(
        `Fetching members page ${page} for group=${firstPage.groupId}`,
      );
      const pageResult = await this.getGroupLinkInfo(zaloAccountId, link, page);
      allMembers.push(...pageResult.members);
      hasMore = pageResult.hasMoreMember;
      page++;
    }

    this.logger.log(
      `Loaded ${allMembers.length} members (${page - 1} pages) for group=${firstPage.groupId}`,
    );

    return {
      groupId: firstPage.groupId,
      name: firstPage.name,
      totalMember: firstPage.totalMember,
      members: allMembers,
      pagesLoaded: page - 1,
    };
  }

  async getMyGroups(zaloAccountId: string): Promise<MyGroupSummary[]> {
    const cacheKey = `groups:${zaloAccountId}`;
    const cached = this.groupsCache.get(cacheKey);
    if (cached) {
      this.logger.log(`Groups cache hit for account=${zaloAccountId}`);
      return cached;
    }

    const api = this.registry.getApi(zaloAccountId);
    if (!api) {
      throw new ServiceUnavailableException(
        `Zalo account ${zaloAccountId} is not connected`,
      );
    }

    const result = await this.retryZaloCall(() => api.getAllGroups());
    const groupIds = Object.keys(result.gridVerMap ?? {});
    if (groupIds.length === 0) return [];

    const allSummaries: MyGroupSummary[] = [];
    const chunkSize = 20;

    for (let i = 0; i < groupIds.length; i += chunkSize) {
      if (i > 0) await sleep(RETRY_DELAY_MS);
      const chunk = groupIds.slice(i, i + chunkSize);
      this.logger.log(
        `Fetching group info batch ${Math.floor(i / chunkSize) + 1}/${Math.ceil(groupIds.length / chunkSize)} (${chunk.length} groups)`,
      );
      try {
        const infoRaw: any = await this.retryZaloCall(
          () => api.getGroupInfo(chunk),
        );
        allSummaries.push(...this.mapGroupInfoBatch(infoRaw, chunk));
      } catch (err: any) {
        this.logger.warn(
          `Skipping batch for account=${zaloAccountId}: ${err?.message ?? err}`,
        );
      }
    }

    if (allSummaries.length > 0) {
      this.groupsCache.set(cacheKey, allSummaries, GROUPS_CACHE_TTL_MS);
    }
    return allSummaries;
  }

  async getGroupMembersByGroupId(
    zaloAccountId: string,
    groupId: string,
  ): Promise<GroupMembersResult> {
    const cacheKey = `members:${zaloAccountId}:${groupId}`;
    const cached = this.membersCache.get(cacheKey);
    if (cached) {
      this.logger.log(`Members cache hit for group=${groupId}`);
      return cached;
    }

    const api = this.registry.getApi(zaloAccountId);
    if (!api) {
      throw new ServiceUnavailableException(
        `Zalo account ${zaloAccountId} is not connected`,
      );
    }

    const linkDetail = await api.getGroupLinkDetail(groupId);
    if (!linkDetail?.link || linkDetail.enabled !== 1) {
      throw new BadRequestException(
        'Nhóm này không hỗ trợ chia sẻ link, không thể tải thành viên',
      );
    }

    const fullLink = `https://zalo.me/g/${linkDetail.link}`;
    const result = await this.fetchAllMembers(zaloAccountId, fullLink);
    const membersResult: GroupMembersResult = {
      groupId,
      name: result.name,
      avatar: '',
      creatorId: '',
      adminIds: [],
      totalMember: result.totalMember,
      members: result.members,
    };

    this.membersCache.set(cacheKey, membersResult, MEMBERS_CACHE_TTL_MS);
    return membersResult;
  }

  private async retryZaloCall<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.log(`Retry ${attempt}/${MAX_RETRIES}, waiting ${RETRY_DELAY_MS}ms`);
          await sleep(RETRY_DELAY_MS);
        }
        return await fn();
      } catch (err: any) {
        lastError = err;
        const msg = err?.message?.toLowerCase?.() ?? '';
        const isRetryable =
          msg.includes('retry limit') ||
          msg.includes('rate') ||
          msg.includes('limit') ||
          msg.includes('timeout') ||
          msg.includes('econnreset') ||
          msg === '';
        if (!isRetryable) break;
      }
    }
    throw lastError;
  }

  private mapGroupInfoBatch(
    raw: any,
    groupIds: string[],
  ): MyGroupSummary[] {
    if (!raw) return [];
    // getGroupInfo(string[]) may return an array or keyed object
    if (Array.isArray(raw)) {
      return raw.map((g: any) => ({
        groupId: g.groupId ?? g.id,
        name: g.name ?? g.dName ?? '',
        avatar: g.fullAvt ?? g.avt ?? g.avatar ?? '',
        totalMember: g.totalMember ?? g.memCount ?? 0,
      }));
    }
    // If it returns a keyed object { groupId: info }
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const entries = raw.gridInfoMap ?? raw;
      return groupIds
        .filter((id) => entries[id])
        .map((id) => {
          const g = entries[id];
          return {
            groupId: id,
            name: g.name ?? g.dName ?? '',
            avatar: g.fullAvt ?? g.avt ?? g.avatar ?? '',
            totalMember: g.totalMember ?? g.memCount ?? 0,
          };
        });
    }
    return [];
  }

}
