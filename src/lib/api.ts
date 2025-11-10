// api.ts
import axios, { AxiosError } from "axios";

// Define role types
export type Role = "student" | "faculty" | "hod" | "admin";

// Base URL from .env (example: VITE_API_BASE="http://localhost:5000")
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// Axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ required for refresh token cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Generic POST helper
async function postJSON<T>(
  url: string,
  body: Record<string, unknown>
): Promise<T> {
  try {
    const res = await apiClient.post<T>(url, body);
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError<any>;
    // Extract server error message if available
    const message =
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }
}

// Helper to construct routes based on role
function roleBase(role: Role) {
  // e.g. /student, /faculty, /hod, /admin
  return `/${role}`;
}

// API object
export const api = {
  forgotPassword: <T>(role: Role, email: string) =>
    postJSON<T>(`${roleBase(role)}/forgot-password`, { email }),

  verifyOtp: <T>(role: Role, email: string, otp: string) =>
    postJSON<T>(`${roleBase(role)}/verify-otp`, { email, otp }),

  resetPassword: <T>(
    role: Role,
    email: string,
    otp: string,
    newPassword: string
  ) =>
    postJSON<T>(`${roleBase(role)}/reset-password`, {
      email,
      otp,
      newPassword,
    }),
};
