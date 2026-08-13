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

for (let i = 0; i < 1399; i++) {
  container.appendChild(tile.cloneNode());
}

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});

document.querySelectorAll(".hidden").forEach((el) => heroObserver.observe(el));

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

window.addEventListener("scroll", () => {
  const background = document.getElementById("container");
  const text = document.getElementById("content");
  const scrollPositionF = 1;

  if (window.scrollY > scrollPositionF) {
    background.classList.remove("container");
    background.classList.add("container-flat");
    text.classList.remove("content");
    text.classList.add("content-flat");
  } else {
    background.classList.remove("container-flat");
    background.classList.add("container");
    text.classList.add("content");
    text.classList.remove("content-flat");
  }
});

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
  const browser = (navigator.language || "").toLowerCase();
  return browser.startsWith("es") ? "es" : "en";
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
    image: "./assets/Images/VolleyManager.png",
  },
  {
    id: "expologic",
    title: "ExpoLogic",
    year: 2026,
    featured: true,
    featuredOrder: 2,
    role: "Principal Software Engineer · Co-Founder · CAW Tech",
    tagline: "Multi-tenant SaaS for event spaces, maps, reservations and virtual fairs",
    status: "MVP · Preparing for adoption",
    statusKind: "mvp",
    description:
      "Multi-tenant event-space SaaS with visual map builder, interactive stand reservation, event websites and exhibitor catalogs.",
    descriptionLong:
      "ExpoLogic is a SaaS/multi-tenant platform for managing spaces — initially targeting fairs and events. It combines organizer dashboards, event website generation, a visual map builder, interactive spatial inventory and reservation, exhibitor catalogs and a virtual-fair experience. The product concept is designed to bring capabilities typically found in more expensive event-management platforms to municipalities and smaller organizers — an uncommon approach in the local market.",
    technologies: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Tailwind CSS", "Vercel"],
    metrics: [
      { value: "SaaS", label: "Multi-tenant hub" },
      { value: "Map", label: "Visual builder" },
      { value: "Reserve", label: "Spatial inventory" },
      { value: "Semi", label: "Emprende U" },
    ],
    caseStudy: [
      {
        title: "The problem",
        body: "Professional event/space management software is often expensive, complex and inaccessible to municipalities and smaller organizers who still need modern public websites, maps and reservation flows.",
      },
      {
        title: "Multi-tenant hub",
        body: "A central hub manages tenants/organizers. Each organizer receives their own environment to manage events, reservations, public websites, maps and exhibitors.",
        diagram:
          "CAW / Hub\n├── Tenant A / Organizer\n│   ├── Event\n│   ├── Reservations\n│   ├── Website\n│   ├── Map\n│   └── Exhibitors\n└── Tenant B / Organizer\n    ├── Event\n    ├── Reservations\n    ├── Website\n    ├── Map\n    └── Exhibitors",
      },
      {
        title: "Website generation",
        body: "Organizers can generate a public event website from the platform. Sites are template-driven with configurable themes/styles so organizers manage public content without manually building a site from scratch.",
      },
      {
        title: "Visual map builder",
        body: "Organizers create geographic/event layouts, define spaces, choose stand sizes, position stands, add text and configure spatial elements. Visitors then browse the resulting map on the public event page.",
      },
      {
        title: "Interactive spatial inventory",
        body: "Visitors and exhibitors browse the map, see available spaces, select a stand — similar to selecting a seat when purchasing an airline ticket — and reserve it. Framed as interactive spatial inventory and reservation, not a simple booking form.",
      },
      {
        title: "Virtual fair / catalog",
        body: "Organizers manage exhibitors; exhibitors upload products into digital catalogs shown on the event website. The physical event connects to a persistent online exhibitor showcase — not an e-commerce marketplace.",
      },
      {
        title: "External validation",
        body: "Presented at Emprende U and reached the semifinal stage. The product was also featured by La Gaceta in connection with the event. Prospective organizers in Tucumán have expressed interest; the product is being prepared for broader adoption.",
      },
      {
        title: "My role",
        body: "Architected and developed the multi-tenant SaaS from the ground up — hub/tenant model, visual map builder, reservation flows, website generation and virtual-fair catalog experience.",
      },
    ],
    highlights: [
      "Multi-tenant hub where each organizer manages events, websites, maps and exhibitors.",
      "Visual map builder with interactive spatial inventory and stand reservation.",
      "Semifinalist at Emprende U; featured by La Gaceta. Preparing for adoption in Tucumán.",
    ],
    url: "https://lola-mora.vercel.app",
    image: "./assets/Images/ExpoLogic.png",
  },
  {
    id: "caw-education",
    title: "CAW Education",
    year: 2026,
    featured: true,
    featuredOrder: 3,
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
    image: "./assets/Images/cawpic.jfif",
  },
  {
    id: "sublimspace",
    title: "Sublimspace",
    year: 2026,
    featured: true,
    featuredOrder: 4,
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
    image: "./assets/Images/Sublimspace.png",
  },
  {
    id: "caw-tech",
    title: "CAW Tech",
    year: 2026,
    featured: true,
    featuredOrder: 5,
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
    image: "./assets/Images/CAW.png",
  },
  {
    id: "txtgen",
    title: "TxtGen",
    year: 2025,
    featured: true,
    featuredOrder: 6,
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
    image: "./assets/Images/TxtGen.png",
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
    image: "./assets/Images/BOTCAMPBACK.webp",
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
    image: "./assets/Images/la-leyenda.webp",
  },
  {
    id: "cba-volleystar",
    title: "CBA VolleyStar",
    year: 2026,
    role: "Full stack · CAW Tech",
    description:
      "Volleyball league landing and discovery — fixtures, branding, and fan-facing information.",
    descriptionLong:
      "CBA VolleyStar is a public-facing league presence for fixtures, club highlights, and tournament information. The site emphasizes fast loads on mobile, clear schedules, and brand consistency for regional volleyball audiences.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    highlights: [
      "Fan-first information architecture for schedules and league updates.",
      "Responsive layouts tuned for match-day traffic from mobile devices.",
      "Deployed with preview and production workflows on Vercel.",
    ],
    url: "https://cba-volleystar.vercel.app",
    image: "./assets/Images/CBA.jpeg",
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
    image: "./assets/Images/Terradeco.jpg",
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
    image: "./assets/Images/EnduringEducation.webp",
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
    image: "./assets/Images/LBS.png",
  },
  {
    id: "reaction-app",
    title: "Reaction",
    year: 2026,
    role: "Side project · Real-time UI",
    description:
      "Interactive reaction board — low-latency UI experiment with modern React patterns.",
    descriptionLong:
      "Reaction is a compact real-time experience exploring optimistic UI, event streams, and playful interaction design. Built as a sandbox for testing deployment speed and component architecture on Vercel.",
    technologies: ["Next.js", "TypeScript", "React", "Vercel"],
    highlights: [
      "Fast iteration sandbox for UI and interaction prototypes.",
      "Production deploy with alpha channel on Vercel.",
    ],
    url: "https://reaction-app-alpha.vercel.app/",
    image: "./assets/Images/Reaction.webp",
  },
  {
    id: "bullet-hell-example",
    title: "Bullet Hell Example",
    year: 2026,
    role: "Side project · Game demo",
    description:
      "Browser bullet hell prototype — dense patterns, real-time collision, and canvas-driven gameplay.",
    descriptionLong:
      "An interactive bullet hell demo exploring canvas rendering, pattern scripting, and frame-budget gameplay in the browser. Built as a technical sandbox for input latency, entity pooling, and deployable game loops on Vercel.",
    technologies: ["Next.js", "TypeScript", "React", "Canvas", "Vercel"],
    highlights: [
      "Real-time bullet patterns with collision detection on canvas.",
      "Performance-minded loop suitable for arcade-style intensity.",
      "Production deploy on Vercel for shareable demos.",
    ],
    url: "https://bullet-hell-example.vercel.app",
    image: "./assets/Images/bullet-hell.png",
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
    image: "./assets/Images/la-congreso.png",
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
    image: "./assets/Images/mvp-to-pro.jpeg",
  },
  {
    id: "caw-motors",
    title: "CAW Motors",
    year: 2024,
    role: "Freelance · Marketing site",
    description:
      "Vehicle listings marketing site with discovery filters and contact flows.",
    descriptionLong:
      "CAW Motors showcases second-hand inventory with search-friendly listing pages, vehicle detail views, and direct contact funnels. SEO and performance were prioritized for local discovery and mobile shoppers.",
    technologies: ["React", "JavaScript", "HTML", "CSS"],
    highlights: [
      "Inventory browsing with clear CTAs to seller contact.",
      "Structured metadata for search and social sharing.",
    ],
    image: "./assets/Images/CAW-3.webp",
  },
  {
    id: "cebamate",
    title: "CEBAMATE",
    year: 2023,
    role: "Freelance · SMB storefront",
    description:
      "Catalog and responsive storefront for personalized mates and regional accessories.",
    descriptionLong:
      "CEBAMATE is a SMB e-commerce presence for customized mate products: category browsing, product detail pages, and WhatsApp or form-based ordering aligned with local buying habits.",
    technologies: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Visual catalog aligned with artisan product photography.",
      "Conversion paths adapted to regional purchase behavior.",
    ],
    image: "./assets/Images/CEBAMATE 1.webp",
  },
  {
    id: "indumentaria-taurie",
    title: "Indumentaria Taurie",
    year: 2023,
    role: "Freelance · Clothing retail",
    description:
      "Clothing storefront with product discovery, sizing context, and contact checkout.",
    descriptionLong:
      "Fashion retail site highlighting collections, size guidance, and inquiry-based purchasing. Built for a local brand prioritizing visual merchandising over heavy cart complexity.",
    technologies: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Collection-first navigation with emphasis on imagery.",
      "Lightweight stack for fast updates by the client team.",
    ],
    image: "./assets/Images/TAURIE.webp",
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
    technologies: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Service menu with clear pricing and duration cues.",
      "Gallery and social proof blocks for local SEO.",
    ],
    image: "./assets/Images/PELUQUERIA 1.webp",
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
    technologies: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Share-friendly layout for WhatsApp and Instagram traffic.",
      "RSVP capture with lightweight client validation.",
    ],
    image: "./assets/Images/18MAURO.webp",
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
    technologies: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Themed art direction consistent with the celebration palette.",
      "Guest list capture with mobile-first form UX.",
    ],
    image: "./assets/Images/15CATA.webp",
  },
  {
    id: "zetaross",
    title: "ZETAROSS",
    year: 2022,
    role: "Freelance · Product showcase",
    description:
      "Showcase for 3D-printed collectibles — catalog browse and inquiry flows.",
    descriptionLong:
      "Product gallery for 3D-printed figures with category filters and inquiry CTAs. Designed to highlight print quality photography and maker brand story.",
    technologies: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Visual-first catalog for collectible lines.",
      "Inquiry funnel without over-engineered checkout.",
    ],
    image: "./assets/Images/ZETAROSS.webp",
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
    technologies: ["HTML", "CSS", "JavaScript"],
    highlights: [
      "Credibility-focused layout for B2B visitors.",
      "Structured service and certification storytelling.",
    ],
    image: "./assets/Images/KEIS.webp",
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
    image: "./assets/Images/PHONEPIXEL.webp",
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
    <button type="button" class="project-card" data-project-id="${escapeHtml(project.id)}" aria-label="${escapeHtml(t("projects.viewDetailsFor"))} ${title}">
      ${media}
      <div class="project-card__body">
        <p class="project-card__desc">${escapeHtml(project.description)}</p>
        <div class="project-card__tags">${tagsHtml}</div>
        <p class="project-card__hint">${escapeHtml(t("projects.viewDetails"))}</p>
      </div>
    </button>
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

