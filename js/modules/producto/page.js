(function () {
  function init() {
    var template = document.getElementById("productoContentTemplate");
    var mainContentHtml = template ? template.innerHTML : "";

    var app = window.AppLayout.init({
      brandTitle: "ERP Cousy",
      brandSubtitle: "Catalogo",
      headerTitle: "Productos",
      activeNavId: "productos",
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
        { id: "crearCotizacionBtn", label: "Crear Cotización" }
      ],
      mainContentHtml: mainContentHtml,
      mainClass: "app-shell-main flex-1 p-4 md:p-8 space-y-4 md:space-y-6"
    });

    if (!app) return;

    window.ProductoState.setSelectedProductoIds(window.CotizacionDraft.getSelectedIds());
    window.ProductoHandlers.bindEvents();
    window.ProductoHandlers.cargarProductos().then(function () {
      window.ProductoView.updateCotizacionButtonState();
    });
  }

  window.ProductoPage = {
    init: init
  };
})();
