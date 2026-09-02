const container = document.querySelector("#container");
const tile = document.querySelector(".tile");
const follower = document.getElementById("follower");
const followerLead = follower?.querySelector(".mouse-follower__orb--lead");
const followerTrail = follower?.querySelector(".mouse-follower__orb--trail");
const followerMedia = window.matchMedia("(pointer: fine) and (min-width: 769px)");

let tileHoverRaf = 0;
let lastHoveredTile = null;
let followerRaf = 0;
let pointerX = 0;
let pointerY = 0;
let leadX = 0;
let leadY = 0;
let trailX = 0;
let trailY = 0;

function isFollowerActive() {
  return (
    followerMedia.matches &&
    follower &&
    !follower.classList.contains("mouse-follower--hidden")
  );
}

function setFollowerOrbPosition(orb, x, y) {
  if (!orb) return;
  orb.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
}

function tickFollower() {
  followerRaf = requestAnimationFrame(tickFollower);
  if (!isFollowerActive()) return;

  leadX += (pointerX - leadX) * 0.34;
  leadY += (pointerY - leadY) * 0.34;
  trailX += (pointerX - trailX) * 0.13;
  trailY += (pointerY - trailY) * 0.13;

  setFollowerOrbPosition(followerLead, leadX, leadY);
  setFollowerOrbPosition(followerTrail, trailX, trailY);
}

function ensureFollowerLoop() {
  if (!followerRaf) {
    followerRaf = requestAnimationFrame(tickFollower);
  }
}

function updateTileHoverFromPoint(clientX, clientY) {
  const stack = document.elementsFromPoint(clientX, clientY);
  if (stack[0]?.closest?.(".hero-anim-switch")) {
    clearTileHover();
    return;
  }
  const hit = stack.find((el) => el.classList?.contains("tile"));
  if (hit === lastHoveredTile) return;
  if (lastHoveredTile) lastHoveredTile.classList.remove("tile--hover");
  lastHoveredTile = hit ?? null;
  if (lastHoveredTile) lastHoveredTile.classList.add("tile--hover");
}

function clearTileHover() {
  if (lastHoveredTile) lastHoveredTile.classList.remove("tile--hover");
  lastHoveredTile = null;
}

document.addEventListener("mousemove", (e) => {
  const x = e.clientX;
  const y = e.clientY;
  pointerX = x;
  pointerY = y;

  if (isFollowerActive()) {
    ensureFollowerLoop();
  }

  if (tileHoverRaf) cancelAnimationFrame(tileHoverRaf);
  tileHoverRaf = requestAnimationFrame(() => {
    tileHoverRaf = 0;
    updateTileHoverFromPoint(x, y);
  });
});

window.addEventListener("blur", clearTileHover);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") clearTileHover();
});

const TILE_COLS = 40;
const TILE_EXTRA_COUNT = 1399;
const HERO_ANIM_KEY = "portfolio-hero-anim";
const INTRO_MS = 2800;
const SPARKLE_EVERY_MS = 240;
const WAVE_RINGS = 3;
const WAVE_MAX_DIST_RATIO = 0.66;
const WAVE_FRONT_OVERSHOOT = 2.4;
const WAVE_TAIL_MS = 360;
const HERO_PAUSE_SCROLL_Y = 28;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const idleLit = new Set();
const heroAnimSwitch = document.querySelector(".hero-anim-switch");
const heroAnimReplayBtn = document.querySelector('[data-hero-anim="replay"]');
const heroAnimStopBtn = document.querySelector('[data-hero-anim="stop"]');
const heroBgEl = document.getElementById("container");
const heroTextEl = document.getElementById("content");

let tileMeta = [];
let waveTiles = [];
let sparklePool = [];
let tileMaxDist = 1;
let tilesReady = false;
let heroAnimStopped = false;
let heroShouldPlayIntro = true;
let heroAnimPlaying = "intro";
let heroAnimGen = 0;
let heroAnimRaf = 0;
let heroAnimTimer = 0;
let heroInView = true;
let heroScrollPaused = false;
let heroScrollRaf = 0;

try {
  localStorage.removeItem(HERO_ANIM_KEY);
} catch {
  /* ignore */
}

function clearIdleLit() {
  idleLit.forEach((el) => el.classList.remove("tile--idle"));
  idleLit.clear();
}

function setIdleLit(nextSet) {
  idleLit.forEach((el) => {
    if (!nextSet.has(el)) el.classList.remove("tile--idle");
  });
  nextSet.forEach((el) => {
    if (!idleLit.has(el)) el.classList.add("tile--idle");
  });
  idleLit.clear();
  nextSet.forEach((el) => idleLit.add(el));
}

function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

function canRunHeroIdle() {
  return (
    tilesReady &&
    !heroAnimStopped &&
    !heroScrollPaused &&
    !prefersReducedMotion() &&
    document.visibilityState === "visible" &&
    heroInView
  );
}

function afterPaint(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

function shouldPlayWaveIntro() {
  return followerMedia.matches;
}

function warmHeroTilePaints() {
  if (!tileMeta.length) return;

  const marked = [];
  const seen = new Set();
  const mark = (el) => {
    if (!el || seen.has(el)) return;
    seen.add(el);
    marked.push(el);
  };

  for (let i = 0; i < waveTiles.length; i += 1) {
    if (waveTiles[i].dist <= 2.4) mark(waveTiles[i].el);
  }
  for (let i = 0; i < tileMeta.length && marked.length < 28; i += 1) {
    const nth = i + 1;
    if (nth % 4 === 0 || nth % 7 === 0 || nth % 11 === 1) mark(tileMeta[i].el);
  }

  container.classList.add("is-anim-frozen");
  for (let i = 0; i < marked.length; i += 1) marked[i].classList.add("tile--idle");
  void container.offsetWidth;
  for (let i = 0; i < marked.length; i += 1) marked[i].classList.remove("tile--idle");
  void container.offsetWidth;
  container.classList.remove("is-anim-frozen");
}

function indexTiles() {
  const tileNodes = Array.from(container.querySelectorAll(".tile"));
  const tileRows = Math.ceil(tileNodes.length / TILE_COLS);
  const tileCenterCol = (TILE_COLS - 1) / 2;
  const tileCenterRow = (tileRows - 1) / 2;
  let maxDist = 0;
  tileMeta = tileNodes.map((el, i) => {
    const col = i % TILE_COLS;
    const row = Math.floor(i / TILE_COLS);
    const dist = Math.hypot(col - tileCenterCol, row - tileCenterRow);
    if (dist > maxDist) maxDist = dist;
    return {
      el,
      dist,
    };
  });
  tileMaxDist = maxDist || 1;
  waveTiles = tileMeta.filter((item) => item.dist <= tileMaxDist * WAVE_MAX_DIST_RATIO);
  sparklePool = tileMeta.filter(
    (item) => item.dist >= tileMaxDist * 0.22 && item.dist < tileMaxDist * 0.62
  );
  tilesReady = true;
}

function populateTiles(onDone) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < TILE_EXTRA_COUNT; i += 1) {
    frag.appendChild(tile.cloneNode(false));
  }
  container.appendChild(frag);
  indexTiles();
  afterPaint(onDone);
}

function syncHeroAnimSwitch() {
  if (heroAnimReplayBtn) {
    heroAnimReplayBtn.classList.toggle("is-playing", !heroAnimStopped && heroAnimPlaying === "intro");
  }
  if (heroAnimStopBtn) {
    heroAnimStopBtn.classList.toggle("is-active", heroAnimStopped);
    heroAnimStopBtn.setAttribute("aria-pressed", String(heroAnimStopped));
  }
}

function stopHeroIdleTimers() {
  if (heroAnimTimer) {
    clearTimeout(heroAnimTimer);
    heroAnimTimer = 0;
  }
  if (heroAnimRaf) {
    cancelAnimationFrame(heroAnimRaf);
    heroAnimRaf = 0;
  }
}

function freezeHeroTiles() {
  heroAnimGen += 1;
  stopHeroIdleTimers();
  container.classList.add("is-anim-frozen");
  container.classList.remove("is-pulsing");
  clearIdleLit();
}

function unfreezeHeroTiles() {
  container.classList.remove("is-anim-frozen");
}

function pauseHeroTiles({ consumeIntro = false } = {}) {
  freezeHeroTiles();
  if (consumeIntro) heroShouldPlayIntro = false;
  if (heroAnimStopped) return;
  if (consumeIntro) heroAnimPlaying = "idle";
  syncHeroAnimSwitch();
}

function collectRippleRing(front) {
  const next = new Set();
  const frontRing = Math.round(front);
  const maxBehind = (WAVE_RINGS - 1) * 2;
  for (let i = 0; i < waveTiles.length; i += 1) {
    const dist = waveTiles[i].dist;
    const ring = Math.round(dist);
    if (ring > frontRing) continue;
    const behind = frontRing - ring;
    if (behind % 2 !== 0) continue;
    if (behind > maxBehind) continue;
    next.add(waveTiles[i].el);
  }
  return next;
}

function pickSparkleTile() {
  const pool = sparklePool.length ? sparklePool : tileMeta;
  return pool[(Math.random() * pool.length) | 0];
}

function playHeroTiles(gen, playIntro) {
  const litUntil = new Map();
  const introEndMs = playIntro ? INTRO_MS + WAVE_TAIL_MS : 0;
  let nextSpawnAt = introEndMs;
  const start = performance.now();
  const waveExtent = tileMaxDist * WAVE_MAX_DIST_RATIO + WAVE_FRONT_OVERSHOOT;
  const waveTailTravel = (WAVE_RINGS - 1) * 2 + 2;

  return new Promise((resolve) => {
    const tick = (now) => {
      if (gen !== heroAnimGen) {
        resolve(false);
        return;
      }

      const elapsed = now - start;
      let next = new Set();
      if (playIntro && elapsed < introEndMs) {
        container.classList.add("is-pulsing");
        if (elapsed < INTRO_MS) {
          const t = Math.min(1, elapsed / INTRO_MS);
          const eased = 1 - (1 - t) * (1 - t);
          next = collectRippleRing(eased * waveExtent);
        } else {
          const tail = Math.min(1, (elapsed - INTRO_MS) / WAVE_TAIL_MS);
          next = collectRippleRing(waveExtent + tail * waveTailTravel);
        }
      } else if (playIntro && heroAnimPlaying === "intro") {
        container.classList.remove("is-pulsing");
        heroAnimPlaying = "idle";
        syncHeroAnimSwitch();
      }

      if (!playIntro || elapsed >= introEndMs) {
        while (nextSpawnAt <= elapsed) {
          const ttl = 520 + Math.random() * 680;
          if (nextSpawnAt + ttl > elapsed) {
            const count = 1 + ((Math.random() * 2) | 0);
            for (let i = 0; i < count; i += 1) {
              litUntil.set(pickSparkleTile().el, nextSpawnAt + ttl);
            }
          }
          nextSpawnAt += SPARKLE_EVERY_MS;
        }
        litUntil.forEach((until, el) => {
          if (until > elapsed) next.add(el);
          else litUntil.delete(el);
        });
      }

      setIdleLit(next);
      heroAnimRaf = requestAnimationFrame(tick);
    };
    heroAnimRaf = requestAnimationFrame(tick);
  });
}

function restartHeroAnim({ playIntro } = {}) {
  heroAnimGen += 1;
  stopHeroIdleTimers();
  clearIdleLit();
  unfreezeHeroTiles();
  if (playIntro != null) heroShouldPlayIntro = playIntro;
  syncHeroAnimSwitch();
  if (!canRunHeroIdle()) return;

  const gen = heroAnimGen;
  const intro = heroShouldPlayIntro && shouldPlayWaveIntro();
  heroShouldPlayIntro = false;
  heroAnimPlaying = intro ? "intro" : "idle";
  syncHeroAnimSwitch();

  heroAnimTimer = setTimeout(() => {
    heroAnimTimer = 0;
    if (gen !== heroAnimGen) return;
    playHeroTiles(gen, intro);
  }, intro ? 160 : 80);
}

