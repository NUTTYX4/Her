/**
 * main.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *   1. Entry gate (sound / no-sound buttons) → unlocks site
 *   2. GSAP ScrollTrigger setup:
 *        a. Intro hero → gallery transition (bg colour shift, gallery label fade)
 *        b. Three.js spiral only starts rotating once gallery is in view
 *   3. Audio: bg track + audio card toggling + mute button
 *   4. Modal: open/close (wired to Three.js raycaster in canvas-scroll.js)
 *   5. UI layer: view toggle, menu button hooks
 *
 * Three.js spiral logic lives in:  initThreeJSSpiral()  below.
 * Canvas frame-sequence logic removed (replaced by Three.js).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ─── GSAP plugin registration ─────────────────────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

/* ─── DOM refs ─────────────────────────────────────────────────────────────── */
const entryScreen    = document.getElementById('entry-screen');
const bgAudio        = document.getElementById('bg-audio');
const audioToggleBtn = document.getElementById('audio-toggle-btn');
const imageModal     = document.getElementById('image-modal');
const closeModalBtn  = document.getElementById('close-modal');

let isMuted = false;
let spiralStarted = false;

/* ═══════════════════════════════════════════════════════════════════════════
   1. ENTRY GATE
════════════════════════════════════════════════════════════════════════════ */
function unlockSite(playAudio) {
  if (playAudio && bgAudio) {
    bgAudio.volume = 0.35;
    bgAudio.play().catch(() => {}); // browser autoplay may block
    isMuted = false;
    audioToggleBtn.innerText = '🔊';
  } else {
    isMuted = true;
    audioToggleBtn.innerText = '🔇';
  }

  entryScreen.classList.add('hide');
  document.body.classList.add('site-loaded');

  // After CSS transition completes, remove from flow
  setTimeout(() => {
    entryScreen.style.display = 'none';
    initScrollTriggers(); // start GSAP scroll logic
  }, 1300);
}

document.getElementById('btn-sound')
  .addEventListener('click', () => unlockSite(true));
document.getElementById('btn-no-sound')
  .addEventListener('click', () => unlockSite(false));

