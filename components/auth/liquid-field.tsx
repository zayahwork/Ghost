"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient background for the auth brand panel: dark glass bubbles rising from
 * the bottom of the panel to the top, fusing into curved liquid shapes when
 * they drift close to one another.
 *
 * The merged silhouette is a metaball field. Every bubble adds a smooth falloff
 * to a scalar grid, and each frame draws the iso-contour of that grid, traced
 * with marching squares. That is what lets two bubbles become one outline with
 * a curved neck between them instead of two circles overlapping — and it is why
 * the chrome rim wraps the merged shape rather than each bubble separately.
 *
 * Colors are read from the theme's custom properties at mount rather than
 * hardcoded, so the field tracks `globals.css` like every other surface. The
 * canvas is decorative only and is hidden from assistive technology.
 */

const COLOR_TOKENS = {
  /** Lit face of the glass. */
  bodyHigh: "--bg-subtle",
  /** Body of the glass, where it reads as black. */
  bodyLow: "--bg-base",
  /** Bounce light along the underside. */
  bodyFloor: "--bg-elevated",
  /** Chrome ramp — bright, mid, dim, dark. */
  chromeBright: "--text-primary",
  chromeMid: "--text-secondary",
  chromeDim: "--text-muted",
  chromeDark: "--text-faint",
} as const;

type Rgb = [number, number, number];
type ColorName = keyof typeof COLOR_TOKENS;

const FALLBACK_COLORS: Record<ColorName, Rgb> = {
  bodyHigh: [30, 30, 35],
  bodyLow: [8, 8, 9],
  bodyFloor: [24, 24, 28],
  chromeBright: [240, 240, 244],
  chromeMid: [192, 192, 204],
  chromeDim: [128, 128, 144],
  chromeDark: [80, 80, 96],
};

/** Sampling grid pitch in css px. Smaller is smoother and costs more. */
const CELL = 7;
/** Iso value of the field that counts as inside the liquid. */
const THRESHOLD = 0.42;
/**
 * Influence radius as a multiple of a drawn radius. At 2.0 the iso-surface of a
 * lone bubble sits on its own radius, and two bubbles fuse once their centers
 * close to roughly 2.5 radii.
 */
const INFLUENCE = 2;

const RADIUS_MIN = 15;
const RADIUS_MAX = 44;

/** One bubble per this many css px² of panel, clamped to the bounds below. */
const AREA_PER_BUBBLE = 34000;
const MIN_COUNT = 6;
const MAX_COUNT = 22;

/** Fraction of panel height over which a bubble shrinks away at the top. */
const DISSOLVE_BAND = 0.18;

const MAX_LOOP_POINTS = 2048;
const MAX_FRAME_SECONDS = 0.05;

interface Bubble {
  baseX: number;
  y: number;
  radius: number;
  /** Upward travel in css px per second. */
  speed: number;
  /** Horizontal wander amplitude in css px. */
  drift: number;
  /** Wander rate in radians per second. */
  wobble: number;
  phase: number;
  /** Surface-tension breathing. */
  pulse: number;
  pulsePhase: number;
}

interface CellBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function parseColor(value: string): Rgb | null {
  const hex = value.trim();

  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return [
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
      parseInt(hex[3] + hex[3], 16),
    ];
  }

  const channels = hex.match(/^rgba?\(([^)]+)\)$/i);
  if (channels) {
    const parts = channels[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map(Number);

    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
      return [parts[0], parts[1], parts[2]];
    }
  }

  return null;
}

