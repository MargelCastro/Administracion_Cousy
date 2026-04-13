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

  function isSafeUrl(url) {
    if (!url) return false;
    var value = String(url).trim();
    return value.startsWith("https://") || value.startsWith("http://");
  }

  function safeId(value) {
    return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
  }

  function createCell(label, className) {
    var cell = document.createElement("div");
    cell.className = className;
    cell.setAttribute("data-label", label);
    return cell;
  }

  productos.forEach(function (producto) {
    var item = document.createElement("li");
    var categorias = Array.isArray(producto.categorias) && producto.categorias.length
      ? producto.categorias.join(", ")
      : (producto.categoria || "Sin categoria");

    item.className = "cotizacion-banner";

    var grid = document.createElement("div");
    grid.className = "cotizacion-banner-grid";

    var cellNombre = createCell("Nombre", "cotizacion-cell cotizacion-cell-producto");
    var nameWrap = document.createElement("div");
    nameWrap.className = "cotizacion-product-name";
    nameWrap.textContent = producto.nombreProducto || "Producto sin nombre";
    cellNombre.appendChild(nameWrap);
    grid.appendChild(cellNombre);

    var cellImagen = createCell("Imagen", "cotizacion-cell cotizacion-cell-thumb");
    if (producto.imagen && isSafeUrl(producto.imagen)) {
      var img = document.createElement("img");
      img.className = "cotizacion-product-thumb";
      img.alt = producto.nombreProducto || "Producto";
      img.src = String(producto.imagen);
      cellImagen.appendChild(img);
    } else {
      var noImg = document.createElement("div");
      noImg.className = "cotizacion-product-thumb cotizacion-thumb-empty";
      noImg.textContent = "Sin imagen";
      cellImagen.appendChild(noImg);
    }
    grid.appendChild(cellImagen);

    var cellCodigo = createCell("Código de producto", "cotizacion-cell cotizacion-cell-mobile-hidden");
    var codeWrap = document.createElement("div");
    codeWrap.className = "cotizacion-value cotizacion-value-id";
    codeWrap.textContent = producto.idProducto || "-";
    cellCodigo.appendChild(codeWrap);
    grid.appendChild(cellCodigo);

    var cellCategoria = createCell("Categoría", "cotizacion-cell cotizacion-cell-mobile-hidden");
    var catWrap = document.createElement("div");
    catWrap.className = "cotizacion-value cotizacion-value-categorias";
    catWrap.textContent = categorias;
    cellCategoria.appendChild(catWrap);
    grid.appendChild(cellCategoria);

    var cellMateriales = createCell("Materiales que usa", "cotizacion-cell cotizacion-cell-mobile-hidden");
    var matWrap = document.createElement("div");
    matWrap.className = "cotizacion-value";
    matWrap.textContent = String(producto.totalMateriales || 0);
    cellMateriales.appendChild(matWrap);
    grid.appendChild(cellMateriales);

    var cellCantidad = createCell("Cantidad a cotizar", "cotizacion-cell cotizacion-cell-input");
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Ej: 25";
    input.className = "cotizacion-input-field";
    input.value = producto.cantidadCotizar || "";
    var productoId = String(producto.idProducto || "");
    input.id = "cantidadCotizar_" + safeId(productoId);
    input.setAttribute("data-cotizacion-cantidad", productoId);
    cellCantidad.appendChild(input);
    grid.appendChild(cellCantidad);

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cotizacion-close-btn";
    removeBtn.setAttribute("data-cotizacion-remove", productoId);
    removeBtn.setAttribute("aria-label", "Quitar producto");
    removeBtn.setAttribute("title", "Quitar producto");
    removeBtn.textContent = "×";
    grid.appendChild(removeBtn);

    item.appendChild(grid);
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
