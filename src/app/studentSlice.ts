// src/features/studentSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store"; // adjust path if needed
import { loginThunk } from "./authSlice"; // assumes authSlice is in same folder

// --- Types --------------------------------------------------------------
export interface EventRow {
  _id: string;
  title?: string;
  schedule?: string;
  venue?: string;
  [key: string]: any;
}

export interface Student {
  _id?: string;
  firstName?: string;
  lastName?: string;
  usn?: string;
  branch?: string;
  semester?: string | number;
  email?: string;
  personalEmail?: string;
  clubs?: string[] | any[];
  clubId?: string | null;
  isVerified?: boolean;
  role?: string;
  [key: string]: any;
}

export interface StudentState {
  student: Student | null;
  suggestedEvents: EventRow[]; // persisted RAG suggestions for this student
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// --- Helpers: sessionStorage keys & safe JSON parse ---------------------
const SUGGESTED_KEY = (studentId: string | undefined) => `studentSuggestedEvents:${studentId ?? "anon"}`;

const safeParse = <T = any>(raw: string | null, fallback: T) => {
  try {
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed as T) ?? fallback;
  } catch {
    return fallback;
  }
};

// Load student from sessionStorage (defensive)
const loadStudentFromSession = (): Student | null => {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    // Best-effort: accept only Student role (if present)
    const role = (parsed.role ?? parsed?.role ?? "") as string;
    if (role && typeof role === "string" && role.toString().toLowerCase() !== "student") {
      return null;
    }

    const student: Student = { ...parsed };

    // normalise clubId
    if (!student.clubId && (parsed as any).clubId) student.clubId = (parsed as any).clubId;
    else if (!student.clubId && (parsed as any).club && (parsed as any).club._id) student.clubId = (parsed as any).club._id;

    // normalise id field
    if (!student._id && (student as any).id) {
      student._id = (student as any).id;
      delete (student as any).id;
    }

    if (!student.role) student.role = "Student";

    return student;
  } catch {
    return null;
  }
};

// Load persisted suggested events for a student id (if any)
const loadSuggestedFromSession = (studentId?: string): EventRow[] => {
  if (!studentId) return [];
  const raw = sessionStorage.getItem(SUGGESTED_KEY(studentId));
  return safeParse<EventRow[]>(raw, []);
};

// Persist suggested events for a student id
const persistSuggestedToSession = (studentId: string | undefined, events: EventRow[]) => {
  if (!studentId) return;
  try {
    sessionStorage.setItem(SUGGESTED_KEY(studentId), JSON.stringify(events));
  } catch {
    // ignore quota/serialization errors
  }
};

// Clear persisted suggested events for a student id
const clearSuggestedFromSession = (studentId?: string) => {
  if (!studentId) return;
  try {
    sessionStorage.removeItem(SUGGESTED_KEY(studentId));
  } catch {
    // ignore
  }
};

// --- Initial state -----------------------------------------------------
const initialStudent = loadStudentFromSession();

const initialState: StudentState = {
  student: initialStudent,
  suggestedEvents: initialStudent ? loadSuggestedFromSession(initialStudent._id) : [],
  status: "idle",
  error: null,
};

// --- Slice -------------------------------------------------------------
const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    setStudent: (state, action: PayloadAction<Student>) => {
      const user = action.payload;
      // normalize id fields
      const normalized: Student = { ...user };
      if (!normalized._id && (normalized as any).id) {
        normalized._id = (normalized as any).id;
        delete (normalized as any).id;
      }
      if (!normalized.role) normalized.role = "Student";

      state.student = normalized;
      state.status = "succeeded";
      state.error = null;

      // hydrate suggestedEvents for this student from sessionStorage
      state.suggestedEvents = loadSuggestedFromSession(normalized._id);
    },

    clearStudent: (state) => {
      // remove persisted suggested events for current user (optional)
      try {
        const sid = state.student?._id;
        if (sid) clearSuggestedFromSession(sid);
      } catch {
        // ignore
      }
      state.student = null;
      state.suggestedEvents = [];
      state.status = "idle";
      state.error = null;
    },

    setStudentError: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
    },

    setStudentLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },

    // --- Suggested events (RAG) reducers --------------------------------
    setSuggestedEvents: (state, action: PayloadAction<EventRow[]>) => {
      state.suggestedEvents = action.payload ?? [];
      // persist to sessionStorage keyed by student id so it survives logout
      persistSuggestedToSession(state.student?._id, state.suggestedEvents);
    },

    clearSuggestedEvents: (state) => {
      // clear in-memory and persisted storage
      clearSuggestedFromSession(state.student?._id);
      state.suggestedEvents = [];
    },
  },
  extraReducers: (builder) => {
    // When loginThunk resolves, use the payload.user for student slice
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      const user = (action.payload as any)?.user;
      if (!user) return;

      // only set if it's a student
      const role = user.role ?? (user.role && user.role.toString && user.role.toString()) ?? "";
      if (role && role.toString().toLowerCase() !== "student") {
        return;
      }

      const normalized: Student = { ...user };
      if (!normalized._id && (normalized as any).id) {
        normalized._id = (normalized as any).id;
        delete (normalized as any).id;
      }
      if (!normalized.role) normalized.role = "Student";

      state.student = normalized;
      state.status = "succeeded";
      state.error = null;

      // hydrate suggested events for this student if present
      state.suggestedEvents = loadSuggestedFromSession(normalized._id);
    });

    builder.addCase(loginThunk.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });

    builder.addCase(loginThunk.rejected, (state, action) => {
      state.status = "failed";
      state.error = (action.payload as string) || action.error?.message || "Login failed";
    });
  },
});

// --- Exports ------------------------------------------------------------
export const {
  setStudent,
  clearStudent,
  setStudentError,
  setStudentLoading,
  setSuggestedEvents,
  clearSuggestedEvents,
} = studentSlice.actions;

export const selectStudentState = (state: RootState) => state.student;
export const selectStudent = (state: RootState) => state.student.student;
export const selectSuggestedEvents = (state: RootState) => state.student.suggestedEvents;

export default studentSlice.reducer;
