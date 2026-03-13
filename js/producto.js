const PRODUCTO_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.SCRIPT_URL
  ? window.APP_CONFIG.SCRIPT_URL
  : "";

const productoState = {
  productos: []
};

function productoJsonpRequest(params, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (!PRODUCTO_SCRIPT_URL) {
      reject(new Error("No hay URL de API configurada."));
      return;
    }

    const callbackName = "cbProducto_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
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
    scriptTag.src = `${PRODUCTO_SCRIPT_URL}?${query.toString()}`;
    scriptTag.async = true;
    scriptTag.onerror = () => {
      cleanup();
      reject(new Error("No se pudo cargar la API remota."));
    };

    document.body.appendChild(scriptTag);
  });
}

function formatProductoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-NI");
}

function showProductoStatus(message, isSuccess) {
  const status = document.getElementById("productoStatus");
  if (!status) return;

  status.textContent = message;
  status.className = `mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
    isSuccess
      ? "border-emerald-700 bg-emerald-100 text-emerald-950 receta-status-ok"
      : "border-red-700 bg-red-100 text-red-950 receta-status-error"
  }`;
  status.classList.remove("hidden");
}

function normalizeCategorias(producto) {
  if (Array.isArray(producto.categorias) && producto.categorias.length) {
    return producto.categorias;
  }
  if (producto.categoria) {
    return String(producto.categoria).split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function populateCategoriaFilter(productos) {
  const select = document.getElementById("filtroCategoria");
  if (!select) return;

  const previous = select.value;
  const categorias = [];

  productos.forEach((producto) => {
    normalizeCategorias(producto).forEach((categoria) => {
      if (categorias.indexOf(categoria) === -1) categorias.push(categoria);
    });
  });

  categorias.sort((a, b) => a.localeCompare(b));
  select.innerHTML = '<option value="">Todas las categorias</option>';
  categorias.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria;
    option.textContent = categoria;
    select.appendChild(option);
  });
  select.value = categorias.indexOf(previous) !== -1 ? previous : "";
}

function getFilteredProductos() {
  const search = document.getElementById("buscarProducto");
  const filtroCategoria = document.getElementById("filtroCategoria");
  const searchValue = search ? search.value.trim().toLowerCase() : "";
  const categoriaValue = filtroCategoria ? filtroCategoria.value.trim().toLowerCase() : "";

  return productoState.productos.filter((producto) => {
    const nombre = String(producto.nombreProducto || "").toLowerCase();
    const categorias = normalizeCategorias(producto).map((item) => item.toLowerCase());
    const matchesName = !searchValue || nombre.indexOf(searchValue) !== -1;
    const matchesCategoria = !categoriaValue || categorias.indexOf(categoriaValue) !== -1;
    return matchesName && matchesCategoria;
  });
}

function renderProductos(productos) {
  const grid = document.getElementById("productosGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!Array.isArray(productos) || productos.length === 0) {
    grid.innerHTML = `
      <div class="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 text-center text-slate-500 md:col-span-2 xl:col-span-3">
        No hay productos que coincidan con la búsqueda o filtro seleccionado.
      </div>
    `;
    return;
  }

  productos.forEach((producto) => {
    const categorias = normalizeCategorias(producto);
    const categoriasHtml = categorias.length
      ? categorias.map((categoria) => `<span class="rounded-full border border-emerald-700/40 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">${categoria}</span>`).join("")
      : '<span class="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">Sin categoria</span>';

    const card = document.createElement("article");
    card.className = "overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60";
    card.innerHTML = `
      <div class="aspect-[4/3] bg-slate-900">
        ${producto.imagen
          ? `<img src="${producto.imagen}" alt="${producto.nombreProducto || "Producto"}" class="h-full w-full object-cover">`
          : `<div class="flex h-full items-center justify-center text-sm font-semibold text-slate-500">Sin imagen</div>`
        }
      </div>
      <div class="space-y-4 p-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">${producto.idProducto || ""}</p>
          <h3 class="mt-2 text-xl font-bold text-slate-100">${producto.nombreProducto || ""}</h3>
        </div>
        <div class="flex flex-wrap gap-2">
          ${categoriasHtml}
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
            <p class="text-xs text-slate-500">Estado</p>
            <p class="mt-1 font-semibold text-slate-100">${producto.estado || "Activo"}</p>
          </div>
          <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
            <p class="text-xs text-slate-500">Materiales</p>
            <p class="mt-1 font-semibold text-slate-100">${producto.totalMateriales || 0}</p>
          </div>
          <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 col-span-2">
            <p class="text-xs text-slate-500">Fecha</p>
            <p class="mt-1 font-semibold text-slate-100">${formatProductoDate(producto.fechaCreacion)}</p>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function applyFilters() {
  renderProductos(getFilteredProductos());
}

async function cargarProductos() {
  try {
    const data = await productoJsonpRequest({ accion: "productoListar" });
    if (!data || !data.success) {
      renderProductos([]);
      showProductoStatus((data && data.message) || "No se pudieron cargar los productos.", false);
      return;
    }

    productoState.productos = data.productos || [];
    populateCategoriaFilter(productoState.productos);
    applyFilters();
  } catch (error) {
    renderProductos([]);
    showProductoStatus(error.message || "Error cargando productos.", false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const template = document.getElementById("productoContentTemplate");
  const mainContentHtml = template ? template.innerHTML : "";

  const app = window.AppLayout.init({
    brandTitle: "ERP Cousy",
    brandSubtitle: "Catalogo",
    headerTitle: "Productos",
    headerSubtitle: "Consulta los productos creados con su imagen y composición registrada.",
    activeNavId: "productos",
    navItems: [
      { id: "cotizaciones", label: "Cotizaciones", href: "../dashboard.html#cotizaciones" },
      { id: "productos", label: "Productos", href: "Producto.html" },
      { id: "materia-prima", label: "Materia Prima Actual", href: "materiaprima.html" },
      { id: "clientes", label: "Clientes", href: "../dashboard.html#clientes" },
      { id: "receta_producto", label: "Receta de Producto", href: "receta_de_Producto.html" },
      { id: "prod_cotizacion", label: "Productos de Cotización", href: "../dashboard.html#prod_cotizacion" },
      { id: "mp_cotizacion", label: "Materia Prima de Cotización", href: "../dashboard.html#mp_cotizacion" }
    ],
    mainContentHtml: mainContentHtml,
    mainClass: "flex-1 p-4 md:p-8 overflow-y-auto space-y-4 md:space-y-6"
  });

  if (!app) return;

  const buscarProducto = document.getElementById("buscarProducto");
  const filtroCategoria = document.getElementById("filtroCategoria");
  if (buscarProducto) buscarProducto.addEventListener("input", applyFilters);
  if (filtroCategoria) filtroCategoria.addEventListener("change", applyFilters);

  cargarProductos();
});
