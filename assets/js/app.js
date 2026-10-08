(function () {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getContent() {
    return clone(window.AMEEI_CONTENT || {});
  }

  function text(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value || "";
  }

  function attr(selector, name, value) {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute(name, value);
  }

  function create(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  }

  function equipmentFallback(label) {
    const safeLabel = String(label || "Equipo de prueba").slice(0, 58);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
        <rect width="640" height="420" fill="#f4f6f8"/>
        <rect x="156" y="78" width="328" height="232" rx="18" fill="#ffffff" stroke="#cfd8e0" stroke-width="6"/>
        <rect x="192" y="116" width="154" height="70" rx="8" fill="#0b4f8a"/>
        <circle cx="402" cy="150" r="30" fill="#c31f32"/>
        <circle cx="454" cy="150" r="18" fill="#d89626"/>
        <rect x="192" y="214" width="252" height="18" rx="9" fill="#dfe5eb"/>
        <rect x="192" y="250" width="194" height="18" rx="9" fill="#dfe5eb"/>
        <text x="320" y="356" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#31506a">${safeLabel}</text>
      </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function safeImage(image, options = {}) {
    image.loading = "lazy";
    if (!image.getAttribute("src")) {
      image.classList.add("image-failed");
      return image;
    }
    image.addEventListener("error", () => {
      if (options.fallback === "equipment") {
        image.src = equipmentFallback(image.dataset.fallbackLabel || image.alt);
        image.classList.add("image-fallback");
        return;
      }
      image.classList.add("image-failed");
      image.removeAttribute("src");
    });
    return image;
  }

  function initials(name) {
    return String(name || "A")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function renderList(selector, items, renderer) {
    const root = document.querySelector(selector);
    if (!root) return;
    root.innerHTML = "";
    (items || []).forEach((item, index) => root.appendChild(renderer(item, index)));
  }

  function renderNav(content) {
    const nav = document.querySelector("[data-main-nav]");
    if (!nav) return;
    nav.innerHTML = "";
    const currentPath = location.pathname.replace(/\/index\.html$/, "/");
    (content.nav || []).forEach((item) => {
      const link = create("a", "", item.label);
      link.href = item.href;
      const itemPath = new URL(item.href, location.origin).pathname.replace(/\/index\.html$/, "/");
      if (currentPath === itemPath || (itemPath === "/" && currentPath === "/index.html")) {
        link.classList.add("active");
      }
      nav.append(link);
    });
  }

  function render(content) {
    document.title = content.seo?.title || content.brand?.name || "AMEEI";
    const meta = document.querySelector("meta[name='description']");
    if (meta && content.seo?.description) meta.content = content.seo.description;

    attr("[data-brand-logo]", "src", content.brand?.logo);
    attr("[data-brand-logo]", "alt", content.brand?.legalName || content.brand?.name || "AMEEI");
    text("[data-brand-name]", content.brand?.name);
    text("[data-brand-tagline]", content.brand?.tagline);
    text("[data-footer-brand]", content.brand?.name);
    renderNav(content);

    const heroMedia = document.querySelector("[data-hero-image]");
    if (heroMedia && content.hero?.image) {
      heroMedia.style.backgroundImage = `url("${content.hero.image}")`;
    }
    text("[data-hero-eyebrow]", content.hero?.eyebrow);
    text("[data-hero-title]", content.hero?.title);
    text("[data-hero-description]", content.hero?.description);
    text("[data-hero-primary]", content.hero?.primaryCta);
    text("[data-hero-secondary]", content.hero?.secondaryCta);
    renderList("[data-hero-highlights]", content.hero?.highlights, (item) => create("li", "", item));

    renderList("[data-stats]", content.stats, (stat) => {
      const card = create("article", "stat");
      card.append(create("strong", "", stat.value));
      card.append(create("span", "", stat.label));
      return card;
    });

    text("[data-proof-title]", content.proof?.title);
    text("[data-proof-text]", content.proof?.text);
    renderList("[data-proof-bullets]", content.proof?.bullets, (bullet) => create("li", "", bullet));

    text("[data-about-title]", content.about?.title);
    const paragraphs = document.querySelector("[data-about-paragraphs]");
    if (paragraphs) {
      paragraphs.innerHTML = "";
      (content.about?.paragraphs || []).forEach((paragraph) => paragraphs.append(create("p", "", paragraph)));
    }
    text("[data-about-mission]", content.about?.mission);
    text("[data-about-vision]", content.about?.vision);
    attr("[data-about-image]", "src", content.about?.image);
    renderList("[data-values]", content.about?.values, (value) => create("span", "chip", value));

    text("[data-services-title]", content.servicesIntro?.title);
    text("[data-services-description]", content.servicesIntro?.description);
    const serviceRoot = document.querySelector("[data-services]");
    const visibleServices = serviceRoot?.classList.contains("service-grid-home") ? (content.services || []).slice(0, 4) : content.services;
    renderList("[data-services]", visibleServices, (service) => {
      const card = create("article", "service-card");
      const body = create("div");
      body.append(create("h3", "", service.title));
      body.append(create("p", "", service.description));
      const mini = create("div", "mini-list");
      (service.items || []).forEach((item) => mini.append(create("span", "", item)));
      card.append(body, mini);
      return card;
    });

    text("[data-sectors-title]", content.sectorsIntro?.title);
    text("[data-sectors-description]", content.sectorsIntro?.description);
    renderList("[data-sectors]", content.sectors, (sector) => {
      const card = create("article", "sector-card reveal");
      const image = create("img");
      image.src = sector.image || "";
      image.alt = sector.title || "Sector AMEEI";
      image.width = 640;
      image.height = 360;
      safeImage(image);
      const body = create("div", "sector-body");
      body.append(create("h3", "", sector.title));
      body.append(create("p", "", sector.description));
      const tags = create("div", "mini-list");
      (sector.keywords || []).forEach((keyword) => tags.append(create("span", "", keyword)));
      body.append(tags);
      card.append(image, body);
      return card;
    });

    renderList("[data-process]", content.process, (step, index) => {
      const card = create("article", "process-step reveal");
      card.append(create("span", "", String(index + 1).padStart(2, "0")));
      card.append(create("h3", "", step.title));
      card.append(create("p", "", step.text));
      return card;
    });

    renderList("[data-equipment]", content.equipment, (equipment) => {
      const card = create("article", "equipment-card");
      const image = create("img");
      image.src = equipment.image || "";
      image.alt = [equipment.brand, equipment.model, equipment.name].filter(Boolean).join(" ") || "Equipo de prueba";
      image.width = 640;
      image.height = 400;
      image.dataset.fallbackLabel = [equipment.brand, equipment.model].filter(Boolean).join(" | ") || equipment.name || "Equipo de prueba";
      safeImage(image, { fallback: "equipment" });
      const body = create("div", "card-body");
      body.append(create("span", "equipment-brand", equipment.brand || ""));
      body.append(create("h3", "", equipment.name));
      body.append(create("p", "equipment-model", equipment.model ? `Modelo: ${equipment.model}` : ""));
      body.append(create("p", "", equipment.use));
      const list = create("ul");
      (equipment.features || []).forEach((feature) => list.append(create("li", "", feature)));
      body.append(list);
      card.append(image, body);
      return card;
    });

    renderList("[data-projects]", content.projects, (project) => {
      const card = create("article", "project-card");
      const body = create("div", "card-body");
      body.append(create("h3", "", project.client));
      body.append(create("p", "", project.description));
      body.append(create("span", "client-final", `Cliente final: ${project.finalClient || "N/D"}`));
      if (project.url) {
        const link = create("a", "project-link", "Sitio oficial");
        link.href = project.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        body.append(link);
      }
      if (project.image) {
        const image = create("img");
        image.src = project.image;
        image.alt = project.client || "Proyecto";
        image.width = 640;
        image.height = 360;
        safeImage(image);
        card.append(image);
      }
      card.append(body);
      return card;
    });

    renderList("[data-clients]", content.clients, (client, index) => {
      const data = typeof client === "string" ? { image: client, name: `Cliente AMEEI ${index + 1}`, url: "#" } : client;
      const link = create("a", "client-logo");
      link.href = data.url || "#";
      if (/^https?:\/\//.test(data.url || "")) {
        link.target = "_blank";
        link.rel = "noreferrer";
      }
      link.title = data.name || `Cliente AMEEI ${index + 1}`;
      if (data.image) {
        const img = create("img");
        img.src = data.image;
        img.alt = data.name || `Cliente AMEEI ${index + 1}`;
        img.width = 320;
        img.height = 120;
        safeImage(img);
        link.append(img);
      } else {
        link.classList.add("client-logo-text");
      }
      link.append(create("span", "client-name", data.name || `Cliente AMEEI ${index + 1}`));
      return link;
    });

    renderList("[data-team]", content.team, (person) => {
      const card = create("article", "team-card");
      card.append(create("div", "team-avatar", initials(person.name)));
      card.append(create("h3", "", person.name));
      card.append(create("p", "", person.role));
      if (person.email) {
        const link = create("a", "", person.email);
        link.href = `mailto:${person.email}`;
        card.append(link);
      }
      return card;
    });

    text("[data-quality-title]", content.quality?.title);
    text("[data-quality-text]", content.quality?.text);
    renderList("[data-quality-points]", content.quality?.points, (point) => create("li", "", point));

    text("[data-contact-person]", content.contact?.person);
    text("[data-contact-company]", content.contact?.company);
    text("[data-contact-address]", content.contact?.address);
    const contactPanel = document.querySelector(".contact-panel");
    if (contactPanel && !contactPanel.querySelector("[data-contact-options]")) {
      const options = create("div", "contact-options");
      options.setAttribute("data-contact-options", "");
      const actions = contactPanel.querySelector(".contact-actions");
      const mapLink = contactPanel.querySelector("[data-contact-map]");
      contactPanel.insertBefore(options, actions || mapLink || null);
    }
    renderList("[data-contact-options]", content.contact?.contacts, (contact) => {
      const item = create("article", "contact-option");
      item.append(create("strong", "", contact.name));
      item.append(create("span", "", contact.role || ""));
      if (contact.email) {
        item.append(create("b", "contact-value", contact.email));
      }
      if (contact.phone) {
        item.append(create("b", "contact-value", contact.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")));
      }
      return item;
    });
    const email = document.querySelector("[data-contact-email]");
    if (email) email.remove();
    const phone = document.querySelector("[data-contact-phone]");
    if (phone) phone.remove();
    const map = document.querySelector("[data-contact-map]");
    if (map) map.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.contact?.mapQuery || content.contact?.address || "")}`;
  }

  function bindHeader() {
    const header = document.querySelector("[data-header]");
    const button = document.querySelector("[data-menu-button]");
    const setHeader = () => header?.classList.toggle("is-solid", window.scrollY > 20);
    setHeader();
    window.addEventListener("scroll", setHeader, { passive: true });
    button?.addEventListener("click", () => document.body.classList.toggle("nav-open"));
    document.querySelectorAll(".main-nav a").forEach((link) => {
      link.addEventListener("click", () => document.body.classList.remove("nav-open"));
    });
  }

  function bindRevealAnimations() {
    const elements = document.querySelectorAll(".reveal, .service-card, .project-card, .team-card, .equipment-card");
    if (!elements.length) return;
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
  }

  render(getContent());
  bindHeader();
  bindRevealAnimations();
})();




