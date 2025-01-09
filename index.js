const container = document.querySelector("#container"),
  tile = document.querySelector(".tile");

// const follower = document.getElementById("follower")

// window.onmousemove = e => {
//   const x = e.clientX - follower.offsetWidth / 2,
//         y = e.clientY - follower.offsetHeight / 2;

//     const keyframes = {
//       transform: `translate(${x}px, ${y}px)`
//     }

//     follower.animate(keyframes, {
//       duration: 800,
//       fill: "forwards"
//     })
// }

for (let i = 0; i < 1399; i++) {
  container.appendChild(tile.cloneNode());
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((el) => observer.observe(el));

window.addEventListener("scroll", function () {
  const background = document.getElementById("container");
  const text = document.getElementById("content");

  // Cambia este valor al scroll que deseas
  const scrollPositionF = 1;

  // Si el scroll es mayor a la posición, cambia el estilo
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

const proyects = [
  {
    title: "ZETAROSS",
    image: "./assets/ZETAROSS.jpeg",
    description:
      "Website created for the publication and consultation on 3D printed figures",
    link: "https://zetaross.vercel.app",
    release: 2022,
  },
  {
    title: "CEBAMATE",
    image: "./assets/CEBAMATE 1.jpeg",
    description:
      "website for an entrepreneur from Salta dedicated to the sale of personalized mates and accessories. It includes an interactive catalog, responsive design and a contact form for orders and queries. The project improved their online presence, increasing the reach and sales of their business.",
    link: "https://ceba-mate.vercel.app",
    release: 2023,
  },
  {
    title: "CAW",
    image: "./assets/CAW 3.jpeg",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, consequatur odit molestias optio natus possimus iste tenetur eveniet, aperiam, cupiditate sunt ab facilis? Corrupti quas a ipsum tempore, aspernatur cupiditate.",
    link: "https://cawvehiculos.vercel.app",
    release: 2024,
  },
  {
    title: "MOUSTACHE GENTLEMAN",
    image: "./assets/PELUQUERIA 1.jpeg",
    description:
      "Freelance project for a group specialized in the sale and exchange of vehicles.",
    link: "https://moustache-gentlemen.vercel.app",
    release: 2023,
  },
  {
    title: "INDUMENTARIA TAURIE",
    image: "./assets/TAURIE.jpeg",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, consequatur odit molestias optio natus possimus iste tenetur eveniet, aperiam, cupiditate sunt ab facilis? Corrupti quas a ipsum tempore, aspernatur cupiditate.",
    link: "https://indumentaria-taurie.vercel.app",
      release: 2023,
  },
  {
    title: "KEIS",
    image: "./assets/KEIS.jpeg",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, consequatur odit molestias optio natus possimus iste tenetur eveniet, aperiam, cupiditate sunt ab facilis? Corrupti quas a ipsum tempore, aspernatur cupiditate.",
    link: "https://planta-productora-queso.vercel.app",
      release: 2021,
  },
  {
    title: "PHONE PIXEL",
    image: "./assets/PHONEPIXEL.jpeg",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, consequatur odit molestias optio natus possimus iste tenetur eveniet, aperiam, cupiditate sunt ab facilis? Corrupti quas a ipsum tempore, aspernatur cupiditate.",
    link: "https://proyecto-final-rc.vercel.app",
      release: 2021,
  },
  {
    title: "BOOTCAMP BACK-END",
    image: "./assets/BOTCAMPBACK.jpeg",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, consequatur odit molestias optio natus possimus iste tenetur eveniet, aperiam, cupiditate sunt ab facilis? Corrupti quas a ipsum tempore, aspernatur cupiditate.",
    link: "https://github.com/NicLen17/Bootcamp---Backend",
      release: 2024,
  },
  {
    title: "TARJETA 18 MAURO",
    image: "./assets/18MAURO.jpeg",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, consequatur odit molestias optio natus possimus iste tenetur eveniet, aperiam, cupiditate sunt ab facilis? Corrupti quas a ipsum tempore, aspernatur cupiditate.",
    link: "https://mateo-github-io.vercel.app",
      release: 2023,
  },
  {
    title: "TARJETA 15 CATALINA",
    image: "./assets/15CATA.jpeg",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Non, consequatur odit molestias optio natus possimus iste tenetur eveniet, aperiam, cupiditate sunt ab facilis? Corrupti quas a ipsum tempore, aspernatur cupiditate.",
    link: "https://15-catalina.vercel.app",
      release: 2023,
  },
];

const proyectsContainer = document.getElementById("proyects-container");

function renderProyects(proyects) {
  proyectsContainer.innerHTML = proyects
    .map(
      (proyect) => `
    <a class="proyects-link" rel="noreferrer" href="${proyect.link}" target="_blank" class="proyect-link">
      <div class="proyects-card">
        <div class="proyects-card-img">
          <img src="${proyect.image}" alt="${proyect.title}" />
        </div>
        <div class="proyects-card-body">
          <h2>${proyect.title}</h2>
          <p>${proyect.description}</p>
        </div>
        <h3>Release - ${proyect.release}</h3>
      </div>
    </a>
  `
    )
    .join("");
}

console.log(proyects);
renderProyects(proyects);

const filterDropdown = document.getElementById("filter-dropdown");

// Función para ordenar los proyectos según la opción seleccionada
function sortProyects(criteria) {
  let sortedProyects = [...proyects]; // Clonar el array para no modificar el original

  switch (criteria) {
    case "alphabetical-asc":
      sortedProyects.sort((a, b) => a.title.localeCompare(b.title)); // Orden alfabético A-Z
      break;
    case "alphabetical-desc":
      sortedProyects.sort((a, b) => b.title.localeCompare(a.title)); // Orden alfabético Z-A
      break;
    case "release-asc":
      sortedProyects.sort((a, b) => a.release - b.release); // Fecha ascendente
      break;
    case "release-desc":
      sortedProyects.sort((a, b) => b.release - a.release); // Fecha descendente
      break;
    default:
      break; // No hacer nada si se selecciona "none"
  }

  renderProyects(sortedProyects); // Renderizamos los proyectos ordenados
}

// Evento para manejar el cambio en el dropdown
filterDropdown.addEventListener("change", (e) => {
  sortProyects(e.target.value); // Pasamos el valor seleccionado para ordenar
});

// Renderizar los proyectos inicialmente
renderProyects(proyects);