function stopHeroAnim() {
  heroAnimStopped = true;
  freezeHeroTiles();
  heroAnimPlaying = "stopped";
  syncHeroAnimSwitch();
  requestAnimationFrame(() => {
    if (!heroScrollPaused) unfreezeHeroTiles();
  });
}

function replayHeroIntro() {
  heroAnimStopped = false;
  heroScrollPaused = window.scrollY > HERO_PAUSE_SCROLL_Y;
  restartHeroAnim({ playIntro: shouldPlayWaveIntro() });
}

function syncHeroPerspective() {
  if (!heroBgEl || !heroTextEl) return;
  const flatten = window.scrollY > 1;
  heroBgEl.classList.toggle("container", !flatten);
  heroBgEl.classList.toggle("container-flat", flatten);
  heroTextEl.classList.toggle("content", !flatten);
  heroTextEl.classList.toggle("content-flat", flatten);
}

function syncHeroScrollPause() {
  const shouldPause = window.scrollY > HERO_PAUSE_SCROLL_Y;
  if (shouldPause === heroScrollPaused) return;
  heroScrollPaused = shouldPause;
  if (shouldPause) pauseHeroTiles({ consumeIntro: true });
  else if (canRunHeroIdle()) restartHeroAnim();
}

function onHeroScroll() {
  if (heroScrollRaf) return;
  heroScrollRaf = requestAnimationFrame(() => {
    heroScrollRaf = 0;
    syncHeroPerspective();
    syncHeroScrollPause();
  });
}

heroAnimReplayBtn?.addEventListener("click", replayHeroIntro);
heroAnimStopBtn?.addEventListener("click", stopHeroAnim);

if (heroAnimSwitch) {
  const heroAnimIo = new IntersectionObserver(
    (entries) => {
      const visible = Boolean(entries[0]?.isIntersecting);
      if (visible === heroInView) return;
      heroInView = visible;
      if (heroInView) restartHeroAnim();
      else pauseHeroTiles();
    },
    { threshold: 0.12 }
  );
  heroAnimIo.observe(document.querySelector(".main-content"));
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") restartHeroAnim();
  else pauseHeroTiles();
});

const onReducedMotionChange = () => restartHeroAnim();
if (typeof reducedMotionQuery.addEventListener === "function") {
  reducedMotionQuery.addEventListener("change", onReducedMotionChange);
} else if (typeof reducedMotionQuery.addListener === "function") {
  reducedMotionQuery.addListener(onReducedMotionChange);
}

syncHeroAnimSwitch();
heroScrollPaused = window.scrollY > HERO_PAUSE_SCROLL_Y;
syncHeroPerspective();

function waitForHeroCopy(fn) {
  const panel = document.querySelector(".hero-panel");
  if (!panel || prefersReducedMotion()) {
    fn();
    return;
  }

  const opacity = Number(getComputedStyle(panel).opacity);
  const remaining = panel.classList.contains("show")
    ? Math.max(80, Math.round((1 - Math.min(1, opacity)) * 1000) + 80)
    : 1080;

  heroAnimTimer = setTimeout(() => {
    heroAnimTimer = 0;
    fn();
  }, remaining);
}

function startInitialIntro() {
  waitForHeroCopy(() => {
    restartHeroAnim({ playIntro: shouldPlayWaveIntro() });
  });
}

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});

document.querySelectorAll(".hidden").forEach((el) => {
  if (el === container) return;
  heroObserver.observe(el);
});

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    populateTiles(() => {
      warmHeroTilePaints();
      container.classList.add("show");
      heroObserver.observe(container);
      afterPaint(startInitialIntro);
    });
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
);

document.querySelectorAll(".js-reveal").forEach((el) => revealObserver.observe(el));

window.addEventListener("scroll", onHeroScroll, { passive: true });

