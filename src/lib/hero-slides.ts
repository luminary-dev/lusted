import type { HeroSlide } from "@/components/HeroSlides";
import main01 from "@/assets/images/hero/main/main-01.webp";
import main02 from "@/assets/images/hero/main/main-02.webp";
import main03 from "@/assets/images/hero/main/main-03.webp";
import main04 from "@/assets/images/hero/main/main-04.webp";
import main05 from "@/assets/images/hero/main/main-05.webp";
import main06 from "@/assets/images/hero/main/main-06.webp";
import main07 from "@/assets/images/hero/main/main-07.webp";
import main08 from "@/assets/images/hero/main/main-08.webp";
import main09 from "@/assets/images/hero/main/main-09.webp";
import main10 from "@/assets/images/hero/main/main-10.webp";
import main11 from "@/assets/images/hero/main/main-11.webp";
import main12 from "@/assets/images/hero/main/main-12.webp";
import main13 from "@/assets/images/hero/main/main-13.webp";
import main14 from "@/assets/images/hero/main/main-14.webp";
import main15 from "@/assets/images/hero/main/main-15.webp";
import main16 from "@/assets/images/hero/main/main-16.webp";
import main17 from "@/assets/images/hero/main/main-17.webp";
import main18 from "@/assets/images/hero/main/main-18.webp";
import main19 from "@/assets/images/hero/main/main-19.webp";
import main20 from "@/assets/images/hero/main/main-20.webp";
import main21 from "@/assets/images/hero/main/main-21.webp";
import main22 from "@/assets/images/hero/main/main-22.webp";
import main23 from "@/assets/images/hero/main/main-23.webp";
import main24 from "@/assets/images/hero/main/main-24.webp";
import main25 from "@/assets/images/hero/main/main-25.webp";
import main26 from "@/assets/images/hero/main/main-26.webp";
import main27 from "@/assets/images/hero/main/main-27.webp";
import dark01 from "@/assets/images/hero/after-dark/after-dark-01.webp";
import dark02 from "@/assets/images/hero/after-dark/after-dark-02.webp";
import dark03 from "@/assets/images/hero/after-dark/after-dark-03.webp";
import dark04 from "@/assets/images/hero/after-dark/after-dark-04.webp";
import dark05 from "@/assets/images/hero/after-dark/after-dark-05.webp";
import dark06 from "@/assets/images/hero/after-dark/after-dark-06.webp";
import dark07 from "@/assets/images/hero/after-dark/after-dark-07.webp";
import dark08 from "@/assets/images/hero/after-dark/after-dark-08.webp";
import dark09 from "@/assets/images/hero/after-dark/after-dark-09.webp";
import dark10 from "@/assets/images/hero/after-dark/after-dark-10.webp";
import dark11 from "@/assets/images/hero/after-dark/after-dark-11.webp";
import dark12 from "@/assets/images/hero/after-dark/after-dark-12.webp";
import dark13 from "@/assets/images/hero/after-dark/after-dark-13.webp";
import dark14 from "@/assets/images/hero/after-dark/after-dark-14.webp";
import dark15 from "@/assets/images/hero/after-dark/after-dark-15.webp";
import dark16 from "@/assets/images/hero/after-dark/after-dark-16.webp";
import dark17 from "@/assets/images/hero/after-dark/after-dark-17.webp";
import dark18 from "@/assets/images/hero/after-dark/after-dark-18.webp";
import dark19 from "@/assets/images/hero/after-dark/after-dark-19.webp";
import dark20 from "@/assets/images/hero/after-dark/after-dark-20.webp";
import dark21 from "@/assets/images/hero/after-dark/after-dark-21.webp";
import dark22 from "@/assets/images/hero/after-dark/after-dark-22.webp";
import dark23 from "@/assets/images/hero/after-dark/after-dark-23.webp";
import dark24 from "@/assets/images/hero/after-dark/after-dark-24.webp";
import dark25 from "@/assets/images/hero/after-dark/after-dark-25.webp";
import dark26 from "@/assets/images/hero/after-dark/after-dark-26.webp";
import dark27 from "@/assets/images/hero/after-dark/after-dark-27.webp";
import dark28 from "@/assets/images/hero/after-dark/after-dark-28.webp";
import dark29 from "@/assets/images/hero/after-dark/after-dark-29.webp";
import dark30 from "@/assets/images/hero/after-dark/after-dark-30.webp";
import dark31 from "@/assets/images/hero/after-dark/after-dark-31.webp";
import dark32 from "@/assets/images/hero/after-dark/after-dark-32.webp";
import dark33 from "@/assets/images/hero/after-dark/after-dark-33.webp";
import dark34 from "@/assets/images/hero/after-dark/after-dark-34.webp";
import dark35 from "@/assets/images/hero/after-dark/after-dark-35.webp";
import dark36 from "@/assets/images/hero/after-dark/after-dark-36.webp";
import dark37 from "@/assets/images/hero/after-dark/after-dark-37.webp";
import dark38 from "@/assets/images/hero/after-dark/after-dark-38.webp";
import dark39 from "@/assets/images/hero/after-dark/after-dark-39.webp";
import dark40 from "@/assets/images/hero/after-dark/after-dark-40.webp";

