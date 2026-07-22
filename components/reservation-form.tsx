"use client";

import { useRef, useState } from "react";
import { services } from "@/lib/services";
import { SubmitButton, ButtonArrow } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

const LOCATIONS = ["In-studio (Garland)", "In-home (DFW)"];
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
        <a href="mailto:hello@hairbybelles.co" className="text-magenta">
          hello@hairbybelles.co
        </a>{" "}
        or{" "}
        <a href="tel:+12145550142" className="text-magenta">
          +1 (214) 555 0142
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
        <a href="mailto:hello@hairbybelles.co" className="text-magenta">
          hello@hairbybelles.co
        </a>{" "}
        or{" "}
        <a href="tel:+12145550142" className="text-magenta">
          +1 (214) 555 0142
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
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    null,
  );
  const iframeLoadCount = useRef(0);

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
      onSubmit={() => setIsSubmitting(true)}
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

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClasses}>Location</legend>
        <div className="flex flex-wrap gap-3">
          {LOCATIONS.map((location) => (
            <label
              key={location}
              className={pillBaseClasses}
              style={
                selectedLocation === location ? pillSelectedStyle : undefined
              }
            >
              <input
                type="radio"
                name="location"
                value={location}
                required
                checked={selectedLocation === location}
                onChange={() => setSelectedLocation(location)}
                className="sr-only"
              />
              {location}
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
          iframeLoadCount.current += 1;
          if (iframeLoadCount.current > 1) {
            setIsSubmitting(false);
            setSubmitted(true);
          }
        }}
        onError={() => {
          setIsSubmitting(false);
          setErrored(true);
        }}
      />
    </form>
  );
}
