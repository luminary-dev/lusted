"use client";

import { useEffect, useRef } from "react";
import { installPCSS } from "@/lib/three-pcss";
import { TAG, cardMaker, eyeletGeometry, knotGeometry, outlineMask, stringMaker, tagOutline, type Keep } from "@/lib/size-tags/geometry";
import { dataPacker, drawFibre, makePainter, resolveFonts, type TagData } from "@/lib/size-tags/print";

export type { TagData };

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
      // Nothing is loaded or built until the size guide is within about a screen and a half: three.js, the studio light
      // and five printed tags are seconds of work on a phone, which would otherwise land on top of the page load.
      await new Promise<void>((resolve) => {
        const near = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            near.disconnect();
            resolve();
          },
          { rootMargin: "150% 0px" },
        );
        near.observe(host.current!);
        cleanup = () => near.disconnect();
      });
      if (disposed) return;
      // hands the main thread back between the heavy steps, so building the scene never holds up a tap or a frame
      const breathe = () => new Promise<void>((r) => setTimeout(r, 0));

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
      const keep: Keep = (x) => (disposables.push(x), x);

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
      // unmounted while still building (the build awaits fonts and yields between steps): tear down what exists so far
      const gone = () => {
        if (!disposed) return false;
        themeWatch.disconnect();
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.domElement.remove();
        return true;
      };
      wall.receiveShadow = true;
      scene.add(wall);

      // ── tag geometry (src/lib/size-tags/geometry.ts): outline, bend, faces and walls, eyelet, string, knot ──
      const { W, H, HOLE_Y } = TAG;
      const outline = tagOutline(THREE);
      const mask = outlineMask(THREE, keep, outline);
      const makeCard = cardMaker(THREE, keep, outline);
      const eyeletGeo = eyeletGeometry(THREE, keep);
      const makeString = stringMaker(THREE, keep);
      const knotGeo = knotGeometry(THREE, keep);

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

      // ── print (src/lib/size-tags/print.ts): drawn per channel with the site's own fonts ──
      const fonts = await resolveFonts();
      if (gone()) return;

      const small = el.clientWidth < 700;
      // the colour map carries the print: on a wide screen a tag draws at ~800 device px, so it gets 1024 texels across
      const CW = small ? 704 : 1024,
        CH = Math.round(CW * (H / W));
      const DW = small ? 384 : 512,
        DH = Math.round(DW * (H / W));

      const fibre = drawFibre(DW, DH); // paper fibre, the base of every height map
      await breathe();
      if (gone()) return;
      const { paintFront, paintBack } = makePainter({ ...fonts, fibre });

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
      const paintData = dataPacker(DW, DH);

      type Face = {
        color: ReturnType<typeof canvasTex>;
        data: ReturnType<typeof canvasTex>;
      };
      // printed in three slices with a breath between them; the textures are only uploaded once the whole tag is done,
      // so a tag never shows half its new print. `live` turns false when a newer print has started, which stops this one.
      const printTag = async (
        front: Face,
        back: Face,
        tag: TagData,
        live = () => true,
      ) => {
        paintFront(front.color.ctx, tag, "color", CW, CH);
        paintBack(back.color.ctx, tag, "color", CW, CH);
        await breathe();
        if (!live() || disposed) return false;
        paintData(front.data.ctx, paintFront, tag);
        await breathe();
        if (!live() || disposed) return false;
        paintData(back.data.ctx, paintBack, tag);
        for (const f of [front, back]) {
          f.color.tex.needsUpdate = true;
          f.data.tex.needsUpdate = true;
        }
        return true;
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
      const REST = [0.16, 0.12, -0.05, 0.12, -0.08]; // resting angle on the string, radians — small, so every tag reads; XS (far left, seen most side-on) turns towards the camera
      const LEN = [0.4, 0.5, 0.36, 0.46, 0.42]; // string lengths — each tag hangs a little differently
      const items = latest.current.map((_, i) => {
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
      // print each tag's faces (whatever category is showing by now), a slice at a time
      const printed = latest.current;
      for (const [i, it] of items.entries()) {
        await printTag(it.front, it.back, printed[i]);
        if (gone()) return;
      }

      // ── layout: tags centred under the column, cord across the whole stage ──
      const GAP = 1.13;
      const COUNT = latest.current.length; // XS … XXL
      const HALF = ((COUNT - 1) / 2) * GAP + 0.62;
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
          const x = (k - (COUNT - 1) / 2) * GAP;
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
      // compile every shader before the first frame — in the background where the browser supports it
      // (KHR_parallel_shader_compile) — instead of stalling the page on the first render
      await renderer.compileAsync(scene, camera);
      if (gone()) return;
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

      let printing = 0;
      api.current = {
        setTags: async (next) => {
          // one tag at a time, so switching category never blocks a tap; a newer switch takes over from this one
          const run = ++printing;
          const live = () => run === printing;
          for (const [i, tag] of next.entries()) {
            const it = items[i];
            if (!it) continue;
            if (!(await printTag(it.front, it.back, tag, live))) return;
            // new category: back to the fronts, with a swing
            it.state.turn = it.rest;
            it.state.vz += (i % 2 ? 1 : -1) * 0.35;
            it.state.vy += (i % 2 ? -1 : 1) * 0.8;
          }
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

      // the category was switched while the scene was still being built: print the one now showing
      if (latest.current !== printed) api.current.setTags(latest.current);

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
