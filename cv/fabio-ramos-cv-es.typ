// Fabio Ramos — CV Senior Full Stack Software Engineer
// Compilar: typst compile cv/fabio-ramos-cv-es.typ assets/Files/Fabio_Ramos_Ingeniero_Software_Full_Stack_Senior.pdf

#set page(
  paper: "a4",
  margin: (top: 1.3cm, bottom: 1.3cm, left: 1.45cm, right: 1.45cm),
)
#set text(
  font: ("Segoe UI", "Arial"),
  size: 9.5pt,
  fill: rgb("#1a1a1a"),
  lang: "es",
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
  #text(size: 11pt, weight: "bold")[Ingeniero de Software Full Stack Senior]
  #v(0.06em)
  #text(size: 9.2pt, fill: muted)[TypeScript · React · Next.js · Node.js · SQL]
  #linebreak()
  #text(size: 8.8pt, fill: muted)[Ingeniería de Producto · Arquitectura de Software · Sistemas Enterprise]
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

#section("Perfil Profesional")
Ingeniero de Software Full Stack Senior con más de 5 años construyendo software para aplicaciones web modernas, productos B2B/SaaS y sistemas enterprise. Especializado en TypeScript, React, Next.js y Node.js, con experiencia complementaria en SQL/backend y modernización de sistemas empresariales y bancarios. Combino ingeniería de producto, ownership técnico y decisiones de arquitectura con impacto medible en producción.

#section("Experiencia Profesional")

#job(
  "Principal Software Engineer · Cofundador",
  "CAW Tech",
  "Argentina · Remoto",
  "Sep 2025 — Presente",
)[
  #bullet[Lidero la dirección técnica, arquitectura de sistemas y entrega end-to-end de los productos de CAW Tech: decisiones de arquitectura, diseño de software, integraciones, backend/base de datos, arquitectura frontend, despliegue y evolución del producto.]
  #bullet[Volley Manager: lideré la arquitectura y el desarrollo end-to-end de una plataforma SaaS/PWA en producción que opera el día a día de un club profesional de vóley en Bolivia — ~700 atletas, ~15 staff y ~600 eventos diarios de acceso/check-in.]
  #bullet[Construí flujos administrativos, financieros, de asistencia, notificaciones y control de acceso (QR y reconocimiento facial con consentimiento), más registro online e integración de pagos con Banco Económico (Bolivia); diseñé scouting interactivo de vóley, información del club asistida por IA y un flujo de scouting por voz para entrenadores.]
  #bullet[ExpoLogic: arquitecturé y desarrollé un SaaS multi-tenant de gestión de espacios para eventos, permitiendo a organizadores generar sitios del evento, gestionar expositores y reservas, y configurar layouts espaciales con un constructor visual de mapas e inventario espacial interactivo.]
  #bullet[Presenté el MVP de ExpoLogic en Emprende U (semifinalista); el producto fue cubierto por La Gaceta. Diseñé CAW Education, plataforma educativa orientada a datos para escuelas.]
]

#job(
  "Software Developer · Banking",
  "CENSYS S.A.",
  "Argentina · Remoto",
  "Dic 2023 — Jul 2025",
)[
  #bullet[Mantuve y adapté módulos bancarios existentes para Sucrédito Bank (BSR) y Banco Santiago del Estero (BSE), implementando cambios de requerimientos y protegiendo la integridad transaccional en sistemas productivos de alto volumen.]
  #bullet[Diseñé y optimicé stored procedures, triggers y SQL (Sybase / T-SQL) para estabilidad y performance, logrando hasta un 60% de mejora en tiempos de ejecución en reportes financieros.]
  #bullet[Integré APIs SOAP, validadas con Postman, acompañé UATs y atendí incidentes post-deploy en flujos bancarios críticos.]
  #bullet[Implementé un flujo de pago de resúmenes de tarjeta de crédito asistido por hardware: el operador escanea el código de barras del resumen con un lector, el sistema detecta automáticamente los registros y gestiona el pago desde ahí.]
  #bullet[Realicé mentoring a nuevos desarrolladores durante el onboarding: tecnologías, prácticas Scrum y flujos de trabajo del equipo — vinculando el desarrollo diario con el líder técnico y QA/testers.]
]