function hashToGradientIndex(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 4;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LANG_STORAGE_KEY = "portfolio-lang";
const I18N = window.PORTFOLIO_I18N || { en: {}, es: {} };
const CERT_I18N = window.PORTFOLIO_CERT_I18N || { en: {}, es: {} };
const PROJECT_I18N = window.PORTFOLIO_PROJECT_I18N || {};

function detectInitialLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

let currentLang = detectInitialLang();

function getDict(lang = currentLang) {
  return I18N[lang] || I18N.en || {};
}

function t(path, lang = currentLang) {
  const parts = String(path).split(".");
  let node = getDict(lang);
  for (const part of parts) {
    if (node == null || typeof node !== "object") return path;
    node = node[part];
  }
  if (typeof node === "string") return node;
  if (node == null) {
    if (lang !== "en") return t(path, "en");
    return path;
  }
  return node;
}

function localizeProject(project) {
  if (currentLang !== "es") return project;
  const es = PROJECT_I18N[project.id];
  if (!es) return project;
  return {
    ...project,
    title: es.title ?? project.title,
    role: es.role ?? project.role,
    tagline: es.tagline ?? project.tagline,
    status: es.status ?? project.status,
    statusKind: es.statusKind ?? project.statusKind,
    description: es.description ?? project.description,
    descriptionLong: es.descriptionLong ?? project.descriptionLong,
    highlights: es.highlights ?? project.highlights,
    metrics: es.metrics ?? project.metrics,
    techMetrics: es.techMetrics ?? project.techMetrics,
    caseStudy: es.caseStudy ?? project.caseStudy,
    myRole: es.myRole ?? project.myRole,
  };
}

function getImpactStats() {
  const stats = t("stats");
  return Array.isArray(stats) ? stats : I18N.en.stats;
}

function localizeCert(cert) {
  const pack = CERT_I18N[currentLang]?.[cert.id] || CERT_I18N.en?.[cert.id] || {};
  const dates = t("certDates") || {};
  return {
    ...cert,
    name: pack.name || cert.name,
    issuer: pack.issuer || cert.issuer,
    date: dates[cert.date] || cert.date,
  };
}

const PROJECT_VERCEL_ADDED_AT = {
  "fut-camara": 1788372000000,
  "la-diagonal": 1788364000000,
  "legacy-ux-helper": 1788358000000,
  "utility-tool": 1788349000000,
  "lomas-gym": 1787095253205,
  "mix-potrero": 1787077136217,
  tecnoleg: 1786762848479,
  "caw-education-landing": 1783340832826,
  "la-leyenda": 1786057992000,
  "bullet-hell-example": 1780945476668,
  "la-congreso": 1780657175106,
  "mvp-to-pro-lightning-talk": 1780700000000,
  "reaction-app": 1777403805339,
  "cba-volleystar": 1774551561780,
  "terradeco": 1772062426356,
  "volley-manager": 1766793459390,
  "caw-tech": 1765908454103,
  "sublimspace": 1764598034846,
  "expologic": 1764114884350,
  "little-bite-society": 1762882384069,
  "caw-education": 1758499439618,
  "enduring-education": 1752118627457,
  "txtgen": 1750771534132,
  "bootcamp-backend": 1727912956755,
  "indumentaria-taurie": 1692133002148,
  "cebamate": 1698196864848,
  "moustache-gentleman": 1689158490247,
  "tarjeta-15-catalina": 1687646879081,
  "caw-motors": 1683526439698,
  "tarjeta-18-mateo": 1679121828599,
  "zetaross": 1650186570595,
};

function compareProjectsDefault(a, b) {
  const aFeatured = a.featured ? 1 : 0;
  const bFeatured = b.featured ? 1 : 0;
  if (bFeatured !== aFeatured) return bFeatured - aFeatured;

  const aOrder = a.featuredOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.featuredOrder ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;

  const aAdded = PROJECT_VERCEL_ADDED_AT[a.id];
  const bAdded = PROJECT_VERCEL_ADDED_AT[b.id];

  if (aAdded != null && bAdded != null) {
    if (bAdded !== aAdded) return bAdded - aAdded;
  } else if (aAdded != null) {
    return -1;
  } else if (bAdded != null) {
    return 1;
  }

  if (b.year !== a.year) return b.year - a.year;
  return a.title.localeCompare(b.title);
}

const projects = [
  {
    id: "volley-manager",
    title: "Volley Manager",
    year: 2026,
    featured: true,
    featuredOrder: 1,
    role: "Principal Software Engineer · Co-Founder · CAW Tech",
    tagline: "Production SaaS / PWA for professional volleyball club operations",
    status: "In production",
    statusKind: "production",
    description:
      "Production SaaS/PWA powering daily operations for a professional volleyball club in Bolivia — athletes, staff, access, payments and coaching tools.",
    descriptionLong:
      "Volley Manager is a production digital operations platform for a professional volleyball club in Bolivia. It supports club administration, athlete management, attendance, alerts, notifications, financial workflows and access control — including QR access and consent-based facial recognition, with QR fallback when consent is not provided. Families can register and pay online through an integration with Banco Económico (Bolivia).",
    technologies: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "PWA", "Vercel"],
    metrics: [
      { value: "~700", label: "Athletes" },
      { value: "~15", label: "Staff members" },
      { value: "~600", label: "Daily access events" },
      { value: "4K+", label: "Visitors / 30 days" },
      { value: "15K+", label: "Page views / 30 days" },
    ],
    techMetrics: [{ value: "100K+", label: "Supabase requests / 7 days" }],
    caseStudy: [
      {
        title: "The problem",
        body: "A professional club needs a single operational system for athletes, staff and families — not a generic admin CRUD. Daily check-ins, payments, attendance and coaching workflows have to work together under real venue conditions.",
      },
      {
        title: "The platform",
        body: "Volley Manager acts as the club’s digital operational system: administration, athlete status, attendance, alerts, notifications, financial management and day-to-day staff workflows in one production SaaS/PWA.",
      },
      {
        title: "Product modules",
        items: [
          "Club administration and athlete management",
          "Attendance, alerts and operational notifications",
          "Financial management and daily administrative workflows",
          "QR access with consent-based facial recognition fallback to QR",
          "Online registration and payment flow for athletes/families",
        ],
      },
      {
        title: "Coaching & scouting",
        body: "A domain-specific coaching module with an interactive visual volleyball court. Coaches record and manage scouting information through a spatial workflow — not a generic statistics form.",
      },
      {
        title: "AI / voice scouting",
        body: "Includes AI chat contextualized with club information and a voice-based volleyball scouting workflow designed and developed specifically for coaches who need to capture information without breaking attention on the court.",
      },
      {
        title: "Payments & access",
        body: "Online registration and payments integrated with Banco Económico (Bolivia). Access control combines QR and consent-based facial recognition, with QR as the fallback when consent is not provided. No sensitive biometric or financial details are exposed here.",
      },
      {
        title: "My role",
        body: "As Principal Software Engineer and Co-Founder at CAW Tech, I own architecture decisions, product design, implementation, integrations, deployment and ongoing technical evolution end-to-end.",
      },
    ],
    highlights: [
      "Production platform for ~700 athletes and ~15 staff with ~600 daily access/check-in events.",
      "Administrative, financial, attendance and access-control workflows — including Banco Económico payments.",
      "Interactive volleyball scouting court, AI-assisted club context and voice-based scouting for coaches.",
    ],
    image: "./assets/media/VolleyManager.webp",
  },
  {
    id: "expologic",
    title: "ExpoLogic",
    year: 2026,
    featured: true,
    featuredOrder: 2,
    role: "Principal Software Engineer · Co-Founder · CAW Tech",
    tagline: "B2B2C multi-tenant SaaS for cultural fairs, artisan markets and entrepreneur events",
    status: "MVP · Seed · Validated prototype",
    statusKind: "mvp",
    description:
      "Multi-tenant SaaS that replaces Excel, WhatsApp and paper maps with interactive fair maps, reservations, waitlists, virtual fairs and analytics.",
    descriptionLong:
      "ExpoLogic is a B2B2C multi-tenant SaaS that centralizes cultural fairs, artisan markets and entrepreneur events — professionalizing access to commercial spaces in the popular economy through digital inclusion. Organizers get a real-time operations panel; exhibitors reserve stands in a few clicks; visitors explore the fair online 24/7 before and after the physical event. Built for a market of 3,500+ active fairs and 50K+ recurrent exhibitors in Argentina, with field validation of ~50 interviews in Tucumán.",
    technologies: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Tailwind CSS", "Vercel"],
    metrics: [
      { value: "~50", label: "Field interviews" },
      { value: "3.5K+", label: "Active fairs (AR)" },
      { value: "50K+", label: "Recurrent exhibitors" },
      { value: "Semi", label: "Emprende U" },
    ],
    caseStudy: [
      {
        title: "The problem",
        body: "Organizers run Excel, WhatsApp and paper floor plans — up to ~20 days of management per event. Exhibitors face uncertainty, queues and late confirmations with no traceability. Empty stands, unidentified payments and zero audit trails hurt municipalities. Validated in the field with ~50 interviews across Tucumán fairs.",
      },
      {
        title: "3 problems · 1 solution",
        items: [
          "Organizer: Excel · WhatsApp · Paper → centralized real-time panel",
          "Exhibitor: reservation uncertainty → simple two-click booking",
          "Visitor: fair only on event day → explore the virtual fair 24/7 online",
        ],
      },
      {
        title: "The platform",
        body: "A unique regional approach for fair operations: real-time interactive maps with mobile reservation, automated waitlists and payment audit for organizers, public event presence plus a free landing/catalog per exhibitor, and a virtual fair that stays visible before and after the event — stands, products and upcoming editions online.",
      },
      {
        title: "Multi-tenant hub",
        body: "A central hub manages tenants/organizers. Each organizer receives their own environment to manage events, reservations, public websites, maps and exhibitors — plus a template engine so organizers design layouts without depending on third parties.",
        diagram:
          "CAW / Hub\n├── Tenant A / Organizer\n│   ├── Event\n│   ├── Reservations\n│   ├── Website\n│   ├── Map\n│   └── Exhibitors\n└── Tenant B / Organizer\n    ├── Event\n    ├── Reservations\n    ├── Website\n    ├── Map\n    └── Exhibitors",
      },
      {
        title: "Business model",
        items: [
          "Per-event pricing — percentage per exhibitor above a threshold, or fixed fee by attendance",
          "Monthly maintenance — database, hosting and event web presence",
          "Optional setup — map build and organizer onboarding",
          "Free for exhibitors — landing, catalog and web visibility included (social-impact B2B SaaS)",
        ],
      },
      {
        title: "Market & goals",
        body: "Segment: B2B organizers and B2C exhibitors/feriantes. Goal: become the national standard for ephemeral space management, run NOA pilots from Tucumán, and partner with municipalities, culture secretariats and communities for regional digital inclusion.",
      },
      {
        title: "External validation",
        body: "Presented at Emprende U and reached the semifinal stage; featured by La Gaceta. Prospective organizers in Tucumán have expressed interest; the product is being prepared for broader adoption. One-pager: niclen17.github.io/ExpoLogic-one-pager/",
      },
      {
        title: "My role",
        body: "As Principal Software Developer / Co-Founder at CAW Tech, I own SaaS architecture, product vision and end-to-end implementation of the multi-tenant hub, map builder, reservation flows and virtual-fair experience.",
      },
    ],
    highlights: [
      "Replaces weeks of manual fair ops with real-time maps, reservations, waitlists and payment audit.",
      "Free exhibitor landings + 24/7 virtual fair — B2B SaaS with social-impact positioning.",
      "Validated with ~50 field interviews; 3.5K+ fairs / 50K+ exhibitors market; Emprende U semifinalist.",
    ],
    url: "https://caw-expologic.vercel.app/",
    image: "./assets/media/ExpoLogic.webp",
  },
  {
    id: "caw-education",
    title: "CAW Education",
    year: 2026,
    role: "Principal Software Engineer · Co-Founder · CAW Tech",
    tagline: "Data-driven educational operations for primary and secondary schools",
    status: "Product development",
    statusKind: "dev",
    description:
      "Education platform for schools — attendance, grades, student evolution, alerts and organizational KPIs.",
    descriptionLong:
      "CAW Education is a CAW Tech product targeted at primary and secondary schools. The platform is designed to centralize educational data such as attendance, grades, student evolution, comparisons, alerts, parent notifications, teacher and preceptor information, and academic/organizational KPIs — influenced by a Data Science for Organizations background and positioned as data-driven educational operations.",
    technologies: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Tailwind CSS", "Chart.js", "Vercel"],
    caseStudy: [
      {
        title: "The problem",
        body: "Schools often manage attendance, grades, alerts and family communication across fragmented tools and spreadsheets, limiting operational visibility.",
      },
      {
        title: "The platform",
        body: "Designed to centralize student attendance, grades, evolution, comparisons, alerts, parent notifications and academic/organizational KPIs for teachers, preceptors and families.",
      },
      {
        title: "My role",
        body: "Designed the product architecture and data-oriented workflows, applying organizational data-analysis principles to turn educational records into operational dashboards and decision-support views.",
      },
    ],
    highlights: [
      "Designed a data-driven education platform for primary and secondary schools.",
      "Centralizes attendance, grades, student evolution, comparisons and alerts.",
      "Operational dashboards and KPIs for teachers, preceptors and families.",
    ],
    url: "https://caweducation.com",
    image: "./assets/media/cawpic.webp",
  },
  {
    id: "tecnoleg",
    title: "Tecnoleg",
    year: 2026,
    featured: true,
    featuredOrder: 3,
    role: "Full Stack · E-commerce",
    tagline: "Smart store for refurbished tech — catalog, checkout and operations admin",
    status: "In production",
    statusKind: "production",
    description:
      "Production smart store for accessible technology in Tucumán — storefront, cart/checkout and admin operations.",
    descriptionLong:
      "Tecnoleg is a production e-commerce platform for refurbished phones, notebooks and accessories. It combines a public storefront with authenticated admin tooling: catalog/provider sync, order operations, MFA-ready auth and analytics dashboards. Deployed on Vercel with a custom domain (tecnoleg.com.ar).",
    technologies: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "Vercel"],
    highlights: [
      "Production storefront with catalog, PDP, cart and checkout flows.",
      "Admin Operate shell for inventory sync, orders and KPI dashboards.",
      "Security hardening with MFA gate support and audit-oriented policies.",
    ],
    url: "https://www.tecnoleg.com.ar",
    image: "./assets/media/tecnoleg.webp",
  },
  {
    id: "legacy-ux-helper",
    title: "Legacy UX Helper",
    year: 2026,
    featured: true,
    featuredOrder: 6,
    role: "Product engineer · Chrome extension",
    tagline: "Highlight actionable controls in legacy web UIs — 100% local, no layout shift",
    status: "Local tool",
    statusKind: "production",
    description:
      "Chrome extension that outlines clickable elements in legacy interfaces without changing the page layout.",
    descriptionLong:
      "Legacy UX Helper is a Manifest V3 Chrome extension for operators working on dense, non-semantic enterprise screens. It highlights buttons, links, inputs, ARIA controls, onclick leftovers and clickable tables — without mutating the DOM or shifting layout. Three modes (All / Legacy only / Hover guide), training labels, accessibility presets and JSON import/export stay on the machine: chrome.storage.local only, no host permissions, no analytics.",
    technologies: ["JavaScript", "Chrome Extension", "Manifest V3", "CSS"],
    caseStudy: [
      {
        title: "The problem",
        body: "Legacy ERPs and banking UIs hide what is actually clickable — cursor:pointer on tables, inline onclick, missing labels. New operators waste time hunting controls, and modernization work starts without a map of the real interaction surface.",
      },
      {
        title: "The tool",
        body: "A local overlay that classifies interactive nodes and draws type-colored outlines. Modes isolate non-semantic leftovers or follow the pointer so trainers can walk a screen without painting the whole page.",
      },
      {
        title: "Privacy constraint",
        body: "Built for environments that cannot send page contents off-device. Permissions are storage, activeTab and scripting. No tabs API, no domain rules, no cloud sync.",
      },
      {
        title: "My role",
        body: "Designed and shipped the extension end-to-end: content script, popup, options, settings schema, icon pipeline and Chrome Web Store packaging notes.",
      },
    ],
    highlights: [
      "Three highlight modes plus training labels for onboarding on legacy screens.",
      "Zero layout shift — CSS overlay only; HTML is never rewritten.",
      "100% local: chrome.storage.local, no host permissions, no telemetry.",
    ],
    repo: "https://github.com/NicLen17/legacy-ux-helper",
    image: "./assets/media/legacy-ux-helper.webp",
  },
  {
    id: "utility-tool",
    title: "Utility Tool",
    year: 2026,
    role: "Product engineer · Local-first suite",
    tagline: "Images, video, audio, PDFs and developer tools — processed on your machine",
    status: "Local-first product",
    statusKind: "production",
    description:
      "Local-first utility suite for media, PDFs and developer tools — no cloud uploads, no subscriptions.",
    descriptionLong:
      "Utility Tool replaces web compressors and converters that impose size caps, daily limits and third-party uploads. It runs as a Next.js 16 app on localhost: Sharp for images, FFmpeg for video/audio, pdf-lib for PDFs, plus QR generation and a developer toolbox (JSON, JWT, regex, hashes, SVG optimize). Favorites and recents stay in localStorage. Vercel is a non-goal — FFmpeg and large files belong on the machine, not on a serverless timeout.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Sharp", "FFmpeg"],
    caseStudy: [
      {
        title: "The problem",
        body: "Everyday convert/compress sites upload files to someone else's server, then gate basic features behind subscriptions. That is the wrong trust model for personal photos, client PDFs and internal recordings.",
      },
      {
        title: "The product",
        body: "A categorized desktop-in-the-browser: batch image compress/convert/resize, watermark and EXIF strip, video/audio transcode, PDF merge/split, QR/vCard, and a command-palette developer drawer.",
      },
      {
        title: "Why not Vercel",
        body: "Heavy media needs system FFmpeg, large request bodies and long timeouts. Shipping localhost (or a VPS/Docker box) keeps files private and the feature set honest.",
      },
    ],
    highlights: [
      "Local processing with Sharp, FFmpeg and pdf-lib — files never leave the machine.",
      "Command palette (Ctrl+K), favorites and light/dark — a suite, not a single form.",
      "Documented as local-first: serverless deploy would break video/audio and privacy.",
    ],
    repo: "https://github.com/NicLen17/utility-tool",
    image: "./assets/media/project-generic.webp",
  },
  {
    id: "la-diagonal",
    title: "La Diagonal",
    year: 2026,
    role: "Full Stack · Booking platform",
    tagline: "Sports-complex booking — interactive venue map, holds, payments and admin builder",
    status: "MVP · In development",
    statusKind: "mvp",
    description:
      "Booking platform for sports complexes — public landing, interactive pitch map and an admin map builder.",
    descriptionLong:
      "La Diagonal is a Next.js 16 booking platform for sports venues. The first reference client is Complejo La Diagonal (Tafí Viejo, Tucumán), with a multi-site architecture ready for more complexes. Guests filter courts on an interactive map, hold a slot for 15 minutes, confirm payment (cash / deposit / transfer) and get a WhatsApp confirmation. Operators get KPI dashboards, a drag-and-drop map builder, and CRUD for courts, hours and pricing. Phase 1 uses a mock data adapter; the Supabase schema, RLS and RPCs are already documented.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Zod", "Supabase"],
    caseStudy: [
      {
        title: "The problem",
        body: "Neighborhood complexes still take bookings over WhatsApp with no hold, no court map and no shared price rules. Double bookings and ad-hoc discounts become the operations model.",
      },
      {
        title: "The platform",
        body: "A public booking flow with URL-driven filters, a 15-minute hold, reservation lookup by code + phone, and an admin shell that lets the venue draw its own pitch map instead of waiting on a developer.",
      },
      {
        title: "Architecture",
        body: "Ports-and-adapters data layer (DATA_ADAPTER=mock|supabase). Availability, pricing and WhatsApp live in services; Postgres schema, RLS and pg_cron are specified for the production cutover.",
      },
    ],
    highlights: [
      "End-to-end booking: map, 15-min hold, payment method and WhatsApp confirmation.",
      "Admin map builder plus courts, hours, pricing rules and KPI dashboard.",
      "Mock adapter in place; Supabase schema and RLS documented for production.",
    ],
    repo: "https://github.com/NicLen17/la-diagonal",
    image: "./assets/media/la-diagonal.webp",
  },
  {
    id: "fut-camara",
    title: "FutCam",
    year: 2026,
    role: "Research · Computer vision",
    tagline: "Offline CV pipeline for amateur football — distance, sprints, heatmaps from a fixed camera",
    status: "Research · Phase 0–1",
    statusKind: "dev",
    description:
      "Offline computer-vision pipeline for amateur F5/F7/F9 match analytics from a fixed camera.",
    descriptionLong:
      "FutCam processes amateur football recordings (F5/F7/F9) shot with a fixed camera and aims to emit physical metrics per player: distance, speed, sprints, heatmaps and a relative rating. The current cut is Phase 0–1 — Python package, venue calibration, homography and a Typer CLI (futcam info / probe / calibrate / process). Detection is planned around RF-DETR + ByteTrack rather than YOLO; team classification (SigLIP + UMAP) and a future Next.js/Supabase surface sit on a later roadmap. Honest status: scaffold and calibration, not a production product yet.",
    technologies: ["Python", "PyTorch", "OpenCV", "RF-DETR", "ByteTrack", "Typer"],
    caseStudy: [
      {
        title: "The bet",
        body: "Amateur 5/7/9-a-side has almost no affordable tracking. A fixed camera plus offline batch processing can produce useful physical reports without a stadium install.",
      },
      {
        title: "Current slice",
        body: "CLI-first Python package: config via Pydantic, interactive venue calibration, homography to meters, and a documented AMD ROCm / NVIDIA setup path.",
      },
      {
        title: "Status",
        body: "Phase 0–1. Process is still a stub until detection/tracking land. Published as research — ADRs explain RF-DETR over YOLO.",
      },
    ],
    highlights: [
      "Offline batch pipeline for amateur formats — not a live stadium product.",
      "CLI + venue calibration + homography; RF-DETR / ByteTrack on the roadmap.",
      "Phase 0–1: architecture and calibration shipped; match processing still in progress.",
    ],
    repo: "https://github.com/NicLen17/fut-camara",
    image: "./assets/media/project-generic.webp",
  },
  {
    id: "lomas-gym",
    title: "Lomas Gym",
    year: 2026,
    role: "Full Stack · Gym operations MVP",
    tagline: "Digital gym ops — public landing, admin, QR member pass and check-in totem",
    status: "MVP · Demo",
    statusKind: "mvp",
    description:
      "Gym management MVP for Lomas Gym Tucumán — landing, admin panel, QR membership pass and reception check-in.",
    descriptionLong:
      "Lomas Gym is a Next.js MVP that digitizes neighborhood gym operations: a public marketing site with plans and location, an admin panel for members/cash/dashboard metrics, a mobile member pass with QR/status, and a reception totem for DNI/QR check-in. Phase-1 demo persistence uses localStorage before a planned Supabase backend.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "PWA", "Vercel"],
    highlights: [
      "Four product surfaces: landing, admin, member pass and check-in totem.",
      "Membership and cash workflows designed for daily gym reception use.",
      "PWA-ready demo deploy on Vercel for client validation.",
    ],
    url: "https://lomas-gym.vercel.app",
    image: "./assets/media/lomas-gym.webp",
  },
  {
    id: "mix-potrero",
    title: "Mix Potrero",
    year: 2026,
    role: "Product engineer · PWA",
    tagline: "Pickup football team builder with coin toss, scorecards and pitch cost splits",
    status: "In production",
    statusKind: "production",
    description:
      "PWA to build balanced football teams from WhatsApp lists — captains coin toss, match summary images and pitch-cost tracking.",
    descriptionLong:
      "Mix Potrero helps amateur football groups paste player lists, generate balanced squads (including skill ratings), flip a captains coin toss, share PNG match summaries to WhatsApp and track who paid for the pitch with La Vaquita. Built as a mobile-first Vite PWA for on-field use.",
    technologies: ["Vite", "JavaScript", "PWA", "Vercel"],
    highlights: [
      "Parses free-form WhatsApp player lists into balanced team draws.",
      "Captains coin toss, rematch shuffle and shareable PNG score summaries.",
      "La Vaquita pitch-cost tracker with WhatsApp payment copy.",
    ],
    url: "https://mix-potrero.vercel.app",
    image: "./assets/media/mix-potrero.webp",
  },
  {
    id: "caw-education-landing",
    title: "CAW Education Landing",
    year: 2026,
    role: "Front end · CAW Tech",
    description:
      "Marketing landing for CAW Education — product story, modules, FAQ and demo CTAs.",
    descriptionLong:
      "Official marketing site for CAW Education: hero and problem/solution narrative, feature and module grids, data-analysis positioning, education-level solutions, testimonials, FAQ and demo contact flows. Built with Next.js, Framer Motion and a CAW brand palette.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel"],
    highlights: [
      "High-conversion marketing narrative for school administrators.",
      "Motion and brand-token polish aligned with CAW Education identity.",
      "Production deploy with Vercel Analytics and Speed Insights.",
    ],
    url: "https://caweducation.com",
    image: "./assets/media/caw-education-landing.webp",
  },
  {
    id: "sublimspace",
    title: "Sublimspace",
    year: 2026,
    featured: true,
    featuredOrder: 7,
    role: "Full Stack · E-commerce",
    description:
      "Wholesale and retail commerce for customized products — catalog, coupons, and sales analytics.",
    descriptionLong:
      "Sublimspace runs B2B and B2C flows for personalized merchandise: variant catalogs, coupon campaigns, order tracking, and sales dashboards. The storefront balances merchandising flexibility with checkout clarity for repeat wholesale buyers and retail customers.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    highlights: [
      "Catalog and variant management for customized product lines.",
      "Coupon and promotion flows with conversion-oriented UX.",
      "Analytics views for sales performance and inventory movement.",
    ],
    url: "https://sublimspacetuc.vercel.app",
    image: "./assets/media/Sublimspace.webp",
  },
  {
    id: "caw-tech",
    title: "CAW Tech",
    year: 2026,
    featured: true,
    featuredOrder: 4,
    role: "Co-founder · Principal Software Engineer",
    description:
      "Company marketing site — services, product positioning, and high-conversion contact funnels.",
    descriptionLong:
      "The CAW Tech site presents the studio’s product and engineering capabilities with a performance-first marketing stack. It supports lead capture, service discovery, and credibility signals for enterprise and SMB prospects evaluating custom software delivery.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    highlights: [
      "Positioned CAW Tech’s product portfolio and engineering practice for inbound leads.",
      "Optimized Core Web Vitals and semantic structure for discoverability.",
      "Custom domain on production with continuous deploy from main branch.",
    ],
    url: "https://www.caw.com.ar",
    image: "./assets/media/CAW.webp",
  },
  {
    id: "txtgen",
    title: "TxtGen",
    year: 2025,
    featured: true,
    featuredOrder: 5,
    role: "Product engineer",
    description:
      "Generate downloadable structured .txt documents from configurable templates.",
    descriptionLong:
      "TxtGen lets users compose repeatable text exports from templates—ideal for batch documentation, labels, and structured reports. The UI focuses on template editing, preview, and one-click downloads without server-side lock-in for simple workflows.",
    technologies: ["React", "TypeScript", "Vite", "JavaScript", "Vercel"],
    highlights: [
      "Template builder with live preview before export.",
      "Deterministic .txt output for repeatable operational documents.",
      "Zero-friction deploy for internal and public use.",
    ],
    url: "https://txt-gent.vercel.app/",
    image: "./assets/media/TxtGen.webp",
  },
  {
    id: "bootcamp-backend",
    title: "Bootcamp Back-end",
    year: 2024,
    role: "Back-end · Education",
    description:
      "Bootcamp management API — cohorts, students, and documented REST endpoints.",
    descriptionLong:
      "A Node.js backend for bootcamp operations: cohort lifecycle, student records, and authenticated APIs documented in Postman. Designed for teaching environments where clarity of contracts matters as much as runtime stability.",
    technologies: ["Node.js", "Express", "MongoDB", "JavaScript", "Postman"],
    highlights: [
      "REST APIs with consistent error shapes for frontend consumers.",
      "MongoDB schemas for cohorts, enrollments, and progress tracking.",
      "Postman documentation for partner teams and students.",
    ],
    image: "./assets/media/BOTCAMPBACK.webp",
  },
  {
    id: "la-leyenda",
    title: "La Leyenda",
    year: 2026,
    role: "Full stack · Game / product",
    description:
      "CS2 career simulator — narrative events, roles, daily challenges and shareable career summaries.",
    descriptionLong:
      "La Leyenda is a web career simulator inspired by El Ídolo: short matches, high-impact decisions and a shareable retirement summary. Players pick nick, region, nationality and role (Entry / AWP / IGL / Lurk / Support), resolve 200+ narrative events, close tournament splits and compare careers against legends. Built with Next.js and TypeScript; optional Supabase for daily rankings, with localStorage fallback.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Supabase", "Vercel"],
    highlights: [
      "Client-side game engine with narrative events, splits and retirement summary.",
      "Daily challenge and ranking flows with optional Supabase persistence.",
      "Production deploy on Vercel (la-leyenda-counter-strike.vercel.app).",
    ],
    url: "https://la-leyenda-counter-strike.vercel.app",
    image: "./assets/media/la-leyenda.webp",
  },
  {
    id: "cba-volleystar",
    title: "CBA VolleyStar",
    year: 2026,
    role: "Full stack · CAW Tech",
    description:
      "Public landing for the Bolivian volleyball club that runs on Volley Manager — brand, info and athlete registration CTAs.",
    descriptionLong:
      "CBA VolleyStar is the public-facing site of the professional volleyball club in Bolivia for which we built Volley Manager. It acts as the club’s open web presence — branding, fixtures and fan information — and as a direct CTA funnel into Volley Manager for player registration and onboarding into the production operations system.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    highlights: [
      "Landing for the Bolivia club that uses Volley Manager in production.",
      "Public CTA / registration path that connects athletes straight into Volley Manager.",
      "Mobile-first club branding and match-day information architecture.",
    ],
    url: "https://cba-volleystar.vercel.app",
    image: "./assets/media/CBA.webp",
  },
  {
    id: "terradeco",
    title: "Terradeco",
    year: 2026,
    role: "Full stack · Landing & catalog",
    description:
      "Home décor brand site — product storytelling, catalog browsing, and contact-led sales.",
    descriptionLong:
      "Terradeco presents a curated home décor catalog with editorial product pages and contact-first conversion. The build focuses on visual hierarchy, fast image delivery, and clear paths for quotes and wholesale inquiries.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    highlights: [
      "Product-led layout with category navigation and detail pages.",
      "Performance-minded media handling for lifestyle photography.",
      "Production deploy with Vercel preview pipeline.",
    ],
    url: "https://terradeco.vercel.app",
    image: "./assets/media/Terradeco.webp",
  },
  {
    id: "enduring-education",
    title: "Enduring Education",
    year: 2025,
    role: "Front end · Education",
    description:
      "Digital toolkit for university educators — engagement, content, and retention-oriented UX.",
    descriptionLong:
      "Enduring Education packages strategies and digital tools for faculty adoption: resource hubs, engagement patterns, and content structures that support retention goals. The experience is optimized for educators evaluating methods without heavy onboarding friction.",
    technologies: ["React", "TypeScript", "Vite", "Vercel"],
    highlights: [
      "Structured content modules for faculty workflows and student engagement.",
      "Accessible, responsive layouts for institutional audiences.",
      "Iterated UX based on educator feedback loops.",
    ],
    url: "https://enduring-education.vercel.app",
    image: "./assets/media/EnduringEducation.webp",
  },
  {
    id: "little-bite-society",
    title: "Little Bite Society",
    year: 2025,
    role: "Front end · Food brand",
    description:
      "Bakery brand landing — menu highlights, story-driven sections, and inquiry CTAs.",
    descriptionLong:
      "Little Bite Society is a brand-forward landing for a bakery business: product highlights, story sections, and contact paths for orders and events. Visual design emphasizes warmth and clarity on mobile-first traffic.",
    technologies: ["React", "Vite", "CSS", "JavaScript", "Vercel"],
    highlights: [
      "Story-driven single-page experience with strong visual hierarchy.",
      "CTA flows for orders, events, and social discovery.",
      "Lightweight deploy suitable for frequent menu updates.",
    ],
    url: "https://little-bite-society.vercel.app",
    image: "./assets/media/LBS.webp",
  },
  {
    id: "reaction-app",
    title: "Reaction",
    year: 2026,
    role: "Product · Sports / physical training PWA",
    description:
      "PWA for physical trainers — react to visual and sound stimuli, including combined trigger modes.",
    descriptionLong:
      "Reaction was built for physical trainers and sports performance work: athletes respond to visual cues (colors, countdowns, directions) and sound stimuli, including mixed combinations such as colors + numbers, directions + numbers, or directions + colors — all also implementable with audio. The landing documents game modes — Colors, Directions, Actions and Mixed (command + reaction) — each with its own instructions. Delivered as an installable PWA so high-level trainers can run sessions from a phone without app-store friction.",
    technologies: ["Next.js", "TypeScript", "React", "PWA", "Vercel"],
    highlights: [
      "Stimulus training for colors, countdowns, directions and sound — combinable triggers.",
      "Modes: Colors, Directions, Actions and Mixed (command + reaction) with clear instructions.",
      "Installable PWA for on-court / gym use by physical trainers.",
    ],
    url: "https://reaction-app-alpha.vercel.app/",
    image: "./assets/media/Reaction.webp",
  },
  {
    id: "bullet-hell-example",
    title: "Bullet Hell Example",
    year: 2026,
    role: "Side project · Prompt challenge game",
    description:
      "Browser bullet hell minigame built with several developers in under 3 prompts — dense patterns and canvas combat.",
    descriptionLong:
      "Bullet Hell Example came from a collaborative challenge: several developers teamed up to ship a playable minigame in fewer than three prompts. The result is a classic bullet hell — survive escalating waves of projectiles, dodge dense pattern scripts, and chase high scores in a browser canvas loop. Beyond the fun, it was a stress test of prompt-driven collaboration, entity pooling, collision detection and deployable real-time game loops on Vercel.",
    technologies: ["Next.js", "TypeScript", "React", "Canvas", "Vercel"],
    highlights: [
      "Team challenge: playable minigame shipped in under 3 prompts with several developers.",
      "Classic bullet hell loop — waves, pattern scripting, collision and score chase on canvas.",
      "Shareable Vercel deploy of a prompt-collaboration experiment.",
    ],
    url: "https://bullet-hell-example.vercel.app",
    image: "./assets/media/bullet-hell.webp",
  },
  {
    id: "la-congreso",
    title: "LA Congreso",
    year: 2026,
    role: "Full stack · Artisan marketplace",
    description:
      "House of crafts marketplace — multi-brand catalog, maker stories, and WhatsApp-led ordering.",
    descriptionLong:
      "LA Congreso is a shared retail home for artisan brands in San Miguel de Tucumán: unified catalog, entrepreneur spotlights, trend carousels, and contact flows tuned for local buying habits. The site balances editorial storytelling with product discovery across bookbinding, fragrances, textiles, and more.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    highlights: [
      "Multi-vendor catalog with brand-specific story pages.",
      "Mobile-first commerce paths via WhatsApp and email inquiry.",
      "Community positioning as a permanent house for makers and workshops.",
    ],
    url: "https://la-congreso.vercel.app",
    image: "./assets/media/la-congreso.webp",
  },
  {
    id: "mvp-to-pro-lightning-talk",
    title: "MVP to Pro · Lightning Talk",
    year: 2026,
    role: "Talk deck · Product & UX",
    description:
      "Slide deck on Volley Manager scouting — when a dense, expert-first UI beats minimal design.",
    descriptionLong:
      "A presentation site for a UTN lightning talk tracing three scouting interface iterations for Volley Manager: tabular MVP, spatial court mapping, and a pro-grade dense dashboard with international symbols. The narrative challenges the “less is more” default — in live sports capture, intentional visual saturation can be the fastest path for expert operators.",
    technologies: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Three-phase product story: tabular → spatial → pro efficiency.",
      "Keyboard-first, single-click action density for match-day scouting.",
      "Public build-in-public artifact documenting real production trade-offs.",
    ],
    url: "https://niclen17.github.io/Lightning-Talk-MVP-to-PRO/",
    image: "./assets/media/mvp-to-pro.webp",
  },
  {
    id: "caw-motors",
    title: "CAW Motors",
    year: 2024,
    role: "Freelance · Marketing site",
    description:
      "Demo clone of a vehicle listings marketing site — discovery filters and contact flows (not the live client project).",
    descriptionLong:
      "Public demo clone kept for portfolio security: mirrors a second-hand vehicle marketing site with search-friendly listing pages, vehicle detail views, and contact funnels. This is not the production client deployment — SEO and performance patterns from the original engagement are represented here without exposing the live business site.",
    technologies: ["React", "JavaScript", "HTML", "CSS", "Vercel"],
    highlights: [
      "Portfolio security clone — not the live client project.",
      "Inventory browsing with clear CTAs to seller contact.",
      "Structured metadata patterns for search and social sharing.",
    ],
    url: "https://consecionaria.vercel.app",
    image: "./assets/media/CAW-3.webp",
  },
  {
    id: "cebamate",
    title: "CEBAMATE",
    year: 2023,
    role: "Freelance · SMB storefront",
    description:
      "Demo clone of a personalized mates storefront — catalog and responsive commerce flows (not the live shop).",
    descriptionLong:
      "Public demo clone kept for portfolio security: represents an SMB e-commerce presence for customized mate products with category browsing, product detail pages, and WhatsApp/form-style ordering. This is not the real client storefront — shared as a sanitized replica of the work delivered.",
    technologies: ["HTML", "CSS", "JavaScript", "Vercel"],
    highlights: [
      "Portfolio security clone — not the live client project.",
      "Visual catalog patterns aligned with artisan product photography.",
      "Conversion paths adapted to regional purchase behavior.",
    ],
    url: "https://ceba-mate.vercel.app",
    image: "./assets/media/CEBAMATE 1.webp",
  },
  {
    id: "indumentaria-taurie",
    title: "Indumentaria Taurie",
    year: 2023,
    role: "Freelance · Clothing retail",
    description:
      "Demo clone of a clothing retail storefront — discovery, sizing context and contact checkout (not the live brand site).",
    descriptionLong:
      "Public demo clone kept for portfolio security: mirrors a fashion retail site with collections, size guidance, and inquiry-based purchasing. This is not the production brand website — published as a sanitized replica of the visual merchandising work delivered for the client.",
    technologies: ["HTML", "CSS", "JavaScript", "Vercel"],
    highlights: [
      "Portfolio security clone — not the live client project.",
      "Collection-first navigation with emphasis on imagery.",
      "Lightweight stack patterns for fast client-side updates.",
    ],
    url: "https://indumentaria-taurie.vercel.app",
    image: "./assets/media/TAURIE.webp",
  },
  {
    id: "moustache-gentleman",
    title: "Moustache Gentleman",
    year: 2023,
    role: "Freelance · Local business",
    description:
      "Barber shop site — service menu, gallery, and appointment inquiry flows.",
    descriptionLong:
      "Brand site for a barber shop combining service pricing, style gallery, and booking inquiries. Tone and typography reflect the shop’s premium positioning while keeping mobile booking one tap away.",
    technologies: ["HTML", "CSS", "JavaScript", "Vercel"],
    highlights: [
      "Service menu with clear pricing and duration cues.",
      "Gallery and social proof blocks for local SEO.",
    ],
    url: "https://moustache-gentlemen.vercel.app",
    image: "./assets/media/PELUQUERIA 1.webp",
  },
  {
    id: "tarjeta-18-mateo",
    title: "18th birthday · Mateo",
    year: 2023,
    role: "Freelance · Event landing",
    description:
      "Digital invitation with RSVP-style registration and event details.",
    descriptionLong:
      "A celebratory landing page with schedule, location, dress code, and RSVP capture. Optimized for shareability on messaging apps and single-evening traffic spikes.",
    technologies: ["HTML", "CSS", "JavaScript", "Vercel"],
    highlights: [
      "Share-friendly layout for WhatsApp and Instagram traffic.",
      "RSVP capture with lightweight client validation.",
    ],
    url: "https://mateo-github-io.vercel.app",
    image: "./assets/media/18MAURO.webp",
  },
  {
    id: "tarjeta-15-catalina",
    title: "15th birthday · Catalina",
    year: 2023,
    role: "Freelance · Event landing",
    description:
      "Quinceañera invitation with RSVP flow and themed visual design.",
    descriptionLong:
      "Similar event-landing pattern for a quinceañera: hero storytelling, venue details, gift registry links, and confirmed guest counts via RSVP forms.",
    technologies: ["HTML", "CSS", "JavaScript", "Vercel"],
    highlights: [
      "Themed art direction consistent with the celebration palette.",
      "Guest list capture with mobile-first form UX.",
    ],
    url: "https://15-catalina.vercel.app",
    image: "./assets/media/15CATA.webp",
  },
  {
    id: "zetaross",
    title: "ZETAROSS",
    year: 2022,
    role: "Freelance · Product showcase",
    description:
      "Demo clone of a 3D-print collectibles showcase — catalog browse and inquiry flows (not the live brand site).",
    descriptionLong:
      "Public demo clone kept for portfolio security: represents a product gallery for 3D-printed figures with category filters and inquiry CTAs. This is not the real client website — shared as a sanitized replica of the visual-first catalog work delivered.",
    technologies: ["HTML", "CSS", "JavaScript", "Vercel"],
    highlights: [
      "Portfolio security clone — not the live client project.",
      "Visual-first catalog patterns for collectible lines.",
      "Inquiry funnel without over-engineered checkout.",
    ],
    url: "https://zetaross.vercel.app",
    image: "./assets/media/ZETAROSS.webp",
  },
  {
    id: "keis",
    title: "KEIS",
    year: 2021,
    role: "Freelance · Institutional",
    description:
      "Institutional site for food technicians highlighting dairy production scope and quality.",
    descriptionLong:
      "KEIS presents technical credentials, production capabilities, and quality standards for food-sector stakeholders. Information architecture favors trust signals and clear service descriptions.",
    technologies: ["HTML", "CSS", "JavaScript", "Vercel"],
    highlights: [
      "Credibility-focused layout for B2B visitors.",
      "Structured service and certification storytelling.",
    ],
    url: "https://planta-productora-queso.vercel.app",
    image: "./assets/media/KEIS.webp",
  },
  {
    id: "phone-pixel",
    title: "Phone Pixel",
    year: 2021,
    role: "Template · E-commerce demo",
    description:
      "E-commerce template demonstrating product grids, filters, and cart UX patterns.",
    descriptionLong:
      "A reusable ecommerce template exploring product cards, category filters, and cart interactions—useful as a baseline for client proposals and rapid storefront prototypes.",
    technologies: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Reusable components for future client storefronts.",
      "Demonstrates mobile cart and filter patterns.",
    ],
    image: "./assets/media/PHONEPIXEL.webp",
  },
];

