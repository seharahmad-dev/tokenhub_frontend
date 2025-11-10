import { useMemo, useState } from "react";
import PasswordCriteria from "./PasswordCriteria";

type Role = "Student" | "Faculty" | "HOD" | "Admin";

export default function RoleLoginForm({
  role,
  emailSuffix = "@bmsce.ac.in",
  submitPath = "/api/auth/login" // base path; final POST -> `${submitPath}/${role.toLowerCase()}`
}: {
  role: Role;
  emailSuffix?: string; // shows as a trailing box like screenshot
  submitPath?: string;
}) {
  const [emailLocal, setEmailLocal] = useState("");
  const [password, setPassword] = useState("");
  const [focus, setFocus] = useState<null | "email" | "password">(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fullEmail = useMemo(() => `${emailLocal}${emailSuffix}`, [emailLocal, emailSuffix]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullEmail);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${submitPath}/${role.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fullEmail, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      // token & user expected as per backend
      setMessage("Login successful");
      // TODO: store token, route to dashboard
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h1 className="text-2xl md:text-3xl font-semibold">{role} Sign In</h1>
      <p className="mt-1 text-slate-600">login into BMSCE campus</p>

      {/* Email */}
      <label className="block mt-6 text-sm font-medium text-slate-700">Email address</label>
      <div
        className={`mt-2 flex rounded-lg border bg-white overflow-hidden focus-within:ring-2 
        ${focus === "email" ? "ring-blue-600" : ""} ${emailValid ? "border-slate-300" : "border-slate-300"}`}
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
        <div className="px-3 py-2 bg-slate-50 border-l text-slate-500">{emailSuffix}</div>
      </div>

      {/* email criteria – only when focused */}
      {focus === "email" && (
        <div className="mt-2 text-sm flex items-center gap-2">
          <span className={`inline-flex w-4 h-4 items-center justify-center rounded-full border text-[10px] 
           ${emailValid ? "text-emerald-600 border-emerald-600" : "text-rose-600 border-rose-600"}`}>
            {emailValid ? "✓" : "✗"}
          </span>
          <span className={`${emailValid ? "text-emerald-600" : "text-rose-600"}`}>
            Must be a valid email
          </span>
        </div>
      )}

      {/* Password */}
      <label className="block mt-6 text-sm font-medium text-slate-700">Password</label>
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
        <a href={`/forgot-password/${role.toLowerCase()}`} className="text-sm text-blue-600 hover:underline">
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
        <a className="text-pink-600 hover:underline" href="mailto:campus@bmsce.ac.in">
          campus@bmsce.ac.in
        </a>
      </p>

      {message && (
        <p className="mt-3 text-sm text-slate-700">{message}</p>
      )}
    </form>
  );
}