/**
 * canvas-scroll.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Canvas image-sequence renderer driven by GSAP ScrollTrigger + Locomotive
 * Scroll.
 *
 * Frame convention:
 *   assets/frames/0001.jpg  →  assets/frames/0300.jpg
 *   Padded to 4 digits, zero-left (configurable via FRAME_CONFIG below).
 *
 * Dependencies (loaded before this script):
 *   - Locomotive Scroll  v3.x
 *   - GSAP               v3.x
 *   - ScrollTrigger      v3.x (GSAP plugin)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ─── Configuration ────────────────────────────────────────────────────────── */
const FRAME_CONFIG = {
  /** Total number of frames in the sequence */
  count: 300,

  /** Path to the frames directory – trailing slash required */
  dir: "./assets/frames/",

  /** File extension for each frame */
  ext: ".jpg",

  /** Zero-padding width for the frame index (e.g. 4 → "0001") */
  padding: 4,

  /**
   * ScrollTrigger scroll distance expressed as a percentage of the page height.
   * "600% top" means the pin lasts for 6× the viewport height.
   */
  scrollEnd: "600% top",

  /**
   * GSAP scrub value – lower = snappier, higher = more lag/inertia.
   * 0.15 is the value from the original source.
   */
  scrub: 0.15,

  /**
   * The Locomotive Scroll / native scroller element selector.
   * Must match the element you initialise Locomotive Scroll on in main.js.
   */
  scrollerSelector: "#main",
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Build a zero-padded frame path.
 * e.g. framePath(1) → "./assets/frames/0001.jpg"
 */
function framePath(index) {
  return (
    FRAME_CONFIG.dir +
    String(index).padStart(FRAME_CONFIG.padding, "0") +
    FRAME_CONFIG.ext
  );
}

/**
 * Scale-to-fill (cover) an image onto the given canvas context,
 * centred horizontally and vertically.
 */
function scaleImage(img, ctx) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvas = ctx.canvas;
  const hRatio = canvas.width / img.naturalWidth;
  const vRatio = canvas.height / img.naturalHeight;
  const ratio = Math.max(hRatio, vRatio);
  const centerShiftX = (canvas.width - img.naturalWidth * ratio) / 2;
  const centerShiftY = (canvas.height - img.naturalHeight * ratio) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    img,
    0,
    0,
    img.naturalWidth,
    img.naturalHeight,
    centerShiftX,
    centerShiftY,
    img.naturalWidth * ratio,
    img.naturalHeight * ratio
  );
}

/* ─── Canvas setup ─────────────────────────────────────────────────────────── */

const canvas = document.querySelector("#canvas-bg");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

/* ─── Preload all frames ───────────────────────────────────────────────────── */

const frameCount = FRAME_CONFIG.count;
const images = [];

/** Current frame state – mutated by GSAP tween */
const imageSeq = { frame: 1 };

for (let i = 1; i <= frameCount; i++) {
  const img = new Image();
  img.src = framePath(i);
  images.push(img);
}

/* ─── Render function ──────────────────────────────────────────────────────── */

function render() {
  // imageSeq.frame is 1-based; array is 0-based
  const idx = Math.round(imageSeq.frame) - 1;
  scaleImage(images[Math.max(0, Math.min(idx, images.length - 1))], ctx);
}

// Draw first frame as soon as it loads
images[0].onload = render;

/* ─── GSAP ScrollTrigger animation ────────────────────────────────────────── */

// Register ScrollTrigger plugin (safe to call multiple times)
gsap.registerPlugin(ScrollTrigger);

// Animate imageSeq.frame from 1 → frameCount, driven by scroll
gsap.to(imageSeq, {
  frame: frameCount,
  snap: "frame",
  ease: "none",
  scrollTrigger: {
    trigger: "#page > #canvas-bg",
    start: "top top",
    end: FRAME_CONFIG.scrollEnd,
    scrub: FRAME_CONFIG.scrub,
    scroller: FRAME_CONFIG.scrollerSelector,
  },
  onUpdate: render,
});

// Pin the canvas for the duration of the scroll animation
ScrollTrigger.create({
  trigger: "#page > #canvas-bg",
  pin: true,
  start: "top top",
  end: FRAME_CONFIG.scrollEnd,
  scroller: FRAME_CONFIG.scrollerSelector,
});
