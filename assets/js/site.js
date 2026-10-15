document.addEventListener("DOMContentLoaded", () => {

const prefersReducedMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* =========================================
   COPIAR BLOQUES DE CÓDIGO
========================================= */

document
  .querySelectorAll(".prose pre")
  .forEach((pre) => {

    if (
      pre.parentElement &&
      pre.parentElement.classList.contains("code-block")
    ) {
      return;
    }

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "code-block";

    pre.parentNode.insertBefore(
      wrapper,
      pre
    );

    wrapper.appendChild(pre);


    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "copy-code-button";

    button.textContent =
      "Copiar";

    button.setAttribute(
      "aria-label",
      "Copiar bloque de código"
    );

    wrapper.insertBefore(
      button,
      pre
    );


    button.addEventListener(
      "click",
      async () => {

        const code =
          pre.querySelector("code") || pre;

        const text =
          code.innerText;


        try {

          await navigator.clipboard.writeText(
            text
          );

          button.textContent =
            "Copiado ✓";

          button.classList.add(
            "is-copied"
          );

        } catch {

          button.textContent =
            "No se pudo copiar";

        }


        setTimeout(() => {

          button.textContent =
            "Copiar";

          button.classList.remove(
            "is-copied"
          );

        }, 1600);

      }
    );

  });
  
const backToTop =
  document.querySelector(
    "[data-back-to-top]"
  );


if (backToTop) {

  const updateBackToTop = () => {

    backToTop.classList.toggle(
      "is-visible",
      window.scrollY > 700
    );

  };


  window.addEventListener(
    "scroll",
    updateBackToTop,
    { passive: true }
  );


  updateBackToTop();

}  
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {

  const track = carousel.querySelector("[data-carousel-track]");
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");

  if (!track || !prev || !next) {
    return;
  }

  const updateButtons = () => {

    const maxScroll =
      track.scrollWidth - track.clientWidth;

    prev.disabled = track.scrollLeft <= 5;

    next.disabled =
      track.scrollLeft >= maxScroll - 5;
  };


  prev.addEventListener("click", () => {

    track.scrollBy({
      left: -(track.clientWidth * .85),
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });

  });


  next.addEventListener("click", () => {

    track.scrollBy({
      left: track.clientWidth * .85,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });

  });


  track.addEventListener(
    "scroll",
    updateButtons,
    { passive: true }
  );


  window.addEventListener(
    "resize",
    updateButtons
  );


  updateButtons();

});

document
  .querySelectorAll("[data-scrollspy]")
  .forEach((navigation) => {

    const links =
      [...navigation.querySelectorAll('a[href^="#"]')];

    const sections = links
      .map((link) => {

        const id =
          link.getAttribute("href").substring(1);

        return document.getElementById(id);

      })
      .filter(Boolean);


    if (!sections.length) {
      return;
    }


    const activate = (id) => {

      links.forEach((link) => {

        const active =
          link.getAttribute("href") === `#${id}`;

        link.classList.toggle(
          "is-current-section",
          active
        );

      });

    };


    const observer =
      new IntersectionObserver(

        (entries) => {

          const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort(
              (a, b) =>
                a.boundingClientRect.top -
                b.boundingClientRect.top
            );

          if (visible.length) {
            activate(visible[0].target.id);
          }

        },

        {
          rootMargin:
            "-20% 0px -65% 0px"
        }

      );


    sections.forEach(
      section => observer.observe(section)
    );

  });
  const searchInput =
    document.getElementById("site-search");

  const searchResults =
    document.getElementById("search-results");

  const searchStatus =
    document.getElementById("search-status");


  if (searchInput && searchResults) {

    let searchIndex = [];


    const typeLabels = {
      posts: "Artículo",
      units: "Unidad",
      modules: "Módulo",
      cycles: "Ciclo"
    };


    const escapeHtml = (value) =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");


    fetch("/search.json")
      .then((response) => {

        if (!response.ok) {
          throw new Error("No se pudo cargar el índice de búsqueda.");
        }

        return response.json();

      })
      .then((data) => {

        searchIndex = data;

      })
      .catch(() => {

        if (searchStatus) {
          searchStatus.textContent =
            "El buscador no está disponible temporalmente.";
        }

      });


    const normalize = (text) =>

      (text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");


    searchInput.addEventListener(
      "input",
      () => {

        const query =
          normalize(searchInput.value.trim());


        if (query.length < 2) {

          searchResults.innerHTML = "";

          if (searchStatus) {
            searchStatus.textContent =
              "Escribe al menos dos caracteres para buscar.";
          }

          return;

        }


        const matches =
          searchIndex
            .filter((item) => {

              const haystack =
                normalize(
                  `${item.title}
                   ${item.description}
                   ${item.content}`
                );

              return haystack.includes(query);

            })
            .slice(0, 20);


        if (searchStatus) {

          searchStatus.textContent =
            matches.length === 1
              ? "1 resultado encontrado."
              : `${matches.length} resultados encontrados.`;

        }


        searchResults.innerHTML =
          matches.length
            ? matches
                .map((item) => {

                  const type =
                    typeLabels[item.type] || "Contenido";

                  return `
                    <article class="search-result">

                      <span class="search-result__type">
                        ${escapeHtml(type)}
                      </span>

                      <h2>
                        <a href="${escapeHtml(item.url)}">
                          ${escapeHtml(item.title)}
                        </a>
                      </h2>

                      <p>
                        ${escapeHtml(item.description || "")}
                      </p>

                    </article>
                  `;

                })
                .join("")

            : `<p class="search-empty">
                 No se encontraron resultados.
               </p>`;

      });

  }

  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");


  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      themeToggle.setAttribute(
        "title",
        theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"
      );
    }
  }


  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "dark";
      applyTheme(current === "light" ? "dark" : "light");
    });
  }

});

// Efecto de escritura de la marca.
const brandTypewrite =
  document.getElementById("brand-typewrite");

if (brandTypewrite) {

  const text =
    brandTypewrite.dataset.text ||
    brandTypewrite.textContent ||
    "";

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  if (reduceMotion) {

    brandTypewrite.textContent = text;

  } else {

    brandTypewrite.textContent = "";

    let i = 0;
    const speed = 75;


    function typeBrand() {

      if (i < text.length) {

        brandTypewrite.textContent +=
          text.charAt(i);

        i += 1;

        setTimeout(
          typeBrand,
          speed
        );

      }

    }


    typeBrand();

  }

}
