export const appConfig = {
  name: "ZaloCRM",
  description: "CRM SaaS tool powered by a NestJS API.",
  apiBaseUrl:
    process.env.NEST_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:3001",
};
