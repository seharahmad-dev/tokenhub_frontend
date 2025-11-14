import { FormEvent, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import TextInput from "../../components/TextInput";
import { api, Role } from "../../lib/api";

export default function VerifyOtpPage() {
  const { role = "student" } = useParams<{ role: Role }>();
  const navigate = useNavigate();

  const location = useLocation() as { state?: { email?: string } };
  const email = location.state?.email ?? ""; // ✅ Comes from previous page

  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      await api.verifyOtp(role as Role, email, otp);
      navigate(`/auth/${role}/reset`, { state: { email, otp } }); // ✅ pass forward
    } catch (e: any) {
      setErr(e?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Verify OTP" subtitle={`OTP sent to ${email}`}>
      <form onSubmit={onSubmit} className="grid gap-4 max-w-md w-full">
        <div className="rounded-lg border border-red-100 bg-white p-4 shadow-sm">
          {/* OTP ONLY */}
          <TextInput
            label="Enter OTP"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            className="rounded-md border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-red-300 outline-none"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              disabled={loading}
              className={`h-10 rounded-lg px-4 text-white w-full ${
                loading ? "bg-red-400/70" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </div>

        {err && <p className="text-sm text-rose-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      </form>
    </AuthLayout>
  );
}
