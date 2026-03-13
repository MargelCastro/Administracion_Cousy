(function () {
  const THEME_KEY = "cousyTheme";

  function getThemeIconSvg() {
    return `
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5 fill-current">
        <path d="M12 2a1 1 0 0 1 1 1v1.2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 16a6 6 0 1 0 0-12v12Zm0 4a1 1 0 0 1-1-1v-1.2a1 1 0 1 1 2 0V21a1 1 0 0 1-1 1ZM4.22 5.64a1 1 0 0 1 1.41 0l.85.85A1 1 0 0 1 5.07 7.9l-.85-.85a1 1 0 0 1 0-1.41Zm13.3 13.3a1 1 0 0 1 1.41 0l.85.85a1 1 0 1 1-1.41 1.41l-.85-.85a1 1 0 0 1 0-1.41ZM2 12a1 1 0 0 1 1-1h1.2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm16.8 0a1 1 0 0 1 1-1H21a1 1 0 1 1 0 2h-1.2a1 1 0 0 1-1-1ZM5.64 19.78a1 1 0 0 1-1.41-1.41l.85-.85a1 1 0 0 1 1.41 1.41l-.85.85Zm13.3-13.3a1 1 0 0 1-1.41-1.41l.85-.85a1 1 0 1 1 1.41 1.41l-.85.85Z"/>
      </svg>
    `;
  }

  function getThemeButtonLabel(isLight) {
    return isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro";
  }

  function decorateThemeButton(btn) {
    if (!btn) return;

    btn.innerHTML = getThemeIconSvg();
    btn.setAttribute("title", getThemeButtonLabel(document.body.classList.contains("light-theme")));
    btn.setAttribute("aria-label", getThemeButtonLabel(document.body.classList.contains("light-theme")));
  }

  function applyTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("light-theme", isLight);

    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      decorateThemeButton(btn);
      const label = getThemeButtonLabel(isLight);
      btn.setAttribute("title", label);
      btn.setAttribute("aria-label", label);
    }
  }

  function toggleTheme() {
    const nextTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  function initTheme() {
    applyTheme(localStorage.getItem(THEME_KEY) || "dark");
  }

  function initStandaloneThemeButton() {
    const btn = document.getElementById("themeToggleBtn");
    if (!btn) return;

    decorateThemeButton(btn);
    btn.addEventListener("click", toggleTheme);
    initTheme();
  }

  window.AppTheme = {
    applyTheme: applyTheme,
    toggleTheme: toggleTheme,
    initTheme: initTheme,
    initStandaloneThemeButton: initStandaloneThemeButton
  };
})();
