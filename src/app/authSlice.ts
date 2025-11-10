import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../app/store"; // adjust path if your store is located elsewhere

// Replace/extend this User type to match your Admin schema
export interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isVerified?: boolean;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
};

interface LoginParams {
  url: string;
  email: string;
  password: string;
}

export const loginThunk = createAsyncThunk<
  { user: User; token: string },
  LoginParams,
  { rejectValue: string }
>("auth/login", async ({ url, email, password }, thunkAPI) => {
  try {
    const resp = await axios.post(url, { email, password }, { withCredentials: true });
    const accessToken = resp?.data?.data?.[0]?.token;
    const user = resp?.data?.data?.[1]?.user;
    if (!accessToken) return thunkAPI.rejectWithValue("No access token received");
    return { user, token: accessToken };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.response?.data?.message || err.message || "Login failed");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.status = "succeeded";
      state.error = null;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message || "Login failed";
      });
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;

