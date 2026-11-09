(() => {
  "use strict";
  const cards = Array.from(document.querySelectorAll(".game-card"));
  const filters = Array.from(document.querySelectorAll(".filter"));
  const search = document.getElementById("gameSearch");
  const empty = document.getElementById("emptyState");
  const resultCount = document.getElementById("resultCount");
  const grid = document.getElementById("gameGrid");
  const favoritesKey = "gamevortex-favorites-v1";
  let activeFilter = "all";
  let toastTimer;

  const readFavorites = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  };
  let favorites = readFavorites();

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2100);
  }

  function syncFavoriteButtons() {
    cards.forEach(card => {
      const button = card.querySelector(".favorite-button");
      const saved = favorites.includes(card.dataset.title);
      button.setAttribute("aria-pressed", String(saved));
      button.textContent = saved ? "♥" : "♡";
      button.setAttribute("aria-label", saved ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها");
    });
  }

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    cards.forEach(card => {
      const haystack = (card.dataset.name + " " + card.dataset.style + " " + card.innerText).toLocaleLowerCase();
      const matchesCategory = activeFilter === "all" || card.dataset.category === activeFilter;
      const matchesQuery = !query || haystack.includes(query);
      const visible = matchesCategory && matchesQuery;
      card.hidden = !visible;
      if (visible) count++;
    });
    empty.hidden = count !== 0;
    grid.hidden = count === 0;
    resultCount.textContent = "نمایش " + count + " بازی";
  }

  filters.forEach(button => {
    button.addEventListener("click", () => {
      filters.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      applyFilters();
    });
  });
  search.addEventListener("input", applyFilters);
  document.getElementById("resetFilters").addEventListener("click", () => {
    search.value = "";
    activeFilter = "all";
    filters.forEach(item => item.classList.toggle("active", item.dataset.filter === "all"));
    applyFilters();
  });

  cards.forEach(card => {
    card.querySelector(".favorite-button").addEventListener("click", () => {
      const title = card.dataset.title;
      if (favorites.includes(title)) {
        favorites = favorites.filter(item => item !== title);
        showToast("از علاقه‌مندی‌ها حذف شد.");
      } else {
        favorites.push(title);
        showToast("به علاقه‌مندی‌ها اضافه شد.");
      }
      try { localStorage.setItem(favoritesKey, JSON.stringify(favorites)); } catch {}
      syncFavoriteButtons();
    });

    card.querySelector("[data-details]").addEventListener("click", () => openDetails(card));
  });

  const modal = document.getElementById("gameModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalStyle = document.getElementById("modalStyle");
  const modalDescription = document.getElementById("modalDescription");
  const modalSymbol = document.getElementById("modalSymbol");
  const modalLink = document.getElementById("modalLink");
  const closeButton = document.getElementById("modalClose");
  let previousFocus = null;

  function openDetails(card) {
    previousFocus = document.activeElement;
    modalTitle.textContent = card.dataset.title;
    modalStyle.textContent = card.dataset.style;
    modalDescription.textContent = card.dataset.description;
    modalSymbol.textContent = card.dataset.title.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
    modalLink.href = card.dataset.link;
    modalLink.firstChild.textContent = card.dataset.linkLabel + " ";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }
  function closeDetails() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }
  closeButton.addEventListener("click", closeDetails);
  modal.addEventListener("click", event => { if (event.target === modal) closeDetails(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeDetails();
    if (event.key === "/" && !modal.hidden === false && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      search.focus();
    }
  });

  document.getElementById("surpriseButton").addEventListener("click", () => {
    const visible = cards.filter(card => !card.hidden);
    const pool = visible.length ? visible : cards;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    cards.forEach(card => card.classList.remove("picked"));
    chosen.scrollIntoView({ behavior: "smooth", block: "center" });
    chosen.classList.add("picked");
    showToast("پیشنهاد شانسی: " + chosen.dataset.title);
    window.setTimeout(() => chosen.classList.remove("picked"), 1800);
  });

  const menuToggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "×" : "☰";
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  }));

  document.getElementById("currentYear").textContent = String(new Date().getFullYear());
  syncFavoriteButtons();
  applyFilters();
})();