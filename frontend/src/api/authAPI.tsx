import axios from "axios";
import { env } from "./Env";

export type LoginStartRequest = { email: string; password: string };
export type LoginStartResponse = {
  twoFactorRequired: boolean;
  userId: string;
  maskedEmail: string;
};
export type LoginRequest = { email: string; password: string };
export type RegisterRequest = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};
export type Verify2FARequest = { userId: string; code: string };
export type AuthTokenResponse = { token: string };

export async function userLogin(data: LoginRequest) {
  return axios.post<AuthTokenResponse>(
    `${env.API_BASE_URL}/api/auth/login`,
    data
  );
}

export async function userRegister(data: RegisterRequest) {
  return axios.post<void>(`${env.API_BASE_URL}/api/auth/register`, data);
}

export async function loginStart(data: LoginStartRequest) {
  return axios.post<LoginStartResponse>(
    `${env.API_BASE_URL}/api/auth/login/start`,
    data
  );
}

export async function verify2FA(data: Verify2FARequest) {
  return axios.post<AuthTokenResponse>(
    `${env.API_BASE_URL}/api/auth/2fa/verify`,
    data
  );
}
