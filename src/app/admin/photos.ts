import { img, type ImagePath } from "@/lib/cdn";
import manifest from "@/lib/image-manifest.json";

// The sign-in page's photos (about-wall/admin-login-prompt.txt, one per scene): every photo in the manifest under
// images/admin/back-room-<scene>.webp, each with its own two lines. The door opens on a different one each time; with
// none, it draws a curtain.

const CAPTIONS: Record<string, [script: string, line: string]> = {
  vanity: ["after closing", "The bra came off the second the door locked and she hasn’t bothered with the robe since. She knows exactly what she looks like from that stool. She’s counting on it."],
  rail: ["the last hanger", "She tried on every piece on the rail tonight and liked none of them as much as taking them off. Stockings stayed. The rest is on the floor. Look all you like — she’s looking back."],
  mirror: ["halfway", "Straps down, skirt unzipped, nothing under it, and she stopped there on purpose. The mirror’s already had the rest. Come closer and the skirt won’t last the night."],
  slip: ["dropped", "She let the slip fall and didn’t look down. One arm, one hat box, nothing else, and she’s already deciding which one to put down first. Ask nicely and it’s both."],
  corner: ["one lamp", "She rolls the stocking down an inch at a time because you’re watching, and slower because you can’t touch yet. The zip at the back has been open for an hour. She’s been waiting that long."],
  doorway: ["staying?", "Robe open, one foot on the frame, nothing on under it worth mentioning. Say the password and she comes in. Say it wrong and she stays in the doorway, which is worse for you, not her."],
  trunk: ["the trunk", "A trunk of pieces nobody has ever worn, and she’s trying each one against bare skin, deciding what to let you see first. She hasn’t kept a single one on for more than a minute."],
  boxes: ["new in", "Nothing but stockings and a bra she’s holding by one finger like she’s about to drop that too. Everything in those boxes is new and so is this. She’d like to be unwrapped first."],
  key: ["the key", "She found the key on the counter and now she’s holding it just out of reach with the robe open and her legs crossed, making you ask twice. She likes being asked twice."],
  ribbon: ["the ribbon", "Wrists wrapped in a ribbon she could slip in a second. She hasn’t, because she wants to see what you do with a girl who’s decided not to use her hands tonight."],
  shirt: ["whose shirt", "Not her shirt. Unbuttoned to the hem, held shut in one fist and already sliding off the other shoulder. It stays shut for exactly as long as it takes you to ask."],
  front: ["face down", "Face down on the velvet, bottom up, chin in her hands, the bra kicked under the chaise. She isn’t getting up for it and she isn’t getting up for you. Come down here."],
  fan: ["the fan", "Someone left the fan on and she’s losing the fight with the skirt on purpose. One hand on her chest, one barely on the hem, and a look over the glasses that says she’d rather you held it for her."],
};
const FALLBACK: [string, string] = ["after closing", "The shop is shut. The back room never is, and neither is she."];

// a scene may also have a wide photo (images/admin/door-wide-<scene>.webp, 16:9, her on the left, the right of the
// room dark and empty): on a wide screen it then fills the whole door and the form sits on its dark side
export type DoorPhoto = { src: ReturnType<typeof img>; wide: ReturnType<typeof img> | null; script: string; line: string };

const keys = Object.keys(manifest.images) as ImagePath[];
const scenes = new Set(keys.map((key) => key.match(/^images\/admin\/(?:back-room|door-wide)-(.+)\.webp$/)?.[1]).filter((s): s is string => !!s));
const photos: DoorPhoto[] = [...scenes].map((scene) => {
  const [script, line] = CAPTIONS[scene] ?? FALLBACK;
  const portraitKey = `images/admin/back-room-${scene}.webp`;
  const wideKey = `images/admin/door-wide-${scene}.webp`;
  const wide = wideKey in manifest.images ? img(wideKey as ImagePath) : null;
  // a scene with only a wide photo shows its left side on phones
  const src = portraitKey in manifest.images ? img(portraitKey as ImagePath) : wide!;
  return { src, wide, script, line };
});

// which one tonight — the page is rendered per request (connection()), so this is a fresh draw each visit; it lives
// outside any component because a render itself has to stay pure
export const tonight = (): DoorPhoto | null => (photos.length ? photos[Math.floor(Math.random() * photos.length)] : null);
