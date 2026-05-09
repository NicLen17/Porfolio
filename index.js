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

const projects = [
  {
    id: "caw-education",
    title: "CAW Education",
    year: 2025,
    description:
      "EdTech platform unifying engineering and data science — academic metrics, workflows for educators and admins, and KPI clarity.",
    tags: ["Next.js", "TypeScript", "Supabase", "Data"],
    image: "./assets/Images/cawpic.jfif",
  },
  {
    id: "volley-manager",
    title: "Volley Manager",
    year: 2025,
    description:
      "Large-scale volleyball administration with optimized real-time data flows for leagues and operations.",
    tags: ["Real-time", "TypeScript", "Product"],
    image: null,
  },
  {
    id: "expologic",
    title: "ExpoLogic",
    year: 2025,
    description:
      "Fair management system with a dynamic exhibitor resource engine — less manual logistics on the ground.",
    tags: ["Scheduling", "Automation"],
    image: null,
  },
  {
    id: "sublimspace",
    title: "Sublimspace",
    year: 2025,
    description:
      "Wholesale and retail commerce for customized products — catalog, coupons, and sales analytics.",
    tags: ["E-commerce", "UX"],
    image: "./assets/Images/Sublimspace.jfif",
  },
  {
    id: "enduring-education",
    title: "Enduring Education",
    year: 2025,
    description:
      "Tools and digital strategies for university educators — engagement and retention oriented.",
    tags: ["Education", "Content"],
    image: "./assets/Images/EnduringEducation.webp",
  },
  {
    id: "txtgen",
    title: "TxtGen",
    year: 2025,
    description: "Generate downloadable structured .txt documents from configurable templates.",
    tags: ["Productivity", "React"],
    image: "./assets/Images/TxtGen.webp",
  },
  {
    id: "caw-motors",
    title: "CAW Motors",
    year: 2024,
    description: "Marketing site for second-hand vehicle listings with discovery and contact flows.",
    tags: ["Marketing site", "SEO"],
    image: "./assets/Images/CAW-3.webp",
  },
  {
    id: "cebamate",
    title: "CEBAMATE",
    year: 2023,
    description: "Catalog and responsive storefront for personalized mates and accessories.",
    tags: ["SMB", "Catalog"],
    image: "./assets/Images/CEBAMATE 1.webp",
  },
  {
    id: "zetaross",
    title: "ZETAROSS",
    year: 2022,
    description: "Showcase site for 3D-printed figures — browse and inquiry flows.",
    tags: ["Catalog"],
    image: "./assets/Images/ZETAROSS.webp",
  },
  {
    id: "moustache-gentleman",
    title: "Moustache Gentleman",
    year: 2023,
    description: "Barber shop site — styles and appointment inquiry flows.",
    tags: ["SMB", "Web"],
    image: "./assets/Images/PELUQUERIA 1.webp",
  },
  {
    id: "indumentaria-taurie",
    title: "Indumentaria Taurie",
    year: 2023,
    description: "Clothing storefront — product discovery and contact.",
    tags: ["E-commerce"],
    image: "./assets/Images/TAURIE.webp",
  },
  {
    id: "keis",
    title: "KEIS",
    year: 2021,
    description:
      "Institutional site for food technicians showcasing local dairy production scope and quality.",
    tags: ["Institutional"],
    image: "./assets/Images/KEIS.webp",
  },
  {
    id: "phone-pixel",
    title: "Phone Pixel",
    year: 2021,
    description: "Example ecommerce template site.",
    tags: ["Template"],
    image: "./assets/Images/PHONEPIXEL.webp",
  },
  {
    id: "bootcamp-backend",
    title: "Bootcamp Back-end",
    year: 2024,
    description:
      "Bootcamp management backend with MongoDB, Node.js, and Postman-documented APIs.",
    tags: ["Node.js", "MongoDB"],
    image: "./assets/Images/BOTCAMPBACK.webp",
  },
  {
    id: "tarjeta-18-mateo",
    title: "18th birthday · Mateo",
    year: 2023,
    description: "Digital invitation with RSVP-style registration flow.",
    tags: ["Landing"],
    image: "./assets/Images/18MAURO.webp",
  },
  {
    id: "tarjeta-15-catalina",
    title: "15th birthday · Catalina",
    year: 2023,
    description: "Digital invitation with RSVP-style registration flow.",
    tags: ["Landing"],
    image: "./assets/Images/15CATA.webp",
  },
];

