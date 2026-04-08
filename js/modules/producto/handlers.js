(function () {
  var api = window.ProductoApi;
  var state = window.ProductoState;
  var view = window.ProductoView;

  async function cargarProductos() {
    try {
      var data = await api.listarProductos();
      if (!data || !data.success) {
        view.renderProductos([]);
        view.showStatus((data && data.message) || "No se pudieron cargar los productos.", false);
        return;
      }

      view.clearStatus();
      state.setProductos(data.productos || []);
      view.populateCategoriaFilter(state.getProductos());
      view.applyFilters();
    } catch (error) {
      view.renderProductos([]);
      view.showStatus(error.message || "Error cargando productos.", false);
    }
  }

  function bindEvents() {
    var buscarProducto = document.getElementById("buscarProducto");
    var filtroCategoria = document.getElementById("filtroCategoria");
    var crearCotizacionBtn = document.getElementById("crearCotizacionBtn");

    if (buscarProducto) buscarProducto.addEventListener("input", view.applyFilters);
    if (filtroCategoria) filtroCategoria.addEventListener("change", view.applyFilters);

    document.addEventListener("producto:toggle", function (event) {
      if (!event || !event.detail) return;
      state.toggleSelected(event.detail.productoId);
      view.applyFilters();
    });

    if (crearCotizacionBtn) {
      crearCotizacionBtn.disabled = true;
      crearCotizacionBtn.addEventListener("click", function () {
        var ids = state.getSelectedProductoIds();
        if (ids.length === 0) {
          alert("Por favor, selecciona al menos un producto para crear una cotización.");
          return;
        }

        var productosSeleccionados = state.getProductos().filter(function (producto) {
          return ids.indexOf(String(producto.idProducto || "")) !== -1;
        });

        window.CotizacionDraft.write(productosSeleccionados);
        window.location.href = "/html/cotizaciones.html";
      });
    }
  }

  window.ProductoHandlers = {
    bindEvents: bindEvents,
    cargarProductos: cargarProductos
  };
})();
