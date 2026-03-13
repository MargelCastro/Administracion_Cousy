/**
 * materiaPrimaService.gs - Gestion de hoja Materia_Prima
 */
var MateriaPrimaService = {
  SHEET_NAME: "Materia_Prima",

  _normalizarTexto: function(value) {
    return (value || "")
      .toString()
      .trim()
      .toLowerCase();
  },

  _toNumber: function(value) {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = Number(String(value).replace(/,/g, "."));
    return isNaN(parsed) ? 0 : parsed;
  },

  _round2: function(value) {
    return Math.round((this._toNumber(value) + Number.EPSILON) * 100) / 100;
  },

  _boolFromCell: function(value) {
    if (value === true) return true;
    if (typeof value === "string") return value.toUpperCase() === "TRUE";
    return false;
  },

  _sheetOrError: function(callback) {
    const sheetResp = SheetService.getSheetByName(this.SHEET_NAME);
    if (!sheetResp.success) {
      return { error: ResponseService.error(sheetResp.message, 500, callback) };
    }
    return { sheet: sheetResp.sheet };
  },

  _getHeaders: function(sheet) {
    const lastColumn = Math.max(sheet.getLastColumn(), 7);
    const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const map = {};

    for (let i = 0; i < headerRow.length; i++) {
      const key = headerRow[i] ? String(headerRow[i]).trim().toLowerCase() : "";
      if (key) map[key] = i;
    }

    return map;
  },

  _columnValue: function(rowValues, headerMap, aliases, fallbackIndex) {
    for (let i = 0; i < aliases.length; i++) {
      const key = aliases[i].toLowerCase();
      if (headerMap.hasOwnProperty(key)) {
        return rowValues[headerMap[key]];
      }
    }
    return rowValues[fallbackIndex];
  },

  _getRows: function(sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    return sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  },

  _rowToMaterial: function(rowValues, rowNumber, headerMap) {
    const stock = this._round2(this._columnValue(rowValues, headerMap, ["stock_actual", "stock actual"], 3));
    const precio = this._round2(this._columnValue(rowValues, headerMap, ["precio"], 4));
    const inversion = this._round2(this._columnValue(rowValues, headerMap, ["inversión_total", "inversion_total", "inversión total", "inversion total"], 5));
    return {
      rowNumber: rowNumber,
      idMaterial: this._columnValue(rowValues, headerMap, ["id_material", "id material"], 0) ? String(this._columnValue(rowValues, headerMap, ["id_material", "id material"], 0)).trim() : "",
      nombreMaterial: this._columnValue(rowValues, headerMap, ["nombre_material", "nombre material"], 1) ? String(this._columnValue(rowValues, headerMap, ["nombre_material", "nombre material"], 1)).trim() : "",
      unidadBase: this._columnValue(rowValues, headerMap, ["unidad_base", "unidad base"], 2) ? String(this._columnValue(rowValues, headerMap, ["unidad_base", "unidad base"], 2)).trim() : "",
      stockActual: stock,
      precio: precio,
      inversionTotal: inversion,
      activo: this._boolFromCell(this._columnValue(rowValues, headerMap, ["activo"], 6))
    };
  },

  _nextId: function(materiales) {
    let max = 0;
    for (let i = 0; i < materiales.length; i++) {
      const id = materiales[i].idMaterial || "";
      const match = id.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    const next = max + 1;
    return "MAT-" + String(next).padStart(6, "0");
  },

  _findByName: function(materiales, nombreMaterial) {
    const objetivo = this._normalizarTexto(nombreMaterial);
    for (let i = 0; i < materiales.length; i++) {
      if (this._normalizarTexto(materiales[i].nombreMaterial) === objetivo) {
        return materiales[i];
      }
    }
    return null;
  },

  listar: function(callback) {
    try {
      const sheetResp = this._sheetOrError(callback);
      if (sheetResp.error) return sheetResp.error;

      const sheet = sheetResp.sheet;
      const headerMap = this._getHeaders(sheet);
      const rows = this._getRows(sheet);
      const materiales = [];

      for (let i = 0; i < rows.length; i++) {
        materiales.push(this._rowToMaterial(rows[i], i + 2, headerMap));
      }

      return ResponseService.success({ materiales: materiales }, callback);
    } catch (error) {
      return ResponseService.error("Error listando Materia_Prima: " + error.message, 500, callback);
    }
  },

  buscarSimilares: function(query, callback) {
    try {
      const q = this._normalizarTexto(query);
      if (!q) {
        return ResponseService.success({ sugerencias: [] }, callback);
      }

      const sheetResp = this._sheetOrError(callback);
      if (sheetResp.error) return sheetResp.error;

      const headerMap = this._getHeaders(sheetResp.sheet);
      const rows = this._getRows(sheetResp.sheet);
      const sugerencias = [];

      for (let i = 0; i < rows.length; i++) {
        const material = this._rowToMaterial(rows[i], i + 2, headerMap);
        if (this._normalizarTexto(material.nombreMaterial).indexOf(q) !== -1) {
          sugerencias.push(material);
        }
      }

      return ResponseService.success({ sugerencias: sugerencias.slice(0, 10) }, callback);
    } catch (error) {
      return ResponseService.error("Error buscando materiales: " + error.message, 500, callback);
    }
  },

  obtenerPreview: function(nombreMaterial, callback) {
    try {
      const sheetResp = this._sheetOrError(callback);
      if (sheetResp.error) return sheetResp.error;

      const headerMap = this._getHeaders(sheetResp.sheet);
      const rows = this._getRows(sheetResp.sheet);
      const materiales = [];
      for (let i = 0; i < rows.length; i++) {
        materiales.push(this._rowToMaterial(rows[i], i + 2, headerMap));
      }

      const existente = this._findByName(materiales, nombreMaterial);
      if (existente) {
        return ResponseService.success({
          existe: true,
          material: existente
        }, callback);
      }

      return ResponseService.success({
        existe: false,
        material: {
          idMaterial: this._nextId(materiales),
          nombreMaterial: nombreMaterial || "",
          unidadBase: "",
          stockActual: 0,
          precio: 0,
          inversionTotal: 0,
          activo: false
        }
      }, callback);
    } catch (error) {
      return ResponseService.error("Error obteniendo preview: " + error.message, 500, callback);
    }
  },

  guardar: function(params, callback) {
    try {
      const nombreMaterial = params && params.nombreMaterial ? String(params.nombreMaterial).trim() : "";
      const unidadBase = params && params.unidadBase ? String(params.unidadBase).trim() : "";
      const cantidadIngreso = this._round2(params ? params.cantidadIngreso : 0);
      const precioIngreso = this._round2(params ? params.precio : 0);

      if (!nombreMaterial) {
        return ResponseService.error("Nombre del material es requerido.", 400, callback);
      }

      if (!unidadBase) {
        return ResponseService.error("Unidad base es requerida.", 400, callback);
      }

      if (cantidadIngreso < 0) {
        return ResponseService.error("La cantidad no puede ser negativa.", 400, callback);
      }

      if (precioIngreso < 0) {
        return ResponseService.error("El precio no puede ser negativo.", 400, callback);
      }

      const sheetResp = this._sheetOrError(callback);
      if (sheetResp.error) return sheetResp.error;

      const sheet = sheetResp.sheet;
      const headerMap = this._getHeaders(sheet);
      const rows = this._getRows(sheet);
      const materiales = [];
      for (let i = 0; i < rows.length; i++) {
        materiales.push(this._rowToMaterial(rows[i], i + 2, headerMap));
      }

      const existente = this._findByName(materiales, nombreMaterial);

      if (existente) {
        const stockNuevo = this._round2(existente.stockActual + cantidadIngreso);
        const precioNuevo = this._round2(precioIngreso);
        const inversionNueva = this._round2(stockNuevo * precioNuevo);
        const activo = stockNuevo > 0;
        const unidadFinal = existente.unidadBase || unidadBase;

        sheet.getRange(existente.rowNumber, 1, 1, 7).setValues([[
          existente.idMaterial,
          existente.nombreMaterial,
          unidadFinal,
          stockNuevo,
          precioNuevo,
          inversionNueva,
          activo
        ]]);

        return ResponseService.success({
          message: "Material actualizado correctamente.",
          material: {
            idMaterial: existente.idMaterial,
            nombreMaterial: existente.nombreMaterial,
            unidadBase: unidadFinal,
            stockActual: stockNuevo,
            precio: precioNuevo,
            inversionTotal: inversionNueva,
            activo: activo
          }
        }, callback);
      }

      const idNuevo = this._nextId(materiales);
      const inversionInicial = this._round2(cantidadIngreso * precioIngreso);
      const activoInicial = cantidadIngreso > 0;

      sheet.insertRowAfter(1);
      const newRowRange = sheet.getRange(2, 1, 1, 7);
      // Inserta en fila 2 con estilo limpio: sin color heredado y texto negro.
      newRowRange.clearFormat();
      newRowRange
        .setBackground("white")
        .setFontColor("black")
        .setFontWeight("normal");
      newRowRange.setValues([[
        idNuevo,
        nombreMaterial,
        unidadBase,
        cantidadIngreso,
        precioIngreso,
        inversionInicial,
        activoInicial
      ]]);

      return ResponseService.success({
        message: "Material creado correctamente.",
        material: {
          idMaterial: idNuevo,
          nombreMaterial: nombreMaterial,
          unidadBase: unidadBase,
          stockActual: cantidadIngreso,
          precio: precioIngreso,
          inversionTotal: inversionInicial,
          activo: activoInicial
        }
      }, callback);
    } catch (error) {
      return ResponseService.error("Error guardando Materia_Prima: " + error.message, 500, callback);
    }
  }
};
