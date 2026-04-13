/**
 * authService.gs - Servicio que maneja la lógica de validación de usuarios
 */
var AuthService = {
  validarCredenciales: function(usuarioIngresado, passwordIngresado, callback) {
    if (!usuarioIngresado || !passwordIngresado) {
      return ResponseService.error("Usuario y contraseña son requeridos.", 400, callback);
    }

    // Rate limiting básico por usuario (mitiga fuerza bruta sobre JSONP público)
    try {
      var rlCache = CacheService.getScriptCache();
      var rlKey = "cousyLoginAttempts:" + String(usuarioIngresado || "").trim().toLowerCase();
      var current = parseInt(rlCache.get(rlKey) || "0", 10) || 0;
      if (current >= 10) {
        return ResponseService.error("Demasiados intentos. Intente de nuevo en unos minutos.", 429, callback);
      }
      rlCache.put(rlKey, String(current + 1), 60 * 10); // 10 min
    } catch (e) {
      // si CacheService falla, no bloquea login
    }

    const hojaUsuarios = SheetService.getSheetByName('Users_system');
    
    if (!hojaUsuarios.success) {
      return ResponseService.error(hojaUsuarios.message, 500, callback);
    }
    
    const hoja = hojaUsuarios.sheet;
    const lastRow = hoja.getLastRow();
    
    if (lastRow < 2) {
      return ResponseService.error("No hay usuarios registrados en el sistema.", 404, callback);
    }

    const rango = hoja.getRange(2, 1, lastRow - 1, 4); 
    const datos = rango.getValues();

    for (let i = 0; i < datos.length; i++) {
       let usuarioGuardado = datos[i][0] ? datos[i][0].toString().trim() : ''; 
       let passwordGuardado = datos[i][1] ? datos[i][1].toString().trim() : ''; 
       let rolGuardado = datos[i][2] ? datos[i][2].toString().trim() : 'Admin';
       let esActivo = datos[i][3] === true || (typeof datos[i][3] === 'string' && datos[i][3].toUpperCase() === 'TRUE');
      
       if (usuarioGuardado === usuarioIngresado && passwordGuardado === passwordIngresado) {
          
          if (!esActivo) {
             return ResponseService.error("Cuenta deshabilitada. Contacte al administrador.", 403, callback);
          }

          try {
            var rlCacheOk = CacheService.getScriptCache();
            var rlKeyOk = "cousyLoginAttempts:" + String(usuarioIngresado || "").trim().toLowerCase();
            rlCacheOk.remove(rlKeyOk);
          } catch (e) {}

          var token = SessionService.create(usuarioGuardado, rolGuardado);
          return ResponseService.success({
            usuario: usuarioGuardado,
            rol: rolGuardado,
            token: token,
            message: "Autenticación exitosa."
          }, callback);
       }
    }

    return ResponseService.error("Credenciales incorrectas.", 401, callback);
  }
};
