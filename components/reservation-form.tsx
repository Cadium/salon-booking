"use client";

import { useState } from "react";
import { services } from "@/lib/services";
import { SubmitButton, ButtonArrow } from "@/components/ui/button";

const LOCATIONS = ["In-studio (Garland)", "In-home (DFW)"];

const labelClasses = "text-xs font-medium uppercase tracking-[0.2em] text-copper";
const inputClasses =
  "w-full border-0 border-b border-border bg-transparent py-2 text-base placeholder:text-muted-foreground/60 focus:border-copper focus:outline-none";
const pillBaseClasses =
  "cursor-pointer border border-border px-4 py-2 text-sm transition-colors";
const pillSelectedStyle = {
  borderColor: "var(--copper)",
  color: "var(--copper)",
} as const;

export function ReservationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    null,
  );

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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
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
            placeholder="Dominique Ellis"
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
                checked={selectedLocation === location}
                onChange={() => setSelectedLocation(location)}
                className="sr-only"
              />
              {location}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 md:max-w-xs">
        <label htmlFor="date" className={labelClasses}>
          Preferred date
        </label>
        <input id="date" type="date" name="date" className={inputClasses} />
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
        <SubmitButton>
          Send request
          <ButtonArrow>↗</ButtonArrow>
        </SubmitButton>
        <p className="text-sm text-muted-foreground">
          We reply within one business day. A non-refundable deposit holds
          your slot and goes toward your total.
        </p>
      </div>
    </form>
  );
}