const PROJECT_PREVIEW_COUNT = 6;
const projectsContainer = document.getElementById("projects-container");
const projectsMore = document.getElementById("projects-more");
const projectsToggle = document.getElementById("projects-toggle");
let projectSortCriteria = "none";
let projectsExpanded = false;

function renderProjectCard(p) {
  const project = localizeProject(p);
  const gi = hashToGradientIndex(project.id);
  const cardTags = (project.technologies ?? []).slice(0, 6);
  const tagsHtml = cardTags
    .map((tag) => `<span class="accent-pill">${escapeHtml(tag)}</span>`)
    .join("");
  const title = escapeHtml(project.title);
  const bar = `<div class="project-card__bar"><h3 class="project-card__title">${title}</h3><span class="project-card__year">${project.year}</span></div>`;
  const scrim = `<div class="project-card__scrim" aria-hidden="true"></div>`;
  const altSuffix = t("projects.screenshotAlt");
  const media = project.image
    ? `<div class="project-card__media"><img loading="lazy" src="${escapeHtml(project.image)}" alt="${title} — ${escapeHtml(altSuffix)}" /><div class="project-card__shine" aria-hidden="true"></div>${scrim}${bar}</div>`
    : `<div class="project-card__media project-card__media--gradient project-card__grad--${gi}"><div class="project-card__shine" aria-hidden="true"></div>${scrim}${bar}</div>`;

  return `
    <a href="#project/${escapeHtml(project.id)}" class="project-card" data-project-id="${escapeHtml(project.id)}" aria-label="${escapeHtml(t("projects.viewDetailsFor"))} ${title}">
      ${media}
      <div class="project-card__body">
        <p class="project-card__desc">${escapeHtml(project.description)}</p>
        <div class="project-card__tags">${tagsHtml}</div>
        <p class="project-card__hint">${escapeHtml(t("projects.viewDetails"))}</p>
      </div>
    </a>
  `;
}

