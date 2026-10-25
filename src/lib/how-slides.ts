import type { HowSlide } from "@/components/HowSlides";
import how01 from "@/assets/images/how/how-01.webp";
import how02 from "@/assets/images/how/how-02.webp";
import how03 from "@/assets/images/how/how-03.webp";
import how04 from "@/assets/images/how/how-04.webp";
import how05 from "@/assets/images/how/how-05.webp";
import how06 from "@/assets/images/how/how-06.webp";
import how07 from "@/assets/images/how/how-07.webp";
import how08 from "@/assets/images/how/how-08.webp";
import how09 from "@/assets/images/how/how-09.webp";
import howPhone01 from "@/assets/images/how-phone/how-01.webp";
import howPhone02 from "@/assets/images/how-phone/how-02.webp";
import howPhone03 from "@/assets/images/how-phone/how-03.webp";
import howPhone04 from "@/assets/images/how-phone/how-04.webp";
import howPhone05 from "@/assets/images/how-phone/how-05.webp";
import howPhone06 from "@/assets/images/how-phone/how-06.webp";
import howPhone07 from "@/assets/images/how-phone/how-07.webp";
import howPhone08 from "@/assets/images/how-phone/how-08.webp";
import howPhone09 from "@/assets/images/how-phone/how-09.webp";

// The photos behind "How it works" (src/assets/images/how), in the order they play, numbered to match the folder and
// ordered so no two neighbours share a colour story (the loop wraps). All are 16:9 with the models in the left ~60%,
// so the section's crop (.how-img) and fade (.how-media::after) suit every one of them. `phone` is the 4:3 cut phones show
// (src/assets/images/how-phone), so they don't download the wide one.
export const howSlides: HowSlide[] = [
  { src: how01, phone: howPhone01, alt: "Three models in a blush lace lingerie set, a crimson string bikini and a black sequin mini dress on a villa terrace at sunset" },
  { src: how02, phone: howPhone02, alt: "Three models tangled together on the marble slab of a candlelit hammam, in a gold string bikini, a sheer black teddy and a wet white silk dress" },
  { src: how03, phone: howPhone03, alt: "Three models in micro string bikinis bent over a boardroom table at night, looking back at the camera over the city lights" },
  { src: how04, phone: howPhone04, alt: "Four models in lace lingerie and a wine bikini in a candlelit marble bath scattered with rose petals" },
  { src: how05, phone: howPhone05, alt: "Three models in after-party dresses in an all-night laundromat, one sitting in a laundry cart" },
  { src: how06, phone: howPhone06, alt: "Three models in lingerie and an open dress on a velvet daybed in a rain-streaked glass conservatory at night" },
  { src: how07, phone: howPhone07, alt: "Models in lace lingerie wrapped around each other at the pole of an empty subway carriage at night" },
  { src: how08, phone: howPhone08, alt: "Three models in a gold bikini, lace lingerie and a black dress on a blanket beside a driftwood bonfire at night" },
  { src: how09, phone: howPhone09, alt: "Three models kneeling at the edge of a villa pool at dusk in a white string bikini, a blush lace bodysuit and a wine laced dress" },
];
