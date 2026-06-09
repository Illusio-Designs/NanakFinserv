import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nanakfinserv.com/api";
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://api.nanakfinserv.com";

const api = axios.create({ baseURL: API_URL });

// Attach the JS-readable token (matches the existing backend `token` header).
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.token = token;
  return config;
});

// Global 401 handling — don't bounce on the auth endpoints themselves.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error?.config?.url || "";
    if (error?.response?.status === 401 && !/\/user\/(login|verfiy|logout)\b/.test(url)) {
      Cookies.remove("token");
      Cookies.remove("user");
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * Build a downloadable URL for an uploaded file. Files are served under
 * `/uploads/<name>` and that route is token-protected, so we add `?token=`.
 */
export function fileUrl(file) {
  if (!file) return null;
  if (String(file).startsWith("http")) return file;
  const name = String(file).replace(/^\/?(public\/)?uploads\//, "");
  const token = Cookies.get("token");
  return `${BASE_URL}/uploads/${name}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

/** Standard error toast. */
export function showError(error, fallback = "Something went wrong") {
  const msg = error?.response?.data?.message || error?.response?.data?.error || fallback;
  toast.error(msg);
}

export default api;
