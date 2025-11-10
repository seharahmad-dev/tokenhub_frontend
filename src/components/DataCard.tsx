type CardProps = { title: string; children: React.ReactNode; right?: React.ReactNode };

export default function DataCard({ title, children, right }: CardProps) {
  return (
    <section className="rounded-xl border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}