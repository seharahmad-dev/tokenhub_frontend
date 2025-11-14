// src/pages/faculty/FacultyProfile.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import FacultyNavbar from "../../components/faculty/FacultyNavbar";
import SectionCard from "../../components/common/SectionCard";

/**
 * Faculty Profile page
 * - Fetches current faculty from sessionStorage and then fetches latest record from FACULTY_API
 * - Allows editing firstName, lastName, branch, designation (PATCH /faculty/:id)
 * - Allows sending OTP (POST /faculty/forgot-password) and resetting password (POST /faculty/reset-password)
 *
 * Theme: white + green, rounded borders
 */

type FacultyProfileShape = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  branch?: string;
  collegeEmail?: string;
  designation?: string;
  isHod?: string | null;
  myStudents?: string[];
  events?: { eventId?: string }[];
  createdAt?: string;
  updatedAt?: string;
  // other fields may exist
};

const BRANCH_OPTIONS = ["CSE", "ISE", "EC"];

export default function FacultyProfilePage(): JSX.Element {
  const FACULTY_API = (import.meta.env.VITE_FACULTY_API as string) || "";
  const token = sessionStorage.getItem("accessToken") || "";

  // session user (initial)
  const sessionUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const [faculty, setFaculty] = useState<FacultyProfileShape | null>(sessionUser ?? null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // edit form state
  const [firstName, setFirstName] = useState<string>(faculty?.firstName ?? "");
  const [lastName, setLastName] = useState<string>(faculty?.lastName ?? "");
  const [branch, setBranch] = useState<string>(faculty?.branch ?? BRANCH_OPTIONS[0]);
  const [designation, setDesignation] = useState<string>(faculty?.designation ?? "");

  // OTP / reset password state
  const [otpSending, setOtpSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");

  const [message, setMessage] = useState<string>("");

  // fetch latest faculty record from API
  const fetchFaculty = async () => {
    if (!faculty?._id) return;
    setLoading(true);
    try {
      const resp = await axios.get(`${FACULTY_API.replace(/\/+$/, "")}/faculty/${encodeURIComponent(faculty._id)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });
      const data = resp?.data?.data ?? resp?.data ?? null;
      if (data) {
        setFaculty(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setBranch(data.branch ?? BRANCH_OPTIONS[0]);
        setDesignation(data.designation ?? "");
      }
    } catch (err) {
      console.error("Failed to fetch faculty profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial hydration from sessionUser (if any)
    if (sessionUser && !faculty) {
      setFaculty(sessionUser);
      setFirstName(sessionUser.firstName ?? "");
      setLastName(sessionUser.lastName ?? "");
      setBranch(sessionUser.branch ?? BRANCH_OPTIONS[0]);
      setDesignation(sessionUser.designation ?? "");
    }
    // then fetch latest from server if we have an id
    if (sessionUser && sessionUser._id) {
      fetchFaculty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update profile handler
  const handleUpdateProfile = async () => {
    if (!faculty?._id) {
      alert("Faculty identity missing.");
      return;
    }
    // Basic client side validation
    if (!firstName.trim() || !lastName.trim() || !branch.trim() || !designation.trim()) {
      setMessage("Please fill all editable fields.");
      return;
    }

    setSaveLoading(true);
    setMessage("");
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        branch: branch.trim(),
        designation: designation.trim(),
      };
      await axios.patch(
        `${FACULTY_API.replace(/\/+$/, "")}/faculty/${encodeURIComponent(faculty._id)}`,
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        }
      );

      // update session storage user so other pages reflect change
      try {
        const updatedSession = { ...(sessionUser || {}), firstName: payload.firstName, lastName: payload.lastName, branch: payload.branch, designation: payload.designation };
        sessionStorage.setItem("user", JSON.stringify(updatedSession));
      } catch {
        // ignore
      }

      // refresh faculty data
      await fetchFaculty();
      setMessage("✅ Profile updated successfully.");
    } catch (err) {
      console.error("Profile update failed", err);
      setMessage("❌ Update failed. Check console.");
    } finally {
      setSaveLoading(false);
      // clear message after a short while
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Send OTP for password reset
  const handleSendOtp = async () => {
    if (!faculty?.collegeEmail) {
      alert("No email available for this account.");
      return;
    }
    setOtpSending(true);
    setMessage("");
    try {
      await axios.post(
        `${FACULTY_API.replace(/\/+$/, "")}/faculty/forgot-password`,
        { email: faculty.collegeEmail },
        { withCredentials: true }
      );
      setMessage("✅ OTP sent to your college email.");
    } catch (err) {
      console.error("Send OTP failed", err);
      setMessage("❌ Failed to send OTP.");
    } finally {
      setOtpSending(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  // Reset password using OTP
  const handleResetPassword = async () => {
    if (!faculty?.collegeEmail) {
      alert("No email available.");
      return;
    }
    if (!otp || !newPassword) {
      setMessage("Please provide OTP and new password.");
      return;
    }
    setResetting(true);
    setMessage("");
    try {
      await axios.post(
        `${FACULTY_API.replace(/\/+$/, "")}/faculty/reset-password`,
        { email: faculty.collegeEmail, otp, newPassword },
        { withCredentials: true }
      );
      setMessage("✅ Password updated. You may re-login.");
      // clear local session on password change for safety
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");
      // do not redirect forcibly; user can sign in again
    } catch (err) {
      console.error("Reset password failed", err);
      setMessage("❌ Password reset failed. Check OTP or password rules.");
    } finally {
      setResetting(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const fmt = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return String(iso);
    }
  };

  if (!faculty) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-600">
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <FacultyNavbar />

      <main className="container 2xl:px-0 px-4 py-8">
        <div className="max-w-[900px] mx-auto space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 flex items-center gap-6 shadow-sm">
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center text-3xl text-emerald-700 font-semibold">
              {faculty.firstName?.charAt(0)?.toUpperCase() ?? "F"}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-slate-900">
                {faculty.firstName} {faculty.lastName}
              </h1>
              <p className="text-slate-600 text-sm">{faculty.collegeEmail}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  Faculty
                </span>
                <span className="text-sm text-slate-500">Member since {fmt(faculty.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <SectionCard title="Account Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">First name</p>
                <p className="font-medium">{faculty.firstName}</p>
              </div>
              <div>
                <p className="text-slate-500">Last name</p>
                <p className="font-medium">{faculty.lastName}</p>
              </div>
              <div>
                <p className="text-slate-500">Branch</p>
                <p className="font-medium">{faculty.branch}</p>
              </div>
              <div>
                <p className="text-slate-500">Designation</p>
                <p className="font-medium">{faculty.designation}</p>
              </div>
              <div>
                <p className="text-slate-500">Events organized</p>
                <p className="font-medium">{Array.isArray(faculty.events) ? faculty.events.length : 0}</p>
              </div>
              <div>
                <p className="text-slate-500">Assigned students</p>
                <p className="font-medium">{Array.isArray(faculty.myStudents) ? faculty.myStudents.length : 0}</p>
              </div>

              <div>
                <p className="text-slate-500">Created at</p>
                <p className="font-medium">{fmt(faculty.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-500">Updated at</p>
                <p className="font-medium">{fmt(faculty.updatedAt)}</p>
              </div>
            </div>
          </SectionCard>

          {/* Edit & Security Actions */}
          <SectionCard title="Edit & Security Actions">
            <div className="grid grid-cols-1 gap-6">
              {/* Edit profile */}
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-800">Edit profile</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                    Profile
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">First name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-emerald-100 p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">Last name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-emerald-100 p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">Branch</label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-emerald-100 p-2 text-sm"
                    >
                      {BRANCH_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">Designation</label>
                    <input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-emerald-100 p-2 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={saveLoading}
                    className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm ${saveLoading ? "bg-emerald-400/60 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  >
                    {saveLoading ? "Saving…" : "Save changes"}
                  </button>
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
