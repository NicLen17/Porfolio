// Fabio Ramos — Senior Full Stack Software Engineer CV
// Compile: typst compile cv/fabio-ramos-cv-en.typ assets/Files/Fabio_Ramos_Senior_Full_Stack_Software_Engineer.pdf

#set page(
  paper: "a4",
  margin: (top: 1.3cm, bottom: 1.3cm, left: 1.45cm, right: 1.45cm),
)
#set text(
  font: ("Segoe UI", "Arial"),
  size: 9.5pt,
  fill: rgb("#1a1a1a"),
  lang: "en",
)
#set par(
  justify: false,
  leading: 1.03em,
)
#show heading: set text(weight: "bold", fill: rgb("#111111"))
#show link: set text(fill: rgb("#1a1a1a"))

#let accent = rgb("#2c3e50")
#let muted = rgb("#555555")
#let rule = rgb("#c8c8c8")

#let section(title) = {
  v(0.48em)
  text(size: 10.5pt, weight: "bold", fill: accent, upper(title))
  v(-0.32em)
  line(length: 100%, stroke: 0.7pt + rule)
  v(0.30em)
}

#let job(role, company, location, period, body) = {
  block(breakable: false, {
    grid(
      columns: (1fr, auto),
      column-gutter: 0.65em,
      [
        #text(weight: "bold", size: 10pt)[#role]
        #linebreak()
        #text(weight: "bold", fill: accent, size: 9.2pt)[#company]
        #text(fill: muted, size: 9.2pt)[ · #location]
      ],
      align(right)[
        #text(fill: muted, size: 8.9pt)[#period]
      ],
    )
    v(0.13em)
    body
  })
}

#let bullet(body) = {
  pad(left: 0.55em, bottom: 0.15em, {
    grid(
      columns: (0.55em, 1fr),
      text(fill: accent)[•],
      body,
    )
  })
}

#align(center)[
  #text(size: 18.2pt, weight: "bold", fill: accent)[Fabio Nicolas Ramos Legname]
  #v(0.05em)
  #text(size: 11pt, weight: "bold")[Senior Full Stack Software Engineer]
  #v(0.06em)
  #text(size: 9.2pt, fill: muted)[TypeScript · React · Next.js · Node.js · SQL]
  #linebreak()
  #text(size: 8.8pt, fill: muted)[Product Engineering · Software Architecture · Enterprise Systems]
  #v(0.14em)
  #text(size: 8.55pt)[
    Tucumán, Argentina · #link("tel:+543813379225")[+54 381 337-9225] ·
    #link("mailto:fabioramosnic@gmail.com")[fabioramosnic\@gmail.com]
  ]
  #linebreak()
  #text(size: 8.55pt, fill: muted)[
    #link("https://www.linkedin.com/in/fabioramosnic")[linkedin.com/in/fabioramosnic] ·
    #link("https://github.com/NicLen17")[github.com/NicLen17] ·
    #link("https://www.fabioramos.com.ar")[fabioramos.com.ar]
  ]
]

#section("Professional Summary")
Senior Full Stack Software Engineer with 5+ years building software across modern web applications, B2B/SaaS products and enterprise systems. Strong focus on TypeScript, React, Next.js and Node.js, complemented by SQL/backend engineering and experience modernizing enterprise and banking systems. Combines product engineering, technical ownership and architecture decisions with measurable impact in production.

#section("Professional Experience")

#job(
  "Principal Software Engineer · Co-Founder",
  "CAW Tech",
  "Argentina · Remote",
  "Sep 2025 — Present",
)[
  #bullet[Own technical direction, system architecture and end-to-end delivery of CAW Tech products — architecture decisions, software design, integrations, database/backend choices, frontend architecture, deployment and product evolution.]
  #bullet[Volley Manager: led architecture and end-to-end development of a production SaaS/PWA powering daily operations of a professional volleyball club in Bolivia — ~700 athletes, ~15 staff and ~600 daily access/check-in events.]
  #bullet[Built administrative, financial, attendance, notification and access-control workflows (QR and consent-based facial recognition), plus online registration and payment integration with Banco Económico (Bolivia); designed interactive volleyball scouting, AI-assisted club information and a voice-based scouting workflow for coaches.]
  #bullet[ExpoLogic: architected and developed a multi-tenant event-space SaaS enabling organizers to generate event websites, manage exhibitors and reservations, and configure spatial layouts through a visual map builder with interactive stand selection.]
  #bullet[Presented the ExpoLogic MVP at Emprende U (semifinalist); product subsequently featured by La Gaceta. Designed CAW Education, a data-driven education platform for schools.]
]