function getSortedProjects() {
  const sorted = [...projects];
  switch (projectSortCriteria) {
    case "alphabetical-asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "alphabetical-desc":
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "release-asc":
      sorted.sort((a, b) => a.year - b.year);
      break;
    case "release-desc":
      sorted.sort((a, b) => b.year - a.year);
      break;
    default:
      sorted.sort(compareProjectsDefault);
      break;
  }
  return sorted;
}

const projectPage = document.getElementById("project-page");
const projectPageMedia = document.getElementById("project-page-media");
const projectPageTitle = document.getElementById("project-page-title");
const projectPageTagline = document.getElementById("project-page-tagline");
const projectPageYear = document.getElementById("project-page-year");
const projectPageStatus = document.getElementById("project-page-status");
const projectPageRole = document.getElementById("project-page-role");
const projectPageDesc = document.getElementById("project-page-desc");
const projectPageMetrics = document.getElementById("project-page-metrics");
const projectPageCase = document.getElementById("project-page-case");
const projectPageHighlights = document.getElementById("project-page-highlights");
const projectPageTechMetrics = document.getElementById("project-page-tech-metrics");
const projectPageTags = document.getElementById("project-page-tags");
const projectPageActions = document.getElementById("project-page-actions");

let activeProjectId = null;

function shouldShowProjectUrl(project) {
  return Boolean(project.url && project.year >= 2025);
}

