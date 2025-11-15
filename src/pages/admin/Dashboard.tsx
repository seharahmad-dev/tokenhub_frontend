// src/pages/admin/dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import StatTile from "../../components/StatTile";
import DataCard from "../../components/DataCard";
import axios from "axios";

type Branch = "CSE" | "ISE" | "ECE" | string;

// Faculty shape: backend may return `name` OR `firstName`/`lastName`.
// We include optional firstName/lastName to be safe, but normalize to `name`.
type Student = { _id: string; name: string; email: string; branch: Branch };
type Faculty = {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  collegeEmail?: string;
  branch?: Branch;
  isHod?: string; // department name when this faculty is HOD (truthy string), otherwise undefined
  [k: string]: any;
};
type Hod = Faculty; // HOD is just a Faculty entry with isHod set

type Club = {
  _id: string;
  clubName: string;
  head?: { name?: string; email?: string };
  presidentName?: string;
  members?: Array<{
    studentId: string; // ObjectId (Student)
    name: string;
    email: string;
    role: string; // "member", "head", etc.
    joiningDate?: string;
  }>;
};

const STUDENT_API = import.meta.env.VITE_STUDENT_API as string;
const FACULTY_API = import.meta.env.VITE_FACULTY_API as string;
const CLUB_API = import.meta.env.VITE_CLUB_API as string;

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [hods, setHods] = useState<Hod[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("accessToken");

        const auth = {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        };

        const [s, f, c] = await Promise.all([
          axios.get(`${STUDENT_API}/student/all`, auth),
          axios.get(`${FACULTY_API}/faculty/all`, auth),
          axios.get(`${CLUB_API}/club/all`, auth),
        ]);
        if (!mounted) return;

        const studentsData = s.data?.data ?? s.data ?? [];
        const facultyDataRaw = f.data?.data ?? f.data ?? [];
        const clubsData = c.data?.data ?? c.data ?? [];

        // Normalize faculty so each item has a `name` field (prefer `name`, fallback to first+last)
        const normalizedFaculty: Faculty[] = Array.isArray(facultyDataRaw)
          ? facultyDataRaw.map((fac: any) => {
              const name =
                `${(fac.firstName ?? "").toString().trim()} ${(fac.lastName ?? "").toString().trim()}`.trim() ||
                undefined;
              return {
                ...fac,
                name,
                collegeEmail: fac.collegeEmail ?? fac.email ?? undefined,
                branch: fac.branch ?? undefined,
                isHod: fac.isHod ?? undefined,
              } as Faculty;
            })
          : [];

        setStudents(studentsData);
        setFaculty(normalizedFaculty);

        // HODs: simply filter faculty entries where isHod is truthy.
        const hodsData: Hod[] = normalizedFaculty.filter((fac) => !!fac.isHod);

        setHods(hodsData);
        setClubs(clubsData);
        setErr(null);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const studentByBranch = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => (map[s.branch] = (map[s.branch] ?? 0) + 1));
    return map;
  }, [students]);

  const facultyByBranch = useMemo(() => {
    const map: Record<string, number> = {};
    faculty.forEach((f) => (map[f.branch ?? "Unknown"] = (map[f.branch ?? "Unknown"] ?? 0) + 1));
    return map;
  }, [faculty]);

  const barDataFromMap = (m: Record<string, number>) => {
    const entries = Object.entries(m);
    if (entries.length === 0) return [];
    const max = Math.max(...entries.map(([, v]) => v));
    return entries.map(([k, v]) => ({ key: k, value: v, pct: max ? Math.round((v / max) * 100) : 0 }));
  };

  const studentBars = barDataFromMap(studentByBranch);
  const facultyBars = barDataFromMap(facultyByBranch);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Campus Administration Console
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Friendly overview - quick stats and visual summaries for daily monitoring.
            </p>
          </header>

          {loading ? (
            <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
              <div className="inline-flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                <span className="text-slate-700">Loading…</span>
              </div>
            </div>
          ) : err ? (
            <div className="rounded-xl border bg-white p-4 text-rose-600 shadow-sm">{err}</div>
          ) : (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile title="Total Students" value={students.length} />
                <StatTile title="Total Faculties" value={faculty.length} />
                <StatTile title="Departments (HODs)" value={hods.length} />
                <StatTile title="Clubs" value={clubs.length} />
              </div>

              {/* Student + Faculty distribution side-by-side on md+ screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students by Department */}
                <DataCard title="Student Distribution — by Department">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      {studentBars.length === 0 ? (
                        <p className="text-sm text-slate-500">No student data.</p>
                      ) : (
                        <div className="space-y-3">
                          {studentBars.map((b) => (
                            <div key={b.key} className="flex items-center gap-3">
                              <div className="w-28 text-xs text-slate-900 font-medium">{b.key}</div>
                              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-3 rounded-full bg-red-600 transition-all duration-700"
                                  style={{ width: `${b.pct}%` }}
                                />
                              </div>
                              <div className="w-10 text-right text-xs text-slate-500">{b.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </DataCard>

                {/* Faculty by Department */}
                <DataCard title="Faculty Distribution — by Department">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      {facultyBars.length === 0 ? (
                        <p className="text-sm text-slate-500">No faculty data.</p>
                      ) : (
                        <div className="space-y-3">
                          {facultyBars.map((b) => (
                            <div key={b.key} className="flex items-center gap-3">
                              <div className="w-28 text-xs text-slate-900 font-medium">{b.key}</div>
                              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-3 rounded-full bg-red-600 transition-all duration-700"
                                  style={{ width: `${b.pct}%` }}
                                />
                              </div>
                              <div className="w-10 text-right text-xs text-slate-500">{b.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </DataCard>
              </div>

              {/* HOD mapping */}
              <DataCard title="HOD Directory">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4 text-slate-900">Department</th>
                        <th className="py-2 pr-4 text-slate-900">HOD Name</th>
                        <th className="py-2 pr-4 text-slate-900">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hods.map((h) => (
                        <tr key={h._id} className="border-b last:border-none hover:bg-red-50/30 transition-colors">
                          <td className="py-2 pr-4">{h.isHod || "—"}</td>
                          <td className="py-2 pr-4">{h.firstName + " " + h.lastName}</td>
                          <td className="py-2 pr-4">{h.collegeEmail ?? h.email ?? "—"}</td>
                        </tr>
                      ))}
                      {hods.length === 0 && (
                        <tr>
                          <td className="py-2 text-slate-500" colSpan={3}>
                            No HOD data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DataCard>

              {/* Clubs */}
              <DataCard title="Clubs & Presidents">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4 text-slate-900">Club</th>
                        <th className="py-2 pr-4 text-slate-900">Head</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubs.map((c) => {
                        const head = c.members?.find((m) => m.role === "Club Head" || m.role === "Head");
                        const headName = head?.name ?? c.head?.name ?? c.presidentName ?? "—";
                        return (
                          <tr
                            key={c._id}
                            className="border-b last:border-none hover:bg-red-50/30 transition-colors"
                          >
                            <td className="py-2 pr-4">{c.clubName}</td>
                            <td className="py-2 pr-4">{headName}</td>
                          </tr>
                        );
                      })}

                      {clubs.length === 0 && (
                        <tr>
                          <td className="py-2 text-slate-500" colSpan={2}>
                            No club data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DataCard>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
