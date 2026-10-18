"use client";

import { useEffect, useRef } from "react";

// Silky smoke that follows the cursor: a small stable-fluids simulation on the GPU (WebGL2). Moving the pointer pushes
// the fluid and drops dye in Lusted's wine, rose and blush; it swirls (vorticity), then dissolves. Mouse/trackpad
// only, off with reduced motion or without WebGL2, never blocks clicks, and the loop sleeps once the smoke has faded.
const SIM_RES = 128;
const DYE_RES = 768;
const PRESSURE_ITERATIONS = 20;
const VELOCITY_DISSIPATION = 4;
const DENSITY_DISSIPATION = 7;
const PRESSURE = 0.8;
const CURL = 8;
const SPLAT_RADIUS = 0.012; // % of the screen — a thin thread of smoke
const SPLAT_FORCE = 1400;
const PALETTE = [
  [0.48, 0.11, 0.2], // wine
  [0.7, 0.33, 0.42], // rose
  [0.91, 0.71, 0.67], // blush
];

const VERT = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv, vL, vR, vT, vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAG = {
  splat: `
    uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
    void main () {
      vec2 p = vUv - point; p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      outColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
    }`,
  advection: `
    uniform sampler2D uVelocity, uSource; uniform vec2 texelSize; uniform float dt, dissipation;
    void main () {
      vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
      outColor = texture(uSource, coord) / (1.0 + dissipation * dt);
    }`,
  divergence: `
    uniform sampler2D uVelocity;
    void main () {
      float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x, T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
      vec2 C = texture(uVelocity, vUv).xy;
      if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x; if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
      outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }`,
  curl: `
    uniform sampler2D uVelocity;
    void main () {
      float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y, T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
      outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
    }`,
  vorticity: `
    uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
    void main () {
      float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x, B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curl * C; force.y *= -1.0;
      vec2 v = texture(uVelocity, vUv).xy + force * dt;
      outColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
    }`,
  pressure: `
    uniform sampler2D uPressure, uDivergence;
    void main () {
      float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      outColor = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
    }`,
  gradient: `
    uniform sampler2D uPressure, uVelocity;
    void main () {
      float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      outColor = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
    }`,
  clear: `
    uniform sampler2D uTexture; uniform float value;
    void main () { outColor = value * texture(uTexture, vUv); }`,
  // dye is drawn premultiplied: its brightest channel becomes its opacity, so the page shows through the thin smoke
  display: `
    uniform sampler2D uTexture;
    void main () {
      vec3 c = texture(uTexture, vUv).rgb;
      float a = clamp(max(c.r, max(c.g, c.b)) * 1.2, 0.0, 0.7);
      outColor = vec4(min(c, vec3(a)), a);
    }`,
};

type Fbo = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
type DoubleFbo = { read: Fbo; write: Fbo; swap: () => void; w: number; h: number };

