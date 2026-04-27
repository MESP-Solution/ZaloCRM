import { apiClient } from "~lib/api";
import type { LoginRequest, LoginResponse } from "../types";

export const authApi = {
  login(payload: LoginRequest): Promise<LoginResponse> {
    return apiClient<LoginResponse>("/auth/login", {
      body: payload,
      method: "POST",
    });
  },
};
