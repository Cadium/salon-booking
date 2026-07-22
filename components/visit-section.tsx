const COLUMNS = [
  {
    heading: "STUDIO",
    lines: [
      "Home studio, Garland",
      "Full address sent after booking",
      "Tue – Sat · 8am – 8pm",
    ],
  },
  {
    heading: "CONTACT",
    lines: ["hello@kindredbraids.co", "+1 (214) 555 0142", "@kindredbraids"],
  },
  {
    heading: "IN-HOME SERVICE",
    lines: [
      "Mobile appointments available across Garland, Rowlett, Mesquite, Sachse, Richardson, and surrounding DFW. A small travel fee applies past 20 miles from the studio.",
    ],
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
