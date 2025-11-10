import { InputHTMLAttributes, useState } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  rightAddon?: string; // e.g., "@bmsce.ac.in"
};

export default function TextInput({
  label,
  hint,
  rightAddon,
  className,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div
        className={`mt-1 flex rounded-lg border bg-white ${focused ? "border-slate-400" : "border-slate-300"}`}
      >
        <input
          {...rest}
          className={`w-full rounded-l-lg px-3 py-2 outline-none ${className ?? ""}`}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />
        {rightAddon ? (
          <div className="flex items-center rounded-r-lg border-l bg-slate-50 px-3 text-sm text-slate-600">
            {rightAddon}
          </div>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
