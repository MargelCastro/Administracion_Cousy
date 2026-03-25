/**
 * materiaPrimaController.gs - Enrutamiento/control de Materia Prima
 */
var MateriaPrimaController = {
  ACTIONS: {
    LISTAR: "materiaPrimaListar",
    BUSCAR: "materiaPrimaBuscar",
    PREVIEW: "materiaPrimaPreview",
    GUARDAR: "materiaPrimaGuardar"
  },

  esAccionMateriaPrima: function(accion) {
    return accion === this.ACTIONS.LISTAR ||
      accion === this.ACTIONS.BUSCAR ||
      accion === this.ACTIONS.PREVIEW ||
      accion === this.ACTIONS.GUARDAR;
  },

  manejarAccion: function(accion, params, callback) {
    switch (accion) {
      case this.ACTIONS.LISTAR:
        return MateriaPrimaService.listar(callback);
      case this.ACTIONS.BUSCAR:
        return MateriaPrimaService.buscarSimilares(params.query || "", callback);
      case this.ACTIONS.PREVIEW:
        return MateriaPrimaService.obtenerPreview(params.nombreMaterial || "", callback);
      case this.ACTIONS.GUARDAR:
        return MateriaPrimaService.guardar(params, callback);
      default:
        return ResponseService.error("Acción de Materia Prima no reconocida.", 400, callback);
    }
  }
};
