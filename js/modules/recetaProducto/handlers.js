(function () {
  var api = window.RecetaProductoApi;
  var view = window.RecetaProductoView;

  async function cargarMaterialesReceta() {
    view.showLoadingMateriales();

    try {
      var data = await api.obtenerMateriales();
      var needsFallback = !data || !data.success || /Acción no reconocida/i.test(String(data.message || ""));

      if (needsFallback) {
        var fallbackData = await api.listarMateriaPrima();
        if (!fallbackData || !fallbackData.success) {
          view.renderMateriales([]);
          view.showStatus(
            (fallbackData && fallbackData.message) || (data && data.message) || "No se pudieron cargar los materiales.",
            false
          );
          return;
        }

        data = {
          success: true,
          materiales: (fallbackData.materiales || []).filter(function (item) {
            return item && item.activo;
          })
        };
      }

      view.clearStatus();
      view.renderMateriales(data.materiales || []);
    } catch (error) {
      view.renderMateriales([]);
      view.showStatus(error.message || "Error cargando materiales.", false);
    }
  }

  async function guardarReceta() {
    view.clearStatus();

    var payload = view.buildPayload();

    if (!payload.nombreProducto) {
      view.showStatus("El nombre del producto es obligatorio.", false);
      return;
    }

    if (!payload.categorias.length) {
      view.showStatus("Debes seleccionar al menos una categoria.", false);
      return;
    }

    if (!payload.materiales.length) {
      view.showStatus("Debes ingresar al menos una materia prima con cantidad mayor a cero.", false);
      return;
    }

    view.setGuardarEstado(true);

    try {
      var data = await api.guardarReceta(payload);
      if (!data || !data.success) {
        view.showStatus((data && data.message) || "No se pudo guardar la receta.", false);
        return;
      }

      view.showStatus((data.message || "Receta guardada correctamente.") + " ID generado: " + (data.productoId || "-") + ".", true);
      view.resetForm();
    } catch (error) {
      view.showStatus(error.message || "Error guardando receta.", false);
    } finally {
      view.setGuardarEstado(false);
    }
  }

  function bindEvents() {
    var btnGuardar = document.getElementById("btnGuardarReceta");
    var nombreProducto = document.getElementById("nombreProducto");

    if (btnGuardar) btnGuardar.addEventListener("click", guardarReceta);
    if (nombreProducto) nombreProducto.addEventListener("input", view.updatePreviewId);
  }

  window.RecetaProductoHandlers = {
    bindEvents: bindEvents,
    cargarMaterialesReceta: cargarMaterialesReceta
  };
})();