const projectModal = document.getElementById("project-modal");
const projectModalClose = document.getElementById("project-modal-close");
const projectModalMedia = document.getElementById("project-modal-media");
const projectModalTitle = document.getElementById("project-modal-title");
const projectModalTagline = document.getElementById("project-modal-tagline");
const projectModalYear = document.getElementById("project-modal-year");
const projectModalStatus = document.getElementById("project-modal-status");
const projectModalRole = document.getElementById("project-modal-role");
const projectModalDesc = document.getElementById("project-modal-desc");
const projectModalMetrics = document.getElementById("project-modal-metrics");
const projectModalCase = document.getElementById("project-modal-case");
const projectModalHighlights = document.getElementById("project-modal-highlights");
const projectModalTechMetrics = document.getElementById("project-modal-tech-metrics");
const projectModalTags = document.getElementById("project-modal-tags");
const projectModalActions = document.getElementById("project-modal-actions");

function shouldShowProjectUrl(project) {
  return Boolean(project.url && project.year >= 2025);
}

function renderModalMedia(project) {
  if (!projectModalMedia) return;
  const gi = hashToGradientIndex(project.id);
  if (project.image) {
    projectModalMedia.hidden = false;
    projectModalMedia.className = "project-modal__media";
    projectModalMedia.innerHTML = `<img loading="lazy" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} — ${escapeHtml(t("projects.screenshotAlt"))}" />`;
    return;
  }
  projectModalMedia.hidden = false;
  projectModalMedia.className = `project-modal__media project-modal__media--gradient project-card__grad--${gi}`;
  projectModalMedia.innerHTML = "";
}

