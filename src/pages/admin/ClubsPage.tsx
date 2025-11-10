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
    case "Admin": return import.meta.env.VITE_ADMIN_API;
    case "Student": return import.meta.env.VITE_STUDENT_API;
    case "Faculty": return import.meta.env.VITE_FACULTY_API;
    case "HOD": return import.meta.env.VITE_HOD_API;
    case "Club": return import.meta.env.VITE_CLUB_API;
  }
};

/** in-file axios client with token + refresh */
const apiClient = axios.create({ withCredentials: true });
const getAccessToken = () => sessionStorage.getItem("accessToken");
const setAccessToken = (t: string | null) => t ? sessionStorage.setItem("accessToken", t) : sessionStorage.removeItem("accessToken");

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
      refreshPromise = doRefresh().finally(() => { isRefreshing = false; refreshPromise = null; });
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

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await apiClient.get(`${getApiBase("Club")}/club/all`);
      setItems(res?.data?.data ?? res?.data ?? []);
    } catch (e) {
      console.error("Clubs fetch failed", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const norm = (s: string) => (s ?? "").toLowerCase();
    return items.filter(c => {
      const head = c.members?.find(m => (m.role === "Club Head") || (m.role === "clubHead"));
      const headName = head?.name || head?.studentName || "";
      return [c.clubName, headName].some(v => norm(String(v)).includes(norm(q)));
    });
  }, [items, q]);

  // Create club (Admin only)
  const handleCreate = async (p: ClubCreatePayload) => {
    try {
      await apiClient.post(`${getApiBase("Club")}/club/register`, p, {
        headers: { "Content-Type": "application/json" },
      });
      setCreateOpen(false);
      fetchAll();
    } catch (e) {
      console.error("Create club failed", e);
      alert("Failed to create club");
    }
  };

  // Delete club (Admin only)
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this club?")) return;
    try {
      await apiClient.delete(`${getApiBase("Club")}/club/${id}`);
      fetchAll();
    } catch (e) {
      console.error("Delete club failed", e);
      alert("Failed to delete club");
    }
  };

  // Replace club head (Admin only)
  const handleReplaceHead = async (id: string, newHeadId: string) => {
    try {
      await apiClient.post(`${getApiBase("Club")}/club/${id}/replace-head`, { newHeadId }, {
        headers: { "Content-Type": "application/json" },
      });
      fetchAll();
    } catch (e) {
      console.error("Replace head failed", e);
      alert("Failed to replace club head");
    }
  };

  return (
    <div className="container 2xl:px-0 px-4">
      <AdminNavbar />
      <div className="mx-auto max-w-[1280px] py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Clubs</h1>
          <p className="text-slate-600">Create clubs, replace club head, or delete clubs.</p>
        </header>

        <ClubsToolbar q={q} onQChange={setQ} onAdd={() => setCreateOpen(true)} />

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Club</th>
                  <th className="px-3 py-2 font-medium">Head</th>
                  <th className="px-3 py-2 font-medium">Members</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-3 py-8" colSpan={4}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-3 py-6" colSpan={4}><EmptyState title="No clubs" subtitle="Try searching or create a new club." /></td></tr>
                ) : (
                  filtered.map(c => (
                    <ClubRow
                      key={c._id}
                      c={c}
                      onReplaceHead={handleReplaceHead}
                      onDelete={handleDelete}
                    />
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
  );
}