(() => {
  "use strict";
  const config = window.GAMEVORTEX_CONFIG || {};
  const grid = document.getElementById("gameGrid");
  const search = document.getElementById("gameSearch");
  const empty = document.getElementById("emptyState");
  const resultCount = document.getElementById("resultCount");
  const filters = Array.from(document.querySelectorAll(".filter"));
  const modal = document.getElementById("gameModal");
  const $ = id => document.getElementById(id);
  const favoritesKey = "gamevortex-favorites-v1";
  const categories = {action:"اکشن",strategy:"استراتژی",puzzle:"فکری",sport:"ورزشی",creative:"خلاقانه"};
  const themeLabels = {cs:"TACTICAL / FPS",portal:"THINK DIFFERENT",civ:"BUILD YOUR EMPIRE",rocket:"READY TO SCORE?",minecraft:"BUILD YOUR WORLD",human:"PUZZLE / PHYSICS",track:"RACE / REPEAT",stardew:"TAKE IT EASY"};
  const themeMarks = {cs:"CS2",portal:"PORTAL 2",civ:"CIV VI",rocket:"ROCKET",minecraft:"MINECRAFT",human:"HUMAN",track:"TRACKMANIA",stardew:"STARDEW"};
  let activeFilter = "all";
  let cards = Array.from(document.querySelectorAll(".game-card"));
  let favorites = [];
  let toastTimer;
  let previousFocus = null;

  try {
    const saved = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    favorites = Array.isArray(saved) ? saved : [];
  } catch { favorites = []; }

  function toast(text) {
    const node = $("toast");
    node.textContent = text;
    node.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove("show"), 2100);
  }
  function safeUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }
  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function setFavoriteButton(card) {
    const button = card.querySelector(".favorite-button");
    const saved = favorites.includes(card.dataset.title);
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("aria-label", saved ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها");
    button.textContent = saved ? "♥" : "♡";
  }
  function syncFavorites() {
    cards.forEach(setFavoriteButton);
  }
  function openDetails(card) {
    previousFocus = document.activeElement;
    $("modalTitle").textContent = card.dataset.title;
    $("modalStyle").textContent = card.dataset.style || "";
    $("modalDescription").textContent = card.dataset.description || "";
    $("modalSymbol").textContent = card.dataset.title.split(/\s+/).slice(0,2).map(word => word[0]).join("").toUpperCase();
    const link = safeUrl(card.dataset.link);
    $("modalLink").href = link || "#";
    $("modalLink").hidden = !link;
    $("modalLink").firstChild.textContent = (card.dataset.linkLabel || "اطلاعات بیشتر") + " ";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $("modalClose").focus();
  }
  function closeDetails() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }
  function bindCard(card) {
    card.querySelector(".favorite-button").addEventListener("click", () => {
      const title = card.dataset.title;
      if (favorites.includes(title)) {
        favorites = favorites.filter(item => item !== title);
        toast("از علاقه‌مندی‌ها حذف شد.");
      } else {
        favorites.push(title);
        toast("به علاقه‌مندی‌ها اضافه شد.");
      }
      try { localStorage.setItem(favoritesKey, JSON.stringify(favorites)); } catch {}
      syncFavorites();
    });
    card.querySelector("[data-details]").addEventListener("click", () => openDetails(card));
  }
  function createGameCard(game) {
    const theme = Object.hasOwn(themeMarks, game.art_theme) ? game.art_theme : "cs";
    const category = Object.hasOwn(categories, game.category) ? game.category : "action";
    const card = make("article", "game-card");
    card.dataset.category = category;
    card.dataset.title = game.title || "بازی";
    card.dataset.name = [game.title, categories[category], game.description].join(" ");
    card.dataset.style = categories[category];
    card.dataset.description = game.description || "";
    card.dataset.link = game.official_url || "";
    card.dataset.linkLabel = "اطلاعات بیشتر";

    const art = make("div", "game-art art-" + theme);
    art.append(make("small", "art-tag", themeLabels[theme]));
    art.append(make("strong", "dynamic-art-identity", themeMarks[theme]));
    art.append(make("span", "art-corner", String(game.display_order || "").padStart(2,"0")));
    const info = make("div", "card-info");
    info.append(make("div", "card-kicker", categories[category] + " · GAMEVORTEX"));
    info.append(make("h3", "", game.title || "بازی جدید"));
    const summary = (game.description || "").trim();
    info.append(make("p", "", summary.length > 58 ? summary.slice(0,55) + "..." : summary));
    const bottom = make("div", "card-bottom");
    const detail = make("button", "details-button");
    detail.type = "button"; detail.dataset.details = "";
    detail.append(document.createTextNode("جزئیات بازی "));
    detail.append(make("span", "", "←"));
    const favorite = make("button", "favorite-button", "♡");
    favorite.type = "button"; favorite.setAttribute("aria-pressed","false");
    favorite.setAttribute("aria-label","افزودن به علاقه‌مندی‌ها");
    bottom.append(detail,favorite);
    info.append(bottom);
    card.append(art,info);
    bindCard(card);
    return card;
  }

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    cards.forEach(card => {
      const haystack = (card.dataset.name + " " + card.dataset.style + " " + card.innerText).toLocaleLowerCase();
      const visible = (activeFilter === "all" || card.dataset.category === activeFilter) && (!query || haystack.includes(query));
      card.hidden = !visible;
      if (visible) count++;
    });
    empty.hidden = count !== 0;
    grid.hidden = count === 0;
    if (resultCount) resultCount.textContent = "نمایش " + count + " بازی";
  }

  filters.forEach(button => button.addEventListener("click", () => {
    filters.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    applyFilters();
  }));
  search.addEventListener("input", applyFilters);
  $("resetFilters").addEventListener("click", () => {
    search.value = "";
    activeFilter = "all";
    filters.forEach(item => item.classList.toggle("active", item.dataset.filter === "all"));
    applyFilters();
  });
  $("modalClose").addEventListener("click", closeDetails);
  modal.addEventListener("click", event => { if (event.target === modal) closeDetails(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeDetails();
    if (event.key === "/" && modal.hidden && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault(); search.focus();
    }
  });
  $("surpriseButton").addEventListener("click", () => {
    const visible = cards.filter(card => !card.hidden);
    const pool = visible.length ? visible : cards;
    if (!pool.length) return;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    cards.forEach(card => card.classList.remove("picked"));
    chosen.scrollIntoView({behavior:"smooth",block:"center"});
    chosen.classList.add("picked");
    toast("پیشنهاد شانسی: " + chosen.dataset.title);
    window.setTimeout(() => chosen.classList.remove("picked"),1800);
  });
  const menuToggle = $("menuToggle");
  const nav = document.querySelector(".nav");
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded",String(open));
    menuToggle.textContent = open ? "×" : "☰";
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded","false");
    menuToggle.textContent = "☰";
  }));
  $("currentYear").textContent = String(new Date().getFullYear());

  cards.forEach(bindCard);
  syncFavorites();
  applyFilters();

  async function loadSharedGames() {
    const ready = typeof window.supabase !== "undefined" &&
      /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.supabaseUrl || "") &&
      typeof config.supabaseAnonKey === "string" && config.supabaseAnonKey.length > 20;
    if (!ready) return;
    try {
      const client = window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey);
      const {data,error} = await client.from("games").select("id,title,category,description,official_url,art_theme,display_order").eq("is_published",true).order("display_order",{ascending:true});
      if (error) throw error;
      if (!Array.isArray(data) || !data.length) return;
      const newCards = data.map(createGameCard);
      grid.replaceChildren(...newCards);
      cards = newCards;
      syncFavorites();
      applyFilters();
    } catch (error) {
      console.warn("GameVortex shared library is not available; showing the built-in library.",error);
    }
  }
  loadSharedGames();
})();