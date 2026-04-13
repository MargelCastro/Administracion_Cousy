(function () {
  function getScriptUrl() {
    return window.APP_CONFIG && window.APP_CONFIG.SCRIPT_URL
      ? window.APP_CONFIG.SCRIPT_URL
      : "";
  }

  function getAuthToken() {
    try {
      return sessionStorage.getItem("cousyAuthToken") || "";
    } catch (_) {
      return "";
    }
  }

  function jsonpRequest(params, options) {
    const settings = options || {};
    const timeoutMs = typeof settings.timeoutMs === "number" ? settings.timeoutMs : 12000;
    const callbackPrefix = settings.callbackPrefix || "cbAppScript";

    return new Promise(function (resolve, reject) {
      const scriptUrl = getScriptUrl();
      if (!scriptUrl) {
        reject(new Error("No hay URL de API configurada."));
        return;
      }

      const callbackName = callbackPrefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const scriptTag = document.createElement("script");
      var timer = null;

      function cleanup() {
        if (timer) clearTimeout(timer);
        if (scriptTag.parentNode) scriptTag.parentNode.removeChild(scriptTag);
        try {
          delete window[callbackName];
        } catch (_) {
          window[callbackName] = undefined;
        }
      }

      window[callbackName] = function (data) {
        cleanup();
        resolve(data);
      };

      timer = setTimeout(function () {
        cleanup();
        reject(new Error("Timeout de conexión con Apps Script."));
      }, timeoutMs);

      var authToken = getAuthToken();
      var enrichedParams = Object.assign({}, params);
      if (authToken && !enrichedParams.authToken && !enrichedParams.token && enrichedParams.accion !== "login") {
        enrichedParams.authToken = authToken;
      }
      var query = new URLSearchParams(Object.assign({}, enrichedParams, { callback: callbackName }));
      scriptTag.src = scriptUrl + "?" + query.toString();
      scriptTag.async = true;
      scriptTag.onerror = function () {
        cleanup();
        reject(new Error("No se pudo cargar la API remota."));
      };

      document.body.appendChild(scriptTag);
    });
  }

  window.AppScriptClient = {
    jsonpRequest: jsonpRequest
  };
})();
