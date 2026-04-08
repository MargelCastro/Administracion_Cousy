(function () {
  function init() {
    var template = document.getElementById("materiaPrimaContentTemplate");
    var mainContentHtml = template ? template.innerHTML : "";

    var app = window.AppLayout.init({
      brandTitle: "ERP Cousy",
      brandSubtitle: "Inventario",
      headerTitle: "Materia P. Actual",
      activeNavId: "materia-prima",
      navItems: [
        { id: "cotizaciones", label: "Cotizaciones", href: "/html/cotizaciones.html" },
        { id: "productos", label: "Productos", href: "/html/Producto.html" },
        { id: "materia-prima", label: "Materia Prima Actual", href: "/html/materiaprima.html" },
        { id: "clientes", label: "Clientes", href: "/html/clientes.html" },
        { id: "receta_producto", label: "Receta de Producto", href: "/html/receta_de_Producto.html" },
        { id: "prod_cotizacion", label: "Productos de Cotización", href: "/html/productos_cotizacion.html" },
        { id: "mp_cotizacion", label: "Materia Prima de Cotización", href: "/html/materiaprima_cotizacion.html" }
      ],
      actions: [
        { id: "btnVerTabla", label: "Ver tabla materia prima" }
      ],
      mainContentHtml: mainContentHtml,
      mainClass: "app-shell-main flex-1 p-4 md:p-8 space-y-4 md:space-y-6"
    });

    if (!app) return;

    window.MateriaPrimaHandlers.bindEvents();
    window.MateriaPrimaView.updateProjectedSummary();
  }

  window.MateriaPrimaPage = {
    init: init
  };
})();
