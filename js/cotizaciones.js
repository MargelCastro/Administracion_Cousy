function renderCotizacionDraft() {
  var productos = window.CotizacionDraft.read();
  var emptyState = document.getElementById("cotizacionVacia");
  var listWrap = document.getElementById("cotizacionListaWrap");
  var list = document.getElementById("cotizacionProductosList");
  var badge = document.getElementById("cotizacionCountBadge");
  var cantidadBadge = document.getElementById("cotizacionCantidadProductosBadge");

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
      if (typeof window.CotizacionForm !== "undefined" && window.CotizacionForm && window.CotizacionForm.update) {
        window.CotizacionForm.update();
      }
    });
  });

  list.querySelectorAll("[data-cotizacion-remove]").forEach(function (button) {
    button.addEventListener("click", function () {
      window.CotizacionDraft.removeProducto(button.getAttribute("data-cotizacion-remove"));
      renderCotizacionDraft();
      if (typeof window.CotizacionForm !== "undefined" && window.CotizacionForm && window.CotizacionForm.update) {
        window.CotizacionForm.update();
      }
    });
  });

  if (cantidadBadge) {
    var totalUnidades = productos.reduce(function (acc, producto) {
      var raw = producto && producto.cantidadCotizar !== undefined ? String(producto.cantidadCotizar) : "";
      var value = parseFloat(raw.replace(",", "."));
      return acc + (isFinite(value) && value > 0 ? value : 0);
    }, 0);
    cantidadBadge.textContent = totalUnidades + (totalUnidades === 1 ? " unidad" : " unidades");
  }
}

function initCotizacionForm() {
  var form = document.getElementById("cotizacionForm");
  if (!form) return;

  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    if (value === null || value === undefined) return 0;
    var raw = String(value).trim();
    if (!raw) return 0;
    raw = raw.replace(/[^0-9,.\-]/g, "").replace(",", ".");
    var parsed = parseFloat(raw);
    return isFinite(parsed) ? parsed : 0;
  }

  function setValue(id, value) {
    var el = byId(id);
    if (!el) return;
    el.value = String(value);
  }

  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function calcLaborTotal(prefix, totalId) {
    var personas = toNumber(byId(prefix + "Personas") && byId(prefix + "Personas").value);
    var precioDia = toNumber(byId(prefix + "PrecioDia") && byId(prefix + "PrecioDia").value);
    var dias = toNumber(byId(prefix + "Dias") && byId(prefix + "Dias").value);
    var total = round2(personas * precioDia * dias);
    setValue(totalId, total);
    return total;
  }

  function sumProductoUnidades() {
    if (!window.CotizacionDraft || !window.CotizacionDraft.read) return 0;
    var productos = window.CotizacionDraft.read() || [];
    return productos.reduce(function (acc, producto) {
      var raw = producto && producto.cantidadCotizar !== undefined ? String(producto.cantidadCotizar) : "";
      var value = parseFloat(raw.replace(",", "."));
      return acc + (isFinite(value) && value > 0 ? value : 0);
    }, 0);
  }

  function updateCotizacionId() {
    var el = byId("cotizacionId");
    if (!el) return;

    var clienteEl = byId("cotizacionCliente");
    var cliente = clienteEl ? String(clienteEl.value || "").trim() : "";

    var letters = cliente
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase();

    var prefix = (letters + "XXX").slice(0, 3);

    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var stamp = String(now.getFullYear()) + pad(now.getMonth() + 1) + pad(now.getDate());

    el.value = "COT" + prefix + stamp;
  }

  function update() {
    updateCotizacionId();

    var moCorte = calcLaborTotal("moCorte", "moCorteTotal");
    var moConf = calcLaborTotal("moConf", "moConfTotal");
    var moTotal = round2(moCorte + moConf);
    setValue("moTotal", moTotal);

    var perVinil = calcLaborTotal("perVinil", "perVinilTotal");
    var perPlancha = calcLaborTotal("perPlancha", "perPlanchaTotal");
    var perTotal = round2(perVinil + perPlancha);
    setValue("perTotal", perTotal);

    var gastos = [
      "gastoComision",
      "gastoDelivery",
      "gastoEmpaque",
      "gastoSerigrafia",
      "gastoOtro1",
      "gastoOtro2",
      "gastoOtro3"
    ].reduce(function (acc, id) {
      var el = byId(id);
      return acc + toNumber(el && el.value);
    }, 0);
    gastos = round2(gastos);
    setValue("gastosTotal", gastos);

    var costoTotal = round2(moTotal + perTotal + gastos);
    setValue("negocioCostoTotal", costoTotal);

    var unidades = sumProductoUnidades();
    var costoUnitario = unidades > 0 ? round2(costoTotal / unidades) : 0;
    setValue("negocioCostoUnitario", costoUnitario);

    var margenPct = toNumber(byId("negocioMargen") && byId("negocioMargen").value);
    if (margenPct < 0) margenPct = 0;
    if (margenPct > 95) margenPct = 95;
    setValue("negocioMargen", round2(margenPct));

    var margen = margenPct / 100;
    var divisor = 1 - margen;
    var precioUnitario = divisor > 0 ? round2(costoUnitario / divisor) : 0;
    setValue("negocioCostoDivMargen", precioUnitario);
    setValue("negocioPrecioUnitario", precioUnitario);
    setValue("negocioPrecioGeneral", round2(precioUnitario * unidades));

    var badge = document.getElementById("cotizacionCantidadProductosBadge");
    if (badge) badge.textContent = unidades + (unidades === 1 ? " unidad" : " unidades");
  }

  form.querySelectorAll("input, textarea, select").forEach(function (el) {
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  });

  window.CotizacionForm = { update: update };
  update();
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
  initCotizacionForm();
});
