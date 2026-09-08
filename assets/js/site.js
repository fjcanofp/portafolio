document.addEventListener("DOMContentLoaded", () => {
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
      behavior: "smooth"
    });

  });


  next.addEventListener("click", () => {

    track.scrollBy({
      left: track.clientWidth * .85,
      behavior: "smooth"
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


if (searchInput && searchResults) {

  let searchIndex = [];


  fetch("/search.json")
    .then(response => response.json())
    .then(data => {

      searchIndex = data;

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

        return;

      }


      const matches =
        searchIndex
          .filter(item => {

            const haystack =
              normalize(
                `${item.title}
                 ${item.description}
                 ${item.content}`
              );

            return haystack.includes(query);

          })
          .slice(0, 20);


      searchResults.innerHTML =
        matches.length
          ? matches
              .map(item => `

                <article class="search-result">

                  <h2>
                    <a href="${item.url}">
                      ${item.title}
                    </a>
                  </h2>

                  <p>
                    ${item.description || ""}
                  </p>

                </article>

              `)
              .join("")

          : `<p>No se encontraron resultados.</p>`;

    });

}

  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");

  const translations = {
    es: {
      nav_teaching: "Docencia",
      nav_blog: "Blog",
      nav_about: "Sobre mí",
      hero_eyebrow: "DOCENCIA · DESARROLLO · TECNOLOGÍA",
      hero_lead: "Docente de FP en Informática, desarrollador y mentor. Comparto materiales, proyectos y experiencias sobre programación, bases de datos, sistemas e inteligencia artificial.",
      cta_teaching: "Docencia",
      cta_blog: "Entrar al blog",
      footer_rights: "All rights reserved.",
      footer_license_prefix: "Contenidos del sitio:",
      footer_license_suffix: "salvo indicación expresa."
    },
    en: {
      nav_teaching: "Teaching",
      nav_blog: "Blog",
      nav_about: "About",
      hero_eyebrow:"TEACHING · DEVELOPMENT · TECHNOLOGY",
      hero_lead: "Vocational Education Computer Science teacher, developer and mentor. I share materials, projects and experiences on programming, databases, systems and artificial intelligence.",
      cta_teaching: "Teaching",
      cta_blog: "Go to blog",
      footer_rights: "All rights reserved.",
      footer_license_prefix: "Site contents:",
      footer_license_suffix: "unless expressly stated otherwise."
    }
  };

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

  function applyLanguage(lang) {
    if (!translations[lang]) return;

    root.lang = lang;
    localStorage.setItem("site-lang", lang);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    const currentPill = document.querySelector(".lang-current .lang-pill");
    if (currentPill) currentPill.textContent = lang.toUpperCase();

    document.querySelectorAll(".lang-option").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.lang === lang);
    });
  }

  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "dark";
      applyTheme(current === "light" ? "dark" : "light");
    });
  }

  const savedLang = localStorage.getItem("site-lang") || "es";
  applyLanguage(savedLang);

  document.querySelectorAll(".lang-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyLanguage(btn.dataset.lang);
    });
  });
});

//añado el efecto typping
  const brandTypewrite = document.getElementById("brand-typewrite");

  if (brandTypewrite) {
    const text = brandTypewrite.dataset.text || brandTypewrite.textContent || "";
    brandTypewrite.textContent = "";

    let i = 0;
    const speed = 75;

    function typeBrand() {
      if (i < text.length) {
        brandTypewrite.textContent += text.charAt(i);
        i += 1;
        setTimeout(typeBrand, speed);
      }
    }

    typeBrand();
  }
