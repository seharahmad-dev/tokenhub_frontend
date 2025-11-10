type Props = {
  label: "Student" | "Faculty" | "HOD" | "Admin";
  color: string;
  onClick?: () => void;
};

export default function LoginOption({ label, color, onClick }: Props) {
  const ring = `ring-1 ring-inset ${color}/30`;
  const bg = `${color}`;
  const hover = `hover:bg-${color.split("-")[0]}-700`;

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-xl ${ring} p-5 text-left transition`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Sign in as</p>
          <h3 className="mt-1 text-xl font-semibold">{label}</h3>
        </div>
        <span
          className={`shrink-0 rounded-lg px-3 py-1 text-sm font-medium text-white ${bg} ${hover} transition`}
        >
          Login
        </span>
      </div>
    </button>
  );
}