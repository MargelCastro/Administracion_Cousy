(function () {
  function request(params) {
    return window.AppScriptClient.jsonpRequest(params, {
      callbackPrefix: "cbProducto"
    });
  }

  function listarProductos() {
    return request({ accion: "productoListar" });
  }

  window.ProductoApi = {
    listarProductos: listarProductos
  };
})();
