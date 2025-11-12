import { useAppSelector } from "../../app/hooks";
import { selectStudent } from "../../app/studentSlice";

type ClubItem = { _id: string; name: string; role?: string };

export default function ClubsMini({ items }: { items: ClubItem[] }) {
  const me = useAppSelector(selectStudent);

  return (
    <ul className="space-y-2">
      {items.map((c) => {
        const isHead = me?.clubId && String(me.clubId) === String(c._id);
        const role = isHead ? "Club Head" : c.role ?? "member";

        return (
          <li key={c._id} className="flex items-center justify-between text-sm">
            <span className="text-slate-800">{c.name}</span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs ${
                isHead ? "bg-amber-100 text-amber-800 font-medium" : "bg-slate-100 text-slate-700"
              }`}
            >
              {role}
            </span>
          </li>
        );
      })}
      {items.length === 0 && (
        <p className="text-sm text-slate-500">Not a member of any club yet.</p>
      )}
    </ul>
  );
}
