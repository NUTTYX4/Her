# Her

> *A personal, dark-editorial web experience built around scroll-driven animation and a 3D spiral gallery.*

---

## What's been done

### Phase 1 — Scaffold & Version Control ✅

- Cloned reference repos (`aadilkhan08/CYBERFICTION-SOURCE-CODE` and `aadilkhan08/CANVAS-CODE`) to study the canvas scroll animation pattern
- Extracted **only** the core scroll animation logic — stripped all original media, hardcoded image lists, and UI content
- Reorganised everything into a clean, modular project structure (see below)
- Deleted the two clone directories — no original media carried over
- Initialised Git, connected to `https://github.com/NUTTYX4/Her`, and pushed the initial scaffold commit

### Current file tree

```
Her/
├── index.html              ← Full-screen canvas shell + empty semantic overlay tags
├── .gitignore
│
├── css/
│   └── style.css           ← Structural-only styles (no UI colours, no theme yet)
│
├── js/
│   ├── canvas-scroll.js    ← GSAP + ScrollTrigger image-sequence engine
│   └── main.js             ← Locomotive Scroll init + audio/UI interaction hooks
│
├── assets/
│   ├── frames/             ← [ EMPTY ] Drop 0001.jpg → 0300.jpg here
│   ├── images/             ← [ EMPTY ] Drop gallery photos here (1.jpg … 15.jpg)
│   └── audio/              ← [ EMPTY ] Drop bg-song.mp3 here
│
└── resources/
    └── The_timeline_gallery.txt   ← Blueprint spec for the Spiral UI (Phase 2)
```

### What each file does right now

| File | Purpose |
|---|---|
| `index.html` | Loads CDNs (Locomotive Scroll, GSAP, ScrollTrigger). Has `<canvas id="canvas-bg">` inside `#page`. Contains four **intentionally empty** semantic tags (`<header>`, `<main>`, `<article>`, `<footer>`) inside `#content-overlay` — these are the Stitch injection points |
| `css/style.css` | Reset + viewport base + `overflow:hidden` on body + canvas absolute fill + `#content-overlay` z-index above canvas. **No colours, no typography, no UI.** |
| `js/canvas-scroll.js` | Preloads `assets/frames/0001.jpg` → `0300.jpg` using `padStart(4,'0')`. Drives frame index with a GSAP tween scrubbed to scroll position. Pins the canvas for `600%` of the viewport height. All parameters are in a `FRAME_CONFIG` object at the top. |
| `js/main.js` | Initialises Locomotive Scroll on `#main`, proxies its scroll events into GSAP ScrollTrigger so both stay in sync. Contains stubbed, commented-out audio hooks ready to wire up. |

---

## The actual plan (Phase 2 onwards)

The blueprint is fully documented in [`resources/The_timeline_gallery.txt`](./resources/The_timeline_gallery.txt).

### Phase 2 — Rebuild the entry + UI layer

Replace the current empty `index.html` overlay with the **Spiral UI** structure from the blueprint:

- **Entry gate** — full-screen black cover with two buttons: *"Enter with sound"* / *"Enter without sound"*. Slides up with a cubic-bezier transition on click.
- **UI layer** (z-index: 999, always on top):
  - Top-left: *(no logo — removed from spec)*
  - Top-centre: `spiral • list` view toggle buttons
  - Top-right: `menu •` button (menu overlay wired in Phase 3)
  - Bottom-left: SVG circle with rotating text (`betrayal • regret • 2026 •` — customise the text)
  - Bottom-right: 🔊 audio mute/unmute toggle
- **3D canvas** (z-index: 1): Three.js `WebGLRenderer` rendering the spiral scene

Tech additions: **Three.js r128**, GSAP upgraded to **3.12.2**

### Phase 3 — Build the Three.js spiral

Inside `js/main.js`, implement `initThreeJSSpiral()`:

1. Create a Three.js scene + `PerspectiveCamera` (FOV 75, z=15)
2. Spawn **15 `PlaneGeometry(3, 4.5)`** meshes arranged in a double-loop helix:
   - `angle = (i / totalImages) * Math.PI * 2 * 2`
   - `x = sin(angle) * 8`, `z = cos(angle) * 8`, `y` staggered by `0.7` per frame
3. Each plane faces outward (`rotation.y = angle`)
4. GSAP ScrollTrigger drives:
   - `spiralGroup.rotation.y` → `Math.PI * 4` (two full rotations over scroll)
   - `spiralGroup.position.y` → scroll up through the helix
5. Scroll depth: `document.body.style.height = "6000px"`

### Phase 4 — Map your photos

Drop gallery images as `assets/images/1.jpg` … `15.jpg`, then swap placeholder grey materials for real textures:

```js
// Outside the loop:
const textureLoader = new THREE.TextureLoader();

// Inside the loop:
const texture = textureLoader.load(`assets/images/${i + 1}.jpg`);
const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
```

### Phase 5 — Wire audio

Drop `assets/audio/bg-song.mp3` and connect it to the entry gate's `unlockSite(playAudio)` function:

```js
bgAudio.volume = 0.4;
bgAudio.play();
```

The bottom-right toggle button will pause/resume it independently.

### Phase 6 — Theme via CSS variables

After Stitch design is finalised, update `:root` in `css/style.css`:

```css
:root {
  --bg-color: #050505;       /* pitch black / dark paper */
  --text-color: #e0e0e0;
  --accent-color: #333333;
  --font-primary: 'Courier New', monospace;
}
```

Swap values to match whatever palette comes out of Stitch.

### Phase 7 — Stitch UI injection

Any additional overlays (menu panel, list-view layout, etc.) designed in Google Stitch get placed inside `<div id="ui-layer">` in `index.html`. The `pointer-events` setup in the CSS already handles click passthrough correctly.

---

## Assets needed from you

| Asset | Location | Naming |
|---|---|---|
| Frame sequence (scroll animation) | `assets/frames/` | `0001.jpg` → `0300.jpg` |
| Gallery photos (spiral) | `assets/images/` | `1.jpg` → `15.jpg` |
| Background audio | `assets/audio/` | `bg-song.mp3` |

---

## Stack

| Library | Version | Purpose |
|---|---|---|
| Locomotive Scroll | 3.5.4 | Smooth scroll + ScrollTrigger proxy |
| GSAP | 3.12.2 | Scroll-driven animation tween engine |
| ScrollTrigger | 3.12.2 | Scroll-position → animation mapping |
| Three.js | r128 | 3D spiral gallery renderer |
