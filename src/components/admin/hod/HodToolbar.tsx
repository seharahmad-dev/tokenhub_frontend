import IconButton from "../../common/IconButton";

type Props = {
  q: string;
  onQChange: (v: string) => void;
  branch: string;
  onBranchChange: (v: string) => void;
  onAdd: () => void;
};

export default function HodToolbar({
  q,
  onQChange,
  branch,
  onBranchChange,
  onAdd,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full gap-3">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search by name, email or branch…"
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none bg-white"
        />
        <select
          value={branch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none bg-white"
        >
          <option value="">All branches</option>
          <option value="CSE">CSE</option>
          <option value="ISE">ISE</option>
          <option value="ECE">ECE</option>
        </select>
      </div>

      <div className="flex gap-2">
        <IconButton title="Add HOD" onClick={onAdd} tone="primary">
          <span>＋</span> Add
        </IconButton>
      </div>
    </div>
  );
}
