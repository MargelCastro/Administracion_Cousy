const SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.SCRIPT_URL
  ? window.APP_CONFIG.SCRIPT_URL
  : "";

const state = {
  materialActual: null,
  debounceTimer: null
};

function formatNumber(value) {
  const n = Number(value || 0);
  if (!isFinite(n)) return "0";
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded.toFixed(0)) : String(rounded);
}

function formatCurrency(value) {
  return `C$ ${formatNumber(value)}`;
}

function setFieldValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function showEstado(type, message) {
  const estado = document.getElementById("estado");
  if (!estado) return;

  if (type === "ok") {
    estado.className = "text-xs px-2 py-1 rounded-md border bg-emerald-900 text-emerald-400 border-emerald-700";
  } else if (type === "warn") {
    estado.className = "text-xs px-2 py-1 rounded-md border bg-amber-900 text-amber-300 border-amber-700";
  } else {
    estado.className = "text-xs px-2 py-1 rounded-md border bg-red-900 text-red-400 border-red-700";
  }

  estado.textContent = message;
  estado.classList.remove("hidden");
}

function clearEstado() {
  const estado = document.getElementById("estado");
  if (!estado) return;
  estado.textContent = "";
  estado.classList.add("hidden");
}

function showToast(type, message) {
  const wrap = document.getElementById("toastWrap");
  if (!wrap) return;

  const toast = document.createElement("div");
  const base = "max-w-sm rounded-lg border px-3 py-2 text-sm shadow-lg";
  const styles = type === "ok"
    ? "bg-emerald-900 text-emerald-300 border-emerald-700"
    : "bg-red-900 text-red-300 border-red-700";

  toast.className = `${base} ${styles}`;
  toast.textContent = message;
  wrap.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3200);
}

function jsonpRequest(params, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (!SCRIPT_URL) {
      reject(new Error("No hay URL de API configurada."));
      return;
    }
    const callbackName = "cbMateriaPrima_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
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
    scriptTag.src = `${SCRIPT_URL}?${query.toString()}`;
    scriptTag.async = true;
    scriptTag.onerror = () => {
      cleanup();
      reject(new Error("No se pudo cargar la API remota."));
    };

    document.body.appendChild(scriptTag);
  });
}

function setMaterialFields(material) {
  const m = material || {};
  setFieldValue("idMaterial", m.idMaterial || "");
  setFieldValue("unidadBase", m.unidadBase || "");
  setFieldValue("stockActual", formatNumber(m.stockActual || 0));
  setFieldValue("precio", formatNumber(m.precio || 0));
  setFieldValue("inversionTotal", formatNumber(m.inversionTotal || 0));
  setFieldValue("activo", m.activo ? "TRUE" : "FALSE");
}

function actualizarResumenProyectado() {
  const stockActual = Number(document.getElementById("stockActual").value || 0);
  const cantidadIngreso = Number(document.getElementById("cantidadIngreso").value || 0);
  const precio = Number(document.getElementById("precio").value || 0);
  const stockProyectado = stockActual + (cantidadIngreso > 0 ? cantidadIngreso : 0);
  const inversion = stockProyectado * (precio > 0 ? precio : 0);

  document.getElementById("inversionTotal").value = formatNumber(inversion);
  document.getElementById("activo").value = stockProyectado > 0 ? "TRUE" : "FALSE";
}

function resetFormulario() {
  state.materialActual = null;
  setFieldValue("idMaterial", "");
  setFieldValue("nombreMaterial", "");
  setFieldValue("unidadBase", "");
  setFieldValue("stockActual", "0");
  setFieldValue("cantidadIngreso", "0");
  setFieldValue("precio", "0");
  setFieldValue("inversionTotal", "0");
  setFieldValue("activo", "FALSE");
  const datalist = document.getElementById("sugerenciasMateriales");
  if (datalist) datalist.innerHTML = "";
}

