export default function IconButton({
  title,
  onClick,
  children,
  tone = "default"
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: "default" | "danger" | "primary";
}) {
  const base = "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm";
  const toneMap = {
    default: "border-slate-300 hover:bg-slate-50",
    danger: "border-rose-300 text-rose-700 hover:bg-rose-50",
    primary: "border-blue-600 text-white bg-blue-600 hover:bg-blue-700"
  } as const;
  return (
    <button title={title} onClick={onClick} className={`${base} ${toneMap[tone]}`}>
      {children}
    </button>
  );
}