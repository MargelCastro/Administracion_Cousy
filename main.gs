/**
 * main.gs - Controlador principal de la API
 */

function parseRequestParams(e) {
  const rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
  const contentType = (e && e.postData && e.postData.type) ? String(e.postData.type).toLowerCase() : "";
  let params = (e && e.parameter) ? e.parameter : {};

  if (rawBody) {
    const looksLikeJson = contentType.indexOf("application/json") !== -1 || rawBody.trim().charAt(0) === "{";
    if (looksLikeJson) {
      try {
        params = JSON.parse(rawBody);
      } catch (jsonError) {
        // fallback a e.parameter
      }
    }
  }

  return params;
}

function routeAction(params, callback) {
  const accion = params && params.accion ? String(params.accion) : "";

  if (!accion) {
    return ResponseService.error("No se especificó ninguna acción.", 400, callback);
  }

  // Requerir autenticación para todas las acciones excepto login.
  if (accion !== "login") {
    var authToken = (params && (params.authToken || params.token)) ? String(params.authToken || params.token) : "";
    var session = SessionService.get(authToken);
    if (!session) {
      return ResponseService.error("No autorizado. Inicie sesión nuevamente.", 401, callback);
    }
    // Si se necesita, session.rol/session.usuario están disponibles aquí.
  }

  switch (accion) {
    case "login":
      return AuthController.login(params, callback);
    default:
      if (typeof MateriaPrimaController !== "undefined" && MateriaPrimaController.esAccionMateriaPrima(accion)) {
        return MateriaPrimaController.manejarAccion(accion, params, callback);
      }
      if (typeof RecetaProductoController !== "undefined" && RecetaProductoController.esAccionRecetaProducto(accion)) {
        return RecetaProductoController.manejarAccion(accion, params, callback);
      }
      return ResponseService.error("Acción no reconocida.", 400, callback);
  }
}

function doPost(e) {
  try {
    const params = parseRequestParams(e);
    return routeAction(params, null);
  } catch (error) {
    return ResponseService.error("Error interno del servidor", 500, null);
  }
}

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const callback = params.callback || params.cb || null;
    if (!params.accion) {
      return ResponseService.success({ message: "La API está en línea y lista para usarse." }, callback);
    }
    return routeAction(params, callback);
  } catch (error) {
    const cb = (e && e.parameter) ? (e.parameter.callback || e.parameter.cb) : null;
    return ResponseService.error("Error interno del servidor", 500, cb);
  }
}

var AuthController = {
  login: function(params, callback) {
    return AuthService.validarCredenciales(params.usuario, params.password, callback);
  }
};
