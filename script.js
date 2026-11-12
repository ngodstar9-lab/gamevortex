(() => {
  "use strict";
  const config=window.GAMEVORTEX_CONFIG || {};
  const grid=document.getElementById("gameGrid");
  const search=document.getElementById("gameSearch");
  const empty=document.getElementById("emptyState");
  const resultCount=document.getElementById("resultCount");
  const filters=Array.from(document.querySelectorAll(".filter"));
  const modal=document.getElementById("gameModal");
  const $=id=>document.getElementById(id);
  const favoritesKey="gamevortex-favorites-v1";
  const compareKey="gamevortex-compare-v1";
  const categories={action:"اکشن",strategy:"استراتژی",puzzle:"فکری",sport:"ورزشی",creative:"خلاقانه"};
  const categoryEnglish={action:"ACTION",strategy:"STRATEGY",puzzle:"PUZZLE",sport:"SPORT",creative:"CREATIVE"};
  const themeLabels={cs:"TACTICAL / FPS",portal:"THINK DIFFERENT",civ:"BUILD YOUR EMPIRE",rocket:"READY TO SCORE?",minecraft:"BUILD YOUR WORLD",human:"PUZZLE / PHYSICS",track:"RACE / REPEAT",stardew:"TAKE IT EASY"};
  const themeMarks={cs:"CS2",portal:"PORTAL 2",civ:"CIV VI",rocket:"ROCKET",minecraft:"MINECRAFT",human:"HUMAN",track:"TRACKMANIA",stardew:"STARDEW"};
  let activeFilter="all";
  let favoritesOnly=false;
  let cards=Array.from(document.querySelectorAll(".game-card"));
  let favorites=[];
  let compareIds=[];
  let toastTimer;
  let previousFocus=null;
  let announcementDismissed=false;
  let activeGameCard=null;
  let sharedGameOpened=false;

  try{
    const saved=JSON.parse(localStorage.getItem(favoritesKey)||"[]");
    favorites=Array.isArray(saved)?saved:[];
  }catch{favorites=[];}
  try{const oldCompare=JSON.parse(localStorage.getItem(compareKey)||"[]");compareIds=Array.isArray(oldCompare)?oldCompare.slice(0,3):[];}catch{compareIds=[];}

  function toast(text){
    const node=$("toast");
    node.textContent=text;
    node.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer=window.setTimeout(()=>node.classList.remove("show"),2200);
  }
  function safeUrl(value,httpsOnly=false){
    if(!value)return "";
    try{
      const url=new URL(value);
      if(httpsOnly ? url.protocol!=="https:" : !["https:","http:"].includes(url.protocol))return "";
      return url.href;
    }catch{return "";}
  }
  function make(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function setFavoriteButton(card){
    const button=card.querySelector(".favorite-button");
    if(!button)return;
    const saved=favorites.includes(card.dataset.title);
    button.setAttribute("aria-pressed",String(saved));
    button.setAttribute("aria-label",saved?"حذف از علاقه‌مندی‌ها":"افزودن به علاقه‌مندی‌ها");
    button.textContent=saved?"♥":"♡";
  }
  function syncFavorites(){
    cards.forEach(setFavoriteButton);
    $("favoritesCount").textContent=String(favorites.length).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  }

  function toggleCompare(card){
    const title=card.dataset.title;
    if(compareIds.includes(title))compareIds=compareIds.filter(item=>item!==title);
    else{
      if(compareIds.length>=3){toast("برای مقایسه، حداکثر سه بازی انتخاب کن.");return;}
      compareIds.push(title);
    }
    try{localStorage.setItem(compareKey,JSON.stringify(compareIds));}catch{}
    syncCompare();
  }
  function syncCompare(){
    const bar=$("compareBar");
    if(!bar)return;
    compareIds=compareIds.filter(title=>cards.some(card=>card.dataset.title===title));
    bar.hidden=compareIds.length===0;
    $("compareSummary").textContent=String(compareIds.length).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)])+" بازی برای مقایسه";
    cards.forEach(card=>{
      const button=card.querySelector(".compare-button");
      if(!button)return;
      const selected=compareIds.includes(card.dataset.title);
      button.textContent=selected?"✓ انتخاب شد":"＋ مقایسه";
      button.setAttribute("aria-pressed",String(selected));
    });
  }
  function closeCompare(){
    const node=$("compareModal");
    if(node)node.hidden=true;
    document.body.style.overflow=modal.hidden?"":"hidden";
  }
  function clearCompare(){
    compareIds=[];
    try{localStorage.removeItem(compareKey);}catch{}
    syncCompare();
    closeCompare();
  }
  function renderCompare(){
    if(compareIds.length<2){toast("برای مقایسه، حداقل دو بازی انتخاب کن.");return;}
    const selected=compareIds.map(title=>cards.find(card=>card.dataset.title===title)).filter(Boolean);
    const body=$("compareTableBody");
    body.replaceChildren();
    const rows=[
      ["نام بازی",card=>card.dataset.title],
      ["دسته‌بندی",card=>categories[card.dataset.category]||"—"],
      ["سبک",card=>card.dataset.style||"—"],
      ["پلتفرم‌ها",card=>card.dataset.platforms||"PC"],
      ["توضیحات",card=>card.dataset.description||"—"]
    ];
    rows.forEach(([label,getValue])=>{
      const tr=document.createElement("tr");
      tr.append(make("th","",label));
      selected.forEach(card=>tr.append(make("td","",getValue(card))));
      body.append(tr);
    });
    const links=document.createElement("tr");
    links.append(make("th","","لینک رسمی"));
    selected.forEach(card=>{
      const td=document.createElement("td");
      const url=safeUrl(card.dataset.link);
      if(url){const a=make("a","compare-official-link","مشاهده ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";td.append(a);}
      else td.textContent="ثبت نشده";
      links.append(td);
    });
    body.append(links);
    $("compareModal").hidden=false;
    document.body.style.overflow="hidden";
  }
  async function shareSite(){
    const url=location.href.split("#")[0];
    try{
      if(navigator.share)await navigator.share({title:"GameVortex",text:"کتابخانه بازی‌ها و راهنماهای GameVortex",url});
      else if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(url);toast("لینک GameVortex کپی شد.");}
      else toast("آدرس سایت: "+url);
    }catch(error){if(error&&error.name!=="AbortError")toast("امکان اشتراک‌گذاری در این مرورگر فعال نیست.");}
  }

  async function shareActiveGame(){
    if(!activeGameCard)return;
    const url=new URL(location.href);
    url.hash="";
    url.searchParams.set("game",activeGameCard.dataset.title||"");
    const shareUrl=url.href;
    try{
      if(navigator.share){
        await navigator.share({title:activeGameCard.dataset.title||"GameVortex",text:"جزئیات این بازی در GameVortex",url:shareUrl});
      }else if(navigator.clipboard&&navigator.clipboard.writeText){
        await navigator.clipboard.writeText(shareUrl);
        toast("لینک اختصاصی بازی کپی شد.");
      }else{
        toast("لینک بازی: "+shareUrl);
      }
    }catch(error){
      if(error&&error.name!=="AbortError")toast("اشتراک‌گذاری در این مرورگر در دسترس نیست.");
    }
  }
  function openSharedGameFromUrl(){
    if(sharedGameOpened)return;
    const title=new URLSearchParams(location.search).get("game");
    if(!title)return;
    const card=cards.find(item=>(item.dataset.title||"").toLocaleLowerCase()===title.toLocaleLowerCase());
    if(!card)return;
    sharedGameOpened=true;
    openDetails(card);
  }

  function openDetails(card){
    activeGameCard=card;
    previousFocus=document.activeElement;
    $("modalTitle").textContent=card.dataset.title;
    $("modalStyle").textContent=card.dataset.style||"";
    $("modalDescription").textContent=card.dataset.description||"";
    $("modalSymbol").textContent=(card.dataset.title||"GV").split(/\s+/).slice(0,2).map(word=>word[0]).join("").toUpperCase();
    const link=safeUrl(card.dataset.link);
    $("modalLink").href=link||"#";
    $("modalLink").hidden=!link;
    $("modalLink").firstChild.textContent=(card.dataset.linkLabel||"اطلاعات بیشتر")+" ";
    modal.hidden=false;
    document.body.style.overflow="hidden";
    $("modalClose").focus();
  }
  function closeDetails(){
    modal.hidden=true;
    document.body.style.overflow="";
    if(previousFocus&&typeof previousFocus.focus==="function")previousFocus.focus();
  }
  function bindCard(card){
    const favorite=card.querySelector(".favorite-button");
    const details=card.querySelector("[data-details]");
    if(favorite)favorite.addEventListener("click",()=>{
      const title=card.dataset.title;
      if(favorites.includes(title)){
        favorites=favorites.filter(item=>item!==title);
        toast("از علاقه‌مندی‌ها حذف شد.");
      }else{
        favorites.push(title);
        toast("به علاقه‌مندی‌ها اضافه شد.");
      }
      try{localStorage.setItem(favoritesKey,JSON.stringify(favorites));}catch{}
      syncFavorites();
      applyFilters();
    });
    if(details)details.addEventListener("click",()=>openDetails(card));
    if(!card.dataset.platforms)card.dataset.platforms="PC";
    let compare=card.querySelector(".compare-button");
    if(!compare){
      compare=make("button","compare-button","＋ مقایسه");
      compare.type="button";
      compare.setAttribute("aria-pressed","false");
      const bottom=card.querySelector(".card-bottom");
      if(bottom)bottom.insertBefore(compare,favorite||null);
    }
    compare.addEventListener("click",()=>toggleCompare(card));
  }
  function createGameCard(game,index){
    const theme=Object.hasOwn(themeMarks,game.art_theme)?game.art_theme:"cs";
    const category=Object.hasOwn(categories,game.category)?game.category:"action";
    const card=make("article","game-card");
    card.dataset.category=category;
    card.dataset.title=game.title||"بازی";
    card.dataset.name=[game.title,categories[category],game.description,game.platforms,game.aliases||""].join(" ");
    card.dataset.platforms=game.platforms||"PC";
    card.dataset.style=categories[category];
    card.dataset.description=game.description||"";
    card.dataset.link=game.official_url||"";
    card.dataset.linkLabel="اطلاعات بیشتر";
    card.dataset.order=String(game.display_order??index);
    card.dataset.created=game.created_at||"";

    const art=make("div","game-art art-"+theme);
    art.append(make("small","art-tag",themeLabels[theme]));
    const cover=safeUrl(game.cover_url,true);
    if(cover){
      art.classList.add("has-cover");
      const img=make("img","game-cover");
      img.src=cover;
      img.alt="تصویر بازی "+(game.title||"");
      img.loading="lazy";
      img.referrerPolicy="no-referrer";
      img.addEventListener("error",()=>img.remove(),{once:true});
      art.append(img);
    }else{
      art.append(make("strong","dynamic-art-identity",themeMarks[theme]));
    }
    if(game.is_featured)art.append(make("span","featured-chip","★ ویژه"));
    art.append(make("span","art-corner",String(game.display_order??index+1).padStart(2,"0")));
    const info=make("div","card-info");
    info.append(make("div","card-kicker",(categories[category]||"بازی")+" · GAMEVORTEX"));
    info.append(make("h3","",game.title||"بازی جدید"));
    const summary=(game.description||"").trim();
    info.append(make("p","",summary.length>66?summary.slice(0,63)+"...":summary));
    const platforms=(game.platforms||"").split(",").map(p=>p.trim()).filter(Boolean).slice(0,3);
    if(platforms.length){
      const tags=make("div","platform-tags");
      platforms.forEach(platform=>tags.append(make("span","",platform)));
      info.append(tags);
    }
    const bottom=make("div","card-bottom");
    const detail=make("button","details-button");
    detail.type="button";
    detail.dataset.details="";
    detail.append(document.createTextNode("جزئیات بازی "));
    detail.append(make("span","","←"));
    const favorite=make("button","favorite-button","♡");
    favorite.type="button";
    favorite.setAttribute("aria-pressed","false");
    favorite.setAttribute("aria-label","افزودن به علاقه‌مندی‌ها");
    const compare=make("button","compare-button","＋ مقایسه");compare.type="button";compare.setAttribute("aria-pressed","false");
    bottom.append(detail,compare,favorite);
    info.append(bottom);
    card.append(art,info);
    bindCard(card);
    return card;
  }
  function sortCards(){
    const mode=$("sortGames").value;
    const sorted=cards.slice();
    if(mode==="name")sorted.sort((a,b)=>a.dataset.title.localeCompare(b.dataset.title,"fa"));
    else if(mode==="recent")sorted.sort((a,b)=>(Date.parse(b.dataset.created)||Number(b.dataset.order)||0)-(Date.parse(a.dataset.created)||Number(a.dataset.order)||0));
    else sorted.sort((a,b)=>(Number(a.dataset.order)||0)-(Number(b.dataset.order)||0));
    sorted.forEach(card=>grid.append(card));
    cards=sorted;
  }
  function applyFilters(){
    const query=search.value.trim().toLocaleLowerCase();
    let count=0;
    cards.forEach(card=>{
      const haystack=(card.dataset.name+" "+card.dataset.style+" "+card.innerText).toLocaleLowerCase();
      const matchesCategory=activeFilter==="all"||card.dataset.category===activeFilter;
      const matchesQuery=!query||haystack.includes(query);
      const matchesFavorite=!favoritesOnly||favorites.includes(card.dataset.title);
      const selectedPlatform=$("platformFilter")?$("platformFilter").value:"all";
      const platformText=(card.dataset.platforms||"PC").toLocaleLowerCase();
      const matchesPlatform=selectedPlatform==="all"||platformText.includes(selectedPlatform.toLocaleLowerCase());
      const visible=matchesCategory&&matchesQuery&&matchesFavorite&&matchesPlatform;
      card.hidden=!visible;
      if(visible)count++;
    });
    empty.hidden=count!==0;
    grid.hidden=count===0;
    if(resultCount)resultCount.textContent="نمایش "+count+" بازی";
  }
  function updateHeroStats(games){
    const total=Array.isArray(games)?games.length:cards.length;
    const count=$("liveGameCount");
    const localized=String(total).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
    if(count){
      count.replaceChildren(document.createTextNode(localized));
      count.append(make("span","","+"));
    }
    const allFilter=document.querySelector('.filter[data-filter="all"] span');
    if(allFilter)allFilter.textContent=localized;
  }
  function updateFeatured(game){
    if(!game)return;
    $("spotlightLabel").textContent="منتخب مدیران GameVortex";
    $("spotlightGameTitle").textContent=game.title;
    $("spotlightDescription").textContent=game.description||"این بازی به‌عنوان انتخاب ویژه GameVortex معرفی شده است.";
    $("spotlightCategory").textContent=categoryEnglish[game.category]||"FEATURED";
    const link=safeUrl(game.official_url);
    $("spotlightLink").href=link||"#games";
    $("spotlightLink").firstChild.textContent=link?"اطلاعات بیشتر ":"مشاهده در کتابخانه ";
    $("spotlightLink").hidden=false;
  }
  function showAnnouncement(settings){
    const enabled=settings.announcement_enabled==="true";
    const text=(settings.announcement_text||"").trim();
    const bar=$("announcementBar");
    if(!bar||!enabled||!text||announcementDismissed)return;
    $("announcementText").textContent=text;
    bar.hidden=false;
  }
  function mergeCatalog(databaseGames){
    const rows=Array.isArray(databaseGames)?databaseGames.slice():[];
    const existing=new Set(rows.map(game=>(game.title||"").trim().toLocaleLowerCase()));
    (window.GAMEVORTEX_CATALOG||[]).forEach(game=>{
      const key=(game.title||"").trim().toLocaleLowerCase();
      if(key&&!existing.has(key)){rows.push(game);existing.add(key);}
    });
    return rows;
  }
  function applyDatabaseGames(data){
    if(!Array.isArray(data))return;
    const merged=mergeCatalog(data);
    const newCards=merged.map(createGameCard);
    grid.replaceChildren(...newCards);
    cards=newCards;
    populatePlatformFilter();
    syncFavorites();
    syncCompare();
    applyFilters();
    updateHeroStats(merged);
    const featured=data.find(game=>game.is_featured);
    if(featured)updateFeatured(featured);
    openSharedGameFromUrl();
  }
  function populatePlatformFilter(){
    const select=$("platformFilter");
    if(!select)return;
    const current=select.value||"all";
    const values=new Set();
    cards.forEach(card=>(card.dataset.platforms||"PC").split(",").forEach(item=>{
      const value=item.trim();if(value)values.add(value);
    }));
    Array.from(values).sort((a,b)=>a.localeCompare(b)).forEach(value=>{
      const exists=Array.from(select.options).some(option=>option.value.toLowerCase()===value.toLowerCase());
      if(!exists){const option=make("option","",value);option.value=value;select.append(option);}
    });
    if(Array.from(select.options).some(option=>option.value===current))select.value=current;
  }
  function ensureSupabaseLibrary(timeoutMs=1800){
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
  async function loadSharedData(){
    const libraryReady=await ensureSupabaseLibrary();
    if(!libraryReady){console.info("Showing local GameVortex catalogue; Supabase library is unavailable.");return;}
    const ready=typeof window.supabase!=="undefined"&&
      /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.supabaseUrl||"")&&
      typeof config.supabasePublishableKey==="string"&&config.supabasePublishableKey.length>20;
    if(!ready)return;
    const client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey);
    try{
      const gamesRequest=client.from("games")
        .select("id,title,category,description,official_url,art_theme,display_order,is_featured,platforms,cover_url,created_at")
        .eq("is_published",true).order("display_order",{ascending:true});
      const result=await Promise.race([
        gamesRequest,
        new Promise(resolve=>window.setTimeout(()=>resolve({timedOut:true}),2600))
      ]);
      if(result.timedOut){
        console.info("Supabase is slow; local games stay visible while the request continues.");
        gamesRequest.then(({data,error})=>{if(!error)applyDatabaseGames(data);})
          .catch(error=>console.info("Database request failed; local catalogue remains visible.",error));
      }else if(result.error){
        console.warn("Could not load shared games; local catalogue remains visible.",result.error);
      }else{
        applyDatabaseGames(result.data);
      }
    }catch(error){
      console.warn("Could not load shared games; local catalogue remains visible.",error);
    }
    try{
      const settingsRequest=client.from("site_settings").select("key,value").in("key",["announcement_text","announcement_enabled"]);
      const settingsResult=await Promise.race([
        settingsRequest,
        new Promise(resolve=>window.setTimeout(()=>resolve({timedOut:true}),1800))
      ]);
      if(!settingsResult.timedOut&&!settingsResult.error){
        const settings=Object.fromEntries((settingsResult.data||[]).map(item=>[item.key,item.value]));
        showAnnouncement(settings);
      }
    }catch(error){
      console.info("Announcement settings are not available yet.",error);
    }
  }

  filters.forEach(button=>button.addEventListener("click",()=>{
    filters.forEach(item=>item.classList.remove("active"));
    button.classList.add("active");
    activeFilter=button.dataset.filter;
    applyFilters();
  }));
  search.addEventListener("input",applyFilters);
  $("sortGames").addEventListener("change",()=>{sortCards();applyFilters();});
  $("platformFilter")?.addEventListener("change",applyFilters);
  $("favoritesOnlyButton").addEventListener("click",()=>{
    favoritesOnly=!favoritesOnly;
    $("favoritesOnlyButton").classList.toggle("active",favoritesOnly);
    $("favoritesOnlyButton").setAttribute("aria-pressed",String(favoritesOnly));
    applyFilters();
  });
  $("resetFilters").addEventListener("click",()=>{
    search.value="";
    activeFilter="all";
    favoritesOnly=false;
    $("favoritesOnlyButton").classList.remove("active");
    $("favoritesOnlyButton").setAttribute("aria-pressed","false");
    $("sortGames").value="default";
    if($("platformFilter"))$("platformFilter").value="all";
    sortCards();
    filters.forEach(item=>item.classList.toggle("active",item.dataset.filter==="all"));
    applyFilters();
  });
  $("modalClose").addEventListener("click",closeDetails);
  $("modalShareButton")?.addEventListener("click",shareActiveGame);
  modal.addEventListener("click",event=>{if(event.target===modal)closeDetails();});
  document.addEventListener("keydown",event=>{
    const target=event.target;
    const typing=Boolean(target&&(target.isContentEditable||["INPUT","TEXTAREA","SELECT"].includes(target.tagName)));
    if(event.key==="Escape"){
      if(!modal.hidden)closeDetails();
      else if(!$("compareModal").hidden)closeCompare();
      return;
    }
    if(event.key==="/"&&!typing&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      event.preventDefault();
      search.focus();
    }
  });
  $("compareClose")?.addEventListener("click",closeCompare);
  $("compareModal")?.addEventListener("click",event=>{if(event.target===$("compareModal"))closeCompare();});
  $("openCompareButton")?.addEventListener("click",renderCompare);
  $("clearCompareButton")?.addEventListener("click",clearCompare);
  $("shareSiteButton")?.addEventListener("click",shareSite);
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!modal.hidden)closeDetails();
    if(event.key==="Escape"&&$("compareModal")&&!$("compareModal").hidden)closeCompare();
    if(event.key==="/"&&modal.hidden&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){
      event.preventDefault();search.focus();
    }
  });
  $("surpriseButton").addEventListener("click",()=>{
    const visible=cards.filter(card=>!card.hidden);
    const pool=visible.length?visible:cards;
    if(!pool.length)return;
    const chosen=pool[Math.floor(Math.random()*pool.length)];
    cards.forEach(card=>card.classList.remove("picked"));
    chosen.scrollIntoView({behavior:"smooth",block:"center"});
    chosen.classList.add("picked");
    toast("پیشنهاد شانسی: "+chosen.dataset.title);
    window.setTimeout(()=>chosen.classList.remove("picked"),1800);
  });
  $("announcementClose").addEventListener("click",()=>{
    announcementDismissed=true;
    $("announcementBar").hidden=true;
  });
  const menuToggle=$("menuToggle");
  const nav=document.querySelector(".nav");
  menuToggle.addEventListener("click",()=>{
    const open=nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded",String(open));
    menuToggle.textContent=open?"×":"☰";
  });
  nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded","false");
    menuToggle.textContent="☰";
  }));
  $("currentYear").textContent=String(new Date().getFullYear());
  const backToTop=$("backToTop");
  window.addEventListener("scroll",()=>backToTop.classList.toggle("visible",window.scrollY>520),{passive:true});
  backToTop.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
  let installPrompt=null;
  const installButton=$("installAppButton");
  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();
    installPrompt=event;
    installButton.hidden=false;
  });
  installButton.addEventListener("click",async()=>{
    if(!installPrompt){toast("برای نصب، از منوی مرورگر گزینه Install یا Add to Home Screen را انتخاب کن.");return;}
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt=null;
    installButton.hidden=true;
  });
  window.addEventListener("appinstalled",()=>{
    installButton.hidden=true;
    toast("GameVortex به دستگاهت اضافه شد.");
  });
  if("serviceWorker" in navigator && location.protocol==="https:"){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(error=>console.info("Offline cache unavailable",error)));
  }
  const originalCards=cards.slice();
  const existingTitles=new Set(cards.map(card=>(card.dataset.title||"").trim().toLocaleLowerCase()));
  const catalogCards=(window.GAMEVORTEX_CATALOG||[]).filter(game=>!existingTitles.has((game.title||"").trim().toLocaleLowerCase())).map(createGameCard);
  if(catalogCards.length)grid.append(...catalogCards);
  cards=[...cards,...catalogCards];
  originalCards.forEach((card,index)=>{card.dataset.order=card.dataset.order||String(index);bindCard(card);});
  populatePlatformFilter();
  syncFavorites();
  syncCompare();
  updateHeroStats(cards);
  applyFilters();
  openSharedGameFromUrl();
  loadSharedData();
})();