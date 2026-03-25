/**
 * sheetService.gs - Servicio centralizado para interactuar con Google Sheets
 */
var SPREADSHEET_ID = '1YQbNmPkcx5Ozi9hyqr9dVA4rqKOrlVb-VWo8hqntYyA';

var SheetService = {
  
  getSpreadsheet: function() {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      console.error("Error abriendo Spreadsheet: " + e.message);
      return null;
    }
  },

  getSheetByName: function(sheetName) {
    const ss = this.getSpreadsheet();
    if (!ss) {
      return { success: false, message: "No se pudo acceder al documento base de Google Sheets." };
    }

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return { success: false, message: "No se encontró la hoja con el nombre: " + sheetName };
    }

    return { success: true, sheet: sheet };
  }

};