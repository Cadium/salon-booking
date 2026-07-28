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

  /**
   * Contact numbers, most-used first. `digits` carries the country code and is
   * what builds tel: and wa.me links; `display` is what visitors read.
   * Anywhere only one number fits — the WhatsApp and call buttons — uses the
   * first. Anywhere contact details are listed shows all of them.
   */
  phones: [
    { digits: "18322076324", display: "+1 (832) 207 6324" },
    { digits: "19452697357", display: "+1 (945) 269 7357" },
  ],

  address: {
    street: "2542 Barnwood Lane",
    city: "Garland",
    state: "TX",
    postalCode: "75042",
  },

  hoursDisplay: "Mon – Sat · 7am – 7pm",
} as const;

/** The number used where only one will fit. */
export const PRIMARY_PHONE = STUDIO.phones[0];

export const STUDIO_ADDRESS_LINES = [
  STUDIO.address.street,
  `${STUDIO.address.city}, ${STUDIO.address.state} ${STUDIO.address.postalCode}`,
];
