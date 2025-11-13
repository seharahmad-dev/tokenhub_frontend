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
import EditProfilePage from "./pages/admin/EditProfilePage";
import StudentDashboard from "./pages/student/Dashboard";
import Explore from "./pages/student/Explore";
import Events from "./pages/student/Events";
import Clubs from "./pages/student/Clubs";
import Discuss from "./pages/student/Discuss";
import DiscussDetail from "./pages/student/DiscussDetail";
import DiscussCreate from "./pages/student/DiscussCreate";
import LeaderboardPage from "./pages/student/Leaderboard";
import ProfilePage from "./pages/student/ProfilePage";
import ManageClubPage from "./components/student/ManageClubPage";
import RegisterTeam from "./pages/student/RegisterTeam";
import EventRegisterPage from "./pages/student/EventRegisterPage";
import EventPaymentPage from "./pages/student/EventPaymentPage";
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyEventsPage from "./pages/faculty/Events";

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
        <Route path="/admin/profile" element={<EditProfilePage />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/explore" element={<Explore />} />
        <Route path="/student/events" element={<Events />} />
        <Route path="/student/clubs" element={<Clubs />} />
        <Route path="/student/discuss" element={<Discuss />} />
        <Route path="/student/discuss/create" element={<DiscussCreate />} />
        <Route path="/student/discuss/:id" element={<DiscussDetail />} />
        <Route path="/student/leaderboard" element={<LeaderboardPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/manage-club" element={<ManageClubPage />} />
        <Route path="/student/register-team" element={<RegisterTeam />} />
        <Route path="/student/events/:id/register" element={<EventRegisterPage />} />
        <Route path="/student/events/:id/payment" element={<EventPaymentPage />} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/events" element={<FacultyEventsPage />} />
      </Routes>
    </BrowserRouter>
  );
}