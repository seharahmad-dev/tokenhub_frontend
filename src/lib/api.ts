// api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Define role types (kept inline as requested)
export type Role = "student" | "faculty" | "hod" | "admin";

// Base URL from .env (example: VITE_API_BASE="http://localhost:5000")
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// Axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ required for refresh token cookie
  headers: { "Content-Type": "application/json" },
});

/** ---------- Low-level helpers (JSON) ---------- **/
async function postJSON<T>(url: string, body: Record<string, unknown>): Promise<T> {
  try {
    const res = await apiClient.post<T>(url, body);
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError<any>;
    const message =
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }
}

async function patchJSON<T>(url: string, body?: Record<string, unknown>): Promise<T> {
  try {
    const res = await apiClient.patch<T>(url, body);
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError<any>;
    const message =
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }
}

async function deleteJSON<T>(url: string): Promise<T> {
  try {
    const res = await apiClient.delete<T>(url);
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError<any>;
    const message =
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }
}

async function getJSON<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient.get<T>(url, config);
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError<any>;
    const message =
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }
}

/** Helper to construct routes based on role */
function roleBase(role: Role) {
  // e.g. /student, /faculty, /hod, /admin
  return `/${role}`;
}

/** ---------- Public API (high & low level) ---------- **/
const api = {
  /** expose the raw axios client if you need interceptors, etc. */
  client: apiClient,

  /** Low-level REST (returns AxiosResponse by default so `{ data } = await api.get()` works) */
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return apiClient.get<T>(url, config);
  },
  post<T = any>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return apiClient.post<T>(url, body, config);
  },
  patch<T = any>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return apiClient.patch<T>(url, body, config);
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return apiClient.delete<T>(url, config);
  },

  /** High-level JSON helpers (return parsed `data` directly) */
  getJSON,
  postJSON,
  patchJSON,
  deleteJSON,

  /** --------- Auth / common per-role calls --------- */
  login: <T>(role: Role, email: string, password: string) =>
    postJSON<T>(`${roleBase(role)}/login`, { email, password }),

  forgotPassword: <T>(role: Role, email: string) =>
    postJSON<T>(`${roleBase(role)}/forgot-password`, { email }),

  verifyOtp: <T>(role: Role, email: string, otp: string) =>
    postJSON<T>(`${roleBase(role)}/verify-otp`, { email, otp }),

  resetPassword: <T>(role: Role, email: string, otp: string, newPassword: string) =>
    postJSON<T>(`${roleBase(role)}/reset-password`, { email, otp, newPassword }),

  /** --------- Students (admin) --------- */
  getAllStudents: <T>() => api.get<T>("/student/all"),
  registerStudent:        <T>(payload: Record<string, unknown>) => api.post<T>("/student/register", payload),
  updateStudent:          <T>(id: string, payload: Record<string, unknown>) => api.patch<T>(`/student/${id}`, payload),
  deleteStudent:          <T>(id: string) => api.delete<T>(`/student/${id}`),

  /** --------- Faculty / HOD / Clubs convenience if needed later ---------
  getAllFaculty:  <T>() => api.get<T>("/faculty/all"),
  getAllHods:     <T>() => api.get<T>("/hod/all"),
  getAllClubs:    <T>() => api.get<T>("/club/all"),
  */
};

export { api, apiClient };
export default api;
