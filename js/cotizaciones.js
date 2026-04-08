function renderCotizacionDraft() {
  var productos = window.CotizacionDraft.read();
  var emptyState = document.getElementById("cotizacionVacia");
  var listWrap = document.getElementById("cotizacionListaWrap");
  var list = document.getElementById("cotizacionProductosList");
  var badge = document.getElementById("cotizacionCountBadge");

  if (!emptyState || !listWrap || !list || !badge) return;

  badge.textContent = productos.length + (productos.length === 1 ? " producto" : " productos");
  list.innerHTML = "";

  if (productos.length === 0) {
    emptyState.classList.remove("hidden");
    listWrap.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  listWrap.classList.remove("hidden");

  productos.forEach(function (producto) {
    var item = document.createElement("li");
    var categorias = Array.isArray(producto.categorias) && producto.categorias.length
      ? producto.categorias.join(", ")
      : (producto.categoria || "Sin categoria");

    item.className = "cotizacion-banner";
    item.innerHTML = [
      '<div class="cotizacion-banner-grid">',
      '  <div class="cotizacion-cell cotizacion-cell-producto" data-label="Nombre">',
      '    <div class="cotizacion-product-name">' + (producto.nombreProducto || "Producto sin nombre") + '</div>',
      '  </div>',
      '  <div class="cotizacion-cell cotizacion-cell-thumb" data-label="Imagen">',
      producto.imagen
        ? '    <img src="' + producto.imagen + '" alt="' + (producto.nombreProducto || "Producto") + '" class="cotizacion-product-thumb">'
        : '    <div class="cotizacion-product-thumb cotizacion-thumb-empty">Sin imagen</div>',
      '  </div>',
      '  <div class="cotizacion-cell cotizacion-cell-mobile-hidden" data-label="Código de producto">',
      '    <div class="cotizacion-value cotizacion-value-id">' + (producto.idProducto || "-") + '</div>',
      '  </div>',
      '  <div class="cotizacion-cell cotizacion-cell-mobile-hidden" data-label="Categoría">',
      '    <div class="cotizacion-value cotizacion-value-categorias">' + categorias + '</div>',
      '  </div>',
      '  <div class="cotizacion-cell cotizacion-cell-mobile-hidden" data-label="Materiales que usa">',
      '    <div class="cotizacion-value">' + (producto.totalMateriales || 0) + '</div>',
      '  </div>',
      '  <div class="cotizacion-cell cotizacion-cell-input" data-label="Cantidad a cotizar">',
      '    <input id="cantidadCotizar_' + (producto.idProducto || "") + '" data-cotizacion-cantidad="' + (producto.idProducto || "") + '" type="text" value="' + (producto.cantidadCotizar || "") + '" placeholder="Ej: 25" class="cotizacion-input-field">',
      '  </div>',
      '  <button type="button" data-cotizacion-remove="' + (producto.idProducto || "") + '" class="cotizacion-close-btn" aria-label="Quitar producto" title="Quitar producto">×</button>',
      '</div>',
    ].join("");
    list.appendChild(item);
  });

  list.querySelectorAll("[data-cotizacion-cantidad]").forEach(function (input) {
    input.addEventListener("input", function () {
      window.CotizacionDraft.updateCantidad(
        input.getAttribute("data-cotizacion-cantidad"),
        input.value
      );
    });
  });

  list.querySelectorAll("[data-cotizacion-remove]").forEach(function (button) {
    button.addEventListener("click", function () {
      window.CotizacionDraft.removeProducto(button.getAttribute("data-cotizacion-remove"));
      renderCotizacionDraft();
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  var template = document.getElementById("cotizacionesContentTemplate");
  var mainContentHtml = template ? template.innerHTML : "";

  var app = window.AppLayout.init({
    brandTitle: "ERP Cousy",
    brandSubtitle: "Dashboard",
    headerTitle: "Cotizaciones",
    activeNavId: "cotizaciones",
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

  if (!app) return;

  var nuevaCotizacionBtn = document.getElementById("nuevaCotizacionBtn");
  var agregarProductoBtn = document.getElementById("agregarProductoBtn");
  if (nuevaCotizacionBtn) {
    nuevaCotizacionBtn.addEventListener("click", function () {
      window.CotizacionDraft.clear();
      window.location.href = "/html/Producto.html";
    });
  }

  if (agregarProductoBtn) {
    agregarProductoBtn.addEventListener("click", function () {
      window.location.href = "/html/Producto.html";
    });
  }

  renderCotizacionDraft();
});
