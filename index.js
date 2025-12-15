const container = document.querySelector("#container"),
  tile = document.querySelector(".tile");

const follower = document.getElementById("follower");

document.addEventListener("mousemove", (e) => {
  // Obtenemos las coordenadas X e Y del mouse
  const x = e.clientX;
  const y = e.clientY;

  // Actualizamos la posición usando transform (es más rápido que top/left)
  // Mantenemos el translate(-50%, -50%) para que siga centrado
  follower.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
});

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

const projects = [
  {
    title: "CAW Education",
    image: "./assets/Images/cawpic.jfif",
    description:
      "A system that combines everything known from both worlds so far, software development and data science, with the aim of modernizing school management and turning data into smart decisions.",
    release: 2025,
  },
  {
    title: "Sublimspace",
    image: "./assets/Images/Sublimspace.jfif",
    description:
      "An online store that handles the complexity of wholesale and retail sales of customized products, without the limitations of traditional platforms, and also allows you to manage products, discount coupons, and have a sales analysis to see the performance of the business.",
    release: 2025,
  },
  {
    title: "Enduring Education",
    image: "./assets/Images/EnduringEducation.webp",
    description:
      "Empowering university teachers with modern tools, digital strategies, and real-world methods to connect with today's students and reduce dropout rates.",
    release: 2025,
  },
  {
    title: "TxtGen",
    image: "./assets/Images/TxtGen.webp",
    description:
      "An intuitive web application that allows users to create and download .txt files with a fully customized structure. Users can define the exact format and content, making it ideal for generating structured documents, templates, or formatted notes with ease.",
    release: 2025,
  },
  {
    title: "ZETAROSS",
    image: "./assets/Images/ZETAROSS.webp",
    description:
      "Website created for the publication and consultation on 3D printed figures",
    release: 2022,
  },
  {
    title: "CEBAMATE",
    image: "./assets/Images/CEBAMATE 1.webp",
    description:
      "Website for an entrepreneur from Salta dedicated to the sale of personalized mates and accessories. It includes an interactive catalog, responsive design and a contact section.",
    release: 2023,
  },
  {
    title: "CAW",
    image: "./assets/Images/CAW-3.webp",
    description:
      "Website dedicated to the publication and sale of second-hand cars.",
    release: 2024,
  },
  {
    title: "MOUSTACHE GENTLEMAN",
    image: "./assets/Images/PELUQUERIA 1.webp",
    description:
      "Mustache gentleman barber shop website where you can consult hairstyles and appointments",
    release: 2023,
  },
  {
    title: "INDUMENTARIA TAURIE",
    image: "./assets/Images/TAURIE.webp",
    description:
      "Website dedicated to the sale of clothing, where users can buy or consult about products",
    release: 2023,
  },
  {
    title: "KEIS",
    image: "./assets/Images/KEIS.webp",
    description:
      "Institutional website made for food technicians who want to share the scope and quality of local dairy production.",
    release: 2021,
  },
  {
    title: "PHONE PIXEL",
    image: "./assets/Images/PHONEPIXEL.webp",
    description: "Example website of an ecommerce template.",
    release: 2021,
  },
  {
    title: "BOOTCAMP BACK-END",
    image: "./assets/Images/BOTCAMPBACK.webp",
    description:
      "This project aims to develop the backend for a bootcamp management system, using MongoDB as a database, Node.js for the server logic, and Postman for API testing and documentation.",
    release: 2024,
  },
  {
    title: "TARJETA 18 MATEO",
    image: "./assets/Images/18MAURO.webp",
    description:
      "Personalized website that works as a digital invitation card where the owner can send the link to whoever they want for registration.",
    release: 2023,
  },
  {
    title: "TARJETA 15 CATALINA",
    image: "./assets/Images/15CATA.webp",
    description:
      "Personalized website that works as a digital invitation card where the owner can send the link to whoever they want for registration.",
    release: 2023,
  },
];

const projectsContainer = document.getElementById("projects-container");

function renderprojects(projects) {
  projectsContainer.innerHTML = projects
    .map(
      (proyect) => `
      <div class="projects-card">
        <div class="projects-card-img">
          <img loading="lazy" src="${proyect.image}" alt="Proyecto - Fabio Ramos - ${proyect.title}" />
        </div>
        <div class="projects-card-body">
          <h2>${proyect.title}</h2>
          <p>${proyect.description}</p>
        </div>
        <h3><b>Release - ${proyect.release}</b></h3>
      </div>
  `
    )
    .join("");
}

const filterDropdown = document.getElementById("filter-dropdown");

// Función para ordenar los proyectos según la opción seleccionada
function sortprojects(criteria) {
  let sortedprojects = [...projects]; // Clonar el array para no modificar el original

  switch (criteria) {
    case "alphabetical-asc":
      sortedprojects.sort((a, b) => a.title.localeCompare(b.title)); // Orden alfabético A-Z
      break;
    case "alphabetical-desc":
      sortedprojects.sort((a, b) => b.title.localeCompare(a.title)); // Orden alfabético Z-A
      break;
    case "release-asc":
      sortedprojects.sort((a, b) => a.release - b.release); // Fecha ascendente
      break;
    case "release-desc":
      sortedprojects.sort((a, b) => b.release - a.release); // Fecha descendente
      break;
    default:
      break; // No hacer nada si se selecciona "none"
  }

  renderprojects(sortedprojects); // Renderizamos los proyectos ordenados
}

// Evento para manejar el cambio en el dropdown
filterDropdown.addEventListener("change", (e) => {
  sortprojects(e.target.value); // Pasamos el valor seleccionado para ordenar
});

// Renderizar los proyectos inicialmente
renderprojects(projects);

const readMoreButtons = document.querySelectorAll(".read-more-btn");

// Iterate over each button to add a click event listener
readMoreButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Find the closest parent container with the 'experience-details-toggle' class
    const detailsContainer = button.previousElementSibling;

    // Toggle the 'expanded' class to show/hide the content
    detailsContainer.classList.toggle("expanded");

    // Change the button text based on its state
    if (detailsContainer.classList.contains("expanded")) {
      button.textContent = "See less";
    } else {
      button.textContent = "See more";
    }
  });
});

// Manejo del botón "Volver arriba"
const backToTopBtn = document.getElementById("back-to-top");

// Muestra u oculta el botón basado en el scroll
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    // El botón aparece después de 300px de scroll
    backToTopBtn.classList.add("show-btn");
  } else {
    backToTopBtn.classList.remove("show-btn");
  }
});

const navToggle = document.querySelector(".nav-toggle");
const navItems = document.querySelector(".nav-items-container");

navToggle.addEventListener("click", () => {
  navItems.classList.toggle("show");
});
