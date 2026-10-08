(function () {
  const STORAGE_KEY = "ameeiContentDraftV8";
  const CMS_API = window.AMEEI_CMS_API || "";
  let csrf = window.AMEEI_CMS_CSRF || "";
  let content = readContent();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readContent() {
    if (CMS_API) return clone(window.AMEEI_CONTENT || {});
    try {
      const draft = localStorage.getItem(STORAGE_KEY);
      return draft ? JSON.parse(draft) : clone(window.AMEEI_CONTENT || {});
    } catch (error) {
      return clone(window.AMEEI_CONTENT || {});
    }
  }

  function get(path) {
    return path.split(".").reduce((current, key) => current?.[key], content);
  }

  function set(path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, content);
    target[last] = value;
  }

  function create(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function toast(message) {
    const root = document.querySelector("[data-toast]");
    root.textContent = message;
    root.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => root.classList.remove("show"), 2600);
  }

  function fillScalarFields() {
    document.querySelectorAll("[data-path]").forEach((field) => {
      field.value = get(field.dataset.path) || "";
    });
    const logo = document.querySelector("[data-admin-logo]");
    if (logo) logo.src = content.brand?.logo || "";
  }

  function label(text) {
    const element = create("label", "field");
    element.append(create("span", "", text));
    return element;
  }

  function textInput(value, onInput, multiline) {
    const input = document.createElement(multiline ? "textarea" : "input");
    input.value = value || "";
    input.addEventListener("input", () => {
      onInput(input.value);
      renderPreview();
    });
    return input;
  }

  function imageInput(value, onInput) {
    const wrap = create("div", "field");
    wrap.append(create("span", "", "Imagen o logo (URL o archivo)"));
    const input = document.createElement("input");
    input.value = value || "";
    input.placeholder = "https://...";
    input.addEventListener("input", () => {
      onInput(input.value);
      renderPreview();
    });
    const file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";
    file.hidden = true;
    const button = create("button", "soft-button file-pill", "Subir imagen");
    button.type = "button";
    button.addEventListener("click", () => file.click());
    file.addEventListener("change", () => {
      const selected = file.files?.[0];
      if (!selected) return;
      const reader = new FileReader();
      reader.onload = () => {
        input.value = reader.result;
        onInput(reader.result);
        renderPreview();
        toast("Imagen cargada en el editor.");
      };
      reader.readAsDataURL(selected);
    });
    wrap.append(input, button, file);
    return wrap;
  }

  function csvToList(value) {
    return String(value || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function listToText(value) {
    return (value || []).join("\n");
  }

  function renderArrayEditors() {
    document.querySelectorAll("[data-array-editor]").forEach((root) => {
      const path = root.dataset.arrayEditor;
      const type = root.dataset.type;
      const itemLabel = root.dataset.label || "Elemento";
      const items = get(path) || [];
      root.innerHTML = "";

      items.forEach((item, index) => {
        const card = create("article", "editable-card");
        const header = create("div", "editable-card-header");
        header.append(create("strong", "", `${itemLabel} ${index + 1}`));
        const remove = create("button", "danger-button", "Eliminar");
        remove.type = "button";
        remove.addEventListener("click", () => {
          items.splice(index, 1);
          set(path, items);
          renderArrayEditors();
          renderPreview();
        });
        header.append(remove);
        card.append(header);

        if (type === "text" || type === "image") {
          const field = type === "image"
            ? imageInput(item, (value) => items[index] = value)
            : label(itemLabel);
          if (type === "text") field.append(textInput(item, (value) => items[index] = value));
          card.append(field);
        }

        if (type === "textarea") {
          const field = label(itemLabel);
          field.append(textInput(item, (value) => items[index] = value, true));
          card.append(field);
        }

        if (type === "stat") {
          card.append(makeField("Valor", item.value, (value) => item.value = value));
          card.append(makeField("Descripcion", item.label, (value) => item.label = value));
        }

        if (type === "service") {
          card.append(makeField("Titulo", item.title, (value) => item.title = value));
          card.append(makeField("Descripcion", item.description, (value) => item.description = value, true));
          card.append(makeField("Puntos destacados, uno por linea", listToText(item.items), (value) => item.items = csvToList(value), true));
        }

        if (type === "equipment") {
          card.append(makeField("Marca", item.brand, (value) => item.brand = value));
          card.append(makeField("Modelo", item.model, (value) => item.model = value));
          card.append(makeField("Nombre", item.name, (value) => item.name = value));
          card.append(makeField("Uso", item.use, (value) => item.use = value));
          card.append(imageInput(item.image, (value) => item.image = value));
          card.append(makeField("Caracteristicas, una por linea", listToText(item.features), (value) => item.features = csvToList(value), true));
        }

        if (type === "project") {
          card.append(makeField("Cliente directo", item.client, (value) => item.client = value));
          card.append(makeField("Cliente final", item.finalClient, (value) => item.finalClient = value));
          card.append(makeField("Descripcion", item.description, (value) => item.description = value, true));
          card.append(makeField("Sitio oficial", item.url, (value) => item.url = value));
          card.append(imageInput(item.image, (value) => item.image = value));
        }

        if (type === "client") {
          card.append(makeField("Nombre", item.name, (value) => item.name = value));
          card.append(makeField("Sitio oficial", item.url, (value) => item.url = value));
          card.append(imageInput(item.image, (value) => item.image = value));
        }

        if (type === "sector") {
          card.append(makeField("Titulo", item.title, (value) => item.title = value));
          card.append(makeField("Descripcion", item.description, (value) => item.description = value, true));
          card.append(imageInput(item.image, (value) => item.image = value));
          card.append(makeField("Palabras clave, una por linea", listToText(item.keywords), (value) => item.keywords = csvToList(value), true));
        }

        if (type === "process") {
          card.append(makeField("Titulo", item.title, (value) => item.title = value));
          card.append(makeField("Texto", item.text, (value) => item.text = value, true));
        }

        if (type === "person") {
          card.append(makeField("Nombre", item.name, (value) => item.name = value));
          card.append(makeField("Rol", item.role, (value) => item.role = value, true));
          card.append(makeField("Correo", item.email, (value) => item.email = value));
        }

        root.append(card);
      });

      const add = create("button", "soft-button", `Agregar ${itemLabel.toLowerCase()}`);
      add.type = "button";
      add.addEventListener("click", () => {
        items.push(defaultItem(type));
        set(path, items);
        renderArrayEditors();
        renderPreview();
      });
      root.append(add);
    });
  }

  function makeField(name, value, onInput, multiline) {
    const field = label(name);
    field.append(textInput(value, onInput, multiline));
    return field;
  }

  function defaultItem(type) {
    const defaults = {
      text: "Nuevo elemento",
      textarea: "Nuevo texto",
      image: "",
      stat: { value: "Nuevo", label: "Indicador" },
      service: { title: "Nuevo servicio", description: "Descripcion del servicio.", items: ["Punto destacado"] },
      equipment: { brand: "Marca", model: "Modelo", name: "Nuevo equipo", use: "Uso principal", image: "", features: ["Caracteristica"] },
      project: { client: "Nuevo cliente", finalClient: "Cliente final", description: "Descripcion del proyecto.", image: "", url: "" },
      client: { name: "Nuevo cliente", image: "", url: "" },
      sector: { title: "Nuevo sector", description: "Descripcion del sector.", image: "", keywords: ["palabra clave"] },
      process: { title: "Nuevo paso", text: "Descripcion del paso." },
      person: { name: "Nombre del integrante", role: "Rol tecnico", email: "" }
    };
    return clone(defaults[type] || {});
  }

  function bindScalarFields() {
    document.querySelectorAll("[data-path]").forEach((field) => {
      field.addEventListener("input", () => {
        set(field.dataset.path, field.value);
        renderPreview();
      });
    });
    enhanceStandaloneImageFields();
  }

  function enhanceStandaloneImageFields() {
    document.querySelectorAll("[data-path]").forEach((input) => {
      const path = input.dataset.path.toLowerCase();
      if (!/(logo|image|imagen)/.test(path) || input.dataset.imageEnhanced) return;
      input.dataset.imageEnhanced = "true";
      const file = document.createElement("input");
      file.type = "file";
      file.accept = "image/*";
      file.hidden = true;
      const button = create("button", "soft-button file-pill", "Subir imagen");
      button.type = "button";
      button.addEventListener("click", () => file.click());
      file.addEventListener("change", () => {
        const selected = file.files?.[0];
        if (!selected) return;
        const reader = new FileReader();
        reader.onload = () => {
          input.value = reader.result;
          set(input.dataset.path, reader.result);
          renderPreview();
          toast("Imagen cargada en el editor.");
        };
        reader.readAsDataURL(selected);
      });
      input.after(button, file);
    });
  }

  function bindTabs() {
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-tab]").forEach((item) => item.classList.remove("active"));
        document.querySelectorAll("[data-section]").forEach((section) => section.classList.remove("active"));
        button.classList.add("active");
        document.querySelector(`[data-section="${button.dataset.tab}"]`)?.classList.add("active");
      });
    });
  }

  function renderPreview() {
    const root = document.querySelector("[data-mini-preview]");
    if (!root) return;
    root.innerHTML = "";
    const hero = create("div");
    hero.style.cssText = `
      min-height: 250px;
      padding: 24px;
      color: #fff;
      background: linear-gradient(90deg, rgba(17,24,32,.88), rgba(17,24,32,.52)), url("${content.hero?.image || ""}") center/cover;
    `;
    const logo = create("img");
    logo.src = content.brand?.logo || "";
    logo.alt = content.brand?.name || "AMEEI";
    logo.style.cssText = "width:120px;height:50px;object-fit:contain;background:#fff;border-radius:6px;padding:6px;margin-bottom:28px;";
    hero.append(logo);
    hero.append(create("p", "eyebrow", content.hero?.eyebrow || ""));
    const title = create("h2", "", content.hero?.title || "");
    title.style.cssText = "margin:0;font-size:2rem;line-height:1.05;";
    hero.append(title);
    const description = create("p", "", content.hero?.description || "");
    description.style.cssText = "color:rgba(255,255,255,.78);";
    hero.append(description);
    root.append(hero);

    const services = create("div");
    services.style.cssText = "padding:18px;display:grid;gap:10px;";
    services.append(create("strong", "", "Servicios visibles"));
    (content.services || []).slice(0, 4).forEach((service) => {
      const item = create("div");
      item.style.cssText = "padding:12px;border:1px solid #dfe5eb;border-radius:8px;";
      item.append(create("b", "", service.title || ""));
      item.append(create("p", "", service.description || ""));
      services.append(item);
    });
    root.append(services);
  }

  async function save() {
    if (!CMS_API) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      toast("Cambios guardados en este navegador.");
      return true;
    }
    try {
      const response = await fetch(CMS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "save", csrf, content })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo publicar.");
      csrf = result.csrf || csrf;
      toast("Cambios publicados en el sitio.");
      return true;
    } catch (error) {
      toast(error.message || "No se pudieron publicar los cambios.");
      return false;
    }
  }

  function exportContent() {
    const payload = "window.AMEEI_CONTENT = " + JSON.stringify(content, null, 2) + ";\n";
    const blob = new Blob([payload], { type: "text/javascript" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "content-data.js";
    link.click();
    URL.revokeObjectURL(link.href);
    toast("Archivo exportado.");
  }

  function importContent(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = String(reader.result || "").trim();
        const jsonText = raw.startsWith("window.AMEEI_CONTENT")
          ? raw.replace(/^window\.AMEEI_CONTENT\s*=\s*/, "").replace(/;\s*$/, "")
          : raw;
        content = JSON.parse(jsonText);
        fillScalarFields();
        renderArrayEditors();
        renderPreview();
        save();
        toast("Contenido importado correctamente.");
      } catch (error) {
        toast("No se pudo importar el archivo.");
      }
    };
    reader.readAsText(file);
  }

  function bindActions() {
    document.querySelector("[data-save]")?.addEventListener("click", save);
    document.querySelector("[data-export]")?.addEventListener("click", exportContent);
    document.querySelector("[data-preview-site]")?.addEventListener("click", async () => {
      await save();
      window.open("/", "_blank");
    });
    const importFile = document.querySelector("[data-import-file]");
    document.querySelector("[data-import-trigger]")?.addEventListener("click", () => importFile?.click());
    importFile?.addEventListener("change", () => {
      const file = importFile.files?.[0];
      if (file) importContent(file);
    });
    document.querySelector("[data-reset]")?.addEventListener("click", () => {
      const ok = window.confirm("Esto borrara los cambios guardados en este navegador y regresara al contenido base. Deseas continuar?");
      if (!ok) return;
      if (!CMS_API) localStorage.removeItem(STORAGE_KEY);
      content = clone(window.AMEEI_CONTENT || {});
      fillScalarFields();
      renderArrayEditors();
      renderPreview();
      toast("Contenido restaurado.");
    });
  }

  async function loadServerContent() {
    if (!CMS_API) return;
    try {
      const response = await fetch(`${CMS_API}?action=content`, { credentials: "same-origin", cache: "no-store" });
      const result = await response.json();
      if (response.ok && result.content) {
        content = result.content;
        csrf = result.csrf || csrf;
      }
    } catch (error) {
      toast("No se pudo cargar el contenido del servidor.");
    }
  }

  async function initialize() {
    await loadServerContent();
    fillScalarFields();
    bindScalarFields();
    renderArrayEditors();
    bindTabs();
    bindActions();
    renderPreview();
  }

  initialize();
})();




