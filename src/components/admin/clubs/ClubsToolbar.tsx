type Props = {
  q: string;
  onQChange: (v: string) => void;
  onAdd: () => void;
};

export default function ClubsToolbar({ q, onQChange, onAdd }: Props) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <input
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        placeholder="Search by club or head name..."
        className="w-80 rounded-lg border px-3 py-2 text-sm"
      />
      <button
        onClick={onAdd}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        + Create Club
      </button>
    </div>
  );
}