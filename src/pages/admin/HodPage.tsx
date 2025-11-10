import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import AdminNavbar from "../../components/AdminNavbar";
import HodToolbar from "../../components/admin/hod/HodToolbar";
import HodForm, { HodPayload } from "../../components/admin/hod/HodForm";
import HodRow, { Hod } from "../../components/admin/hod/HodRow";

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

export default function HodPage() {
  const [items, setItems] = useState<Hod[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Hod | null>(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await apiClient.get(`${getApiBase("HOD")}/hod/all`);
      setItems(res?.data?.data ?? res?.data ?? []);
    } catch (e) {
      console.error("HOD fetch failed", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const norm = (s: string) => (s ?? "").toLowerCase();
    return items.filter(h => {
      const hit = [h.firstName, h.lastName, h.email, h.branch, h.phone].some(v => norm(String(v)).includes(norm(q)));
      const okBranch = branch ? h.branch === branch : true;
      return hit && okBranch;
    });
  }, [items, q, branch]);

  // Create
  const handleCreate = async (p: HodPayload) => {
    try {
      await apiClient.post(`${getApiBase("HOD")}/hod/register`, p, {
        headers: { "Content-Type": "application/json" },
      });
      setCreateOpen(false);
      fetchAll();
    } catch (e) {
      console.error("Create HOD failed", e);
      alert("Failed to create HOD");
    }
  };

  // Update
  const handleUpdate = async (p: HodPayload) => {
    if (!editRow) return;
    try {
      await apiClient.patch(`${getApiBase("HOD")}/hod/${editRow._id}`, {
        firstName: p.firstName,
        lastName: p.lastName,
        branch: p.branch,
        phone: p.phone,
        tenureStart: p.tenureStart,
        tenureEnd: p.tenureEnd,
      }, { headers: { "Content-Type": "application/json" } });
      setEditOpen(false);
      setEditRow(null);
      fetchAll();
    } catch (e) {
      console.error("Update HOD failed", e);
      alert("Failed to update HOD");
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this HOD?")) return;
    try {
      await apiClient.delete(`${getApiBase("HOD")}/hod/${id}`);
      fetchAll();
    } catch (e) {
      console.error("Delete HOD failed", e);
      alert("Failed to delete HOD");
    }
  };

  return (
    <div className="container 2xl:px-0 px-4">
      <AdminNavbar />
      <div className="mx-auto max-w-[1280px] py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">HODs</h1>
          <p className="text-slate-600">Add, update, remove and search HODs.</p>
        </header>

        <HodToolbar q={q} onQChange={setQ} branch={branch} onBranchChange={setBranch} onAdd={() => setCreateOpen(true)} />

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Branch</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Tenure</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-3 py-8" colSpan={6}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-3 py-6" colSpan={6}><EmptyState title="No HODs" subtitle="Try adjusting filters or add a new HOD." /></td></tr>
                ) : (
                  filtered.map(h => (
                    <HodRow
                      key={h._id}
                      h={h}
                      onEdit={(row) => { setEditRow(row); setEditOpen(true); }}
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
      <Modal open={createOpen} title="Add HOD" onClose={() => setCreateOpen(false)}>
        <HodForm mode="create" onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      {/* Edit */}
      <Modal open={editOpen} title="Edit HOD" onClose={() => { setEditOpen(false); setEditRow(null); }}>
        <HodForm
          mode="edit"
          initial={editRow ? { firstName: editRow.firstName, lastName: editRow.lastName, branch: editRow.branch as "" | "CSE" | "ISE" | "ECE", phone: editRow.phone, tenureStart: editRow.tenureStart, tenureEnd: editRow.tenureEnd } : undefined}
          onSubmit={handleUpdate}
          onCancel={() => { setEditOpen(false); setEditRow(null); }}
        />
      </Modal>
    </div>
  );
}