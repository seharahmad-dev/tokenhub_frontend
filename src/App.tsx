import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="container 2xl:px-0 px-4 py-10">
        <div className="max-w-[1280px] mx-auto">
          <HomePage />
        </div>
      </main>
    </div>
  );
}