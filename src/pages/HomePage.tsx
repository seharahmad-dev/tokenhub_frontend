import LoginOption from "../components/LoginOption";

export default function HomePage() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-12">
      {/* Left Image Placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md aspect-square bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center text-slate-500">
          Image Placeholder
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 w-full max-w-md">
        <h1 className="text-3xl font-semibold">Welcome to TokenHUB</h1>
        <p className="mt-2 text-slate-600 text-sm">
          To keep connected with us, please login with your credentials.
        </p>

        {/* Vertical Login Buttons */}
        <div className="mt-6 flex flex-col gap-4">
          <LoginOption label="Student" color="bg-blue-600" />
          <LoginOption label="Faculty" color="bg-rose-600" />
          <LoginOption label="HOD" color="bg-emerald-600" />
          <LoginOption label="Admin" color="bg-amber-600" />
        </div>

        {/* Query Line */}
        <p className="mt-6 text-sm text-slate-600">
          If any queries or issues kindly contact:{" "}
          <a href="mailto:campus@bmsce.ac.in" className="text-blue-600 hover:underline">
            campus@bmsce.ac.in
          </a>
        </p>
      </div>
    </div>
  );
}