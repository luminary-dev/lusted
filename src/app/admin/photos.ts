import { img, type ImagePath } from "@/lib/cdn";
import manifest from "@/lib/image-manifest.json";

// The sign-in page's photos (about-wall/admin-login-prompt.txt, one per scene): every photo in the manifest under
// images/admin/back-room-*.webp. The door opens on a different one each time; with none, it draws a curtain.
const photos = (Object.keys(manifest.images) as ImagePath[]).filter((key) => /^images\/admin\/back-room-.*\.webp$/.test(key)).map((key) => img(key));

// which one tonight — the page is rendered per request (instant = false), so this is a fresh draw each visit; it
// lives outside any component because a render itself has to stay pure
export const tonight = () => (photos.length ? photos[Math.floor(Math.random() * photos.length)] : null);
