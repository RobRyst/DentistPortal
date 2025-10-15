import axios from "axios";
import { env } from "./env";

export type LoginRequest = { email: string; password: string };
export type RegisterRequest = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};
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
