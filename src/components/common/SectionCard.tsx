// src/components/SectionCard.tsx
export default function SectionCard({ title, action, children }: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3 bg-white">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

