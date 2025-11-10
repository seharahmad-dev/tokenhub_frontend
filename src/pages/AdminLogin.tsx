import Navbar from "../components/Navbar";
import AuthIllustration from "../components/AuthIllustration";
import RoleLoginForm from "../components/RoleLoginForm";

export default function AdminLogin() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container 2xl:px-0 px-4 py-10">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-10">
          <AuthIllustration />
          <RoleLoginForm role="Admin" />
        </div>
      </main>
    </div>
  );
}