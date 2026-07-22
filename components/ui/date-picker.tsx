"use client";

import { useEffect, useId, useRef, useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDisplay(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DatePickerProps = {
  id?: string;
  name: string;
  label: string;
};

export function DatePicker({ id, name, label }: DatePickerProps) {
  const reactId = useId();
  const fieldId = id ?? reactId;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState(() => startOfDay(new Date()));
  const rootRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <div ref={rootRef} className="relative flex flex-col gap-2">
      <label
        htmlFor={fieldId}
        className="text-xs font-medium uppercase tracking-[0.2em] text-magenta"
      >
        {label}
      </label>
      <button
        id={fieldId}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full cursor-pointer items-center justify-between border-0 border-b border-border bg-transparent py-2 text-left text-base transition-colors focus-visible:border-magenta focus-visible:outline-none"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground/60"}>
          {selected ? formatDisplay(selected) : "Select a date"}
        </span>
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-magenta"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {selected && (
        <input type="hidden" name={name} value={toInputValue(selected)} />
      )}

      <div
        role="dialog"
        aria-label="Choose a date"
        className={`absolute top-full left-0 z-20 mt-2 w-[300px] origin-top-left border border-border/70 bg-bone p-5 shadow-[0_20px_40px_-12px_rgba(30,18,32,0.25)] transition-all duration-200 ease-out ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() =>
              setViewMonth(startOfDay(new Date(year, month - 1, 1)))
            }
            className="cursor-pointer p-1 text-foreground transition-colors hover:text-magenta"
          >
            ‹
          </button>
          <p className="font-display text-lg">
            {MONTH_NAMES[month]} {year}
          </p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() =>
              setViewMonth(startOfDay(new Date(year, month + 1, 1)))
            }
            className="cursor-pointer p-1 text-foreground transition-colors hover:text-magenta"
          >
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-y-1 text-center text-xs text-muted-foreground">
          {WEEKDAYS.map((w, i) => (
            <span key={`${w}-${i}`}>{w}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-sm">
          {cells.map((day, i) => {
            if (!day) return <span key={`blank-${i}`} />;
            const isPast = day < today;
            const isSelected =
              selected && startOfDay(selected).getTime() === day.getTime();
            const isToday = day.getTime() === today.getTime();
            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={isPast}
                onClick={() => {
                  setSelected(day);
                  setOpen(false);
                }}
                className={`mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors ${
                  isSelected
                    ? "bg-magenta text-bone"
                    : isPast
                      ? "cursor-not-allowed text-muted-foreground/30"
                      : "text-foreground hover:bg-magenta/10"
                } ${isToday && !isSelected ? "font-semibold text-magenta" : ""}`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
