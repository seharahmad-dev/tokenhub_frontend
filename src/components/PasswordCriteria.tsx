type Criteria = {
  label: string;
  ok: boolean;
};

function Item({ ok, label }: Criteria) {
  return (
    <li className={`flex items-center gap-2 text-sm ${ok ? "text-emerald-600" : "text-rose-600"}`}>
      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] 
        ${ok ? "border-emerald-600" : "border-rose-600"}`}>
        {ok ? "✓" : "✗"}
      </span>
      {label}
    </li>
  );
}

export default function PasswordCriteria({
  value,
  visible
}: {
  value: string;
  visible: boolean;
}) {
  if (!visible) return null;

  const checks: Criteria[] = [
    { label: "At least 8 characters", ok: value.length >= 8 },
    { label: "Contains uppercase", ok: /[A-Z]/.test(value) },
    { label: "Contains lowercase", ok: /[a-z]/.test(value) },
    { label: "Contains a digit", ok: /[0-9]/.test(value) },
    { label: "Contains a special character", ok: /[!@#$%^&*(),.?\":{}|<>]/.test(value) }
  ];

  return (
    <ul className="mt-2 space-y-1">
      {checks.map(c => <Item key={c.label} {...c} />)}
    </ul>
  );
}