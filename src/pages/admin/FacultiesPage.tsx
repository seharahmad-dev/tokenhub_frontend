import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import FacultyToolbar from "../../components/admin/faculties/FacultyToolbar";
import FacultyForm, { FacultyPayload } from "../../components/admin/faculties/FacultyForm";
import FacultyRow, { Faculty } from "../../components/admin/faculties/FacultyRow";
import AdminNavbar from "../../components/AdminNavbar";

/** choose API base based on role (Admin page -> Admin API) */
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

const API_BASE = ""; // kept for possible apiClient usage; we use direct base below
const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

/* token helpers & interceptors (same pattern as your students page) */
const getAccessToken = () => sessionStorage.getItem("accessToken");
const setAccessToken = (token: string | null) => {
  if (token) sessionStorage.setItem("accessToken", token);
  else sessionStorage.removeItem("accessToken");
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${getApiBase("Admin")}/admin/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = res.data?.token;
    if (newToken) setAccessToken(newToken);
    return newToken ?? null;
  } catch (err) {
    setAccessToken(null);
    return null;
  }
}

apiClient.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const originalRequest = error && error.config ? error.config : null;
    if (!originalRequest) return Promise.reject(error);
    const status = error.response?.status;
    if (status !== 401) return Promise.reject(error);
    if (originalRequest._retry) return Promise.reject(error);
    originalRequest._retry = true;
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = doRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default function FacultiesPage() {
  const [items, setItems] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Faculty | null>(null);

  const API = getApiBase("Faculty")!;

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await apiClient.get(`${API}/faculty/all`);
      setItems(res?.data?.data ?? res?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch faculty", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase();
    return items.filter((f) => {
      const hit = [f.firstName, f.lastName, f.collegeEmail, f.designation].some((v) =>
        norm(String(v ?? "")).includes(norm(q))
      );
      const okBranch = branch ? f.branch === branch : true;
      return hit && okBranch;
    });
  }, [items, q, branch]);

  // Create
  const handleCreate = async (p: FacultyPayload) => {
    try {
      await apiClient.post(`${API}/faculty/register`, p, {
        headers: { "Content-Type": "application/json" },
      });
      setCreateOpen(false);
      fetchAll();
    } catch (err) {
      console.error("Create faculty failed", err);
      alert("Failed to create faculty");
    }
  };

  // Update
  const handleUpdate = async (p: FacultyPayload) => {
    if (!editRow) return;
    try {
      await apiClient.patch(
        `${API}/faculty/${editRow._id}`,
        {
          firstName: p.firstName,
          lastName: p.lastName,
          branch: p.branch,
          designation: p.designation,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setEditOpen(false);
      setEditRow(null);
      fetchAll();
    } catch (err) {
      console.error("Update faculty failed", err);
      alert("Failed to update faculty");
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this faculty?")) return;
    try {
      await apiClient.delete(`${API}/faculty/${id}`);
      fetchAll();
    } catch (err) {
      console.error("Delete faculty failed", err);
      alert("Failed to delete faculty");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavbar />
      <div className="container 2xl:px-0 px-4">
        <div className="mx-auto max-w-[1280px] py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Faculty</h1>
            <p className="text-sm text-slate-600">Add, update, remove and search faculty members.</p>
          </header>

          <div className="mb-6">
            <FacultyToolbar
              q={q}
              onQChange={setQ}
              branch={branch}
              onBranchChange={setBranch}
              onAdd={() => setCreateOpen(true)}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Branch</th>
                    <th className="px-4 py-3 font-medium">Designation</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-12" colSpan={5}>
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                          <span className="text-slate-600">Loading…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8" colSpan={5}>
                        <EmptyState
                          title="No faculty"
                          subtitle="Try adjusting filters or add a new member."
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((f) => (
                      <FacultyRow
                        key={f._id}
                        f={f}
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

        {/* Create */}
        <Modal open={createOpen} title="Add Faculty" onClose={() => setCreateOpen(false)}>
          <FacultyForm mode="create" onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
        </Modal>

        {/* Edit */}
        <Modal
          open={editOpen}
          title="Edit Faculty"
          onClose={() => {
            setEditOpen(false);
            setEditRow(null);
          }}
        >
          <FacultyForm
            mode="edit"
            initial={
              editRow
                ? {
                    firstName: editRow.firstName,
                    lastName: editRow.lastName,
                    collegeEmail: editRow.collegeEmail,
                    branch: (["CSE", "ISE", "ECE"].includes(editRow.branch)
                      ? (editRow.branch as "CSE" | "ISE" | "ECE")
                      : "") as "" | "CSE" | "ISE" | "ECE",
                    designation: editRow.designation ?? "",
                    password: "",
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
