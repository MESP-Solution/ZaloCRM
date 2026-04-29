declare module 'zca-js' {
  import type { Agent } from 'http';

  export interface Cookie {
    domain: string;
    expirationDate: number;
    hostOnly: boolean;
    httpOnly: boolean;
    name: string;
    path: string;
    sameSite: string;
    secure: boolean;
    session: boolean;
    storeId: string;
    value: string;
  }

  export interface Credentials {
    imei: string;
    cookie: Cookie[] | object[] | { url: string; cookies: Cookie[] };
    userAgent: string;
    language?: string;
  }

  export interface Options {
    selfListen?: boolean;
    checkUpdate?: boolean;
    logging?: boolean;
    apiType?: number;
    apiVersion?: number;
    agent?: Agent;
    polyfill?: typeof fetch;
  }

  export enum LoginQRCallbackEventType {
    QRCodeGenerated = 0,
    QRCodeExpired = 1,
    QRCodeScanned = 2,
    QRCodeDeclined = 3,
    GotLoginInfo = 4,
  }

  export type LoginQRCallbackEvent =
    | {
        type: LoginQRCallbackEventType.QRCodeGenerated;
        data: { code: string; image: string; token: string };
        actions: { saveToFile: (path?: string) => Promise<unknown>; retry: () => unknown; abort: () => unknown };
      }
    | {
        type: LoginQRCallbackEventType.QRCodeExpired;
        data: null;
        actions: { retry: () => unknown; abort: () => unknown };
      }
    | {
        type: LoginQRCallbackEventType.QRCodeScanned;
        data: { avatar: string; display_name: string };
        actions: { retry: () => unknown; abort: () => unknown };
      }
    | {
        type: LoginQRCallbackEventType.QRCodeDeclined;
        data: { code: string };
        actions: { retry: () => unknown; abort: () => unknown };
      }
    | {
        type: LoginQRCallbackEventType.GotLoginInfo;
        data: { cookie: object[]; imei: string; userAgent: string };
        actions: null;
      };

  export type LoginQRCallback = (event: LoginQRCallbackEvent) => unknown;

  export interface User {
    userId: string;
    displayName: string;
    phoneNumber: string;
    avatar: string;
    zaloName: string;
  }

  export interface FetchAccountInfoResponse {
    profile: User;
  }

  export type FindUserResponse = {
    avatar: string;
    cover: string;
    status: string;
    gender: unknown;
    dob: number;
    sdob: string;
    globalId: string;
    bizPkg: unknown;
    uid: string;
    zalo_name: string;
    display_name: string;
  };

  export interface CookieJarJSON {
    cookies: object[];
  }

  export interface ContextSession {
    imei: string;
    cookie: { toJSON(): CookieJarJSON };
    userAgent: string;
  }

  export enum ThreadType {
    User = 0,
    Group = 1,
  }

  export interface Listener {
    start(): void;
    stop(): void;
    on(event: 'connected', cb: () => unknown): void;
    on(event: 'closed', cb: (code?: number, reason?: string) => unknown): void;
    on(event: 'error', cb: (error: unknown) => unknown): void;
    on(event: 'message', cb: (message: unknown) => unknown): void;
    on(event: 'group_event', cb: (data: unknown) => unknown): void;
    on(event: 'reaction', cb: (reaction: unknown) => unknown): void;
    on(event: string, cb: (...args: unknown[]) => unknown): void;
  }

  export class API {
    listener: Listener;
    fetchAccountInfo(): Promise<FetchAccountInfoResponse>;
    getOwnId(): string;
    getContext(): ContextSession;
    sendMessage(message: string | object, threadId: string, type: ThreadType): Promise<unknown>;
    findUser(phone: string): Promise<FindUserResponse>;
    getUserInfo(userId: string): Promise<unknown>;
    sendFriendRequest(message: string, userId: string): Promise<unknown>;
    createGroup(options: { members: string[]; name?: string; avatarPath?: string }): Promise<unknown>;
    getGroupInfo(groupId: string | string[]): Promise<unknown>;
    addUserToGroup(memberId: string | string[], groupId: string): Promise<unknown>;
    removeUserFromGroup(memberId: string | string[], groupId: string): Promise<unknown>;
  }

  export class Zalo {
    constructor(options?: Partial<Options>);
    login(credentials: Credentials): Promise<API>;
    loginQR(
      options?: { userAgent?: string; language?: string; qrPath?: string } | null,
      callback?: LoginQRCallback,
    ): Promise<API>;
  }
}
