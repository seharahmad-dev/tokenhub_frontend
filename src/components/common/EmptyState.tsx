export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border bg-white p-10 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {subtitle ? <p className="mt-1 text-slate-600">{subtitle}</p> : null}
    </div>
  );
}