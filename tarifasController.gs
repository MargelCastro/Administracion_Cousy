/**
 * tarifasController.gs - Enrutamiento/control de Tarifas
 */
var TarifasController = {
  ACTIONS: {
    LISTAR: "tarifasListar"
  },

  esAccionTarifas: function(accion) {
    return accion === this.ACTIONS.LISTAR;
  },

  manejarAccion: function(accion, params, callback) {
    switch (accion) {
      case this.ACTIONS.LISTAR:
        return TarifasService.listar(callback);
      default:
        return ResponseService.error("Acción de Tarifas no reconocida.", 400, callback);
    }
  }
};

