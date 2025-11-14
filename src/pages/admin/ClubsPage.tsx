import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import AdminNavbar from "../../components/AdminNavbar";
import ClubsToolbar from "../../components/admin/clubs/ClubsToolbar";
import ClubForm, { ClubCreatePayload } from "../../components/admin/clubs/ClubForm";
import ClubRow, { Club } from "../../components/admin/clubs/ClubRow";

/** choose API base by role */
const getApiBase = (role: "Admin" | "Student" | "Faculty" | "HOD" | "Club") => {
  switch (role) {
    case "Admin":
      return import.meta.env.VITE_ADMIN_API;
    case "Student":
      return import.meta.env.VITE_STUDENT_API;
    case "Faculty":
      return import.meta.env.VITE_FACULTY_API;
    case "HOD":
      return import.meta.env.VITE_HOD_API;
    case "Club":
      return import.meta.env.VITE_CLUB_API;
  }
};

/** in-file axios client with token + refresh */
const apiClient = axios.create({ withCredentials: true });
const getAccessToken = () => sessionStorage.getItem("accessToken");
const setAccessToken = (t: string | null) =>
  t ? sessionStorage.setItem("accessToken", t) : sessionStorage.removeItem("accessToken");

apiClient.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
async function doRefresh(): Promise<string | null> {
  try {
    const res = await axios.post(`${getApiBase("Admin")}/admin/refresh`, {}, { withCredentials: true });
    const t = res.data?.token ?? null;
    setAccessToken(t);
    return t;
  } catch {
    setAccessToken(null);
    return null;
  }
}
apiClient.interceptors.response.use(
  (r) => r,
  async (err) => {
    const req: any = err?.config;
    if (!req || err?.response?.status !== 401 || req._retry) throw err;
    req._retry = true;
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = doRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }
    const nt = await refreshPromise!;
    if (!nt) throw err;
    req.headers = req.headers ?? {};
    req.headers.Authorization = `Bearer ${nt}`;
    return apiClient(req);
  }
);

