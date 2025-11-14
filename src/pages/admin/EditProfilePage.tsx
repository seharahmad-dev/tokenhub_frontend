import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EditProfileForm, { ProfilePayload } from "../../components/admin/editProfile/EditProfileForm";
import ChangePasswordForm, { PasswordPayload } from "../../components/admin/editProfile/ChangePasswordForm";
import AdminNavbar from "../../components/AdminNavbar";
import SectionCard from "../../components/common/SectionCard";

/**
 * Admin profile page — shows extra admin fields:
 * - isVerified
 * - resetOtp, resetOtpExpiry
 * - verificationOtp, verificationOtpExpiry
 * - refreshTokens (array of { tokenHash, device, createdAt })
 * - createdAt, updatedAt
 *
 * Keeps existing update / sendOtp / reset password behavior.
 */

type AdminProfile = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified?: boolean;
  resetOtp?: number | null;
  resetOtpExpiry?: string | null;
  verificationOtp?: number | null;
  verificationOtpExpiry?: string | null;
  refreshTokens?: Array<{ tokenHash?: string; device?: string; createdAt?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

export default function EditProfilePage() {
  const navigate = useNavigate();

  // read user from sessionStorage — this is your auth/initial state
  const sessionUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!sessionUser) navigate("/login/admin");
  }, [sessionUser, navigate]);

  const API = import.meta.env.VITE_ADMIN_API;
  const token = sessionStorage.getItem("accessToken");

  // local UI state
  const [admin, setAdmin] = useState<AdminProfile | null>(sessionUser ? {
    _id: sessionUser._id,
    firstName: sessionUser.firstName,
    lastName: sessionUser.lastName,
    email: sessionUser.email,
  } : null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Fetch latest admin record (to show refreshTokens, isVerified, timestamps)
  const fetchAdmin = async () => {
    if (!admin?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/${admin._id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });
      const data = res?.data?.data ?? res?.data ?? null;
      if (data) {
        setAdmin({
          _id: data._id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          isVerified: data.isVerified ?? false,
          resetOtp: data.resetOtp ?? null,
          resetOtpExpiry: data.resetOtpExpiry ?? null,
          verificationOtp: data.verificationOtp ?? null,
          verificationOtpExpiry: data.verificationOtpExpiry ?? null,
          refreshTokens: Array.isArray(data.refreshTokens) ? data.refreshTokens.map((rt: any) => ({
            tokenHash: rt.tokenHash,
            device: rt.device,
            createdAt: rt.createdAt,
          })) : [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    } catch (err) {
      console.error("Failed to fetch admin profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update profile (firstName, lastName)
  const handleUpdateProfile = async (p: ProfilePayload) => {
    if (!admin) return;
    setSaveLoading(true);
    setMessage("");
    try {
      await axios.patch(
        `${API}/admin/${admin._id}`,
        { firstName: p.firstName, lastName: p.lastName },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      // update local session storage (user) so other pages reflect change
      const updatedSessionUser = { ...(sessionUser || {}), firstName: p.firstName, lastName: p.lastName };
      try {
        sessionStorage.setItem("user", JSON.stringify(updatedSessionUser));
      } catch {
        // ignore
      }

      // refresh server-side record
      await fetchAdmin();

      setMessage("✅ Profile updated successfully!");
    } catch (err) {
      console.error("Profile update failed", err);
      setMessage("❌ Update failed.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Send OTP to admin email (for reset)
  const sendOtp = async () => {
    if (!admin?.email) {
      alert("No email available");
      return;
    }
    setOtpLoading(true);
    setMessage("");
    try {
      await axios.post(`${API}/admin/forgot-password`, { email: admin.email });
      setMessage("✅ OTP sent to your email.");
      // refresh admin (resetOtp/resetExpiry may be updated)
      await fetchAdmin();
    } catch (err) {
      console.error("Send OTP failed", err);
      setMessage("❌ Failed sending OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Reset password using OTP
  const resetPassword = async ({ currentEmail, otp, newPassword }: PasswordPayload) => {
    setResetLoading(true);
    setMessage("");
    try {
      await axios.post(`${API}/admin/reset-password`, { email: currentEmail, otp, newPassword });
      setMessage("✅ Password updated! You will be logged out.");
      // clear local session and redirect to login
      sessionStorage.clear();
      window.setTimeout(() => {
        navigate("/login/admin");
      }, 800);
    } catch (err) {
      console.error("Password reset failed", err);
      setMessage("❌ Password reset failed.");
    } finally {
      setResetLoading(false);
    }
  };

  // Helper: format date/time nicely
  const fmt = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return String(iso);
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />

      <main className="container px-4 2xl:px-0 py-8">
        <div className="max-w-[900px] mx-auto space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6 flex items-center gap-6 shadow-sm">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center text-3xl text-red-700">
              {admin.firstName?.charAt(0) ?? "A"}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-slate-900">
                {admin.firstName} {admin.lastName}
              </h1>
              <p className="text-slate-600 text-sm">{admin.email}</p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${admin.isVerified ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-slate-50 text-slate-700"
                    }`}
                >
                  {admin.isVerified ? "Verified" : "Unverified"}
                </span>
                <span className="text-sm text-slate-500">Member since {fmt(admin.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <SectionCard title="Account Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">First name</p>
                <p className="font-medium">{admin.firstName}</p>
              </div>
              <div>
                <p className="text-slate-500">Last name</p>
                <p className="font-medium">{admin.lastName}</p>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <p className="font-medium break-all">{admin.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Account status</p>
                <p className="font-medium">{admin.isVerified ? "Verified" : "Unverified"}</p>
              </div>

              <div>
                <p className="text-slate-500">Created at</p>
                <p className="font-medium">{fmt(admin.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-500">Updated at</p>
                <p className="font-medium">{fmt(admin.updatedAt)}</p>
              </div>
            </div>
          </SectionCard>


          {/* Profile edit and change password forms */}
          <SectionCard title="Edit & Security Actions">
            <div className="grid grid-cols-1 gap-6">
              {/* Update display name */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-800">Update display name</h3>
                  <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">
                    Account
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-sm text-slate-500 mb-2">
                    Change the name that appears across the admin interface.
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-white p-4">
                    <EditProfileForm
                      initial={{ firstName: admin.firstName, lastName: admin.lastName }}
                      onSubmit={handleUpdateProfile}
                      loading={saveLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Change / Reset password */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-800">Change / Reset password</h3>
                  <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">
                    Security
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-sm text-slate-500 mb-2">
                    Use OTP to reset your password or change it directly if you remember the current one.
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-white p-4 space-y-3">
                    <ChangePasswordForm
                      email={admin.email}
                      onSendOtp={sendOtp}
                      onReset={resetPassword}
                      sendingOtp={otpLoading}
                      resetting={resetLoading}
                    />

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        onClick={sendOtp}
                        disabled={otpLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${otpLoading ? "bg-red-400/60 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                      >
                        {otpLoading ? "Sending…" : "Send OTP"}
                      </button>

                      <button
                        onClick={async () => { await fetchAdmin(); setMessage("Profile refreshed"); setTimeout(() => setMessage(""), 1800); }}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {message && <p className="text-sm text-center text-slate-700">{message}</p>}
        </div>
      </main>
    </div>
  );
}
