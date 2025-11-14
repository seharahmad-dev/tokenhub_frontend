// src/components/student/QuizCard.tsx
import React from "react";

type Props = {
  questionId: string;
  question: string;
  choices: string[];
  onSelect: (choice: string) => void;
  disabled?: boolean;
  selected?: string | null;
  onCopyPrevent?: (e: React.ClipboardEvent) => void;
};

export default function QuizCard({ questionId, question, choices, onSelect, disabled, selected, onCopyPrevent }: Props) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <div
        className="mb-4 select-none leading-6 text-slate-800 text-base"
        onCopy={(e) => { e.preventDefault(); if (onCopyPrevent) onCopyPrevent(e); }}
        style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none" }}
      >
        <div className="font-medium mb-2">Question:</div>
        <div>{question}</div>
      </div>

      <div className="grid gap-2">
        {choices.map((c, idx) => {
          const letter = ["A","B","C","D"][idx] ?? String.fromCharCode(65 + idx);
          const isSelected = selected === letter;
          return (
            <button
              key={letter}
              onClick={() => !disabled && onSelect(letter)}
              disabled={disabled}
              className={`text-left p-3 rounded border ${isSelected ? "bg-blue-50 border-blue-300" : "bg-white"}`}
            >
              <div className="font-medium">{letter}. {c}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
