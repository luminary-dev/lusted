// What's printed on a swing tag, drawn on canvases with the site's own fonts: the front (size in script, a gold rule,
// the measurements) and the laminated wine back (wordmark, size, the tease line). Each face is drawn once per channel —
// colour, emboss height, roughness and metalness — and the three data channels are packed into one texture, which is
// how three.js reads them. Pure drawing; SizeTags3D.tsx owns the textures and decides when to print.

export type TagData = {
  size: string;
  lines: [string, string][];
  tease: string;
};

export type Mode = "color" | "height" | "rough" | "metal";
type Ink = "paper" | "card" | "ink" | "muted" | "rule" | "foil" | "blush" | "cream";

// what each "ink" looks like in each channel: colour / height (128 = flat) / roughness / metalness
const INK: Record<Ink, Record<Mode, string>> = {
  paper: { color: "#fbf5f1", height: "", rough: "rgb(232,232,232)", metal: "#000" },
  card: { color: "", height: "", rough: "rgb(150,150,150)", metal: "#000" },
  ink: { color: "#2e1418", height: "rgb(92,92,92)", rough: "rgb(150,150,150)", metal: "#000" },
  // the small labels: dark enough to read at a glance, not just a tint on the paper
  muted: { color: "#5e3b42", height: "rgb(100,100,100)", rough: "rgb(170,170,170)", metal: "#000" },
  rule: { color: "rgba(122,27,51,0.28)", height: "rgb(112,112,112)", rough: "rgb(200,200,200)", metal: "#000" },
  foil: { color: "#e3bd82", height: "rgb(176,176,176)", rough: "rgb(52,52,52)", metal: "#fff" },
  blush: { color: "#f5c2b8", height: "rgb(100,100,100)", rough: "rgb(140,140,140)", metal: "#000" },
  cream: { color: "#fff6f2", height: "rgb(100,100,100)", rough: "rgb(140,140,140)", metal: "#000" },
};
const WINE = "#7a1b33";

// the site's own font families, resolved from the CSS variables and loaded at the weights the print uses
export async function resolveFonts() {
  const probe = document.createElement("span");
  document.body.appendChild(probe);
  probe.style.fontFamily = "var(--headline)";
  const script = getComputedStyle(probe).fontFamily;
  probe.style.fontFamily = "var(--sans)";
  const sans = getComputedStyle(probe).fontFamily;
  probe.remove();
  await Promise.all([
    document.fonts.load(`400 120px ${script}`),
    document.fonts.load(`500 40px ${sans}`),
    document.fonts.load(`600 40px ${sans}`),
  ]).catch(() => {});
  return { script, sans };
}

// paper fibre, drawn once and reused as the base of every height map
export function drawFibre(DW: number, DH: number) {
  const fibre = document.createElement("canvas");
  fibre.width = DW;
  fibre.height = DH;
  const f = fibre.getContext("2d")!;
  f.fillStyle = "rgb(128,128,128)";
  f.fillRect(0, 0, DW, DH);
  for (let i = 0; i < 9000; i++) {
    const v = 100 + Math.random() * 56;
    f.strokeStyle = `rgba(${v},${v},${v},0.5)`;
    f.lineWidth = Math.random() * 1.2 + 0.3;
    const x = Math.random() * DW,
      y = Math.random() * DH,
      a = Math.random() * Math.PI,
      l = 2 + Math.random() * 7;
    f.beginPath();
    f.moveTo(x, y);
    f.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    f.stroke();
  }
  return fibre;
}

