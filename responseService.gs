/**
 * responseService.gs - Herramienta para estandarizar las respuestas JSON
 */
var ResponseService = {
  
  success: function(data, callback) {
    return this._buildJsonResponse({
      success: true,
      ...data
    }, callback);
  },

  error: function(message, code, callback) {
    const finalCode = typeof code === 'number' ? code : 400;
    return this._buildJsonResponse({
      success: false,
      message: message,
      code: finalCode
    }, callback);
  },

  _buildJsonResponse: function(payload, callback) {
    const stringifiedPayload = JSON.stringify(payload);

    if (callback) {
      const callbackName = String(callback);
      const isValidCallback = /^[a-zA-Z_$][0-9a-zA-Z_$\.]*$/.test(callbackName);
      if (!isValidCallback) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: "Callback inválido.", code: 400 })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService.createTextOutput(callbackName + "(" + stringifiedPayload + ");")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(stringifiedPayload).setMimeType(ContentService.MimeType.JSON);
  }
};
