document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const body = document.body;
const translations = window.LAZRM_TRANSLATIONS || {};
let activeLanguage = "en";
let activeTheme =
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

const translate = (key) =>
  translations[activeLanguage]?.[key] || translations.en?.[key] || key;

const updateThemeControls = () => {
  const isLight = activeTheme === "light";
  const actionLabel = translate(
    isLight ? "common.theme.dark" : "common.theme.light",
  );
  const accessibleLabel = translate(
    isLight ? "common.theme.switchToDark" : "common.theme.switchToLight",
  );

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", String(isLight));
    button.setAttribute("aria-label", accessibleLabel);
  });

  document.querySelectorAll("[data-theme-label]").forEach((label) => {
    label.textContent = actionLabel;
  });
};

const applyTheme = (theme) => {
  activeTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = activeTheme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", activeTheme === "light" ? "#F5F1E9" : "#11100E");
  updateThemeControls();
};

const initTheme = () => {
  applyTheme(activeTheme);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = activeTheme === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem("lazrm-theme", nextTheme);
      } catch {
        // Theme switching still works when storage is unavailable.
      }
      applyTheme(nextTheme);
    });
  });
};

const applyLanguage = (language) => {
  activeLanguage = translations[language] ? language : "en";
  document.documentElement.lang = activeLanguage;
  document.documentElement.dataset.language = activeLanguage;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    element.innerHTML = translate(element.dataset.i18nHtml);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute(
      "placeholder",
      translate(element.dataset.i18nPlaceholder),
    );
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute(
      "aria-label",
      translate(element.dataset.i18nAriaLabel),
    );
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", translate(element.dataset.i18nAlt));
  });

  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", translate(element.dataset.i18nTitle));
  });

  document.querySelectorAll("[data-lang-switch]").forEach((button) => {
    const isActive = button.dataset.langSwitch === activeLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const page = body.dataset.page;
  const title = translations[activeLanguage]?.[`meta.${page}.title`];
  const description =
    translations[activeLanguage]?.[`meta.${page}.description`];
  if (title) document.title = title;
  if (description) {
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
  }

  const menuLabel = document.querySelector(".menu-toggle__text");
  if (menuLabel) {
    menuLabel.textContent = translate(
      document.querySelector(".mobile-menu")?.classList.contains("is-open")
        ? "common.close"
        : "common.menu",
    );
  }

  updateThemeControls();

  window.dispatchEvent(
    new CustomEvent("lazrm:languagechange", {
      detail: { language: activeLanguage },
    }),
  );
};

const initLanguage = () => {
  let storedLanguage = "en";

  try {
    storedLanguage = window.localStorage.getItem("lazrm-language") || "en";
  } catch {
    storedLanguage = "en";
  }

  applyLanguage(storedLanguage);

  document.querySelectorAll("[data-lang-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      const language = button.dataset.langSwitch;
      try {
        window.localStorage.setItem("lazrm-language", language);
      } catch {
        // Language switching still works when storage is unavailable.
      }
      applyLanguage(language);
    });
  });
};

const setPageReady = () => {
  window.setTimeout(() => body.classList.add("is-ready"), 40);
};

const updateClock = () => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const time = formatter.format(new Date()).replace(/\./g, ":");
  document.querySelectorAll(".bern-time").forEach((clock) => {
    clock.textContent = time;
  });
};

const initRevealAnimations = () => {
  const revealItems = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -7% 0px",
    },
  );

  revealItems.forEach((item) => observer.observe(item));
};

const initScrollUI = () => {
  const progress = document.querySelector(".scroll-progress span");
  let ticking = false;

  const render = () => {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;

    if (progress) progress.style.transform = `scaleX(${ratio})`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    },
    { passive: true },
  );

  render();
};

const initActiveNavigation = () => {
  const sections = document.querySelectorAll("[data-section]");
  const navLinks = document.querySelectorAll(".desktop-nav [data-nav]");

  if (
    !sections.length ||
    !navLinks.length ||
    !("IntersectionObserver" in window)
  )
    return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      navLinks.forEach((link) => {
        link.classList.toggle(
          "is-active",
          link.dataset.nav === visible.target.dataset.section,
        );
      });
    },
    {
      rootMargin: "-38% 0px -50% 0px",
      threshold: [0, 0.1, 0.5],
    },
  );

  sections.forEach((section) => observer.observe(section));
};

