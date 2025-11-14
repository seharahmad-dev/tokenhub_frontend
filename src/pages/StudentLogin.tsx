import Navbar from "../components/Navbar";
import RoleLoginForm from "../components/RoleLoginForm";

export default function StudentLogin() {
  return (
    <div className="min-h-screen bg-white">
      {/* <Navbar /> */}
      <main className="container 2xl:px-0 px-4 py-10 flex min-h-screen justify-center items-center">
        <div className="max-w-[1280px] mx-auto gap-10">        
          <RoleLoginForm role="Student" />
        </div>
      </main>
    </div>
  );
}