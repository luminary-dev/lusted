"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { viewName } from "@/lib/products";
import { ChevronNext, ChevronPrev, Close, ZoomIn, ZoomOut } from "../icons";

type View = { label: string; src: StaticImageData };
type Zoom = { s: number; x: number; y: number }; // scale, and the photo's offset from the centre in px
type Point = { x: number; y: number };

const REST: Zoom = { s: 1, x: 0, y: 0 };
const NEAR = 2.5; // a double tap or the zoom button: close enough to see the lace's pattern and the stitching
const MAX = 4; // a pinch can go further, up to where the 1664px sources start to blur on a phone
const PAN_STEP = 80; // an arrow key, when zoomed

const centre = (ps: Point[]) => ({ x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length });
const spread = (ps: Point[]) => (ps.length < 2 ? 1 : Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y));

// The product photos full screen, opened from the gallery's main photo. Lace and embroidery are what shoppers want to
// inspect, and the gallery's photo is a few hundred pixels wide. Pointer events do the gestures — swipe between the
// colour's photos, pinch or double-tap to zoom around the fingers, drag to look around once zoomed — so no gesture
// library ships for one dialog. It's a modal <dialog> like the size guide (top layer, focus kept inside, the page
// inert, Esc closes), and the gallery loads it, and its large photos, only when it is first opened.
export default function PdpViewer({ name, views, start, onClose }: { name: string; views: View[]; start: number; onClose: (index: number) => void }) {
  const [index, setIndex] = useState(start);
  const [zoom, setZoomState] = useState<Zoom>(REST);
  const [swipe, setSwipeState] = useState(0); // how far the strip follows a finger, in px, while one drags at rest
  const [held, setHeld] = useState(false); // a finger or the mouse is down: the photo follows it with no easing
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // Pointer events can arrive several to a frame, faster than React renders, so the gesture reads the latest values
  // from refs rather than from this render's state.
  const now = useRef({ index, zoom, swipe });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ at: Point; zoom: Zoom; spread: number; time: number; moved: boolean } | null>(null);
  const lastTap = useRef({ time: 0, x: 0, y: 0 });

  const setZoom = (z: Zoom) => {
    now.current.zoom = z;
    setZoomState(z);
  };
  const setSwipe = (dx: number) => {
    now.current.swipe = dx;
    setSwipeState(dx);
  };

  // showModal gives the top layer, focus kept inside and the rest of the page inert; the page behind stops scrolling
  // as it does under search.
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      el?.close();
      document.documentElement.style.overflow = "";
    };
  }, []);

  // The bounds a zoom must stay inside follow the window, so a rotated phone or a resized window starts again at rest.
  useEffect(() => {
    const reset = () => setZoom(REST);
    window.addEventListener("resize", reset);
    return () => window.removeEventListener("resize", reset);
  }, []);

  // Closing goes through here, whether by the button or Esc: the dialog closes first, so the page is no longer inert
  // when the gallery puts focus back on the photo that opened it (and shows the photo the shopper ended on).
  function close() {
    dialog.current?.close();
    document.documentElement.style.overflow = "";
    onClose(now.current.index);
  }

  function go(step: number) {
    const next = now.current.index + step;
    if (next < 0 || next >= views.length) return; // no wrapping round: the swipe stops at the ends too
    now.current.index = next;
    setIndex(next);
    setZoom(REST);
  }

  // Keeps a zoom inside the photo: scale between 1 and MAX, and no panning past the photo's edges. The photo is
  // contained in the stage, so its drawn size at rest comes from the stage and the photo's own proportions.
  function clamp(z: Zoom): Zoom {
    const r = stage.current!.getBoundingClientRect();
    const { width, height } = views[now.current.index].src;
    const w = Math.min(r.width, (r.height * width) / height);
    const h = (w * height) / width;
    const s = Math.min(MAX, Math.max(1, z.s));
    const mx = Math.max(0, (w * s - r.width) / 2);
    const my = Math.max(0, (h * s - r.height) / 2);
    return { s, x: Math.min(mx, Math.max(-mx, z.x)), y: Math.min(my, Math.max(-my, z.y)) };
  }

  // Zoom from `from` to scale `s` so that the bit of photo that was under `at` (a point on the screen) ends up under
  // `to` — the same point for a double tap, wherever the fingers have moved for a pinch.
  function zoomAround(from: Zoom, s: number, at: Point, to: Point = at): Zoom {
    const r = stage.current!.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const k = Math.min(MAX, Math.max(1, s)) / from.s;
    return clamp({ s: from.s * k, x: to.x - cx - (at.x - cx - from.x) * k, y: to.y - cy - (at.y - cy - from.y) * k });
  }

  function toggleZoom(at?: Point) {
    const r = stage.current!.getBoundingClientRect();
    if (now.current.zoom.s > 1) setZoom(REST);
    else setZoom(zoomAround(REST, NEAR, at ?? { x: r.left + r.width / 2, y: r.top + r.height / 2 }));
  }

  // A trackpad pinch arrives as a wheel event with ctrlKey set; once zoomed, scrolling looks around the photo. React
  // listens to wheel passively, so this one is added by hand to be allowed to stop the page zooming instead.
  useEffect(() => {
    const el = stage.current!;
    const onWheel = (e: WheelEvent) => {
      const z = now.current.zoom;
      if (e.ctrlKey) setZoom(zoomAround(z, z.s * Math.exp(-e.deltaY / 100), { x: e.clientX, y: e.clientY }));
      else if (z.s > 1) setZoom(clamp({ ...z, x: z.x - e.deltaX, y: z.y - e.deltaY }));
      else return;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  // Each change in the number of fingers starts the gesture again from where things are, so lifting one finger of a
  // pinch carries on as a pan rather than jumping.
  function restart(moved: boolean) {
    const ps = [...pointers.current.values()];
    gesture.current = { at: centre(ps), zoom: now.current.zoom, spread: spread(ps), time: performance.now(), moved };
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    restart(pointers.current.size > 1);
    setHeld(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ps = [...pointers.current.values()];
    const at = centre(ps);
    if (Math.hypot(at.x - g.at.x, at.y - g.at.y) > 8) g.moved = true;
    if (ps.length > 1) setZoom(zoomAround(g.zoom, (g.zoom.s * spread(ps)) / g.spread, g.at, at));
    else if (g.zoom.s > 1) setZoom(clamp({ s: g.zoom.s, x: g.zoom.x + at.x - g.at.x, y: g.zoom.y + at.y - g.at.y }));
    else {
      // at rest, a horizontal drag pulls the strip along — reluctantly past the first and last photo
      const dx = at.x - g.at.x;
      const pastEnd = (now.current.index === 0 && dx > 0) || (now.current.index === views.length - 1 && dx < 0);
      setSwipe(pastEnd ? dx / 3 : dx);
    }
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || !pointers.current.delete(e.pointerId)) return;
    if (pointers.current.size) return restart(true);
    gesture.current = null;
    setHeld(false);
    if (now.current.zoom.s < 1.05) setZoom(REST); // a pinch let go of barely zoomed settles back
    const dx = now.current.swipe;
    if (dx) {
      setSwipe(0);
      const width = stage.current!.getBoundingClientRect().width;
      if (Math.abs(dx) > Math.min(80, width * 0.2)) go(dx < 0 ? 1 : -1);
      return;
    }
    // two quick taps in about the same place zoom in there, or back out; a lone tap does nothing, so a shopper
    // steadying the phone doesn't lose their place
    if (e.type !== "pointerup" || g.moved || performance.now() - g.time > 300) return;
    const tap = { time: performance.now(), x: e.clientX, y: e.clientY };
    const last = lastTap.current;
    if (tap.time - last.time < 320 && Math.hypot(tap.x - last.x, tap.y - last.y) < 40) {
      toggleZoom(tap);
      lastTap.current = { time: 0, x: 0, y: 0 };
    } else lastTap.current = tap;
  }

  function onKeyDown(e: ReactKeyboardEvent) {
    const z = now.current.zoom;
    const pan: Record<string, [number, number]> = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    // zoomed, the arrows look around the photo; at rest, left and right move between the photos
    if (z.s > 1 && pan[e.key]) setZoom(clamp({ ...z, x: z.x + pan[e.key][0] * PAN_STEP, y: z.y + pan[e.key][1] * PAN_STEP }));
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "+" || e.key === "=") setZoom(zoomAround(z, NEAR, stageCentre()));
    else if (e.key === "-") setZoom(REST);
    else return;
    e.preventDefault();
  }

  function stageCentre() {
    const r = stage.current!.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  const view = views[index];
  const several = views.length > 1;

  return (
    <dialog
      ref={dialog}
      className="pv-dialog"
      aria-label={`Photos of ${name}`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={stage}
        className={`pv-stage ${zoom.s > 1 ? "is-zoomed" : ""} ${held ? "is-held" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="pv-track" style={{ transform: `translateX(calc(${-index * 100}% + ${swipe}px))` }}>
          {views.map((v, i) => (
            <div key={v.label} className="pv-slide" aria-hidden={i !== index}>
              {/* only this photo and its neighbours, so a swipe finds the next one ready but six full-size photos
                  don't all download at once */}
              {Math.abs(i - index) <= 1 && (
                <div className="pv-frame" style={i === index ? { transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})` } : undefined}>
                  {/* sizes: the photo is drawn the stage's height × 9/16 wide on a wide screen and the full width on a
                      tall one — doubled, so it's still sharp zoomed in (the 1664px sources cap it in practice) */}
                  <Image
                    src={v.src}
                    alt={`${name} — ${viewName(v.label)}`}
                    fill
                    quality={90}
                    sizes="(min-aspect-ratio: 9/16) 112.5vh, 200vw"
                    placeholder="blur"
                    draggable={false}
                    className="pv-img"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pv-bar">
        <p className="pv-count" aria-live="polite">
          <span className="sr-only">{viewName(view.label)}, </span>
          {several && <span className="pv-count-n">{`${index + 1} / ${views.length}`}</span>}
        </p>
        <button type="button" className="pv-btn" onClick={() => toggleZoom()} aria-label={zoom.s > 1 ? "Zoom out" : "Zoom in"}>
          {zoom.s > 1 ? <ZoomOut /> : <ZoomIn />}
        </button>
        <button type="button" className="pv-btn" onClick={close} aria-label="Close the photos">
          <Close />
        </button>
      </div>

      {several && (
        <>
          <button type="button" className="pv-btn pv-prev" onClick={() => go(-1)} aria-label="Previous photo" aria-disabled={index === 0}>
            <ChevronPrev />
          </button>
          <button type="button" className="pv-btn pv-next" onClick={() => go(1)} aria-label="Next photo" aria-disabled={index === views.length - 1}>
            <ChevronNext />
          </button>
        </>
      )}

      <p className="pv-hint" aria-hidden="true">
        <span className="pv-hint-touch">Get closer — pinch or double-tap to zoom</span>
        <span className="pv-hint-mouse">Get closer — double-click to zoom · arrow keys to move</span>
      </p>
    </dialog>
  );
}
