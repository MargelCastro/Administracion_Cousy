/**
 * sessionService.gs - Manejo de sesiones (token) en CacheService
 */
var SessionService = {
  _CACHE_PREFIX: "cousySession:",
  _TTL_SECONDS: 60 * 30, // 30 minutos

  _cache: function () {
    return CacheService.getScriptCache();
  },

  _key: function (token) {
    return this._CACHE_PREFIX + String(token || "");
  },

  _newToken: function () {
    var a = Utilities.getUuid().replace(/-/g, "");
    var b = Utilities.getUuid().replace(/-/g, "");
    return a + b;
  },

  create: function (usuario, rol) {
    var token = this._newToken();
    var payload = {
      usuario: String(usuario || ""),
      rol: String(rol || "N/D"),
      issuedAt: new Date().toISOString()
    };
    this._cache().put(this._key(token), JSON.stringify(payload), this._TTL_SECONDS);
    return token;
  },

  get: function (token) {
    if (!token) return null;
    try {
      var raw = this._cache().get(this._key(token));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  revoke: function (token) {
    if (!token) return false;
    try {
      this._cache().remove(this._key(token));
      return true;
    } catch (e) {
      return false;
    }
  }
};

