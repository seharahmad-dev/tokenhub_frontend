type StatTileProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  accent?: "red" | "default";
  animated?: boolean;
};

export default function StatTile({ title, value, subtitle, accent = "default", animated }: StatTileProps) {
  const anim = animated ? "animate-[pop_350ms_ease]" : "";
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${anim}`} style={{ minHeight: 72 }}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-semibold text-slate-900`}>{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

