import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api"; // axios instance with baseURL + auth
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import StudentsToolbar from "../../components/admin/students/StudentsToolbar";
import StudentForm, { StudentPayload } from "../../components/admin/students/StudentForm";
import StudentRow, { Student } from "../../components/admin/students/StudentRow";

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
      const { data } = await api.get("/student/all");
      setItems(data?.data ?? data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase();
    return items.filter(s => {
      const hit = [s.firstName, s.lastName, s.email, s.usn].some(v => norm(String(v)).includes(norm(q)));
      const okBranch = branch ? s.branch === branch : true;
      return hit && okBranch;
    });
  }, [items, q, branch]);

  // Create
  const handleCreate = async (p: StudentPayload) => {
    await api.post("/student/register", p); // Admin-protected
    setCreateOpen(false);
    fetchAll();
  };

  // Update
  const handleUpdate = async (p: StudentPayload) => {
    if (!editRow) return;
    await api.patch(`/student/${editRow._id}`, {
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      branch: p.branch,
      usn: p.usn,
      semester: p.semester,
      personalEmail: p.personalEmail
    });
    setEditOpen(false);
    setEditRow(null);
    fetchAll();
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this student?")) return;
    await api.delete(`/student/${id}`);
    fetchAll();
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
                  <tr><td className="px-3 py-8" colSpan={6}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-3 py-6" colSpan={6}><EmptyState title="No students" subtitle="Try adjusting filters or add a new student." /></td></tr>
                ) : (
                  filtered.map(s => (
                    <StudentRow
                      key={s._id}
                      s={s}
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
      <Modal open={createOpen} title="Add Student" onClose={() => setCreateOpen(false)}>
        <StudentForm mode="create" onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      {/* Edit */}
      <Modal open={editOpen} title="Edit Student" onClose={() => { setEditOpen(false); setEditRow(null); }}>
        <StudentForm
          mode="edit"
          initial={editRow ?? undefined}
          onSubmit={handleUpdate}
          onCancel={() => { setEditOpen(false); setEditRow(null); }}
        />
      </Modal>
    </div>
  );
}