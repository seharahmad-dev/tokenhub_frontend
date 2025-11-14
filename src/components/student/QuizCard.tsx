import React from "react";

type Props = {
  questionId: string;
  question: string;
  choices: string[];
  onSelect: (choiceLetter: string) => void;
  disabled?: boolean;
  selected?: string | null;
  onCopyPrevent?: (e: React.ClipboardEvent) => void;
};

export default function QuizCard({
  questionId,
  question,
  choices,
  onSelect,
  disabled,
  selected,
  onCopyPrevent,
}: Props) {
  const cleanChoiceText = (raw: string) => {
    if (!raw) return "";
    return raw.replace(/^\s*[A-Da-d]\s*[\.\)\-:]\s*/, "").trim();
  };

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-6">
      <div
        className="mb-4 select-none leading-6 text-slate-800 text-base"
        onCopy={(e) => {
          e.preventDefault();
          if (onCopyPrevent) onCopyPrevent(e);
        }}
        style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none" }}
      >
        <div className="font-medium mb-2">Question:</div>
        <div>{question}</div>
      </div>

      <div className="grid gap-3">
        {choices.map((c, idx) => {
          const letter = ["A", "B", "C", "D"][idx] ?? String.fromCharCode(65 + idx);
          const text = cleanChoiceText(c);
          const isSelected = selected === letter;
          return (
            <button
              key={letter}
              onClick={() => !disabled && onSelect(letter)}
              disabled={disabled}
              className={`text-left p-3 rounded-xl border transition-colors duration-100 ${
                isSelected ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-slate-50"
              }`}
              aria-pressed={isSelected}
            >
              <div className="font-medium">
                <span className="inline-block w-6">{letter}.</span> {text}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
