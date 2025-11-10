import { PropsWithChildren } from "react";
import Navbar from "./Navbar";

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export default function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-white">
    <Navbar />
      <main className="container 2xl:px-0 px-4">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-10 items-center py-12">
          {/* Left image placeholder */}
          <div className="hidden md:block">
            <div className="aspect-[16/11] w-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
              <span className="text-slate-400">Image Placeholder</span>
            </div>
          </div>

          {/* Right form */}
          <div className="w-full">
            <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>

            <p className="mt-6 text-sm text-slate-600">
              If any queries or issues kindly contact{" "}
              <a
                className="text-pink-600 underline underline-offset-2"
                href="mailto:campus@bmsce.ac.in"
              >
                campus@bmsce.ac.in
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}