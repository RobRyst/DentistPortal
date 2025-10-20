import axios from "axios";
import { env } from "./env";
import { tokenStorage } from "./token";

export const http = axios.create({
  baseURL: env.API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(err);
  }
);
