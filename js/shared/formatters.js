(function () {
  function formatNumber(value, decimals) {
    var totalDecimals = typeof decimals === "number" ? decimals : 2;
    var n = Number(value || 0);
    if (!isFinite(n)) return "0";

    var factor = Math.pow(10, totalDecimals);
    var rounded = Math.round((n + Number.EPSILON) * factor) / factor;
    return Number.isInteger(rounded) ? String(rounded.toFixed(0)) : String(rounded);
  }

  function formatCurrency(value, symbol) {
    var currencySymbol = symbol || "C$";
    return currencySymbol + " " + formatNumber(value, 2);
  }

  window.SharedFormatters = {
    formatNumber: formatNumber,
    formatCurrency: formatCurrency
  };
})();
