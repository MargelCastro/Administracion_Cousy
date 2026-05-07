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
      if (typeof window.CotizacionForm !== "undefined" && window.CotizacionForm && window.CotizacionForm.syncProductos) {
        window.CotizacionForm.syncProductos();
      }
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

  var DETALLE_STORAGE_KEY = "cousyCotizacionDetalleDraft";
  var PERSONALIZADO_STORAGE_KEY = "cousyCotizacionPersonalizadoDraft";

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

  function clamp(n, min, max) {
    var value = Number(n);
    if (!isFinite(value)) value = 0;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function normalizeDias(value) {
    var dias = toNumber(value);
    dias = clamp(dias, 0, 3650);
    return Math.round(dias * 2) / 2;
  }
//  esta area es del calculo del costo por dias, considerando precio de dia completo y medio dia, segun corresponda
  function calcCostoDias(dias, precioDia, precioMedioDia) {
    var d = normalizeDias(dias);
    var enteros = Math.floor(d);
    var fraccion = d - enteros;
    var medio = toNumber(precioMedioDia);
    if (medio <= 0) medio = round2(toNumber(precioDia) * 0.5);
    return round2(enteros * toNumber(precioDia) + (fraccion > 0 ? medio : 0));
  }

  function readDetalleState() {
    try {
      var raw = sessionStorage.getItem(DETALLE_STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeDetalleState(state) {
    try {
      sessionStorage.setItem(DETALLE_STORAGE_KEY, JSON.stringify(state || {}));
    } catch (_) {}
  }

  function readPersonalizadoState() {
    try {
      var raw = sessionStorage.getItem(PERSONALIZADO_STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writePersonalizadoState(state) {
    try {
      sessionStorage.setItem(PERSONALIZADO_STORAGE_KEY, JSON.stringify(state || {}));
    } catch (_) {}
  }

  function setPersonalizadoValue(proceso, field, value) {
    if (!proceso || !field) return;
    var state = readPersonalizadoState();
    if (!state[proceso]) state[proceso] = {};
    state[proceso][field] = value;
    writePersonalizadoState(state);
  }

  function getPersonalizadoValue(proceso, field) {
    var state = readPersonalizadoState();
    if (!state[proceso]) return "";
    var value = state[proceso][field];
    return value === undefined || value === null ? "" : value;
  }

  function ensureDetalleNodo(state, productoId, grupo, proceso) {
    if (!state[productoId]) state[productoId] = {};
    if (!state[productoId][grupo]) state[productoId][grupo] = {};
    if (!state[productoId][grupo][proceso]) state[productoId][grupo][proceso] = {};
    return state[productoId][grupo][proceso];
  }

  function setDetalleValue(productoId, grupo, proceso, field, value) {
    if (!productoId || !grupo || !proceso || !field) return;
    var state = readDetalleState();
    var nodo = ensureDetalleNodo(state, productoId, grupo, proceso);
    nodo[field] = value;
    writeDetalleState(state);
  }

  function getDetalleValue(productoId, grupo, proceso, field) {
    var state = readDetalleState();
    if (!state[productoId] || !state[productoId][grupo] || !state[productoId][grupo][proceso]) return "";
    var value = state[productoId][grupo][proceso][field];
    return value === undefined || value === null ? "" : value;
  }

  function cleanupDetalleState(productIds) {
    var ids = Array.isArray(productIds) ? productIds.map(String) : [];
    var state = readDetalleState();
    var changed = false;
    Object.keys(state).forEach(function (key) {
      if (ids.indexOf(String(key)) === -1) {
        delete state[key];
        changed = true;
      }
    });
    if (changed) writeDetalleState(state);
  }

  var tarifas = {
    corte: { precioDia: 900, precioMedioDia: 450, estado: "activo" },
    confeccion: { precioDia: 600, precioMedioDia: 300, estado: "activo" },
    corte_depilado_vinil: { precioDia: 500, precioMedioDia: 250, estado: "activo" },
    plancha_limpieza: { precioDia: 600, precioMedioDia: 300, estado: "activo" }
  };

  var recetasByProducto = {};

  function isTarifaActiva(tarifa) {
    if (!tarifa) return false;
    var estado = String(tarifa.estado || "").toLowerCase().trim();
    return estado === "activo" || estado === "true" || estado === "1";
  }

  function getTarifa(codigo) {
    var key = String(codigo || "").trim();
    var tarifa = tarifas[key];
    if (!tarifa || !isTarifaActiva(tarifa)) return { precioDia: 0, precioMedioDia: 0 };
    return tarifa;
  }

  function setFormStatus(message, tone) {
    var el = byId("cotizacionFormEstado");
    if (!el) return;
    if (!message) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.classList.remove("hidden");
    el.textContent = message;
    el.classList.remove("border-emerald-500/40", "text-emerald-200", "bg-emerald-500/10");
    el.classList.remove("border-amber-500/40", "text-amber-200", "bg-amber-500/10");
    el.classList.remove("border-red-500/40", "text-red-200", "bg-red-500/10");
    var kind = String(tone || "").toLowerCase();
    if (kind === "ok") {
      el.classList.add("border-emerald-500/40", "text-emerald-200", "bg-emerald-500/10");
    } else if (kind === "warn") {
      el.classList.add("border-amber-500/40", "text-amber-200", "bg-amber-500/10");
    } else {
      el.classList.add("border-red-500/40", "text-red-200", "bg-red-500/10");
    }
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

  function getProductosMap() {
    var productos = window.CotizacionDraft && window.CotizacionDraft.read ? (window.CotizacionDraft.read() || []) : [];
    var map = {};
    productos.forEach(function (producto) {
      var id = String(producto && producto.idProducto ? producto.idProducto : "");
      if (!id) return;
      map[id] = producto;
    });
    return map;
  }

  function getCurrentProductoIds() {
    var productos = window.CotizacionDraft && window.CotizacionDraft.read ? (window.CotizacionDraft.read() || []) : [];
    return productos.map(function (p) { return String(p && p.idProducto ? p.idProducto : ""); }).filter(Boolean);
  }

  function syncProduccionProductos() {
    var empty = byId("cotizacionProduccionEmpty");
    var wrap = byId("cotizacionProduccionProductos");
    var tpl = byId("cotizacionProduccionProductoTemplate");
    if (!wrap || !tpl) return;

    var productos = window.CotizacionDraft && window.CotizacionDraft.read ? (window.CotizacionDraft.read() || []) : [];
    cleanupDetalleState(productos.map(function (p) { return String(p && p.idProducto ? p.idProducto : ""); }).filter(Boolean));

    wrap.innerHTML = "";
    if (productos.length === 0) {
      wrap.classList.add("hidden");
      if (empty) empty.classList.remove("hidden");
      return;
    }

    wrap.classList.remove("hidden");
    if (empty) empty.classList.add("hidden");

    productos.forEach(function (producto, index) {
      var fragment = tpl.content.cloneNode(true);
      var section = fragment.querySelector("[data-cotizacion-produccion-producto]");
      if (!section) return;

      var productoId = String(producto && producto.idProducto ? producto.idProducto : "");
      section.setAttribute("data-producto-key", productoId);

      var nombreEl = fragment.querySelector("[data-producto-nombre]");
      var idEl = fragment.querySelector("[data-producto-id]");
      var cantidadEl = fragment.querySelector("[data-producto-cantidad]");
      var badgeEl = fragment.querySelector("[data-producto-badge]");

      if (nombreEl) nombreEl.textContent = producto && producto.nombreProducto ? String(producto.nombreProducto) : "Producto";
      if (idEl) idEl.textContent = productoId || "-";
      if (cantidadEl) cantidadEl.textContent = producto && producto.cantidadCotizar ? String(producto.cantidadCotizar) : "0";
      if (badgeEl) badgeEl.textContent = "Producto " + (index + 1);

      section.querySelectorAll("[data-grupo][data-proceso]").forEach(function (row) {
        var grupo = row.getAttribute("data-grupo");
        var proceso = row.getAttribute("data-proceso");
        var personasEl = row.querySelector("[data-field=\"personas\"]");
        var diasEl = row.querySelector("[data-field=\"dias\"]");
        if (personasEl) {
          var cached = getDetalleValue(productoId, grupo, proceso, "personas");
          if (cached !== "") personasEl.value = cached;
        }
        if (diasEl) {
          var cachedDias = getDetalleValue(productoId, grupo, proceso, "dias");
          if (cachedDias !== "") diasEl.value = cachedDias;
        }
      });

      wrap.appendChild(fragment);
    });
  }

  function syncTarifasEnDOM() {
    form.querySelectorAll("[data-tarifa]").forEach(function (row) {
      var codigo = row.getAttribute("data-tarifa");
      var tarifa = getTarifa(codigo);
      var precioEl = row.querySelector("[data-field=\"precioDia\"]");
      if (precioEl) precioEl.value = String(round2(toNumber(tarifa.precioDia)));
    });
  }

  function syncPersonalizadoGeneralFromDraft() {
    var wrap = byId("cotizacionPersonalizadoGeneral");
    if (!wrap) return;
    wrap.querySelectorAll("[data-personalizado-general-row][data-proceso]").forEach(function (row) {
      var proceso = row.getAttribute("data-proceso");
      if (!proceso) return;
      var personasEl = row.querySelector("[data-field=\"personas\"]");
      var diasEl = row.querySelector("[data-field=\"dias\"]");
      if (personasEl) {
        var cached = getPersonalizadoValue(proceso, "personas");
        if (cached !== "") personasEl.value = cached;
      }
      if (diasEl) {
        var cachedDias = getPersonalizadoValue(proceso, "dias");
        if (cachedDias !== "") diasEl.value = cachedDias;
      }
    });
  }

  function cargarTarifas() {
    if (!window.AppScriptClient || !window.AppScriptClient.jsonpRequest) {
      setFormStatus("No se encontró el cliente de Apps Script. Se usarán tarifas por defecto.", "warn");
      return Promise.resolve(null);
    }
    return window.AppScriptClient.jsonpRequest({ accion: "tarifasListar" })
      .then(function (data) {
        if (!data || data.success !== true) {
          setFormStatus((data && data.message ? data.message : "No se pudieron cargar las tarifas.") + " Se usarán tarifas por defecto.", "warn");
          return null;
        }
        var list = data.tarifas;
        if (!Array.isArray(list)) list = [];
        var map = {};
        list.forEach(function (row) {
          var codigo = row && row.codigo ? String(row.codigo).trim() : "";
          if (!codigo) return;
          map[codigo] = {
            precioDia: toNumber(row.precioDia),
            precioMedioDia: toNumber(row.precioMedioDia),
            estado: row.estado
          };
        });
        tarifas = Object.assign({}, tarifas, map);
        setFormStatus("Tarifas cargadas desde Google Sheets.", "ok");
        syncTarifasEnDOM();
        return true;
      })
      .catch(function () {
        setFormStatus("No se pudieron cargar las tarifas. Se usarán tarifas por defecto.", "warn");
        return null;
      });
  }

  function cargarRecetas(productoIds) {
    var ids = Array.isArray(productoIds) ? productoIds.map(String).filter(Boolean) : [];
    if (!ids.length) {
      recetasByProducto = {};
      return Promise.resolve(null);
    }

    if (!window.AppScriptClient || !window.AppScriptClient.jsonpRequest) {
      setFormStatus("No se encontró el cliente de Apps Script para cargar recetas. Se asumirá 0 en materias primas.", "warn");
      recetasByProducto = {};
      return Promise.resolve(null);
    }

    return window.AppScriptClient.jsonpRequest({ accion: "recetaProductoDetalle", productoIds: ids.join(",") }, { callbackPrefix: "cbRecetaCotizacion" })
      .then(function (data) {
        if (!data || data.success !== true) {
          setFormStatus((data && data.message ? data.message : "No se pudieron cargar las recetas.") + " Se asumirá 0 en materias primas.", "warn");
          recetasByProducto = {};
          return null;
        }

        var recetas = data.recetas;
        if (!Array.isArray(recetas)) recetas = [];

        var map = {};
        recetas.forEach(function (row) {
          var productoId = row && row.idProducto ? String(row.idProducto).trim() : "";
          if (!productoId) return;
          if (!map[productoId]) map[productoId] = [];
          map[productoId].push({
            idMaterial: row && row.idMaterial ? String(row.idMaterial).trim() : "",
            nombreMaterial: row && row.nombreMaterial ? String(row.nombreMaterial) : "",
            unidadBase: row && row.unidadBase ? String(row.unidadBase) : "",
            precio: toNumber(row && row.precio),
            cantidadTotal: toNumber(row && row.cantidadTotal)
          });
        });

        recetasByProducto = map;
        return true;
      })
      .catch(function () {
        setFormStatus("No se pudieron cargar las recetas. Se asumirá 0 en materias primas.", "warn");
        recetasByProducto = {};
        return null;
      });
  }

  function formatNumber(value, decimals) {
    var totalDecimals = typeof decimals === "number" ? decimals : 2;
    var n = Number(value || 0);
    if (!isFinite(n)) n = 0;
    return n.toLocaleString("es-NI", {
      minimumFractionDigits: 0,
      maximumFractionDigits: totalDecimals
    });
  }

  function renderMateriales(section, materiales, unidadesProducto) {
    var body = section ? section.querySelector("[data-materiales-body]") : null;
    if (!body) return 0;

    body.innerHTML = "";

    var unidades = Number(unidadesProducto || 0);
    if (!isFinite(unidades) || unidades < 0) unidades = 0;

    if (!materiales || !materiales.length) {
      var empty = document.createElement("tr");
      empty.innerHTML = '<td colspan="5" class="py-4 text-center text-slate-500">Sin receta de materias primas para este producto.</td>';
      body.appendChild(empty);
      return 0;
    }

    var total = 0;

    materiales.forEach(function (mat) {
      var cantidadLote = toNumber(mat.cantidadTotal) * unidades;
      if (!isFinite(cantidadLote)) cantidadLote = 0;
      var precio = toNumber(mat.precio);
      var subtotal = round2(precio * cantidadLote);
      total = round2(total + subtotal);

      var tr = document.createElement("tr");
      tr.className = "border-b border-slate-800/60";

      var nombre = document.createElement("td");
      nombre.className = "py-2 pr-3";
      nombre.textContent = mat.nombreMaterial || mat.idMaterial || "-";

      var unidad = document.createElement("td");
      unidad.className = "py-2 pr-3 text-slate-400";
      unidad.textContent = mat.unidadBase || "-";

      var cantidad = document.createElement("td");
      cantidad.className = "py-2 pr-3";
      cantidad.textContent = formatNumber(cantidadLote, 3);

      var precioTd = document.createElement("td");
      precioTd.className = "py-2 pr-3";
      precioTd.textContent = formatNumber(precio, 2);

      var subtotalTd = document.createElement("td");
      subtotalTd.className = "py-2 pr-3 font-semibold text-emerald-300";
      subtotalTd.textContent = formatNumber(subtotal, 2);

      tr.appendChild(nombre);
      tr.appendChild(unidad);
      tr.appendChild(cantidad);
      tr.appendChild(precioTd);
      tr.appendChild(subtotalTd);
      body.appendChild(tr);
    });

    return total;
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

    var personalizadoWrap = byId("cotizacionPersonalizadoGeneral");
    var personalizadoTotal = 0;
    if (personalizadoWrap) {
      personalizadoWrap.querySelectorAll("[data-personalizado-general-row][data-proceso]").forEach(function (row) {
        var proceso = row.getAttribute("data-proceso");
        var codigoTarifa = row.getAttribute("data-tarifa") || proceso;
        var tarifa = getTarifa(codigoTarifa);

        var personasEl = row.querySelector("[data-field=\"personas\"]");
        var diasEl = row.querySelector("[data-field=\"dias\"]");
        var totalEl = row.querySelector("[data-field=\"total\"]");
        var precioEl = row.querySelector("[data-field=\"precioDia\"]");
        if (precioEl) precioEl.value = String(round2(toNumber(tarifa.precioDia)));

        var personas = toNumber(personasEl && personasEl.value);
        var dias = normalizeDias(diasEl && diasEl.value);
        if (diasEl) diasEl.value = String(dias);

        var costoPorPersona = calcCostoDias(dias, tarifa.precioDia, tarifa.precioMedioDia);
        var subtotal = round2(personas * costoPorPersona);
        if (totalEl) totalEl.value = String(subtotal);
        personalizadoTotal = round2(personalizadoTotal + subtotal);
      });
    }
    setValue("personalizadoGeneralTotal", personalizadoTotal);

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

    var margenPct = toNumber(byId("negocioMargen") && byId("negocioMargen").value);
    margenPct = clamp(margenPct, 0, 95);
    setValue("negocioMargen", round2(margenPct));

    var margen = margenPct / 100;
    var divisor = 1 - margen;

    var unidades = sumProductoUnidades();
    var productosMap = getProductosMap();
    var wrap = byId("cotizacionProduccionProductos");

    var totalMo = 0;
    var totalPer = 0;
    var totalProduccion = 0;
    var totalMateriales = 0;
    var totalPrecio = 0;

    var secciones = [];
    if (wrap) {
      secciones = Array.prototype.slice.call(wrap.querySelectorAll("[data-cotizacion-produccion-producto]"));
    }
    var totalSecciones = secciones.length;

    if (secciones.length) {
      var seccionesData = [];
      secciones.forEach(function (section) {
        var productoId = section.getAttribute("data-producto-key") || "";
        var producto = productosMap[productoId];
        var unidadesProducto = producto && producto.cantidadCotizar !== undefined ? parseFloat(String(producto.cantidadCotizar).replace(",", ".")) : 0;
        if (!isFinite(unidadesProducto) || unidadesProducto < 0) unidadesProducto = 0;

        var moSubtotal = 0;

        section.querySelectorAll("[data-grupo][data-proceso]").forEach(function (row) {
          var grupo = row.getAttribute("data-grupo");
          if (grupo !== "mo") return;
          var codigoTarifa = row.getAttribute("data-tarifa") || row.getAttribute("data-proceso");
          var tarifa = getTarifa(codigoTarifa);

          var personasEl = row.querySelector("[data-field=\"personas\"]");
          var diasEl = row.querySelector("[data-field=\"dias\"]");
          var totalEl = row.querySelector("[data-field=\"total\"]");

          var personas = toNumber(personasEl && personasEl.value);
          var dias = normalizeDias(diasEl && diasEl.value);
          if (diasEl) diasEl.value = String(dias);

          var costoPorPersona = calcCostoDias(dias, tarifa.precioDia, tarifa.precioMedioDia);
          var subtotal = round2(personas * costoPorPersona);
          if (totalEl) totalEl.value = String(subtotal);

          if (grupo === "mo") moSubtotal = round2(moSubtotal + subtotal);
        });

        totalMo = round2(totalMo + moSubtotal);

        var materiales = recetasByProducto[productoId] || [];
        var materialesSubtotal = renderMateriales(section, materiales, unidadesProducto);
        totalMateriales = round2(totalMateriales + materialesSubtotal);

        var materialesTotalEl = section.querySelector("[data-field=\"materialesTotalProducto\"]");
        if (materialesTotalEl) materialesTotalEl.value = String(round2(materialesSubtotal));

        var baseCosto = round2(moSubtotal + materialesSubtotal);

        seccionesData.push({
          section: section,
          producto: producto,
          unidadesProducto: unidadesProducto,
          baseCosto: baseCosto
        });
      });

      var base = seccionesData.reduce(function (acc, item) { return acc + (Number(item.baseCosto) || 0); }, 0);
      var sharedTotal = round2(personalizadoTotal + gastos);

      seccionesData.forEach(function (item) {
        var section = item.section;
        var producto = item.producto;
        var unidadesProducto = item.unidadesProducto;
        var baseCosto = round2(item.baseCosto || 0);

        var share = base > 0
          ? round2(sharedTotal * (baseCosto / base))
          : (totalSecciones > 0 ? round2(sharedTotal / totalSecciones) : 0);

        var costoProducto = round2(baseCosto + share);
        var precioTotalProducto = divisor > 0 ? round2(costoProducto / divisor) : 0;
        var precioUnitario = unidadesProducto > 0 ? round2(precioTotalProducto / unidadesProducto) : 0;
        totalPrecio = round2(totalPrecio + precioTotalProducto);

        var costoEl = section.querySelector("[data-field=\"costoProducto\"]");
        if (costoEl) costoEl.value = String(costoProducto);

        var precioUnitEl = section.querySelector("[data-field=\"precioUnitarioProducto\"]");
        if (precioUnitEl) precioUnitEl.value = String(precioUnitario);

        var cantidadSpan = section.querySelector("[data-producto-cantidad]");
        if (cantidadSpan) cantidadSpan.textContent = producto && producto.cantidadCotizar ? String(producto.cantidadCotizar) : "0";
      });
    }

    totalPer = round2(personalizadoTotal);
    totalProduccion = round2(totalMo + totalMateriales + totalPer);

    setValue("produccionMoTotal", totalMo);
    setValue("produccionMaterialesTotal", totalMateriales);
    setValue("produccionPerTotal", totalPer);
    setValue("produccionTotal", totalProduccion);

    var costoTotal = round2(totalProduccion + gastos);
    setValue("negocioCostoTotal", costoTotal);

    var costoUnitario = unidades > 0 ? round2(costoTotal / unidades) : 0;
    setValue("negocioCostoUnitario", costoUnitario);

    var precioUnitarioPromedio = unidades > 0 ? round2(totalPrecio / unidades) : 0;
    setValue("negocioCostoDivMargen", precioUnitarioPromedio);
    setValue("negocioPrecioUnitario", precioUnitarioPromedio);
    setValue("negocioPrecioGeneral", round2(totalPrecio));

    var badge = document.getElementById("cotizacionCantidadProductosBadge");
    if (badge) badge.textContent = unidades + (unidades === 1 ? " unidad" : " unidades");
  }

  function handleDetalleDraftEvent(evt) {
    update();

    var target = evt && evt.target ? evt.target : null;
    if (!target || !target.getAttribute) return;
    var field = target.getAttribute("data-field");
    if (field !== "personas" && field !== "dias") return;

    var personalizadoRow = target.closest ? target.closest("[data-personalizado-general-row][data-proceso]") : null;
    if (personalizadoRow) {
      var procesoPer = personalizadoRow.getAttribute("data-proceso");
      if (!procesoPer) return;
      setPersonalizadoValue(procesoPer, field, target.value);
      return;
    }

    var row = target.closest ? target.closest("[data-grupo][data-proceso]") : null;
    var section = target.closest ? target.closest("[data-cotizacion-produccion-producto]") : null;
    if (!row || !section) return;

    var productoId = section.getAttribute("data-producto-key") || "";
    var grupo = row.getAttribute("data-grupo");
    var proceso = row.getAttribute("data-proceso");
    if (!productoId || !grupo || !proceso) return;

    setDetalleValue(productoId, grupo, proceso, field, target.value);
  }

  form.addEventListener("input", handleDetalleDraftEvent);
  form.addEventListener("change", handleDetalleDraftEvent);

  window.CotizacionForm = {
    update: update,
    syncProductos: function () {
      syncProduccionProductos();
      syncTarifasEnDOM();
      syncPersonalizadoGeneralFromDraft();
      var ids = getCurrentProductoIds();
      cargarRecetas(ids).then(function () {
        update();
      });
    }
  };

  syncProduccionProductos();
  syncPersonalizadoGeneralFromDraft();
  syncTarifasEnDOM();
  update();

  cargarRecetas(getCurrentProductoIds()).then(function () {
    update();
  });

  cargarTarifas().then(function () {
    syncTarifasEnDOM();
    update();
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
      { id: "cotizaciones", label: "Cotizaciones", href: "html/cotizaciones.html" },
      { id: "productos", label: "Productos", href: "html/Producto.html" },
      { id: "materia-prima", label: "Materia Prima Actual", href: "html/materiaprima.html" },
      { id: "clientes", label: "Clientes", href: "html/clientes.html" },
      { id: "receta_producto", label: "Receta de Producto", href: "html/receta_de_Producto.html" },
      { id: "prod_cotizacion", label: "Productos de Cotización", href: "html/productos_cotizacion.html" },
      { id: "mp_cotizacion", label: "Materia Prima de Cotización", href: "html/materiaprima_cotizacion.html" },
      { id: "control", label: "Control", href: "html/control.html" }
    ],
    mainContentHtml: mainContentHtml
  });

  if (!app) return;

  var nuevaCotizacionBtn = document.getElementById("nuevaCotizacionBtn");
  var agregarProductoBtn = document.getElementById("agregarProductoBtn");
  if (nuevaCotizacionBtn) {
    nuevaCotizacionBtn.addEventListener("click", function () {
      window.CotizacionDraft.clear();
      window.location.href = window.AppLayout.resolvePath("html/Producto.html");
    });
  }

  if (agregarProductoBtn) {
    agregarProductoBtn.addEventListener("click", function () {
      window.location.href = window.AppLayout.resolvePath("html/Producto.html");
    });
  }

  renderCotizacionDraft();
  initCotizacionForm();
});
