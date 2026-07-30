/**
 * When the studio can take a booking.
 *
 * There is deliberately no per-style duration table here, because no such
 * thing exists: a full set runs four to six hours depending on length, not on
 * which style was chosen. Inventing a number per style would put a precise
 * claim in front of clients that nobody at the studio ever made.
 *
 * Capacity is also not the constraint. The studio works as a team, takes
 * several clients at once, and does not turn anyone away for booking the same
 * day as someone else, so there is nothing to ration and no slot to hold.
 *
 * What genuinely constrains a booking is the closing time. A six-hour set
 * starting at 2pm runs an hour past close, so the only start times offered are
 * the ones where even the longest service still finishes before the doors shut.
 */

export const OPENING_HOUR = 7;
export const CLOSING_HOUR = 19;

/** Her stated range, used as-is rather than guessed at per style. */
export const SHORTEST_SERVICE_HOURS = 4;
export const LONGEST_SERVICE_HOURS = 6;

/**
 * 1pm. The last start where a worst-case six-hour set still finishes by close.
 * Derived rather than hardcoded so changing the hours moves this with them.
 */
export const LATEST_START_HOUR = CLOSING_HOUR - LONGEST_SERVICE_HOURS;

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
  const lastSlotMinutes = LATEST_START_HOUR * 60;

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

/** Sundays are worked, but only by arrangement, so they are flagged not blocked. */
export function isByAppointmentOnly(date: Date): boolean {
  return date.getDay() === 0;
}

export const DURATION_NOTE = `Most styles take ${SHORTEST_SERVICE_HOURS} to ${LONGEST_SERVICE_HOURS} hours depending on length, so the latest start we can offer is ${formatSlotLabel(LATEST_START_HOUR, 0)}.`;