function renderMetricCards(items) {
  return (items ?? [])
    .map(
      (metric) => `
        <div class="project-modal__metric">
          <span class="project-modal__metric-value">${escapeHtml(metric.value)}</span>
          <span class="project-modal__metric-label">${escapeHtml(metric.label)}</span>
        </div>`
    )
    .join("");
}

function renderCaseStudy(sections) {
  return (sections ?? [])
    .map((section) => {
      const items = Array.isArray(section.items)
        ? `<ul class="project-modal__case-list">${section.items
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>`
        : "";
      const body = section.body
        ? `<p class="project-modal__case-body">${escapeHtml(section.body)}</p>`
        : "";
      const diagram = section.diagram
        ? `<pre class="project-modal__diagram">${escapeHtml(section.diagram)}</pre>`
        : "";
      return `
        <article class="project-modal__case-block">
          <h3 class="project-modal__case-title">${escapeHtml(section.title)}</h3>
          ${body}
          ${items}
          ${diagram}
        </article>`;
    })
    .join("");
}

function openProjectModal(projectId) {
  const raw = projects.find((item) => item.id === projectId);
  const project = raw ? localizeProject(raw) : null;
  if (!project || !projectModal) return;

  renderModalMedia(project);
  projectModalTitle.textContent = project.title;
  projectModalYear.textContent = String(project.year);
  projectModalRole.textContent = project.role ?? "";
  projectModalRole.hidden = !project.role;

  if (projectModalTagline) {
    projectModalTagline.textContent = project.tagline ?? "";
    projectModalTagline.hidden = !project.tagline;
  }

  if (projectModalStatus) {
    projectModalStatus.textContent = project.status ?? "";
    projectModalStatus.hidden = !project.status;
    projectModalStatus.className = "project-modal__status";
    if (project.statusKind === "mvp") projectModalStatus.classList.add("project-modal__status--mvp");
    if (project.statusKind === "dev") projectModalStatus.classList.add("project-modal__status--dev");
  }

  projectModalDesc.textContent = project.descriptionLong ?? project.description;

  if (projectModalMetrics) {
    const hasMetrics = Array.isArray(project.metrics) && project.metrics.length > 0;
    projectModalMetrics.hidden = !hasMetrics;
    projectModalMetrics.innerHTML = hasMetrics ? renderMetricCards(project.metrics) : "";
  }

  if (projectModalCase) {
    const hasCase = Array.isArray(project.caseStudy) && project.caseStudy.length > 0;
    projectModalCase.hidden = !hasCase;
    projectModalCase.innerHTML = hasCase ? renderCaseStudy(project.caseStudy) : "";
  }

  const showHighlights = !(Array.isArray(project.caseStudy) && project.caseStudy.length > 0);
  projectModalHighlights.innerHTML = showHighlights
    ? (project.highlights ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "";
  projectModalHighlights.hidden = !showHighlights || !project.highlights?.length;

  if (projectModalTechMetrics) {
    const hasTech = Array.isArray(project.techMetrics) && project.techMetrics.length > 0;
    projectModalTechMetrics.hidden = !hasTech;
    projectModalTechMetrics.innerHTML = hasTech
      ? `<h3 class="project-modal__tech-metrics-title">${escapeHtml(
          t("projects.techScale")
        )}</h3><div class="project-modal__tech-metrics-grid">${renderMetricCards(
          project.techMetrics
        )}</div>`
      : "";
  }

  const techList = project.technologies ?? [];
  projectModalTags.innerHTML = techList
    .map((tech) => `<span class="accent-pill">${escapeHtml(tech)}</span>`)
    .join("");

  renderProjectModalLink(project);
  document.documentElement.classList.add("is-modal-open");
  follower?.classList.add("mouse-follower--hidden");

  if (typeof projectModal.showModal === "function") {
    projectModal.showModal();
  }
}

function renderProjectModalLink(project) {
  if (!projectModalActions) return;
  projectModalActions.innerHTML = "";
  if (!shouldShowProjectUrl(project)) return;

  const link = document.createElement("a");
  link.className = "project-modal__link";
  link.href = project.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.innerHTML = `${escapeHtml(t("projects.visitLive"))} <span aria-hidden="true">↗</span>`;
  projectModalActions.append(link);
}

function closeProjectModal() {
  if (projectModal?.open) {
    projectModal.close();
  }
  document.documentElement.classList.remove("is-modal-open");
  follower?.classList.remove("mouse-follower--hidden");
}

function bindProjectCardClicks(root = projectsContainer) {
  root.querySelectorAll("[data-project-id]").forEach((card) => {
    card.addEventListener("click", () => {
      openProjectModal(card.getAttribute("data-project-id"));
    });
  });
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
  if (projectsMore.firstElementChild) {
    bindProjectCardClicks(projectsMore);
  }
}

function renderprojects() {
  const sorted = getSortedProjects();
  const featured = sorted.slice(0, PROJECT_PREVIEW_COUNT);
  const extra = sorted.slice(PROJECT_PREVIEW_COUNT);
  projectsContainer.innerHTML = featured.map(renderProjectCard).join("");
  bindProjectCardClicks();
  syncProjectsExpandPanel(extra);

  if (projectsToggle) {
    projectsToggle.hidden = sorted.length <= PROJECT_PREVIEW_COUNT;
    projectsToggle.textContent = projectsExpanded
      ? t("projects.showFewer")
      : t("projects.viewAll");
    projectsToggle.setAttribute("aria-expanded", String(projectsExpanded));
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

projectModalClose?.addEventListener("click", closeProjectModal);
projectModal?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeProjectModal();
});
projectModal?.addEventListener("click", (event) => {
  if (event.target === projectModal) {
    closeProjectModal();
  }
});
projectModal?.addEventListener("close", () => {
  document.documentElement.classList.remove("is-modal-open");
  follower?.classList.remove("mouse-follower--hidden");
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

  if (projectModal?.open) {
    closeProjectModal();
  }
}

document.querySelectorAll("[data-set-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-set-lang");
    if (lang) setLanguage(lang);
  });
});

setLanguage(currentLang, { persist: false });