export default function FluidCursor() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = canvas.current;
    const gl = el?.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!el || !gl || !gl.getExtension("EXT_color_buffer_float")) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vert = compile(gl.VERTEX_SHADER, VERT);
    const program = (body: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, vert);
      gl.attachShader(
        p,
        compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\nprecision highp sampler2D;\nin vec2 vUv, vL, vR, vT, vB;\nout vec4 outColor;\n${body}`),
      );
      gl.bindAttribLocation(p, 0, "aPosition");
      gl.linkProgram(p);
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < n; i++) {
        const name = gl.getActiveUniform(p, i)!.name;
        uniforms[name] = gl.getUniformLocation(p, name);
      }
      return { p, u: uniforms };
    };
    const progs = Object.fromEntries(Object.entries(FRAG).map(([k, src]) => [k, program(src)])) as Record<keyof typeof FRAG, ReturnType<typeof program>>;

    // one full-screen quad
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const makeFbo = (w: number, h: number, internal: number, format: number): Fbo => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fbo, w, h };
    };
    const makeDouble = (w: number, h: number, internal: number, format: number): DoubleFbo => {
      const d = { read: makeFbo(w, h, internal, format), write: makeFbo(w, h, internal, format), w, h, swap: () => {} };
      d.swap = () => ([d.read, d.write] = [d.write, d.read]);
      return d;
    };
    const res = (r: number) => {
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const min = Math.round(r),
        max = Math.round(r * (aspect < 1 ? 1 / aspect : aspect));
      return aspect > 1 ? [max, min] : [min, max];
    };

    let velocity: DoubleFbo, dye: DoubleFbo, pressure: DoubleFbo, divergence: Fbo, curl: Fbo;
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      el.width = Math.round(window.innerWidth * dpr);
      el.height = Math.round(window.innerHeight * dpr);
      const [sw, sh] = res(SIM_RES);
      const [dw, dh] = res(DYE_RES);
      velocity = makeDouble(sw, sh, gl.RG16F, gl.RG);
      dye = makeDouble(dw, dh, gl.RGBA16F, gl.RGBA);
      pressure = makeDouble(sw, sh, gl.R16F, gl.RED);
      divergence = makeFbo(sw, sh, gl.R16F, gl.RED);
      curl = makeFbo(sw, sh, gl.R16F, gl.RED);
    };
    resize();

    const draw = (target: Fbo | null) => {
      if (target) {
        gl.viewport(0, 0, target.w, target.h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
    let unit = 0;
    const prog = (name: keyof typeof FRAG, texel: [number, number], set: (u: Record<string, WebGLUniformLocation | null>) => void) => {
      const { p, u } = progs[name];
      gl.useProgram(p);
      gl.uniform2f(u.texelSize, texel[0], texel[1]);
      unit = 0;
      set(u);
    };
    const bind = (loc: WebGLUniformLocation | null, f: Fbo) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, f.tex);
      gl.uniform1i(loc, unit++);
    };

    const splat = (x: number, y: number, dx: number, dy: number, color: number[]) => {
      const aspect = el.width / el.height;
      prog("splat", [1 / velocity.w, 1 / velocity.h], (u) => {
        bind(u.uTarget, velocity.read);
        gl.uniform1f(u.aspectRatio, aspect);
        gl.uniform2f(u.point, x, y);
        gl.uniform3f(u.color, dx, dy, 0);
        gl.uniform1f(u.radius, (SPLAT_RADIUS / 100) * (aspect > 1 ? aspect : 1));
      });
      draw(velocity.write);
      velocity.swap();
      prog("splat", [1 / dye.w, 1 / dye.h], (u) => {
        bind(u.uTarget, dye.read);
        gl.uniform1f(u.aspectRatio, aspect);
        gl.uniform2f(u.point, x, y);
        gl.uniform3f(u.color, color[0], color[1], color[2]);
        gl.uniform1f(u.radius, (SPLAT_RADIUS / 100) * (aspect > 1 ? aspect : 1));
      });
      draw(dye.write);
      dye.swap();
    };

    const step = (dt: number) => {
      const st: [number, number] = [1 / velocity.w, 1 / velocity.h];
      gl.disable(gl.BLEND);
      prog("curl", st, (u) => bind(u.uVelocity, velocity.read));
      draw(curl);
      prog("vorticity", st, (u) => {
        bind(u.uVelocity, velocity.read);
        bind(u.uCurl, curl);
        gl.uniform1f(u.curl, CURL);
        gl.uniform1f(u.dt, dt);
      });
      draw(velocity.write);
      velocity.swap();
      prog("divergence", st, (u) => bind(u.uVelocity, velocity.read));
      draw(divergence);
      prog("clear", st, (u) => {
        bind(u.uTexture, pressure.read);
        gl.uniform1f(u.value, PRESSURE);
      });
      draw(pressure.write);
      pressure.swap();
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        prog("pressure", st, (u) => {
          bind(u.uPressure, pressure.read);
          bind(u.uDivergence, divergence);
        });
        draw(pressure.write);
        pressure.swap();
      }
      prog("gradient", st, (u) => {
        bind(u.uPressure, pressure.read);
        bind(u.uVelocity, velocity.read);
      });
      draw(velocity.write);
      velocity.swap();
      prog("advection", st, (u) => {
        bind(u.uVelocity, velocity.read);
        bind(u.uSource, velocity.read);
        gl.uniform1f(u.dt, dt);
        gl.uniform1f(u.dissipation, VELOCITY_DISSIPATION);
      });
      draw(velocity.write);
      velocity.swap();
      prog("advection", st, (u) => {
        bind(u.uVelocity, velocity.read);
        bind(u.uSource, dye.read);
        gl.uniform1f(u.dt, dt);
        gl.uniform1f(u.dissipation, DENSITY_DISSIPATION);
      });
      draw(dye.write);
      dye.swap();
    };

    const render = () => {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clear(gl.COLOR_BUFFER_BIT);
      prog("display", [1 / el.width, 1 / el.height], (u) => bind(u.uTexture, dye.read));
      draw(null);
    };

    // the pointer, and a colour that drifts round the palette as you move
    const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false, seen: false };
    let hue = Math.random() * PALETTE.length;
    const colour = () => {
      hue = (hue + 0.012) % PALETTE.length;
      const i = Math.floor(hue),
        k = hue - i;
      const a = PALETTE[i],
        b = PALETTE[(i + 1) % PALETTE.length];
      return a.map((v, j) => (v + (b[j] - v) * k) * 0.3);
    };

    let raf = 0,
      last = performance.now(),
      lastMove = 0,
      running = false;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.016667);
      last = now;
      if (pointer.moved) {
        pointer.moved = false;
        splat(pointer.x, pointer.y, pointer.dx * SPLAT_FORCE, pointer.dy * SPLAT_FORCE, colour());
      }
      step(dt);
      render();
      if (now - lastMove > 4000) {
        running = false; // the smoke has dissolved — sleep until the pointer moves again
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const x = e.clientX / window.innerWidth,
        y = 1 - e.clientY / window.innerHeight;
      if (pointer.seen) {
        const aspect = el.width / el.height;
        pointer.dx = (x - pointer.x) * (aspect < 1 ? aspect : 1);
        pointer.dy = (y - pointer.y) / (aspect > 1 ? aspect : 1);
        pointer.moved = Math.abs(pointer.dx) + Math.abs(pointer.dy) > 0;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.seen = true;
      lastMove = performance.now();
      wake();
    };
    const onResize = () => {
      resize();
      wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvas} className="cursor-trail" aria-hidden="true" />;
}
