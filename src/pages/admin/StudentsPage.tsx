import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import StudentsToolbar from "../../components/admin/students/StudentsToolbar";
import StudentForm, { StudentPayload } from "../../components/admin/students/StudentForm";
import StudentRow, { Student } from "../../components/admin/students/StudentRow";

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
      const res = await axios.get(`${getApiBase("Student")}/student/all`, {
        withCredentials: true,
      });
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
      await axios.post(`${getApiBase("Student")}/student/register`, p, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true, // keep cookie auth
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
      await axios.patch(
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
          withCredentials: true,
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
      await axios.delete(`${getApiBase("Student")}/student/${id}`, {
        withCredentials: true,
      });
      fetchAll();
    } catch (err) {
      console.error("Delete student failed", err);
      alert("Failed to delete student");
    }
  };

  return (
    <div className="container 2xl:px-0 px-4">
      <div className="mx-auto max-w-[1280px] py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-slate-600">Add, update, remove and search students.</p>
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
                      <EmptyState title="No students" subtitle="Try adjusting filters or add a new student." />
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
      <Modal open={createOpen} title="Add Student" onClose={() => setCreateOpen(false)}>
        <StudentForm mode="create" onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
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
          initial={editRow ? { ...editRow, branch: (editRow.branch as "" | "CSE" | "ISE" | "ECE") } : undefined}
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
