// src/components/common/EmptyState.tsx
export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-100 bg-white p-8 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      <div className="mt-4 text-xs text-slate-400">No results found</div>
    </div>
  );
}
