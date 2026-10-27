// The swing tag's shape, in three.js geometry: the card outline (cut top corners, rounded bottom, punched hole), the
// gentle bend every card gets, the two faces and side walls that follow it, the mask that cuts the faces to the outline,
// the gold eyelet, the satin string loop and the knot. Pure builders: they take the three.js module (loaded lazily by
// SizeTags3D.tsx) and the caller's `keep`, which registers anything that needs disposing.
import type * as T from "three";

export type Three = typeof import("three");
export type Keep = <X extends { dispose: () => void }>(x: X) => X;

// the tag's measurements, in scene units
export const TAG = {
  W: 1,
  H: 1.7,
  CUT: 0.2,
  R: 0.08,
  D: 0.024, // card thickness
  HOLE_Y: 1.7 / 2 - 0.17,
  HOLE_R: 0.042,
} as const;
const { W, H, CUT, R, D, HOLE_Y, HOLE_R } = TAG;

// Real tags are never flat: each one gets a gentle bow across its width, a slight curl at the bottom and a touch of twist.
export type Bend = { bow: number; curl: number; twist: number };
export const surf = (x: number, y: number, b: Bend) => {
  const u = x / (W / 2);
  const c = Math.min(1, Math.max(0, (-y - H * 0.12) / (H * 0.38)));
  return b.bow * (u * u - 0.33) + b.curl * c * c + b.twist * u * (y / H);
};

export type Outline = ReturnType<T.Shape["extractPoints"]>;

// classic swing-tag outline (cut top corners, rounded bottom), punched hole
export function tagOutline(THREE: Three): Outline {
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
  return shape.extractPoints(28);
}

// the alpha mask that cuts each face (a dense rectangular sheet) to the outline
export function outlineMask(THREE: Three, keep: Keep, outline: Outline) {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = 256;
  maskCanvas.height = Math.round(256 * (H / W));
  const m = maskCanvas.getContext("2d")!;
  const mx = (x: number) => ((x + W / 2) / W) * maskCanvas.width;
  const my = (y: number) => (1 - (y + H / 2) / H) * maskCanvas.height;
  m.fillStyle = "#000";
  m.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  m.beginPath();
  outline.shape.forEach((p, i) => (i ? m.lineTo(mx(p.x), my(p.y)) : m.moveTo(mx(p.x), my(p.y))));
  m.closePath();
  outline.holes.forEach((h) => {
    h.forEach((p, i) => (i ? m.lineTo(mx(p.x), my(p.y)) : m.moveTo(mx(p.x), my(p.y))));
    m.closePath();
  });
  m.fillStyle = "#fff";
  m.fill("evenodd");
  return keep(new THREE.CanvasTexture(maskCanvas));
}

// The card is a dense two-sided sheet cut to the tag outline by the mask, plus side walls for its thickness, all
// following the same bent surface. Returns a maker, so each tag can bend a little differently.
export function cardMaker(THREE: Three, keep: Keep, outline: Outline) {
  return (b: Bend) => {
    const front = keep(new THREE.PlaneGeometry(W, H, 36, 62));
    const back = keep(new THREE.PlaneGeometry(W, H, 36, 62));
    back.rotateY(Math.PI); // faces backwards; its uvs read correctly from behind
    for (const [g, side] of [
      [front, 1],
      [back, -1],
    ] as const) {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, surf(p.getX(i), p.getY(i), b) + (side * D) / 2);
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
        pos.push(a.x, a.y, za + D / 2, c.x, c.y, zc + D / 2, a.x, a.y, za - D / 2);
        pos.push(c.x, c.y, zc + D / 2, c.x, c.y, zc - D / 2, a.x, a.y, za - D / 2);
      }
    };
    wallOf(outline.shape);
    outline.holes.forEach(wallOf);
    const walls = keep(new THREE.BufferGeometry());
    walls.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    walls.computeVertexNormals();
    return { front, back, walls, z0: surf(0, HOLE_Y, b) };
  };
}

// eyelet: a short gold tube with a flange on each side (lathe profile, turned to face the camera)
export function eyeletGeometry(THREE: Three, keep: Keep) {
  const eh = D / 2 + 0.006,
    eIn = HOLE_R - 0.003,
    eOut = HOLE_R + 0.03;
  const geo = keep(
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
  geo.rotateX(Math.PI / 2);
  return geo;
}

// string: a satin loop from the knot on the cord, down the front, through the hole and back up behind
// (one per tag — each hangs on a slightly different length, like real tags)
export function stringMaker(THREE: Three, keep: Keep) {
  return (len: number) => {
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
}

export function knotGeometry(THREE: Three, keep: Keep) {
  const geo = keep(new THREE.SphereGeometry(0.016, 16, 12));
  geo.scale(1, 0.8, 1);
  return geo;
}
