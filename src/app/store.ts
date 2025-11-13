// store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import studentReducer from "./studentSlice";
import facultyReducer from "./facultySlice"; // <-- add this

export const store = configureStore({
  reducer: {
    auth: authReducer,
    student: studentReducer,
    faculty: facultyReducer, // <-- added
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
