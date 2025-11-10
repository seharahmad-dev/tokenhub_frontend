import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import StudentLogin from "./pages/StudentLogin";
import FacultyLogin from "./pages/FacultyLogin";
import HodLogin from "./pages/HodLogin";
import AdminLogin from "./pages/AdminLogin";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import VerifyOtpPage from "./pages/auth/VerifyOtp";
import ResetPasswordPage from "./pages/auth/ResetPassword";
import AdminDashboard from "./pages/admin/Dashboard";
import StudentsPage from "./pages/admin/StudentsPage";
import FacultiesPage from "./pages/admin/FacultiesPage";
import HodPage from "./pages/admin/HodPage";
import ClubsPage from "./pages/admin/ClubsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/login/faculty" element={<FacultyLogin />} />
        <Route path="/login/hod" element={<HodLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/auth/:role/forgot" element={<ForgotPasswordPage />} />
        <Route path="/auth/:role/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/auth/:role/reset" element={<ResetPasswordPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<StudentsPage />} />
        <Route path="/admin/faculties" element={<FacultiesPage />} />
        <Route path="/admin/hod" element={<HodPage />} />
        <Route path="/admin/clubs" element={<ClubsPage />} />
      </Routes>
    </BrowserRouter>
  );
}