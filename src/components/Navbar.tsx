import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = useMemo(
    () => [
      { label: "Know the Creators", href: "/creators" },
    ],
    []
  );

  const isCreatorsPage = location.pathname === "/creators";

  return (
    <header className="sticky top-0 z-50 border-b border-blue-200 bg-white/60 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* LOGO -> goes home */}
          <Link
            to="/"
            className="inline-flex items-center gap-3 font-bold text-lg"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">T</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-gray-900">Token</span>
              <span className="text-blue-600">HUB</span>
            </div>
          </Link>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center">
            {isCreatorsPage ? (
              // On /creators -> show the badge instead of CTA button
              <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Built with ❤️ by the team
              </span>
            ) : (
              // On other pages -> show fancy CTA
              links.map((l) => (
                <Link
                  key={l.label}
                  to={l.href}
                  className="group relative inline-flex items-center gap-2 px-5 py-2.5
                    text-sm font-semibold text-white rounded-full
                    bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700
                    shadow-md shadow-blue-200
                    hover:shadow-lg hover:shadow-blue-300
                    transition-all duration-300
                    overflow-hidden"
                >
                  <span className="relative z-10">{l.label}</span>
                  <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>
              ))
            )}
          </div>

          {/* Mobile Menu Toggle (hide on /creators since we don't need the CTA there) */}
          {!isCreatorsPage && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5 text-blue-700" /> : <Menu className="w-5 h-5 text-blue-700" />}
            </button>
          )}
        </div>

        {/* Mobile Nav (only when not on /creators) */}
        {!isCreatorsPage && isOpen && (
          <nav className="md:hidden pb-4 border-t border-blue-200">
            <div className="flex flex-col gap-3 pt-4">
              {links.map((l) => (
                <Link
                  key={l.label}
                  to={l.href}
                  onClick={() => setIsOpen(false)}
                  className="group relative inline-flex items-center justify-center px-4 py-2
                    text-sm font-semibold text-white rounded-full
                    bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700
                    shadow-md shadow-blue-200
                    hover:shadow-lg hover:shadow-blue-300
                    transition-all duration-300
                    overflow-hidden"
                >
                  <span className="relative z-10">{l.label}</span>
                  <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
