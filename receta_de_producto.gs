/**
 * receta_de_producto.gs - Modulo de Receta de Producto
 */
var RecetaProductoController = {
  ACTIONS: {
    MATERIALES: "recetaProductoMateriales",
    GUARDAR: "recetaProductoGuardar",
    LISTAR_PRODUCTOS: "productoListar"
  },

  esAccionRecetaProducto: function(accion) {
    return accion === this.ACTIONS.MATERIALES ||
      accion === this.ACTIONS.GUARDAR ||
      accion === this.ACTIONS.LISTAR_PRODUCTOS;
  },

  manejarAccion: function(accion, params, callback) {
    switch (accion) {
      case this.ACTIONS.MATERIALES:
        return RecetaProductoService.obtenerMateriales(callback);
      case this.ACTIONS.GUARDAR:
        return RecetaProductoService.guardarReceta(params, callback);
      case this.ACTIONS.LISTAR_PRODUCTOS:
        return RecetaProductoService.listarProductos(callback);
      default:
        return ResponseService.error("Acción de Receta de Producto no reconocida.", 400, callback);
    }
  }
};

var RecetaProductoService = {
  MATERIALES_SHEET: "Materia_Prima",
  RECETA_SHEET: "Receta_de_Producto",
  PRODUCTOS_SHEET: "Producto",

  _toNumber: function(value) {
    if (value === null || value === undefined || value === "") return 0;
    const normalized = String(value).replace(/,/g, ".");
    const parsed = Number(normalized);
    return isNaN(parsed) ? 0 : parsed;
  },

  _round3: function(value) {
    return Math.round((this._toNumber(value) + Number.EPSILON) * 1000) / 1000;
  },

  _parsePayload: function(params) {
    if (!params || !params.payload) return {};
    if (typeof params.payload === "object") return params.payload;

    try {
      return JSON.parse(String(params.payload));
    } catch (_) {
      return {};
    }
  },

  _parseCategorias: function(payload) {
    if (payload && Array.isArray(payload.categorias)) {
      const categorias = [];
      for (var i = 0; i < payload.categorias.length; i++) {
        const item = payload.categorias[i] ? String(payload.categorias[i]).trim() : "";
        if (item && categorias.indexOf(item) === -1) categorias.push(item);
      }
      return categorias;
    }

    const raw = payload && payload.categoria ? String(payload.categoria) : "";
    if (!raw) return [];

    const parts = raw.split(",");
    const list = [];
    for (var j = 0; j < parts.length; j++) {
      const categoria = parts[j] ? String(parts[j]).trim() : "";
      if (categoria && list.indexOf(categoria) === -1) list.push(categoria);
    }
    return list;
  },

  _sheetOrError: function(sheetName, callback) {
    const sheetResp = SheetService.getSheetByName(sheetName);
    if (!sheetResp.success) {
      return { error: ResponseService.error(sheetResp.message, 500, callback) };
    }
    return { sheet: sheetResp.sheet };
  },

  _ensureSheet: function(sheetName, headers) {
    const ss = SheetService.getSpreadsheet();
    if (!ss) {
      throw new Error("No se pudo acceder al documento base de Google Sheets.");
    }

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    const currentHeaders = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, headers.length).getValues()[0]
      : [];
    let requiresHeaders = currentHeaders.length < headers.length;

    if (!requiresHeaders) {
      for (var i = 0; i < headers.length; i++) {
        if (String(currentHeaders[i] || "").trim() !== headers[i]) {
          requiresHeaders = true;
          break;
        }
      }
    }

    if (requiresHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#0f3d6e")
        .setFontColor("#ffffff");
    }

    return sheet;
  },

  _getHeaderMap: function(sheet) {
    const lastColumn = Math.max(sheet.getLastColumn(), 8);
    const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const map = {};

    for (var i = 0; i < headerRow.length; i++) {
      const key = headerRow[i] ? String(headerRow[i]).trim().toLowerCase() : "";
      if (key) map[key] = i;
    }

    return map;
  },

  _columnValue: function(rowValues, headerMap, aliases, fallbackIndex) {
    for (var i = 0; i < aliases.length; i++) {
      const key = aliases[i].toLowerCase();
      if (headerMap.hasOwnProperty(key)) {
        return rowValues[headerMap[key]];
      }
    }
    return rowValues[fallbackIndex];
  },

  _normalizeText: function(value) {
    return (value || "")
      .toString()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  },

  _buildProductPrefix: function(nombreProducto) {
    const normalized = this._normalizeText(nombreProducto).replace(/[^A-Z0-9 ]/g, " ");
    const words = normalized.split(/\s+/).filter(function(part) {
      return !!part;
    });

    let prefix = "";
    for (var i = 0; i < words.length; i++) {
      prefix += words[i].charAt(0);
      if (prefix.length >= 4) break;
    }

    if (prefix.length < 4 && words.length > 0) {
      prefix = (words[0] + prefix).replace(/[^A-Z0-9]/g, "").slice(0, 4);
    }

    if (prefix.length < 4) {
      prefix = (prefix + "PROD").slice(0, 4);
    }

    return prefix;
  },

  _nextProductId: function(sheet, nombreProducto) {
    const prefix = this._buildProductPrefix(nombreProducto);
    const lastRow = sheet.getLastRow();
    let max = 0;

    if (lastRow >= 2) {
      const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < values.length; i++) {
        const raw = values[i][0] ? String(values[i][0]).trim().toUpperCase() : "";
        const match = raw.match(/^([A-Z0-9]{4})-(\d+)$/);
        if (match && match[1] === prefix) {
          const current = parseInt(match[2], 10);
          if (!isNaN(current) && current > max) max = current;
        }
      }
    }

    return prefix + "-" + String(max + 1).padStart(3, "0");
  },

  _boolFromCell: function(value) {
    if (value === true) return true;
    if (typeof value === "string") return value.toUpperCase() === "TRUE";
    return false;
  },

  _getMaterialesMap: function(callback) {
    const sheetResp = this._sheetOrError(this.MATERIALES_SHEET, callback);
    if (sheetResp.error) return sheetResp;

    const sheet = sheetResp.sheet;
    const lastRow = sheet.getLastRow();
    const map = {};

    if (lastRow < 2) {
      return { map: map };
    }

    const headerMap = this._getHeaderMap(sheet);
    const rows = sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), 8)).getValues();

    for (var i = 0; i < rows.length; i++) {
      const row = rows[i];
      const idMaterialRaw = this._columnValue(row, headerMap, ["id_material", "id material"], 0);
      const idMaterial = idMaterialRaw ? String(idMaterialRaw).trim() : "";
      if (!idMaterial) continue;

      map[idMaterial] = {
        idMaterial: idMaterial,
        nombreMaterial: this._columnValue(row, headerMap, ["nombre_material", "nombre material"], 1) ? String(this._columnValue(row, headerMap, ["nombre_material", "nombre material"], 1)).trim() : "",
        unidadBase: this._columnValue(row, headerMap, ["unidad_base", "unidad base"], 2) ? String(this._columnValue(row, headerMap, ["unidad_base", "unidad base"], 2)).trim() : "",
        precio: this._round3(this._columnValue(row, headerMap, ["precio"], 4)),
        stockActual: this._round3(this._columnValue(row, headerMap, ["stock_actual", "stock actual"], 3)),
        activo: this._boolFromCell(this._columnValue(row, headerMap, ["activo"], 6)),
        contenidoUnidad: this._round3(this._columnValue(row, headerMap, ["contenido_unidad", "contenido unidad", "contenido_por_unidad", "contenido por unidad"], 7)) || 1
      };
    }

    return { map: map };
  },

  obtenerMateriales: function(callback) {
    try {
      const materialesMapResp = this._getMaterialesMap(callback);
      if (materialesMapResp.error) return materialesMapResp.error;

      const materialesMap = materialesMapResp.map;
      const materiales = [];

      for (var key in materialesMap) {
        if (!materialesMap.hasOwnProperty(key)) continue;
        const item = materialesMap[key];
        if (!item.activo) continue;
        materiales.push(item);
      }

      materiales.sort(function(a, b) {
        return a.nombreMaterial.localeCompare(b.nombreMaterial);
      });

      return ResponseService.success({ materiales: materiales }, callback);
    } catch (error) {
      return ResponseService.error("Error obteniendo materiales para receta: " + error.message, 500, callback);
    }
  },

  guardarReceta: function(params, callback) {
    try {
      const payload = this._parsePayload(params);
      const nombreProducto = payload && payload.nombreProducto ? String(payload.nombreProducto).trim() : "";
      const categorias = this._parseCategorias(payload);
      const urlImagen = payload && payload.urlImagen ? String(payload.urlImagen).trim() : "";
      const materiales = payload && Array.isArray(payload.materiales) ? payload.materiales : [];

      if (!nombreProducto) {
        return ResponseService.error("El nombre del producto es obligatorio.", 400, callback);
      }

      if (categorias.length === 0) {
        return ResponseService.error("Debes seleccionar al menos una categoria.", 400, callback);
      }

      if (materiales.length === 0) {
        return ResponseService.error("Debes enviar al menos un material.", 400, callback);
      }

      const materialesMapResp = this._getMaterialesMap(callback);
      if (materialesMapResp.error) return materialesMapResp.error;

      const materialesMap = materialesMapResp.map;
      const recetaSheet = this._ensureSheet(this.RECETA_SHEET, [
        "ID_Producto",
        "ID_Material",
        "Cantidad_Por_Unidad",
        "Porcentaje_Desperdicio",
        "Cantidad_Real"
      ]);
      const productosSheet = this._ensureSheet(this.PRODUCTOS_SHEET, [
        "ID_Producto",
        "Nombre_Producto",
        "Categoria",
        "Estado",
        "Fecha_Creacion",
        "Imagen",
        "Total_Materiales"
      ]);

      const productoId = this._nextProductId(productosSheet, nombreProducto);
      const fecha = new Date();
      const recipeRows = [];

      for (var i = 0; i < materiales.length; i++) {
        const item = materiales[i];
        const idMaterial = item && item.idMaterial ? String(item.idMaterial).trim() : "";
        const cantidad = this._round3(item ? item.cantidadPorUnidad : 0);
        const desperdicio = this._round3(item ? item.porcentajeDesperdicio : 0);

        if (!idMaterial || cantidad <= 0) continue;

        const materialBase = materialesMap[idMaterial];
        if (!materialBase) {
          return ResponseService.error("No se encontró el material con ID: " + idMaterial, 400, callback);
        }

        const cantidadReal = this._round3(cantidad * (1 + (desperdicio / 100)));
        recipeRows.push([
          productoId,
          idMaterial,
          cantidad,
          desperdicio / 100,
          cantidadReal
        ]);
      }

      if (recipeRows.length === 0) {
        return ResponseService.error("Debes ingresar al menos un material válido.", 400, callback);
      }

      recetaSheet.getRange(recetaSheet.getLastRow() + 1, 1, recipeRows.length, recipeRows[0].length).setValues(recipeRows);
      productosSheet.getRange(productosSheet.getLastRow() + 1, 1, 1, 7).setValues([[
        productoId,
        nombreProducto,
        categorias.join(", "),
        "Activo",
        fecha,
        urlImagen,
        recipeRows.length
      ]]);

      return ResponseService.success({
        message: "Receta y producto guardados correctamente.",
        productoId: productoId,
        totalMateriales: recipeRows.length
      }, callback);
    } catch (error) {
      return ResponseService.error("Error guardando Receta de Producto: " + error.message, 500, callback);
    }
  },

  listarProductos: function(callback) {
    try {
      const sheetResp = this._sheetOrError(this.PRODUCTOS_SHEET, callback);
      if (sheetResp.error) return sheetResp.error;

      const sheet = sheetResp.sheet;
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return ResponseService.success({ productos: [] }, callback);
      }

      const headerMap = this._getHeaderMap(sheet);
      const rows = sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), 7)).getValues();
      const productos = [];

      for (var i = 0; i < rows.length; i++) {
        const row = rows[i];
        const idProducto = this._columnValue(row, headerMap, ["id_producto", "id producto"], 0);
        if (!idProducto) continue;

        productos.push({
          idProducto: String(idProducto).trim(),
          nombreProducto: this._columnValue(row, headerMap, ["nombre_producto", "nombre producto"], 1) ? String(this._columnValue(row, headerMap, ["nombre_producto", "nombre producto"], 1)).trim() : "",
          categoria: this._columnValue(row, headerMap, ["categoria"], 2) ? String(this._columnValue(row, headerMap, ["categoria"], 2)).trim() : "",
          categorias: this._columnValue(row, headerMap, ["categoria"], 2) ? String(this._columnValue(row, headerMap, ["categoria"], 2)).split(",").map(function(item) {
            return String(item).trim();
          }).filter(function(item) {
            return !!item;
          }) : [],
          estado: this._columnValue(row, headerMap, ["estado"], 3) ? String(this._columnValue(row, headerMap, ["estado"], 3)).trim() : "",
          fechaCreacion: this._columnValue(row, headerMap, ["fecha_creacion", "fecha creacion"], 4),
          imagen: this._columnValue(row, headerMap, ["imagen"], 5) ? String(this._columnValue(row, headerMap, ["imagen"], 5)).trim() : "",
          totalMateriales: this._toNumber(this._columnValue(row, headerMap, ["total_materiales", "total materiales"], 6))
        });
      }

      productos.sort(function(a, b) {
        return String(b.fechaCreacion || "").localeCompare(String(a.fechaCreacion || ""));
      });

      return ResponseService.success({ productos: productos }, callback);
    } catch (error) {
      return ResponseService.error("Error listando productos: " + error.message, 500, callback);
    }
  }
};
