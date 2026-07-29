import { STUDIO, STUDIO_ADDRESS_LINES } from "@/lib/studio";

const COLUMNS = [
  {
    heading: "STUDIO",
    lines: STUDIO_ADDRESS_LINES,
  },
  {
    heading: "OPENING HOURS",
    lines: [STUDIO.hoursDisplay, "Sundays by appointment"],
  },
  {
    heading: "CONTACT",
    lines: [...STUDIO.phones.map((p) => p.display), STUDIO.email],
  },
];

export function VisitSection() {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
      {COLUMNS.map((col) => (
        <div key={col.heading}>
          <p className="mb-3 text-xs tracking-[0.2em] text-magenta">
            {col.heading}
          </p>
          {col.lines.map((line) => (
            <p key={line} className="text-sm text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