#job(
  "Software Developer · Banking",
  "CENSYS S.A.",
  "Argentina · Remote",
  "Dec 2023 — Jul 2025",
)[
  #bullet[Maintained and adapted existing banking modules for Sucrédito Bank (BSR) and Banco Santiago del Estero (BSE), implementing requirement changes and protecting transactional integrity in high-volume production systems.]
  #bullet[Designed and tuned stored procedures, triggers and SQL (Sybase / T-SQL) for stability and performance — up to 60% faster execution on financial reporting workloads.]
  #bullet[Integrated SOAP APIs, validated with Postman, supported UATs and handled post-deployment incidents across business-critical banking flows.]
  #bullet[Implemented a hardware-assisted credit-card statement payment flow: operators scan the statement barcode with a reader, the system matches the records automatically, and payment of the credit-card summary is managed from there.]
  #bullet[Mentored new developers through onboarding across technologies, Scrum practices and team workflows — connecting day-to-day development with the tech lead and QA/testers.]
]

#job(
  "Front-End Engineer Intern · Web UI (SSR)",
  "Globant",
  "Yerba Buena, Tucumán · Remote",
  "Jul 2024 — Oct 2024",
)[
  #bullet[Selected for a competitive internship program among ~500 professionals, completed alongside my full-time role at CENSYS (outside CENSYS working hours).]
  #bullet[Built React, TypeScript and Zustand applications in Agile teams, improving UI rendering and lifecycle practices and reducing initial load times by ~20%.]
  #bullet[Participated in Git/GitHub workflows, code reviews and frontend architecture discussions.]
]

#job(
  "Full Stack Web Developer · MERN",
  "TecnoLine",
  "Tucumán · Hybrid",
  "Jan 2023 — May 2024",
)[
  #bullet[Owned end-to-end delivery of 12+ production web apps (e-commerce, SPAs and admin systems), including a period of concurrent work alongside CENSYS.]
  #bullet[Integrated APIs, payment gateways and external services; treated SEO, accessibility and PageSpeed as first-class concerns.]
  #bullet[Managed the full lifecycle on Vercel/Render with ongoing client support.]
]

#job(
  "Front-End Web Developer",
  "Freelance",
  "Argentina · Remote",
  "Jun 2021 — Dec 2022",
)[
  #bullet[Designed and built websites for entrepreneurs and institutions, including hosting deployment, maintenance and commercialization of reusable templates.]
]

#section("Technical Skills")
#let skill(label, body) = {
  set text(size: 9pt)
  pad(bottom: 0.42em)[
    #text(weight: "bold")[#label:] #body
  ]
}
#skill("Core", [TypeScript · JavaScript · React · Next.js · Node.js · SQL · PostgreSQL · Tailwind CSS · shadcn/ui · Zustand · PWA])
#skill("Backend & Data", [Express · REST APIs · Supabase · MongoDB · Redis · T-SQL · Sybase])
#skill("Engineering", [Architecture · Product Eng. · API Design · DB Optimization · Git · CI/CD · Testing · TestSprite · Playwright · Scrum])
#skill("Domain", [SaaS / Multi-tenant · Enterprise Systems · Legacy Modernization · Banking · PowerBuilder])
#skill("Languages", [Spanish (Native) · English (C1)])

#section("Education")
#job(
  "Information Systems Engineering (in progress)",
  "Universidad Tecnológica Nacional (UTN)",
  "Argentina",
  "Mar 2022 — Present",
)[]
#job(
  "Graduate Diploma · Data Science for Organizations",
  "Universidad Nacional de Tucumán (UNT)",
  "Argentina",
  "Apr 2025 — Dec 2025",
)[]
#job(
  "International Program · Digital Companies & E-Business Revolution",
  "California State University, Northridge (CSUN)",
  "USA",
  "Jul 2025 — Aug 2025",
)[]

#section("Selected Certifications")
#let cert(name, meta) = {
  block(spacing: 0.38em)[
    #text(weight: "bold")[#name]#text(fill: muted, size: 8.7pt)[ · #meta]
  ]
}
#cert([Cloud Computing · AWS], [Coderhouse, May 2025])
#cert([Business English], [CSUN, 2025])
#cert([Management and Processing of Organizational Data], [UNT, Oct 2025])
