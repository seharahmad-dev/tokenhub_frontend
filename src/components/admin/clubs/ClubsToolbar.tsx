import IconButton from "../../common/IconButton";

type Props = {
  q: string;
  onQChange: (v: string) => void;
  onAdd: () => void;
};

export default function ClubsToolbar({ q, onQChange, onAdd }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full gap-3">
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search by club or head name..."
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:ring-1 focus:ring-red-300 outline-none bg-white"
        />
      </div>

      <div className="flex gap-2">
        <IconButton title="Create Club" onClick={onAdd} tone="primary">
          <span>＋</span> Create
        </IconButton>
      </div>
    </div>
  );
}
