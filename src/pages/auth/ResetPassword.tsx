import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import TextInput from "../../components/TextInput";
import PasswordCriteria from "../../components/PasswordCriteria";
import { runChecks } from "../../lib/password";
import { api, Role } from "../../lib/api";

export default function ResetPasswordPage() {
  const { role = "student" } = useParams<{ role: Role }>();
  const navigate = useNavigate();

  const location = useLocation() as { state?: { email?: string; otp?: string } };
  const email = location.state?.email ?? "";
  const otp = location.state?.otp ?? "";

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [focus, setFocus] = useState(false);
  const checks = useMemo(() => runChecks(pw), [pw]);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = pw === confirm && Object.values(checks).every(Boolean);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setErr(null);
    setLoading(true);

    try {
      await api.resetPassword(role as Role, email, otp, pw);
      navigate(`/login/${role}`);
    } catch (e: any) {
      setErr(e?.message ?? "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset Password" subtitle={`Reset password for ${email}`}>
      <form onSubmit={onSubmit} className="grid gap-4 max-w-md w-full">
        {/* Card */}
        <div className="rounded-lg border border-red-100 bg-white p-4 shadow-sm">
          {/* Password */}
          <div className="mb-3">
            <TextInput
              label="New Password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              required
              className="rounded-md border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-red-300 outline-none"
            />
            <PasswordCriteria value={pw} visible={focus} />
          </div>

          {/* Confirm Password */}
          <div>
            <TextInput
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="rounded-md border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-red-300 outline-none"
            />
            {confirm && pw !== confirm && (
              <p className="text-sm text-rose-600 -mt-1">Passwords do not match.</p>
            )}
          </div>
        </div>

        {err && <p className="text-sm text-rose-600">{err}</p>}

        <button
          disabled={!canSubmit || loading}
          className={`h-10 w-full rounded-lg text-white disabled:opacity-60 ${
            loading ? "bg-red-400/70" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </AuthLayout>
  );
}
