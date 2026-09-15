import axios, {
  AxiosInstance,
  CreateAxiosDefaults,
  AxiosError,
} from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://flagjourneys.com";

const config: CreateAxiosDefaults = {
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
};

const apiClient: AxiosInstance = axios.create(config);

let csrfToken: string | null = null;

export const fetchCsrfToken = async () => {
  try {
    const res = await apiClient.get("/auth/csrf-token");
    csrfToken = res.data?.csrfToken || null;
  } catch {
    csrfToken = null;
  }
};

export const getCsrfToken = () => csrfToken;

apiClient.interceptors.request.use((req) => {
  if (["post", "put", "patch", "delete"].includes(req.method || "") && csrfToken) {
    req.headers["X-CSRF-Token"] = csrfToken;
  }
  return req;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 403 && error.response?.data) {
      const data = error.response.data as Record<string, unknown>;
      if (typeof data === "object" && data !== null && "csrf" in data) {
        csrfToken = null;
        fetchCsrfToken();
      }
    }

    // Session-expiry bounce – but NEVER for guest identity checks (/auth/me
    // legitimately returns 401 for logged-out visitors) and never while
    // already sitting on the login page (would cause a redirect loop).
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const failedUrl = error.config?.url || "";
      const isGuestCheck =
        failedUrl.includes("/auth/me") || failedUrl.includes("/auth/csrf-token");
      const alreadyOnAuthPage = window.location.pathname.startsWith("/auth");
      if (!isGuestCheck && !alreadyOnAuthPage) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
