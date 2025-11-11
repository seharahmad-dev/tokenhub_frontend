export default function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
