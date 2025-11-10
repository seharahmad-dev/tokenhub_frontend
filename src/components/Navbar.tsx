import { useMemo } from "react";

export default function Navbar() {
  const links = useMemo(
    () => [
      { label: "Home", href: "#" },
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
    ],
    []
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16">
          <a href="#" className="inline-flex items-center gap-2 font-semibold">
            <span className="text-slate-900">Token<span className="text-blue-600">HUB</span></span>
            
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {links.map(l => (
              <a key={l.label} href={l.href} className="hover:text-slate-900 text-slate-600">
                {l.label}
              </a>
            ))}
          </nav>
          <button className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm">
            Menu
          </button>
        </div>
      </div>
    </header>
  );
}