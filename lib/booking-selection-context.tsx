"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type BookingSelectionContextValue = {
  selectedService: string | null;
  setSelectedService: (service: string | null) => void;
};

const BookingSelectionContext =
  createContext<BookingSelectionContextValue | null>(null);

export function BookingSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <BookingSelectionContext.Provider
      value={{ selectedService, setSelectedService }}
    >
      {children}
    </BookingSelectionContext.Provider>
  );
}

export function useBookingSelection() {
  const ctx = useContext(BookingSelectionContext);
  if (!ctx) {
    throw new Error(
      "useBookingSelection must be used within a BookingSelectionProvider",
    );
  }
  return ctx;
}
