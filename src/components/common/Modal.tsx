import { ReactNode } from "react";

export default function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100 overflow-hidden animate-[fadeIn_0.2s_ease]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-white">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
