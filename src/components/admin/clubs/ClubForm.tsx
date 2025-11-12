// components/admin/clubs/ClubForm.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

export type ClubCreatePayload = {
  clubName: string;
  /** Backend expects exactly one member with role "Club Head" */
  members: Array<{ studentId: string; role: "Club Head"; joiningDate?: string }>;
};

type StudentMin = {
  _id: string;
  firstName: string;
  lastName: string;
  usn?: string;
  email?: string;
};

type Props = {
  onSubmit: (p: ClubCreatePayload) => void;
  onCancel: () => void;
  busy?: boolean;
};

// Prefer environment-configured endpoints (adjust in Vite)
const STUDENTS_API = import.meta.env.VITE_STUDENTS_API || "http://localhost:4002/api/student/all";
const TOKEN_API = import.meta.env.VITE_TOKEN_API || ""; // e.g. "http://localhost:4000" -> GET ${TOKEN_API}/token

export default function ClubForm({ onSubmit, onCancel, busy }: Props) {
  const [clubName, setClubName] = useState("");

  // auth token state
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("accessToken");
    } catch {
      return null;
    }
  });
  const [, setFetchingToken] = useState(false);

  // search UI state
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<StudentMin[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // selected head
  const [headStudentId, setHeadStudentId] = useState("");
  const [headStudent, setHeadStudent] = useState<StudentMin | null>(null);

  // debounce + keyboard navigation
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);

  // --- Obtain token if not already in sessionStorage ---
  useEffect(() => {
    let mounted = true;
    const tryFetchToken = async () => {
      if (accessToken) return; // already present

      if (!TOKEN_API) {
        // no token endpoint configured — proceed without token
        return;
      }

      setFetchingToken(true);
      try {
        // backend endpoint should return { access_token: "..." } or { token: "..." }
        const resp = await axios.get(`${TOKEN_API.replace(/\/$/, "")}/token`, { withCredentials: true });
        const token = resp?.data?.access_token ?? resp?.data?.token ?? null;
        if (mounted && token) {
          try {
            sessionStorage.setItem("accessToken", token);
          } catch (e) {
            console.warn("sessionStorage set failed", e);
          }
          setAccessToken(token);
        }
      } catch (err) {
        console.warn("Token fetch failed — continuing without token", err);
      } finally {
        if (mounted) setFetchingToken(false);
      }
    };

    tryFetchToken();
    return () => {
      mounted = false;
    };
  }, [accessToken]);

  // Helper to build headers for student requests
  const studentRequestHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  };

  // fetch all students once on mount (or when accessToken becomes available)
  useEffect(() => {
    let mounted = true;
    setLoadingStudents(true);

    axios
      .get(STUDENTS_API, {
        headers: studentRequestHeaders(),
        withCredentials: true, // if your student API requires cookies, otherwise can be removed
        timeout: 10000
      })
      .then((res) => {
        const body = res.data;
        const maybeArray =
          Array.isArray(body)
            ? body
            : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.payload)
            ? body.payload
            : Array.isArray(body.students)
            ? body.students
            : body.data?.students ?? [];

        if (mounted) {
          setStudents(maybeArray as StudentMin[]);
          setLoadingStudents(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("fetch students error", err?.response?.data ?? err.message ?? err);
          setLoadingStudents(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [accessToken]); // re-run when token changes

  // client-side filtering (name / usn / email)
  const filtered = useMemo(() => {
    const list = students || [];
    if (!query?.trim()) return list.slice(0, 10);
    const q = query.trim().toLowerCase();
    return list
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

  // debounce dropdown
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (document.activeElement === inputRef.current) setShowDropdown(true);
      setHighlightIndex(-1);
    }, 200);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (
        inputRef.current &&
        dropdownRef.current &&
        !inputRef.current.contains(target) &&
        !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === "ArrowDown") setShowDropdown(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        onSelectStudent(filtered[highlightIndex]);
      } else if (filtered.length === 1) {
        onSelectStudent(filtered[0]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
      inputRef.current?.blur();
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headStudentId) {
      alert("Please select a Club Head student");
      return;
    }
    const payload: ClubCreatePayload = {
      clubName,
      members: [{ studentId: headStudentId, role: "Club Head" }],
    };
    onSubmit(payload);
  };

  const onSelectStudent = (s: StudentMin) => {
    setHeadStudentId(s._id);
    setHeadStudent(s);
    setQuery(`${s.firstName} ${s.lastName} (${s.usn ?? s.email ?? s._id})`);
    setShowDropdown(false);
    setHighlightIndex(-1);
  };

  const clearSelected = () => {
    setHeadStudentId("");
    setHeadStudent(null);
    setQuery("");
    setShowDropdown(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={submit} className="space-y-3 relative">
      <div>
        <label className="text-xs text-slate-600">Club name</label>
        <input
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="e.g. Robotics Club"
          required
        />
      </div>

      {/* Search + select Club Head */}
      <div className="relative">
        <label className="text-xs text-slate-600">Club Head (search name / USN / email)</label>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHeadStudent(null);
            setHeadStudentId("");
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={onKeyDown}
          placeholder="Search student by name, USN or email"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="club-head-dropdown"
        />

        {headStudent && (
          <div className="mt-1 text-sm text-slate-700 flex items-center gap-2">
            <div>
              <div className="font-medium">{`${headStudent.firstName} ${headStudent.lastName}`}</div>
              <div className="text-xs text-slate-500">{headStudent.email ?? headStudent.usn}</div>
            </div>
            <button
              type="button"
              onClick={clearSelected}
              className="ml-auto text-xs text-red-600 underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* dropdown */}
        {showDropdown && (
          <div
            id="club-head-dropdown"
            ref={dropdownRef}
            role="listbox"
            aria-label="Student search results"
            className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border bg-white shadow-lg"
          >
            {loadingStudents ? (
              <div className="p-3 text-sm">Loading students...</div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">No matching students</div>
            ) : (
              filtered.map((s, idx) => {
                const isHighlighted = idx === highlightIndex;
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => onSelectStudent(s)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 focus:bg-slate-50 ${
                      isHighlighted ? "bg-slate-100" : ""
                    }`}
                    role="option"
                    aria-selected={isHighlighted}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{`${s.firstName} ${s.lastName}`}</div>
                        <div className="text-xs text-slate-500">{s.email ?? s.usn}</div>
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

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">
          Cancel
        </button>
        <button
          disabled={busy}
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Create
        </button>
      </div>
    </form>
  );
}
