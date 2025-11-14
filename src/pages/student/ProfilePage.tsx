import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/student/StudentNavbar";
import SectionCard from "../../components/common/SectionCard";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectStudent, setStudent } from "../../app/studentSlice";

const STUDENT_API = (import.meta.env.VITE_STUDENT_API as string) || "";
const TOKEN_API = (import.meta.env.VITE_TOKEN_API as string) || "";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const student = useAppSelector(selectStudent);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(student?.firstName ?? "");
  const [lastName, setLastName] = useState(student?.lastName ?? "");
  const [usn, setUsn] = useState(student?.usn ?? "");
  const [branch, setBranch] = useState(student?.branch ?? "");
  const [semester, setSemester] = useState(student?.semester ?? "");
  const [email, setEmail] = useState(student?.email ?? "");
  const [personalEmail, setPersonalEmail] = useState(student?.personalEmail ?? "");
  const [editing, setEditing] = useState(false);

  const [tokens, setTokens] = useState<{ total: number; available: number }>({ total: 0, available: 0 });
  const [points, setPoints] = useState<number>(0);

  useEffect(() => {
    setFirstName(student?.firstName ?? "");
    setLastName(student?.lastName ?? "");
    setUsn(student?.usn ?? "");
    setBranch(student?.branch ?? "");
    setSemester(student?.semester ?? "");
    setEmail(student?.email ?? "");
    setPersonalEmail(student?.personalEmail ?? "");
  }, [student]);

  useEffect(() => {
    if (!student?._id) return;
    let mounted = true;
    const fetchTokenAndPoints = async () => {
      try {
        setLoading(true);
        const base = TOKEN_API.replace(/\/+$/, "");
        const tokenUrl = `${base}/token/${encodeURIComponent(String(student._id))}/total`;
        const leaderboardUrl = `${base}/token/leaderboard/all`;

        const [tokRes, lbRes] = await Promise.allSettled([axios.get(tokenUrl, { withCredentials: true, timeout: 8000 }), axios.get(leaderboardUrl, { withCredentials: true, timeout: 8000 })]);

        if (!mounted) return;

        let totalTokens = 0;
        let availableTokens = 0;
        if (tokRes.status === "fulfilled") {
          const data = tokRes.value?.data?.data ?? tokRes.value?.data ?? {};
          totalTokens = Number(data.totalTokens ?? data.total ?? 0);
          availableTokens = Number(data.availableTokens ?? data.token?.availableTokens ?? data.available ?? 0);
        }

        let calculatedPoints = 0;
        if (lbRes.status === "fulfilled") {
          const raw = lbRes.value?.data?.data ?? lbRes.value?.data ?? [];
          if (Array.isArray(raw)) {
            const meRow = raw.find((r: any) => String(r.studentId ?? r.student?._id ?? r._id) === String(student._id ?? "") || String(r.email) === String(student.email));
            if (meRow) {
              calculatedPoints = Number(meRow.totalTokens ?? meRow.points ?? 0);
            } else {
              calculatedPoints = totalTokens;
            }
          } else {
            calculatedPoints = totalTokens;
          }
        } else {
          calculatedPoints = totalTokens;
        }

        setTokens({ total: Number(totalTokens ?? 0), available: Number(availableTokens ?? 0) });
        setPoints(Number(calculatedPoints ?? 0));
      } catch (e) {
        setTokens({ total: 0, available: 0 });
        setPoints(0);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTokenAndPoints();
    return () => {
      mounted = false;
    };
  }, [student?._id]);

  const canEditAll = useMemo(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("user") || "null");
      const role = (u?.role ?? "").toString().toLowerCase();
      return role === "admin" || role === "superadmin";
    } catch {
      return false;
    }
  }, []);

  const handleSave = async () => {
    if (!student?._id) {
      setMessage("Missing student identity.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const token = sessionStorage.getItem("accessToken") || "";
      const payload: Record<string, any> = {};
      if (canEditAll) {
        payload.firstName = firstName?.trim();
        payload.lastName = lastName?.trim();
        payload.email = email?.trim();
        payload.branch = branch?.trim();
        payload.usn = usn?.trim();
        payload.semester = semester?.toString?.().trim();
      } else {
        payload.personalEmail = personalEmail?.trim();
      }
      const url = `${STUDENT_API.replace(/\/+$/, "")}/student/${encodeURIComponent(student._id)}`;
      const res = await axios.patch(url, payload, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        withCredentials: true,
      });
      const updatedUser = (res?.data?.data && Array.isArray(res.data.data) && res.data.data[0]?.user) ?? res?.data?.data ?? res?.data ?? null;
      const merged = { ...(student as any), ...payload, ...(updatedUser ?? {}) };
      try {
        sessionStorage.setItem("user", JSON.stringify(merged));
      } catch {}
      dispatch(setStudent(merged));
      setEditing(false);
      setMessage("Profile updated successfully.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Update failed";
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="rounded-xl bg-white p-6 shadow text-slate-600">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <StudentNavbar />
      <main className="container px-4 2xl:px-0 py-8">
        <div className="max-w-[980px] mx-auto space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100 flex items-center gap-6">
            <div className="flex items-center gap-4 w-full">
              <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center text-4xl text-blue-700 font-semibold">
                {String(student.firstName ?? "").charAt(0) || String(student.email ?? "").charAt(0) || "S"}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold text-slate-900 truncate">
                  {student.firstName} {student.lastName}
                </h1>
                <p className="text-sm text-slate-500 mt-1">{student.usn}</p>
                <div className="mt-3 text-sm text-slate-600">
                  <span>{student.branch || "—"}</span>
                  <span className="mx-2">•</span>
                  <span>Semester {student.semester ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-xl bg-white p-4 shadow border border-blue-100">
              <SectionCard title="Account Summary">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-blue-50 p-4 text-center">
                    <div className="text-xs text-slate-500">College Email</div>
                    <div className="mt-2 text-sm text-slate-800 break-all">{student.email}</div>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 text-center">
                    <div className="text-xs text-slate-500">Personal Email</div>
                    <div className="mt-2 text-sm text-slate-800 break-all">{student.personalEmail || "Not added"}</div>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 text-center">
                    <div className="text-xs text-slate-500">Notifications</div>
                    <div className="mt-2 text-sm text-slate-800">{Array.isArray(student.notifications) ? student.notifications.length : 0}</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Academic Details & Contacts">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white p-4 border border-blue-50">
                    <div className="text-xs text-slate-500">USN</div>
                    <div className="mt-1 text-sm text-slate-800">{student.usn}</div>
                    <div className="mt-3 text-xs text-slate-500">Branch</div>
                    <div className="mt-1 text-sm text-slate-800">{student.branch}</div>
                    
                  </div>

                  <div className="rounded-xl bg-white p-4 border border-blue-50">
                    <div className="mt-3 text-xs text-slate-500">Semester</div>
                    <div className="mt-1 text-sm text-slate-800">{student.semester}</div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="rounded-xl bg-white p-4 shadow border border-blue-100 flex flex-col gap-4">
              <div className="text-sm text-slate-600">Quick Stats</div>
              <div className="grid grid-cols-1 gap-2">
                <div className="rounded-xl bg-gradient-to-b from-blue-600 to-blue-500 text-white p-4 shadow-md flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white-500">Total Points</div>
                    <div className="text-2xl font-semibold mt-1">{points}</div>
                  </div>


                </div>

                <div className="rounded-xl bg-gradient-to-b from-white to-blue-50 text-blue-800 p-4 shadow-inner border border-blue-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Available Tokens</div>
                    <div className="text-2xl font-semibold mt-1">{tokens.available}</div>
                  </div>
                </div>

                
              </div>
            </div>
          </div>

          <SectionCard title="Edit Profile">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">First name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-blue-100 p-3 text-sm bg-white shadow-sm"
                    disabled={!canEditAll && !editing}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Last name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-blue-100 p-3 text-sm bg-white shadow-sm"
                    disabled={!canEditAll && !editing}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">USN</label>
                  <input
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-blue-100 p-3 text-sm bg-white shadow-sm"
                    disabled={!canEditAll && !editing}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">Branch</label>
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-blue-100 p-3 text-sm bg-white shadow-sm"
                    disabled={!canEditAll && !editing}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">Semester</label>
                  <input
                    value={semester as string}
                    onChange={(e) => setSemester(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-blue-100 p-3 text-sm bg-white shadow-sm"
                    disabled={!canEditAll && !editing}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">College Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-blue-100 p-3 text-sm bg-white shadow-sm"
                    disabled={!canEditAll && !editing}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500">Personal Email</label>
                <input
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-blue-100 p-3 text-sm bg-white shadow-sm"
                />
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => {
                    setEditing((s) => !s);
                    setMessage(null);
                    setFirstName(student.firstName ?? "");
                    setLastName(student.lastName ?? "");
                    setUsn(student.usn ?? "");
                    setBranch(student.branch ?? "");
                    setSemester(student.semester ?? "");
                    setEmail(student.email ?? "");
                    setPersonalEmail(student.personalEmail ?? "");
                  }}
                  className="px-4 py-2 rounded-xl border border-blue-100 text-sm bg-white hover:bg-blue-50"
                >
                  {editing ? "Cancel" : "Edit"}
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-sm text-white ${saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>

              {message && <div className="rounded-xl border border-blue-100 bg-white p-3 text-sm text-slate-700">{message}</div>}
            </div>
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
