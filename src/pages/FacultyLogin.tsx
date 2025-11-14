import Navbar from "../components/Navbar";
import RoleLoginForm from "../components/RoleLoginForm";

export default function FacultyLogin() {
  return (
    <div className="min-h-screen bg-white flex min-h-screen justify-center items-center">      
      <main className="container 2xl:px-0 px-4 py-10">
        <div className="max-w-[1280px] mx-auto gap-10">          
          <RoleLoginForm role="Faculty" />
        </div>
      </main>
    </div>
  );
}