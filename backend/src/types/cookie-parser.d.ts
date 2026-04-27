declare module 'cookie-parser' {
  import type { RequestHandler } from 'express';

  export default function cookieParser(
    secret?: string | string[],
  ): RequestHandler;
}
