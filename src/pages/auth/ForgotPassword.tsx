import { FormEvent, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import TextInput from "../../components/TextInput";
import { api, Role } from "../../lib/api";

export default function ForgotPasswordPage() {
  const { role = "student" } = useParams<{ role: Role }>();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      await api.forgotPassword(role as Role, email);
      setMsg("OTP has been sent to your email.");
      // go to Verify OTP while preserving email
      navigate(`/auth/${role}/verify-otp`, { state: { email } });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle={`Send OTP to your ${role} email`}
    >
      <form onSubmit={onSubmit} className="grid gap-4 max-w-md w-full">
        <div className="rounded-lg border border-red-100 bg-white p-4 shadow-sm">
          <TextInput
            label="Email address"
            type="email"
            placeholder="Enter your email"
            rightAddon="@bmsce.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-md border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-red-300 outline-none"
          />
        </div>

        {err && <p className="text-sm text-rose-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}

        <button
          disabled={loading}
          className={`h-10 w-full rounded-lg px-4 text-white disabled:opacity-60 ${
            loading ? "bg-red-400/70" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>
    </AuthLayout>
  );
}
