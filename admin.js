(async () => {
  "use strict";
  const config = window.GAMEVORTEX_CONFIG || {};
  const $ = id => document.getElementById(id);
  const loginPanel = $("loginPanel");
  const dashboard = $("dashboard");
  const loginForm = $("loginForm");
  const loginMessage = $("loginMessage");
  const gameMessage = $("gameMessage");
  const announcementMessage = $("announcementMessage");
  const gameForm = $("gameForm");
  const tableBody = $("gamesTableBody");
  const loginButton = $("loginButton");
  const saveButton = $("saveGameButton");
  const categories = {action:"اکشن",strategy:"استراتژی",puzzle:"فکری",sport:"ورزشی",creative:"خلاقانه"};
  let supabase = null;
  let games = [];
  let currentUser = null;
  let selectedIds = new Set();

  function message(node, text, success = false) {
    node.textContent = text || "";
    node.classList.toggle("success", Boolean(success));
  }
  function setBusy(button, busy, label) {
    button.disabled = busy;
    if (label) button.textContent = busy ? "لطفاً صبر کن..." : label;
  }
  function showLogin() { loginPanel.hidden = false; dashboard.hidden = true; }
  function showDashboard() { loginPanel.hidden = true; dashboard.hidden = false; }
  function configReady() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.supabaseUrl || "") &&
      typeof config.supabasePublishableKey === "string" &&
      config.supabasePublishableKey.length > 20;
  }
  function ensureSupabaseLibrary(timeoutMs=2500) {
    if(window.supabase&&typeof window.supabase.createClient==="function")return Promise.resolve(true);
    return new Promise(resolve=>{
      let finished=false;
      const finish=ready=>{if(finished)return;finished=true;resolve(Boolean(ready));};
      const script=document.createElement("script");
      script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.async=true;
      script.onload=()=>finish(window.supabase&&typeof window.supabase.createClient==="function");
      script.onerror=()=>finish(false);
      document.head.append(script);
      window.setTimeout(()=>finish(false),timeoutMs);
    });
  }
  function friendlyError(error) {
    const code = error && error.code;
    const text = error && error.message ? error.message : String(error || "خطای ناشناخته");
    if (code === "42P01" || code === "PGRST205") return "جدول موردنیاز پیدا نشد. فایل supabase-upgrade.sql را در SQL Editor اجرا کن و صفحه را تازه‌سازی کن.";
    if (code === "42703" || code === "PGRST204") return "ستون‌های جدید هنوز ساخته نشده‌اند. فایل supabase-upgrade.sql را یک‌بار اجرا کن.";
    if (code === "42501" || /row-level security|permission denied/i.test(text)) return "دسترسی دیتابیس رد شد. مطمئن شو UID همین حساب در جدول admin_users ثبت است و سیاست‌های RLS اجرا شده‌اند.";
    if (/invalid login credentials/i.test(text)) return "ایمیل یا رمز عبور درست نیست. همان حسابی را استفاده کن که در Authentication ساخته‌ای.";
    if (/email not confirmed/i.test(text)) return "ایمیل حساب هنوز تأیید نشده است. ایمیل Supabase را باز و حساب را تأیید کن.";
    return text;
  }
  function textCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text == null ? "" : String(text);
    return cell;
  }
  function button(label, className, action) {
    const el = document.createElement("button");
    el.type = "button";
    el.textContent = label;
    if (className) el.className = className;
    el.addEventListener("click", action);
    return el;
  }
  function safeHttps(value) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : null;
    } catch { return null; }
  }
  function clearEditor() {
    gameForm.reset();
    $("gameId").value = "";
    $("gameOrder").value = String(games.length + 1);
    $("gamePublished").checked = true;
    $("gameFeatured").checked = false;
    $("editorTitle").textContent = "افزودن بازی جدید";
    saveButton.textContent = "ذخیره بازی ←";
    message(gameMessage, "");
  }
  function updateStats() {
    $("totalGames").textContent = String(games.length);
    $("publishedGames").textContent = String(games.filter(g => g.is_published).length);
    $("draftGames").textContent = String(games.filter(g => !g.is_published).length);
    $("featuredGames").textContent = String(games.filter(g => g.is_featured).length);
  }
  function visibleGames() {
    const query = $("gamesSearch").value.trim().toLocaleLowerCase();
    const status = $("statusFilter").value;
    const category = $("categoryFilter").value;
    const rows=games.filter(game => {
      const searchable=[game.title,game.description,game.platforms,game.official_url].join(" ").toLocaleLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesStatus = status === "all" ||
        (status === "published" && game.is_published) ||
        (status === "draft" && !game.is_published) ||
        (status === "featured" && game.is_featured);
      const matchesCategory = category === "all" || game.category === category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
    const sort=$("managerSort")?.value||"order";
    if(sort==="name")rows.sort((a,b)=>(a.title||"").localeCompare(b.title||"","fa"));
    else if(sort==="updated")rows.sort((a,b)=>(Date.parse(b.updated_at)||0)-(Date.parse(a.updated_at)||0));
    else rows.sort((a,b)=>(Number(a.display_order)||0)-(Number(b.display_order)||0));
    return rows;
  }
  function updateBulkControls(shown) {
    const toolbar=$("bulkToolbar");
    const visible=shown||visibleGames();
    const ids=visible.map(game=>game.id);
    const selectedVisible=ids.filter(id=>selectedIds.has(id)).length;
    toolbar.hidden=selectedIds.size===0;
    $("selectedCountText").textContent=String(selectedIds.size)+" انتخاب";
    const allVisible=ids.length>0&&selectedVisible===ids.length;
    $("selectAllVisible").checked=allVisible;
    $("selectAllGames").checked=allVisible;
    $("bulkPublishButton").disabled=selectedIds.size===0;
    $("bulkDraftButton").disabled=selectedIds.size===0;
    $("bulkFeatureButton").disabled=selectedIds.size===0;
    $("bulkDeleteButton").disabled=selectedIds.size===0;
  }
  function renderGames() {
    tableBody.replaceChildren();
    const shown = visibleGames();
    $("visibleCount").textContent = "نمایش " + shown.length + " از " + games.length;
    if (!shown.length) {
      const row = document.createElement("tr");
      const cell = textCell(games.length ? "با این فیلتر بازی‌ای پیدا نشد." : "هنوز بازی‌ای ثبت نشده است.");
      cell.colSpan = 6;
      row.append(cell);
      tableBody.append(row);
    }
    shown.forEach(game => {
      const row = document.createElement("tr");
      const selectCell=document.createElement("td");
      const checkbox=document.createElement("input");
      checkbox.type="checkbox";
      checkbox.checked=selectedIds.has(game.id);
      checkbox.setAttribute("aria-label","انتخاب "+game.title);
      checkbox.addEventListener("change",()=>{
        if(checkbox.checked)selectedIds.add(game.id);else selectedIds.delete(game.id);
        updateBulkControls(shown);
      });
      selectCell.append(checkbox);
      row.append(selectCell);
      row.append(textCell(game.title));
      row.append(textCell(categories[game.category] || game.category));
      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      status.className = "status-pill" + (game.is_published ? "" : " draft");
      status.textContent = game.is_published ? "منتشرشده" : "پیش‌نویس";
      statusCell.append(status);
      row.append(statusCell);
      const featuredCell = document.createElement("td");
      if (game.is_featured) {
        const badge = document.createElement("span");
        badge.className = "feature-pill";
        badge.textContent = "★ ویژه";
        featuredCell.append(badge);
      } else featuredCell.textContent = "—";
      row.append(featuredCell);
      const actionCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "table-actions";
      actions.append(button("ویرایش","",() => editGame(game)));
      actions.append(button(game.is_published ? "پیش‌نویس کن" : "منتشر کن","",() => toggleField(game,"is_published",!game.is_published)));
      actions.append(button(game.is_featured ? "لغو ویژه" : "★ ویژه","",() => toggleField(game,"is_featured",!game.is_featured)));
      actions.append(button("حذف","delete",() => deleteGame(game)));
      actionCell.append(actions);
      row.append(actionCell);
      tableBody.append(row);
    });
    updateStats();
    updateBulkControls(shown);
  }
  async function loadGames() {
    const {data,error}=await supabase.from("games").select("*").order("display_order",{ascending:true}).order("created_at",{ascending:false});
    if(error) throw error;
    games=data || [];
    const validIds=new Set(games.map(game=>game.id));
    selectedIds=new Set(Array.from(selectedIds).filter(id=>validIds.has(id)));
    renderGames();
    $("lastUpdated").textContent="آخرین به‌روزرسانی: "+new Date().toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"});
  }
  async function loadSettings() {
    const {data,error}=await supabase.from("site_settings").select("key,value").in("key",["announcement_text","announcement_enabled"]);
    if(error) throw error;
    const settings=Object.fromEntries((data || []).map(item=>[item.key,item.value]));
    $("announcementText").value=settings.announcement_text || "";
    $("announcementEnabled").checked=settings.announcement_enabled === "true";
    updateAnnouncementPreview();
  }
  function editGame(game) {
    $("gameId").value=game.id;
    $("gameTitle").value=game.title || "";
    $("gameCategory").value=game.category || "action";
    $("gameTheme").value=game.art_theme || "cs";
    $("gameDescription").value=game.description || "";
    $("gameUrl").value=game.official_url || "";
    $("gameCover").value=game.cover_url || "";
    $("gamePlatforms").value=game.platforms || "PC";
    $("gameOrder").value=String(game.display_order ?? 0);
    $("gamePublished").checked=Boolean(game.is_published);
    $("gameFeatured").checked=Boolean(game.is_featured);
    $("editorTitle").textContent="ویرایش: "+game.title;
    saveButton.textContent="ذخیره تغییرات ←";
    message(gameMessage,"حالت ویرایش فعال شد.",true);
    $("gameTitle").focus();
    window.scrollTo({top:$("gameForm").getBoundingClientRect().top+window.scrollY-95,behavior:"smooth"});
  }
  async function toggleField(game,field,value) {
    message(gameMessage,"");
    const patch={}; patch[field]=value;
    const {error}=await supabase.from("games").update(patch).eq("id",game.id);
    if(error){message(gameMessage,"خطا در تغییر وضعیت: "+friendlyError(error));return;}
    await loadGames();
    message(gameMessage,"وضعیت بازی به‌روزرسانی شد.",true);
  }
  async function deleteGame(game) {
    if(!window.confirm("بازی «"+game.title+"» حذف شود؟ این کار قابل بازگشت نیست.")) return;
    const {error}=await supabase.from("games").delete().eq("id",game.id);
    if(error){message(gameMessage,"خطا در حذف: "+friendlyError(error));return;}
    await loadGames();
    if($("gameId").value===game.id) clearEditor();
    message(gameMessage,"بازی حذف شد.",true);
  }
  async function verifyAdmin(user) {
    const {data,error}=await supabase.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
    if(error) throw error;
    if(!data){
      await supabase.auth.signOut();
      throw new Error("این حساب در فهرست مدیران GameVortex نیست. UID حسابی که وارد شدی باید در جدول admin_users باشد.");
    }
    currentUser=user;
    $("signedInAs").textContent="واردشده با "+(user.email || "حساب مدیر");
    showDashboard();
    await loadGames();
    await loadSettings();
    window.dispatchEvent(new Event("gamevortex:admin-ready"));
  }
  function downloadFile(name,content,type) {
    const blob=new Blob([content],{type:type});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement("a");
    anchor.href=url;
    anchor.download=name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }
  function csvEscape(value) {
    let text=String(value == null ? "" : value);
    if (/^[\\s]*[=+@-]/.test(text)) text="\u0027"+text;
    return '"' + text.replace(/"/g,'""') + '"';
  }
  function exportCsv() {
    const headers=["title","category","description","official_url","cover_url","platforms","art_theme","display_order","is_published","is_featured"];
    const lines=[headers.join(","),...games.map(game=>headers.map(key=>csvEscape(game[key])).join(","))];
    downloadFile("gamevortex-games.csv","\uFEFF"+lines.join("\r\n"),"text/csv;charset=utf-8");
  }
  async function exportJson() {
    try{
      const {data,error}=await supabase.from("site_settings").select("key,value");
      if(error)throw error;
      const backup={exported_at:new Date().toISOString(),project:"GameVortex",version:2,games:games,settings:(data||[]).filter(item=>["announcement_text","announcement_enabled"].includes(item.key))};
      downloadFile("gamevortex-full-backup.json",JSON.stringify(backup,null,2),"application/json");
      message(gameMessage,"پشتیبان کامل بازی‌ها و تنظیمات آماده شد.",true);
    }catch(error){message(gameMessage,"پشتیبان‌گیری انجام نشد: "+friendlyError(error));}
  }


  async function bulkUpdate(patch) {
    const ids=Array.from(selectedIds);
    if(!ids.length)return;
    const payload={...patch,updated_at:new Date().toISOString()};
    const {error}=await supabase.from("games").update(payload).in("id",ids);
    if(error){message(gameMessage,"عملیات گروهی انجام نشد: "+friendlyError(error));return;}
    selectedIds.clear();
    await loadGames();
    message(gameMessage,ids.length+" بازی به‌روزرسانی شد.",true);
  }
  async function bulkDelete() {
    const ids=Array.from(selectedIds);
    if(!ids.length)return;
    if(!window.confirm("می‌خواهی "+ids.length+" بازی انتخاب‌شده را حذف کنی؟ این کار قابل بازگشت نیست."))return;
    const {error}=await supabase.from("games").delete().in("id",ids);
    if(error){message(gameMessage,"حذف گروهی انجام نشد: "+friendlyError(error));return;}
    selectedIds.clear();
    await loadGames();
    message(gameMessage,ids.length+" بازی حذف شد.",true);
  }
  function pickValue(row,snake,camel,fallback="") {
    return row[snake]!==undefined?row[snake]:(row[camel]!==undefined?row[camel]:fallback);
  }
  function normalizeImportRows(rows) {
    const allowedCategories=new Set(Object.keys(categories));
    const allowedThemes=new Set(["cs","portal","civ","rocket","minecraft","human","track","stardew"]);
    const incoming=[];
    const seen=new Set(games.map(game=>(game.title||"").trim().toLocaleLowerCase()));
    let duplicates=0,invalid=0;
    rows.forEach((row,index)=>{
      if(!row||typeof row!=="object"){invalid++;return;}
      const title=String(pickValue(row,"title","title","")).trim().slice(0,90);
      if(!title){invalid++;return;}
      const key=title.toLocaleLowerCase();
      if(seen.has(key)){duplicates++;return;}
      const category=String(pickValue(row,"category","category","action"));
      const theme=String(pickValue(row,"art_theme","artTheme","cs"));
      const officialRaw=String(pickValue(row,"official_url","officialUrl","")||"").trim();
      const coverRaw=String(pickValue(row,"cover_url","coverUrl","")||"").trim();
      const publishedValue=pickValue(row,"is_published","isPublished",true);
      const featuredValue=pickValue(row,"is_featured","isFeatured",false);
      const orderValue=pickValue(row,"display_order","displayOrder",games.length+incoming.length+1);
      incoming.push({
        title,
        category:allowedCategories.has(category)?category:"action",
        art_theme:allowedThemes.has(theme)?theme:"cs",
        description:String(pickValue(row,"description","description","توضیحات این بازی به‌زودی تکمیل می‌شود.")).trim().slice(0,700),
        official_url:officialRaw?(safeHttps(officialRaw)||null):null,
        cover_url:coverRaw?(safeHttps(coverRaw)||null):null,
        platforms:String(pickValue(row,"platforms","platforms","PC")).trim().slice(0,120)||"PC",
        display_order:Math.max(0,Number.parseInt(orderValue,10)||games.length+incoming.length+1),
        is_published:publishedValue===true||String(publishedValue).toLowerCase()==="true"||String(publishedValue)==="1",
        is_featured:featuredValue===true||String(featuredValue).toLowerCase()==="true"||String(featuredValue)==="1",
        updated_at:new Date().toISOString()
      });
      seen.add(key);
    });
    return {incoming,duplicates,invalid};
  }
  async function importRows(rows,label="فایل") {
    if(!Array.isArray(rows)||!rows.length){message(gameMessage,"در فایل، فهرست بازی معتبری پیدا نشد.");return 0;}
    const result=normalizeImportRows(rows);
    if(!result.incoming.length){
      message(gameMessage,"بازی تازه‌ای برای افزودن وجود ندارد؛ تکراری: "+result.duplicates+"، نامعتبر: "+result.invalid+".");
      return 0;
    }
    let inserted=0;
    for(let i=0;i<result.incoming.length;i+=10){
      const chunk=result.incoming.slice(i,i+10);
      const {error}=await supabase.from("games").insert(chunk);
      if(error)throw error;
      inserted+=chunk.length;
    }
    await loadGames();
    message(gameMessage,inserted+" بازی از "+label+" اضافه شد؛ تکراری: "+result.duplicates+"، نامعتبر: "+result.invalid+".",true);
    return inserted;
  }
  async function importSuggestedCatalog() {
    const list=window.GAMEVORTEX_CATALOG||[];
    if(!list.length){message(gameMessage,"فهرست پیشنهادی بارگیری نشده است.");return;}
    setBusy($("importCatalogButton"),true);
    try{
      const added=await importRows(list,"کاتالوگ GameVortex");
      $("catalogStatus").textContent=added?added+" بازی اضافه شد.":"بازی تازه‌ای لازم نبود.";
    }catch(error){
      message(gameMessage,"واردکردن کاتالوگ ناموفق بود: "+friendlyError(error));
    }finally{
      setBusy($("importCatalogButton"),false,"＋ افزودن ۴۰ بازی پیشنهادی");
    }
  }
  function parseCsv(text) {
    const rows=[];let row=[];let field="";let quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i],next=text[i+1];
      if(ch==='"'&&quoted&&next==='"'){field+='"';i++;}
      else if(ch==='"'){quoted=!quoted;}
      else if(ch===","&&!quoted){row.push(field);field="";}
      else if((ch==="\n"||ch==="\r")&&!quoted){
        if(ch==="\r"&&next==="\n")i++;
        row.push(field);field="";
        if(row.some(value=>value.trim()!==""))rows.push(row);
        row=[];
      }else field+=ch;
    }
    row.push(field);if(row.some(value=>value.trim()!==""))rows.push(row);
    if(rows.length<2)return [];
    const headers=rows.shift().map(value=>value.trim().replace(/^\uFEFF/,""));
    return rows.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]||""])));
  }
  async function importBackupFile(file) {
    if(!file)return;
    setBusy($("importBackupButton"),true);
    try{
      const text=await file.text();
      let rows;
      let settings=null;
      if(file.name.toLowerCase().endsWith(".csv"))rows=parseCsv(text);
      else{
        const backup=JSON.parse(text);
        rows=Array.isArray(backup)?backup:backup.games;
        settings=backup.settings||null;
      }
      const count=await importRows(rows||[],"پشتیبان");
      if(settings){
        const values=Array.isArray(settings)?settings:Object.entries(settings).map(([key,value])=>({key,value:String(value)}));
        const safeValues=values.filter(item=>item&&["announcement_text","announcement_enabled"].includes(item.key))
          .map(item=>({key:item.key,value:String(item.value??""),updated_by:currentUser.id,updated_at:new Date().toISOString()}));
        if(safeValues.length){
          const {error}=await supabase.from("site_settings").upsert(safeValues,{onConflict:"key"});
          if(error)throw error;
          await loadSettings();
        }
      }
      $("catalogStatus").textContent=count+" بازی از فایل وارد شد.";
    }catch(error){
      message(gameMessage,"فایل قابل واردکردن نیست: "+friendlyError(error));
    }finally{
      setBusy($("importBackupButton"),false,"وارد کردن CSV / JSON");
      $("importFileInput").value="";
    }
  }

  if(!configReady()){
    $("setupNotice").hidden=false;
    loginPanel.hidden=true;
    return;
  }
  const libraryReady=await ensureSupabaseLibrary();
  if(!libraryReady){
    showLogin();
    message(loginMessage,"کتابخانه اتصال Supabase بارگیری نشد. اتصال اینترنت یا دسترسی به CDN را بررسی کن و دوباره صفحه را باز کن.");
    loginButton.disabled=true;
    return;
  }
  loginButton.disabled=false;
  supabase=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
  window.GAMEVORTEX_ADMIN_API = {
    getGames: () => games.map(game => ({...game})),
    getSelectedIds: () => Array.from(selectedIds),
    getVisibleGames: () => visibleGames().map(game => ({...game})),
    setSelectedIds: ids => {
      const valid = new Set(games.map(game => game.id));
      selectedIds = new Set((Array.isArray(ids) ? ids : []).filter(id => valid.has(id)));
      renderGames();
    },
    refresh: loadGames,
    bulkUpdate,
    bulkDelete,
    editGame,
    exportCsv,
    exportJson,
    getUser: () => currentUser ? {id:currentUser.id,email:currentUser.email} : null,
    updateGames: async changes => {
      if (!Array.isArray(changes)) throw new Error("فهرست تغییرات معتبر نیست.");
      for (const item of changes) {
        if (!item || !item.id || !item.patch || typeof item.patch !== "object") continue;
        const {error} = await supabase.from("games").update({...item.patch,updated_at:new Date().toISOString()}).eq("id",item.id);
        if (error) throw error;
      }
      await loadGames();
      return true;
    }
  };

  loginForm.addEventListener("submit",async event=>{
    event.preventDefault();
    message(loginMessage,"");
    setBusy(loginButton,true);
    try{
      const {data,error}=await supabase.auth.signInWithPassword({
        email:$("loginEmail").value.trim(),
        password:$("loginPassword").value
      });
      if(error) throw error;
      await verifyAdmin(data.user);
    }catch(error){
      showLogin();
      message(loginMessage,friendlyError(error));
    }finally{
      setBusy(loginButton,false,"ورود به پنل ←");
    }
  });

  gameForm.addEventListener("submit",async event=>{
    event.preventDefault();
    message(gameMessage,"");
    const id=$("gameId").value;
    const officialUrl=$("gameUrl").value.trim();
    const coverUrl=$("gameCover").value.trim();
    if(officialUrl && !safeHttps(officialUrl)){message(gameMessage,"لینک رسمی باید با https:// شروع شود.");return;}
    if(coverUrl && !safeHttps(coverUrl)){message(gameMessage,"لینک تصویر باید HTTPS باشد.");return;}
    const record={
      title:$("gameTitle").value.trim(),
      category:$("gameCategory").value,
      art_theme:$("gameTheme").value,
      description:$("gameDescription").value.trim(),
      official_url:officialUrl || null,
      cover_url:coverUrl || null,
      platforms:$("gamePlatforms").value.trim() || "PC",
      display_order:Math.max(0,Number.parseInt($("gameOrder").value,10) || 0),
      is_published:$("gamePublished").checked,
      is_featured:$("gameFeatured").checked,
      updated_at:new Date().toISOString()
    };
    setBusy(saveButton,true);
    try{
      const result=id
        ? await supabase.from("games").update(record).eq("id",id)
        : await supabase.from("games").insert(record);
      if(result.error) throw result.error;
      await loadGames();
      clearEditor();
      message(gameMessage,id?"تغییرات ذخیره شد و در سایت اعمال می‌شود.":"بازی جدید به کتابخانه اضافه شد.",true);
    }catch(error){
      message(gameMessage,"ذخیره نشد: "+friendlyError(error));
    }finally{
      setBusy(saveButton,false,id?"ذخیره تغییرات ←":"ذخیره بازی ←");
    }
  });

  $("duplicateGameButton").addEventListener("click",()=>{
    const title=$("gameTitle").value.trim();
    if(!title){message(gameMessage,"اول یک بازی را انتخاب یا اطلاعاتش را وارد کن.");return;}
    $("gameId").value="";
    $("gameTitle").value=title+" (نسخه کپی)";
    $("editorTitle").textContent="افزودن کپی از بازی";
    saveButton.textContent="ذخیره بازی جدید ←";
    message(gameMessage,"نسخه کپی آماده است؛ نام را تغییر بده و ذخیره کن.",true);
    $("gameTitle").focus();
  });
  $("clearFormButton").addEventListener("click",clearEditor);
  $("reloadGamesButton").addEventListener("click",async()=>{
    try{await loadGames();message(gameMessage,"فهرست بازی‌ها به‌روز شد.",true);}
    catch(error){message(gameMessage,friendlyError(error));}
  });
  $("exportCsvButton").addEventListener("click",exportCsv);
  $("exportJsonButton").addEventListener("click",exportJson);

  $("importCatalogButton").addEventListener("click",importSuggestedCatalog);
  $("importBackupButton").addEventListener("click",()=>$("importFileInput").click());
  $("importFileInput").addEventListener("change",event=>importBackupFile(event.target.files&&event.target.files[0]));
  $("copySiteUrlButton").addEventListener("click",async()=>{
    const url=new URL("./",location.href).href;
    try{await navigator.clipboard.writeText(url);$("catalogStatus").textContent="لینک سایت کپی شد.";}
    catch{$("catalogStatus").textContent=url;}
  });
  ["gamesSearch","statusFilter","categoryFilter","managerSort"].forEach(id=>$(id).addEventListener(id==="gamesSearch"?"input":"change",renderGames));
  function setVisibleSelection(checked){
    visibleGames().forEach(game=>{if(checked)selectedIds.add(game.id);else selectedIds.delete(game.id);});
    renderGames();
  }
  $("selectAllVisible").addEventListener("change",event=>setVisibleSelection(event.target.checked));
  $("selectAllGames").addEventListener("change",event=>setVisibleSelection(event.target.checked));
  $("clearSelectionButton").addEventListener("click",()=>{selectedIds.clear();renderGames();});
  $("bulkPublishButton").addEventListener("click",()=>bulkUpdate({is_published:true}));
  $("bulkDraftButton").addEventListener("click",()=>bulkUpdate({is_published:false}));
  $("bulkFeatureButton").addEventListener("click",()=>bulkUpdate({is_featured:true}));
  $("bulkDeleteButton").addEventListener("click",bulkDelete);

  function updateAnnouncementPreview(){
    const value=$("announcementText").value;
    $("announcementCount").textContent=String(value.length).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)])+" / ۱۸۰";
    $("announcementPreviewText").textContent=value.trim()||"متن پیام اینجا نمایش داده می‌شود.";
    $("announcementPreview").classList.toggle("is-enabled",$("announcementEnabled").checked&&Boolean(value.trim()));
  }
  $("announcementText").addEventListener("input",updateAnnouncementPreview);
  $("announcementEnabled").addEventListener("change",updateAnnouncementPreview);
  document.querySelectorAll("[data-announcement-template]").forEach(button=>{
    button.addEventListener("click",()=>{
      $("announcementText").value=button.dataset.announcementTemplate||"";
      $("announcementEnabled").checked=true;
      updateAnnouncementPreview();
    });
  });
  $("clearAnnouncementButton").addEventListener("click",()=>{
    $("announcementText").value="";
    $("announcementEnabled").checked=false;
    updateAnnouncementPreview();
  });

  $("announcementForm").addEventListener("submit",async event=>{
    event.preventDefault();
    const text=$("announcementText").value.trim();
    const enabled=$("announcementEnabled").checked;
    if(enabled && !text){message(announcementMessage,"برای فعال‌کردن اعلان، ابتدا متن پیام را بنویس.");return;}
    setBusy($("saveAnnouncementButton"),true);
    const values=[
      {key:"announcement_text",value:text,updated_by:currentUser.id,updated_at:new Date().toISOString()},
      {key:"announcement_enabled",value:String(enabled),updated_by:currentUser.id,updated_at:new Date().toISOString()}
    ];
    try{
      const {error}=await supabase.from("site_settings").upsert(values,{onConflict:"key"});
      if(error) throw error;
      message(announcementMessage,"تنظیمات پیام ذخیره شد.",true);
    }catch(error){
      message(announcementMessage,"ذخیره نشد: "+friendlyError(error));
    }finally{
      setBusy($("saveAnnouncementButton"),false,"ذخیره تنظیمات");
    }
  });

  $("passwordForm").addEventListener("submit",async event=>{
    event.preventDefault();
    const nextPassword=$("newPassword").value;
    const confirmPassword=$("confirmPassword").value;
    if(nextPassword.length<10){message($("passwordMessage"),"رمز جدید باید حداقل ۱۰ نویسه داشته باشد.");return;}
    if(nextPassword!==confirmPassword){message($("passwordMessage"),"دو رمز واردشده با هم یکسان نیستند.");return;}
    setBusy($("changePasswordButton"),true);
    try{
      const {error}=await supabase.auth.updateUser({password:nextPassword});
      if(error)throw error;
      $("newPassword").value="";
      $("confirmPassword").value="";
      message($("passwordMessage"),"رمز عبور حساب مدیر به‌روزرسانی شد.",true);
    }catch(error){
      message($("passwordMessage"),"رمز تغییر نکرد: "+friendlyError(error));
    }finally{
      setBusy($("changePasswordButton"),false,"به‌روزرسانی رمز");
    }
  });

  $("logoutButton").addEventListener("click",async()=>{
    await supabase.auth.signOut();
    currentUser=null;
    showLogin();
    message(loginMessage,"از حساب خارج شدی.",true);
  });

  supabase.auth.getSession().then(async({data,error})=>{
    if(error){showLogin();message(loginMessage,friendlyError(error));return;}
    if(data.session){
      try{await verifyAdmin(data.session.user);}
      catch(err){showLogin();message(loginMessage,friendlyError(err));}
    }
  }).catch(error=>{showLogin();message(loginMessage,friendlyError(error));});
})();