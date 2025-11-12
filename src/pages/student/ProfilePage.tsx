import { useEffect, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

export default function ProfilePage() {
  const student = useAppSelector(selectStudent);
  const [personalEmail, setPersonalEmail] = useState(student?.personalEmail || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tokens, setTokens] = useState({ total: 0, available: 0 });

  useEffect(() => {
    const fetchTokens = async () => {
      if (!student?._id) return;
      try {
        const baseURL = import.meta.env.VITE_TOKEN_API || "";
        const res = await axios.get(`${baseURL}/token/${student._id}/total`, { withCredentials: true });
        const data = res?.data?.data;
        if (data) setTokens({ total: data.totalTokens, available: data.availableTokens });
      } catch (e) {
        console.error(e);
      }
    };
    fetchTokens();
  }, [student?._id]);

  const handleSave = async () => {
    if (!student?._id) return;
    setSaving(true);
    setMessage("");
    try {
      const baseURL = import.meta.env.VITE_STUDENT_API || "";
      const url = `${baseURL}/student/${student._id}`;
      const token = sessionStorage.getItem("accessToken");

      await axios.patch(
        url,
        { personalEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage("✅ Personal email updated successfully!");
      setEditing(false);
    } catch (err: any) {
      console.error(err);
      setMessage("❌ Failed to update personal email.");
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />

      <main className="container px-4 2xl:px-0 py-8">
        <div className="max-w-[900px] mx-auto space-y-6">
          {/* Profile Header */}
          <div className="rounded-2xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex items-center gap-6 shadow-sm">
            <div className="h-20 w-20 rounded-full bg-blue-200 flex items-center justify-center text-3xl">
              {student.firstName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-slate-600 text-sm">{student.usn}</p>
              <p className="text-slate-500 text-sm">
                {student.branch} • Semester {student.semester}
              </p>
            </div>
          </div>

          {/* Academic Info */}
          <SectionCard title="Academic Details">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">USN</p>
                <p className="font-medium">{student.usn}</p>
              </div>
              <div>
                <p className="text-slate-500">Branch</p>
                <p className="font-medium">{student.branch}</p>
              </div>
              <div>
                <p className="text-slate-500">Semester</p>
                <p className="font-medium">{student.semester}</p>
              </div>
            </div>
          </SectionCard>

          {/* Contact Info */}
          <SectionCard title="Contact Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-slate-500">College Email</p>
                <p className="font-medium break-all">{student.email}</p>
              </div>

              <div>
                <p className="text-slate-500">Personal Email</p>
                {editing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      className="border rounded-md px-2 py-1 text-sm w-full"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-slate-500 text-sm px-2 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-medium">
                      {personalEmail || "Not added"}
                    </p>
                    <button
                      onClick={() => setEditing(true)}
                      className="text-blue-600 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
            {message && (
              <p className="text-xs text-green-600 font-medium mt-2">{message}</p>
            )}
          </SectionCard>

          {/* Tokens */}
          <SectionCard title="Token Summary">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="border rounded-lg bg-white py-4">
                <p className="text-slate-500 text-sm">Total Tokens</p>
                <p className="text-xl font-semibold text-slate-800">
                  {tokens.total}
                </p>
              </div>
              <div className="border rounded-lg bg-white py-4">
                <p className="text-slate-500 text-sm">Available Tokens</p>
                <p className="text-xl font-semibold text-green-700">
                  {tokens.available}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Clubs */}
          {Array.isArray(student.clubs) && student.clubs.length > 0 && (
            <SectionCard title="Club Memberships">
              <ul className="divide-y">
                {student.clubs.map((c, i) => (
                  <li key={i} className="py-2 flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium">{c.clubId?.name || "Club Member"}</span>
                    <span className="text-slate-500">{c.role}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      </main>
    </div>
  );
}
