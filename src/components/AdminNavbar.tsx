import { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AvatarMenu({
  name,
  onEdit,
  onLogout,
}: {
  name?: string;
  onEdit: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 select-none"
        aria-label="Account menu"
      >
        {/* simple avatar initials */}
        <span className="text-xs font-semibold text-slate-700">
          {name?.[0]?.toUpperCase() ?? "A"}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border bg-white shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit Profile
          </button>
          <div className="my-1 h-px bg-slate-100" />
          <button
            className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminNavbar() {
  const navigate = useNavigate();

  const links = useMemo(
    () => [
      // removed "Dashboard" on purpose; brand click goes to /admin
      { label: "Students", href: "/admin/students" },
      { label: "Faculty", href: "/admin/faculties" },
      { label: "HOD", href: "/admin/hod" },
      { label: "Clubs", href: "/admin/clubs" },
    ],
    []
  );

  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  async function handleLogout() {
    try {
      const base = import.meta.env.VITE_ADMIN_API ?? "";
      await axios.post(`${base}/admin/logout`, {}, { withCredentials: true });
    } catch {
      // ignore network errors on logout
    } finally {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");
      navigate("/login/admin");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16">
          <a href="/admin" className="inline-flex items-center gap-2 font-semibold">
            {/* brand acts as dashboard trigger */}
            <span className="text-slate-900">
              Token<span className="text-blue-600">HUB</span>
            </span>
            <span className="ml-2 rounded-md border px-2 py-0.5 text-xs text-slate-600">
              Admin
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-slate-900 text-slate-600">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <AvatarMenu
              name={user?.firstName || "A"}
              onEdit={() => navigate("/admin/profile")}
              onLogout={handleLogout}
            />
            <button className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm">
              Menu
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
