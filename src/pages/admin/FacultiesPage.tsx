import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import AdminNavbar from "../../components/AdminNavbar";
import FacultyToolbar from "../../components/admin/faculties/FacultyToolbar";
import FacultyForm, { FacultyPayload } from "../../components/admin/faculties/FacultyForm";
import FacultyRow, { Faculty } from "../../components/admin/faculties/FacultyRow";

/** choose API base based on role (Admin page -> Faculty service for data ops) */
const getApiBase = (role: "Admin" | "Student" | "Faculty" | "HOD" | "Club") => {
  switch (role) {
    case "Admin":   return import.meta.env.VITE_ADMIN_API;
    case "Student": return import.meta.env.VITE_STUDENT_API;
    case "Faculty": return import.meta.env.VITE_FACULTY_API;
    case "HOD":     return import.meta.env.VITE_HOD_API;
    case "Club":    return import.meta.env.VITE_CLUB_API;
  }
};

export default function FacultiesPage() {
  const [items, setItems] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Faculty | null>(null);

  const API_BASE = getApiBase("Faculty");
  const accessToken = sessionStorage.getItem("accessToken");

  /** Helper to include token + cookies in each request */
  const axiosConfig = {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    withCredentials: true,
  };

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/faculty/all`, axiosConfig);
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
      await axios.post(`${API_BASE}/faculty/register`, p, axiosConfig);
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
      await axios.patch(
        `${API_BASE}/faculty/${editRow._id}`,
        {
          firstName: p.firstName,
          lastName: p.lastName,
          branch: p.branch,
          designation: p.designation,
        },
        axiosConfig
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
      await axios.delete(`${API_BASE}/faculty/${id}`, axiosConfig);
      fetchAll();
    } catch (err) {
      console.error("Delete faculty failed", err);
      alert("Failed to delete faculty");
    }
  };

  return (
    <div className="container 2xl:px-0 px-4">
      <AdminNavbar />
      <div className="mx-auto max-w-[1280px] py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Faculty</h1>
          <p className="text-slate-600">Add, update, remove and search faculty.</p>
        </header>

        <FacultyToolbar
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
                  <th className="px-3 py-2 font-medium">Branch</th>
                  <th className="px-3 py-2 font-medium">Designation</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-8" colSpan={5}>Loading…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6" colSpan={5}>
                      <EmptyState title="No faculty" subtitle="Try adjusting filters or add a new member." />
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
                  password: "", // not editable here
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
