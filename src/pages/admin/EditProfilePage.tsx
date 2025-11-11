import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EditProfileForm, { ProfilePayload } from "../../components/admin/editProfile/EditProfileForm";
import ChangePasswordForm, { PasswordPayload } from "../../components/admin/editProfile/ChangePasswordForm";
import AdminNavbar from "../../components/AdminNavbar";

export default function EditProfilePage() {
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!user) navigate("/login/admin");
  }, [user, navigate]);

  const API = import.meta.env.VITE_ADMIN_API;
  const token = sessionStorage.getItem("accessToken");

  const [saveLoading, setSaveLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleUpdateProfile = async (p: ProfilePayload) => {
    setSaveLoading(true);
    try {
      await axios.patch(
        `${API}/admin/${user._id}`,
        { firstName: p.firstName, lastName: p.lastName },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      const updated = { ...user, firstName: p.firstName, lastName: p.lastName };
      sessionStorage.setItem("user", JSON.stringify(updated));
      alert("Profile updated successfully!");
      window.location.reload();
    } catch {
      alert("Update failed.");
    } finally {
      setSaveLoading(false);
    }
  };

  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      await axios.post(`${API}/admin/forgot-password`, { email: user.email });
      alert("OTP sent!");
    } catch {
      alert("Failed sending OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const resetPassword = async ({ currentEmail, otp, newPassword }: PasswordPayload) => {
    setResetLoading(true);
    try {
      await axios.post(`${API}/admin/reset-password`, { email: currentEmail, otp, newPassword });
      alert("Password updated! Login again.");
      sessionStorage.clear();
      navigate("/login/admin");
    } catch {
      alert("Password reset failed.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div>
      <AdminNavbar />

      <div className="container 2xl:px-0 px-4 py-8 max-w-[640px] mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>

        <EditProfileForm
          initial={{ firstName: user.firstName, lastName: user.lastName }}
          onSubmit={handleUpdateProfile}
          loading={saveLoading}
        />

        <ChangePasswordForm
          email={user.email}
          onSendOtp={() => sendOtp()}
          onReset={resetPassword}
          sendingOtp={otpLoading}
          resetting={resetLoading}
        />
      </div>
    </div>
  );
}