const PRODUCTO_SCRIPT_URL = window.APP_CONFIG && window.APP_CONFIG.SCRIPT_URL
  ? window.APP_CONFIG.SCRIPT_URL
  : "";

const productoState = {
  productos: [],
  selectedProductoIds: []
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

function updateCotizacionButtonState() {
  const btn = document.getElementById("crearCotizacionBtn");
  if (!btn) return;

  const count = productoState.selectedProductoIds.length;
  btn.textContent = `Crear Cotización (${count})`;
  btn.disabled = count === 0;
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
    updateCotizacionButtonState();
    return;
  }

  productos.forEach((producto) => {
    const categorias = normalizeCategorias(producto);
    const productoId = String(producto.idProducto || "");
    const isSelected = productoState.selectedProductoIds.indexOf(productoId) !== -1;
    const categoriasHtml = categorias.length
      ? categorias.map((categoria) => `<span class="rounded-full border border-emerald-700/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium leading-none text-emerald-300">${categoria}</span>`).join("")
      : '<span class="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">Sin categoria</span>';

    const card = document.createElement("article");
    card.className = `producto-card group relative mx-auto w-full max-w-[19rem] overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-[0_16px_40px_rgba(15,23,42,0.28)] ${isSelected ? "producto-card-selected" : ""}`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", isSelected ? "true" : "false");
    card.dataset.productoId = productoId;
    card.innerHTML = `
      <label class="producto-card-check absolute left-3 top-3 z-10 inline-flex cursor-pointer items-center">
        <input type="checkbox" class="sr-only" ${isSelected ? "checked" : ""} aria-label="Seleccionar ${producto.nombreProducto || "producto"}">
        <span class="producto-card-check-ui h-6 w-6 rounded-full border border-emerald-400/70 bg-white/95 shadow-sm"></span>
      </label>
      <div class="aspect-[3/2] bg-slate-900">
        ${producto.imagen
          ? `<img src="${producto.imagen}" alt="${producto.nombreProducto || "Producto"}" class="h-full w-full object-cover">`
          : `<div class="flex h-full items-center justify-center text-sm font-semibold text-slate-500">Sin imagen</div>`
        }
      </div>
      <div class="space-y-2 p-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">${producto.idProducto || ""}</p>
          <h3 class="mt-1.5 text-base font-bold text-slate-100">${producto.nombreProducto || ""}</h3>
        </div>
        <div class="flex flex-wrap gap-1">
          ${categoriasHtml}
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm text-slate-300">
          <div class="producto-card-meta rounded-xl border border-slate-700 bg-slate-900/60 p-2.5">
            <p class="text-xs text-slate-500">Estado</p>
            <p class="mt-1 font-semibold text-slate-100">${producto.estado || "Activo"}</p>
          </div>
          <div class="producto-card-meta rounded-xl border border-slate-700 bg-slate-900/60 p-2.5">
            <p class="text-xs text-slate-500">Materiales</p>
            <p class="mt-1 font-semibold text-slate-100">${producto.totalMateriales || 0}</p>
          </div>
        </div>
      </div>
    `;
    function toggleSelectedCard() {
      const currentIndex = productoState.selectedProductoIds.indexOf(productoId);
      if (currentIndex === -1) {
        productoState.selectedProductoIds.push(productoId);
      } else {
        productoState.selectedProductoIds.splice(currentIndex, 1);
      }
      applyFilters();
    }
    const checkbox = card.querySelector('input[type="checkbox"]');
    const checkboxLabel = card.querySelector(".producto-card-check");
    if (checkboxLabel) {
      checkboxLabel.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleSelectedCard();
      });
    }
    card.addEventListener("click", toggleSelectedCard);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleSelectedCard();
      }
    });
    grid.appendChild(card);
  });
  updateCotizacionButtonState();
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
    activeNavId: "productos",
    navItems: [
      { id: "cotizaciones", label: "Cotizaciones", href: "/html/cotizaciones.html" },
      { id: "productos", label: "Productos", href: "/html/Producto.html" },
      { id: "materia-prima", label: "Materia Prima Actual", href: "/html/materiaprima.html" },
      { id: "clientes", label: "Clientes", href: "/html/clientes.html" },
      { id: "receta_producto", label: "Receta de Producto", href: "/html/receta_de_Producto.html" },
      { id: "prod_cotizacion", label: "Productos de Cotización", href: "/html/productos_cotizacion.html" },
      { id: "mp_cotizacion", label: "Materia Prima de Cotización", href: "/html/materiaprima_cotizacion.html" }
    ],
    actions: [
      { id: "crearCotizacionBtn", label: "Crear Cotización" }
    ],
    mainContentHtml: mainContentHtml,
    mainClass: "app-shell-main flex-1 p-4 md:p-8 space-y-4 md:space-y-6"
  });

  if (!app) return;

  const buscarProducto = document.getElementById("buscarProducto");
  const filtroCategoria = document.getElementById("filtroCategoria");
  if (buscarProducto) buscarProducto.addEventListener("input", applyFilters);
  if (filtroCategoria) filtroCategoria.addEventListener("change", applyFilters);

  const crearCotizacionBtn = document.getElementById("crearCotizacionBtn");
  if (crearCotizacionBtn) {
    crearCotizacionBtn.disabled = true;
    crearCotizacionBtn.addEventListener("click", () => {
      const ids = productoState.selectedProductoIds;
      if (ids.length === 0) {
        alert("Por favor, selecciona al menos un producto para crear una cotización.");
        return;
      }
      alert(`Se creará una cotización con ${ids.length} producto(s).\nIDs: ${ids.join(", ")}`);
      console.log("IDs de productos para cotización:", ids);
      // Aquí iría la lógica para crear la cotización
    });
  }

  cargarProductos().then(() => {
    updateCotizacionButtonState();
  });
});