// The home page's campaign photos (Krea 2, enhanced 2× with scripts/enhance-images.mjs, converted with scripts/hero-webp.mjs).
// Each list is in the order it plays, numbered to match its folder, and ordered so no two neighbours share a colour story
// (each loop wraps from its last photo to its first). The two bands never show the same photo.
//
// pos / posMobile are the crop focal points: where the model stands, as object-position. In the top hero they keep her face
// clear of the headline on desktop and put her in the centre of the phone crop (the phone shows ~30% of the width, so
// posMobile ≈ (x − 15%) / 70% where x is where she stands). The filmstrip only uses posMobile, to centre its tall crops on her.

/** The top of the home page: the close, medium-shot photos (src/assets/images/hero/main). */
export const heroSlides: HeroSlide[] = [
  { src: main01, alt: "Model reclining on blush satin pillows in a pink lace bra, brief and suspenders", pos: "72% 25%", posMobile: "80% 25%" },
  { src: main02, alt: "Model kneeling in the turquoise water of a sea cave at sunset in an oil-slick chrome bikini with a crystal body chain and a gold net cape", pos: "72% 20%", posMobile: "86% 20%" },
  { src: main03, alt: "Model in an ivory string bikini on the deck of a yacht at golden hour", pos: "72% 25%", posMobile: "80% 25%" },
  { src: main04, alt: "Model kneeling on a velvet chaise in a wine lace bodysuit with garters", pos: "0% 20%", posMobile: "60% 20%" },
  { src: main05, alt: "Model kneeling on champagne silk sheets by candlelight in a black string harness", pos: "72% 20%", posMobile: "64% 20%" },
  { src: main06, alt: "Model by a window in a blush silk robe over a lace bralette", pos: "0% 25%", posMobile: "55% 25%" },
  { src: main07, alt: "Model in a crimson string bikini kneeling in the surf at golden hour", pos: "0% 20%", posMobile: "65% 20%" },
  { src: main08, alt: "Model on a brass spiral stair under a mirror ball in a wine mirror-disc chainmail mini dress", pos: "72% 20%", posMobile: "76% 20%" },
  { src: main09, alt: "Model in a champagne sequin slip dress on a velvet chaise by candlelight", pos: "72% 25%", posMobile: "84% 25%" },
  { src: main10, alt: "Model in an emerald micro string bikini on sunlit rocks above a turquoise cove", pos: "72% 20%", posMobile: "68% 25%" },
  { src: main11, alt: "Model in a sheer black lace bodysuit and chiffon robe on the rim of a marble bathtub by candlelight", pos: "72% 20%", posMobile: "68% 20%" },
  { src: main12, alt: "Model in an ivory lace bustier, stockings and a flowing chiffon robe on a terrace at dusk", pos: "0% 20%", posMobile: "58% 20%" },
  { src: main13, alt: "Model in a blush lace bra, lace skirt and stockings on a velvet chaise in a sunlit bedroom", pos: "72% 20%", posMobile: "85% 20%" },
  { src: main14, alt: "Model in a plunging gold swimsuit at the edge of an infinity pool at sunset", pos: "0% 20%", posMobile: "66% 20%" },
  { src: main15, alt: "Model on wine velvet cushions by candlelight in a ruby lace bra", pos: "72% 25%", posMobile: "72% 25%" },
  { src: main16, alt: "Model lying back across a black-sheeted bed above the city lights in a sheer black mesh teddy and suspenders, her head tipped over the edge", pos: "72% 70%", posMobile: "39% 70%" },
  { src: main17, alt: "Model crouching low in a backless wine silk gown slit to the hip in an empty candlelit lounge", pos: "60% 20%", posMobile: "50% 20%" },
  { src: main18, alt: "Model in a black fishnet bodystocking lying across an ivory silk bed at golden hour", pos: "50% 40%", posMobile: "58% 50%" },
  { src: main19, alt: "Model lying on a white fur rug by a roaring fire in a wine lace bra, G-string and stockings", pos: "72% 25%", posMobile: "86% 25%" },
  { src: main20, alt: "Model on the edge of a hotel bed at breakfast in a champagne satin slip gown slit to the hip, a strawberry at her lips", pos: "72% 20%", posMobile: "79% 20%" },
  { src: main21, alt: "Model kneeling on an empty dance floor under blue lasers in an unzipped wet-look micro dress and thigh boots", pos: "72% 20%", posMobile: "76% 20%" },
  { src: main22, alt: "Model lying in a rope hammock at golden hour in a sheer blush robe fallen open over lace", pos: "72% 30%", posMobile: "93% 30%" },
  { src: main23, alt: "Model leaning in a hotel suite doorway at 4 am in a wine satin dress laced open from collar to hem", pos: "72% 20%", posMobile: "81% 20%" },
  { src: main24, alt: "Model under an outdoor shower among the palms in a sea-green string bikini, looking back over her shoulder", pos: "72% 25%", posMobile: "90% 25%" },
  { src: main25, alt: "Model lying in a wildflower meadow in an unbuttoned white shirt and a white G-string, a flower stem between her lips", pos: "72% 55%", posMobile: "64% 55%" },
  { src: main26, alt: "Model lying on her stomach on a sheepskin at the foot of the bed in a sheer blush babydoll", pos: "72% 25%", posMobile: "58% 25%" },
  { src: main27, alt: "Model sitting on a marble staircase under a chandelier in a red dress of nothing but satin straps", pos: "72% 20%", posMobile: "79% 20%" },
];

