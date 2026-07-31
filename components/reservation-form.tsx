"use client";

import { useState } from "react";
import { services } from "@/lib/services";
import { SubmitButton, ButtonArrow } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { useBookingSelection } from "@/lib/booking-selection-context";
import { STUDIO } from "@/lib/studio";
import { DURATION_NOTE } from "@/lib/availability";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;

const labelClasses = "text-xs font-medium uppercase tracking-[0.2em] text-magenta";
const inputClasses =
  "w-full border-0 border-b border-border bg-transparent py-2 text-base placeholder:text-muted-foreground/60 focus:border-magenta focus:outline-none";
const pillBaseClasses =
  "cursor-pointer border border-border px-4 py-2 text-sm transition-colors";
const pillSelectedStyle = {
  borderColor: "var(--magenta)",
  color: "var(--magenta)",
} as const;

function RequiredMark() {
  return <span aria-hidden="true" className="ml-1 text-magenta">*</span>;
}

/** Every way to reach the studio — shown when the form itself can't be used. */
function DirectContacts() {
  return (
    <span>
      <a href={`mailto:${STUDIO.email}`} className="text-magenta">
        {STUDIO.email}
      </a>
      {STUDIO.phones.map((phone) => (
        <span key={phone.digits}>
          {" or "}
          <a href={`tel:+${phone.digits}`} className="text-magenta">
            {phone.display}
          </a>
        </span>
      ))}
    </span>
  );
}

function UnavailableNotice() {
  return (
    <div className="border border-border/70 px-8 py-12 text-center">
      <p className="font-display font-semibold text-2xl">Booking requests aren&apos;t wired up yet.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Reach out directly at <DirectContacts />.
      </p>
    </div>
  );
}

function ErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-destructive/40 px-8 py-12 text-center">
      <p className="font-display font-semibold text-2xl text-destructive">Something went wrong.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Your request may not have gone through. Please try again, or reach
        out directly at <DirectContacts />.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 cursor-pointer border-b border-foreground/40 pb-1 text-sm transition-colors hover:border-magenta hover:text-magenta"
      >
        Try again
      </button>
    </div>
  );
}

export function ReservationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [errored, setErrored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const { selectedService, setSelectedService } = useBookingSelection();

  if (!GAS_URL) {
    return <UnavailableNotice />;
  }

  const startAnother = () => {
    setSubmitted(false);
    setErrored(false);
    setSelectedService(null);
    setDate(null);
    setTime(null);
    setShowMissing(false);
  };

  if (submitted) {
    return (
      <div className="border border-border/70 px-8 py-12 text-center">
        <p className="font-display font-semibold text-2xl">Request sent.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your booking update has been sent to your inbox.
        </p>
        <button
          type="button"
          onClick={startAnother}
          className="mt-6 cursor-pointer border-b border-foreground/40 pb-1 text-sm transition-colors hover:border-magenta hover:text-magenta"
        >
          Book another style
        </button>
      </div>
    );
  }

  if (errored) {
    return <ErrorNotice onRetry={startAnother} />;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!date || !time) {
          setShowMissing(true);
          return;
        }

        const form = e.currentTarget;
        setErrored(false);
        setIsSubmitting(true);
        try {
          const response = await fetch("/api/booking", {
            method: "POST",
            body: new FormData(form),
          });
          if (!response.ok) throw new Error("Booking request failed");
          setSubmitted(true);
        } catch {
          setIsSubmitting(false);
          setErrored(true);
        }
      }}
      className="flex flex-col gap-8"
    >
      <p className="-mb-3 text-sm text-muted-foreground">
        <span aria-hidden="true" className="text-magenta">*</span> required fields
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className={labelClasses}>
            Your name <RequiredMark />
          </label>
          <input
            id="name"
            type="text"
            name="name"
            required
            placeholder="Kikelomo Fasogbon"
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={labelClasses}>
            Email <RequiredMark />
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            placeholder="you@email.com"
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className={labelClasses}>
            Phone <RequiredMark />
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            required
            placeholder="(214) 555 0123"
            className={inputClasses}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClasses}>Service <RequiredMark /></legend>
        <div className="flex flex-wrap gap-3">
          {services.map((service) => (
            <label
              key={service.name}
              className={pillBaseClasses}
              style={
                selectedService === service.name ? pillSelectedStyle : undefined
              }
            >
              <input
                type="radio"
                name="service"
                value={service.name}
                required
                checked={selectedService === service.name}
                onChange={() => setSelectedService(service.name)}
                className="sr-only"
              />
              {service.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:max-w-xl">
          <DatePicker
            id="date"
            name="date"
            label="Preferred date"
            required
            onChange={setDate}
            invalid={showMissing && !date}
            describedBy={showMissing && !date ? "appointment-error" : undefined}
          />
          <TimePicker
            id="time"
            name="time"
            label="Start time"
            required
            onChange={setTime}
            invalid={showMissing && !time}
            describedBy={showMissing && !time ? "appointment-error" : undefined}
          />
        </div>

        {showMissing && (!date || !time) && (
          <p id="appointment-error" role="alert" className="text-sm text-destructive">
            {!date && !time
              ? "Please choose a date and a start time."
              : !date
                ? "Please choose a date."
                : "Please choose a start time."}
          </p>
        )}

        <p className="text-sm text-muted-foreground">{DURATION_NOTE}</p>

      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className={labelClasses}>
          Anything we should know? <span className="normal-case tracking-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Length, size, hair type, inspo pics, kids' ages, event date…"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col items-start gap-4">
        <SubmitButton disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send request"}
          {!isSubmitting && <ButtonArrow>↗</ButtonArrow>}
        </SubmitButton>
        <p className="text-sm text-muted-foreground">
          We check your requested time right away. A $30 non-refundable deposit
          holds a booked slot and goes toward your total.
        </p>
      </div>
    </form>
  );
}
