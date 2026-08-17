/**
 * main.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry-point for UI interactions and optional audio triggers.
 *
 * Responsibilities:
 *   1. Initialise Locomotive Scroll and proxy its events into GSAP ScrollTrigger.
 *   2. Expose hooks for audio playback (Web Audio API / HTMLAudioElement).
 *   3. Wire up any lightweight UI interactions that are NOT part of the canvas
 *      scroll animation (e.g. nav toggles, cursor effects, etc.).
 *
 * Note: Canvas animation logic lives entirely in js/canvas-scroll.js.
 *       Custom UI sections will be injected by Stitch – do NOT add UI-specific
 *       styles or logic here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ─── Locomotive Scroll init ───────────────────────────────────────────────── */

const locoScroll = new LocomotiveScroll({
  el: document.querySelector("#main"),
  smooth: true,
});

// Proxy Locomotive Scroll events into GSAP's ScrollTrigger so both stay in sync
locoScroll.on("scroll", ScrollTrigger.update);

ScrollTrigger.scrollerProxy("#main", {
  scrollTop(value) {
    return arguments.length
      ? locoScroll.scrollTo(value, 0, 0)
      : locoScroll.scroll.instance.scroll.y;
  },
  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },
  pinType: document.querySelector("#main").style.transform ? "transform" : "fixed",
});

// After all ScrollTriggers are created, let LocomotiveScroll update its state
ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
ScrollTrigger.refresh();

/* ─── Audio helpers ────────────────────────────────────────────────────────── */
// Place ambient / scroll-triggered audio files in assets/audio/ and
// reference them here.  Example:
//
//   const ambientTrack = new Audio("./assets/audio/ambient.mp3");
//   ambientTrack.loop = true;
//
//   // Play on first user interaction (required by browser autoplay policy)
//   document.addEventListener("click", () => ambientTrack.play(), { once: true });
//
//   // Or trigger at a specific scroll point:
//   ScrollTrigger.create({
//     trigger: "#some-section",
//     start: "top center",
//     scroller: "#main",
//     onEnter: () => ambientTrack.play(),
//     onLeaveBack: () => ambientTrack.pause(),
//   });

/* ─── UI interaction hooks ─────────────────────────────────────────────────── */
// Add lightweight DOM interactions below.
// Stitch-injected UI sections will live inside #content-overlay in index.html.
