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
    setErr(null); setMsg(null);
    setLoading(true);

    try {
      await api.verifyOtp(role as Role, email, otp);
      navigate(`/auth/${role}/reset`, { state: { email, otp } }); // ✅ pass forward
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Verify OTP" subtitle={`OTP sent to ${email}`}>
      <form onSubmit={onSubmit} className="grid gap-4 max-w-md">
        
        {/* OTP ONLY */}
        <TextInput
          label="Enter OTP"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          required
        />

        {err && <p className="text-sm text-rose-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}

        <button disabled={loading} className="h-10 rounded-lg bg-blue-900 text-white disabled:opacity-60">
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </AuthLayout>
  );
}
