import { VisitSection } from "@/components/visit-section";
import { ReservationForm } from "@/components/reservation-form";

export function BookSection() {
  return (
    <section
      id="book"
      className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32"
    >
      <VisitSection />

      <div className="mt-20 border-t border-border/70 pt-16">
        <p className="mb-2 text-xs tracking-[0.2em] text-copper">RESERVE</p>
        <h2 className="mb-10 font-display text-3xl md:text-4xl">
          Request an appointment.
        </h2>
        <ReservationForm />
      </div>
    </section>
  );
}
