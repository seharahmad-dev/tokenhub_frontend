type CardProps = { title: string; children: React.ReactNode; right?: React.ReactNode };

export default function DataCard({ title, children, right }: CardProps) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-white">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
