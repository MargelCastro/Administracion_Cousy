(function () {
  function request(params) {
    return window.AppScriptClient.jsonpRequest(params, {
      callbackPrefix: "cbMateriaPrima"
    });
  }

  function listar(forceRefresh) {
    return request({
      accion: "materiaPrimaListar",
      _: forceRefresh ? String(Date.now()) : ""
    });
  }

  function buscar(query) {
    return request({
      accion: "materiaPrimaBuscar",
      query: query
    });
  }

  function obtenerPreview(nombreMaterial) {
    return request({
      accion: "materiaPrimaPreview",
      nombreMaterial: nombreMaterial
    });
  }

  function guardar(payload) {
    return request({
      accion: "materiaPrimaGuardar",
      nombreMaterial: payload.nombreMaterial,
      unidadBase: payload.unidadBase,
      cantidadIngreso: String(payload.cantidadIngreso),
      precio: String(payload.precio)
    });
  }

  window.MateriaPrimaApi = {
    listar: listar,
    buscar: buscar,
    obtenerPreview: obtenerPreview,
    guardar: guardar
  };
})();