#job(
  "Front-End Engineer Intern · Web UI (SSR)",
  "Globant",
  "Yerba Buena, Tucumán · Remoto",
  "Jul 2024 — Oct 2024",
)[
  #bullet[Fui seleccionado para un programa competitivo de internship entre ~500 profesionales, realizado en paralelo a mi trabajo full-time en CENSYS (fuera del horario laboral de CENSYS).]
  #bullet[Desarrollé aplicaciones con React, TypeScript y Zustand en equipos Agile, mejorando prácticas de renderizado y ciclo de vida de UI y reduciendo los tiempos de carga inicial en ~20%.]
  #bullet[Participé en flujos Git/GitHub, code reviews y discusiones de arquitectura frontend.]
]

#job(
  "Full Stack Web Developer · MERN",
  "TecnoLine",
  "Tucumán · Híbrido",
  "Ene 2023 — May 2024",
)[
  #bullet[Gestioné de punta a punta 12+ aplicaciones web en producción (e-commerce, SPAs y sistemas administrativos), incluyendo un período de trabajo concurrente con CENSYS.]
  #bullet[Integré APIs, pasarelas de pago y servicios externos; trabajé SEO, accesibilidad y PageSpeed como aspectos de primer nivel.]
  #bullet[Gestioné el ciclo de vida completo en Vercel/Render y brindé soporte continuo a clientes.]
]

#job(
  "Front-End Web Developer",
  "Freelance",
  "Argentina · Remoto",
  "Jun 2021 — Dic 2022",
)[
  #bullet[Diseñé y desarrollé sitios web para emprendedores e instituciones, incluyendo despliegue, mantenimiento y comercialización de templates reutilizables.]
]

#section("Habilidades Técnicas")
#let skill(label, body) = {
  set text(size: 9pt)
  pad(bottom: 0.42em)[
    #text(weight: "bold")[#label:] #body
  ]
}
#skill("Core", [TypeScript · JavaScript · React · Next.js · Node.js · SQL · PostgreSQL · Tailwind CSS · shadcn/ui · Zustand · PWA])
#skill("Backend y Datos", [Express · REST APIs · Supabase · MongoDB · Redis · T-SQL · Sybase])
#skill("Engineering", [Arquitectura · Ing. de Producto · Diseño de APIs · Optimización DB · Git · CI/CD · Testing · TestSprite · Playwright · Scrum])
#skill("Dominio", [SaaS / Multi-tenant · Sistemas Enterprise · Legacy Modernization · Banking · PowerBuilder])
#skill("Idiomas", [Español (Nativo) · Inglés (C1)])

#section("Educación")
#job(
  "Ingeniería en Sistemas de Información (en curso)",
  "Universidad Tecnológica Nacional (UTN)",
  "Argentina",
  "Mar 2022 — Presente",
)[]
#job(
  "Diplomatura · Ciencia de Datos para Organizaciones",
  "Universidad Nacional de Tucumán (UNT)",
  "Argentina",
  "Abr 2025 — Dic 2025",
)[]
#job(
  "Programa Internacional · Digital Companies & E-Business Revolution",
  "California State University, Northridge (CSUN)",
  "EE.UU.",
  "Jul 2025 — Ago 2025",
)[]

#section("Certificaciones Seleccionadas")
#let cert(name, meta) = {
  block(spacing: 0.38em)[
    #text(weight: "bold")[#name]#text(fill: muted, size: 8.7pt)[ · #meta]
  ]
}
#cert([Cloud Computing · AWS], [Coderhouse, mayo 2025])
#cert([Business English], [CSUN, 2025])
#cert([Gestión y Procesamiento de Datos Organizacionales], [UNT, oct 2025])