const setFont = (c: CanvasRenderingContext2D, weight: string, px: number, family: string, spacing = 0) => {
  c.font = `${weight} ${px}px ${family}`;
  (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
};
// The largest size up to `px` at which the text fits `max`. It measures the ink, not just the advance: a script's
// swashes reach past the advance, and the size on a tag is set in the script.
const fitFont = (c: CanvasRenderingContext2D, text: string, weight: string, px: number, family: string, max: number) => {
  const wide = () => {
    const m = c.measureText(text);
    return Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
  };
  let size = px;
  do setFont(c, weight, size, family);
  while (wide() > max && --size > 16);
};
// the widest a size may print on either face: the width of the dashed rules under it, less a margin each side, so even
// XXL (at full size twice as wide as XS, and wider than the card on the back) sits on the card with air around it
const SIZE_MAX = 440;

export type Paint = (c: CanvasRenderingContext2D, tag: TagData, mode: Mode, w: number, h: number) => void;

// the two faces, each drawn in one channel at a time. `k` scales the 640-wide design to the canvas.
export function makePainter({ script, sans, fibre }: { script: string; sans: string; fibre: HTMLCanvasElement }) {
  const paintFront: Paint = (c, tag, mode, w, h) => {
    const k = w / 640;
    const ink = (i: Ink) => (i === "ink" && mode === "color" ? WINE : INK[i][mode]);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (mode === "height") c.drawImage(fibre, 0, 0, w, h);
    else {
      c.fillStyle = INK.paper[mode];
      c.fillRect(0, 0, w, h);
    }
    if (mode === "color") {
      for (let i = 0; i < 2400 * k * k; i++) {
        c.fillStyle = `rgba(122,70,70,${Math.random() * 0.03})`;
        c.fillRect(Math.random() * w, Math.random() * h, 1.6 * k, 1.6 * k);
      }
    }
    c.scale(k, k);
    c.textAlign = "center";
    // size in script, then a short gold-foil rule
    c.fillStyle = ink("ink");
    fitFont(c, tag.size, "400", 168, script, SIZE_MAX);
    c.fillText(tag.size, 320, 350);
    c.fillStyle = INK.foil[mode];
    c.fillRect(270, 384, 100, 3);

    const top = 420,
      bottom = 1088 - 104;
    const row = Math.min(162, (bottom - top) / tag.lines.length);
    let y = top + (bottom - top - row * tag.lines.length) / 2;
    const rule = (yy: number) => {
      c.strokeStyle = INK.rule[mode];
      c.lineWidth = 2;
      c.setLineDash([7, 7]);
      c.beginPath();
      c.moveTo(78, yy);
      c.lineTo(562, yy);
      c.stroke();
      c.setLineDash([]);
    };
    rule(y);
    tag.lines.forEach(([label, value]) => {
      c.fillStyle = INK.muted[mode];
      setFont(c, "700", 36, sans, 5);
      c.fillText(label.toUpperCase(), 323, y + row * 0.36);
      c.fillStyle = mode === "color" ? "#24100f" : INK.ink[mode];
      fitFont(c, value, "600", 70, sans, 520);
      c.fillText(value, 320, y + row * 0.82);
      y += row;
      rule(y);
    });
    c.fillStyle = INK.foil[mode];
    setFont(c, "600", 22, sans, 10);
    c.fillText("LUSTED", 325, 1088 - 50);
  };

  const paintBack: Paint = (c, tag, mode, w, h) => {
    const k = w / 640;
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (mode === "color") {
      const g = c.createLinearGradient(0, 0, w * 0.6, h);
      g.addColorStop(0, "#8f2444");
      g.addColorStop(1, "#43091a");
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      const glow = c.createRadialGradient(w * 0.3, h * 0.15, 0, w * 0.3, h * 0.15, w);
      glow.addColorStop(0, "rgba(245,194,184,0.22)");
      glow.addColorStop(1, "rgba(245,194,184,0)");
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
    } else if (mode === "height") {
      c.fillStyle = "rgb(128,128,128)";
      c.fillRect(0, 0, w, h);
    } else {
      c.fillStyle = INK.card[mode];
      c.fillRect(0, 0, w, h);
    }
    c.scale(k, k);
    c.textAlign = "center";
    c.fillStyle = INK.foil[mode];
    setFont(c, "600", 26, sans, 14);
    c.fillText("LUSTED", 327, 330);
    c.fillRect(250, 366, 140, 2.5);
    fitFont(c, tag.size, "400", 236, script, SIZE_MAX);
    c.fillText(tag.size, 320, 650);
    c.fillStyle = INK.blush[mode];
    setFont(c, "400", 52, script);
    const words = tag.tease.split(" ");
    const out: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (c.measureText(next).width > 520 && line) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
    out.forEach((l, i) => c.fillText(l, 320, 790 + i * 74));
    c.fillStyle = INK.foil[mode];
    c.fillRect(300, 960, 40, 2.5);
  };

  return { paintFront, paintBack };
}

// pack height (R), roughness (G) and metalness (B) into one texture — the channels three.js reads them from
export function dataPacker(DW: number, DH: number) {
  const scratch = [0, 1, 2].map(() => {
    const c = document.createElement("canvas");
    c.width = DW;
    c.height = DH;
    return c.getContext("2d", { willReadFrequently: true })!;
  });
  return (target: CanvasRenderingContext2D, paint: Paint, tag: TagData) => {
    (["height", "rough", "metal"] as const).forEach((m, i) => paint(scratch[i], tag, m, DW, DH));
    const [hd, rd, md] = scratch.map((c) => c.getImageData(0, 0, DW, DH).data);
    const outImg = target.createImageData(DW, DH);
    const o = outImg.data;
    for (let i = 0; i < o.length; i += 4) {
      o[i] = hd[i];
      o[i + 1] = rd[i];
      o[i + 2] = md[i];
      o[i + 3] = 255;
    }
    target.putImageData(outImg, 0, 0);
  };
}
