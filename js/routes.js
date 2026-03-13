const ROUTES = {
  materiaPrima: "/html/materiaprima.html",
  producto: "/html/Producto.html",
  recetaProducto: "/html/receta_de_Producto.html"
};

function goToMateriaPrima() {
  window.location.href = ROUTES.materiaPrima;
}

function goToProducto() {
  window.location.href = ROUTES.producto;
}

function goToRecetaProducto() {
  window.location.href = ROUTES.recetaProducto;
}
