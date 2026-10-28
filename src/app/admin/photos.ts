import catalog from "@/lib/catalog.json";
import { img, type ImagePath } from "@/lib/cdn";
import manifest from "@/lib/image-manifest.json";
import { categories } from "@/lib/products";

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
};
const FALLBACK: [string, string] = ["after closing", "The shop is shut. The back room never is."];

export type DoorPhoto = { src: ReturnType<typeof img>; script: string; line: string };

const photos: DoorPhoto[] = (Object.keys(manifest.images) as ImagePath[])
  .map((key) => ({ key, scene: key.match(/^images\/admin\/back-room-(.+)\.webp$/)?.[1] }))
  .filter((p): p is { key: ImagePath; scene: string } => !!p.scene)
  .map(({ key, scene }) => {
    const [script, line] = CAPTIONS[scene] ?? FALLBACK;
    return { src: img(key), script, line };
  });

// the shop's figures for the door, from the catalogue baked into the deploy (the room reads the live ones)
export const figures: Array<{ value: number; label: string }> = [
  { value: catalog.length, label: "pieces" },
  ...categories.map((c) => ({ value: catalog.filter((p) => p.category === c.key).length, label: c.name })),
];

// which one tonight — the page is rendered per request (connection()), so this is a fresh draw each visit; it lives
// outside any component because a render itself has to stay pure
export const tonight = (): DoorPhoto | null => (photos.length ? photos[Math.floor(Math.random() * photos.length)] : null);
