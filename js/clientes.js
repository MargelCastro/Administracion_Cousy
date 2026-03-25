document.addEventListener("DOMContentLoaded", () => {
  const template = document.getElementById("clientesContentTemplate");
  const mainContentHtml = template ? template.innerHTML : "";

  window.AppLayout.init({
    brandTitle: "ERP Cousy",
    brandSubtitle: "Dashboard",
    headerTitle: "Clientes",
    activeNavId: "clientes",
    navItems: [
      { id: "cotizaciones", label: "Cotizaciones", href: "/html/cotizaciones.html" },
      { id: "productos", label: "Productos", href: "/html/Producto.html" },
      { id: "materia-prima", label: "Materia Prima Actual", href: "/html/materiaprima.html" },
      { id: "clientes", label: "Clientes", href: "/html/clientes.html" },
      { id: "receta_producto", label: "Receta de Producto", href: "/html/receta_de_Producto.html" },
      { id: "prod_cotizacion", label: "Productos de Cotización", href: "/html/productos_cotizacion.html" },
      { id: "mp_cotizacion", label: "Materia Prima de Cotización", href: "/html/materiaprima_cotizacion.html" }
    ],
    mainContentHtml: mainContentHtml
  });
});
