export const appConfig = {
  name: "ZaloMKT",
  description: "MKT SaaS tool powered by a NestJS API.",
  apiBaseUrl: "/api",
  backendWsUrl:
    process.env.NEXT_PUBLIC_BACKEND_WS_URL ??
    "wss://zalomkt.ap.galaxycloud.app",
};
