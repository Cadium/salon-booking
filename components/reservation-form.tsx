"use client";

import { useState } from "react";
import { services } from "@/lib/services";
import { braiders } from "@/lib/braiders";
import { SubmitButton } from "@/components/ui/button";

const LOCATIONS = ["In-studio (South Dallas)", "In-home (DFW)"];

const labelClasses = "text-xs font-medium uppercase tracking-[0.2em] text-copper";
const inputClasses =
  "w-full border-0 border-b border-border bg-transparent py-2 text-base placeholder:text-muted-foreground/60 focus:border-copper focus:outline-none";

export function ReservationForm() {
  const [submitted, setSubmitted] = useState(false);

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
        <label className="flex flex-col gap-2">
          <span className={labelClasses}>Your name</span>
          <input
            type="text"
            name="name"
            placeholder="Dominique Ellis"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClasses}>Email</span>
          <input
            type="email"
            name="email"
            placeholder="you@email.com"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClasses}>Phone</span>
          <input
            type="tel"
            name="phone"
            placeholder="(214) 555 0123"
            className={inputClasses}
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClasses}>Service</legend>
        <div className="flex flex-wrap gap-3">
          {services.map((service) => (
            <label
              key={service.name}
              className="cursor-pointer border border-border px-4 py-2 text-sm transition-colors has-[:checked]:border-copper has-[:checked]:text-copper"
            >
              <input
                type="radio"
                name="service"
                value={service.name}
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
              className="cursor-pointer border border-border px-4 py-2 text-sm transition-colors has-[:checked]:border-copper has-[:checked]:text-copper"
            >
              <input
                type="radio"
                name="location"
                value={location}
                className="sr-only"
              />
              {location}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={labelClasses}>Preferred date</span>
          <input type="date" name="date" className={inputClasses} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClasses}>Braider</span>
          <select name="stylist" className={inputClasses}>
            <option>No preference</option>
            {braiders.map((braider) => (
              <option key={braider.number}>{braider.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className={labelClasses}>Anything we should know?</span>
        <textarea
          name="notes"
          rows={4}
          placeholder="Length, size, hair type, inspo pics, kids' ages, event date…"
          className={inputClasses}
        />
      </label>

      <div className="flex flex-col items-start gap-4">
        <SubmitButton>
          Send request
          <span aria-hidden>↗</span>
        </SubmitButton>
        <p className="text-sm text-muted-foreground">
          We reply within one business day. A non-refundable deposit holds
          your slot and goes toward your total.
        </p>
      </div>
    </form>
  );
}
