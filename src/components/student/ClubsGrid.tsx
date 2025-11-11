import ClubCard, { ClubDoc } from "./ClubCard";

export default function ClubsGrid({
  items,
}: {
  items: (ClubDoc & { president?: string })[];
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        No clubs to display.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((c) => (
        <ClubCard
          key={c._id}
          club={c}
          president={c.president || "—"}
        />
      ))}
    </div>
  );
}