const initMenu = () => {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (!toggle || !menu) return;

  const label = toggle.querySelector(".menu-toggle__text");

  const setMenuState = (open) => {
    body.classList.toggle("menu-open", open);
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    if (label)
      label.textContent = translate(open ? "common.close" : "common.menu");
  };

  toggle.addEventListener("click", () => {
    setMenuState(!menu.classList.contains("is-open"));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuState(false);
  });
};

const initCursor = () => {
  const cursor = document.querySelector(".cursor");
  if (
    !cursor ||
    prefersReducedMotion ||
    !window.matchMedia("(pointer: fine)").matches
  )
    return;

  document.documentElement.classList.add("has-custom-cursor");

  const label = cursor.querySelector(".cursor__label");
  let pointerX = -100;
  let pointerY = -100;
  let cursorX = -100;
  let cursorY = -100;

  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursor.classList.add("has-moved");
    },
    { passive: true },
  );

  const render = () => {
    cursorX += (pointerX - cursorX) * 0.18;
    cursorY += (pointerY - cursorY) * 0.18;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
    window.requestAnimationFrame(render);
  };

  render();

  document.querySelectorAll("[data-cursor]").forEach((item) => {
    item.addEventListener("pointerenter", () => {
      if (label) label.textContent = item.dataset.cursor;
      cursor.classList.add("is-active");
    });

    item.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-active");
      if (label) label.textContent = "";
    });
  });
};

const initMagneticElements = () => {
  if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches)
    return;

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      element.style.transform = `translate3d(${x * 0.14}px, ${y * 0.14}px, 0)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "translate3d(0, 0, 0)";
    });
  });
};

const initProjectMotion = () => {
  if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches)
    return;

  document.querySelectorAll(".project__media").forEach((media) => {
    const image = media.querySelector("img");
    if (!image) return;

    media.addEventListener("pointermove", (event) => {
      const rect = media.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      image.style.transform = `scale(1.035) translate3d(${x * -8}px, ${y * -8}px, 0)`;
    });

    media.addEventListener("pointerleave", () => {
      image.style.transform = "";
    });
  });
};

const initContactForm = () => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const message = String(data.get("message") || "");
    const subject = encodeURIComponent(
      activeLanguage === "de"
        ? `Projektanfrage von ${name}`
        : `Project enquiry from ${name}`,
    );
    const bodyText = encodeURIComponent(
      activeLanguage === "de"
        ? `Hallo Lazar,\n\n${message}\n\nVon: ${name}\nE-Mail: ${email}`
        : `Hi Lazar,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}`,
    );

    window.location.href = `mailto:lazar.minkov@proton.me?subject=${subject}&body=${bodyText}`;
  });
};

const initJournal = () => {
  const entries = document.querySelectorAll(".journal-entry");
  if (!entries.length) return;

  entries.forEach((entry) => {
    entry.addEventListener("toggle", () => {
      if (!entry.open) return;
      entries.forEach((other) => {
        if (other !== entry) other.open = false;
      });
    });
  });
};

const initPageTransitions = () => {
  document.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank"
      ) {
        return;
      }

      const url = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      const isSameDocument =
        url.pathname === current.pathname && url.search === current.search;
      const isLocalPage = url.origin === current.origin && !isSameDocument;

      if (!isLocalPage) return;

      event.preventDefault();
      body.classList.add("is-leaving");
      window.setTimeout(
        () => {
          window.location.href = url.href;
        },
        prefersReducedMotion ? 0 : 380,
      );
    });
  });
};

const initUtilities = () => {
  document.querySelectorAll("[data-year]").forEach((item) => {
    item.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-back-to-top]").forEach((button) => {
    button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  });
};

initTheme();
initLanguage();
setPageReady();
updateClock();
window.setInterval(updateClock, 1000);
initRevealAnimations();
initScrollUI();
initActiveNavigation();
initMenu();
initCursor();
initMagneticElements();
initProjectMotion();
initContactForm();
initJournal();
initPageTransitions();
initUtilities();
