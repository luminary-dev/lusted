"use client";

import { useEffect, useRef } from "react";
import { installPCSS } from "@/lib/three-pcss";

export type TagData = {
  size: string;
  lines: [string, string][];
  tease: string;
};

type Api = { setTags: (tags: TagData[]) => void };



// Photo-real swing tags, rendered live with three.js (loaded only in the browser).
//  · thick luxury card stock: paper-fibre texture, debossed ink, gold-foil rule and wordmark (real metal, reflects the room)
//  · laminated wine backs with a satin clear-coat and gold-foil size + wordmark
//  · gold eyelets with flanges, a satin string looped through each hole and knotted onto a satin cord
//  · soft studio light with blurred shadows on the wall and on each other
//  · calm, well-damped spring physics: a light breeze, a nudge when the pointer brushes past, a soft sway when the
//    page scrolls (capped, so they never wind up and spin), and a tap / click
//    turns a tag over on its string. The camera drifts with the pointer for depth.
// The stage bleeds past its column (CSS), so the cord runs from the photo to the edge of the screen and nothing swings
// into a hard edge; `--pad` is the invisible headroom above and below. The HTML tags in SizeGuide.tsx stay for screen
// readers and as the fallback without WebGL.
export default function SizeTags3D({
  tags,
  onReady,
}: {
  tags: TagData[];
  onReady: (ok: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const latest = useRef(tags);
  const ready = useRef(onReady);

  useEffect(() => {
    ready.current = onReady;
  }, [onReady]);

  useEffect(() => {
    latest.current = tags;
    api.current?.setTags(tags);
  }, [tags]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } =
        await import("three/examples/jsm/environments/RoomEnvironment.js");
      const { RectAreaLightUniformsLib } =
        await import("three/examples/jsm/lights/RectAreaLightUniformsLib.js");
      RectAreaLightUniformsLib.init();
      installPCSS(THREE);
      const el = host.current;
      if (disposed || !el) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
      } catch {
        ready.current(false);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping; // keeps the print colours true
      renderer.toneMappingExposure = 1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.BasicShadowMap; // filtered by our PCSS (see installPCSS)
      el.appendChild(renderer.domElement);

      const disposables: { dispose: () => void }[] = [];
      const keep = <T extends { dispose: () => void }>(x: T) => (
        disposables.push(x),
        x
      );

      const scene = new THREE.Scene();
      const pmrem = keep(new THREE.PMREMGenerator(renderer));
      scene.environment = keep(
        pmrem.fromScene(new RoomEnvironment(), 0.04).texture,
      );
      scene.environmentIntensity = 0.5;

      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

      // ── studio light ──
      scene.add(new THREE.HemisphereLight(0xfff4ef, 0xc9998d, 0.32));
      const key = new THREE.DirectionalLight(0xfff0e6, 3.1);
      key.position.set(-5.5, 6.5, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.bias = -0.0004;
      key.shadow.normalBias = 0.015;
      Object.assign(key.shadow.camera, {
        left: -9,
        right: 9,
        top: 4,
        bottom: -5,
        near: 0.5,
        far: 25,
      });
      scene.add(key);
      scene.add(key.target);
      const fill = new THREE.DirectionalLight(0xffe6dc, 0.22);
      fill.position.set(5, 1, 6);
      scene.add(fill);
      // a big soft studio softbox: broad, believable highlights on the foil, eyelets and laminated backs
      const softbox = new THREE.RectAreaLight(0xfff2ea, 3.2, 5, 3.2);
      softbox.position.set(-2.4, 3.2, 5);
      softbox.lookAt(0, -1, 0);
      scene.add(softbox);
      const rim = new THREE.DirectionalLight(0xffc4b6, 0.9);
      rim.position.set(3, 4, -5);
      scene.add(rim);

      // the wall the shadows fall on (only the shadows show — the page colour stays behind)
      const wall = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(80, 30)),
        keep(new THREE.ShadowMaterial({ opacity: 0.17 })),
      );
      wall.position.z = -0.32;
      const shadowFor = () =>
        document.documentElement.dataset.theme === "dark" ? 0.26 : 0.1;
      (wall.material as InstanceType<typeof THREE.ShadowMaterial>).opacity =
        shadowFor();
      const themeWatch = new MutationObserver(() => {
        (wall.material as InstanceType<typeof THREE.ShadowMaterial>).opacity =
          shadowFor();
      });
      themeWatch.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      wall.receiveShadow = true;
      scene.add(wall);

      // ── tag geometry: classic swing-tag outline (cut top corners, rounded bottom), punched hole ──
      const W = 1,
        H = 1.7,
        CUT = 0.2,
        R = 0.08,
        D = 0.024,
        HOLE_Y = H / 2 - 0.17,
        HOLE_R = 0.042;
      const shape = new THREE.Shape();
      shape.moveTo(-W / 2 + R, -H / 2);
      shape.lineTo(W / 2 - R, -H / 2);
      shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
      shape.lineTo(W / 2, H / 2 - CUT);
      shape.lineTo(W / 2 - CUT, H / 2);
      shape.lineTo(-W / 2 + CUT, H / 2);
      shape.lineTo(-W / 2, H / 2 - CUT);
      shape.lineTo(-W / 2, -H / 2 + R);
      shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);
      const hole = new THREE.Path();
      hole.absarc(0, HOLE_Y, HOLE_R, 0, Math.PI * 2, true);
      shape.holes.push(hole);

      // Real tags are never flat: each one gets a gentle bow across its width, a slight curl at the bottom and a
      // touch of twist. The card is a dense two-sided sheet cut to the tag outline by a mask, plus side walls for
      // its thickness, all following the same bent surface.
      type Bend = { bow: number; curl: number; twist: number };
      const surf = (x: number, y: number, b: Bend) => {
        const u = x / (W / 2);
        const c = Math.min(1, Math.max(0, (-y - H * 0.12) / (H * 0.38)));
        return b.bow * (u * u - 0.33) + b.curl * c * c + b.twist * u * (y / H);
      };
      const outline = shape.extractPoints(28);
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = 256;
      maskCanvas.height = Math.round(256 * (H / W));
      {
        const m = maskCanvas.getContext("2d")!;
        const mx = (x: number) => ((x + W / 2) / W) * maskCanvas.width;
        const my = (y: number) => (1 - (y + H / 2) / H) * maskCanvas.height;
        m.fillStyle = "#000";
        m.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        m.beginPath();
        outline.shape.forEach((p, i) =>
          i ? m.lineTo(mx(p.x), my(p.y)) : m.moveTo(mx(p.x), my(p.y)),
        );
        m.closePath();
        outline.holes.forEach((h) => {
          h.forEach((p, i) =>
            i ? m.lineTo(mx(p.x), my(p.y)) : m.moveTo(mx(p.x), my(p.y)),
          );
          m.closePath();
        });
        m.fillStyle = "#fff";
        m.fill("evenodd");
      }
      const mask = keep(new THREE.CanvasTexture(maskCanvas));
      const makeCard = (b: Bend) => {
        const front = keep(new THREE.PlaneGeometry(W, H, 36, 62));
        const back = keep(new THREE.PlaneGeometry(W, H, 36, 62));
        back.rotateY(Math.PI); // faces backwards; its uvs read correctly from behind
        for (const [g, side] of [
          [front, 1],
          [back, -1],
        ] as const) {
          const p = g.attributes.position;
          for (let i = 0; i < p.count; i++)
            p.setZ(i, surf(p.getX(i), p.getY(i), b) + (side * D) / 2);
          g.computeVertexNormals();
        }
        // side walls (outer edge and the punched hole) between the two faces
        const pos: number[] = [];
        const wallOf = (pts: { x: number; y: number }[]) => {
          for (let i = 0; i < pts.length; i++) {
            const a = pts[i],
              c = pts[(i + 1) % pts.length];
            const za = surf(a.x, a.y, b),
              zc = surf(c.x, c.y, b);
            pos.push(
              a.x,
              a.y,
              za + D / 2,
              c.x,
              c.y,
              zc + D / 2,
              a.x,
              a.y,
              za - D / 2,
            );
            pos.push(
              c.x,
              c.y,
              zc + D / 2,
              c.x,
              c.y,
              zc - D / 2,
              a.x,
              a.y,
              za - D / 2,
            );
          }
        };
        wallOf(outline.shape);
        outline.holes.forEach(wallOf);
        const walls = keep(new THREE.BufferGeometry());
        walls.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(pos, 3),
        );
        walls.computeVertexNormals();
        return { front, back, walls, z0: surf(0, HOLE_Y, b) };
      };

      // eyelet: a short gold tube with a flange on each side (lathe profile, turned to face the camera)
      const eh = D / 2 + 0.006,
        eIn = HOLE_R - 0.003,
        eOut = HOLE_R + 0.03;
      const eyeletGeo = keep(
        new THREE.LatheGeometry(
          [
            [eIn, -eh],
            [eOut, -eh],
            [eOut + 0.002, -eh + 0.003],
            [eOut, -eh + 0.005],
            [HOLE_R + 0.004, -eh + 0.006],
            [HOLE_R + 0.004, eh - 0.006],
            [eOut, eh - 0.005],
            [eOut + 0.002, eh - 0.003],
            [eOut, eh],
            [eIn, eh],
            [eIn, -eh],
          ].map(([x, y]) => new THREE.Vector2(x, y)),
          48,
        ),
      );
      eyeletGeo.rotateX(Math.PI / 2);

      // string: a satin loop from the knot on the cord, down the front, through the hole and back up behind
      // (one per tag — each hangs on a slightly different length, like real tags)
      const makeString = (len: number) => {
        const yTop = -len + HOLE_R - 0.006;
        const loop = new THREE.CatmullRomCurve3(
          [
            [0.006, 0, 0.004],
            [0.012, -len * 0.45, 0.01],
            [0.004, yTop + 0.05, D / 2 + 0.014],
            [0, yTop + 0.004, D / 2 + 0.006],
            [0, yTop - 0.002, 0],
            [0, yTop + 0.004, -D / 2 - 0.006],
            [-0.004, yTop + 0.05, -D / 2 - 0.014],
            [-0.012, -len * 0.45, -0.01],
            [-0.006, 0, -0.004],
          ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        );
        return keep(new THREE.TubeGeometry(loop, 96, 0.0042, 8, false));
      };
      const knotGeo = keep(new THREE.SphereGeometry(0.016, 16, 12));
      knotGeo.scale(1, 0.8, 1);

      // ── materials ──
      const core = keep(
        new THREE.MeshStandardMaterial({
          color: 0xe9d8cc, // the card's cut edge, a shade deeper than its face
          roughness: 0.95,
          side: THREE.DoubleSide,
        }),
      );
      const gold = keep(
        new THREE.MeshPhysicalMaterial({
          color: 0xe0b779,
          metalness: 1,
          roughness: 0.24,
          clearcoat: 0.4,
          clearcoatRoughness: 0.2,
        }),
      );
      const satin = keep(
        new THREE.MeshPhysicalMaterial({
          color: 0xb14d64,
          roughness: 0.36,
          sheen: 1,
          sheenRoughness: 0.35,
          sheenColor: new THREE.Color(0xffd6cc),
        }),
      );

      // ── print: drawn per channel (colour / emboss height / roughness / metal) with the site's own fonts ──
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
      if (disposed) {
        renderer.dispose();
        return;
      }

      const small = el.clientWidth < 700;
      const CW = small ? 512 : 704,
        CH = Math.round(CW * (H / W));
      const DW = small ? 384 : 512,
        DH = Math.round(DW * (H / W));

      // paper fibre, drawn once and reused as the base of every height map
      const fibre = document.createElement("canvas");
      fibre.width = DW;
      fibre.height = DH;
      {
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
      }

      type Mode = "color" | "height" | "rough" | "metal";
      type Ink =
        | "paper"
        | "card"
        | "ink"
        | "muted"
        | "rule"
        | "foil"
        | "blush"
        | "cream";
      // what each "ink" looks like in each channel: colour / height (128 = flat) / roughness / metalness
      const INK: Record<Ink, Record<Mode, string>> = {
        paper: {
          color: "#fbf5f1",
          height: "",
          rough: "rgb(232,232,232)",
          metal: "#000",
        },
        card: {
          color: "",
          height: "",
          rough: "rgb(150,150,150)",
          metal: "#000",
        },
        ink: {
          color: "#2e1418",
          height: "rgb(92,92,92)",
          rough: "rgb(150,150,150)",
          metal: "#000",
        },
        muted: {
          color: "#8d7175",
          height: "rgb(100,100,100)",
          rough: "rgb(170,170,170)",
          metal: "#000",
        },
        rule: {
          color: "rgba(122,27,51,0.28)",
          height: "rgb(112,112,112)",
          rough: "rgb(200,200,200)",
          metal: "#000",
        },
        foil: {
          color: "#e3bd82",
          height: "rgb(176,176,176)",
          rough: "rgb(52,52,52)",
          metal: "#fff",
        },
        blush: {
          color: "#f5c2b8",
          height: "rgb(100,100,100)",
          rough: "rgb(140,140,140)",
          metal: "#000",
        },
        cream: {
          color: "#fff6f2",
          height: "rgb(100,100,100)",
          rough: "rgb(140,140,140)",
          metal: "#000",
        },
      };
      const wine = "#7a1b33";

      const setFont = (
        c: CanvasRenderingContext2D,
        weight: string,
        px: number,
        family: string,
        spacing = 0,
      ) => {
        c.font = `${weight} ${px}px ${family}`;
        (
          c as CanvasRenderingContext2D & { letterSpacing: string }
        ).letterSpacing = `${spacing}px`;
      };
      const fitFont = (
        c: CanvasRenderingContext2D,
        text: string,
        weight: string,
        px: number,
        family: string,
        max: number,
      ) => {
        let size = px;
        do setFont(c, weight, size, family);
        while (c.measureText(text).width > max && --size > 16);
      };

      // draw one face in one channel. `k` scales the 640-wide design to the canvas.
      const paintFront = (
        c: CanvasRenderingContext2D,
        tag: TagData,
        mode: Mode,
        w: number,
        h: number,
      ) => {
        const k = w / 640;
        const ink = (i: Ink) =>
          i === "ink" && mode === "color" ? wine : INK[i][mode];
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
        setFont(c, "400", 168, script);
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
          setFont(c, "600", 34, sans, 6);
          c.fillText(label.toUpperCase(), 323, y + row * 0.36);
          c.fillStyle = mode === "color" ? "#2e1418" : INK.ink[mode];
          fitFont(c, value, "500", 68, sans, 520);
          c.fillText(value, 320, y + row * 0.82);
          y += row;
          rule(y);
        });
        c.fillStyle = INK.foil[mode];
        setFont(c, "600", 22, sans, 10);
        c.fillText("LUSTED", 325, 1088 - 50);
      };

      const paintBack = (
        c: CanvasRenderingContext2D,
        tag: TagData,
        mode: Mode,
        w: number,
        h: number,
      ) => {
        const k = w / 640;
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (mode === "color") {
          const g = c.createLinearGradient(0, 0, w * 0.6, h);
          g.addColorStop(0, "#8f2444");
          g.addColorStop(1, "#43091a");
          c.fillStyle = g;
          c.fillRect(0, 0, w, h);
          const glow = c.createRadialGradient(
            w * 0.3,
            h * 0.15,
            0,
            w * 0.3,
            h * 0.15,
            w,
          );
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
        setFont(c, "400", 236, script);
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

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const canvasTex = (w: number, h: number, srgb: boolean) => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const tex = keep(new THREE.CanvasTexture(canvas));
        if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        return {
          canvas,
          ctx: canvas.getContext("2d", { willReadFrequently: !srgb })!,
          tex,
        };
      };
      // pack height (R), roughness (G) and metalness (B) into one texture — the channels three.js reads them from
      const scratch = [0, 1, 2].map(() => {
        const c = document.createElement("canvas");
        c.width = DW;
        c.height = DH;
        return c.getContext("2d", { willReadFrequently: true })!;
      });
      const paintData = (
        target: CanvasRenderingContext2D,
        paint: typeof paintFront,
        tag: TagData,
      ) => {
        (["height", "rough", "metal"] as const).forEach((m, i) =>
          paint(scratch[i], tag, m, DW, DH),
        );
        const [hd, rd, md] = scratch.map(
          (c) => c.getImageData(0, 0, DW, DH).data,
        );
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

      type Face = {
        color: ReturnType<typeof canvasTex>;
        data: ReturnType<typeof canvasTex>;
      };
      const printTag = (front: Face, back: Face, tag: TagData) => {
        paintFront(front.color.ctx, tag, "color", CW, CH);
        paintBack(back.color.ctx, tag, "color", CW, CH);
        paintData(front.data.ctx, paintFront, tag);
        paintData(back.data.ctx, paintBack, tag);
        for (const f of [front, back]) {
          f.color.tex.needsUpdate = true;
          f.data.tex.needsUpdate = true;
        }
      };

      // ── five tags: pivot (swing) → twister (turn on the string) → card ──
      type State = {
        z: number;
        vz: number;
        x: number;
        vx: number;
        y: number;
        vy: number;
        turn: number;
      };
      const REST = [-0.2, 0.14, -0.08, 0.18, -0.12]; // resting angle on the string, radians — small, so every tag reads
      const LEN = [0.4, 0.5, 0.36, 0.46, 0.42]; // string lengths — each tag hangs a little differently
      const items = latest.current.map((tag, i) => {
        const pivot = new THREE.Group();
        const twister = new THREE.Group();
        pivot.add(twister);
        const card = new THREE.Group();
        const len = LEN[i % LEN.length];
        card.position.y = -len - HOLE_Y;
        twister.add(card);

        // every tag bends a little differently
        const geo = makeCard({
          bow: (0.07 + Math.random() * 0.04) * (Math.random() < 0.8 ? 1 : -1),
          curl: (Math.random() - 0.3) * 0.12,
          twist: (Math.random() - 0.5) * 0.08,
        });
        card.position.z = -geo.z0; // the hole sits on the string's axis
        const walls = new THREE.Mesh(geo.walls, core);
        walls.castShadow = true;
        walls.receiveShadow = true;
        card.add(walls);

        const front: Face = {
          color: canvasTex(CW, CH, true),
          data: canvasTex(DW, DH, false),
        };
        const back: Face = {
          color: canvasTex(CW, CH, true),
          data: canvasTex(DW, DH, false),
        };
        printTag(front, back, tag);
        const frontMat = keep(
          new THREE.MeshPhysicalMaterial({
            map: front.color.tex,
            bumpMap: front.data.tex,
            bumpScale: 1.6,
            roughnessMap: front.data.tex,
            metalnessMap: front.data.tex,
            roughness: 1,
            metalness: 1,
            alphaMap: mask,
            alphaTest: 0.5,
          }),
        );
        const backMat = keep(
          new THREE.MeshPhysicalMaterial({
            map: back.color.tex,
            bumpMap: back.data.tex,
            bumpScale: 1.4,
            roughnessMap: back.data.tex,
            metalnessMap: back.data.tex,
            roughness: 1,
            metalness: 1,
            clearcoat: 0.55,
            clearcoatRoughness: 0.38,
            alphaMap: mask,
            alphaTest: 0.5,
          }),
        );
        const body = new THREE.Mesh(geo.front, frontMat);
        body.castShadow = true;
        body.receiveShadow = true;
        body.userData.i = i;
        card.add(body);
        const backMesh = new THREE.Mesh(geo.back, backMat);
        backMesh.castShadow = true;
        backMesh.receiveShadow = true;
        backMesh.userData.i = i; // tappable from behind too, so a turned tag can be turned back
        card.add(backMesh);

        const eyelet = new THREE.Mesh(eyeletGeo, gold);
        eyelet.position.set(0, HOLE_Y, geo.z0);
        eyelet.castShadow = true;
        card.add(eyelet);

        const string = new THREE.Mesh(makeString(len), satin);
        string.castShadow = true;
        twister.add(string);
        const knot = new THREE.Mesh(knotGeo, satin);
        knot.castShadow = true;
        pivot.add(knot);

        scene.add(pivot);
        const state: State = {
          z: (Math.random() - 0.5) * 0.3,
          vz: 0,
          x: 0,
          vx: 0,
          y: (Math.random() - 0.5) * 0.6,
          vy: 0,
          turn: REST[i % REST.length],
        };
        return {
          pivot,
          twister,
          body,
          backMesh,
          front,
          back,
          state,
          rest: REST[i % REST.length],
        };
      });

      // ── layout: tags centred under the column, cord across the whole stage ──
      const GAP = 1.13;
      const HALF = 2 * GAP + 0.62;
      let cord: InstanceType<typeof THREE.Mesh> | null = null;
      let sag = 0.06,
        span = HALF;
      const sagAt = (x: number) => -sag * (1 - Math.min(1, (x / span) ** 2));
      let camX = 0,
        camTarget = 0,
        camRange = 0,
        camBase = 0,
        camY = 0,
        camZ = 10,
        camLookY = 0,
        upp = 0.01;
      const par = { x: 0, y: 0, tx: 0, ty: 0 }; // pointer parallax
      // a gold end cap where the cord meets the photo: kept exactly on the stage's left edge every frame
      const capGeo = keep(new THREE.CylinderGeometry(0.024, 0.024, 0.11, 24));
      capGeo.rotateZ(Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, gold);
      cap.castShadow = true;
      scene.add(cap);
      const edgeRay = new THREE.Raycaster();
      const edgeNdc = new THREE.Vector2();
      const edgeHit = new THREE.Vector3();
      const edgePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const placeCamera = () => {
        const x = camBase + camX + par.x + camZ * 0.16; // a little from the right: the row recedes
        camera.position.set(x, camY + par.y, camZ);
        camera.lookAt(camBase + camX, camLookY, 0);
        camera.updateMatrixWorld();
        edgeNdc.set(-1, new THREE.Vector3(x, 0, 0).project(camera).y);
        edgeRay.setFromCamera(edgeNdc, camera);
        if (edgeRay.ray.intersectPlane(edgePlane, edgeHit)) {
          const cx = edgeHit.x + 0.055;
          cap.position.set(cx, sagAt(cx), 0);
        }
      };
      const layout = () => {
        const w = el.clientWidth,
          h = el.clientHeight;
        const pad =
          parseFloat(getComputedStyle(el).getPropertyValue("--pad")) || 0;
        const stage = el.parentElement!.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        const colW = Math.min(w, stage.width),
          usableH = Math.max(80, h - pad * 2);
        const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const narrow = colW / usableH < 1.4;
        const fitHalfW = narrow ? 1.45 : HALF;
        const top = 0.14,
          bottom = -Math.max(...LEN) - H - 0.06;
        const halfH = (top - bottom) / 2;
        camZ =
          Math.max((fitHalfW * h) / (t * colW), (halfH * h) / (t * usableH)) *
          1.04;
        upp = (2 * camZ * t) / h;
        camBase =
          -(stage.left + stage.width / 2 - (box.left + box.width / 2)) * upp;
        camLookY = (top + bottom) / 2;
        camY = camLookY + 0.18;
        camRange = narrow ? Math.max(0, HALF - (colW / 2) * upp + 0.25) : 0;
        camTarget = THREE.MathUtils.clamp(camTarget, -camRange, camRange);

        // the cord: well past both edges of the stage (plus the swipe range) — the camera looks from the right, so on
        // wide screens the left edge reaches further than a straight-on view suggests; the canvas clips the excess, so
        // the cord always runs right up to the gold end cap at the photo
        const visHalfW = (w / 2) * upp;
        const left = camBase - visHalfW * 2 - camRange - 2,
          right = camBase + visHalfW * 2 + camRange + 2;
        span = Math.max(Math.abs(left), Math.abs(right));
        sag = Math.min(0.14, 0.006 * (right - left)); // same sag as before over the now-longer cord
        if (cord) {
          scene.remove(cord);
          cord.geometry.dispose();
        }
        const pts = Array.from({ length: 48 }, (_, k) => {
          const x = left + ((right - left) * k) / 47;
          return new THREE.Vector3(x, sagAt(x), 0);
        });
        cord = new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(pts),
            200,
            0.014,
            10,
          ),
          satin,
        );
        cord.castShadow = true;
        scene.add(cord);
        items.forEach((it, k) => {
          const x = (k - 2) * GAP;
          it.pivot.position.set(x, sagAt(x), 0);
        });
        key.position.set(camBase - 5.5, 6.5, 5);
        key.target.position.set(camBase, -1, 0);
      };

      const resize = () => {
        const w = el.clientWidth,
          h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        layout();
        camX = camTarget;
        placeCamera();
      };
      resize();
      camTarget = camX = -camRange; // narrow screens start at XS
      placeCamera();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      // ── interaction ──
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const hit = new THREE.Vector3();
      const bodies = items.flatMap((it) => [it.body, it.backMesh]); // both faces, so a turned tag can be tapped back
      let lastX: number | null = null,
        lastT = 0;
      let dragFrom: number | null = null,
        dragCam = 0,
        dragged = false,
        flingV = 0,
        lastDragX = 0,
        lastDragT = 0;
      const canvasEl = renderer.domElement;

      const pick = (e: PointerEvent | MouseEvent) => {
        const r = canvasEl.getBoundingClientRect();
        ndc.set(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          -((e.clientY - r.top) / r.height) * 2 + 1,
        );
        ray.setFromCamera(ndc, camera);
        const h = ray.intersectObjects(bodies, false)[0];
        return h ? (h.object.userData.i as number) : -1;
      };
      const onDown = (e: PointerEvent) => {
        if (camRange <= 0) return;
        dragFrom = lastDragX = e.clientX;
        dragCam = camTarget;
        dragged = false;
        flingV = 0;
        lastDragT = performance.now();
      };
      const onUp = () => (dragFrom = null);
      const onMove = (e: PointerEvent) => {
        if (dragFrom !== null) {
          const dx = e.clientX - dragFrom;
          if (Math.abs(dx) > 6) dragged = true;
          camTarget = THREE.MathUtils.clamp(
            dragCam - dx * upp,
            -camRange,
            camRange,
          );
          const now = performance.now();
          flingV =
            (-(e.clientX - lastDragX) * upp) /
            Math.max(0.008, (now - lastDragT) / 1000);
          lastDragX = e.clientX;
          lastDragT = now;
        }
        const i = pick(e);
        if (e.pointerType === "mouse") {
          par.tx = ndc.x * 0.22;
          par.ty = ndc.y * 0.12;
        }
        canvasEl.style.cursor = i >= 0 ? "pointer" : "";
        if (!ray.ray.intersectPlane(plane, hit)) return;
        const now = performance.now();
        if (lastX !== null && i >= 0) {
          const v = THREE.MathUtils.clamp(
            (hit.x - lastX) / Math.max(0.008, (now - lastT) / 1000),
            -12,
            12,
          );
          items[i].state.vz -= v * 0.03;
          items[i].state.vy += v * 0.015;
        }
        lastX = hit.x;
        lastT = now;
      };
      const onLeave = () => {
        lastX = null;
        par.tx = par.ty = 0;
      };
      const onClick = (e: MouseEvent) => {
        if (dragged) {
          dragged = false; // that was a swipe, not a tap
          return;
        }
        const i = pick(e);
        if (i < 0) return;
        const { state: s, rest } = items[i];
        s.turn = s.turn === rest ? rest + Math.PI : rest;
        s.vz += (Math.random() - 0.5) * 0.8;
      };
      // scrolling past makes them sway, like real tags on a moving rail
      let lastScroll = window.scrollY,
        lastScrollT = performance.now();
      const onScroll = () => {
        const now = performance.now();
        const v = THREE.MathUtils.clamp(
          (window.scrollY - lastScroll) / Math.max(8, now - lastScrollT),
          -4,
          4,
        );
        lastScroll = window.scrollY;
        lastScrollT = now;
        items.forEach(({ state: s }) => {
          s.vx = THREE.MathUtils.clamp(s.vx + v * 0.04, -0.5, 0.5);
        });
      };
      canvasEl.addEventListener("pointermove", onMove);
      canvasEl.addEventListener("pointerleave", onLeave);
      canvasEl.addEventListener("pointerdown", onDown);
      canvasEl.addEventListener("click", onClick);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      window.addEventListener("scroll", onScroll, { passive: true });

      api.current = {
        setTags: (next) => {
          next.forEach((tag, i) => {
            const it = items[i];
            if (!it) return;
            printTag(it.front, it.back, tag);
            // new category: back to the fronts, with a swing
            it.state.turn = it.rest;
            it.state.vz += (i % 2 ? 1 : -1) * 0.35;
            it.state.vy += (i % 2 ? -1 : 1) * 0.8;
          });
        },
      };

      // ── spring physics + render loop (paused off-screen / in hidden tabs) ──
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 1;
      let raf = 0,
        last = performance.now(),
        visible = false;
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        const t = now / 1000;
        items.forEach(({ pivot, twister, state: s }, i) => {
          const breezeZ =
            calm *
            (0.55 * Math.sin(t * 0.9 + i * 1.7) +
              0.35 * Math.sin(t * 2.3 + i * 0.6) +
              0.15 * Math.sin(t * 5.1 + i * 2.9));
          const breezeY =
            calm *
            (0.8 * Math.sin(t * 0.6 + i * 2.1) + 0.4 * Math.sin(t * 1.7 + i));
          s.vz += (-26 * s.z - 4 * s.vz + breezeZ * 0.3) * dt;
          s.z = THREE.MathUtils.clamp(s.z + s.vz * dt, -0.3, 0.3);
          s.vx += (-30 * s.x - 5 * s.vx + breezeZ * 0.1) * dt;
          s.x = THREE.MathUtils.clamp(s.x + s.vx * dt, -0.25, 0.25);
          s.vy += (-14 * (s.y - s.turn) - 6 * s.vy + breezeY * 0.2) * dt;
          s.y += s.vy * dt;
          pivot.rotation.set(s.x, 0, s.z);
          twister.rotation.y = s.y;
        });
        if (dragFrom === null && Math.abs(flingV) > 0.01) {
          camTarget = THREE.MathUtils.clamp(
            camTarget + flingV * dt,
            -camRange,
            camRange,
          );
          flingV *= Math.pow(0.04, dt);
        }
        camX += (camTarget - camX) * Math.min(1, dt * 10);
        par.x += (par.tx - par.x) * Math.min(1, dt * 3);
        par.y += (par.ty - par.y) * Math.min(1, dt * 3);
        placeCamera();
        renderer.render(scene, camera);
      };
      const start = () => {
        if (raf || !visible || document.hidden) return;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      };
      const stop = () => {
        cancelAnimationFrame(raf);
        raf = 0;
      };
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      });
      io.observe(el);
      const onVis = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVis);

      renderer.render(scene, camera);
      ready.current(true);

      cleanup = () => {
        stop();
        io.disconnect();
        ro.disconnect();
        themeWatch.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        canvasEl.removeEventListener("pointermove", onMove);
        canvasEl.removeEventListener("pointerleave", onLeave);
        canvasEl.removeEventListener("pointerdown", onDown);
        canvasEl.removeEventListener("click", onClick);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("scroll", onScroll);
        cord?.geometry.dispose();
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        canvasEl.remove();
        api.current = null;
      };
    })().catch(() => ready.current(false));

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={host} className="size-tags-3d" aria-hidden="true" />;
}
