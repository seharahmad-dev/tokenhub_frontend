type Props = {
  q: string;
  onQChange: (v: string) => void;
  branch: string;
  onBranchChange: (v: string) => void;
  onAdd: () => void;
};

export default function FacultyToolbar({ q, onQChange, branch, onBranchChange, onAdd }: Props) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-2">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search name, email, designation…"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
        />
        <select
          value={branch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
        >
          <option value="">All Branches</option>
          <option value="CSE">CSE</option>
          <option value="ISE">ISE</option>
          <option value="ECE">ECE</option>
        </select>
      </div>
      <button
        onClick={onAdd}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        + Add Faculty
      </button>
    </div>
  );
}