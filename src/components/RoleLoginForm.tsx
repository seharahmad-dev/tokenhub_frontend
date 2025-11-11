import { useMemo, useState, useEffect } from "react";
import PasswordCriteria from "./PasswordCriteria";

import axios from "axios";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../app/hooks";
import { setCredentials } from "../app/authSlice";
import { setStudent } from "../app/studentSlice"; // <<-- ADDED

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
        // role matches; go to their landing page
        navigate(`/${role.toLowerCase()}`, { replace: true });
      }
    } catch {
      /* ignore */
    }
  }, [role, navigate]);

  const fullEmail = useMemo(
    () => `${emailLocal}${emailSuffix}`,
    [emailLocal, emailSuffix]
  );
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
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

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

      // convenient alias
      const resp = res.data;

      // Expecting: resp.data === [{ token: '...', }, { user: { ... } }]
      // token:
      let accessToken =
        resp?.data?.[0]?.token ?? resp?.token ?? resp?.accessToken;

      // user:
      let user = resp?.data?.[1]?.user ?? resp?.user ?? resp?.data;

      // If server didn't return token where we expect, try fallback checks:
      if (!accessToken) {
        // Try to find token anywhere in the data array
        if (Array.isArray(resp?.data)) {
          const found = resp.data.find((it: any) => it && it.token);
          accessToken = found?.token;
        }
      }

      if (!accessToken) {
        console.error("No access token in response:", resp);
        throw new Error("No access token received from server");
      }

      // Sanitize user (defensive)
      let safeUser: any = null;
      if (user && typeof user === "object") {
        safeUser = { ...user };
        delete safeUser.password;
        delete safeUser.refreshTokens;

        // normalize id field: prefer _id but allow id
        if (!safeUser._id && safeUser.id) {
          safeUser._id = safeUser.id;
          delete safeUser.id;
        }

        // ensure role exists on the safeUser (fallback to current selected role)
        if (!safeUser.role) safeUser.role = role;
      }

      // persist
      sessionStorage.setItem("accessToken", accessToken);
      if (safeUser) sessionStorage.setItem("user", JSON.stringify(safeUser));

      // update redux (auth)
      dispatch(setCredentials({ user: safeUser, token: accessToken }));

      // important: update student slice too when logging in as Student
      if (role === "Student" && safeUser) {
        dispatch(setStudent(safeUser));
      }

      // route to landing
      navigate(`/${role.toLowerCase()}`);
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h1 className="text-2xl md:text-3xl font-semibold">{role} Sign In</h1>
      <p className="mt-1 text-slate-600">login into BMSCE campus</p>

      {/* Email */}
      <label className="block mt-6 text-sm font-medium text-slate-700">
        Email address
      </label>
      <div
        className={`mt-2 flex rounded-lg border bg-white overflow-hidden focus-within:ring-2 
        ${focus === "email" ? "ring-blue-600" : ""} ${
          emailValid ? "border-slate-300" : "border-slate-300"
        }`}
      >
        <input
          type="text"
          name="emailLocal"
          placeholder="Enter your email"
          value={emailLocal}
          onChange={(e) => setEmailLocal(e.target.value)}
          onFocus={() => setFocus("email")}
          onBlur={() => setFocus(null)}
          className="w-full px-3 py-2 outline-none"
        />
        <div className="px-3 py-2 bg-slate-50 border-l text-slate-500">
          {emailSuffix}
        </div>
      </div>

      {/* email criteria – only when focused */}
      {focus === "email" && (
        <div className="mt-2 text-sm flex items-center gap-2">
          <span
            className={`inline-flex w-4 h-4 items-center justify-center rounded-full border text-[10px] 
           ${
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
      <label className="block mt-6 text-sm font-medium text-slate-700">
        Password
      </label>
      <input
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onFocus={() => setFocus("password")}
        onBlur={() => setFocus(null)}
        className={`mt-2 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600`}
        placeholder="••••••••"
      />
      <div className="mt-2 text-right">
        <a
          href={`/auth/${role.toLowerCase()}/forgot`}
          className="text-sm text-blue-600 hover:underline"
        >
          Forgot password?
        </a>
      </div>

      {/* password criteria – only when focused */}
      <PasswordCriteria value={password} visible={focus === "password"} />

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-blue-900 text-white py-2.5 font-medium disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <p className="mt-6 text-sm text-slate-600">
        If any queries or issues kindly contact{" "}
        <a
          className="text-pink-600 hover:underline"
          href="mailto:campus@bmsce.ac.in"
        >
          campus@bmsce.ac.in
        </a>
      </p>

      {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
    </form>
  );
}
