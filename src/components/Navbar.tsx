import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const links = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
    ],
    []
  );

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="inline-flex items-center gap-3 font-bold text-lg">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">T</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-gray-900">Token</span><span className="text-blue-600">HUB</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-200">
            <div className="flex flex-col gap-3 pt-4">
              {links.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
