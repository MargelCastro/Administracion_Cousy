const ROUTES = {
  cotizaciones: "/html/cotizaciones.html",
  clientes: "/html/clientes.html",
  productosCotizacion: "/html/productos_cotizacion.html",
  materiaPrimaCotizacion: "/html/materiaprima_cotizacion.html",
  materiaPrima: "/html/materiaprima.html",
  producto: "/html/Producto.html",
  recetaProducto: "/html/receta_de_Producto.html"
};

function goToCotizaciones() {
  window.location.href = ROUTES.cotizaciones;
}

function goToClientes() {
  window.location.href = ROUTES.clientes;
}

function goToProductosCotizacion() {
  window.location.href = ROUTES.productosCotizacion;
}

function goToMateriaPrimaCotizacion() {
  window.location.href = ROUTES.materiaPrimaCotizacion;
}

function goToMateriaPrima() {
  window.location.href = ROUTES.materiaPrima;
}

function goToProducto() {
  window.location.href = ROUTES.producto;
}

function goToRecetaProducto() {
  window.location.href = ROUTES.recetaProducto;
}