const PROJECT_PREVIEW_COUNT = 6;
const projectsContainer = document.getElementById("projects-container");
const projectsToggle = document.getElementById("projects-toggle");
let projectSortCriteria = "none";
let projectsExpanded = false;

function renderProjectCard(p) {
  const gi = hashToGradientIndex(p.id);
  const tagsHtml = p.tags.map((t) => `<span class="accent-pill">${t}</span>`).join("");
  const bar = `<div class="project-card__bar"><h3 class="project-card__title">${p.title}</h3><span class="project-card__year">${p.year}</span></div>`;
  const scrim = `<div class="project-card__scrim" aria-hidden="true"></div>`;
  const media = p.image
    ? `<div class="project-card__media"><img loading="lazy" src="${p.image}" alt="${p.title} — project screenshot" /><div class="project-card__shine" aria-hidden="true"></div>${scrim}${bar}</div>`
    : `<div class="project-card__media project-card__media--gradient project-card__grad--${gi}"><div class="project-card__shine" aria-hidden="true"></div>${scrim}${bar}</div>`;

  return `
    <article class="project-card">
      ${media}
      <div class="project-card__body">
        <p class="project-card__desc">${p.description}</p>
        <div class="project-card__tags">${tagsHtml}</div>
      </div>
    </article>
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

function renderprojects() {
  const sorted = getSortedProjects();
  const list = projectsExpanded ? sorted : sorted.slice(0, PROJECT_PREVIEW_COUNT);
  projectsContainer.innerHTML = list.map(renderProjectCard).join("");

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
const certToggle = document.getElementById("cert-toggle");
let certsExpanded = false;

function renderCerts() {
  const list = certsExpanded ? certifications : certifications.slice(0, FEATURED_CERT_COUNT);
  certGrid.innerHTML = list
    .map(
      (c) => `
    <article class="cert-card">
      <h3 class="cert-card__name">${c.name}</h3>
      <p class="cert-card__issuer">${c.issuer}</p>
      <p class="cert-card__date">${c.date}</p>
    </article>
  `
    )
    .join("");

  if (certifications.length <= FEATURED_CERT_COUNT) {
    certToggle.hidden = true;
  }
}

certToggle.addEventListener("click", () => {
  certsExpanded = !certsExpanded;
  certToggle.textContent = certsExpanded ? "Show fewer" : "See all";
  certToggle.setAttribute("aria-expanded", String(certsExpanded));
  renderCerts();
});

renderCerts();

const EXPERIENCE_PREVIEW_COUNT = 4;
const experienceToggle = document.getElementById("experience-toggle");
const experienceStack = document.querySelector("#experience .experience-stack");
const experienceCards = experienceStack
  ? Array.from(experienceStack.querySelectorAll(".exp-card"))
  : [];
let experienceExpanded = false;

function syncExperienceVisibility() {
  experienceCards.forEach((card, index) => {
    if (index >= EXPERIENCE_PREVIEW_COUNT) {
      card.hidden = !experienceExpanded;
    }
  });
  if (experienceToggle) {
    experienceToggle.hidden = experienceCards.length <= EXPERIENCE_PREVIEW_COUNT;
    experienceToggle.textContent = experienceExpanded ? "Show fewer" : "See all";
    experienceToggle.setAttribute("aria-expanded", String(experienceExpanded));
  }
}

experienceToggle?.addEventListener("click", () => {
  experienceExpanded = !experienceExpanded;
  syncExperienceVisibility();
});

syncExperienceVisibility();

function initTestimonials() {
  const COLLAPSED_LEN = 220;
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
    btn.hidden = false;
    btn.addEventListener("click", () => {
      const collapsed = quote.classList.toggle("is-collapsed");
      card.classList.toggle("testimonial-card--expanded", !collapsed);
      btn.setAttribute("aria-expanded", String(!collapsed));
      btn.textContent = collapsed ? "Read more" : "Read less";
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
