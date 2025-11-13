import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import AdminNavbar from "../../components/AdminNavbar";
import FacultyToolbar from "../../components/admin/faculties/FacultyToolbar";
import FacultyForm, { FacultyPayload } from "../../components/admin/faculties/FacultyForm";
import FacultyRow, { Faculty } from "../../components/admin/faculties/FacultyRow";

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

export default function FacultiesPage() {
  const [items, setItems] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<Faculty | null>(null);

  // Mentors UI state
  const [mentorsOpen, setMentorsOpen] = useState(false); // top-level mentors modal
  const [manageFacultyId, setManageFacultyId] = useState<string | null>(null); // currently managing faculty
  const [manageOpen, setManageOpen] = useState(false); // per-faculty manage modal
  const [currentMentees, setCurrentMentees] = useState<any[]>([]); // student objects
  const [availableStudents, setAvailableStudents] = useState<any[]>([]); // student objects with no mentor
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [managingLoading, setManagingLoading] = useState(false);

  const API_BASE = getApiBase("Faculty")!;
  const STUDENT_API = getApiBase("Student")!;
  const accessToken = sessionStorage.getItem("accessToken");

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

  //
  // ----- Mentors / Manage Mentees -----
  //

  // Open the per-faculty Manage modal. Load students and split into current mentees + available students.
  const openManageForFaculty = async (facultyId: string) => {
    setManageFacultyId(facultyId);
    setSelectedToAdd(new Set());
    setManagingLoading(true);
    setManageOpen(true);

    try {
      // Get the faculty (to read myStudents) - try to find in items first
      const faculty = items.find((it) => it._id === facultyId) ?? null;

      let myStudentIds: string[] = [];
      if (faculty && Array.isArray((faculty as any).myStudents)) {
        myStudentIds = (faculty as any).myStudents;
      } else {
        // fallback: fetch single faculty
        const fRes = await axios.get(`${API_BASE}/faculty/${facultyId}`, axiosConfig);
        myStudentIds = fRes?.data?.data?.myStudents ?? fRes?.data?.myStudents ?? [];
      }

      // Fetch all students from student service then split
      const sRes = await axios.get(`${STUDENT_API}/student/all`, axiosConfig);
      const allStudents: any[] = sRes?.data?.data ?? sRes?.data ?? [];

      const current = allStudents.filter((s) => myStudentIds.includes(String(s._id)));
      // available = students who do not currently have a mentor AND are not already in myStudents
      const available = allStudents.filter((s) => {
        const noMentor = !s.mentorId || s.mentorId === "" || s.mentorId === null;
        const notAlready = !myStudentIds.includes(String(s._id));
        return noMentor && notAlready;
      });

      setCurrentMentees(current);
      setAvailableStudents(available);
    } catch (err) {
      console.error("Failed to load mentees / students", err);
      setCurrentMentees([]);
      setAvailableStudents([]);
    } finally {
      setManagingLoading(false);
    }
  };

  const closeManage = () => {
    setManageOpen(false);
    setManageFacultyId(null);
    setCurrentMentees([]);
    setAvailableStudents([]);
    setSelectedToAdd(new Set());
  };

  const toggleSelectToAdd = (studentId: string) => {
    setSelectedToAdd((prev) => {
      const copy = new Set(prev);
      if (copy.has(studentId)) copy.delete(studentId);
      else copy.add(studentId);
      return copy;
    });
  };

  // Add selected students: call faculty add endpoint + each student's add-mentor endpoint
  const handleAddSelected = async () => {
    if (!manageFacultyId) return;
    if (selectedToAdd.size === 0) return alert("Select at least one student to add");

    const studentIds = Array.from(selectedToAdd);
    setManagingLoading(true);
    try {
      // 1) Update the faculty (batch add)
      await axios.post(
        `${API_BASE}/faculty/${manageFacultyId}/add-students`,
        { studentIds },
        axiosConfig
      );

      // Refresh the main faculty list and the modal lists
      await fetchAll();
      await openManageForFaculty(manageFacultyId);
      setSelectedToAdd(new Set());
      alert("Added selected students to mentor successfully");
    } catch (err) {
      console.error("Failed to add students to mentor", err);
      alert("Failed to add students — check console for details");
    } finally {
      setManagingLoading(false);
    }
  };

  // ---- NEW: remove a mentee ----
  const handleRemoveMentee = async (studentId: string) => {
    if (!manageFacultyId) return;
    if (!confirm("Remove this student from this mentor?")) return;

    setManagingLoading(true);
    try {
      // 1) Remove student id from faculty.myStudents
      await axios.post(
        `${API_BASE}/faculty/${manageFacultyId}/remove-students`,
        { studentIds: [studentId] },
        axiosConfig
      );

      // Refresh lists
      await fetchAll();
      await openManageForFaculty(manageFacultyId);
      alert("Student removed from mentor");
    } catch (err) {
      console.error("Failed to remove mentee", err);
      alert("Failed to remove mentee — check console for details");
    } finally {
      setManagingLoading(false);
    }
  };

  return (
    <div className="container 2xl:px-0 px-4">
      <AdminNavbar />
      <div className="mx-auto max-w-[1280px] py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Faculty</h1>
            <p className="text-slate-600">Add, update, remove and search faculty.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMentorsOpen(true)}
              className="rounded-md bg-white border px-3 py-2 text-sm hover:bg-slate-50"
            >
              Mentors
            </button>
          </div>
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
                    <td className="px-3 py-8" colSpan={5}>
                      Loading…
                    </td>
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

      {/* Mentors - top-level modal listing faculties (simple list) */}
      <Modal open={mentorsOpen} title="Mentors" onClose={() => setMentorsOpen(false)}>
        <div className="space-y-3">
          {loading ? (
            <div>Loading faculties…</div>
          ) : items.length === 0 ? (
            <EmptyState title="No faculties" subtitle="Add a faculty to get started." />
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {items.map((f) => (
                <div
                  key={f._id}
                  className="flex items-center justify-between rounded-md border p-2 bg-white shadow-sm"
                >
                  <div>
                    <div className="font-medium">{f.firstName} {f.lastName}</div>
                    <div className="text-xs text-slate-500">{f.branch} • {f.designation}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openManageForFaculty(f._id)}
                      className="rounded-md bg-blue-600 px-3 py-1 text-white text-sm"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Manage modal for a single faculty */}
      <Modal
        open={manageOpen}
        title={(() => {
          const fac = items.find((x) => x._id === manageFacultyId);
          return fac ? `Manage Mentees — ${fac.firstName} ${fac.lastName}` : "Manage Mentees";
        })()}
        onClose={closeManage}
      >
        <div className="space-y-4">
          {managingLoading ? (
            <div>Loading…</div>
          ) : (
            <>
              <section>
                <h3 className="font-semibold">Current Mentees</h3>
                {currentMentees.length === 0 ? (
                  <div className="text-sm text-slate-500">No mentees yet.</div>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {currentMentees.map((s) => (
                      <li key={s._id} className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <div className="font-medium">{s.firstName} {s.lastName}</div>
                          <div className="text-xs text-slate-500">{s.usn} • {s.branch}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemoveMentee(s._id)}
                            className="rounded-md bg-rose-600 px-3 py-1 text-white text-sm"
                            disabled={managingLoading}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="font-semibold">Available Students (no mentor)</h3>
                {availableStudents.length === 0 ? (
                  <div className="text-sm text-slate-500">No available students to add.</div>
                ) : (
                  <div className="mt-2 space-y-1 max-h-44 overflow-auto">
                    {availableStudents.map((s) => {
                      const checked = selectedToAdd.has(s._id);
                      return (
                        <label
                          key={s._id}
                          className="flex items-center justify-between rounded-md border p-2 cursor-pointer"
                        >
                          <div>
                            <div className="font-medium">{s.firstName} {s.lastName}</div>
                            <div className="text-xs text-slate-500">{s.usn} • {s.branch}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectToAdd(s._id)}
                            className="h-4 w-4"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={closeManage}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={handleAddSelected}
                  disabled={selectedToAdd.size === 0 || managingLoading}
                  className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60"
                >
                  Add selected
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
