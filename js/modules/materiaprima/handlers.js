(function () {
  var stateStore = window.MateriaPrimaState;
  var api = window.MateriaPrimaApi;
  var view = window.MateriaPrimaView;

  async function cargarPreviewPorNombre() {
    var nombreMaterial = document.getElementById("nombreMaterial").value.trim();
    if (!nombreMaterial) {
      stateStore.clearMaterialActual();
      view.setMaterialFields({
        idMaterial: "",
        unidadBase: "",
        stockActual: 0,
        precio: 0,
        inversionTotal: 0,
        activo: false
      });
      return;
    }

    try {
      var data = await api.obtenerPreview(nombreMaterial);
      if (!data || !data.success) {
        view.showEstado("error", data && data.message ? data.message : "No se pudo obtener datos del material.");
        return;
      }

      stateStore.setMaterialActual(data.material || null);
      view.setMaterialFields(data.material || null);
      view.updateProjectedSummary();
    } catch (error) {
      view.showEstado("error", error.message || "Error consultando material.");
    }
  }

  async function cargarSugerencias() {
    var nombreMaterial = document.getElementById("nombreMaterial").value.trim();
    if (!nombreMaterial || nombreMaterial.length < 2) {
      view.renderSugerencias([]);
      return;
    }

    try {
      var data = await api.buscar(nombreMaterial);
      if (!data || !data.success || !Array.isArray(data.sugerencias)) {
        view.renderSugerencias([]);
        return;
      }

      view.renderSugerencias(data.sugerencias);
    } catch (_) {
      view.renderSugerencias([]);
    }
  }

  async function cargarTabla(forceRefresh) {
    try {
      var data = await api.listar(forceRefresh);
      if (!data || !data.success) {
        view.showEstado("error", data && data.message ? data.message : "No se pudo obtener la tabla.");
        return;
      }

      view.renderTabla(data.materiales || []);
    } catch (error) {
      view.showEstado("error", error.message || "Error cargando tabla.");
    }
  }

  async function guardarMaterial(event) {
    event.preventDefault();
    view.clearEstado();

    var nombreMaterial = document.getElementById("nombreMaterial").value.trim();
    var unidadBase = document.getElementById("unidadBase").value;
    var cantidadIngreso = Number(document.getElementById("cantidadIngreso").value || 0);
    var precio = Number(document.getElementById("precio").value || 0);

    if (!nombreMaterial) {
      view.showEstado("warn", "Debe ingresar el nombre del material.");
      return;
    }

    if (!unidadBase) {
      view.showEstado("warn", "Debe seleccionar una unidad base.");
      return;
    }

    if (cantidadIngreso < 0 || precio < 0) {
      view.showEstado("warn", "Cantidad y precio no pueden ser negativos.");
      return;
    }

    try {
      var data = await api.guardar({
        nombreMaterial: nombreMaterial,
        unidadBase: unidadBase,
        cantidadIngreso: cantidadIngreso,
        precio: precio
      });

      if (!data || !data.success) {
        var errorMessage = data && data.message ? data.message : "Error al guardar material.";
        view.showEstado("error", errorMessage);
        view.showToast("error", errorMessage);
        return;
      }

      stateStore.setMaterialActual(data.material || null);
      stateStore.clearMaterialActual();
      view.resetFormulario();
      view.showEstado("ok", "Guardado exitosamente.");
      view.showToast("ok", "Guardado exitosamente.");

      var seccionTabla = document.getElementById("seccionTabla");
      if (seccionTabla && !seccionTabla.classList.contains("hidden")) {
        await cargarTabla(false);
      }
    } catch (error) {
      var message = error.message || "Error al guardar material.";
      view.showEstado("error", message);
      view.showToast("error", message);
    }
  }

  function bindEvents() {
    var nombreMaterial = document.getElementById("nombreMaterial");
    var cantidadIngreso = document.getElementById("cantidadIngreso");
    var precio = document.getElementById("precio");
    var form = document.getElementById("formMateriaPrima");
    var btnVerTabla = document.getElementById("btnVerTabla");
    var btnRefrescarTabla = document.getElementById("btnRefrescarTabla");

    if (!nombreMaterial || !cantidadIngreso || !precio || !form) {
      console.error("Materia Prima: faltan elementos requeridos del formulario.");
      return;
    }

    nombreMaterial.addEventListener("input", function () {
      stateStore.clearDebounceTimer();
      stateStore.setDebounceTimer(setTimeout(async function () {
        await cargarSugerencias();
        await cargarPreviewPorNombre();
      }, 250));
    });

    nombreMaterial.addEventListener("change", cargarPreviewPorNombre);
    cantidadIngreso.addEventListener("input", view.updateProjectedSummary);
    precio.addEventListener("input", view.updateProjectedSummary);
    form.addEventListener("submit", guardarMaterial);

    if (btnVerTabla) {
      btnVerTabla.addEventListener("click", async function () {
        var seccionTabla = document.getElementById("seccionTabla");
        if (!seccionTabla) return;

        seccionTabla.classList.toggle("hidden");
        if (!seccionTabla.classList.contains("hidden")) {
          await cargarTabla(true);
          seccionTabla.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    if (btnRefrescarTabla) {
      btnRefrescarTabla.addEventListener("click", function () {
        cargarTabla(true);
      });
    }
  }

  window.MateriaPrimaHandlers = {
    bindEvents: bindEvents,
    cargarTabla: cargarTabla
  };
})();
