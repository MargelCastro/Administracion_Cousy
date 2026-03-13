const RECETA_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.SCRIPT_URL
  ? window.APP_CONFIG.SCRIPT_URL
  : "";

const CATEGORIAS_PRODUCTO = [
  "Mochilas",
  "Bolsas",
  "Tote Bags",
  "Empresariales",
  "Infantiles",
  "Hombres",
  "Mujeres",
  "Celebraciones",
  "Regalias"
];

const recetaState = {
  materiales: []
};

function recetaJsonpRequest(params, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (!RECETA_SCRIPT_URL) {
      reject(new Error("No hay URL de API configurada."));
      return;
    }

    const callbackName = "cbRecetaProducto_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    const scriptTag = document.createElement("script");
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (scriptTag.parentNode) scriptTag.parentNode.removeChild(scriptTag);
      try {
        delete window[callbackName];
      } catch (_) {
        window[callbackName] = undefined;
      }
    };

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout de conexión con Apps Script."));
    }, timeoutMs);

    const query = new URLSearchParams({ ...params, callback: callbackName });
    scriptTag.src = `${RECETA_SCRIPT_URL}?${query.toString()}`;
    scriptTag.async = true;
    scriptTag.onerror = () => {
      cleanup();
      reject(new Error("No se pudo cargar la API remota."));
    };

    document.body.appendChild(scriptTag);
  });
}

