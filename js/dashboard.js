document.addEventListener("DOMContentLoaded", () => {
  const template = document.getElementById("dashboardContentTemplate");
  const mainContentHtml = template ? template.innerHTML : "";

  const app = window.AppLayout.init({
    brandTitle: "ERP Cousy",
    brandSubtitle: "Dashboard",
    headerTitle: "LA FE",
    headerSubtitle: "Inicia donde estas, solo da el siguiente paso...❤️",
    activeNavId: "cotizaciones",
    navItems: [
      { id: "cotizaciones", label: "Cotizaciones", tabId: "cotizaciones" },
      { id: "productos", label: "Productos", href: "html/Producto.html" },
      { id: "materia-prima", label: "Materia Prima Actual", href: "html/materiaprima.html" },
      { id: "clientes", label: "Clientes", tabId: "clientes" },
      { id: "receta_producto", label: "Receta de Producto", href: "html/receta_de_Producto.html" },
      { id: "prod_cotizacion", label: "Productos de Cotización", tabId: "prod_cotizacion" },
      { id: "mp_cotizacion", label: "Materia Prima de Cotización", tabId: "mp_cotizacion" }
    ],
    mainContentHtml: mainContentHtml
  });

  if (!app) return;

  function openTab(tabId) {
    const tabs = document.querySelectorAll(".tab-content");
    const target = document.getElementById(tabId);

    tabs.forEach((tab) => tab.classList.add("hidden"));

    if (!target) {
      const fallback = document.getElementById("cotizaciones");
      if (fallback) {
        fallback.classList.remove("hidden");
        app.setActiveNav("cotizaciones");
        window.location.hash = "cotizaciones";
      }
      return;
    }

    target.classList.remove("hidden");
    app.setActiveNav(tabId);
    window.location.hash = tabId;
  }

  document.addEventListener("app-layout:navigate", (event) => {
    openTab(event.detail.tabId);
  });

  const initialTab = window.location.hash ? window.location.hash.slice(1) : "cotizaciones";
  openTab(initialTab);
});