function getProjectIdFromHash(hash = window.location.hash) {
  const match = hash.match(/^#project\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
}

function renderProjectMedia(project) {
  if (!projectPageMedia) return;
  const gi = hashToGradientIndex(project.id);
  if (project.image) {
    projectPageMedia.hidden = false;
    projectPageMedia.className = "project-page__media";
    projectPageMedia.innerHTML = `<img loading="lazy" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} — ${escapeHtml(t("projects.screenshotAlt"))}" />`;
    return;
  }
  projectPageMedia.hidden = false;
  projectPageMedia.className = `project-page__media project-page__media--gradient project-card__grad--${gi}`;
  projectPageMedia.innerHTML = "";
}

function renderMetricCards(items) {
  return (items ?? [])
    .map(
      (metric) => `
        <div class="project-page__metric">
          <span class="project-page__metric-value">${escapeHtml(metric.value)}</span>
          <span class="project-page__metric-label">${escapeHtml(metric.label)}</span>
        </div>`
    )
    .join("");
}

function renderCaseStudy(sections) {
  return (sections ?? [])
    .map((section) => {
      const items = Array.isArray(section.items)
        ? `<ul class="project-page__case-list">${section.items
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>`
        : "";
      const body = section.body
        ? `<p class="project-page__case-body">${escapeHtml(section.body)}</p>`
        : "";
      const diagram = section.diagram
        ? `<pre class="project-page__diagram">${escapeHtml(section.diagram)}</pre>`
        : "";
      return `
        <article class="project-page__case-block">
          <h2 class="project-page__case-title">${escapeHtml(section.title)}</h2>
          ${body}
          ${items}
          ${diagram}
        </article>`;
    })
    .join("");
}

function appendProjectAction(href, label, variant) {
  if (!projectPageActions) return;
  const link = document.createElement("a");
  link.className = variant === "ghost" ? "project-page__link project-page__link--ghost" : "project-page__link";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.innerHTML = `${escapeHtml(label)} <span aria-hidden="true">↗</span>`;
  projectPageActions.append(link);
}

function renderProjectPageLink(project) {
  if (!projectPageActions) return;
  projectPageActions.innerHTML = "";
  if (shouldShowProjectUrl(project)) {
    appendProjectAction(project.url, t("projects.visitLive"));
  }
  if (project.repo) {
    appendProjectAction(project.repo, t("projects.viewSource"), "ghost");
  }
}

function fillProjectPage(project) {
  renderProjectMedia(project);
  if (projectPageTitle) projectPageTitle.textContent = project.title;
  if (projectPageYear) projectPageYear.textContent = String(project.year);
  if (projectPageRole) {
    projectPageRole.textContent = project.role ?? "";
    projectPageRole.hidden = !project.role;
  }

  if (projectPageTagline) {
    projectPageTagline.textContent = project.tagline ?? "";
    projectPageTagline.hidden = !project.tagline;
  }

  if (projectPageStatus) {
    projectPageStatus.textContent = project.status ?? "";
    projectPageStatus.hidden = !project.status;
    projectPageStatus.className = "project-page__status";
    if (project.statusKind === "mvp") projectPageStatus.classList.add("project-page__status--mvp");
    if (project.statusKind === "dev") projectPageStatus.classList.add("project-page__status--dev");
  }

  if (projectPageDesc) {
    projectPageDesc.textContent = project.descriptionLong ?? project.description;
  }

  if (projectPageMetrics) {
    const hasMetrics = Array.isArray(project.metrics) && project.metrics.length > 0;
    projectPageMetrics.hidden = !hasMetrics;
    projectPageMetrics.innerHTML = hasMetrics ? renderMetricCards(project.metrics) : "";
  }

  if (projectPageCase) {
    const hasCase = Array.isArray(project.caseStudy) && project.caseStudy.length > 0;
    projectPageCase.hidden = !hasCase;
    projectPageCase.innerHTML = hasCase ? renderCaseStudy(project.caseStudy) : "";
  }

  if (projectPageHighlights) {
    const showHighlights = !(Array.isArray(project.caseStudy) && project.caseStudy.length > 0);
    projectPageHighlights.innerHTML = showHighlights
      ? (project.highlights ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "";
    projectPageHighlights.hidden = !showHighlights || !project.highlights?.length;
  }

  if (projectPageTechMetrics) {
    const hasTech = Array.isArray(project.techMetrics) && project.techMetrics.length > 0;
    projectPageTechMetrics.hidden = !hasTech;
    projectPageTechMetrics.innerHTML = hasTech
      ? `<h2 class="project-page__tech-metrics-title">${escapeHtml(
          t("projects.techScale")
        )}</h2><div class="project-page__tech-metrics-grid">${renderMetricCards(
          project.techMetrics
        )}</div>`
      : "";
  }

  if (projectPageTags) {
    const techList = project.technologies ?? [];
    projectPageTags.innerHTML = techList
      .map((tech) => `<span class="accent-pill">${escapeHtml(tech)}</span>`)
      .join("");
  }

  renderProjectPageLink(project);
}

function openProjectPage(projectId, { scroll = true } = {}) {
  const raw = projects.find((item) => item.id === projectId);
  const project = raw ? localizeProject(raw) : null;
  if (!project || !projectPage) {
    closeProjectPage();
    if (getProjectIdFromHash()) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}#projects`);
    }
    return;
  }

  activeProjectId = project.id;
  fillProjectPage(project);
  projectPage.hidden = false;
  document.documentElement.classList.add("is-project-page");
  document.title = `${project.title} — Fabio Ramos`;
  setActiveNav("projects");

  if (scroll) {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

function closeProjectPage() {
  const wasOpen = Boolean(activeProjectId);
  activeProjectId = null;
  if (projectPage) projectPage.hidden = true;
  document.documentElement.classList.remove("is-project-page");
  if (wasOpen) {
    syncDocumentMeta();
  }
}

function syncProjectRouteFromHash() {
  const projectId = getProjectIdFromHash();
  if (projectId) {
    openProjectPage(projectId);
    return;
  }
  closeProjectPage();
}

function syncProjectsExpandPanel(extraItems) {
  if (!projectsMore) return;
  projectsMore.classList.toggle("is-open", projectsExpanded);
  projectsMore.setAttribute("aria-hidden", String(!projectsExpanded));
  projectsMore.innerHTML = extraItems.length
    ? `<div class="expand-panel__inner projects-grid">${extraItems
        .map((p, index) => {
          const card = renderProjectCard(p).replace(
            'class="project-card"',
            `class="project-card" style="--stagger: ${index}"`
          );
          return card;
        })
        .join("")}</div>`
    : "";
}

function renderprojects() {
  const sorted = getSortedProjects();
  const featured = sorted.slice(0, PROJECT_PREVIEW_COUNT);
  const extra = sorted.slice(PROJECT_PREVIEW_COUNT);
  projectsContainer.innerHTML = featured.map(renderProjectCard).join("");
  syncProjectsExpandPanel(extra);

  if (projectsToggle) {
    projectsToggle.hidden = sorted.length <= PROJECT_PREVIEW_COUNT;
    projectsToggle.textContent = projectsExpanded
      ? t("projects.showFewer")
      : t("projects.viewAll");
    projectsToggle.setAttribute("aria-expanded", String(projectsExpanded));
  }

  if (activeProjectId) {
    openProjectPage(activeProjectId, { scroll: false });
  }
}

const filterDropdown = document.getElementById("filter-dropdown");

filterDropdown?.addEventListener("change", (e) => {
  projectSortCriteria = e.target.value;
  renderprojects();
});

projectsToggle?.addEventListener("click", () => {
  projectsExpanded = !projectsExpanded;
  renderprojects();
});

renderprojects();
window.addEventListener("hashchange", syncProjectRouteFromHash);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !activeProjectId) return;
  window.location.hash = "projects";
});

