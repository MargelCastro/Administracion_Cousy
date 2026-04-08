(function () {
  var state = window.RecetaProductoState;

  function formatNumber(value, decimals) {
    var totalDecimals = typeof decimals === "number" ? decimals : 3;
    var n = Number(value || 0);
    if (!isFinite(n)) return "0";

    return n.toLocaleString("es-NI", {
      minimumFractionDigits: 0,
      maximumFractionDigits: totalDecimals
    });
  }

  function isHiloMaterial(nombreMaterial) {
    return /hilo/i.test(String(nombreMaterial || ""));
  }

  function normalizeProductPrefix(name) {
    var normalized = (name || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, " ");
    var words = normalized.split(/\s+/).filter(Boolean);

    var prefix = "";
    words.forEach(function (word) {
      if (prefix.length < 4) prefix += word.charAt(0);
    });

    if (prefix.length < 4 && words.length > 0) {
      prefix = (words[0] + prefix).replace(/[^A-Z0-9]/g, "").slice(0, 4);
    }

    if (prefix.length < 4) {
      prefix = (prefix + "PROD").slice(0, 4);
    }

    return prefix;
  }

  function showStatus(message, isSuccess) {
    var status = document.getElementById("status");
    if (!status) return;

    status.textContent = message;
    status.className = "mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold " + (
      isSuccess
        ? "border-emerald-700 bg-emerald-100 text-emerald-950 receta-status-ok"
        : "border-red-700 bg-red-100 text-red-950 receta-status-error"
    );
    status.classList.remove("hidden");
  }

  function clearStatus() {
    var status = document.getElementById("status");
    if (!status) return;
    status.textContent = "";
    status.className = "mt-4 hidden rounded-2xl border px-4 py-3 text-sm font-semibold";
  }

  function renderCategorias(categorias) {
    var contenedor = document.getElementById("categoriasProducto");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    categorias.forEach(function (categoria) {
      var label = document.createElement("label");
      label.className = "categoria-chip flex min-w-0 w-full cursor-pointer items-center justify-start gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-200 transition sm:gap-3 sm:px-4 sm:text-sm";
      label.innerHTML = [
        '<input type="checkbox" name="categoriaProducto" value="' + categoria + '" class="categoria-chip-input h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-slate-500 bg-slate-900 text-slate-400 focus:ring-emerald-400 checked:border-emerald-500 checked:bg-emerald-500">',
        '<span class="truncate">' + categoria + "</span>"
      ].join("");
      var input = label.querySelector('input[name="categoriaProducto"]');
      if (input) {
        input.addEventListener("change", function () {
          syncCategoriaChipState(label, input);
        });
        syncCategoriaChipState(label, input);
      }
      contenedor.appendChild(label);
    });
  }

  function syncCategoriaChipState(label, input) {
    if (!label || !input) return;
    label.classList.toggle("is-selected", !!input.checked);
  }

  function updatePreviewId() {
    var nombreProducto = document.getElementById("nombreProducto");
    var target = document.getElementById("previewIdProducto");
    if (!nombreProducto || !target) return;

    var prefix = normalizeProductPrefix(nombreProducto.value);
    target.textContent = nombreProducto.value.trim() ? prefix + "-###" : "----";
  }

  function calculateCantidadReal(cantidad, desperdicio) {
    var base = Number(cantidad || 0);
    var waste = Number(desperdicio || 0);
    return Math.round((base * (1 + (waste / 100)) + Number.EPSILON) * 1000) / 1000;
  }

  function updateResumen() {
    var rows = document.querySelectorAll("[data-material-row]");
    var materialesActivos = 0;

    rows.forEach(function (row) {
      var cantidadInput = row.querySelector(".cant");
      var desperdicioInput = row.querySelector(".desp");
      var totalEl = row.querySelector(".cantidad-real");
      var isHilo = row.getAttribute("data-material-type") === "hilo";
      var cantidad = Number(cantidadInput ? cantidadInput.value : 0);
      var desperdicio = isHilo ? 0 : Number(desperdicioInput ? desperdicioInput.value : 0);
      var cantidadReal = isHilo ? cantidad : calculateCantidadReal(cantidad, desperdicio);

      if (totalEl) totalEl.textContent = formatNumber(cantidadReal);
      if (cantidad > 0) materialesActivos += 1;
    });

    var materialesEl = document.getElementById("resumenMateriales");
    if (materialesEl) materialesEl.textContent = formatNumber(materialesActivos, 0);
  }

  function renderMateriales(materiales) {
    state.setMateriales(materiales);

    var contenedor = document.getElementById("listaMateriales");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!materiales || materiales.length === 0) {
      contenedor.innerHTML = '<tr><td colspan="4" class="px-3 py-8 text-center text-slate-500 sm:px-4 sm:py-10 receta-table-message">No hay materias primas activas disponibles.</td></tr>';
      updateResumen();
      return;
    }

    materiales.forEach(function (mat) {
      var hiloMaterial = isHiloMaterial(mat.nombreMaterial);
      var tr = document.createElement("tr");
      tr.setAttribute("data-material-row", mat.idMaterial || "");
      tr.setAttribute("data-material-type", hiloMaterial ? "hilo" : "normal");
      tr.className = "align-middle receta-material-row";
      tr.innerHTML = hiloMaterial ? [
        '<td class="px-3 py-3 align-top sm:px-4 sm:py-4 receta-material-cell" data-label="Materia Prima">',
        '  <div class="break-words font-semibold leading-snug text-slate-200 receta-material-nombre">' + (mat.nombreMaterial || "") + "</div>",
        "</td>",
        '<td colspan="2" class="px-2 py-3 align-top sm:px-4 sm:py-4 receta-material-cell" data-label="Cantidad por unidad">',
        '  <input type="number" step="0.01" min="0" placeholder="Monto en C$" aria-label="Monto en cordobas" title="Monto en cordobas" class="cant w-full min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-center text-[11px] text-slate-200 outline-none focus:ring-2 focus:ring-emerald-400 sm:px-3 sm:text-sm receta-input" data-id="' + (mat.idMaterial || "") + '">',
        "</td>",
        '<td class="px-2 py-3 align-top sm:px-4 sm:py-4 receta-material-cell" data-label="Cantidad total">',
        '  <span class="cantidad-real block break-words text-[12px] font-bold text-emerald-400 sm:text-sm receta-cantidad-real">0</span>',
        "</td>"
      ].join("") : [
        '<td class="px-3 py-3 align-top sm:px-4 sm:py-4 receta-material-cell" data-label="Materia Prima">',
        '  <div class="break-words font-semibold leading-snug text-slate-200 receta-material-nombre">' + (mat.nombreMaterial || "") + "</div>",
        "</td>",
        '<td class="px-2 py-3 align-top sm:px-4 sm:py-4 receta-material-cell" data-label="Cantidad por unidad">',
        '  <input type="number" step="0.001" min="0" placeholder="0" class="cant w-full min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-right text-[11px] text-slate-200 outline-none focus:ring-2 focus:ring-emerald-400 sm:px-3 sm:text-sm receta-input" data-id="' + (mat.idMaterial || "") + '">',
        "</td>",
        '<td class="px-2 py-3 align-top sm:px-4 sm:py-4 receta-material-cell" data-label="% desperdicio">',
        '  <div class="flex min-w-0 items-center gap-1 sm:gap-2">',
        '    <input type="number" step="0.01" min="0" value="0" class="desp w-full min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-right text-[11px] text-slate-200 outline-none focus:ring-2 focus:ring-emerald-400 sm:px-3 sm:text-sm receta-input" data-id="' + (mat.idMaterial || "") + '">',
        '    <span class="shrink-0 text-[11px] text-slate-500 sm:text-sm receta-material-meta">%</span>',
        "  </div>",
        "</td>",
        '<td class="px-2 py-3 align-top sm:px-4 sm:py-4 receta-material-cell" data-label="Cantidad total">',
        '  <span class="cantidad-real block break-words text-[12px] font-bold text-emerald-400 sm:text-sm receta-cantidad-real">0</span>',
        "</td>"
      ].join("");
      contenedor.appendChild(tr);
    });

    document.querySelectorAll(".cant, .desp").forEach(function (input) {
      input.addEventListener("input", updateResumen);
    });

    updateResumen();
  }

  function showLoadingMateriales() {
    var contenedor = document.getElementById("listaMateriales");
    if (!contenedor) return;
    contenedor.innerHTML = '<tr><td colspan="4" class="px-3 py-8 text-center text-slate-500 sm:px-4 sm:py-10 receta-table-message">Cargando materiales...</td></tr>';
  }

  function getSelectedCategorias() {
    return Array.from(document.querySelectorAll('input[name="categoriaProducto"]:checked'))
      .map(function (input) {
        return input.value;
      });
  }

  function buildPayload() {
    var nombreProducto = document.getElementById("nombreProducto").value.trim();
    var categorias = getSelectedCategorias();
    var urlImagen = document.getElementById("urlImagen").value.trim();
    var materiales = [];

    document.querySelectorAll("[data-material-row]").forEach(function (row) {
      var cantidadInput = row.querySelector(".cant");
      var desperdicioInput = row.querySelector(".desp");
      var idMaterial = cantidadInput ? cantidadInput.getAttribute("data-id") : "";
      var isHilo = row.getAttribute("data-material-type") === "hilo";
      var cantidadPorUnidad = Number(cantidadInput ? cantidadInput.value : 0);
      var porcentajeDesperdicio = isHilo ? 0 : Number(desperdicioInput ? desperdicioInput.value : 0);

      if (!idMaterial || cantidadPorUnidad <= 0) return;

      materiales.push({
        idMaterial: idMaterial,
        cantidadPorUnidad: cantidadPorUnidad,
        porcentajeDesperdicio: porcentajeDesperdicio > 0 ? porcentajeDesperdicio : 0
      });
    });

    return {
      nombreProducto: nombreProducto,
      categorias: categorias,
      categoria: categorias.join(", "),
      urlImagen: urlImagen,
      materiales: materiales
    };
  }

  function resetForm() {
    var nombreProducto = document.getElementById("nombreProducto");
    var urlImagen = document.getElementById("urlImagen");

    if (nombreProducto) nombreProducto.value = "";
    if (urlImagen) urlImagen.value = "";

    document.querySelectorAll('input[name="categoriaProducto"]').forEach(function (input) {
      input.checked = false;
      syncCategoriaChipState(input.closest(".categoria-chip"), input);
    });
    document.querySelectorAll(".cant").forEach(function (input) {
      input.value = "";
    });
    document.querySelectorAll(".desp").forEach(function (input) {
      input.value = "0";
    });

    updatePreviewId();
    updateResumen();
  }

  function setGuardarEstado(isLoading) {
    var btn = document.getElementById("btnGuardarReceta");
    if (!btn) return;

    btn.disabled = !!isLoading;
    btn.textContent = isLoading ? "Guardando..." : "Guardar receta y producto";
  }

  window.RecetaProductoView = {
    renderCategorias: renderCategorias,
    syncCategoriaChipState: syncCategoriaChipState,
    updatePreviewId: updatePreviewId,
    showStatus: showStatus,
    clearStatus: clearStatus,
    updateResumen: updateResumen,
    renderMateriales: renderMateriales,
    showLoadingMateriales: showLoadingMateriales,
    buildPayload: buildPayload,
    resetForm: resetForm,
    setGuardarEstado: setGuardarEstado
  };
})();
