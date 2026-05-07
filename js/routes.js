const ROUTES = Object.freeze({
  cotizaciones: "html/cotizaciones.html",
  clientes: "html/clientes.html",
  productosCotizacion: "html/productos_cotizacion.html",
  materiaPrimaCotizacion: "html/materiaprima_cotizacion.html",
  materiaPrima: "html/materiaprima.html",
  producto: "html/Producto.html",
  recetaProducto: "html/receta_de_Producto.html"
});

function resolveRoute(path) {
  if (window.PathResolver && typeof window.PathResolver.resolve === "function") {
    return window.PathResolver.resolve(path);
  }
  return path || "#";
}

function navigateTo(path) {
  window.location.href = resolveRoute(path);
}

function navigateToRoute(routeKey) {
  if (!Object.prototype.hasOwnProperty.call(ROUTES, routeKey)) return;
  navigateTo(ROUTES[routeKey]);
}

function goToCotizaciones() {
  navigateToRoute("cotizaciones");
}

function goToClientes() {
  navigateToRoute("clientes");
}

function goToProductosCotizacion() {
  navigateToRoute("productosCotizacion");
}

function goToMateriaPrimaCotizacion() {
  navigateToRoute("materiaPrimaCotizacion");
}

function goToMateriaPrima() {
  navigateToRoute("materiaPrima");
}

function goToProducto() {
  navigateToRoute("producto");
}

function goToRecetaProducto() {
  navigateToRoute("recetaProducto");
}

window.AppRoutes = {
  ROUTES: ROUTES,
  resolve: resolveRoute,
  navigateTo: navigateTo,
  navigateToRoute: navigateToRoute,
  goToCotizaciones: goToCotizaciones,
  goToClientes: goToClientes,
  goToProductosCotizacion: goToProductosCotizacion,
  goToMateriaPrimaCotizacion: goToMateriaPrimaCotizacion,
  goToMateriaPrima: goToMateriaPrima,
  goToProducto: goToProducto,
  goToRecetaProducto: goToRecetaProducto
};
