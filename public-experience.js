(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const grid=$("gameGrid"), library=$("games");
  if(!grid||!library||$("gxDiscovery"))return;
  const RECENT_KEY="gamevortex-recent-v1", VIEW_KEY="gamevortex-view-v1", QUERY_KEY="gamevortex-search-history-v1";
  let recent=[], queryHistory=[], view="grid";
  try{recent=JSON.parse(localStorage.getItem(RECENT_KEY)||"[]");if(!Array.isArray(recent))recent=[];}catch{recent=[];}
  try{queryHistory=JSON.parse(localStorage.getItem(QUERY_KEY)||"[]");if(!Array.isArray(queryHistory))queryHistory=[];}catch{queryHistory=[];}
  try{view=localStorage.getItem(VIEW_KEY)||"grid";}catch{}
  if(!["grid","list","compact"].includes(view))view="grid";

  const style=document.createElement("style");
  style.id="gxExperienceStyles";
  style.textContent=`
    .gx-discovery{margin:18px 0 20px;padding:17px;background:linear-gradient(135deg,#171923,#11131a 70%);border:1px solid #343744;border-radius:11px;box-shadow:0 18px 42px #0003}
    .gx-discovery-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
    .gx-discovery-title{display:flex;align-items:center;gap:10px}
    .gx-discovery-orb{width:38px;height:38px;display:grid;place-items:center;border:1px solid #8a3d50;border-radius:11px;background:radial-gradient(circle,#592635,#19121a);font-size:19px;color:#ff9ba8;box-shadow:0 0 24px #ff46551c}
    .gx-discovery-head h3{font-size:14px;margin:0}.gx-discovery-head p{font-size:9px;color:#8d93a1;margin:2px 0 0}
    .gx-discovery-actions{display:flex;gap:6px;flex-wrap:wrap}
    .gx-btn{border:1px solid #393d4b;border-radius:6px;background:#1a1d27;color:#dfe2eb;padding:8px 11px;font:inherit;font-size:9px;cursor:pointer;transition:.2s}
    .gx-btn:hover,.gx-btn[aria-pressed=true]{border-color:#b94e61;background:#2a1821;color:#fff}
    .gx-btn-primary{background:#ff4655;border-color:#ff4655;color:#fff}
    .gx-fields{display:grid;grid-template-columns:1.3fr 1fr 1fr auto;gap:8px;align-items:end}
    .gx-fields label{display:grid;gap:5px;color:#aeb2bf;font-size:9px}
    .gx-fields input,.gx-fields select{height:39px;width:100%;min-width:0;border:1px solid #383d49;border-radius:6px;background:#090b11;color:#f2f3f7;padding:0 10px;font:inherit;font-size:10px}
    .gx-fields input:focus,.gx-fields select:focus{outline:2px solid #ff6575;outline-offset:1px}
    .gx-lower{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px;padding-top:11px;border-top:1px solid #ffffff12}
    .gx-view-tools,.gx-recent-tools{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .gx-muted{font-size:9px;color:#858b9a}
    .gx-recent{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;min-height:26px}
    .gx-recent button{max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid #383b49;background:#131620;color:#aeb5c4;border-radius:30px;padding:5px 10px;font:inherit;font-size:8px;cursor:pointer}
    .gx-recent button:hover{border-color:#b84d61;color:#fff}
    .gx-quick-result{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding:8px 11px;border-radius:6px;border:1px solid #3c3541;background:#100f17;color:#aeb2bf;font-size:9px}
    .gx-quick-result strong{color:#ff9ba8}
    .gx-scroll-progress{position:fixed;z-index:120;top:0;right:0;left:0;height:3px;background:#ffffff0a;pointer-events:none}
    .gx-scroll-progress span{display:block;width:0;height:100%;background:linear-gradient(90deg,#ff4655,#ffb16b);box-shadow:0 0 12px #ff4655}
    .gx-reveal{animation:gxRise .45s both}@keyframes gxRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    #gameGrid.gx-layout-list{grid-template-columns:1fr;gap:10px}
    #gameGrid.gx-layout-list .game-card{display:grid;grid-template-columns:minmax(160px,260px) minmax(0,1fr);align-items:stretch}
    #gameGrid.gx-layout-list .game-art{height:100%;min-height:165px}
    #gameGrid.gx-layout-list .card-info{padding:15px;display:flex;flex-direction:column;justify-content:center}
    #gameGrid.gx-layout-list .card-info p{font-size:10px;line-height:1.9}
    #gameGrid.gx-layout-compact{grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
    #gameGrid.gx-layout-compact .game-card{padding:5px}
    #gameGrid.gx-layout-compact .game-art{height:112px}
    #gameGrid.gx-layout-compact .card-info{padding:8px 5px 3px}
    #gameGrid.gx-layout-compact .card-info p{display:none}
    #gameGrid.gx-layout-compact .compare-button{display:none}
    .gx-empty-tip{margin-top:10px;color:#999eac;font-size:9px}
    .gx-count-badge{display:inline-flex;align-items:center;gap:5px;border:1px solid #383b49;background:#141720;border-radius:30px;padding:5px 9px;color:#9da4b2;font-size:8px}
    .gx-count-badge b{color:#ff8997}
    @media(max-width:950px){.gx-fields{grid-template-columns:1fr 1fr}#gameGrid.gx-layout-compact{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:600px){.gx-discovery{padding:12px}.gx-discovery-head{align-items:flex-start;flex-direction:column}.gx-fields{grid-template-columns:1fr 1fr}.gx-fields label:first-child{grid-column:1/-1}.gx-fields .gx-btn{min-height:39px}#gameGrid.gx-layout-list .game-card{grid-template-columns:110px minmax(0,1fr)}#gameGrid.gx-layout-list .game-art{min-height:140px}#gameGrid.gx-layout-list .card-info{padding:8px}#gameGrid.gx-layout-compact{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(prefers-reduced-motion:reduce){.gx-reveal{animation:none}}
  `;
  document.head.append(style);

  const panel=document.createElement("section");
  panel.className="gx-discovery gx-reveal";
  panel.id="gxDiscovery";
  panel.innerHTML=`
    <div class="gx-discovery-head">
      <div class="gx-discovery-title"><span class="gx-discovery-orb">✦</span><div><h3>کشف‌گر هوشمند GameVortex</h3><p>فیلترهای موردنظرت را انتخاب کن و سریع‌تر به بازی مناسب برس.</p></div></div>
      <div class="gx-discovery-actions"><span class="gx-count-badge">کتابخانه <b id="gxLibraryCount">۰</b> بازی</span><button class="gx-btn" id="gxShareFilters" type="button">اشتراک‌گذاری جست‌وجو ↗</button></div>
    </div>
    <div class="gx-fields">
      <label>دنبال چه سبکی هستی؟<select id="gxCategory"><option value="all">همه سبک‌ها</option><option value="action">اکشن و رقابتی</option><option value="strategy">استراتژی</option><option value="puzzle">فکری و معمایی</option><option value="sport">ورزشی و مسابقه‌ای</option><option value="creative">خلاقانه و آرامش‌بخش</option></select></label>
      <label>پلتفرم<select id="gxPlatform"><option value="all">همه دستگاه‌ها</option><option value="PC">PC</option><option value="PlayStation">PlayStation</option><option value="Xbox">Xbox</option><option value="Nintendo Switch">Nintendo Switch</option><option value="Mobile">Mobile</option></select></label>
      <label>کلمهٔ کلیدی<input id="gxKeyword" type="search" maxlength="80" placeholder="مثلاً همکاری، معما، ساخت‌وساز..."></label>
      <button class="gx-btn gx-btn-primary" id="gxApply" type="button">پیدا کن ←</button>
    </div>
    <div class="gx-lower">
      <div class="gx-view-tools"><span class="gx-muted">نمایش:</span><button class="gx-btn" data-gx-view="grid" type="button">کاشی</button><button class="gx-btn" data-gx-view="list" type="button">فهرست</button><button class="gx-btn" data-gx-view="compact" type="button">فشرده</button><button class="gx-btn" id="gxClear" type="button">پاک‌کردن فیلتر</button></div>
      <div class="gx-recent-tools"><span class="gx-muted">آخرین بازدیدها:</span><button class="gx-btn" id="gxClearRecent" type="button">پاک‌کردن تاریخچه</button></div>
    </div>
    <div class="gx-recent" id="gxRecentList" aria-live="polite"></div>
    <div class="gx-quick-result" id="gxResult" hidden><span>نتیجهٔ کشف‌گر</span><strong id="gxResultText"></strong></div>
  `;
  const tools=document.querySelector(".library-tools");
  if(tools)tools.insertAdjacentElement("afterend",panel);
  else grid.insertAdjacentElement("beforebegin",panel);

  const progress=document.createElement("div");
  progress.className="gx-scroll-progress";
  progress.innerHTML="<span></span>";
  document.body.append(progress);
  const search=$("gameSearch"), platform=$("platformFilter");
  const filterButtons=Array.from(document.querySelectorAll(".filter"));

  function cards(){return Array.from(grid.querySelectorAll(".game-card"));}
  function localDigits(value){return String(value).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);}
  function setView(next){
    view=next;
    grid.classList.remove("gx-layout-list","gx-layout-compact");
    if(next==="list")grid.classList.add("gx-layout-list");
    if(next==="compact")grid.classList.add("gx-layout-compact");
    try{localStorage.setItem(VIEW_KEY,next);}catch{}
    document.querySelectorAll("[data-gx-view]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.gxView===next)));
  }
  function currentCategory(){return document.querySelector(".filter.active")?.dataset.filter||"all";}
  function setCategory(value){
    const button=filterButtons.find(item=>item.dataset.filter===value);
    if(button)button.click();
  }
  function applySmartSearch(){
    const category=$("gxCategory").value, selectedPlatform=$("gxPlatform").value, keyword=$("gxKeyword").value.trim();
    setCategory(category);
    if(platform){platform.value=selectedPlatform;platform.dispatchEvent(new Event("change",{bubbles:true}));}
    if(search){search.value=keyword;search.dispatchEvent(new Event("input",{bubbles:true}));}
    if(keyword){
      queryHistory=[keyword,...queryHistory.filter(item=>item!==keyword)].slice(0,8);
      try{localStorage.setItem(QUERY_KEY,JSON.stringify(queryHistory));}catch{}
    }
    const visible=cards().filter(card=>!card.hidden);
    $("gxResult").hidden=false;
    $("gxResultText").textContent=visible.length?localDigits(visible.length)+" بازی پیدا شد":"نتیجه‌ای نبود؛ فیلترها را کمی بازتر کن.";
    if(visible[0])visible[0].scrollIntoView({behavior:"smooth",block:"center"});
    renderCount();
  }
  function renderCount(){
    $("gxLibraryCount").textContent=localDigits(cards().length);
  }
  function renderRecent(){
    const box=$("gxRecentList");
    box.replaceChildren();
    const available=new Set(cards().map(card=>card.dataset.title));
    recent=recent.filter(title=>available.has(title)).slice(0,8);
    if(!recent.length){const span=document.createElement("span");span.className="gx-muted";span.textContent="هنوز بازی‌ای از جزئیات باز نشده است.";box.append(span);return;}
    recent.forEach(title=>{
      const button=document.createElement("button");button.type="button";button.textContent=title;button.title="بازکردن جزئیات "+title;
      button.addEventListener("click",()=>{
        const card=cards().find(item=>item.dataset.title===title);
        if(card){card.scrollIntoView({behavior:"smooth",block:"center"});card.querySelector("[data-details]")?.click();}
      });
      box.append(button);
    });
  }
  function addRecent(title){
    if(!title)return;
    recent=[title,...recent.filter(item=>item!==title)].slice(0,8);
    try{localStorage.setItem(RECENT_KEY,JSON.stringify(recent));}catch{}
    renderRecent();
  }
  function shareFilters(){
    const url=new URL(location.href);
    url.hash="games";
    url.searchParams.set("gv_category",currentCategory());
    url.searchParams.set("gv_platform",platform?.value||"all");
    if(search?.value.trim())url.searchParams.set("gv_q",search.value.trim());else url.searchParams.delete("gv_q");
    const value=url.href;
    if(navigator.share)navigator.share({title:"جست‌وجوی من در GameVortex",text:"این فیلترها را ببین.",url:value}).catch(()=>{});
    else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>toast("لینک جست‌وجو کپی شد.")).catch(()=>toast(value));
    else toast(value);
  }
  function toast(message){
    const old=$("toast");
    if(old){old.textContent=message;old.classList.add("show");setTimeout(()=>old.classList.remove("show"),2200);}
  }
  $("gxApply").addEventListener("click",applySmartSearch);
  $("gxKeyword").addEventListener("keydown",event=>{if(event.key==="Enter")applySmartSearch();});
  $("gxClear").addEventListener("click",()=>{
    $("gxCategory").value="all";$("gxPlatform").value="all";$("gxKeyword").value="";
    $("resetFilters")?.click();$("gxResult").hidden=true;renderCount();
  });
  $("gxShareFilters").addEventListener("click",shareFilters);
  $("gxClearRecent").addEventListener("click",()=>{
    recent=[];try{localStorage.removeItem(RECENT_KEY);}catch{}renderRecent();toast("تاریخچه پاک شد.");
  });
  panel.querySelectorAll("[data-gx-view]").forEach(button=>button.addEventListener("click",()=>setView(button.dataset.gxView)));
  grid.addEventListener("click",event=>{
    const details=event.target.closest("[data-details]");
    if(!details)return;
    const card=details.closest(".game-card");
    if(card)addRecent(card.dataset.title);
  });
  const observer=new MutationObserver(()=>{renderCount();renderRecent();});
  observer.observe(grid,{childList:true});
  const recentBoot=()=>{renderCount();renderRecent();setView(view);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",recentBoot,{once:true});else recentBoot();

  const query=new URL(location.href);
  const sharedCategory=query.searchParams.get("gv_category");
  const sharedPlatform=query.searchParams.get("gv_platform");
  const sharedQuery=query.searchParams.get("gv_q");
  if(sharedCategory&&["all","action","strategy","puzzle","sport","creative"].includes(sharedCategory))setCategory(sharedCategory);
  if(sharedPlatform&&platform&&Array.from(platform.options).some(option=>option.value===sharedPlatform)){platform.value=sharedPlatform;platform.dispatchEvent(new Event("change",{bubbles:true}));}
  if(sharedQuery&&search){search.value=sharedQuery;search.dispatchEvent(new Event("input",{bubbles:true}));$("gxKeyword").value=sharedQuery;}

  let scheduled=false;
  const updateProgress=()=>{
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      const max=document.documentElement.scrollHeight-window.innerHeight;
      const percent=max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):0;
      progress.firstElementChild.style.width=percent+"%";
    });
  };
  window.addEventListener("scroll",updateProgress,{passive:true});
  window.addEventListener("resize",updateProgress);
  updateProgress();
})();