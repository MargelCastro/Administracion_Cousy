(function () {
  var state = {
    materiales: []
  };

  function setMateriales(materiales) {
    state.materiales = Array.isArray(materiales) ? materiales : [];
  }

  function getMateriales() {
    return state.materiales.slice();
  }

  window.RecetaProductoState = {
    setMateriales: setMateriales,
    getMateriales: getMateriales
  };
})();
