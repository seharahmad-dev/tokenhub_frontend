import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store"; // adjust path if needed
import { loginThunk } from "./authSlice"; // adjust path to your authSlice

// Faculty shape — extend if you store more fields
export interface Faculty {
  _id?: string;
  firstName?: string;
  lastName?: string;
  branch?: string;
  collegeEmail?: string;
  designation?: string;
  myStudents?: string[] | any[];
  isHod?: boolean | string | null; // backend seems to use string; accept both
  eventsApprovals?: string[] | any[];
  events?: { eventId?: string }[] | string[]; // mirror backend events shape
  role?: string;
  [key: string]: any;
}

export interface FacultyState {
  faculty: Faculty | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// Defensive loader from sessionStorage (same key you used for student)
const loadFacultyFromSession = (): Faculty | null => {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    // ensure it's a faculty user
    const role = parsed.role ?? parsed?.role?.toString?.();
    if (!role || role.toString().toLowerCase() !== "faculty") {
      return null;
    }

    const faculty: Faculty = { ...parsed };

    // normalize id fields
    if (!faculty._id && (parsed as any).id) {
      faculty._id = (parsed as any).id;
      delete (faculty as any).id;
    }

    // events might be stored as array of ids or as nested objects
    if (!faculty.events && (parsed as any).events) {
      faculty.events = (parsed as any).events;
    }

    // normalize isHod which backend sometimes returns as string
    if (faculty.isHod === "true") faculty.isHod = true;
    if (faculty.isHod === "false") faculty.isHod = false;

    if (!faculty.role) faculty.role = "Faculty";

    return faculty;
  } catch (err) {
    return null;
  }
};

const initialState: FacultyState = {
  faculty: loadFacultyFromSession(),
  status: "idle",
  error: null,
};

const facultySlice = createSlice({
  name: "faculty",
  initialState,
  reducers: {
    setFaculty: (state, action: PayloadAction<Faculty>) => {
      state.faculty = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearFaculty: (state) => {
      state.faculty = null;
      state.status = "idle";
      state.error = null;
    },
    setFacultyError: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
    },
    setFacultyLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // react to loginThunk similarly to student slice:
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      const user = (action.payload as any)?.user;
      if (!user) return;

      const role = user.role ?? user?.role?.toString?.();
      if (role && role.toString().toLowerCase() === "faculty") {
        const normalized: Faculty = { ...user };

        // normalize id
        if (!normalized._id && (normalized as any).id) {
          normalized._id = (normalized as any).id;
          delete (normalized as any).id;
        }

        // carry events or event ids if nested
        if (!normalized.events && (user as any).events) {
          normalized.events = (user as any).events;
        }

        // normalize isHod string->boolean if needed
        if (normalized.isHod === "true") normalized.isHod = true;
        if (normalized.isHod === "false") normalized.isHod = false;

        if (!normalized.role) normalized.role = "Faculty";

        state.faculty = normalized;
        state.status = "succeeded";
        state.error = null;
      } else {
        // not a faculty login — do nothing
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

export const { setFaculty, clearFaculty, setFacultyError, setFacultyLoading } = facultySlice.actions;

export const selectFacultyState = (state: RootState) => state.faculty;
export const selectFaculty = (state: RootState) => state.faculty.faculty;

export default facultySlice.reducer;
