export type Role = "student" | "faculty" | "hod" | "admin";

const API_BASE = import.meta.env.VITE_API_BASE ?? ""; // e.g. "https://api.yourapp.com"

function roleBase(role: Role) {
  // keep your backend route scheme here:
  // /student/forgot-password, /faculty/verify-otp, ...
  return `/${role}`;
}

async function postJSON<T>(
  url: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(API_BASE + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data?.message as string) || "Something went wrong. Please try again."
    );
  }
  return data as T;
}

export const api = {
  forgotPassword: <T>(role: Role, email: string) =>
    postJSON<T>(`${roleBase(role)}/forgot-password`, { email }),

  verifyOtp:   <T>(role: Role, email: string, otp: string) =>
    postJSON<T>(`${roleBase(role)}/verify-otp`, { email, otp }),

  resetPassword: <T>(
    role: Role,
    email: string,
    otp: string,
    newPassword: string
  ) => postJSON<T>(`${roleBase(role)}/reset-password`, { email, otp, newPassword }),
};