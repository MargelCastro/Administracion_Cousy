(function () {
  var STORAGE_KEY = "cousyCotizacionDraft";

  function read() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function write(productos) {
    try {
      var normalized = Array.isArray(productos)
        ? productos.map(function (producto) {
            var item = Object.assign({}, producto);
            if (item.cantidadCotizar === undefined || item.cantidadCotizar === null) {
              item.cantidadCotizar = "";
            }
            return item;
          })
        : [];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (_) {}
  }

  function clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  function getSelectedIds() {
    return read().map(function (producto) {
      return String(producto.idProducto || "");
    }).filter(Boolean);
  }

  function updateCantidad(productoId, cantidad) {
    var productos = read().map(function (producto) {
      if (String(producto.idProducto || "") === String(productoId || "")) {
        producto.cantidadCotizar = cantidad;
      }
      return producto;
    });
    write(productos);
  }

  function removeProducto(productoId) {
    var productos = read().filter(function (producto) {
      return String(producto.idProducto || "") !== String(productoId || "");
    });
    write(productos);
  }

  window.CotizacionDraft = {
    read: read,
    write: write,
    clear: clear,
    getSelectedIds: getSelectedIds,
    updateCantidad: updateCantidad,
    removeProducto: removeProducto
  };
})();
