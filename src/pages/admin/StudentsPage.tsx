import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import StudentsToolbar from "../../components/admin/students/StudentsToolbar";
import StudentForm, {
  StudentPayload,
} from "../../components/admin/students/StudentForm";
import StudentRow, {
  Student,
} from "../../components/admin/students/StudentRow";
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

/**
 * ======= In-file axios client (automatically attaches access token + auto-refresh) =======
 *
 * - Uses sessionStorage.getItem("accessToken") as the source of truth for access token.
 * - When a 401 is encountered, it calls /admin/refresh (browser will send refresh cookie).
 * - If refresh succeeds, it stores the new access token and retries the failed request.
 * - Concurrency-safe: only one refresh request runs at a time; other requests wait.
 */

const API_BASE = ""; // leave empty since you pass full URLs via getApiBase(...)

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ensures refresh cookie is sent
});

const getAccessToken = () => sessionStorage.getItem("accessToken");
const setAccessToken = (token: string | null) => {
  if (token) sessionStorage.setItem("accessToken", token);
  else sessionStorage.removeItem("accessToken");
};

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 by refreshing and retrying
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    // Use plain axios to avoid going through apiClient interceptors again
    const res = await axios.post(
      `${getApiBase("Admin")}/admin/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = res.data?.token;
    if (newToken) setAccessToken(newToken);
    return newToken ?? null;
  } catch (err) {
    // refresh failed; clear token
    setAccessToken(null);
    return null;
  }
}

apiClient.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const originalRequest = error && error.config ? error.config : null;

    if (!originalRequest) return Promise.reject(error);

    // Only handle 401 errors
    const status = error.response?.status;
    if (status !== 401) return Promise.reject(error);

    // Avoid retry loops
    if (originalRequest._retry) return Promise.reject(error);
    originalRequest._retry = true;

    // start refresh if not already started
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = doRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;

    if (newToken) {
      // set header and retry original request
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    }

    // refresh failed — propagate original error
    return Promise.reject(error);
  }
);
/** ========================================================================================== */

export default function StudentsPage() {
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Student | null>(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await apiClient.get(`${getApiBase("Student")}/student/all`);
      // keep compatibility with existing api.get usage
      setItems(res?.data?.data ?? res?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch students", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase();
    return items.filter((s) => {
      const hit = [s.firstName, s.lastName, s.email, s.usn].some((v) =>
        norm(String(v)).includes(norm(q))
      );
      const okBranch = branch ? s.branch === branch : true;
      return hit && okBranch;
    });
  }, [items, q, branch]);

  // Create
  const handleCreate = async (p: StudentPayload) => {
    try {
      await apiClient.post(`${getApiBase("Student")}/student/register`, p, {
        headers: { "Content-Type": "application/json" },
      });
      setCreateOpen(false);
      fetchAll();
    } catch (err) {
      console.error("Create student failed", err);
      alert("Failed to create student");
    }
  };

  // Update
  const handleUpdate = async (p: StudentPayload) => {
    if (!editRow) return;
    try {
      await apiClient.patch(
        `${getApiBase("Student")}/student/${editRow._id}`,
        {
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          branch: p.branch,
          usn: p.usn,
          semester: p.semester,
          personalEmail: p.personalEmail,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setEditOpen(false);
      setEditRow(null);
      fetchAll();
    } catch (err) {
      console.error("Update student failed", err);
      alert("Failed to update student");
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this student?")) return;
    try {
      await apiClient.delete(`${getApiBase("Student")}/student/${id}`);
      fetchAll();
    } catch (err) {
      console.error("Delete student failed", err);
      alert("Failed to delete student");
    }
  };

  return (
    <div className="container 2xl:px-0 px-4">
      <AdminNavbar />
      <div className="mx-auto max-w-[1280px] py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-slate-600">
            Add, update, remove and search students.
          </p>
        </header>

        <StudentsToolbar
          q={q}
          onQChange={setQ}
          branch={branch}
          onBranchChange={setBranch}
          onAdd={() => setCreateOpen(true)}
        />

        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">USN</th>
                  <th className="px-3 py-2 font-medium">Branch</th>
                  <th className="px-3 py-2 font-medium">Sem</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-8" colSpan={6}>
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6" colSpan={6}>
                      <EmptyState
                        title="No students"
                        subtitle="Try adjusting filters or add a new student."
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <StudentRow
                      key={s._id}
                      s={s}
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
      <Modal
        open={createOpen}
        title="Add Student"
        onClose={() => setCreateOpen(false)}
      >
        <StudentForm
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* Edit */}
      <Modal
        open={editOpen}
        title="Edit Student"
        onClose={() => {
          setEditOpen(false);
          setEditRow(null);
        }}
      >
        <StudentForm
          mode="edit"
          initial={
            editRow
              ? {
                  ...editRow,
                  branch: editRow.branch as "" | "CSE" | "ISE" | "ECE",
                  semester: String(editRow.semester),
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
  );
}
