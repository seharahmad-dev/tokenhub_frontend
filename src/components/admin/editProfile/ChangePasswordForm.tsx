import { useState } from "react";

export interface PasswordPayload {
  currentEmail: string;
  otp: string;
  newPassword: string;
}

export default function ChangePasswordForm({
  email,
  onSendOtp,
  onReset,
  sendingOtp,
  resetting,
}: {
  email: string;
  onSendOtp: (email: string) => void;
  onReset: (p: PasswordPayload) => void;
  sendingOtp: boolean;
  resetting: boolean;
}) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800">Change Password</h3>

      <button
        onClick={() => onSendOtp(email)}
        disabled={sendingOtp}
        className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-sm font-medium shadow disabled:opacity-60"
      >
        {sendingOtp ? "Sending..." : "Send OTP to Email"}
      </button>

      <div>
        <label className="text-sm font-medium text-slate-700">OTP</label>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-300 outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-300 outline-none"
        />
      </div>

      <button
        onClick={() => onReset({ currentEmail: email, otp, newPassword })}
        disabled={resetting}
        className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-sm font-medium shadow disabled:opacity-60"
      >
        {resetting ? "Changing..." : "Update Password"}
      </button>
    </div>
  );
}
