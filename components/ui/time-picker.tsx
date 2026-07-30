"use client";

import { useEffect, useId, useRef, useState } from "react";
import { bookableStartTimes, type TimeSlot } from "@/lib/availability";

const SLOTS = bookableStartTimes();

type TimePickerProps = {
  id?: string;
  name: string;
  label: string;
  /**
   * Hidden inputs are skipped by native form validation, so the form needs the
   * value surfaced to it in order to require a choice.
   */
  onChange?: (value: string | null) => void;
  invalid?: boolean;
  describedBy?: string;
};

export function TimePicker({
  id,
  name,
  label,
  onChange,
  invalid,
  describedBy,
}: TimePickerProps) {
  const reactId = useId();
  const fieldId = id ?? reactId;
  const listboxId = `${fieldId}-listbox`;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TimeSlot | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted option in view when arrowing past the visible edge.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const choose = (slot: TimeSlot) => {
    setSelected(slot);
    setOpen(false);
    onChange?.(slot.value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(SLOTS[activeIndex]);
      else setOpen(true);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        return Math.min(Math.max(next, 0), SLOTS.length - 1);
      });
    }
  };

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
        onKeyDown={onKeyDown}
        // combobox is the ARIA pattern for a control that opens a listbox, and
        // unlike a plain button it accepts aria-invalid.
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`flex w-full cursor-pointer items-center justify-between border-0 border-b bg-transparent py-2 text-left text-base transition-colors focus-visible:border-magenta focus-visible:outline-none ${
          invalid ? "border-destructive" : "border-border"
        }`}
      >
        <span
          className={selected ? "text-foreground" : "text-muted-foreground/60"}
        >
          {selected ? selected.label : "Select a start time"}
        </span>
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-magenta"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 7.5V12l3 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {selected && <input type="hidden" name={name} value={selected.value} />}

      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-label={label}
        className={`absolute top-full left-0 z-20 mt-2 max-h-64 w-[220px] origin-top-left overflow-y-auto border border-border/70 bg-bone py-2 shadow-[0_20px_40px_-12px_rgba(30,18,32,0.25)] transition-all duration-200 ease-out ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {SLOTS.map((slot, i) => {
          const isSelected = selected?.value === slot.value;
          return (
            <li
              key={slot.value}
              role="option"
              aria-selected={isSelected}
              onClick={() => choose(slot)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                isSelected
                  ? "bg-magenta text-bone"
                  : activeIndex === i
                    ? "bg-magenta/10 text-foreground"
                    : "text-foreground"
              }`}
            >
              {slot.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
