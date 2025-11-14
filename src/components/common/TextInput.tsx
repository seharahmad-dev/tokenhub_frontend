// src/components/common/TextInput.tsx
import { InputHTMLAttributes } from "react";

export default function TextInput({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input {...props} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-300" />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}