const certifications = [
  { id: "aws-cloud", name: "Cloud Computing · AWS", issuer: "Coderhouse", date: "May 2025" },
  { id: "digital-ebusiness-csun", name: "Digital Companies & E-Business Revolution", issuer: "California State University, Northridge", date: "July 2025" },
  { id: "business-english-csun", name: "Business English", issuer: "California State University, Northridge", date: "June 2025" },
  { id: "org-data-mgmt", name: "Management and Processing of Organizational Data", issuer: "Universidad Nacional de Tucumán", date: "October 2025" },
  { id: "data-science-python", name: "Data Science using Python", issuer: "Universidad Nacional de Tucumán", date: "August 2025" },
  { id: "data-science-challenges", name: "Challenges and Applications of Data Science in Organizations", issuer: "Universidad Nacional de Tucumán", date: "August 2025" },
  { id: "statistical-tools-ds", name: "Statistical Tools for Data Science", issuer: "Universidad Nacional de Tucumán", date: "June 2025" },
  { id: "ef-set-c1", name: "EF SET Official Certificate 65/100 (C1 Advanced)", issuer: "EF SET", date: "May 2024" },
  { id: "english-b2-rush", name: "English Studies Certification · B2", issuer: "Instituto Rush", date: "December 2024" },
  { id: "backend-node-rolling", name: "BackEnd Node.js · Database Integration in Web Apps", issuer: "RollingCode", date: "November 2024" },
  { id: "english-b2-rush-2024", name: "Foreign Language Certification · B2 English", issuer: "Instituto Rush", date: "July 2024" },
  { id: "testing-qcqa", name: "Testing QC/QA", issuer: "Global Learning", date: "November 2023" },
  { id: "potencial-tech", name: "Potencial Tech 2 (Front-End)", issuer: "Alkemy", date: "October 2023" },
  { id: "frontend-stage3", name: "Front-End Developer · Stage 3", issuer: "ITMaster Academy", date: "October 2023" },
  { id: "fullstack-stage2", name: "Full Stack Web Developer · Stage 2", issuer: "ITMaster Academy", date: "September 2023" },
  { id: "fullstack-argprog", name: "#YoProgramo · Full Stack Web Developer", issuer: "Argentina Programa 4.0", date: "February 2023" },
  { id: "seprogramar", name: "#SeProgramar · Full Stack Certification", issuer: "Argentina Programa", date: "April 2022" },
  { id: "fullstack-rolling-2021", name: "Full Stack Web Developer", issuer: "RollingCode", date: "June 2021" },
];

const FEATURED_CERT_COUNT = 4;
const certGrid = document.getElementById("certifications-grid");
const certMore = document.getElementById("certifications-more");
const certToggle = document.getElementById("cert-toggle");
let certsExpanded = false;

function renderCertCard(c, stagger = 0) {
  const cert = localizeCert(c);
  return `
    <article class="cert-card" style="--stagger: ${stagger}">
      <h3 class="cert-card__name">${escapeHtml(cert.name)}</h3>
      <p class="cert-card__issuer">${escapeHtml(cert.issuer)}</p>
      <p class="cert-card__date">${escapeHtml(cert.date)}</p>
    </article>
  `;
}

function renderCerts() {
  certGrid.innerHTML = certifications
    .slice(0, FEATURED_CERT_COUNT)
    .map((c) => renderCertCard(c))
    .join("");

  if (certMore) {
    const extra = certifications.slice(FEATURED_CERT_COUNT);
    certMore.classList.toggle("is-open", certsExpanded);
    certMore.setAttribute("aria-hidden", String(!certsExpanded));
    certMore.innerHTML = extra.length
      ? `<div class="expand-panel__inner cert-grid">${extra
          .map((c, index) => renderCertCard(c, index))
          .join("")}</div>`
      : "";
  }

  if (certToggle) {
    certToggle.hidden = certifications.length <= FEATURED_CERT_COUNT;
    certToggle.textContent = certsExpanded
      ? t("certifications.showFewer")
      : t("certifications.seeAll");
    certToggle.setAttribute("aria-expanded", String(certsExpanded));
  }
}

certToggle?.addEventListener("click", () => {
  certsExpanded = !certsExpanded;
  renderCerts();
});

renderCerts();

function createExpToggleIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "exp-card__toggle-icon");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M6 9l6 6 6-6");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("fill", "none");
  svg.appendChild(path);
  return svg;
}

const experienceMore = document.getElementById("experience-more");
const experienceToggle = document.getElementById("experience-toggle");
let experienceExpanded = false;

function syncExperienceExpandPanel() {
  if (!experienceMore || !experienceToggle) return;
  experienceMore.classList.toggle("is-open", experienceExpanded);
  experienceMore.setAttribute("aria-hidden", String(!experienceExpanded));
  experienceToggle.textContent = experienceExpanded
    ? t("experience.showFewer")
    : t("experience.seeAll");
  experienceToggle.setAttribute("aria-expanded", String(experienceExpanded));
}

experienceToggle?.addEventListener("click", () => {
  experienceExpanded = !experienceExpanded;

  if (!experienceExpanded) {
    experienceMore?.querySelectorAll(".exp-card.is-open").forEach((card) => {
      card.classList.remove("is-open");
      card.querySelector(".exp-card__trigger")?.setAttribute("aria-expanded", "false");
    });
  }

  syncExperienceExpandPanel();
});

syncExperienceExpandPanel();

function initExperienceAccordion() {
  const section = document.getElementById("experience");
  if (!section) return;

  const cards = Array.from(section.querySelectorAll(".exp-card"));
  cards.forEach((card, index) => {
    const existingToggle = card.querySelector(".exp-card__toggle");
    if (existingToggle && !existingToggle.querySelector(".exp-card__toggle-icon")) {
      existingToggle.textContent = "";
      existingToggle.appendChild(createExpToggleIcon());
    }

    if (card.querySelector(".exp-card__trigger")) return;

    const head = card.querySelector(".exp-card__head");
    if (!head) return;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "exp-card__trigger";
    trigger.setAttribute("aria-expanded", index === 0 ? "true" : "false");

    const toggle = document.createElement("span");
    toggle.className = "exp-card__toggle";
    toggle.setAttribute("aria-hidden", "true");
    toggle.appendChild(createExpToggleIcon());

    card.insertBefore(trigger, head);
    trigger.append(head, toggle);

    const panel = document.createElement("div");
    panel.className = "exp-card__panel";
    const panelInner = document.createElement("div");
    panelInner.className = "exp-card__panel-inner";
    while (trigger.nextSibling) {
      panelInner.appendChild(trigger.nextSibling);
    }
    panel.appendChild(panelInner);
    card.appendChild(panel);

    if (index === 0) {
      card.classList.add("is-open");
    }

    trigger.addEventListener("click", () => {
      const willOpen = !card.classList.contains("is-open");
      cards.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".exp-card__trigger")?.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        card.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
}

initExperienceAccordion();

function initTestimonials() {
  const COLLAPSED_LEN = 220;
  const COLLAPSED_HEIGHT = 152;

  document.querySelectorAll(".testimonial-card").forEach((card) => {
    const quote = card.querySelector("[data-testimonial-quote]");
    const btn = card.querySelector("[data-testimonial-toggle]");
    if (!quote || !btn) return;

    const full = quote.textContent.trim();
    quote.dataset.fullText = full;
    quote.classList.remove("is-collapsed");
    quote.style.maxHeight = "";
    card.classList.remove("testimonial-card--expanded");
    btn.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = t("testimonials.readMore");

    if (full.length <= COLLAPSED_LEN) return;

    quote.classList.add("is-collapsed");
    quote.style.maxHeight = `${COLLAPSED_HEIGHT}px`;
    btn.hidden = false;

    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";

    const expandQuote = () => {
      quote.classList.remove("is-collapsed");
      quote.style.maxHeight = `${quote.scrollHeight}px`;
      card.classList.add("testimonial-card--expanded");
      btn.setAttribute("aria-expanded", "true");
      btn.textContent = t("testimonials.readLess");
    };

    const collapseQuote = () => {
      quote.style.maxHeight = `${quote.scrollHeight}px`;
      requestAnimationFrame(() => {
        quote.classList.add("is-collapsed");
        quote.style.maxHeight = `${COLLAPSED_HEIGHT}px`;
      });
      card.classList.remove("testimonial-card--expanded");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = t("testimonials.readMore");
    };

    quote.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "max-height") return;
      if (!quote.classList.contains("is-collapsed")) {
        quote.style.maxHeight = "none";
      }
    });

    btn.addEventListener("click", () => {
      if (quote.classList.contains("is-collapsed")) {
        expandQuote();
      } else {
        collapseQuote();
      }
    });
  });
}

initTestimonials();

const backToTopBtn = document.getElementById("back-to-top");
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add("show-btn");
  } else {
    backToTopBtn.classList.remove("show-btn");
  }
});

const navToggle = document.getElementById("nav-toggle");
const mobileNav = document.getElementById("mobile-nav");

navToggle.addEventListener("click", () => {
  const open = mobileNav.hasAttribute("hidden");
  if (open) {
    mobileNav.removeAttribute("hidden");
    navToggle.setAttribute("aria-expanded", "true");
  } else {
    mobileNav.setAttribute("hidden", "");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

mobileNav.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    mobileNav.setAttribute("hidden", "");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const navSectionIds = [
  "about",
  "experience",
  "projects",
  "speaking",
  "testimonials",
  "education",
  "certifications",
  "contact",
];
const navLinks = document.querySelectorAll(
  ".site-header__link, .site-header__mobile-link"
);
const navSections = navSectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);

function setActiveNav(sectionId) {
  const activeHash = sectionId ? `#${sectionId}` : null;

  navLinks.forEach((link) => {
    const isActive = activeHash !== null && link.getAttribute("href") === activeHash;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function syncActiveNav() {
  if (activeProjectId) {
    setActiveNav("projects");
    return;
  }

  // Marker just below the fixed header
  const marker = 96;
  let activeId = null;

  for (const section of navSections) {
    if (section.getBoundingClientRect().top - marker <= 0) {
      activeId = section.id;
    }
  }

  const nearBottom =
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 80;
  if (nearBottom) {
    activeId = "contact";
  }

  setActiveNav(activeId);
}

window.addEventListener("scroll", syncActiveNav, { passive: true });
window.addEventListener("resize", syncActiveNav);
syncActiveNav();
syncProjectRouteFromHash();

const footerYear = document.getElementById("footer-year");
if (footerYear) {
  footerYear.textContent = String(new Date().getFullYear());
}

const resumeDownload = document.querySelector(".resume-download");
const resumeDownloadBtn = document.getElementById("resume-download-btn");
const resumeLangMenu = document.getElementById("resume-lang-menu");

function positionResumeMenu() {
  if (!resumeDownloadBtn || !resumeLangMenu || resumeLangMenu.hidden) return;

  const rect = resumeDownloadBtn.getBoundingClientRect();
  const menuWidth = Math.max(rect.width, 140);
  const gap = 8;
  let top = rect.bottom + gap;
  let left = rect.left + rect.width / 2 - menuWidth / 2;

  resumeLangMenu.style.width = `${menuWidth}px`;
  resumeLangMenu.style.minWidth = `${menuWidth}px`;
  resumeLangMenu.style.left = "0px";
  resumeLangMenu.style.top = "0px";

  // measure after applying temporary position
  const menuHeight = resumeLangMenu.offsetHeight || 88;
  if (top + menuHeight > window.innerHeight - 12) {
    top = Math.max(12, rect.top - gap - menuHeight);
  }
  left = Math.min(Math.max(12, left), window.innerWidth - menuWidth - 12);

  resumeLangMenu.style.top = `${top}px`;
  resumeLangMenu.style.left = `${left}px`;
}

function setResumeMenuOpen(open) {
  if (!resumeDownload || !resumeDownloadBtn || !resumeLangMenu) return;
  resumeDownload.classList.toggle("is-open", open);
  resumeDownloadBtn.setAttribute("aria-expanded", String(open));
  resumeLangMenu.hidden = !open;

  if (open) {
    positionResumeMenu();
  } else {
    resumeLangMenu.style.top = "";
    resumeLangMenu.style.left = "";
    resumeLangMenu.style.width = "";
    resumeLangMenu.style.minWidth = "";
  }
}

resumeDownloadBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = resumeDownloadBtn.getAttribute("aria-expanded") === "true";
  setResumeMenuOpen(!isOpen);
});

resumeLangMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    setResumeMenuOpen(false);
  });
});

