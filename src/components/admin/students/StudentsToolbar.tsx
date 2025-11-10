import IconButton from "../../common/IconButton";

export default function StudentsToolbar({
  q,
  onQChange,
  branch,
  onBranchChange,
  onAdd
}: {
  q: string;
  onQChange: (v: string) => void;
  branch: string;
  onBranchChange: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={e => onQChange(e.target.value)}
          placeholder="Search by name, email or USN…"
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-80"
        />
        <select
          value={branch}
          onChange={e => onBranchChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-40"
        >
          <option value="">All branches</option>
          <option value="CSE">CSE</option>
          <option value="ISE">ISE</option>
          <option value="ECE">ECE</option>
        </select>
      </div>

      <IconButton title="Add Student" onClick={onAdd} tone="primary">
        <span>＋</span> Add Student
      </IconButton>
    </div>
  );
}
