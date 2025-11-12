import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../app/store"; // adjust path if needed
import { loginThunk } from "./authSlice"; // assumes authSlice is in same folder

// Student shape — extend if you store more fields
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
  clubId?: string | null; // <-- ADDED: clubId
  isVerified?: boolean;
  role?: string;
  [key: string]: any;
}

export interface StudentState {
  student: Student | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// Load student from sessionStorage (defensive)
const loadStudentFromSession = (): Student | null => {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    // Only hydrate if it's a Student (best-effort)
    const role = parsed.role ?? parsed?.role?.toString?.();
    if (role && role.toString().toLowerCase() !== "student") {
      return null;
    }

    // normalize id fields
    const student: Student = { ...parsed };

    // keep clubId if present (some backends embed student.clubId or student.club?._id)
    if (!student.clubId && (parsed as any).clubId) {
      student.clubId = (parsed as any).clubId;
    } else if (!student.clubId && (parsed as any).club && (parsed as any).club._id) {
      student.clubId = (parsed as any).club._id;
    }

    if (!student._id && (student as any).id) {
      student._id = (student as any).id;
      delete (student as any).id;
    }

    // ensure role
    if (!student.role) student.role = "Student";

    return student;
  } catch (err) {
    // swallow parse errors and return null
    return null;
  }
};

const initialState: StudentState = {
  student: loadStudentFromSession(),
  status: "idle",
  error: null,
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    setStudent: (state, action: PayloadAction<Student>) => {
      state.student = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearStudent: (state) => {
      state.student = null;
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
  },
  extraReducers: (builder) => {
    // When loginThunk (from authSlice) resolves, its payload shape is:
    // { user: User, token: string } — we use the user part for student slice.
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      const user = (action.payload as any)?.user;
      if (user && (user.role === "Student" || (user.role && user.role.toString().toLowerCase() === "student"))) {
        // normalize id if necessary
        const normalized: Student = { ...user };

        // carry clubId if present in nested shapes
        if (!normalized.clubId && (user as any).clubId) normalized.clubId = (user as any).clubId;
        if (!normalized.clubId && (user as any).club && (user as any).club._id) normalized.clubId = (user as any).club._id;

        if (!normalized._id && (normalized as any).id) {
          normalized._id = (normalized as any).id;
          delete (normalized as any).id;
        }
        if (!normalized.role) normalized.role = "Student";

        state.student = normalized;
        state.status = "succeeded";
        state.error = null;
      } else {
        // not a student login — keep state as is
      }
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

export const { setStudent, clearStudent, setStudentError, setStudentLoading } = studentSlice.actions;

export const selectStudentState = (state: RootState) => state.student;
export const selectStudent = (state: RootState) => state.student.student;

export default studentSlice.reducer;
