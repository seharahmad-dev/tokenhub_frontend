import Navbar from "../components/Navbar";
import LoginButton from "../components/LoginButton";
import AuthIllustration from "../components/AuthIllustration";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="container 2xl:px-0 px-4 py-10">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-10">
          {/* Left: Illustration */}
          <AuthIllustration />

          {/* Right: Vertical buttons */}
          <section className="flex flex-col">
            <header className="mb-6">
              <h1 className="text-2xl md:text-3xl font-semibold">Welcome to TokenHUB</h1>
              <p className="mt-2 text-slate-600">Choose your portal to sign in.</p>
            </header>

            <div className="space-y-4">
              <LoginButton label="Student" href="/login/student" color="bg-blue-600" />
              <LoginButton label="Faculty" href="/login/faculty" color="bg-rose-600" />
              <LoginButton label="HOD" href="/login/hod" color="bg-emerald-600" />
              <LoginButton label="Admin" href="/login/admin" color="bg-amber-600" />
            </div>

            <p className="mt-8 text-sm text-slate-600">
              If any queries or issues kindly contact{" "}
              <a className="text-pink-600 hover:underline" href="mailto:campus@bmsce.ac.in">
                campus@bmsce.ac.in
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
