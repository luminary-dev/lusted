import { img, type ImagePath } from "@/lib/cdn";
import manifest from "@/lib/image-manifest.json";

// The sign-in page's photos (about-wall/admin-login-prompt.txt, one per scene): every photo in the manifest under
// images/admin/back-room-<scene>.webp, each with its own two lines. The door opens on a different one each time; with
// none, it draws a curtain.

const CAPTIONS: Record<string, [script: string, line: string]> = {
  vanity: ["after closing", "She has been waiting since the last customer left. The lights in the mirror are still on."],
  rail: ["the last hanger", "Everything on the rail has been tried on tonight. Not all of it went back."],
  mirror: ["halfway", "Caught between what she wore in and what she’s wearing out. The mirror isn’t telling."],
  slip: ["dropped", "The slip is on the floor and she isn’t picking it up. The next one is yours to choose."],
  corner: ["one lamp", "The last stocking comes off slowly when someone is watching. Someone is."],
  doorway: ["staying?", "One foot in the corridor, one on the frame. She hasn’t decided. Neither have you."],
  chaise: ["the fitting", "Measured twice tonight. The tape says one thing, the way she’s lying says another."],
  boxes: ["new in", "Nothing in these boxes has been worn yet. She is deciding which goes first."],
  window: ["rain", "The shop is shut and it’s raining. She has nowhere to be but here, and nothing to put on."],
  pins: ["pinned", "The dress form wears what she won’t. Every pin is where her hand was a moment ago."],
  screen: ["behind the screen", "What you can see is the silhouette. What you can’t is what she’s taking off."],
  key: ["the key", "She found it on the counter. Now she’s deciding whether to let you have it back."],
};
const FALLBACK: [string, string] = ["after closing", "The shop is shut. The back room never is."];

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
