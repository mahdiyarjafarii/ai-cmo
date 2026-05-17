import axios from "axios";
import { TwitterFeed, LinkedInFeed, RedditFeed, SeoReport } from "../types";

const API_ORIGIN = import.meta.env.VITE_API_URL;
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Auto-refresh on 401
let isRefreshing = false;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      original._retry = true;
      isRefreshing = true;
      try {
        await api.post("/auth/refresh");
        isRefreshing = false;
        return api(original);
      } catch {
        isRefreshing = false;
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    plan: "free" | "pro";
    createdAt: string;
  };
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  me: () => api.get<AuthResponse>("/auth/me"),
};

export const projectsApi = {
  list: () => api.get<{ projects: Project[] }>("/projects"),

  create: (data: { url: string; name?: string }) =>
    api.post<{ project: Project; cached: boolean; message: string }>("/projects", data),

  get: (id: string) =>
    api.get<{
      project: Project;
      analysisResult: unknown;
      content: {
        twitter?: TwitterFeed;
        linkedin?: LinkedInFeed;
        reddit?: RedditFeed;
        seo?: SeoReport;
      };
    }>(`/projects/${id}`),

  delete: (id: string) => api.delete(`/projects/${id}`),
};

export interface Project {
  id: string;
  userId: string;
  name: string;
  url: string;
  status: "pending" | "crawling" | "done" | "error";
  analysisId: string | null;
  createdAt: string;
  crawlData?: { crawledAt: string } | null;
}

export default api;
