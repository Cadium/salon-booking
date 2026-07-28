"use client";

import { useEffect, useRef, useState } from "react";
import { services } from "@/lib/services";
import { SubmitButton, ButtonArrow } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useBookingSelection } from "@/lib/booking-selection-context";
import { STUDIO } from "@/lib/studio";

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

function UnavailableNotice() {
  return (
    <div className="border border-border/70 px-8 py-12 text-center">
      <p className="font-display text-2xl">Booking requests aren&apos;t wired up yet.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Reach out directly at{" "}
        <a href={`mailto:${STUDIO.email}`} className="text-magenta">
          {STUDIO.email}
        </a>{" "}
        or{" "}
        <a href={`tel:+${STUDIO.phoneDigits}`} className="text-magenta">
          {STUDIO.phoneDisplay}
        </a>
        .
      </p>
    </div>
  );
}

function ErrorNotice() {
  return (
    <div className="border border-destructive/40 px-8 py-12 text-center">
      <p className="font-display text-2xl text-destructive">Something went wrong.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Your request may not have gone through. Please try again, or reach
        out directly at{" "}
        <a href={`mailto:${STUDIO.email}`} className="text-magenta">
          {STUDIO.email}
        </a>{" "}
        or{" "}
        <a href={`tel:+${STUDIO.phoneDigits}`} className="text-magenta">
          {STUDIO.phoneDisplay}
        </a>
        .
      </p>
    </div>
  );
}

export function ReservationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [errored, setErrored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedService, setSelectedService } = useBookingSelection();

  // The submission target is cross-origin, so the iframe's load event is the
  // only signal available that the POST completed. Track whether a submit has
  // actually happened rather than counting loads: browsers disagree on whether
  // an iframe fires an initial load for about:blank, and counting left the
  // form stuck on "Sending…" forever where that first event never came.
  const hasSubmitted = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  if (!GAS_URL) {
    return <UnavailableNotice />;
  }

  if (submitted) {
    return (
      <div className="border border-border/70 px-8 py-12 text-center">
        <p className="font-display text-2xl">Request received.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We reply within one business day.
        </p>
      </div>
    );
  }

  if (errored) {
    return <ErrorNotice />;
  }

  return (
    <form
      action={GAS_URL}
      method="POST"
      target="hairbybelles-reservation-frame"
      onSubmit={() => {
        hasSubmitted.current = true;
        setIsSubmitting(true);
        // Never let the form hang if the iframe never reports back.
        timeoutRef.current = setTimeout(() => {
          setIsSubmitting(false);
          setErrored(true);
        }, 15000);
      }}
      className="flex flex-col gap-8"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className={labelClasses}>
            Your name
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
            Email
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
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            placeholder="(214) 555 0123"
            className={inputClasses}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClasses}>Service</legend>
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

      <div className="md:max-w-xs">
        <DatePicker id="date" name="date" label="Preferred date" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className={labelClasses}>
          Anything we should know?
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
          We reply within one business day. A non-refundable deposit holds
          your slot and goes toward your total.
        </p>
      </div>

      <iframe
        name="hairbybelles-reservation-frame"
        className="hidden"
        onLoad={() => {
          // Ignore the initial about:blank load where a browser does fire one.
          if (!hasSubmitted.current) return;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setIsSubmitting(false);
          setSubmitted(true);
        }}
        onError={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setIsSubmitting(false);
          setErrored(true);
        }}
      />
    </form>
  );
}