/** The After Dark filmstrip in the middle of the home page: the full-length and wider photos (src/assets/images/hero/after-dark). */
export const afterDarkSlides: HeroSlide[] = [
  { src: dark01, alt: "Model standing in a sunflower field at golden hour in low-waist denim micro shorts and big glasses", pos: "72% 15%", posMobile: "76% 15%" },
  { src: dark02, alt: "Model walking through a white gallery in a sheer black crystal-scattered naked gown", pos: "72% 15%", posMobile: "86% 15%" },
  { src: dark03, alt: "Model with one foot on a stone fountain in a lemon-tree courtyard in an ivory silk sarong and bikini top", pos: "72% 18%", posMobile: "88% 18%" },
  { src: dark04, alt: "Model crouching at the edge of an infinity pool at sunset in a wine patent string bikini", pos: "72% 20%", posMobile: "67% 20%" },
  { src: dark05, alt: "Model on a rooftop parapet at dawn in a champagne satin set, a sheer chiffon robe flying in the wind", pos: "72% 15%", posMobile: "84% 15%" },
  { src: dark06, alt: "Model sitting on a marble fountain in a hotel lobby at night in a black leather belt skirt and bra", pos: "72% 20%", posMobile: "79% 20%" },
  { src: dark07, alt: "Model at a lake palace balustrade at dusk in a sheer emerald saree with a gold border and no blouse", pos: "72% 12%", posMobile: "88% 12%" },
  { src: dark08, alt: "Model in a nude-illusion bodysuit embroidered with wine velvet orchids, in a lantern-lit glasshouse full of orchids", pos: "72% 20%", posMobile: "76% 20%" },
  { src: dark09, alt: "Model sitting in the open door of a limousine on a wet street in a crimson string dress", pos: "72% 25%", posMobile: "66% 25%" },
  { src: dark10, alt: "Model standing in a lotus pond at dusk in a sheer ivory draped dhoti and silver mirror medallions", pos: "72% 15%", posMobile: "84% 15%" },
  { src: dark11, alt: "Model sitting on the bonnet of a car under red and blue light in a patent officer's outfit and thigh boots", pos: "72% 15%", posMobile: "75% 15%" },
  { src: dark12, alt: "Model in a wine satin cami and mini skirt leaning on a balcony rail above the city lights at night", pos: "72% 20%", posMobile: "78% 20%" },
  { src: dark13, alt: "Model climbing whitewashed Santorini steps in a white crochet bikini, looking back over her shoulder", pos: "72% 12%", posMobile: "84% 12%" },
  { src: dark14, alt: "Model between hanging lengths of indigo cloth in an open sheer ivory chikankari kurta", pos: "72% 15%", posMobile: "84% 15%" },
  { src: dark15, alt: "Model at the end of a misty lake dock at dawn in a sheer blush chiffon maxi skirt and satin bra", pos: "72% 15%", posMobile: "84% 15%" },
  { src: dark16, alt: "Model at the water's edge on a black volcanic beach at sunset in a molten-bronze cage monokini", pos: "72% 20%", posMobile: "78% 20%" },
  { src: dark17, alt: "Model dusting a high shelf in a tiny black satin maid's apron, stockings and lace cuffs", pos: "72% 15%", posMobile: "84% 15%" },
  { src: dark18, alt: "Model by a fountain in a teal frescoed haveli courtyard in a sheer lehenga and mirror-work medallions", pos: "72% 20%", posMobile: "82% 20%" },
  { src: dark19, alt: "Model sitting on a cloister wall of an ivy-covered quad in a tartan micro kilt, cropped sweater and knee socks", pos: "72% 20%", posMobile: "82% 20%" },
  { src: dark20, alt: "Model in a black string bikini on the deck of a yacht at golden hour, looking back over her shoulder", pos: "72% 20%", posMobile: "76% 20%" },
  { src: dark21, alt: "Model sitting on a marble kitchen island by fridge light in a sheer blush babydoll, eating a strawberry", pos: "72% 20%", posMobile: "84% 20%" },
  { src: dark22, alt: "Model at a rooftop bar above the city lights in a black satin dress tied only at the sides", pos: "72% 20%", posMobile: "87% 20%" },
  { src: dark23, alt: "Model spinning in a vineyard at golden hour in a gold beaded fringe skirt and top", pos: "72% 15%", posMobile: "79% 15%" },
  { src: dark24, alt: "Model with one foot on the edge of a candlelit marble bath in a glossy wine latex set, pearl harness and stockings", pos: "72% 20%", posMobile: "77% 20%" },
  { src: dark25, alt: "Model sitting on an examination couch in an unzipped white PVC nurse dress and white stockings", pos: "72% 15%", posMobile: "89% 15%" },
  { src: dark26, alt: "Model kneeling on a velvet cushion in a candlelit stone hall in a black satin habit, veil and stockings", pos: "72% 20%", posMobile: "70% 20%" },
  { src: dark27, alt: "Model on a marble jharokha balcony at sunset in big glasses and a sheer blush dupatta with a gold border", pos: "72% 12%", posMobile: "79% 12%" },
  { src: dark28, alt: "Model in a soaked black draped gown slit to the hip beside a vintage car under a hotel awning in the rain at night", pos: "72% 20%", posMobile: "88% 20%" },
  { src: dark29, alt: "Model in an empty gilded ballroom in a wine satin gown open to the base of her spine", pos: "72% 10%", posMobile: "93% 10%" },
  { src: dark30, alt: "Model on a brass library ladder in an emerald velvet harness set and stockings, seen from below", pos: "72% 15%", posMobile: "79% 15%" },
  { src: dark31, alt: "Model beside a vintage scooter in a cobbled lane at night in a black latex micro skirt and stockings", pos: "72% 15%", posMobile: "84% 15%" },
  { src: dark32, alt: "Model lying across the lid of a candlelit grand piano in a wine satin chemise and stockings, seen from above", pos: "72% 25%", posMobile: "76% 20%" },
  { src: dark33, alt: "Model on a country-house lawn at golden hour in big glasses, holding down her white pleated mini skirt in the wind", pos: "72% 15%", posMobile: "90% 15%" },
  { src: dark34, alt: "Model in the monsoon rain on a palace rooftop in a sheer wine saree with a gold border", pos: "72% 15%", posMobile: "82% 15%" },
  { src: dark35, alt: "Model on a cabaret stage in satin bunny ears, a black corset, cuffs and stockings", pos: "72% 15%", posMobile: "79% 15%" },
  { src: dark36, alt: "Model kneeling on carpets at the mouth of a lantern-lit desert tent in a sheer midnight-blue saree", pos: "72% 20%", posMobile: "82% 20%" },
  { src: dark37, alt: "Model leaning on a roulette table in an ivory bandage micro dress laced open to the navel", pos: "72% 12%", posMobile: "83% 12%" },
  { src: dark38, alt: "Model on a fitting platform in a couture atelier in a wine satin micro skirt laced open at the sides", pos: "72% 20%", posMobile: "88% 20%" },
  { src: dark39, alt: "Model on a gold throne in a torchlit sandstone hall in a chain skirt and gold jewellery", pos: "72% 20%", posMobile: "76% 20%" },
  { src: dark40, alt: "Model sitting on an office desk at midnight in an open white shirt, loosened tie and grey pencil skirt", pos: "72% 20%", posMobile: "84% 20%" },
];