document.addEventListener("click", (event) => {
  if (!resumeDownload?.contains(event.target) && !resumeLangMenu?.contains(event.target)) {
    setResumeMenuOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setResumeMenuOpen(false);
  }
});

window.addEventListener("resize", () => {
  if (resumeDownloadBtn?.getAttribute("aria-expanded") === "true") {
    positionResumeMenu();
  }
});

window.addEventListener(
  "scroll",
  () => {
    if (resumeDownloadBtn?.getAttribute("aria-expanded") === "true") {
      setResumeMenuOpen(false);
    }
  },
  { passive: true }
);

document.querySelectorAll(".site-footer__copy").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.getAttribute("data-copy");
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("input");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    const previousLabel = button.getAttribute("aria-label") || "Copy";
    button.classList.add("is-copied");
    button.setAttribute("aria-label", t("footer.copied"));

    window.setTimeout(() => {
      button.classList.remove("is-copied");
      button.setAttribute("aria-label", previousLabel);
    }, 1600);
  });
});

let refreshAboutStats = null;

function initAboutStatsRotator() {
  const root = document.getElementById("about-stats");
  const slots = root ? Array.from(root.querySelectorAll(".about-stats__slot")) : [];
  const tracks = root ? Array.from(root.querySelectorAll("[data-stats-track]")) : [];
  if (!root || slots.length !== 3 || tracks.length !== 3) return;

  let impactStats = getImpactStats();
  if (impactStats.length < 3) return;

  const AUTO_MS = 3800;
  const TRANSITION_MS = 650;
  const CYCLES = 6;
  const BASE_CYCLE = 2;
  /** @type {number[]} animation offsets into each track */
  const offsets = [0, 0, 0];
  /** @type {number[]} which impactStats index is currently visible per slot (always unique) */
  let visible = [0, 1, 2];
  let selectedSlot = 0;
  let activeSlot = 0;
  let timer = 0;
  let paused = false;
  let animating = false;
  let itemHeight = 116;
  let wheelLocked = false;
  let wheelIdleTimer = 0;
  let glowTimer = 0;

  function normalizeIndex(index) {
    const n = impactStats.length;
    return ((index % n) + n) % n;
  }

  function statAt(index) {
    return impactStats[normalizeIndex(index)];
  }

  function setItemContent(item, stat) {
    const num = item.querySelector(".about-stats__num");
    const label = item.querySelector(".about-stats__label");
    if (num) num.textContent = stat.num;
    if (label) label.textContent = stat.label;
  }

  function syncTrackItem(slotIndex, offsetPos, statIndex) {
    const item = tracks[slotIndex].children[offsetPos];
    if (item) setItemContent(item, impactStats[normalizeIndex(statIndex)]);
  }

  function renderItems(track) {
    const nodes = [];
    const total = impactStats.length * CYCLES;
    for (let i = 0; i < total; i += 1) {
      const stat = statAt(i);
      nodes.push(
        `<div class="about-stats__item"><span class="about-stats__num">${escapeHtml(
          stat.num
        )}</span><span class="about-stats__label">${escapeHtml(stat.label)}</span></div>`
      );
    }
    track.innerHTML = nodes.join("");
  }

  function measure() {
    const sample = tracks[0].querySelector(".about-stats__item");
    if (sample) itemHeight = sample.getBoundingClientRect().height || itemHeight;
    tracks.forEach((track) => {
      const viewport = track.parentElement;
      if (viewport) viewport.style.height = `${itemHeight}px`;
    });
  }

  function applySlotTransform(slotIndex, animate) {
    const track = tracks[slotIndex];
    track.style.transition = animate
      ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : "none";
    track.style.transform = `translateY(${-offsets[slotIndex] * itemHeight}px)`;
  }

  function hardResetSlot(slotIndex) {
    const n = impactStats.length;
    const min = n;
    const max = n * (CYCLES - 2);
    if (offsets[slotIndex] >= min && offsets[slotIndex] < max) return;

    const resetOffset = n * BASE_CYCLE + visible[slotIndex];
    offsets[slotIndex] = resetOffset;
    syncTrackItem(slotIndex, resetOffset, visible[slotIndex]);
    applySlotTransform(slotIndex, false);
  }

  function setSelected(slotIndex) {
    selectedSlot = slotIndex;
    slots.forEach((slot, index) => {
      slot.classList.toggle("is-selected", index === slotIndex);
    });
  }

  function setGlow(slotIndex) {
    slots.forEach((slot, index) => {
      slot.classList.toggle("is-glowing", index === slotIndex);
    });
    window.clearTimeout(glowTimer);
    glowTimer = window.setTimeout(() => {
      slots[slotIndex]?.classList.remove("is-glowing");
    }, TRANSITION_MS + 420);
  }

  function pickNextUniqueStat(slotIndex, delta) {
    const n = impactStats.length;
    const occupied = new Set();
    for (let i = 0; i < visible.length; i += 1) {
      if (i !== slotIndex) occupied.add(visible[i]);
    }

    let candidate = visible[slotIndex];
    for (let step = 0; step < n; step += 1) {
      candidate = normalizeIndex(candidate + delta);
      if (!occupied.has(candidate)) return candidate;
    }
    return normalizeIndex(visible[slotIndex] + delta);
  }

  function advanceSlot(slotIndex, delta = 1) {
    if (animating) return;
    const direction = delta >= 0 ? 1 : -1;
    const nextStat = pickNextUniqueStat(slotIndex, direction);
    if (nextStat === visible[slotIndex]) return;

    animating = true;
    setSelected(slotIndex);
    activeSlot = slotIndex;

    const nextOffset = offsets[slotIndex] + direction;
    syncTrackItem(slotIndex, nextOffset, nextStat);
    visible[slotIndex] = nextStat;
    offsets[slotIndex] = nextOffset;

    setGlow(slotIndex);
    applySlotTransform(slotIndex, true);
    window.setTimeout(() => {
      hardResetSlot(slotIndex);
      animating = false;
    }, TRANSITION_MS + 40);
  }

  function advanceNext(delta = 1) {
    advanceSlot(activeSlot, delta);
    activeSlot = (activeSlot + 1) % slots.length;
  }

  function startTimer() {
    window.clearInterval(timer);
    timer = window.setInterval(() => {
      if (!paused && !animating) advanceNext(1);
    }, AUTO_MS);
  }

  function slotFromEventTarget(target) {
    const el = target instanceof Element ? target : null;
    const slotEl = el?.closest?.(".about-stats__slot");
    if (!slotEl) return selectedSlot;
    const index = slots.indexOf(slotEl);
    return index >= 0 ? index : selectedSlot;
  }

  function rebuild() {
    impactStats = getImpactStats();
    if (impactStats.length < 3) return;

    visible = [0, 1, 2];
    const base = impactStats.length * BASE_CYCLE;
    offsets[0] = base;
    offsets[1] = base + 1;
    offsets[2] = base + 2;

    tracks.forEach((track, slot) => {
      renderItems(track);
      syncTrackItem(slot, offsets[slot], visible[slot]);
    });
    measure();
    tracks.forEach((_, slot) => applySlotTransform(slot, false));
    setSelected(selectedSlot);
  }

  rebuild();
  refreshAboutStats = rebuild;

  slots.forEach((slot, index) => {
    slot.addEventListener("mouseenter", () => {
      setSelected(index);
      paused = true;
    });
    slot.addEventListener("focusin", () => {
      setSelected(index);
      paused = true;
    });
  });

  root.addEventListener("mouseleave", () => {
    paused = false;
  });

  root.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const slotIndex = slotFromEventTarget(event.target);
      setSelected(slotIndex);

      window.clearTimeout(wheelIdleTimer);
      wheelIdleTimer = window.setTimeout(() => {
        wheelLocked = false;
      }, 180);

      if (wheelLocked || animating) return;
      wheelLocked = true;
      advanceSlot(slotIndex, event.deltaY > 0 ? 1 : -1);
      startTimer();
    },
    { passive: false }
  );

  let touchY = null;
  let touchSlot = 0;
  let touchHandled = false;
  root.addEventListener(
    "touchstart",
    (event) => {
      touchY = event.touches[0]?.clientY ?? null;
      touchSlot = slotFromEventTarget(event.target);
      setSelected(touchSlot);
      touchHandled = false;
      paused = true;
    },
    { passive: true }
  );
  root.addEventListener(
    "touchend",
    (event) => {
      if (touchY == null || touchHandled) return;
      const endY = event.changedTouches[0]?.clientY ?? touchY;
      const delta = touchY - endY;
      if (Math.abs(delta) > 28) {
        touchHandled = true;
        advanceSlot(touchSlot, delta > 0 ? 1 : -1);
        startTimer();
      }
      touchY = null;
      paused = false;
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    measure();
    tracks.forEach((_, slot) => applySlotTransform(slot, false));
  });

  startTimer();
}

initAboutStatsRotator();

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const value = t(key);
    if (typeof value === "string") el.textContent = value;
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (!key) return;
    const value = t(key);
    if (typeof value === "string") el.innerHTML = value;
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (!key) return;
    const value = t(key);
    if (typeof value === "string") el.setAttribute("aria-label", value);
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    const value = t(key);
    if (typeof value === "string") el.setAttribute("title", value);
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (!key) return;
    const value = t(key);
    if (typeof value === "string") el.setAttribute("alt", value);
  });
}

function syncLangSwitchButtons() {
  document.querySelectorAll("[data-set-lang]").forEach((btn) => {
    const lang = btn.getAttribute("data-set-lang");
    const active = lang === currentLang;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

function syncMailLinks() {
  const subject = encodeURIComponent(t("hero.emailSubject"));
  const body = encodeURIComponent(t("hero.emailBody"));
  const heroMail = document.getElementById("hero-email-link");
  if (heroMail) {
    heroMail.href = `mailto:fabioramosnic@gmail.com?subject=${subject}&body=${body}`;
  }
  const footerMail = document.getElementById("footer-email-link");
  if (footerMail) {
    footerMail.href = `mailto:fabioramosnic@gmail.com?subject=${subject}`;
  }
}

function syncDocumentMeta() {
  document.documentElement.lang = currentLang;
  document.title = t("meta.title");
  const description = t("meta.description");
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", description);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", t("meta.title"));
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", description);
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute("content", t("meta.title"));
  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute("content", description);

  document.querySelectorAll("[data-testimonial-lang]").forEach((card) => {
    card.setAttribute("lang", currentLang);
  });
}

function setLanguage(lang, { persist = true } = {}) {
  if (lang !== "en" && lang !== "es") return;
  currentLang = lang;

  if (persist) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }

  syncDocumentMeta();
  syncLangSwitchButtons();
  applyStaticI18n();
  syncMailLinks();
  syncExperienceExpandPanel();
  renderprojects();
  renderCerts();
  refreshAboutStats?.();
  initTestimonials();
}

document.querySelectorAll("[data-set-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-set-lang");
    if (lang) setLanguage(lang);
  });
});

setLanguage(currentLang, { persist: false });
