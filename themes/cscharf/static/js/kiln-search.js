document.addEventListener("DOMContentLoaded", async () => {
  const root = document.querySelector("#search[data-pagefind-root]");
  if (!root) {
    return;
  }

  const moduleUrl = root.getAttribute("data-pagefind-module") || "/pagefind/pagefind.js";
  const toggle = root.querySelector(".search-toggle");
  const panel = root.querySelector(".search-panel");
  const searchInput = root.querySelector("input[type='search']");
  const results = root.querySelector(".pagefind-results");

  if (!toggle || !panel || !searchInput || !results) {
    return;
  }

  const closeSearch = () => {
    root.classList.remove("is-open");
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (!searchInput.value.trim()) {
      results.hidden = true;
      results.innerHTML = "";
    }
  };

  const openSearch = () => {
    root.classList.add("is-open");
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    searchInput.focus();
  };

  toggle.addEventListener("click", () => {
    const isOpen = root.classList.contains("is-open");
    if (isOpen) {
      closeSearch();
      return;
    }
    openSearch();
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) {
      closeSearch();
    }
  });

  try {
    const pagefindModule = await import(moduleUrl);
    const pagefind = pagefindModule.default ?? pagefindModule;
    if (!pagefind || typeof pagefind.init !== "function") {
      return;
    }

    await pagefind.init();

    searchInput.addEventListener("input", async (event) => {
      const query = event.target.value.trim();
      if (!query) {
        results.innerHTML = "";
        results.hidden = true;
        return;
      }

      const hits = await pagefind.search(query);
      if (!hits || !Array.isArray(hits.results) || hits.results.length === 0) {
        results.innerHTML = "";
        results.hidden = true;
        return;
      }

      const markup = await Promise.all(
        hits.results.slice(0, 5).map(async (hit) => {
          const meta = await hit.data();
          const title = meta.meta?.title || meta.title || "Untitled";
          const excerpt = meta.excerpt || "";
          const url = meta.url || hit.url || "#";

          return `
            <a href="${url}">
              <span class="pagefind-result-title">${title}</span>
              <span class="pagefind-result-excerpt">${excerpt}</span>
            </a>
          `;
        })
      );

      results.innerHTML = markup.join("");
      results.hidden = false;
    });
  } catch (error) {
    console.warn("Pagefind search failed to initialize", error);
  }

  closeSearch();
});
