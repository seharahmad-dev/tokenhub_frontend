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
    <div className="space-y-4 border-t pt-6 mt-6">
      <h3 className="text-lg font-medium">Change Password</h3>

      <button
        onClick={() => onSendOtp(email)}
        disabled={sendingOtp}
        className="rounded-lg bg-slate-800 text-white px-4 py-2 disabled:opacity-60"
      >
        {sendingOtp ? "Sending..." : "Send OTP to Email"}
      </button>

      <div>
        <label className="text-sm font-medium">OTP</label>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <button
        onClick={() => onReset({ currentEmail: email, otp, newPassword })}
        disabled={resetting}
        className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium disabled:opacity-60"
      >
        {resetting ? "Changing..." : "Update Password"}
      </button>
    </div>
  );
}