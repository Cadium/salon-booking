export type CollectionId =
  | "boho-curls"
  | "twists"
  | "box-knotless"
  | "cornrows-styled";

export type PriceTier = {
  /** Length and, where it varies, braid size — e.g. "Small · Butt length". */
  label: string;
  price: number;
};

export type Service = {
  slug: string;
  name: string;
  collection: CollectionId;
  description: string;
  image: string;
  alt: string;
  /**
   * CSS object-position, tuned per photo. These are shot in a working studio,
   * so each crop is pulled toward the hair and away from the mirrors, fans and
   * trolleys sitting at the edges of frame.
   */
  imagePosition: string;
  tiers: PriceTier[];
};

export type Collection = {
  id: CollectionId;
  name: string;
  blurb: string;
};

/** Display order runs signature-first, staples last. */
export const collections: Collection[] = [
  {
    id: "boho-curls",
    name: "Boho & Curls",
    blurb:
      "Braids finished with loose, curly texture — the fullest, softest looks on the menu.",
  },
  {
    id: "twists",
    name: "Twists",
    blurb: "Rope and two-strand twists, worn long.",
  },
  {
    id: "box-knotless",
    name: "Box & Knotless",
    blurb: "The staples. Clean parts, even sections, every size.",
  },
  {
    id: "cornrows-styled",
    name: "Cornrows & Styled",
    blurb:
      "Patterned work at the crown, from Fulani sets to a sculpted ponytail.",
  },
];

export const services: Service[] = [
  {
    slug: "boho-braids",
    name: "Boho Braids",
    collection: "boho-curls",
    description:
      "Knotless braids threaded with loose curls left free throughout — full, soft, and romantic.",
    image: "/images/styles/boho.jpeg",
    alt: "Copper boho braids with loose curls, worn past the waist",
    imagePosition: "50% 42%",
    tiers: [
      { label: "Small · Butt length", price: 320 },
      { label: "Small · Waist length", price: 300 },
      { label: "Small-medium · Butt length", price: 280 },
      { label: "Small-medium · Waist length", price: 265 },
      { label: "Medium · Bob / shoulder length", price: 250 },
    ],
  },
  {
    slug: "borabora-braids",
    name: "Borabora Braids",
    collection: "boho-curls",
    description:
      "Long braids finishing in deep, defined waves. The most intricate set on the menu.",
    image: "/images/styles/borabora.jpeg",
    alt: "Copper Borabora braids with defined curls, worn long",
    imagePosition: "42% 45%",
    tiers: [
      { label: "Waist length", price: 400 },
      { label: "Midback length", price: 350 },
    ],
  },
  {
    slug: "french-curls",
    name: "French Curls",
    collection: "boho-curls",
    description: "Sleek braids that finish in big, bouncy curls at the ends.",
    image: "/images/styles/french-curls.jpeg",
    alt: "Auburn braids finishing in large loose curls",
    imagePosition: "50% 45%",
    tiers: [
      { label: "Waist / butt length", price: 280 },
      { label: "Midback length", price: 260 },
    ],
  },
  {
    slug: "miracle-knot",
    name: "Miracle Knot",
    collection: "boho-curls",
    description:
      "Braided lengths with a soft curl running through — easy to wear every day.",
    image: "/images/styles/miracle-knot.jpeg",
    alt: "Brown braids with soft curl texture throughout",
    imagePosition: "50% 40%",
    tiers: [
      { label: "Waist length", price: 260 },
      { label: "Midback length", price: 220 },
    ],
  },
  {
    slug: "island-twists",
    name: "Island Twists",
    collection: "twists",
    description: "Two-strand twists worn long, with curl left at the ends.",
    image: "/images/styles/island-twists.jpeg",
    alt: "Long island twists with curled ends",
    imagePosition: "40% 40%",
    tiers: [
      { label: "Small · Waist / butt length", price: 330 },
      { label: "Small-medium · Waist / butt length", price: 300 },
      { label: "Medium · Waist / butt length", price: 280 },
    ],
  },
  {
    slug: "senegalese-twists",
    name: "Senegalese Twists",
    collection: "twists",
    description: "Smooth rope twists, sleek from root to tip.",
    image: "/images/styles/senegalese-twists.jpeg",
    alt: "Black Senegalese rope twists swept into a long ponytail",
    imagePosition: "45% 40%",
    tiers: [
      { label: "Butt length", price: 300 },
      { label: "Waist length", price: 280 },
      { label: "Midback length", price: 260 },
      { label: "Shoulder length", price: 245 },
    ],
  },
  {
    slug: "knotless-box-braids",
    name: "Knotless Box Braids",
    collection: "box-knotless",
    description:
      "Box braids started with your own hair — no knot at the root, no pulling.",
    image: "/images/styles/knotless-box-braids.jpeg",
    alt: "Honey-blonde knotless box braids worn long",
    imagePosition: "45% 35%",
    tiers: [
      { label: "Butt length", price: 285 },
      { label: "Waist length", price: 275 },
      { label: "Midback length", price: 260 },
      { label: "Shoulder length", price: 250 },
    ],
  },
  {
    slug: "box-braids",
    name: "Box Braids",
    collection: "box-knotless",
    description: "The classic. Clean parts, even sections, built to last.",
    image: "/images/styles/box-braids.jpeg",
    alt: "Black box braids worn past the waist",
    imagePosition: "50% 38%",
    tiers: [
      { label: "Butt length", price: 270 },
      { label: "Waist length", price: 260 },
      { label: "Midback length", price: 245 },
      { label: "Shoulder length", price: 230 },
    ],
  },
  {
    slug: "micro-braids",
    name: "Micro Braids",
    collection: "box-knotless",
    description:
      "The finest braid size on the menu — delicate, detailed, and a long day in the chair.",
    image: "/images/styles/micro-braids.jpeg",
    alt: "Fine micro braids showing detailed parting at the crown",
    imagePosition: "42% 26%",
    tiers: [{ label: "Starts from", price: 300 }],
  },
  {
    slug: "fulani-braids",
    name: "Fulani Braids",
    collection: "cornrows-styled",
    description:
      "Cornrowed patterns at the crown flowing into free-hanging braids.",
    image: "/images/styles/fulani-braids.jpeg",
    alt: "Fulani braids with a cornrowed crown pattern",
    imagePosition: "40% 40%",
    tiers: [
      { label: "Waist length", price: 280 },
      { label: "Midback length", price: 260 },
    ],
  },
  {
    slug: "braided-ponytail",
    name: "Braided Ponytail",
    collection: "cornrows-styled",
    description: "Cornrows swept up into one sculpted, high-set ponytail.",
    image: "/images/styles/ponytail.jpeg",
    alt: "Cornrows gathered into a long braided ponytail",
    imagePosition: "45% 45%",
    tiers: [{ label: "", price: 280 }],
  },
];

/** Lowest price across a style's length and size options. */
export function fromPrice(service: Service): number {
  return Math.min(...service.tiers.map((tier) => tier.price));
}

export function servicesInCollection(id: CollectionId): Service[] {
  return services.filter((service) => service.collection === id);
}