async function cargarPreviewPorNombre() {
  const nombreMaterial = document.getElementById("nombreMaterial").value.trim();
  if (!nombreMaterial) {
    setMaterialFields({
      idMaterial: "",
      unidadBase: "",
      stockActual: 0,
      precio: 0,
      inversionTotal: 0,
      activo: false
    });
    return;
  }

  try {
    const data = await jsonpRequest({
      accion: "materiaPrimaPreview",
      nombreMaterial: nombreMaterial
    });

    if (!data || !data.success) {
      showEstado("error", (data && data.message) || "No se pudo obtener datos del material.");
      return;
    }

    state.materialActual = data.material || null;
    setMaterialFields(state.materialActual);
    actualizarResumenProyectado();
  } catch (error) {
    showEstado("error", error.message || "Error consultando material.");
  }
}

async function cargarSugerencias() {
  const nombreMaterial = document.getElementById("nombreMaterial").value.trim();
  const datalist = document.getElementById("sugerenciasMateriales");
  if (!datalist) return;
  datalist.innerHTML = "";

  if (!nombreMaterial || nombreMaterial.length < 2) return;

  try {
    const data = await jsonpRequest({
      accion: "materiaPrimaBuscar",
      query: nombreMaterial
    });

    if (!data || !data.success || !Array.isArray(data.sugerencias) || data.sugerencias.length === 0) {
      return;
    }

    data.sugerencias.forEach((m) => {
      const option = document.createElement("option");
      option.value = m.nombreMaterial;
      datalist.appendChild(option);
    });
  } catch (_) {
    // silencio para no interrumpir mientras escribe
  }
}

function renderTabla(materiales) {
  const tbody = document.getElementById("tablaMateriaPrimaBody");
  const totalEl = document.getElementById("totalInversionMateriaPrima");
  let totalInversion = 0;

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!materiales || materiales.length === 0) {
    if (totalEl) totalEl.textContent = "Total: C$ 0";
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="7" class="py-3 text-slate-500">No hay registros en Materia_Prima.</td>';
    tbody.appendChild(tr);
    return;
  }

  materiales.forEach((m) => {
    totalInversion += Number(m.inversionTotal || 0);

    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-800";
    tr.innerHTML = `
      <td class="py-2 pr-3">${m.idMaterial || ""}</td>
      <td class="py-2 pr-3">${m.nombreMaterial || ""}</td>
      <td class="py-2 pr-3">${m.unidadBase || ""}</td>
      <td class="py-2 pr-3">${formatNumber(m.stockActual || 0)}</td>
      <td class="py-2 pr-3">${formatNumber(m.precio || 0)}</td>
      <td class="py-2 pr-3">${formatNumber(m.inversionTotal || 0)}</td>
      <td class="py-2 pr-3">${m.activo ? "TRUE" : "FALSE"}</td>
    `;
    tbody.appendChild(tr);
  });

  if (totalEl) {
    totalEl.textContent = `Total: ${formatCurrency(totalInversion)}`;
  }
}

async function cargarTabla(forceRefresh) {
  try {
    const data = await jsonpRequest({
      accion: "materiaPrimaListar",
      _: forceRefresh ? String(Date.now()) : ""
    });
    if (!data || !data.success) {
      showEstado("error", (data && data.message) || "No se pudo obtener la tabla.");
      return;
    }
    renderTabla(data.materiales || []);
  } catch (error) {
    showEstado("error", error.message || "Error cargando tabla.");
  }
}

