(() => {
  "use strict";
  const config = window.GAMEVORTEX_CONFIG || {};
  const setupNotice = document.getElementById("setupNotice");
  const loginPanel = document.getElementById("loginPanel");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const gameMessage = document.getElementById("gameMessage");
  const gameForm = document.getElementById("gameForm");
  const tableBody = document.getElementById("gamesTableBody");
  const loginButton = document.getElementById("loginButton");
  const saveButton = document.getElementById("saveGameButton");
  const $ = id => document.getElementById(id);
  let supabase = null;
  let games = [];
  let currentUser = null;

  function message(node, text, success = false) {
    node.textContent = text;
    node.classList.toggle("success", success);
  }
  function setBusy(button, busy, label) {
    button.disabled = busy;
    if (label) button.textContent = busy ? "لطفاً صبر کن..." : label;
  }
  function showLogin() {
    loginPanel.hidden = false;
    dashboard.hidden = true;
  }
  function showDashboard() {
    loginPanel.hidden = true;
    dashboard.hidden = false;
  }
  function configReady() {
    return typeof window.supabase !== "undefined" &&
      /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.supabaseUrl || "") &&
      typeof config.supabasePublishableKey === "string" &&
      config.supabasePublishableKey.length > 20;
  }
  function textCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }
  function clearEditor() {
    gameForm.reset();
    $("gameId").value = "";
    $("gameOrder").value = String(games.length);
    $("gamePublished").checked = true;
    $("editorTitle").textContent = "افزودن بازی جدید";
    saveButton.textContent = "ذخیره بازی ←";
    message(gameMessage, "");
  }
  function updateStats() {
    $("totalGames").textContent = String(games.length);
    $("publishedGames").textContent = String(games.filter(g => g.is_published).length);
    $("draftGames").textContent = String(games.filter(g => !g.is_published).length);
  }
  function renderGames() {
    tableBody.replaceChildren();
    if (!games.length) {
      const row = document.createElement("tr");
      const cell = textCell("هنوز بازی‌ای ثبت نشده است.");
      cell.colSpan = 4;
      row.append(cell);
      tableBody.append(row);
    }
    games.forEach(game => {
      const row = document.createElement("tr");
      row.append(textCell(game.title));
      const cats = {action:"اکشن",strategy:"استراتژی",puzzle:"فکری",sport:"ورزشی",creative:"خلاقانه"};
      row.append(textCell(cats[game.category] || game.category));
      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      status.className = "status-pill" + (game.is_published ? "" : " draft");
      status.textContent = game.is_published ? "منتشرشده" : "پیش‌نویس";
      statusCell.append(status);
      row.append(statusCell);
      const actions = document.createElement("td");
      const group = document.createElement("div");
      group.className = "table-actions";
      const edit = document.createElement("button");
      edit.type = "button"; edit.textContent = "ویرایش";
      edit.addEventListener("click", () => editGame(game));
      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "delete"; remove.textContent = "حذف";
      remove.addEventListener("click", () => deleteGame(game));
      group.append(edit, remove); actions.append(group); row.append(actions);
      tableBody.append(row);
    });
    updateStats();
  }
  async function loadGames() {
    message(gameMessage, "");
    const { data, error } = await supabase.from("games").select("*").order("display_order", {ascending:true}).order("created_at", {ascending:false});
    if (error) throw error;
    games = data || [];
    renderGames();
  }
  function editGame(game) {
    $("gameId").value = game.id;
    $("gameTitle").value = game.title || "";
    $("gameCategory").value = game.category || "action";
    $("gameTheme").value = game.art_theme || "cs";
    $("gameDescription").value = game.description || "";
    $("gameUrl").value = game.official_url || "";
    $("gameOrder").value = String(game.display_order ?? 0);
    $("gamePublished").checked = Boolean(game.is_published);
    $("editorTitle").textContent = "ویرایش: " + game.title;
    saveButton.textContent = "ذخیره تغییرات ←";
    message(gameMessage, "حالت ویرایش فعال شد.", true);
    $("gameTitle").focus();
    window.scrollTo({top:$("gameForm").getBoundingClientRect().top + window.scrollY - 95,behavior:"smooth"});
  }
  async function deleteGame(game) {
    if (!window.confirm("بازی «" + game.title + "» حذف شود؟ این کار قابل بازگشت نیست.")) return;
    const { error } = await supabase.from("games").delete().eq("id", game.id);
    if (error) { message(gameMessage, "خطا در حذف: " + error.message); return; }
    await loadGames();
    message(gameMessage, "بازی حذف شد.", true);
  }
  async function verifyAdmin(user) {
    const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!data) {
      await supabase.auth.signOut();
      throw new Error("این حساب در فهرست مدیران GameVortex نیست. شناسه کاربر باید در جدول admin_users ثبت شود.");
    }
    currentUser = user;
    $("signedInAs").textContent = "واردشده با " + (user.email || "حساب مدیر");
    showDashboard();
    await loadGames();
  }

  if (!configReady()) {
    setupNotice.hidden = false;
    loginPanel.hidden = true;
    return;
  }
  supabase = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    message(loginMessage, "");
    setBusy(loginButton, true);
    try {
      const {data,error} = await supabase.auth.signInWithPassword({
        email:$("loginEmail").value.trim(),
        password:$("loginPassword").value
      });
      if (error) throw error;
      await verifyAdmin(data.user);
    } catch (error) {
      showLogin();
      message(loginMessage, error.message || "ورود انجام نشد.");
    } finally {
      setBusy(loginButton, false, "ورود به پنل ←");
    }
  });

  gameForm.addEventListener("submit", async event => {
    event.preventDefault();
    message(gameMessage, "");
    setBusy(saveButton, true);
    const id = $("gameId").value;
    const record = {
      title:$("gameTitle").value.trim(),
      category:$("gameCategory").value,
      art_theme:$("gameTheme").value,
      description:$("gameDescription").value.trim(),
      official_url:$("gameUrl").value.trim() || null,
      display_order:Math.max(0,Number.parseInt($("gameOrder").value,10) || 0),
      is_published:$("gamePublished").checked
    };
    try {
      const result = id
        ? await supabase.from("games").update(record).eq("id",id)
        : await supabase.from("games").insert(record);
      if (result.error) throw result.error;
      await loadGames();
      clearEditor();
      message(gameMessage, id ? "تغییرات ذخیره شد و در سایت اعمال می‌شود." : "بازی جدید اضافه شد و در سایت نمایش داده می‌شود.", true);
    } catch (error) {
      message(gameMessage, "خطا در ذخیره: " + error.message);
    } finally {
      setBusy(saveButton, false, id ? "ذخیره تغییرات ←" : "ذخیره بازی ←");
    }
  });

  $("clearFormButton").addEventListener("click", clearEditor);
  $("reloadGamesButton").addEventListener("click", async () => {
    try { await loadGames(); message(gameMessage, "فهرست به‌روز شد.", true); }
    catch (error) { message(gameMessage, "خطا در دریافت بازی‌ها: " + error.message); }
  });
  $("logoutButton").addEventListener("click", async () => {
    await supabase.auth.signOut();
    currentUser = null;
    showLogin();
    message(loginMessage, "از حساب خارج شدی.", true);
  });

  supabase.auth.getSession().then(async ({data,error}) => {
    if (error) { showLogin(); return; }
    if (data.session) {
      try { await verifyAdmin(data.session.user); }
      catch (err) { showLogin(); message(loginMessage, err.message); }
    }
  });
})();