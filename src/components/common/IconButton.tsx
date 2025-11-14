// src/components/common/IconButton.tsx
export default function IconButton({ title, onClick, children, tone = "default" }: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: "default" | "danger" | "primary";
}) {
  const base = "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition";
  const toneMap = {
    default: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
    primary: "border border-red-600 bg-red-600 text-white hover:bg-red-700",
  } as const;
  return (
    <button title={title} onClick={onClick} className={`${base} ${toneMap[tone]} rounded-xl`}>
      {children}
    </button>
  );
}


