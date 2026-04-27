/**
 * tarifasService.gs - Lectura de hoja Tarifas (Google Sheets)
 */
var TarifasService = {
  listar: function(callback) {
    var result = SheetService.getSheetByName("Tarifas");
    if (!result || result.success !== true || !result.sheet) {
      return ResponseService.error((result && result.message) ? result.message : "No se pudo abrir la hoja Tarifas.", 400, callback);
    }

    var sheet = result.sheet;
    var values = sheet.getDataRange().getValues();
    if (!values || values.length < 2) {
      return ResponseService.success({ tarifas: [] }, callback);
    }

    var headerRow = values[0] || [];
    var headers = headerRow.map(function (h) { return TarifasService._normalizeKey(h); });

    var idxCodigo = headers.indexOf("codigo");
    var idxPrecioDia = headers.indexOf("precio_dia");
    var idxPrecioMedioDia = headers.indexOf("precio_medio_dia");
    var idxEstado = headers.indexOf("estado");

    if (idxCodigo === -1 || idxPrecioDia === -1 || idxEstado === -1) {
      return ResponseService.error("Encabezados inválidos en hoja Tarifas. Se esperan: Codigo, Precio dia, Precio medio dia (opcional), Estado.", 400, callback);
    }

    var tarifas = [];

    for (var i = 1; i < values.length; i++) {
      var row = values[i] || [];
      var codigo = String(row[idxCodigo] || "").trim();
      if (!codigo) continue;

      var precioDia = TarifasService._toNumber(row[idxPrecioDia]);
      var precioMedioDia = idxPrecioMedioDia !== -1 ? TarifasService._toNumber(row[idxPrecioMedioDia]) : 0;
      var estado = String(row[idxEstado] || "").trim();

      tarifas.push({
        codigo: codigo,
        precioDia: precioDia,
        precioMedioDia: precioMedioDia,
        estado: estado
      });
    }

    return ResponseService.success({ tarifas: tarifas }, callback);
  },

  _toNumber: function(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return isFinite(value) ? value : 0;
    var raw = String(value).trim();
    if (!raw) return 0;
    raw = raw.replace(/[^0-9,.\-]/g, "").replace(",", ".");
    var parsed = parseFloat(raw);
    return isFinite(parsed) ? parsed : 0;
  },

  _normalizeKey: function(value) {
    var raw = String(value || "").trim().toLowerCase();
    try {
      raw = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (_) {}
    raw = raw.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    return raw;
  }
};