async function guardarMaterial(event) {
  event.preventDefault();
  clearEstado();

  const nombreMaterial = document.getElementById("nombreMaterial").value.trim();
  const unidadBase = document.getElementById("unidadBase").value;
  const cantidadIngreso = Number(document.getElementById("cantidadIngreso").value || 0);
  const precio = Number(document.getElementById("precio").value || 0);

  if (!nombreMaterial) {
    showEstado("warn", "Debe ingresar el nombre del material.");
    return;
  }
  if (!unidadBase) {
    showEstado("warn", "Debe seleccionar una unidad base.");
    return;
  }
  if (cantidadIngreso < 0 || precio < 0) {
    showEstado("warn", "Cantidad y precio no pueden ser negativos.");
    return;
  }
  try {
    const data = await jsonpRequest({
      accion: "materiaPrimaGuardar",
      nombreMaterial: nombreMaterial,
      unidadBase: unidadBase,
      cantidadIngreso: String(cantidadIngreso),
      precio: String(precio)
    });

    if (!data || !data.success) {
      const msg = (data && data.message) || "Error al guardar material.";
      showEstado("error", msg);
      showToast("error", msg);
      return;
    }

    state.materialActual = data.material || null;
    resetFormulario();
    showEstado("ok", "Guardado exitosamente.");
    showToast("ok", "Guardado exitosamente.");

    if (!document.getElementById("seccionTabla").classList.contains("hidden")) {
      await cargarTabla();
    }
  } catch (error) {
    const msg = error.message || "Error al guardar material.";
    showEstado("error", msg);
    showToast("error", msg);
  }
}

function bindEvents() {
  const nombreMaterial = document.getElementById("nombreMaterial");
  const cantidadIngreso = document.getElementById("cantidadIngreso");
  const precio = document.getElementById("precio");
  const form = document.getElementById("formMateriaPrima");
  const btnVerTabla = document.getElementById("btnVerTabla");
  const btnRefrescarTabla = document.getElementById("btnRefrescarTabla");

  if (!nombreMaterial || !cantidadIngreso || !precio || !form) {
    console.error("Materia Prima: faltan elementos requeridos del formulario.");
    return;
  }

  nombreMaterial.addEventListener("input", () => {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(async () => {
      await cargarSugerencias();
      await cargarPreviewPorNombre();
    }, 250);
  });

  nombreMaterial.addEventListener("change", cargarPreviewPorNombre);
  cantidadIngreso.addEventListener("input", actualizarResumenProyectado);
  precio.addEventListener("input", actualizarResumenProyectado);
  form.addEventListener("submit", guardarMaterial);

  if (btnVerTabla) {
    btnVerTabla.addEventListener("click", async () => {
      const seccionTabla = document.getElementById("seccionTabla");
      if (!seccionTabla) return;

      seccionTabla.classList.toggle("hidden");
      if (!seccionTabla.classList.contains("hidden")) {
        await cargarTabla(true);
        seccionTabla.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (btnRefrescarTabla) {
    btnRefrescarTabla.addEventListener("click", () => cargarTabla(true));
  }
}

function init() {
  const template = document.getElementById("materiaPrimaContentTemplate");
  const mainContentHtml = template ? template.innerHTML : "";

  const app = window.AppLayout.init({
    brandTitle: "ERP Cousy",
    brandSubtitle: "Inventario",
    headerTitle: "Materia Prima Actual",
    headerSubtitle: "Ingreso y actualización de inventario de materiales.",
    activeNavId: "materia-prima",
    navItems: [
      { id: "cotizaciones", label: "Cotizaciones", href: "/dashboard.html#cotizaciones" },
      { id: "productos", label: "Productos", href: "/html/Producto.html" },
      { id: "materia-prima", label: "Materia Prima Actual", href: "/html/materiaprima.html" },
      { id: "clientes", label: "Clientes", href: "/dashboard.html#clientes" },
      { id: "receta_producto", label: "Receta de Producto", href: "/html/receta_de_Producto.html" },
      { id: "prod_cotizacion", label: "Productos de Cotización", href: "/dashboard.html#prod_cotizacion" },
      { id: "mp_cotizacion", label: "Materia Prima de Cotización", href: "/dashboard.html#mp_cotizacion" }
    ],
    actions: [
      { id: "btnVerTabla", label: "Ver tabla materia prima" }
    ],
    mainContentHtml: mainContentHtml,
    mainClass: "app-shell-main flex-1 p-4 md:p-8 space-y-4 md:space-y-6"
  });

  if (!app) return;

  bindEvents();
  actualizarResumenProyectado();
}

document.addEventListener("DOMContentLoaded", init);
