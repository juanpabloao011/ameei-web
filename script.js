const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const quoteForm = document.querySelector("[data-quote-form]");

if (quoteForm) {
  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(quoteForm);
    const lines = [
      "Solicitud de cotización AMEEI",
      "",
      `Nombre: ${formData.get("nombre") || ""}`,
      `Empresa: ${formData.get("empresa") || ""}`,
      `Correo: ${formData.get("correo") || ""}`,
      `Teléfono: ${formData.get("telefono") || ""}`,
      `Tipo de instalación: ${formData.get("instalacion") || ""}`,
      `Ubicación: ${formData.get("ubicacion") || ""}`,
      "",
      "Descripción:",
      formData.get("mensaje") || ""
    ];
    const subject = encodeURIComponent("Cotización para proyecto eléctrico");
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:ameeiweb@gmail.com?subject=${subject}&body=${body}`;
  });
}