export default function ClubsPage() {
  const [items, setItems] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  // near the top of function ClubsPage()
  const [reloadKey, setReloadKey] = useState(0);

  // fetchAll uses both club service and student service to resolve display names
  async function fetchAll() {
    setLoading(true);
    try {
      const clubsPromise = apiClient.get(`${getApiBase("Club")}/club/all`);
      const studentsPromise = apiClient.get(`${getApiBase("Student")}/student/all`);

      const [clubsRes, studentsRes] = await Promise.allSettled([clubsPromise, studentsPromise]);

      const clubsData = clubsRes.status === "fulfilled" ? clubsRes.value?.data?.data ?? clubsRes.value?.data ?? [] : [];
      const studentsData = studentsRes.status === "fulfilled" ? studentsRes.value?.data?.data ?? studentsRes.value?.data ?? [] : [];

      const studentMap: Record<string, string> = {};
      if (Array.isArray(studentsData)) {
        for (const s of studentsData) {
          const id = s._id ?? s.id;
          if (!id) continue;
          const name = `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.fullName || s.name || s.email || s.usn || "";
          studentMap[id] = name;
        }
      }

      const mappedClubs = (Array.isArray(clubsData) ? clubsData : []).map((c: any) => {
        const members = Array.isArray(c.members)
          ? c.members.map((m: any) => {
              let displayName =
                m.displayName && String(m.displayName).trim()
                  ? m.displayName
                  : m.name && String(m.name).trim()
                  ? m.name
                  : m.studentName && String(m.studentName).trim()
                  ? m.studentName
                  : m.email && String(m.email).trim()
                  ? m.email
                  : "";

              if (!displayName && m.studentId && typeof m.studentId === "object") {
                const sidObj = m.studentId;
                displayName =
                  `${sidObj.firstName ?? ""} ${sidObj.lastName ?? ""}`.trim() ||
                  sidObj.fullName ||
                  sidObj.email ||
                  sidObj.usn ||
                  "";
              }

              if (!displayName && m.studentId && typeof m.studentId === "string") {
                displayName = studentMap[m.studentId] ?? "";
              }

              if (!displayName) displayName = String(m.studentId ?? m._id ?? "Unknown");

              return {
                ...m,
                displayName,
              };
            })
          : [];

        return {
          ...c,
          members,
        };
      });

      setItems(mappedClubs);
    } catch (e) {
      console.error("Clubs fetch failed", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const norm = (s: string) => (s ?? "").toLowerCase();
    return items.filter((c) => {
      const head = c.members?.find((m: any) => {
        const role = (m.role ?? "").toString();
        return role === "Club Head" || role === "clubHead" || role.toLowerCase() === "club head";
      });
      const headName = head?.name ?? head?.studentName ?? "";
      return [c.clubName, headName].some((v) => norm(String(v)).includes(norm(q)));
    });
  }, [items, q]);

  // Create club (Admin only)
  const handleCreate = async (p: ClubCreatePayload) => {
    try {
      let token = getAccessToken();
      if (!token) {
        token = await doRefresh();
        if (!token) {
          alert("Unable to authenticate. Please login again.");
          return;
        }
      }

      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      await apiClient.post(`${getApiBase("Club")}/club/register`, p, { headers });
      setCreateOpen(false);
      fetchAll();
    } catch (e: any) {
      console.error("Create club failed", e);
      if (e?.response?.status === 401) {
        alert("Authentication error. Please login again.");
      } else {
        alert(e?.response?.data?.message ?? "Failed to create club");
      }
    }
  };

  // Delete club (Admin only)
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this club?")) return;
    try {
      await apiClient.delete(`${getApiBase("Club")}/club/${id}`);
      setReloadKey((k) => k + 1);
    } catch (e) {
      console.error("Delete club failed", e);
      alert("Failed to delete club");
    }
  };

  // Replace club head (Admin only)
  const handleReplaceHead = async (id: string, newHeadId: string) => {
    try {
      const club = items.find((c) => c._id === id);
      if (!club) {
        alert("Club not found locally. Try refreshing the page.");
        return;
      }

      const currentHead = (club.members ?? []).find((m: any) => {
        const role = (m.role ?? "").toString();
        return role === "Club Head" || role === "clubHead" || role.toLowerCase() === "club head";
      });
      const currentHeadId = currentHead ? currentHead.studentId : null;

      if (!newHeadId) {
        alert("Please provide a valid new head id.");
        return;
      }

      if (currentHeadId && String(currentHeadId) === String(newHeadId)) {
        alert("The selected student is already the Club Head — pick a different student.");
        return;
      }

      let token = getAccessToken();
      if (!token) {
        token = await doRefresh();
        if (!token) {
          alert("Unable to authenticate. Please login again.");
          return;
        }
      }

      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      await apiClient.post(`${getApiBase("Club")}/club/${id}/replace-head`, { newHeadId }, { headers });

      setReloadKey((k) => k + 1);
    } catch (e: any) {
      console.error("Replace head failed", e);
      if (e?.response?.status === 401) {
        alert("Authentication error. Please login again.");
      } else if (e?.response?.data?.message) {
        alert(e.response.data.message);
      } else {
        alert("Failed to replace club head");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <div className="container 2xl:px-0 px-4">
        <div className="mx-auto max-w-[1280px] py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Clubs</h1>
            <p className="text-sm text-slate-600">Create clubs, replace club head, or delete clubs.</p>
          </header>

          <div className="mb-6">
            <ClubsToolbar q={q} onQChange={setQ} onAdd={() => setCreateOpen(true)} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Club</th>
                    <th className="px-4 py-3 font-medium">Head</th>
                    <th className="px-4 py-3 font-medium">Members</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-12" colSpan={4}>
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                          <span className="text-slate-600">Loading…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8" colSpan={4}>
                        <EmptyState title="No clubs" subtitle="Try searching or create a new club." />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <ClubRow key={c._id} c={c} onReplaceHead={handleReplaceHead} onDelete={handleDelete} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create */}
        <Modal open={createOpen} title="Create Club" onClose={() => setCreateOpen(false)}>
          <ClubForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
        </Modal>
      </div>
    </div>
  );
}
