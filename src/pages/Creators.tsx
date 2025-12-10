import Navbar from "../components/Navbar";   // <-- Added import
import { Github, Linkedin, Mail } from "lucide-react";

type Developer = {
  name: string;
  role: string;
  about: string;
  stack: string[];
  github?: string;
  linkedin?: string;
  email?: string;
};

const developers: Developer[] = [
  {
    name: "Gaurang Shirodkar",
    role: "Software Development Engineer at Fidelity Investments",
    about:
      "Owns the backend magic - from microservices to token logic. If something scales smoothly and never flinches under load, it’s probably Gaurang’s doing.",
    stack: ["Java", "Node.js", "MongoDB", "Microservices"],
    github: "https://github.com/gaurang1404",
    linkedin: "https://www.linkedin.com/in/gaurangsh/",
    email: "contactgaurangshirodkar@gmail.com",
  },
  {
    name: "Sehar Ahmad",
    role: "Site Reliability Engineer at Apple",
    about:
      "Obsessed with clean UX and rock-solid systems. Sehar makes sure TokenHUB not only looks good, but actually survives real users at 9:00 AM peak traffic.",
    stack: ["C++", "React", "TypeScript", "Design Systems"],
    github: "https://github.com/seharahmad-dev",
    linkedin: "https://www.linkedin.com/in/seharahmad/",
    email: "seharahmad.dev@gmail.com",
  },
  {
    name: "Aisha Fathima Mohammed",
    role: "Software Development Engineer at Natwest Group",
    about:
      "Turns data into decisions. From leaderboards to insights, Aisha is the reason TokenHUB feels smart instead of just pretty.",
    stack: ["Python", "ML", "PostgreSQL", "DevOps"],
    github: "https://github.com/Aisha-Fathima",
    linkedin: "https://www.linkedin.com/in/aisha-fathima-mohammed/",
    email: "aishafathimamohammed@gmail.com",
  },
];

function initials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Global Navbar */}
      <Navbar />   {/* <-- Now using the main Navbar */}

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Meet the Creators
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            The team behind <span className="text-blue-600">TokenHUB</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-600">
            Three creators, one mission: to make events, tokens, and student engagement
            as smooth and delightful as possible.
          </p>
        </section>

        {/* Developer Cards */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {developers.map((dev) => (
            <article
              key={dev.name}
              className="group relative rounded-2xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-semibold text-lg shadow-sm">
                    {initials(dev.name)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {dev.name}
                    </h2>
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      {dev.role}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed min-h-[56px]">{dev.about}</p>

                <div className="flex flex-wrap gap-1.5">
                  {dev.stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Actively building</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {dev.github && (
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {dev.linkedin && (
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {dev.email && (
                      <a
                        href={`mailto:${dev.email}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-blue-50/40 to-transparent" />
            </article>
          ))}
        </section>

        <section className="pt-4 pb-10 text-center text-xs text-gray-400">
          Built with TypeScript, React, TailwindCSS, and a lot of caffeine ☕
        </section>
      </main>
    </div>
  );
}
