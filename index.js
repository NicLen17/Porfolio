const container = document.querySelector("#container");
const tile = document.querySelector(".tile");
const follower = document.getElementById("follower");

let tileHoverRaf = 0;
let lastHoveredTile = null;

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
  follower.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
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

const projects = [
  {
    id: "caw-education",
    title: "CAW Education",
    year: 2025,
    role: "Principal engineer · CAW Tech",
    description:
      "EdTech platform merging engineering and data science for academic KPIs and lighter admin workflows.",
    descriptionLong:
      "CAW Education connects classroom data capture, educator dashboards, and leadership KPIs in one product. The platform reduces manual reporting for teachers and administrators while giving decision-makers visibility into engagement, performance trends, and operational load across programs.",
    technologies: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Tailwind CSS", "Chart.js", "Vercel"],
    highlights: [
      "Integrated multi-source academic metrics into unified educator and admin views.",
      "Designed data models and flows aligned with real school operations and reporting cycles.",
      "Shipped iterative releases with measurable reduction in manual spreadsheet work.",
    ],
    image: "./assets/Images/cawpic.jfif",
  },
  {
    id: "volley-manager",
    title: "Volley Manager",
    year: 2025,
    role: "Principal engineer · CAW Tech",
    description:
      "Large-scale volleyball administration with optimized real-time data flows for leagues and operations.",
    descriptionLong:
      "Volley Manager supports federations, clubs, and tournament operators managing fixtures, rosters, standings, and live updates at scale. The product prioritizes low-latency updates, predictable data integrity during match days, and workflows that work under venue connectivity constraints.",
    technologies: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Vercel"],
    highlights: [
      "Optimized real-time pipelines for standings, fixtures, and operational dashboards.",
      "Structured domain models for leagues, teams, matches, and staff permissions.",
      "Built for high-traffic match windows with resilient sync and clear admin tooling.",
    ],
    image: "./assets/Images/VolleyManager.png",
  },
  {
    id: "expologic",
    title: "ExpoLogic · Feria Cultural",
    year: 2025,
    role: "Principal engineer · CAW Tech",
    description:
      "Fair management with dynamic exhibitor allocation — less manual logistics on the ground.",
    descriptionLong:
      "ExpoLogic automates exhibitor placement, resource scheduling, and fair-floor logistics for cultural events. Operators configure constraints once; the engine proposes fair allocations and reduces last-minute manual reshuffling during setup and teardown.",
    technologies: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Tailwind CSS", "Vercel"],
    highlights: [
      "Dynamic resource allocation engine for booths, services, and exhibitor constraints.",
      "Operator dashboards to validate assignments before publishing to exhibitors.",
      "Deployed for live cultural fair operations with public-facing information surfaces.",
    ],
    url: "https://lola-mora.vercel.app",
    image: "./assets/Images/ExpoLogic.jpeg",
  },
  {
    id: "caw-tech",
    title: "CAW Tech",
    year: 2025,
    role: "Co-founder · Principal engineer",
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
    id: "cba-volleystar",
    title: "CBA VolleyStar",
    year: 2025,
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
    id: "sublimspace",
    title: "Sublimspace",
    year: 2025,
    role: "Full stack · E-commerce",
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
    image: "./assets/Images/Sublimspace.jfif",
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
    id: "txtgen",
    title: "TxtGen",
    year: 2025,
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
    image: "./assets/Images/TxtGen.webp",
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

const PROJECT_PREVIEW_COUNT = 8;
const projectsContainer = document.getElementById("projects-container");
const projectsMore = document.getElementById("projects-more");
const projectsToggle = document.getElementById("projects-toggle");
let projectSortCriteria = "none";
let projectsExpanded = false;

function renderProjectCard(p) {
  const gi = hashToGradientIndex(p.id);
  const cardTags = (p.technologies ?? []).slice(0, 6);
  const tagsHtml = cardTags.map((t) => `<span class="accent-pill">${escapeHtml(t)}</span>`).join("");
  const title = escapeHtml(p.title);
  const bar = `<div class="project-card__bar"><h3 class="project-card__title">${title}</h3><span class="project-card__year">${p.year}</span></div>`;
  const scrim = `<div class="project-card__scrim" aria-hidden="true"></div>`;
  const media = p.image
    ? `<div class="project-card__media"><img loading="lazy" src="${escapeHtml(p.image)}" alt="${title} — project screenshot" /><div class="project-card__shine" aria-hidden="true"></div>${scrim}${bar}</div>`
    : `<div class="project-card__media project-card__media--gradient project-card__grad--${gi}"><div class="project-card__shine" aria-hidden="true"></div>${scrim}${bar}</div>`;

  return `
    <button type="button" class="project-card" data-project-id="${escapeHtml(p.id)}" aria-label="View details for ${title}">
      ${media}
      <div class="project-card__body">
        <p class="project-card__desc">${escapeHtml(p.description)}</p>
        <div class="project-card__tags">${tagsHtml}</div>
        <p class="project-card__hint">View details</p>
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
      break;
  }
  return sorted;
}

const projectModal = document.getElementById("project-modal");
const projectModalClose = document.getElementById("project-modal-close");
const projectModalMedia = document.getElementById("project-modal-media");
const projectModalTitle = document.getElementById("project-modal-title");
const projectModalYear = document.getElementById("project-modal-year");
const projectModalRole = document.getElementById("project-modal-role");
const projectModalDesc = document.getElementById("project-modal-desc");
const projectModalHighlights = document.getElementById("project-modal-highlights");
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
    projectModalMedia.innerHTML = `<img loading="lazy" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} — project screenshot" />`;
    return;
  }
  projectModalMedia.hidden = false;
  projectModalMedia.className = `project-modal__media project-modal__media--gradient project-card__grad--${gi}`;
  projectModalMedia.innerHTML = "";
}

