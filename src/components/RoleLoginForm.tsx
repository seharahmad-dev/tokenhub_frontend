// components/RoleLoginForm.tsx
import { useMemo, useState, useEffect } from "react";
import PasswordCriteria from "./PasswordCriteria";

import axios from "axios";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../app/hooks";
import { setCredentials } from "../app/authSlice";
import { setStudent } from "../app/studentSlice";
import { setFaculty } from "../app/facultySlice";

type Role = "Student" | "Faculty" | "HOD" | "Admin";

export default function RoleLoginForm({
  role,
  emailSuffix = "@bmsce.ac.in",
  submitPath = "login",
}: {
  role: Role;
  emailSuffix?: string;
  submitPath?: string;
}) {
  const [emailLocal, setEmailLocal] = useState("");
  const [password, setPassword] = useState("");
  const [focus, setFocus] = useState<null | "email" | "password">(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    const raw = sessionStorage.getItem("user");
    if (!token || !raw) return;
    try {
      const u = JSON.parse(raw);
      if (u?.role?.toLowerCase?.() === role.toLowerCase()) {
        navigate(`/${role.toLowerCase()}`, { replace: true });
      }
    } catch {
      /* ignore */
    }
  }, [role, navigate]);

  const fullEmail = useMemo(() => `${emailLocal}${emailSuffix}`, [
    emailLocal,
    emailSuffix,
  ]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullEmail);

  const getApiBase = (role: Role): string => {
    switch (role) {
      case "Admin":
        return import.meta.env.VITE_ADMIN_API ?? "";
      case "Student":
        return import.meta.env.VITE_STUDENT_API ?? "";
      case "Faculty":
        return import.meta.env.VITE_FACULTY_API ?? "";
      case "HOD":
        return import.meta.env.VITE_HOD_API ?? "";
      default:
        return import.meta.env.VITE_API_BASE ?? "";
    }
  };

  const ROLE_META: Record<
    Role,
    {
      colorClass: string;
      accent: string;
      ringClass: string;
      img: string;
      label: string;
      textClass: string;
    }
  > = {
    Student: {
      colorClass: "bg-sky-600 hover:bg-sky-700 text-white",
      accent: "sky-600",
      ringClass: "ring-sky-400/40",
      img: "/assets/auth-student.svg",
      label: "Student",
      textClass: "text-sky-600",
    },
    Faculty: {
      colorClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
      accent: "emerald-600",
      ringClass: "ring-emerald-400/40",
      img: "/assets/auth-faculty.svg",
      label: "Faculty",
      textClass: "text-emerald-600",
    },
    HOD: {
      colorClass: "bg-teal-600 hover:bg-teal-700 text-white",
      accent: "teal-600",
      ringClass: "ring-teal-400/40",
      img: "/assets/auth-faculty.svg",
      label: "HOD",
      textClass: "text-teal-600",
    },
    Admin: {
      colorClass: "bg-rose-600 hover:bg-rose-700 text-white",
      accent: "rose-600",
      ringClass: "ring-rose-400/40",
      img: "/assets/auth-admin.svg",
      label: "Admin",
      textClass: "text-rose-600",
    },
  };

  const meta = ROLE_META[role];

  const clientValidationMessages: string[] = [];
  if (!emailValid && emailLocal.length > 0)
    clientValidationMessages.push("Email looks invalid.");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const clientErrors: string[] = [];
    if (!emailValid) clientErrors.push("Please enter a valid email address.");
    if (!password || password.length < 6)
      clientErrors.push("Password must be at least 6 characters.");

    if (clientErrors.length > 0) {
      setMessage(clientErrors.join(" "));
      return;
    }

    setLoading(true);

    try {
      const API_BASE = getApiBase(role);
      const url = `${API_BASE}/${role.toLowerCase()}/${submitPath}`;

      const res = await axios.post(
        url,
        { email: fullEmail, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const resp = res.data;

      let accessToken =
        resp?.data?.[0]?.token ?? resp?.token ?? resp?.accessToken;
      let user = resp?.data?.[1]?.user ?? resp?.user ?? resp?.data;

      if (!accessToken && Array.isArray(resp?.data)) {
        const found = resp.data.find((it: any) => it && it.token);
        accessToken = found?.token;
      }

      if (!accessToken) throw new Error("No access token received from server");

      let safeUser: any = null;
      if (user && typeof user === "object") {
        safeUser = { ...user };
        delete safeUser.password;
        delete safeUser.refreshTokens;

        if (!safeUser._id && safeUser.id) {
          safeUser._id = safeUser.id;
          delete safeUser.id;
        }

        if (!safeUser.role) safeUser.role = role;
      }

      sessionStorage.setItem("accessToken", accessToken);
      if (safeUser) sessionStorage.setItem("user", JSON.stringify(safeUser));

      dispatch(setCredentials({ user: safeUser, token: accessToken }));

      if (role === "Student" && safeUser) dispatch(setStudent(safeUser));
      if ((role === "Faculty" || role === "HOD") && safeUser)
        dispatch(setFaculty(safeUser));

      navigate(`/${role.toLowerCase()}`);
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-slate-100 relative flex flex-col md:flex-row gap-6 items-center">

        {/* Back Arrow */}
        <button
          onClick={() => navigate("/")}
          className={`absolute top-4 left-4 text-2xl ${meta.textClass} hover:opacity-80`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Illustration */}
        <div className="w-64 md:w-80 flex-shrink-0 flex items-center justify-center">
          <img
            src={`/${role}-login.png`}
            alt={`${role} illustration`}
            className="w-full h-auto"
          />
        </div>

        {/* Form */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">
                {role} Sign In
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Login into BMSCE campus
              </p>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                meta.colorClass.split(" ")[0]
              } opacity-95`}
            >
              {meta.label}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 w-full">
            {(message || clientValidationMessages.length > 0) && (
              <div
                className={`mb-4 rounded-xl p-3 ${
                  message
                    ? "bg-rose-50 border border-rose-100 text-rose-700"
                    : "bg-amber-50 border border-amber-100 text-amber-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {message ? (
                      <svg
                        className="w-5 h-5 text-rose-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="text-sm leading-tight">
                    {message ? (
                      <div>{message}</div>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {clientValidationMessages.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <label className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <div
              className={`mt-2 flex rounded-2xl border bg-white overflow-hidden focus-within:ring-2 items-center ${
                focus === "email" ? meta.ringClass : ""
              } border-slate-300`}
            >
              <input
                type="text"
                name="emailLocal"
                placeholder="username.dept"
                value={emailLocal}
                onChange={(e) => setEmailLocal(e.target.value)}
                onFocus={() => setFocus("email")}
                onBlur={() => setFocus(null)}
                className="w-full px-4 py-3 outline-none text-sm"
              />
              <div className="px-3 py-2 bg-slate-50 border-l text-slate-500 text-sm">
                {emailSuffix}
              </div>
            </div>

            {focus === "email" && (
              <div className="mt-2 text-sm flex items-center gap-2">
                <span
                  className={`inline-flex w-4 h-4 items-center justify-center rounded-full border text-[10px] ${
                    emailValid
                      ? "text-emerald-600 border-emerald-600"
                      : "text-rose-600 border-rose-600"
                  }`}
                >
                  {emailValid ? "✓" : "✗"}
                </span>
                <span
                  className={`${emailValid ? "text-emerald-600" : "text-rose-600"}`}
                >
                  Must be a valid email
                </span>
              </div>
            )}

            {/* Password */}
            <label className="block mt-5 text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocus("password")}
              onBlur={() => setFocus(null)}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${meta.ringClass} text-sm`}
              placeholder="••••••••"
            />

            <div className="mt-2 text-right">
              <a
                href={`/auth/${role.toLowerCase()}/forgot`}
                className={`${meta.textClass} hover:underline text-sm`}
              >
                Forgot password?
              </a>
            </div>

            <div className="mt-3">
              <PasswordCriteria value={password} visible={focus === "password"} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-6 w-full rounded-2xl ${meta.colorClass} py-2.5 font-medium disabled:opacity-60`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="mt-4 text-sm text-slate-600">
              If any queries or issues kindly contact{" "}
              <a
                className="text-sky-600 hover:underline"
                href="mailto:campus@bmsce.ac.in"
              >
                tokenhub@bmsce.ac.in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
