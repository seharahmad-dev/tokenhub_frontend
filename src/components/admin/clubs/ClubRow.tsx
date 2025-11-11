import React, { useEffect, useMemo, useRef, useState } from "react";

export type ClubMember = {
  _id?: string;
  studentId: string;
  role: string;          // "Club Head" | "member" | etc.
  joiningDate?: string;
  name?: string;
  studentName?: string;
};

export type Club = {
  _id: string;
  clubName: string;
  members: ClubMember[];
};

type Props = {
  c: Club;
  onReplaceHead: (id: string, newHeadId: string) => void;
  onDelete: (id: string) => void;
};

type StudentMin = {
  _id: string;
  firstName: string;
  lastName: string;
  usn?: string;
  email?: string;
};

const STUDENTS_API = "http://localhost:4002/api/student/all"; // adjust to your actual student API

export default function ClubRow({ c, onReplaceHead, onDelete }: Props) {
  const head = c.members?.find(
    (m) => m.role === "Club Head" || m.role === "clubHead"
  );
  const headLabel = head?.name || head?.studentName || head?.studentId || "-";

  const [replaceOpen, setReplaceOpen] = useState(false);

  // search UI state
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<StudentMin[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentMin | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch students once when replace is opened
useEffect(() => {
  if (!replaceOpen) return;

  const token = sessionStorage.getItem("accessToken");
  setLoadingStudents(true);

  fetch(STUDENTS_API, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Failed to fetch students");
      const body = await res.json();
      const maybeArray =
        Array.isArray(body)
          ? body
          : body.data ?? body.payload ?? body.students ?? body.data?.students ?? [];
      setStudents(maybeArray as StudentMin[]);
    })
    .catch((err) => console.error("fetch students error", err))
    .finally(() => setLoadingStudents(false));
}, [replaceOpen]);


  // Client-side filtering (name, USN, email)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 10);
    return students
      .filter((s) => {
        const fullName = `${s.firstName ?? ""} ${s.lastName ?? ""}`.toLowerCase();
        return (
          fullName.includes(q) ||
          (s.usn ?? "").toLowerCase().includes(q) ||
          (s.email ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 10);
  }, [students, query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        inputRef.current &&
        dropdownRef.current &&
        !inputRef.current.contains(t) &&
        !dropdownRef.current.contains(t)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      onSelectStudent(filtered[highlightIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  const onSelectStudent = (s: StudentMin) => {
    // prevent selecting same as current head
    if (String(s._id) === String(head?.studentId)) {
      alert("This student is already the current Club Head.");
      return;
    }
    setSelectedStudent(s);
    setQuery(`${s.firstName} ${s.lastName} (${s.usn ?? s.email ?? s._id})`);
    setShowDropdown(false);
    setHighlightIndex(-1);
  };

  const clearSelected = () => {
    setSelectedStudent(null);
    setQuery("");
    setShowDropdown(true);
  };

  const handleSave = () => {
    if (!selectedStudent?._id) {
      alert("Please select a new Club Head.");
      return;
    }
    onReplaceHead(c._id, selectedStudent._id);
    setReplaceOpen(false);
    setSelectedStudent(null);
    setQuery("");
  };

  return (
    <>
      <tr className="border-t">
        <td className="px-3 py-2">{c.clubName}</td>
        <td className="px-3 py-2">{headLabel}</td>
        <td className="px-3 py-2">{c.members?.length ?? 0}</td>
        <td className="px-3 py-2 text-right">
          <div className="inline-flex gap-2">
            <button
              onClick={() => setReplaceOpen(true)}
              className="rounded-lg border px-3 py-1 text-xs"
            >
              Replace Head
            </button>
            <button
              onClick={() => onDelete(c._id)}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs text-white"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      {replaceOpen && (
        <tr className="bg-slate-50">
          <td colSpan={4} className="px-3 py-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center relative">
              <div className="relative w-full sm:w-96">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedStudent(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={onKeyDown}
                  placeholder="Search new head by name, USN, or email"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />

                {selectedStudent && (
                  <div className="mt-1 text-xs text-slate-600 flex justify-between">
                    <span>
                      Selected:{" "}
                      <strong>
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </strong>{" "}
                      ({selectedStudent.usn ?? selectedStudent.email})
                    </span>
                    <button
                      type="button"
                      onClick={clearSelected}
                      className="text-red-600 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* dropdown */}
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-[9999] mt-1 w-full max-h-56 overflow-auto rounded-md border bg-white shadow-lg"
                  >
                    {loadingStudents ? (
                      <div className="p-3 text-sm">Loading students...</div>
                    ) : filtered.length === 0 ? (
                      <div className="p-3 text-sm text-slate-500">
                        No matching students
                      </div>
                    ) : (
                      filtered.map((s, idx) => {
                        const isHighlighted = idx === highlightIndex;
                        const isCurrentHead =
                          String(s._id) === String(head?.studentId);
                        return (
                          <button
                            key={s._id}
                            type="button"
                            disabled={isCurrentHead}
                            onClick={() => onSelectStudent(s)}
                            onMouseEnter={() => setHighlightIndex(idx)}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${
                              isHighlighted ? "bg-slate-100" : ""
                            } ${
                              isCurrentHead ? "text-gray-400 cursor-not-allowed" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{`${s.firstName} ${s.lastName}`}</div>
                                <div className="text-xs text-slate-500">
                                  {s.email ?? s.usn}
                                </div>
                              </div>
                              <div className="text-xs text-slate-400">{s.usn}</div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setReplaceOpen(false);
                    setQuery("");
                    setSelectedStudent(null);
                  }}
                  className="rounded-lg border px-3 py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
