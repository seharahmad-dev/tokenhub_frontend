type ClubItem = { _id: string; name: string; role?: string };

export default function ClubsMini({ items }: { items: ClubItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <li key={c._id} className="flex items-center justify-between text-sm">
          <span className="text-slate-800">{c.name}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {c.role ?? "member"}
          </span>
        </li>
      ))}
      {items.length === 0 && <p className="text-sm text-slate-500">Not a member of any club yet.</p>}
    </ul>
  );
}