function openProjectModal(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project || !projectModal) return;

  renderModalMedia(project);
  projectModalTitle.textContent = project.title;
  projectModalYear.textContent = String(project.year);
  projectModalRole.textContent = project.role ?? "";
  projectModalRole.hidden = !project.role;
  projectModalDesc.textContent = project.descriptionLong ?? project.description;

  projectModalHighlights.innerHTML = (project.highlights ?? [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  projectModalHighlights.hidden = !project.highlights?.length;

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
  link.innerHTML = 'Visit live project <span aria-hidden="true">↗</span>';
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
    projectsToggle.textContent = projectsExpanded ? "Show fewer" : "See all";
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
  { id: "org-data-mgmt", name: "Management and Processing of Organizational Data", issuer: "Universidad Nacional de Tucumán", date: "October 2025" },
  { id: "data-science-python", name: "Data Science using Python", issuer: "Universidad Nacional de Tucumán", date: "August 2025" },
  { id: "data-science-challenges", name: "Challenges and Applications of Data Science in Organizations", issuer: "Universidad Nacional de Tucumán", date: "August 2025" },
  { id: "digital-ebusiness-csun", name: "Digital Companion & E-business Revolution", issuer: "California State University, Northridge", date: "July 2025" },
  { id: "business-english-csun", name: "Business English", issuer: "California State University, Northridge", date: "June 2025" },
  { id: "statistical-tools-ds", name: "Statistical Tools for Data Science", issuer: "Universidad Nacional de Tucumán", date: "June 2025" },
  { id: "aws-cloud", name: "Cloud Computing · AWS", issuer: "Coderhouse", date: "May 2025" },
  { id: "english-b2-rush", name: "English Studies Certification · B2", issuer: "Instituto Rush", date: "December 2024" },
  { id: "backend-node-rolling", name: "BackEnd Node.js · Database Integration in Web Apps", issuer: "RollingCode", date: "November 2024" },
  { id: "english-b2-rush-2024", name: "Foreign Language Certification · B2 English", issuer: "Instituto Rush", date: "July 2024" },
  { id: "ef-set-c1", name: "EF SET Official Certificate 65/100 (C1 Advanced)", issuer: "EF SET", date: "May 2024" },
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
  return `
    <article class="cert-card" style="--stagger: ${stagger}">
      <h3 class="cert-card__name">${c.name}</h3>
      <p class="cert-card__issuer">${c.issuer}</p>
      <p class="cert-card__date">${c.date}</p>
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
    certToggle.textContent = certsExpanded ? "Show fewer" : "See all";
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

function initExperienceAccordion() {
  const stack = document.querySelector("#experience .experience-stack");
  if (!stack) return;

  const cards = Array.from(stack.querySelectorAll(".exp-card"));
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
    if (full.length <= COLLAPSED_LEN) {
      btn.hidden = true;
      return;
    }

    quote.classList.add("is-collapsed");
    quote.style.maxHeight = `${COLLAPSED_HEIGHT}px`;
    btn.hidden = false;

    const expandQuote = () => {
      quote.classList.remove("is-collapsed");
      quote.style.maxHeight = `${quote.scrollHeight}px`;
      card.classList.add("testimonial-card--expanded");
      btn.setAttribute("aria-expanded", "true");
      btn.textContent = "Read less";
    };

    const collapseQuote = () => {
      quote.style.maxHeight = `${quote.scrollHeight}px`;
      requestAnimationFrame(() => {
        quote.classList.add("is-collapsed");
        quote.style.maxHeight = `${COLLAPSED_HEIGHT}px`;
      });
      card.classList.remove("testimonial-card--expanded");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = "Read more";
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

const footerYear = document.getElementById("footer-year");
if (footerYear) {
  footerYear.textContent = String(new Date().getFullYear());
}
