export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
};
if (!env.API_BASE_URL) {
  console.warn("Missing VITE_API_BASE_URL");
}
