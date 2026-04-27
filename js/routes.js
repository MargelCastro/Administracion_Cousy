const ROUTES = {
  cotizaciones: "html/cotizaciones.html",
  clientes: "html/clientes.html",
  productosCotizacion: "html/productos_cotizacion.html",
  materiaPrimaCotizacion: "html/materiaprima_cotizacion.html",
  materiaPrima: "html/materiaprima.html",
  producto: "html/Producto.html",
  recetaProducto: "html/receta_de_Producto.html"
};

function resolveRoute(path) {
  if (window.AppLayout && typeof window.AppLayout.resolvePath === "function") {
    return window.AppLayout.resolvePath(path);
  }
  var currentPath = window.location.pathname.replace(/\\/g, "/");
  var prefix = currentPath.includes("/html/") ? "../" : "./";
  var normalizedPath = String(path || "").replace(/^\.\//, "").replace(/^\//, "");
  return prefix + normalizedPath;
}

function goToCotizaciones() {
  window.location.href = resolveRoute(ROUTES.cotizaciones);
}

function goToClientes() {
  window.location.href = resolveRoute(ROUTES.clientes);
}

function goToProductosCotizacion() {
  window.location.href = resolveRoute(ROUTES.productosCotizacion);
}

function goToMateriaPrimaCotizacion() {
  window.location.href = resolveRoute(ROUTES.materiaPrimaCotizacion);
}

function goToMateriaPrima() {
  window.location.href = resolveRoute(ROUTES.materiaPrima);
}

function goToProducto() {
  window.location.href = resolveRoute(ROUTES.producto);
}

function goToRecetaProducto() {
  window.location.href = resolveRoute(ROUTES.recetaProducto);
}
