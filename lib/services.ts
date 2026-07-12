export type Service = {
  number: string;
  name: string;
  priceFrom: string;
  duration: string;
  description: string;
  image: string;
  imageAlt: string;
};

export const services: Service[] = [
  {
    number: "01",
    name: "Knotless Braids",
    priceFrom: "from $220",
    duration: "5–7 hrs",
    description:
      "Featherweight knotless in your choice of length and size. Gentle tension, clean parts, scalp-first installs that last 6–8 weeks.",
    image: "/images/hero-model.jpg",
    imageAlt: "Long knotless braids in soft, warm light",
  },
  {
    number: "02",
    name: "Boho & Goddess",
    priceFrom: "from $280",
    duration: "6–8 hrs",
    description:
      "Knotless with curly ends or human-hair pieces woven through — soft, romantic, and made to move. Perfect for weddings and getaways.",
    image: "/images/service-boho.jpg",
    imageAlt: "Boho & Goddess braids with curly ends",
  },
  {
    number: "03",
    name: "Stitch Feed-Ins & Fulani",
    priceFrom: "from $180",
    duration: "3–5 hrs",
    description:
      "Sleek, sculpted cornrow patterns — stitch feed-ins, fulani with beads, or a fully custom design. Finished with gold cuffs on request.",
    image: "/images/service-stitch.jpg",
    imageAlt: "Sculpted stitch feed-in cornrow pattern",
  },
];
