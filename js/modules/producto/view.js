(function () {
  var state = window.ProductoState;

  function showStatus(message, isSuccess) {
    var status = document.getElementById("productoStatus");
    if (!status) return;

    status.textContent = message;
    status.className = "mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold " + (
      isSuccess
        ? "border-emerald-700 bg-emerald-100 text-emerald-950 receta-status-ok"
        : "border-red-700 bg-red-100 text-red-950 receta-status-error"
    );
    status.classList.remove("hidden");
  }

  function clearStatus() {
    var status = document.getElementById("productoStatus");
    if (!status) return;
    status.textContent = "";
    status.className = "hidden rounded-2xl border px-4 py-3 text-sm font-semibold";
  }

  function normalizeCategorias(producto) {
    if (Array.isArray(producto.categorias) && producto.categorias.length) {
      return producto.categorias;
    }
    if (producto.categoria) {
      return String(producto.categoria)
        .split(",")
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean);
    }
    return [];
  }

  function populateCategoriaFilter(productos) {
    var select = document.getElementById("filtroCategoria");
    if (!select) return;

    var previous = select.value;
    var categorias = [];

    productos.forEach(function (producto) {
      normalizeCategorias(producto).forEach(function (categoria) {
        if (categorias.indexOf(categoria) === -1) categorias.push(categoria);
      });
    });

    categorias.sort(function (a, b) {
      return a.localeCompare(b);
    });

    select.innerHTML = '<option value="">Todas las categorias</option>';
    categorias.forEach(function (categoria) {
      var option = document.createElement("option");
      option.value = categoria;
      option.textContent = categoria;
      select.appendChild(option);
    });
    select.value = categorias.indexOf(previous) !== -1 ? previous : "";
  }

  function getFilterValues() {
    var search = document.getElementById("buscarProducto");
    var filtroCategoria = document.getElementById("filtroCategoria");

    return {
      searchValue: search ? search.value.trim().toLowerCase() : "",
      categoriaValue: filtroCategoria ? filtroCategoria.value.trim().toLowerCase() : ""
    };
  }

  function getFilteredProductos() {
    var filters = getFilterValues();

    return state.getProductos().filter(function (producto) {
      var nombre = String(producto.nombreProducto || "").toLowerCase();
      var categorias = normalizeCategorias(producto).map(function (item) {
        return item.toLowerCase();
      });
      var matchesName = !filters.searchValue || nombre.indexOf(filters.searchValue) !== -1;
      var matchesCategoria = !filters.categoriaValue || categorias.indexOf(filters.categoriaValue) !== -1;
      return matchesName && matchesCategoria;
    });
  }

  function updateCotizacionButtonState() {
    var btn = document.getElementById("crearCotizacionBtn");
    if (!btn) return;

    var count = state.getSelectedProductoIds().length;
    btn.textContent = "Crear Cotización (" + count + ")";
    btn.disabled = count === 0;
  }

  function renderProductos(productos) {
    var grid = document.getElementById("productosGrid");
    if (!grid) return;

    grid.innerHTML = "";

    if (!Array.isArray(productos) || productos.length === 0) {
      grid.innerHTML = '<div class="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 text-center text-slate-500 md:col-span-2 xl:col-span-3">No hay productos que coincidan con la búsqueda o filtro seleccionado.</div>';
      updateCotizacionButtonState();
      return;
    }

    productos.forEach(function (producto) {
      var categorias = normalizeCategorias(producto);
      var productoId = String(producto.idProducto || "");
      var isSelected = state.isSelected(productoId);
      var categoriasHtml = categorias.length
        ? categorias.map(function (categoria) {
            return '<span class="rounded-full border border-emerald-700/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium leading-none text-emerald-300">' + categoria + "</span>";
          }).join("")
        : '<span class="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">Sin categoria</span>';

      var card = document.createElement("article");
      card.className = "producto-card group relative mx-auto w-full max-w-[19rem] overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-[0_16px_40px_rgba(15,23,42,0.28)] " + (isSelected ? "producto-card-selected" : "");
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-pressed", isSelected ? "true" : "false");
      card.dataset.productoId = productoId;
      card.innerHTML = [
        '<label class="producto-card-check absolute left-3 top-3 z-10 inline-flex cursor-pointer items-center">',
        '  <input type="checkbox" class="sr-only" ' + (isSelected ? "checked" : "") + ' aria-label="Seleccionar ' + (producto.nombreProducto || "producto") + '">',
        '  <span class="producto-card-check-ui h-6 w-6 rounded-full border border-emerald-400/70 bg-white/95 shadow-sm"></span>',
        "</label>",
        '<div class="aspect-[3/2] bg-slate-900">',
        producto.imagen
          ? '  <img src="' + producto.imagen + '" alt="' + (producto.nombreProducto || "Producto") + '" class="h-full w-full object-cover">'
          : '  <div class="flex h-full items-center justify-center text-sm font-semibold text-slate-500">Sin imagen</div>',
        "</div>",
        '<div class="space-y-2 p-3">',
        "  <div>",
        '    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">' + (producto.idProducto || "") + "</p>",
        '    <h3 class="mt-1.5 text-base font-bold text-slate-100">' + (producto.nombreProducto || "") + "</h3>",
        "  </div>",
        '  <div class="flex flex-wrap gap-1">' + categoriasHtml + "</div>",
        '  <div class="grid grid-cols-2 gap-2 text-sm text-slate-300">',
        '    <div class="producto-card-meta rounded-xl border border-slate-700 bg-slate-900/60 p-2.5">',
        '      <p class="text-xs text-slate-500">Estado</p>',
        '      <p class="mt-1 font-semibold text-slate-100">' + (producto.estado || "Activo") + "</p>",
        "    </div>",
        '    <div class="producto-card-meta rounded-xl border border-slate-700 bg-slate-900/60 p-2.5">',
        '      <p class="text-xs text-slate-500">Materiales</p>',
        '      <p class="mt-1 font-semibold text-slate-100">' + (producto.totalMateriales || 0) + "</p>",
        "    </div>",
        "  </div>",
        "</div>"
      ].join("");

      var checkboxLabel = card.querySelector(".producto-card-check");
      if (checkboxLabel) {
        checkboxLabel.addEventListener("click", function (event) {
          event.stopPropagation();
          document.dispatchEvent(new CustomEvent("producto:toggle", {
            detail: { productoId: productoId }
          }));
        });
      }

      card.addEventListener("click", function () {
        document.dispatchEvent(new CustomEvent("producto:toggle", {
          detail: { productoId: productoId }
        }));
      });

      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          document.dispatchEvent(new CustomEvent("producto:toggle", {
            detail: { productoId: productoId }
          }));
        }
      });

      grid.appendChild(card);
    });

    updateCotizacionButtonState();
  }

  function applyFilters() {
    renderProductos(getFilteredProductos());
  }

  window.ProductoView = {
    showStatus: showStatus,
    clearStatus: clearStatus,
    normalizeCategorias: normalizeCategorias,
    populateCategoriaFilter: populateCategoriaFilter,
    updateCotizacionButtonState: updateCotizacionButtonState,
    renderProductos: renderProductos,
    applyFilters: applyFilters
  };
})();
