(function () {
  var formatNumber = window.SharedFormatters.formatNumber;
  var formatCurrency = window.SharedFormatters.formatCurrency;

  function setFieldValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value;
  }

  function showEstado(type, message) {
    var estado = document.getElementById("estado");
    if (!estado) return;

    if (type === "ok") {
      estado.className = "text-xs px-2 py-1 rounded-md border bg-emerald-900 text-emerald-400 border-emerald-700";
    } else if (type === "warn") {
      estado.className = "text-xs px-2 py-1 rounded-md border bg-amber-900 text-amber-300 border-amber-700";
    } else {
      estado.className = "text-xs px-2 py-1 rounded-md border bg-red-900 text-red-400 border-red-700";
    }

    estado.textContent = message;
    estado.classList.remove("hidden");
  }

  function clearEstado() {
    var estado = document.getElementById("estado");
    if (!estado) return;
    estado.textContent = "";
    estado.classList.add("hidden");
  }

  function showToast(type, message) {
    var wrap = document.getElementById("toastWrap");
    if (!wrap) return;

    var toast = document.createElement("div");
    var base = "max-w-sm rounded-lg border px-3 py-2 text-sm shadow-lg";
    var styles = type === "ok"
      ? "bg-emerald-900 text-emerald-300 border-emerald-700"
      : "bg-red-900 text-red-300 border-red-700";

    toast.className = base + " " + styles;
    toast.textContent = message;
    wrap.appendChild(toast);

    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3200);
  }

  function setMaterialFields(material) {
    var m = material || {};
    setFieldValue("idMaterial", m.idMaterial || "");
    setFieldValue("unidadBase", m.unidadBase || "");
    setFieldValue("stockActual", formatNumber(m.stockActual || 0));
    setFieldValue("precio", formatNumber(m.precio || 0));
    setFieldValue("inversionTotal", formatNumber(m.inversionTotal || 0));
    setFieldValue("activo", m.activo ? "TRUE" : "FALSE");
  }

  function updateProjectedSummary() {
    var stockActual = Number(document.getElementById("stockActual").value || 0);
    var cantidadIngreso = Number(document.getElementById("cantidadIngreso").value || 0);
    var precio = Number(document.getElementById("precio").value || 0);
    var stockProyectado = stockActual + (cantidadIngreso > 0 ? cantidadIngreso : 0);
    var inversion = stockProyectado * (precio > 0 ? precio : 0);

    document.getElementById("inversionTotal").value = formatNumber(inversion);
    document.getElementById("activo").value = stockProyectado > 0 ? "TRUE" : "FALSE";
  }

  function resetFormulario() {
    setFieldValue("idMaterial", "");
    setFieldValue("nombreMaterial", "");
    setFieldValue("unidadBase", "");
    setFieldValue("stockActual", "0");
    setFieldValue("cantidadIngreso", "0");
    setFieldValue("precio", "0");
    setFieldValue("inversionTotal", "0");
    setFieldValue("activo", "FALSE");

    var datalist = document.getElementById("sugerenciasMateriales");
    if (datalist) datalist.innerHTML = "";
  }

  function renderSugerencias(sugerencias) {
    var datalist = document.getElementById("sugerenciasMateriales");
    if (!datalist) return;

    datalist.innerHTML = "";
    (sugerencias || []).forEach(function (material) {
      var option = document.createElement("option");
      option.value = material.nombreMaterial;
      datalist.appendChild(option);
    });
  }

  function renderTabla(materiales) {
    var tbody = document.getElementById("tablaMateriaPrimaBody");
    var totalEl = document.getElementById("totalInversionMateriaPrima");
    var totalInversion = 0;

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!materiales || materiales.length === 0) {
      if (totalEl) totalEl.textContent = "Total: C$ 0";
      var emptyRow = document.createElement("tr");
      emptyRow.innerHTML = '<td colspan="7" class="py-3 text-slate-500">No hay registros en Materia_Prima.</td>';
      tbody.appendChild(emptyRow);
      return;
    }

    materiales.forEach(function (material) {
      totalInversion += Number(material.inversionTotal || 0);

      var tr = document.createElement("tr");
      tr.className = "border-b border-slate-800";
      tr.innerHTML = [
        '<td class="py-2 pr-3">' + (material.idMaterial || "") + "</td>",
        '<td class="py-2 pr-3">' + (material.nombreMaterial || "") + "</td>",
        '<td class="py-2 pr-3">' + (material.unidadBase || "") + "</td>",
        '<td class="py-2 pr-3">' + formatNumber(material.stockActual || 0) + "</td>",
        '<td class="py-2 pr-3">' + formatNumber(material.precio || 0) + "</td>",
        '<td class="py-2 pr-3">' + formatNumber(material.inversionTotal || 0) + "</td>",
        '<td class="py-2 pr-3">' + (material.activo ? "TRUE" : "FALSE") + "</td>"
      ].join("");
      tbody.appendChild(tr);
    });

    if (totalEl) {
      totalEl.textContent = "Total: " + formatCurrency(totalInversion);
    }
  }

  window.MateriaPrimaView = {
    showEstado: showEstado,
    clearEstado: clearEstado,
    showToast: showToast,
    setMaterialFields: setMaterialFields,
    updateProjectedSummary: updateProjectedSummary,
    resetFormulario: resetFormulario,
    renderSugerencias: renderSugerencias,
    renderTabla: renderTabla
  };
})();
