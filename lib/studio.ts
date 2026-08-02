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
   * what builds tel: and wa.me links; `display` is what visitors read. Add or
   * remove entries here and every surface follows — the listings show them all,
   * and the WhatsApp and call buttons offer a choice whenever there is one.
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

  hoursDisplay: "Mon to Sat · 7am to 7pm",
} as const;

export const STUDIO_ADDRESS_LINES = [
  STUDIO.address.street,
  `${STUDIO.address.city}, ${STUDIO.address.state} ${STUDIO.address.postalCode}`,
];
