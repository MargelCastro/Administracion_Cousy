(function () {
  var CATEGORIAS_PRODUCTO = [
    "Mochilas",
    "Bolsas",
    "Tote Bags",
    "Empresariales",
    "Infantiles",
    "Hombres",
    "Mujeres",
    "Celebraciones",
    "Regalias"
  ];

  function init() {
    var template = document.getElementById("recetaProductoContentTemplate");
    var mainContentHtml = template ? template.innerHTML : "";

    var app = window.AppLayout.init({
      brandTitle: "ERP Cousy",
      brandSubtitle: "Produccion",
      headerTitle: "Receta Productos",
      activeNavId: "receta_producto",
      navItems: [
        { id: "cotizaciones", label: "Cotizaciones", href: "/html/cotizaciones.html" },
        { id: "productos", label: "Productos", href: "/html/Producto.html" },
        { id: "materia-prima", label: "Materia Prima Actual", href: "/html/materiaprima.html" },
        { id: "clientes", label: "Clientes", href: "/html/clientes.html" },
        { id: "receta_producto", label: "Receta de Producto", href: "/html/receta_de_Producto.html" },
        { id: "prod_cotizacion", label: "Productos de Cotización", href: "/html/productos_cotizacion.html" },
        { id: "mp_cotizacion", label: "Materia Prima de Cotización", href: "/html/materiaprima_cotizacion.html" }
      ],
      mainContentHtml: mainContentHtml,
      mainClass: "app-shell-main flex-1 p-4 md:p-8 space-y-4 md:space-y-6"
    });

    if (!app) return;

    window.RecetaProductoView.renderCategorias(CATEGORIAS_PRODUCTO);
    window.RecetaProductoHandlers.bindEvents();
    window.RecetaProductoView.updatePreviewId();
    window.RecetaProductoHandlers.cargarMaterialesReceta();
  }

  window.RecetaProductoPage = {
    init: init
  };
})();
