(function () {
  function request(params) {
    return window.AppScriptClient.jsonpRequest(params, {
      callbackPrefix: "cbRecetaProducto"
    });
  }

  function obtenerMateriales() {
    return request({ accion: "recetaProductoMateriales" });
  }

  function listarMateriaPrima() {
    return request({ accion: "materiaPrimaListar" });
  }

  function guardarReceta(payload) {
    return request({
      accion: "recetaProductoGuardar",
      payload: JSON.stringify(payload)
    });
  }

  window.RecetaProductoApi = {
    obtenerMateriales: obtenerMateriales,
    listarMateriaPrima: listarMateriaPrima,
    guardarReceta: guardarReceta
  };
})();
