/**
 * The studio's real, client-confirmed details.
 *
 * Everything visitor-facing reads from here so the address, hours, phone and
 * email can never drift apart between the header, the booking form, the footer
 * and the page metadata.
 */
export const STUDIO = {
  name: "HAIRBYBELLES",
  establishedYear: 2016,

  email: "Adedijikikelomo@gmail.com",
  /** Digits only, with country code — used to build tel: and wa.me links. */
  phoneDigits: "18322076324",
  phoneDisplay: "+1 (832) 207 6324",

  address: {
    street: "2542 Barnwood Lane",
    city: "Garland",
    state: "TX",
    postalCode: "75042",
  },

  hoursDisplay: "Mon – Sat · 7am – 7pm",
} as const;

export const STUDIO_ADDRESS_LINES = [
  STUDIO.address.street,
  `${STUDIO.address.city}, ${STUDIO.address.state} ${STUDIO.address.postalCode}`,
];
