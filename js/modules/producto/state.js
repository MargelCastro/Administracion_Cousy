(function () {
  var state = {
    productos: [],
    selectedProductoIds: []
  };

  function setProductos(productos) {
    state.productos = Array.isArray(productos) ? productos : [];
  }

  function getProductos() {
    return state.productos.slice();
  }

  function getSelectedProductoIds() {
    return state.selectedProductoIds.slice();
  }

  function setSelectedProductoIds(productoIds) {
    state.selectedProductoIds = Array.isArray(productoIds)
      ? productoIds.map(function (id) { return String(id || ""); }).filter(Boolean)
      : [];
  }

  function isSelected(productoId) {
    return state.selectedProductoIds.indexOf(String(productoId || "")) !== -1;
  }

  function toggleSelected(productoId) {
    var normalizedId = String(productoId || "");
    var currentIndex = state.selectedProductoIds.indexOf(normalizedId);
    if (currentIndex === -1) {
      state.selectedProductoIds.push(normalizedId);
      return;
    }
    state.selectedProductoIds.splice(currentIndex, 1);
  }

  window.ProductoState = {
    setProductos: setProductos,
    getProductos: getProductos,
    getSelectedProductoIds: getSelectedProductoIds,
    setSelectedProductoIds: setSelectedProductoIds,
    isSelected: isSelected,
    toggleSelected: toggleSelected
  };
})();
