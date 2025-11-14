type Props = {
  label: "Student" | "Faculty" | "HOD" | "Admin";
  href: string;
  color: string; 
};

export default function LoginButton({ label, href, color }: Props) {
  return (
    <a
      href={href}
      className="group w-full"
    >
      <div className="w-full rounded-xl border border-slate-200 p-5 transition hover:shadow-sm">
        <div className="flex items-center justify-between ">
          <div>
            <p className="text-xs text-slate-500">Sign in as</p>
            <h3 className="mt-1 text-lg font-semibold">{label}</h3>
          </div>
          <span className={`px-3 py-1 rounded-lg text-white text-sm font-medium ${color} group-hover:brightness-110`}>
            Login
          </span>
        </div>
      </div>
    </a>
  );
}