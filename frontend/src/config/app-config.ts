export const appConfig = {
  name: "ZaloMKT",
  description: "MKT SaaS tool powered by a NestJS API.",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEST_API_BASE_URL ??
    "http://localhost:3000/api",
};
