import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import AdminNavbar from "../../components/AdminNavbar";
import HodToolbar from "../../components/admin/hod/HodToolbar";
import HodForm from "../../components/admin/hod/HodForm";
import HodRow from "../../components/admin/hod/HodRow";

/** choose API base by role - HOD service removed; use Faculty service only */
const getApiBase = (role: "Admin" | "Student" | "Faculty" | "HOD" | "Club") => {
  switch (role) {
    case "Admin":
      return import.meta.env.VITE_ADMIN_API;
    case "Student":
      return import.meta.env.VITE_STUDENT_API;
    case "Faculty":
      return import.meta.env.VITE_FACULTY_API;
    case "HOD":
      return import.meta.env.VITE_FACULTY_API; // IMPORTANT: HOD is represented by Faculty now
    case "Club":
      return import.meta.env.VITE_CLUB_API;
  }
};

/** in-file axios client with token + refresh (unchanged) */
const apiClient = axios.create({ withCredentials: true });
const getAccessToken = () => sessionStorage.getItem("accessToken");
const setAccessToken = (t: string | null) => (t ? sessionStorage.setItem("accessToken", t) : sessionStorage.removeItem("accessToken"));

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

export default function HodPage() {
  // we store HOD items but they are actually faculties with isHod set
  const [items, setItems] = useState<Hod[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");

  // assign modal
  const [assignOpen, setAssignOpen] = useState(false);

  // edit modal (edits underlying faculty)
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Hod | null>(null);

  // faculties for assign modal (eligible faculties without isHod)
  const [faculties, setFaculties] = useState<any[]>([]);
  const [facLoading, setFacLoading] = useState(false);

  // assign modal selection state
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<"CSE" | "ISE" | "EC" | "">("");
  const [assignLoading, setAssignLoading] = useState(false);

  const API_FACULTY = getApiBase("Faculty")!;
  const accessToken = sessionStorage.getItem("accessToken");

  const axiosConfig = {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    withCredentials: true,
  };

  /** Fetch all faculties then derive HODs (faculties with isHod set) */
  async function fetchAll() {
    setLoading(true);
    try {
      const res = await apiClient.get(`${API_FACULTY}/faculty/all`);
      const allFac: any[] = res?.data?.data ?? res?.data ?? [];
      // HODs are faculties where isHod is truthy and one of allowed strings
      const hods = allFac
        .filter((f) => f.isHod && ["CSE", "ISE", "EC"].includes(String(f.isHod)))
        // map faculty shape into Hod shape expected by HodRow / HodForm — we keep using the same fields
        .map((f) => ({
          _id: f._id,
          firstName: f.firstName,
          lastName: f.lastName,
          branch: f.isHod, // this is the HOD branch
          phone: f.phone ?? "",
          tenureStart: f.tenureStart ?? null,
          tenureEnd: f.tenureEnd ?? null,
          email: f.collegeEmail ?? f.email ?? "",
          // attach underlying faculty object (if needed)
          _faculty: f,
        }));
      setItems(hods);
    } catch (e) {
      console.error("Failed to fetch faculties (for HODs)", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const norm = (s: string) => (s ?? "").toLowerCase();
    return items.filter((h) => {
      const hit = [h.firstName, h.lastName, h.email, h.branch, h.phone].some((v) => norm(String(v)).includes(norm(q)));
      const okBranch = branch ? h.branch === branch : true;
      return hit && okBranch;
    });
  }, [items, q, branch]);

  /** Edit: patch the underlying faculty document */
  const handleUpdate = async (p: HodPayload) => {
    if (!editRow) return;
    try {
      // edit underlying faculty: update fields that map to faculty schema
      const facultyId = (editRow as any)._faculty?._id ?? editRow._id;
      await apiClient.patch(
        `${API_FACULTY}/faculty/${facultyId}`,
        {
          firstName: p.firstName,
          lastName: p.lastName,
          // Note: HOD branch is stored as faculty.isHod; we should keep it in sync if changed
          ...(p.branch ? { isHod: p.branch } : {}),
          phone: p.phone,
          tenureStart: p.tenureStart,
          tenureEnd: p.tenureEnd,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      setEditOpen(false);
      setEditRow(null);
      fetchAll();
    } catch (e) {
      console.error("Update HOD (faculty) failed", e);
      alert("Failed to update HOD");
    }
  };

  /** "Delete" HOD: unset the isHod field on the faculty (keep faculty record) */
  const handleDelete = async (id: string) => {
    if (!confirm("Remove HOD assignment? This will keep the faculty but unset their HOD role.")) return;
    try {
      // id refers to the HOD entry (which is actually faculty). We stored original faculty id in _faculty if present.
      const hod = items.find((x) => x._id === id);
      const facultyId = (hod as any)?._faculty?._id ?? id;

      // endpoint to unset HOD: adjust if your backend uses different path/method
      await apiClient.post(`${API_FACULTY}/faculty/${facultyId}/unset-hod`, {}, axiosConfig);

      fetchAll();
    } catch (e) {
      console.error("Unset HOD failed", e);
      alert("Failed to remove HOD assignment");
    }
  };

  //
  // ----- Assign HOD flow -----
  //

  const openAssignModal = async () => {
    setAssignOpen(true);
    setFacLoading(true);
    setSelectedFacultyId(null);
    setSelectedBranch("");
    try {
      const res = await apiClient.get(`${API_FACULTY}/faculty/all`);
      const allFac: any[] = res?.data?.data ?? res?.data ?? [];
      // eligible faculties do not have isHod set (falsey) or not one of allowed strings
      const eligible = allFac.filter((f) => !f.isHod || !["CSE", "ISE", "EC"].includes(String(f.isHod)));
      setFaculties(eligible);
    } catch (err) {
      console.error("Failed to load faculties for assign modal", err);
      setFaculties([]);
    } finally {
      setFacLoading(false);
    }
  };

  const closeAssignModal = () => {
    setAssignOpen(false);
    setFaculties([]);
    setSelectedFacultyId(null);
    setSelectedBranch("");
    setAssignLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedFacultyId) return alert("Select a faculty to assign as HOD");
    if (!selectedBranch) return alert("Select a branch (CSE / ISE / ECE)");

    setAssignLoading(true);
    try {
      // POST to faculty service to set isHod = branch
      // backend endpoint: POST /faculty/:id/set-hod { branch }
      await apiClient.post(`${API_FACULTY}/faculty/${selectedFacultyId}/set-hod`, { branch: selectedBranch }, axiosConfig);

      // refresh derived HOD list
      await fetchAll();

      // optionally refresh faculties list in modal (in case admin keeps it open)
      const res = await apiClient.get(`${API_FACULTY}/faculty/all`);
      const allFac: any[] = res?.data?.data ?? res?.data ?? [];
      const eligible = allFac.filter((f) => !f.isHod || !["CSE", "ISE", "EC"].includes(String(f.isHod)));
      setFaculties(eligible);

      alert("HOD assigned successfully");
      closeAssignModal();
    } catch (err: any) {
      console.error("Failed to assign HOD", err);
      const msg = err?.response?.data?.message ?? "Failed to assign HOD — check console";
      alert(msg);
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <div className="container 2xl:px-0 px-4">
        <div className="mx-auto max-w-[1280px] py-8">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">HODs</h1>
              <p className="text-sm text-slate-600">Assign, update, remove and search HODs.</p>
            </div>
            
          </header>

          <div className="mb-6">
            <HodToolbar q={q} onQChange={setQ} branch={branch} onBranchChange={setBranch} onAdd={() => openAssignModal()} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Branch</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-12" colSpan={6}>
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                          <span className="text-slate-600">Loading…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8" colSpan={6}>
                        <EmptyState title="No HODs" subtitle="Try adjusting filters or assign a HOD." />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((h) => (
                      <HodRow
                        key={h._id}
                        h={h}
                        onEdit={(row) => {
                          setEditRow(row);
                          setEditOpen(true);
                        }}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Assign HOD Modal */}
        <Modal open={assignOpen} title="Assign HOD" onClose={closeAssignModal}>
          <div className="space-y-4">
            {facLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                <span className="text-slate-600">Loading faculties…</span>
              </div>
            ) : faculties.length === 0 ? (
              <EmptyState title="No eligible faculties" subtitle="All faculties already assigned as HOD or none exist." />
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Select Faculty</label>
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none bg-white"
                    value={selectedFacultyId ?? ""}
                    onChange={(e) => setSelectedFacultyId(e.target.value || null)}
                  >
                    <option value="">— choose faculty —</option>
                    {faculties.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.firstName} {f.lastName} — {f.branch} — {f.collegeEmail ?? f.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Branch (assign as HOD for)</label>
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none bg-white"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value as "CSE" | "ISE" | "EC" | "")}
                  >
                    <option value="">— select branch —</option>
                    <option value="CSE">CSE</option>
                    <option value="ISE">ISE</option>
                    <option value="EC">ECE</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button onClick={closeAssignModal} className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50">
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedFacultyId || !selectedBranch || assignLoading}
                    className={
                      "rounded-lg px-3 py-1 text-sm font-medium text-white shadow-sm " +
                      (!selectedFacultyId || !selectedBranch || assignLoading
                        ? "bg-red-400/60 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700")
                    }
                  >
                    {assignLoading ? "Assigning…" : "Assign"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Edit HOD (edits the underlying faculty) */}
        <Modal open={editOpen} title="Edit HOD (Faculty)" onClose={() => { setEditOpen(false); setEditRow(null); }}>
          <HodForm
            mode="edit"
            initial={
              editRow
                ? {
                    firstName: editRow.firstName,
                    lastName: editRow.lastName,
                    branch: editRow.branch as "" | "CSE" | "ISE" | "EC",
                    phone: editRow.phone,
                    tenureStart: (editRow as any).tenureStart ?? "",
                    tenureEnd: (editRow as any).tenureEnd ?? "",
                  }
                : undefined
            }
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditOpen(false);
              setEditRow(null);
            }}
          />
        </Modal>
      </div>
    </div>
  );
}

/* types */
export type Hod = {
  _id: string;
  firstName: string;
  lastName: string;
  branch: "CSE" | "ISE" | "EC" | string;
  email: string;
  phone?: string;
  tenureStart?: string;
  tenureEnd?: string;
};

export type HodPayload = {
  firstName: string;
  lastName: string;
  branch: "CSE" | "ISE" | "EC" | "";
  email?: string;        // required at register
  password?: string;     // required at register
  phone?: string;
  tenureStart?: string;  // ISO yyyy-mm-dd
  tenureEnd?: string;    // ISO yyyy-mm-dd
};
