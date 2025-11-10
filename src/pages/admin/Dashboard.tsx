import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import StatTile from "../../components/StatTile";
import DataCard from "../../components/DataCard";
import axios from "axios";

type Branch = "CSE" | "ISE" | "ECE" | string;

type Student = { _id: string; name: string; email: string; branch: Branch };
type Faculty = { _id: string; name: string; email: string; branch: Branch };
type Hod = { _id: string; name: string; email: string; branch: Branch };
type Club = { _id: string; name: string; head?: { name?: string; email?: string }; presidentName?: string };

const STUDENT_API = import.meta.env.VITE_STUDENT_API as string;
const FACULTY_API = import.meta.env.VITE_FACULTY_API as string;
const HOD_API = import.meta.env.VITE_HOD_API as string;
const CLUB_API = import.meta.env.VITE_CLUB_API as string;

function useAuthHeaders() {
  const token = localStorage.getItem("token");
  return useMemo(
    () => ({
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    [token]
  );
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [hods, setHods] = useState<Hod[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const auth = useAuthHeaders();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [s, f, h, c] = await Promise.all([
          axios.get(`${STUDENT_API}/all`, auth),
          axios.get(`${FACULTY_API}/all`, auth),
          axios.get(`${HOD_API}/all`, auth),       
          axios.get(`${CLUB_API}/all`, auth),
        ]);
        if (!mounted) return;
        setStudents(s.data?.data ?? s.data ?? []);
        setFaculty(f.data?.data ?? f.data ?? []);
        setHods(h.data?.data ?? h.data ?? []);
        setClubs(c.data?.data ?? c.data ?? []);
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
    students.forEach(s => (map[s.branch] = (map[s.branch] ?? 0) + 1));
    return map;
  }, [students]);

  const facultyByBranch = useMemo(() => {
    const map: Record<string, number> = {};
    faculty.forEach(f => (map[f.branch] = (map[f.branch] ?? 0) + 1));
    return map;
  }, [faculty]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto py-8 space-y-8">
          {loading ? (
            <div className="rounded-xl border bg-white p-8 text-center">Loading…</div>
          ) : err ? (
            <div className="rounded-xl border bg-white p-4 text-rose-600">{err}</div>
          ) : (
            <>
              {/* Top KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile title="Total Students" value={students.length} />
                <StatTile title="Total Faculty" value={faculty.length} />
                <StatTile title="Departments (HODs)" value={hods.length} />
                <StatTile title="Clubs" value={clubs.length} />
              </div>

              {/* Students by department */}
              <DataCard title="Students by Department">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(studentByBranch).map(([br, count]) => (
                    <StatTile key={br} title={br} value={count} />
                  ))}
                  {Object.keys(studentByBranch).length === 0 && (
                    <p className="text-sm text-slate-500">No student data.</p>
                  )}
                </div>
              </DataCard>

              {/* Faculty by department */}
              <DataCard title="Faculty by Department">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(facultyByBranch).map(([br, count]) => (
                    <StatTile key={br} title={br} value={count} />
                  ))}
                  {Object.keys(facultyByBranch).length === 0 && (
                    <p className="text-sm text-slate-500">No faculty data.</p>
                  )}
                </div>
              </DataCard>

              {/* HOD mapping */}
              <DataCard title="HOD Mapping">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4">Department</th>
                        <th className="py-2 pr-4">HOD Name</th>
                        <th className="py-2 pr-4">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hods.map(h => (
                        <tr key={h._id} className="border-b last:border-none">
                          <td className="py-2 pr-4">{h.branch || "—"}</td>
                          <td className="py-2 pr-4">{h.name || "—"}</td>
                          <td className="py-2 pr-4">{h.email || "—"}</td>
                        </tr>
                      ))}
                      {hods.length === 0 && (
                        <tr><td className="py-2 text-slate-500" colSpan={3}>No HOD data.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DataCard>

              {/* Clubs with president/head */}
              <DataCard title="Clubs & Presidents">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4">Club</th>
                        <th className="py-2 pr-4">President / Head</th>
                        <th className="py-2 pr-4">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubs.map(c => {
                        const headName = c.head?.name ?? c.presidentName ?? "—";
                        const headEmail = c.head?.email ?? "—";
                        return (
                          <tr key={c._id} className="border-b last:border-none">
                            <td className="py-2 pr-4">{c.name}</td>
                            <td className="py-2 pr-4">{headName}</td>
                            <td className="py-2 pr-4">{headEmail}</td>
                          </tr>
                        );
                      })}
                      {clubs.length === 0 && (
                        <tr><td className="py-2 text-slate-500" colSpan={3}>No club data.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DataCard>
            </>
          )}
        </div>
      </main>
    </div>
  );
}