function recetaFormatNumber(value, decimals = 3) {
  const n = Number(value || 0);
  if (!isFinite(n)) return "0";
  return n.toLocaleString("es-NI", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

function normalizeProductPrefix(name) {
  const normalized = (name || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ");
  const words = normalized.split(/\s+/).filter(Boolean);

  let prefix = "";
  words.forEach((word) => {
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

function getSelectedCategorias() {
  return Array.from(document.querySelectorAll('input[name="categoriaProducto"]:checked'))
    .map((input) => input.value);
}

function renderCategorias() {
  const contenedor = document.getElementById("categoriasProducto");
  if (!contenedor) return;

  contenedor.innerHTML = "";
  CATEGORIAS_PRODUCTO.forEach((categoria) => {
    const label = document.createElement("label");
    label.className = "categoria-chip flex min-w-0 w-full cursor-pointer items-center justify-start gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-200 transition sm:gap-3 sm:px-4 sm:text-sm";
    label.innerHTML = `
      <input type="checkbox" name="categoriaProducto" value="${categoria}" class="categoria-chip-input h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-slate-500 bg-slate-900 text-slate-400 focus:ring-emerald-400 checked:border-emerald-500 checked:bg-emerald-500">
      <span class="truncate">${categoria}</span>
    `;
    contenedor.appendChild(label);
  });
}

function updatePreviewId() {
  const nombreProducto = document.getElementById("nombreProducto");
  const target = document.getElementById("previewIdProducto");
  if (!nombreProducto || !target) return;

  const prefix = normalizeProductPrefix(nombreProducto.value);
  target.textContent = nombreProducto.value.trim() ? `${prefix}-###` : "----";
}

function showRecetaStatus(message, isSuccess) {
  const status = document.getElementById("status");
  if (!status) return;

  status.textContent = message;
  status.className = `mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
    isSuccess
      ? "border-emerald-700 bg-emerald-100 text-emerald-950 receta-status-ok"
      : "border-red-700 bg-red-100 text-red-950 receta-status-error"
  }`;
  status.classList.remove("hidden");
}

function clearRecetaStatus() {
  const status = document.getElementById("status");
  if (!status) return;
  status.textContent = "";
  status.className = "mt-4 hidden rounded-2xl border px-4 py-3 text-sm font-semibold";
}

function calculateCantidadReal(cantidad, desperdicio) {
  const base = Number(cantidad || 0);
  const waste = Number(desperdicio || 0);
  return Math.round((base * (1 + (waste / 100)) + Number.EPSILON) * 1000) / 1000;
}

function updateResumen() {
  const rows = document.querySelectorAll("[data-material-row]");
  let materialesActivos = 0;
  let cantidadRealTotal = 0;

  rows.forEach((row) => {
    const cantidadInput = row.querySelector(".cant");
    const desperdicioInput = row.querySelector(".desp");
    const totalEl = row.querySelector(".cantidad-real");
    const cantidad = Number(cantidadInput ? cantidadInput.value : 0);
    const desperdicio = Number(desperdicioInput ? desperdicioInput.value : 0);
    const cantidadReal = calculateCantidadReal(cantidad, desperdicio);

    if (totalEl) totalEl.textContent = recetaFormatNumber(cantidadReal);
    if (cantidad > 0) {
      materialesActivos += 1;
      cantidadRealTotal += cantidadReal;
    }
  });

  const materialesEl = document.getElementById("resumenMateriales");
  const cantidadRealEl = document.getElementById("resumenCantidadReal");
  if (materialesEl) materialesEl.textContent = recetaFormatNumber(materialesActivos, 0);
  if (cantidadRealEl) cantidadRealEl.textContent = recetaFormatNumber(cantidadRealTotal);
}

function renderMateriales(materiales) {
  recetaState.materiales = Array.isArray(materiales) ? materiales : [];

  const contenedor = document.getElementById("listaMateriales");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (recetaState.materiales.length === 0) {
    contenedor.innerHTML = '<tr><td colspan="4" class="px-3 py-8 text-center text-slate-500 sm:px-4 sm:py-10">No hay materias primas activas disponibles.</td></tr>';
    updateResumen();
    return;
  }

  recetaState.materiales.forEach((mat) => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-material-row", mat.idMaterial || "");
    tr.className = "align-middle";
    tr.innerHTML = `
      <td class="px-3 py-3 align-top sm:px-4 sm:py-4">
        <div class="break-words font-semibold leading-snug text-slate-200 receta-material-nombre">${mat.nombreMaterial || ""}</div>
      </td>
      <td class="px-2 py-3 align-top sm:px-4 sm:py-4">
        <input
          type="number"
          step="0.001"
          min="0"
          placeholder="0"
          class="cant w-full min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-right text-[11px] text-slate-200 outline-none focus:ring-2 focus:ring-emerald-400 sm:px-3 sm:text-sm receta-input"
          data-id="${mat.idMaterial || ""}"
        >
      </td>
      <td class="px-2 py-3 align-top sm:px-4 sm:py-4">
        <div class="flex min-w-0 items-center gap-1 sm:gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value="0"
            class="desp w-full min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-right text-[11px] text-slate-200 outline-none focus:ring-2 focus:ring-emerald-400 sm:px-3 sm:text-sm receta-input"
            data-id="${mat.idMaterial || ""}"
          >
          <span class="shrink-0 text-[11px] text-slate-500 sm:text-sm receta-material-meta">%</span>
        </div>
      </td>
      <td class="px-2 py-3 align-top sm:px-4 sm:py-4">
        <span class="cantidad-real block break-words text-[12px] font-bold text-emerald-400 sm:text-sm receta-cantidad-real">0</span>
      </td>
    `;
    contenedor.appendChild(tr);
  });

  document.querySelectorAll(".cant, .desp").forEach((input) => {
    input.addEventListener("input", updateResumen);
  });

  updateResumen();
}

async function cargarMaterialesReceta() {
  const contenedor = document.getElementById("listaMateriales");
  if (contenedor) {
    contenedor.innerHTML = '<tr><td colspan="4" class="px-3 py-8 text-center text-slate-500 sm:px-4 sm:py-10">Cargando materiales...</td></tr>';
  }

  try {
    let data = await recetaJsonpRequest({ accion: "recetaProductoMateriales" });

    const needsFallback = !data || !data.success || /Acción no reconocida/i.test(String(data.message || ""));
    if (needsFallback) {
      const fallbackData = await recetaJsonpRequest({ accion: "materiaPrimaListar" });
      if (!fallbackData || !fallbackData.success) {
        renderMateriales([]);
        showRecetaStatus((fallbackData && fallbackData.message) || (data && data.message) || "No se pudieron cargar los materiales.", false);
        return;
      }

      data = {
        success: true,
        materiales: (fallbackData.materiales || []).filter((item) => item && item.activo)
      };
    }

    clearRecetaStatus();
    renderMateriales(data.materiales || []);
  } catch (error) {
    renderMateriales([]);
    showRecetaStatus(error.message || "Error cargando materiales.", false);
  }
}

function buildPayload() {
  const nombreProducto = document.getElementById("nombreProducto").value.trim();
  const categorias = getSelectedCategorias();
  const urlImagen = document.getElementById("urlImagen").value.trim();
  const materiales = [];

  document.querySelectorAll("[data-material-row]").forEach((row) => {
    const cantidadInput = row.querySelector(".cant");
    const desperdicioInput = row.querySelector(".desp");
    const idMaterial = cantidadInput ? cantidadInput.getAttribute("data-id") : "";
    const cantidadPorUnidad = Number(cantidadInput ? cantidadInput.value : 0);
    const porcentajeDesperdicio = Number(desperdicioInput ? desperdicioInput.value : 0);

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

function resetRecetaForm() {
  const nombreProducto = document.getElementById("nombreProducto");
  const urlImagen = document.getElementById("urlImagen");

  if (nombreProducto) nombreProducto.value = "";
  if (urlImagen) urlImagen.value = "";

  document.querySelectorAll('input[name="categoriaProducto"]').forEach((input) => {
    input.checked = false;
  });
  document.querySelectorAll(".cant").forEach((input) => {
    input.value = "";
  });
  document.querySelectorAll(".desp").forEach((input) => {
    input.value = "0";
  });

  updatePreviewId();
  updateResumen();
}

async function guardarReceta() {
  clearRecetaStatus();

  const payload = buildPayload();
  const btn = document.getElementById("btnGuardarReceta");

  if (!payload.nombreProducto) {
    showRecetaStatus("El nombre del producto es obligatorio.", false);
    return;
  }

  if (!payload.categorias.length) {
    showRecetaStatus("Debes seleccionar al menos una categoria.", false);
    return;
  }

  if (payload.materiales.length === 0) {
    showRecetaStatus("Debes ingresar al menos una materia prima con cantidad mayor a cero.", false);
    return;
  }

  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    const data = await recetaJsonpRequest({
      accion: "recetaProductoGuardar",
      payload: JSON.stringify(payload)
    });

    if (!data || !data.success) {
      showRecetaStatus((data && data.message) || "No se pudo guardar la receta.", false);
      return;
    }

    showRecetaStatus(
      `${data.message || "Receta guardada correctamente."} ID generado: ${data.productoId || "-"}.`,
      true
    );
    resetRecetaForm();
  } catch (error) {
    showRecetaStatus(error.message || "Error guardando receta.", false);
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar receta y producto";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const template = document.getElementById("recetaProductoContentTemplate");
  const mainContentHtml = template ? template.innerHTML : "";

  const app = window.AppLayout.init({
    brandTitle: "ERP Cousy",
    brandSubtitle: "Produccion",
    headerTitle: "Receta de Producto",
    headerSubtitle: "Crea productos y registra su receta con materias primas activas.",
    activeNavId: "receta_producto",
    navItems: [
      { id: "cotizaciones", label: "Cotizaciones", href: "/dashboard.html#cotizaciones" },
      { id: "productos", label: "Productos", href: "/html/Producto.html" },
      { id: "materia-prima", label: "Materia Prima Actual", href: "/html/materiaprima.html" },
      { id: "clientes", label: "Clientes", href: "/dashboard.html#clientes" },
      { id: "receta_producto", label: "Receta de Producto", href: "/html/receta_de_Producto.html" },
      { id: "prod_cotizacion", label: "Productos de Cotización", href: "/dashboard.html#prod_cotizacion" },
      { id: "mp_cotizacion", label: "Materia Prima de Cotización", href: "/dashboard.html#mp_cotizacion" }
    ],
    mainContentHtml: mainContentHtml,
    mainClass: "flex-1 p-4 md:p-8 overflow-y-auto space-y-4 md:space-y-6"
  });

  if (!app) return;

  renderCategorias();

  const btnGuardar = document.getElementById("btnGuardarReceta");
  const nombreProducto = document.getElementById("nombreProducto");
  if (btnGuardar) btnGuardar.addEventListener("click", guardarReceta);
  if (nombreProducto) nombreProducto.addEventListener("input", updatePreviewId);

  updatePreviewId();
  cargarMaterialesReceta();
});
