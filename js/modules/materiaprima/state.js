(function () {
  var state = {
    materialActual: null,
    debounceTimer: null
  };

  function setMaterialActual(material) {
    state.materialActual = material || null;
  }

  function clearMaterialActual() {
    state.materialActual = null;
  }

  function setDebounceTimer(timer) {
    state.debounceTimer = timer || null;
  }

  function clearDebounceTimer() {
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }
    state.debounceTimer = null;
  }

  window.MateriaPrimaState = {
    state: state,
    setMaterialActual: setMaterialActual,
    clearMaterialActual: clearMaterialActual,
    setDebounceTimer: setDebounceTimer,
    clearDebounceTimer: clearDebounceTimer
  };
})();