function readColors(element: Element): Record<ColorName, Rgb> {
  const styles = getComputedStyle(element);
  const colors = { ...FALLBACK_COLORS };

  for (const name of Object.keys(COLOR_TOKENS) as ColorName[]) {
    const parsed = parseColor(styles.getPropertyValue(COLOR_TOKENS[name]));
    if (parsed) colors[name] = parsed;
  }

  return colors;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function LiquidField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const colors = readColors(canvas);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const rgba = (name: ColorName, alpha: number) => {
      const [r, g, b] = colors[name];
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    /** Alpha-baked color strings, built once so no frame allocates them. */
    const ink = {
      bodyHigh: rgba("bodyHigh", 0.95),
      bodyLow: rgba("bodyLow", 0.98),
      bodyFloor: rgba("bodyFloor", 0.92),
      specular: rgba("chromeBright", 0.16),
      specularOut: rgba("chromeBright", 0),
      innerRim: rgba("chromeBright", 0.45),
      rim0: rgba("chromeBright", 0.92),
      rim1: rgba("chromeDark", 0.32),
      rim2: rgba("chromeMid", 0.85),
      rim3: rgba("chromeDim", 0.28),
      rim4: rgba("chromeBright", 0.88),
    };

    /**
     * Grid margin in css px. Wide enough that a bubble spawned below the panel
     * still has its whole field inside the grid, so every contour closes and no
     * shape is ever cut open by the edge of the grid.
     */
    const PAD = 3 * RADIUS_MAX;

    const bubbles: Bubble[] = [];

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let originX = 0;
    let originY = 0;

    let field = new Float32Array(0);
    let pointX = new Float32Array(0);
    let pointY = new Float32Array(0);
    let nextOf = new Int32Array(0);
    let nextStamp = new Int32Array(0);
    let visitStamp = new Int32Array(0);
    let starts = new Int32Array(0);

    const loopX = new Float32Array(MAX_LOOP_POINTS);
    const loopY = new Float32Array(MAX_LOOP_POINTS);

    let frameId = 0;
    let elapsed = 0;
    let lastFrame = 0;
    let animationId = 0;

    const createBubble = (spawnBelow: boolean): Bubble => {
      const radius = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN);

      return {
        baseX: Math.random() * width,
        y: spawnBelow
          ? height + radius + Math.random() * height * 0.35
          : Math.random() * height,
        radius,
        speed: 8 + Math.random() * 18,
        drift: 6 + Math.random() * 22,
        wobble: 0.12 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        pulse: 0.4 + Math.random() * 0.7,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    };

    const resizePopulation = () => {
      const target = clamp(
        Math.round((width * height) / AREA_PER_BUBBLE),
        MIN_COUNT,
        MAX_COUNT,
      );

      while (bubbles.length > target) bubbles.pop();
      while (bubbles.length < target) bubbles.push(createBubble(false));

      for (const bubble of bubbles) {
        bubble.baseX = clamp(bubble.baseX, 0, width);
      }
    };

    /** Accumulates every bubble into the field; returns the cells it touched. */
    const buildField = (): CellBox => {
      field.fill(0);

      let x0 = cols;
      let y0 = rows;
      let x1 = 0;
      let y1 = 0;

      for (const bubble of bubbles) {
        const dissolve = clamp(bubble.y / (height * DISSOLVE_BAND), 0, 1);
        const breathe =
          1 + Math.sin(elapsed * bubble.pulse + bubble.pulsePhase) * 0.07;
        const radius = bubble.radius * dissolve * breathe;
        if (radius <= 0.5) continue;

        const reach = radius * INFLUENCE;
        const cx =
          bubble.baseX +
          Math.sin(bubble.phase + elapsed * bubble.wobble) * bubble.drift;
        const cy = bubble.y;
        const invReach2 = 1 / (reach * reach);

        const gx0 = Math.max(0, Math.floor((cx - reach - originX) / CELL));
        const gx1 = Math.min(cols - 1, Math.ceil((cx + reach - originX) / CELL));
        const gy0 = Math.max(0, Math.floor((cy - reach - originY) / CELL));
        const gy1 = Math.min(rows - 1, Math.ceil((cy + reach - originY) / CELL));

        if (gx0 < x0) x0 = gx0;
        if (gy0 < y0) y0 = gy0;
        if (gx1 > x1) x1 = gx1;
        if (gy1 > y1) y1 = gy1;

        for (let gy = gy0; gy <= gy1; gy++) {
          const dy = originY + gy * CELL - cy;
          const dy2 = dy * dy;
          const row = gy * cols;

          for (let gx = gx0; gx <= gx1; gx++) {
            const dx = originX + gx * CELL - cx;
            const q = 1 - (dx * dx + dy2) * invReach2;
            if (q <= 0) continue;
            field[row + gx] += q * q * q;
          }
        }
      }

      return { x0: Math.max(0, x0 - 1), y0: Math.max(0, y0 - 1), x1, y1 };
    };

    /** Closed contour through the traced points, curved via segment midpoints. */
    const buildPath = (count: number) => {
      const path = new Path2D();

      path.moveTo(
        (loopX[count - 1] + loopX[0]) / 2,
        (loopY[count - 1] + loopY[0]) / 2,
      );

      for (let i = 0; i < count; i++) {
        const j = i + 1 === count ? 0 : i + 1;
        path.quadraticCurveTo(
          loopX[i],
          loopY[i],
          (loopX[i] + loopX[j]) / 2,
          (loopY[i] + loopY[j]) / 2,
        );
      }

      path.closePath();
      return path;
    };

    const paint = (
      path: Path2D,
      minX: number,
      minY: number,
      maxX: number,
      maxY: number,
    ) => {
      const w = Math.max(maxX - minX, 1);
      const h = Math.max(maxY - minY, 1);

      // Body — reflective black: lit across the top face, deepest through the
      // middle, with a little bounce light caught underneath.
      const body = context.createLinearGradient(
        minX,
        minY,
        minX + w * 0.35,
        maxY,
      );
      body.addColorStop(0, ink.bodyHigh);
      body.addColorStop(0.42, ink.bodyLow);
      body.addColorStop(1, ink.bodyFloor);
      context.fillStyle = body;
      context.fill(path);

      context.save();
      context.clip(path);

      // Broad specular bloom in the upper left of the silhouette.
      const glare = context.createRadialGradient(
        minX + w * 0.32,
        minY + h * 0.22,
        0,
        minX + w * 0.32,
        minY + h * 0.22,
        Math.max(w, h) * 0.6,
      );
      glare.addColorStop(0, ink.specular);
      glare.addColorStop(1, ink.specularOut);
      context.fillStyle = glare;
      context.fillRect(minX - 2, minY - 2, w + 4, h + 4);

      // The outline again, nudged down and clipped — light catching the inside
      // of the top edge, which is what separates glass from a flat silhouette.
      context.translate(0, 1.4);
      context.strokeStyle = ink.innerRim;
      context.lineWidth = 1.2;
      context.stroke(path);
      context.restore();

      // Chrome rim. The bright / dark / bright banding is the whole trick — a
      // single flat silver would read as a plain stroke, not polished metal.
      const rim = context.createLinearGradient(minX, minY, maxX, maxY);
      rim.addColorStop(0, ink.rim0);
      rim.addColorStop(0.24, ink.rim1);
      rim.addColorStop(0.48, ink.rim2);
      rim.addColorStop(0.72, ink.rim3);
      rim.addColorStop(1, ink.rim4);
      context.strokeStyle = rim;
      context.lineWidth = 1.5;
      context.stroke(path);
    };

    /** Marching squares over the touched cells, then paints each closed loop. */
    const trace = (box: CellBox) => {
      frameId++;
      let startCount = 0;

      const link = (from: number, to: number) => {
        nextOf[from] = to;
        nextStamp[from] = frameId;
        if (startCount < starts.length) starts[startCount++] = from;
      };

      for (let gy = box.y0; gy < box.y1; gy++) {
        const row = gy * cols;

        for (let gx = box.x0; gx < box.x1; gx++) {
          const i = row + gx;
          const va = field[i];
          const vb = field[i + 1];
          const vc = field[i + cols + 1];
          const vd = field[i + cols];

          let code = 0;
          if (va >= THRESHOLD) code |= 8;
          if (vb >= THRESHOLD) code |= 4;
          if (vc >= THRESHOLD) code |= 2;
          if (vd >= THRESHOLD) code |= 1;
          if (code === 0 || code === 15) continue;

          // A crossing is named by the grid edge it sits on, so the two cells
          // sharing an edge produce the same id and the chain links up exactly.
          const top = i * 2;
          const left = i * 2 + 1;
          const right = (i + 1) * 2 + 1;
          const bottom = (i + cols) * 2;

          const cellX = originX + gx * CELL;
          const cellY = originY + gy * CELL;

          const setTop = () => {
            pointX[top] = cellX + ((THRESHOLD - va) / (vb - va)) * CELL;
            pointY[top] = cellY;
          };
          const setBottom = () => {
            pointX[bottom] = cellX + ((THRESHOLD - vd) / (vc - vd)) * CELL;
            pointY[bottom] = cellY + CELL;
          };
          const setLeft = () => {
            pointX[left] = cellX;
            pointY[left] = cellY + ((THRESHOLD - va) / (vd - va)) * CELL;
          };
          const setRight = () => {
            pointX[right] = cellX + CELL;
            pointY[right] = cellY + ((THRESHOLD - vb) / (vc - vb)) * CELL;
          };

          switch (code) {
            case 1:
              setLeft();
              setBottom();
              link(left, bottom);
              break;
            case 2:
              setBottom();
              setRight();
              link(bottom, right);
              break;
            case 3:
              setLeft();
              setRight();
              link(left, right);
              break;
            case 4:
              setRight();
              setTop();
              link(right, top);
              break;
            case 6:
              setBottom();
              setTop();
              link(bottom, top);
              break;
            case 7:
              setLeft();
              setTop();
              link(left, top);
              break;
            case 8:
              setTop();
              setLeft();
              link(top, left);
              break;
            case 9:
              setTop();
              setBottom();
              link(top, bottom);
              break;
            case 11:
              setTop();
              setRight();
              link(top, right);
              break;
            case 12:
              setRight();
              setLeft();
              link(right, left);
              break;
            case 13:
              setRight();
              setBottom();
              link(right, bottom);
              break;
            case 14:
              setBottom();
              setLeft();
              link(bottom, left);
              break;

            // Saddles: the two diagonal corners agree, so the cell center
            // decides whether the liquid joins through the middle or pinches.
            case 5:
              setTop();
              setRight();
              setBottom();
              setLeft();
              if ((va + vb + vc + vd) * 0.25 >= THRESHOLD) {
                link(left, top);
                link(right, bottom);
              } else {
                link(left, bottom);
                link(right, top);
              }
              break;
            case 10:
              setTop();
              setRight();
              setBottom();
              setLeft();
              if ((va + vb + vc + vd) * 0.25 >= THRESHOLD) {
                link(top, right);
                link(bottom, left);
              } else {
                link(top, left);
                link(bottom, right);
              }
              break;
          }
        }
      }

      for (let s = 0; s < startCount; s++) {
        const seed = starts[s];
        if (visitStamp[seed] === frameId) continue;

        let count = 0;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let edge = seed;

        for (;;) {
          if (visitStamp[edge] === frameId) break;
          visitStamp[edge] = frameId;

          const x = pointX[edge];
          const y = pointY[edge];
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (count < MAX_LOOP_POINTS) {
            loopX[count] = x;
            loopY[count] = y;
            count++;
          }

          if (nextStamp[edge] !== frameId) break;
          edge = nextOf[edge];
          if (edge === seed) break;
        }

        if (count >= 3) paint(buildPath(count), minX, minY, maxX, maxY);
      }
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      trace(buildField());
    };

    const step = (timestamp: number) => {
      const delta = Math.min((timestamp - lastFrame) / 1000, MAX_FRAME_SECONDS);
      lastFrame = timestamp;
      elapsed += delta;

      for (const bubble of bubbles) {
        bubble.y -= bubble.speed * delta;
        if (bubble.y <= 0) Object.assign(bubble, createBubble(true));
      }

      draw();
      animationId = requestAnimationFrame(step);
    };

    const stop = () => {
      if (animationId) cancelAnimationFrame(animationId);
      animationId = 0;
    };

    const start = () => {
      if (animationId || reducedMotion.matches || document.hidden) return;
      lastFrame = performance.now();
      animationId = requestAnimationFrame(step);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const ratio = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineJoin = "round";
      context.lineCap = "round";

      originX = -PAD;
      originY = -PAD;
      cols = Math.ceil((width + PAD * 2) / CELL) + 1;
      rows = Math.ceil((height + PAD * 2) / CELL) + 1;

      const points = cols * rows;
      field = new Float32Array(points);
      pointX = new Float32Array(points * 2);
      pointY = new Float32Array(points * 2);
      nextOf = new Int32Array(points * 2);
      nextStamp = new Int32Array(points * 2);
      visitStamp = new Int32Array(points * 2);
      starts = new Int32Array(points);
      frameId = 0;

      resizePopulation();
      draw();
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) {
        stop();
        draw();
      } else {
        start();
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    start();

    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotion.addEventListener("change", handleMotionPreference);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
