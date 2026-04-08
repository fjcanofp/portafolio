document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");

  const translations = {
    es: {
      nav_teaching: "Docencia",
      nav_blog: "Blog",
      nav_about: "Sobre mí",
      hero_eyebrow: "docencia + materiales + portfolio",
      hero_lead: "Profesor de Informática de FP. Diseño docencia, materiales y documentación técnica clara, útil y lista para el aula.",
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
      hero_eyebrow: "teaching + materials + portfolio",
      hero_lead: "VET Computer Science teacher. I design teaching, learning materials and technical documentation that are clear, useful and ready for the classroom.",
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