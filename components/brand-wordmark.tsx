export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold ${className}`}>
      HAIR
      <span className="mx-[0.08em] text-[0.65em] font-normal italic opacity-70">
        by
      </span>
      <span className="text-magenta">BELLES</span>
    </span>
  );
}
