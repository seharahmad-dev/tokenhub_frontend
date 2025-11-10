import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import StudentLogin from "./pages/StudentLogin";
import FacultyLogin from "./pages/FacultyLogin";
import HodLogin from "./pages/HodLogin";
import AdminLogin from "./pages/AdminLogin";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import VerifyOtpPage from "./pages/auth/VerifyOtp";
import ResetPasswordPage from "./pages/auth/ResetPassword";

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
      </Routes>
    </BrowserRouter>
  );
}