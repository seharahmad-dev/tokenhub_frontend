type StatTileProps = { title: string; value: number | string; subtitle?: string };

export default function StatTile({ title, value, subtitle }: StatTileProps) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}