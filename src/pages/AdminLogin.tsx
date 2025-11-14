import Navbar from "../components/Navbar";
import RoleLoginForm from "../components/RoleLoginForm";

export default function AdminLogin() {
  return (
    <div className="min-h-screen bg-white flex min-h-screen justify-center items-center">      
      <main className="container 2xl:px-0 py-10">
        <div className="max-w-[1280px] mx-auto">          
          <RoleLoginForm role="Admin" />
        </div>
      </main>
    </div>
  );
}