/* ─── Audio toggle button ───────────────────────────────────────────────────── */
audioToggleBtn.addEventListener('click', () => {
  if (isMuted) {
    bgAudio.play();
    isMuted = false;
    audioToggleBtn.innerText = '🔊';
  } else {
    bgAudio.pause();
    isMuted = true;
    audioToggleBtn.innerText = '🔇';
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   2. GSAP SCROLL TRIGGERS
   Called after entry gate dismisses.
════════════════════════════════════════════════════════════════════════════ */
function initScrollTriggers() {

  /* ── 2a. Intro hero → gallery environment transition ─────────────────────
     When #gallery-section enters the viewport:
       - body gets class .in-gallery  (CSS handles colour shift)
       - gallery overlay label fades in
       - Three.js spiral initialises (once)
  ──────────────────────────────────────────────────────────────────────── */
  ScrollTrigger.create({
    trigger: '#gallery-section',
    start: 'top 80%',       // gallery enters 80% down the viewport
    end: 'bottom top',
    onEnter: () => {
      document.body.classList.add('in-gallery');

      // Fade in the gallery label
      gsap.to('#gallery-overlay-text', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      // Init Three.js only once
      if (!spiralStarted) {
        spiralStarted = true;
        initThreeJSSpiral();
      }
    },
    onLeaveBack: () => {
      document.body.classList.remove('in-gallery');
      gsap.to('#gallery-overlay-text', { opacity: 0, duration: 0.4 });
    },
  });

  /* ── 2b. View toggle highlight switches ─────────────────────────────────
     When the #what-you-did-section enters view, auto-switch to 'list' mode.
  ──────────────────────────────────────────────────────────────────────── */
  ScrollTrigger.create({
    trigger: '#what-you-did-section',
    start: 'top 60%',
    onEnter: () => {
      document.getElementById('btn-spiral').classList.remove('active');
      document.getElementById('btn-list').classList.add('active');
    },
    onLeaveBack: () => {
      document.getElementById('btn-spiral').classList.add('active');
      document.getElementById('btn-list').classList.remove('active');
    },
  });

  /* ── 2c. Intro hero parallax — media frame moves slower than scroll ──── */
  gsap.to('#intro-media-frame', {
    yPercent: -12,
    ease: 'none',
    scrollTrigger: {
      trigger: '#intro-hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });

  /* ── 2d. Intro text fades out as you scroll down ─────────────────────── */
  gsap.to('#intro-center', {
    opacity: 0,
    y: -40,
    ease: 'none',
    scrollTrigger: {
      trigger: '#intro-hero',
      start: '60% top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. THREE.JS SPIRAL
   Called once when #gallery-section enters the viewport.
   Scroll progress is read from native window scroll position.
════════════════════════════════════════════════════════════════════════════ */
function initThreeJSSpiral() {
  const canvas   = document.getElementById('scroll-canvas');
  const scene    = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 15;

  /* ── Spiral group ─────────────────────────────────────────────────────── */
  const spiralGroup = new THREE.Group();
  scene.add(spiralGroup);

  const totalImages = 15;
  const radius      = 8;
  const heightGap   = 0.7;
  const geometry    = new THREE.PlaneGeometry(3, 4.5);
  const textureLoader = new THREE.TextureLoader();

  for (let i = 0; i < totalImages; i++) {
    /*
     * Swap the MeshBasicMaterial below for textured planes once your
     * images are in assets/images/1.jpg … 15.jpg:
     *
     *   const texture  = textureLoader.load(`assets/images/${i + 1}.jpg`);
     *   const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
     */
    const material = new THREE.MeshBasicMaterial({
      color: 0x1a1a1a,
      side: THREE.DoubleSide,
    });

    const plane = new THREE.Mesh(geometry, material);
    const angle = (i / totalImages) * Math.PI * 2 * 2;

    plane.position.x  =  Math.sin(angle) * radius;
    plane.position.z  =  Math.cos(angle) * radius;
    plane.position.y  = (i * -heightGap) + (totalImages * heightGap / 2);
    plane.rotation.y  = angle;

    spiralGroup.add(plane);
  }

  /* ── Raycaster for click-to-open-modal ────────────────────────────────── */
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2();

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spiralGroup.children);

    if (intersects.length > 0) {
      const clicked = intersects[0].object;
      imageModal.style.display = 'block';

      if (clicked.material.map?.image?.src) {
        document.getElementById('modal-image').src = clicked.material.map.image.src;
      }

      // TODO: map plane index to custom text
      document.getElementById('modal-text').innerText =
        'This is the memory attached to this image.';
    }
  });

  /* ── GSAP scroll animation scoped to gallery section ─────────────────── */
  const galleryST = ScrollTrigger.create({
    trigger: '#gallery-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    onUpdate(self) {
      const p = self.progress;

      // Rotate full helix through 2 full turns
      spiralGroup.rotation.y = p * Math.PI * 4;

      // Translate upward through the helix
      spiralGroup.position.y = p * (totalImages * heightGap);
    },
  });

  /* ── Render loop ──────────────────────────────────────────────────────── */
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  /* ── Resize ───────────────────────────────────────────────────────────── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. MODAL close
════════════════════════════════════════════════════════════════════════════ */
closeModalBtn.addEventListener('click', () => {
  imageModal.style.display = 'none';
});

// Close on backdrop click
imageModal.addEventListener('click', (e) => {
  if (e.target === imageModal) imageModal.style.display = 'none';
});

/* ═══════════════════════════════════════════════════════════════════════════
   5. AUDIO CARDS logic (wired to #what-you-did-section audio elements)
   Handles Spotify-style play/pause with background track switching.
════════════════════════════════════════════════════════════════════════════ */
function initAudioCards() {
  const cards = document.querySelectorAll('.audio-card');
  if (!cards.length) return;

  cards.forEach(card => {
    const playBtn = card.querySelector('.play-btn');
    const track   = card.querySelector('audio');
    if (!playBtn || !track) return;

    playBtn.addEventListener('click', () => {
      if (track.paused) {
        // Pause all other tracks + background music
        document.querySelectorAll('.audio-card audio').forEach(a => a.pause());
        if (!isMuted && bgAudio) bgAudio.pause();

        track.play();
        playBtn.textContent = '⏸';
        card.classList.add('is-playing');
      } else {
        track.pause();
        playBtn.textContent = '▶';
        card.classList.remove('is-playing');

        // Resume background music
        if (!isMuted && bgAudio) bgAudio.play().catch(() => {});
      }
    });

    track.addEventListener('ended', () => {
      playBtn.textContent = '▶';
      card.classList.remove('is-playing');
      if (!isMuted && bgAudio) bgAudio.play().catch(() => {});
    });
  });
}

// Audio cards may be injected later; watch for them
document.addEventListener('DOMContentLoaded', () => {
  initAudioCards();
  // Re-init if Stitch content is injected dynamically
  const observer = new MutationObserver(() => initAudioCards());
  observer.observe(document.getElementById('what-you-did-section') || document.body, {
    childList: true,
    subtree: true,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   6. VIEW TOGGLE  (spiral / list)
   Visual-only for now — swap Three.js display mode when you're ready.
════════════════════════════════════════════════════════════════════════════ */
document.getElementById('btn-spiral')?.addEventListener('click', () => {
  document.getElementById('btn-spiral').classList.add('active');
  document.getElementById('btn-list').classList.remove('active');
  // TODO: show spiral view
});

document.getElementById('btn-list')?.addEventListener('click', () => {
  document.getElementById('btn-list').classList.add('active');
  document.getElementById('btn-spiral').classList.remove('active');
  // TODO: show list view
});
