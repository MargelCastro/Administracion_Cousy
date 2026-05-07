(function () {
  function readPathname() {
    var currentPath = window.location && typeof window.location.pathname === "string"
      ? window.location.pathname
      : "";
    return currentPath.replace(/\\/g, "/");
  }

  function getBasePath(pathname) {
    var currentPath = (pathname || readPathname()).replace(/\\/g, "/");
    var htmlSectionIndex = currentPath.indexOf("/html/");

    if (htmlSectionIndex >= 0) {
      return currentPath.slice(0, htmlSectionIndex);
    }

    if (/\/index\.html$/i.test(currentPath)) {
      return currentPath.slice(0, -"/index.html".length);
    }

    if (!currentPath || currentPath === "/") {
      return "";
    }

    return currentPath.endsWith("/") ? currentPath.slice(0, -1) : currentPath;
  }

  function isExternalOrHash(path) {
    return /^(https?:)?\/\//.test(path)
      || path.startsWith("#")
      || path.startsWith("mailto:")
      || path.startsWith("tel:")
      || path.startsWith("javascript:");
  }

  function normalizeRelativePath(path) {
    return String(path || "")
      .trim()
      .replace(/^\.\//, "")
      .replace(/^\/+/, "");
  }

  function resolve(path, options) {
    if (!path) return "#";

    var rawPath = String(path).trim();
    if (isExternalOrHash(rawPath) || rawPath.startsWith("/")) {
      return rawPath;
    }

    var basePath = getBasePath(options && options.pathname);
    var normalizedPath = normalizeRelativePath(rawPath);
    return (basePath + "/" + normalizedPath).replace(/\/{2,}/g, "/");
  }

  function toLoginUrl() {
    return resolve("index.html");
  }

  window.PathResolver = {
    getBasePath: getBasePath,
    resolve: resolve,
    toLoginUrl: toLoginUrl
  };
})();
