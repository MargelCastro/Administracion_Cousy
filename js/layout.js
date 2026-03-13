(function () {
  function getRootPrefix() {
    const path = window.location.pathname.replace(/\\/g, "/");
    return path.includes("/html/") ? "../" : "./";
  }

  function resolvePath(path) {
    if (!path) return "#";
    if (/^(https?:)?\/\//.test(path) || path.startsWith("#")) return path;
    if (path.startsWith("/")) return path;
    const normalizedPath = path.replace(/^\.\//, "").replace(/^\//, "");
    return `${getRootPrefix()}${normalizedPath}`;
  }

  function requireSession() {
    if (!sessionStorage.getItem("cousyUsuario")) {
      window.location.replace(resolvePath("index.html"));
      return false;
    }
    return true;
  }

  function logout() {
    try {
      sessionStorage.removeItem("cousyUsuario");
      sessionStorage.removeItem("cousyRol");
    } catch (_) {}

    window.location.replace(resolvePath("index.html"));
  }

  function renderNavItem(item, activeNavId) {
    const isActive = item.id === activeNavId;
    const baseClass = [
      "nav-item",
      "block",
      "w-full",
      "text-left",
      "px-3",
      "py-2.5",
      "rounded-lg",
      "border",
      "border-transparent",
      "text-slate-300",
      "hover:text-emerald-400",
      "hover:border-slate-700",
      "transition-colors"
    ];

    if (isActive) {
      baseClass.push("nav-item-active");
    }

    if (item.href) {
      return `
        <a
          href="${resolvePath(item.href)}"
          class="${baseClass.join(" ")}"
          data-nav-id="${item.id}"
        >
          ${item.label}
        </a>
      `;
    }

    return `
      <button
        type="button"
        class="${baseClass.join(" ")}"
        data-nav-id="${item.id}"
        data-tab-target="${item.tabId || item.id}"
      >
        ${item.label}
      </button>
    `;
  }

  function renderAction(action) {
    const kind = action.kind || "button";
    const variantClass = action.variant === "danger"
      ? "border-red-700 bg-red-900 text-red-300 hover:bg-red-800"
      : "border-slate-700 bg-slate-800 text-slate-200 hover:text-emerald-400";
    const className = `inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${variantClass}`;

    if (kind === "link") {
      return `
        <a
          href="${resolvePath(action.href)}"
          class="${className}"
          id="${action.id || ""}"
        >
          ${action.label}
        </a>
      `;
    }

    return `
      <button
        type="button"
        class="${className}"
        id="${action.id || ""}"
      >
        ${action.label}
      </button>
    `;
  }

  function buildShell(options) {
    const navItems = (options.navItems || []).map((item) => renderNavItem(item, options.activeNavId)).join("");
    const actions = (options.actions || []).map(renderAction).join("");
    const badge = options.headerBadge
      ? `<span class="hidden md:inline-flex items-center rounded-md border border-emerald-700 bg-emerald-900 px-2.5 py-1 text-xs text-emerald-400">${options.headerBadge}</span>`
      : "";

    return `
      <div class="min-h-screen md:flex">
        <div
          id="sidebarBackdrop"
          class="hidden fixed inset-0 z-30 bg-slate-950/70 md:hidden"
          aria-hidden="true"
        ></div>

        <aside
          id="sidebar"
          class="hidden fixed inset-y-0 left-0 z-40 w-72 flex-col bg-slate-900 border-r border-slate-800 lg:static lg:flex"
        >
          <div class="px-6 py-5 border-b border-slate-800">
            <h1 class="text-xl font-semibold text-slate-200">${options.brandTitle || "ERP Cousy"}</h1>
            <p class="text-xs text-slate-500 mt-1">${options.brandSubtitle || "Dashboard"}</p>
          </div>

          <nav class="p-4 space-y-2">
            ${navItems}
          </nav>
        </aside>

        <div class="flex-1 flex flex-col">
          <header class="bg-slate-900/90 border-b border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
            <div class="flex items-center gap-5 md:gap-6 lg:gap-3">
              <button
                id="sidebarToggleBtn"
                type="button"
                class="inline-flex items-center justify-center text-emerald-400 transition-colors hover:text-emerald-300 lg:hidden"
                aria-label="Abrir menú"
                title="Abrir menú"
              >
                <span class="text-[1.6rem] leading-none">☰</span>
              </button>
              <div class="max-w-[14rem] sm:max-w-none">
                <h2 class="text-base md:text-lg font-semibold text-slate-200">${options.headerTitle || ""}</h2>
                <p class="text-xs text-slate-500">${options.headerSubtitle || ""}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap justify-end">
              ${badge}
              ${actions}
              <button
                id="themeToggleBtn"
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-200 hover:text-emerald-400 transition-colors"
                aria-label="Cambiar tema"
                title="Cambiar tema"
              >
              </button>
              <button
                id="logoutBtn"
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-700 bg-red-900 text-red-300 hover:bg-red-800 transition-colors"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5 fill-current">
                  <path d="M10 3a1 1 0 0 1 0 2H6v14h4a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5Zm6.3 4.3a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 1 1-1.4-1.4l2.3-2.3H9a1 1 0 1 1 0-2h9.6l-2.3-2.3a1 1 0 0 1 0-1.4Z"/>
                </svg>
              </button>
            </div>
          </header>

          <main class="${options.mainClass || "flex-1 p-4 md:p-8 overflow-y-auto"}">
            ${options.mainContentHtml || ""}
          </main>
        </div>
      </div>

      <div id="toastWrap" class="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none"></div>
    `;
  }

  function init(options) {
    if (options.requireSession !== false && !requireSession()) {
      return null;
    }

    document.body.className = "bg-slate-950 text-slate-200 antialiased";
    document.body.innerHTML = buildShell(options);

    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    function closeSidebar() {
      sidebar.classList.add("hidden");
      backdrop.classList.add("hidden");
    }

    function openSidebar() {
      sidebar.classList.remove("hidden");
      backdrop.classList.remove("hidden");
    }

    function toggleSidebar() {
      const shouldOpen = sidebar.classList.contains("hidden");
      if (shouldOpen) {
        openSidebar();
        return;
      }
      closeSidebar();
    }

    document.getElementById("themeToggleBtn").addEventListener("click", window.AppTheme.toggleTheme);
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("sidebarToggleBtn").addEventListener("click", toggleSidebar);
    backdrop.addEventListener("click", closeSidebar);

    document.querySelectorAll("[data-tab-target]").forEach((item) => {
      item.addEventListener("click", () => {
        const tabId = item.getAttribute("data-tab-target");
        document.dispatchEvent(new CustomEvent("app-layout:navigate", {
          detail: { tabId: tabId }
        }));

        if (window.innerWidth < 1024) {
          closeSidebar();
        }
      });
    });

    window.AppTheme.initTheme();

    return {
      setActiveNav(navId) {
        document.querySelectorAll("[data-nav-id]").forEach((item) => {
          item.classList.toggle("nav-item-active", item.getAttribute("data-nav-id") === navId);
        });
      },
      closeSidebar: closeSidebar
    };
  }

  window.AppLayout = {
    init: init,
    requireSession: requireSession,
    logout: logout,
    resolvePath: resolvePath
  };
})();
