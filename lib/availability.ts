/**
 * When the studio can take a booking.
 *
 * Availability is decided by the studio's Google Calendar when the booking is
 * submitted. The form therefore offers the full working day instead of making
 * a conservative guess based on the longest possible appointment.
 */

export const OPENING_HOUR = 7;
export const CLOSING_HOUR = 19;

/** Half-hour steps: short enough to feel accommodating, few enough to scan. */
const STEP_MINUTES = 30;

export type TimeSlot = {
  /** 24-hour "HH:MM", the value submitted with the form. */
  value: string;
  /** "7:00 AM", what the client reads. */
  label: string;
};

function formatSlotLabel(hour24: number, minute: number): string {
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

/** Every start time a booking can begin at, earliest first. */
export function bookableStartTimes(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const lastSlotMinutes = CLOSING_HOUR * 60;

  for (
    let minutes = OPENING_HOUR * 60;
    minutes <= lastSlotMinutes;
    minutes += STEP_MINUTES
  ) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push({
      value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      label: formatSlotLabel(hour, minute),
    });
  }

  return slots;
}

export const DURATION_NOTE = "We check your requested time against our calendar right away.";
