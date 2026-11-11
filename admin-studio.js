(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  let attached=false, draftTimer=null;
  const DRAFT_KEY="gamevortex-admin-editor-autosave-v2";

  const style=document.createElement("style");
  style.id="gvAdminStudioStyles";
  style.textContent=`
    .gv-health{margin:16px 0 18px;padding:18px;background:linear-gradient(125deg,#191b25,#11131a);border:1px solid #3a3e4c;border-radius:10px;box-shadow:0 18px 42px #0003}
    .gv-health-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:14px}
    .gv-health-head h3{margin:4px 0;font-size:17px}.gv-health-head p{margin:0;color:#9096a5;font-size:9px}
    .gv-health-score{min-width:76px;height:76px;border-radius:50%;display:grid;place-content:center;text-align:center;background:conic-gradient(#8af0c5 var(--gv-score,0%),#303440 0);position:relative;color:#fff;font-weight:900}
    .gv-health-score:before{content:"";position:absolute;inset:7px;border-radius:50%;background:#151821}
    .gv-health-score strong,.gv-health-score small{position:relative;z-index:1}.gv-health-score strong{font-size:20px;line-height:1.1}.gv-health-score small{font-size:7px;color:#9ca2af}
    .gv-health-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
    .gv-health-item{padding:11px;background:#0c0f15;border:1px solid #2f3340;border-radius:6px}
    .gv-health-item span{display:block;color:#858c9b;font-size:8px}.gv-health-item strong{display:block;color:#f0f2f6;font-size:19px;margin-top:3px}
    .gv-health-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
    .gv-health-actions button,.gv-editor-tools button{border:1px solid #3a3f4d;background:#1b1e29;color:#e2e4ec;border-radius:5px;padding:8px 10px;font:inherit;font-size:9px;cursor:pointer}
    .gv-health-actions button:hover,.gv-editor-tools button:hover{border-color:#aa4b5e;background:#291923}
    .gv-editor-lab{margin:12px 0;padding:13px;background:#0d1017;border:1px solid #353a48;border-radius:7px}
    .gv-editor-lab-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}
    .gv-editor-lab-head strong{font-size:11px;color:#f2f3f6}.gv-editor-lab-head span{font-size:8px;color:#8e95a4}
    .gv-editor-tools{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
    .gv-editor-preview{display:grid;grid-template-columns:110px minmax(0,1fr);gap:12px;align-items:center;padding:9px;background:#171a24;border:1px solid #303644;border-radius:6px}
    .gv-editor-preview img{width:110px;height:72px;object-fit:cover;border-radius:4px;background:#272a36}
    .gv-editor-preview h4{margin:0 0 3px;font-size:12px;color:#fff}.gv-editor-preview p{margin:0 0 6px;color:#9ba1af;font-size:9px;line-height:1.7}
    .gv-editor-preview a{font-size:9px;color:#ff9aa7}.gv-editor-preview a[hidden]{display:none}
    .gv-editor-meter{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;margin-top:9px;color:#969cab;font-size:8px}
    .gv-editor-meter progress{width:100%;height:7px;accent-color:#8af0c5}
    .gv-editor-status{min-height:16px;color:#9ce4c4;font-size:8px;margin-top:7px}
    .gv-field-hint{display:flex;justify-content:space-between;gap:8px;color:#7f8796;font-size:8px;margin-top:3px}
    .gv-field-hint .bad{color:#ff8f9d}.gv-field-hint .good{color:#8af0c5}
    .gv-shortcut-hint{margin-top:10px;color:#6f7786;font-size:8px}
    .gv-shortcut-hint kbd{background:#222632;border:1px solid #414654;border-radius:3px;padding:2px 5px;color:#c2c7d1}
    .gv-report{white-space:pre-wrap;overflow-wrap:anywhere}
    @media(max-width:950px){.gv-health-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:600px){.gv-health{padding:13px}.gv-health-head{align-items:flex-start}.gv-health-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gv-editor-preview{grid-template-columns:80px minmax(0,1fr)}.gv-editor-preview img{width:80px;height:65px}}
  `;
  document.head.append(style);

  function safeHttps(value){try{const url=new URL(value);return url.protocol==="https:"?url.href:"";}catch{return "";}}
  function status(text,good=true){const node=$("gvEditorStatus");if(node){node.textContent=text;node.style.color=good?"#9ce4c4":"#ff9aa7";}}
  function report(title,lines){
    const old=$("gvHealthReport");if(old)old.remove();
    const box=document.createElement("div");box.id="gvHealthReport";box.className="admin-pro-report";
    const head=document.createElement("div");head.className="admin-pro-report-head";
    const strong=document.createElement("strong");strong.textContent=title;
    const close=document.createElement("button");close.className="admin-button small ghost";close.type="button";close.textContent="بستن";close.addEventListener("click",()=>box.remove());
    head.append(strong,close);
    const pre=document.createElement("pre");pre.className="gv-report";pre.textContent=lines.join("\n");
    box.append(head,pre);$("gvHealth").append(box);
  }
  function attach(){
    const api=window.GAMEVORTEX_ADMIN_API, dashboard=$("dashboard");
    if(attached||!api||!dashboard||dashboard.hidden)return;
    attached=true;

    const health=document.createElement("section");health.id="gvHealth";health.className="gv-health";
    health.innerHTML='<div class="gv-health-head"><div><div class="panel-kicker">CONTENT INTELLIGENCE / QUALITY CONTROL</div><h3>داشبورد سلامت کتابخانه</h3><p>کیفیت و کامل‌بودن اطلاعات بازی‌ها را پیش از انتشار بررسی کن.</p></div><div class="gv-health-score" id="gvHealthScore"><strong>—</strong><small>امتیاز محتوا</small></div></div><div class="gv-health-grid" id="gvHealthGrid"></div><div class="gv-health-actions"><button type="button" id="gvFindIncomplete">انتخاب بازی‌های ناقص</button><button type="button" id="gvShowDuplicate">گزارش نام‌های تکراری</button><button type="button" id="gvExportQuality">خروجی گزارش کیفیت</button><button type="button" id="gvRefreshHealth">به‌روزرسانی آمار</button></div>';
    const stats=$("dashboard").querySelector(".stats-row");
    if(stats)stats.insertAdjacentElement("afterend",health);else dashboard.prepend(health);

    const editor=$("gameForm"), editorCard=editor?.closest(".editor-card");
    if(editorCard){
      const lab=document.createElement("section");lab.id="gvEditorLab";lab.className="gv-editor-lab";
      lab.innerHTML='<div class="gv-editor-lab-head"><strong>استودیوی پیش‌نمایش و بررسی</strong><span>پیش‌نمایش محلی؛ هنوز ذخیره نشده</span></div><div class="gv-editor-tools"><button type="button" id="gvNormalizeTitle">اصلاح فاصله نام</button><button type="button" id="gvTrimDescription">مرتب‌سازی توضیحات</button><button type="button" id="gvFillOrder">پیشنهاد ترتیب نمایش</button><button type="button" id="gvCopySummary">کپی خلاصه بازی</button><button type="button" id="gvRestoreDraft">بازیابی پیش‌نویس خودکار</button></div><div class="gv-editor-preview"><img id="gvPreviewImage" alt="پیش‌نمایش جلد بازی" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27220%27 height=%27144%27 viewBox=%270 0 220 144%27%3E%3Crect width=%27220%27 height=%27144%27 fill=%27%231b1e29%27/%3E%3Ctext x=%27110%27 y=%2780%27 font-size=%2724%27 text-anchor=%27middle%27 fill=%27%23ff8795%27%3EGV%3C/text%3E%3C/svg%3E"><div><h4 id="gvPreviewTitle">نام بازی</h4><p id="gvPreviewDescription">توضیحات در این قسمت دیده می‌شود.</p><a id="gvPreviewLink" href="#" target="_blank" rel="noopener noreferrer" hidden>بازکردن لینک رسمی ↗</a></div></div><div class="gv-editor-meter"><span>کیفیت محتوای فرم</span><strong id="gvEditorScore">۰٪</strong><progress id="gvEditorProgress" max="100" value="0"></progress><span id="gvEditorChecklist">نام، توضیح، لینک و پلتفرم را تکمیل کن.</span></div><div class="gv-editor-status" id="gvEditorStatus" role="status"></div><div class="gv-shortcut-hint">میانبرها: <kbd>Ctrl + Enter</kbd> ذخیره فرم · <kbd>Ctrl + S</kbd> ذخیره پیش‌نویس روی همین مرورگر</div>';
      editor.insertAdjacentElement("beforebegin",lab);
    }

    const fields=["gameTitle","gameCategory","gameTheme","gameDescription","gameUrl","gameCover","gamePlatforms","gameOrder","gamePublished","gameFeatured"];
    function formData(){
      const data={};
      fields.forEach(id=>{const el=$(id);if(el)data[id]=el.type==="checkbox"?el.checked:el.value;});
      return data;
    }
    function saveDraft(){
      try{localStorage.setItem(DRAFT_KEY,JSON.stringify({savedAt:new Date().toISOString(),fields:formData()}));status("پیش‌نویس فرم به‌صورت محلی ذخیره شد.");}
      catch{status("ذخیره محلی ممکن نشد؛ فضای مرورگر را بررسی کن.",false);}
    }
    function restoreDraft(){
      try{
        const saved=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");
        if(!saved?.fields)throw Error("پیش‌نویس ذخیره‌شده‌ای پیدا نشد.");
        Object.entries(saved.fields).forEach(([id,value])=>{const el=$(id);if(!el)return;if(el.type==="checkbox")el.checked=Boolean(value);else el.value=String(value??"");});
        updatePreview();status("پیش‌نویس بازیابی شد؛ برای ثبت نهایی ذخیره بازی را بزن.");
      }catch(error){status(error.message||"بازیابی انجام نشد.",false);}
    }
    function updatePreview(){
      if(!$("gvPreviewTitle"))return;
      const title=$("gameTitle").value.trim()||"نام بازی";
      const description=$("gameDescription").value.trim()||"توضیحات در این قسمت دیده می‌شود.";
      $("gvPreviewTitle").textContent=title;
      $("gvPreviewDescription").textContent=description.length>140?description.slice(0,137)+"…":description;
      const link=safeHttps($("gameUrl").value.trim());
      $("gvPreviewLink").hidden=!link;
      if(link)$("gvPreviewLink").href=link;
      const cover=safeHttps($("gameCover").value.trim());
      const img=$("gvPreviewImage");
      if(cover){img.src=cover;img.onerror=()=>{img.removeAttribute("src");};}
      else img.src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27220%27 height=%27144%27%3E%3Crect width=%27220%27 height=%27144%27 fill=%27%231b1e29%27/%3E%3Ctext x=%27110%27 y=%2780%27 font-size=%2724%27 text-anchor=%27middle%27 fill=%27%23ff8795%27%3EGV%3C/text%3E%3C/svg%3E";
      const value=formData(), checks=[
        Boolean(value.gameTitle?.trim()),Boolean(value.gameDescription?.trim()&&value.gameDescription.trim().length>=45),
        Boolean(safeHttps(value.gameUrl)),Boolean(value.gamePlatforms?.trim()),Boolean(safeHttps(value.gameCover)),
        Boolean(value.gameCategory),Boolean(Number.isFinite(Number(value.gameOrder))),Boolean(value.gameDescription?.trim().length<=700)
      ];
      const score=Math.round(checks.filter(Boolean).length/checks.length*100);
      $("gvEditorScore").textContent=score+"٪";$("gvEditorProgress").value=score;
      $("gvEditorChecklist").textContent=checks.filter(Boolean).length+" از ۸ بررسی انجام شده است.";
      const duplicate=api.getGames().some(row=>row.title?.trim().toLocaleLowerCase()===title.toLocaleLowerCase()&&row.id!==$("gameId").value);
      if(duplicate){$("gvEditorChecklist").textContent+=" · نام تکراری است";$("gvEditorChecklist").style.color="#ff8f9d";}
      else $("gvEditorChecklist").style.color="#8af0c5";
      const titleCounter=$("gvTitleCounter");if(titleCounter)titleCounter.textContent=String($("gameTitle").value.length)+"/90";
      const descCounter=$("gvDescCounter");if(descCounter)descCounter.textContent=String($("gameDescription").value.length)+"/700";
      return {score,checks,duplicate};
    }
    function qualityData(){
      const games=api.getGames(),published=games.filter(x=>x.is_published).length;
      const incomplete=games.filter(x=>!String(x.description||"").trim()||!String(x.platforms||"").trim()||!safeHttps(x.official_url||""));
      const noCover=games.filter(x=>!safeHttps(x.cover_url||""));
      const dup=new Map();
      games.forEach(x=>{const key=String(x.title||"").trim().toLowerCase();if(key)dup.set(key,(dup.get(key)||0)+1);});
      const duplicateCount=Array.from(dup.values()).filter(n=>n>1).length;
      const ratio=games.length?Math.round((games.length-incomplete.length)/games.length*100):0;
      const tiles=[
        ["کل بازی‌ها",games.length],["منتشرشده",published],["پیش‌نویس",games.length-published],
        ["نیازمند تکمیل",incomplete.length],["بدون جلد",noCover.length]
      ];
      $("gvHealthGrid").replaceChildren();
      tiles.forEach(([label,value])=>{const item=document.createElement("div");item.className="gv-health-item";const span=document.createElement("span");span.textContent=label;const strong=document.createElement("strong");strong.textContent=String(value);item.append(span,strong);$("gvHealthGrid").append(item);});
      $("gvHealthScore").style.setProperty("--gv-score",ratio+"%");
      $("gvHealthScore").querySelector("strong").textContent=ratio+"%";
      return {games,published,incomplete,noCover,duplicateCount,ratio};
    }
    function runQuality(){
      const q=qualityData();
      const dup=new Map();q.games.forEach(x=>{const k=String(x.title||"").trim().toLowerCase();if(k)dup.set(k,(dup.get(k)||0)+1);});
      const duplicates=Array.from(dup.entries()).filter(([,n])=>n>1).map(([name,n])=>name+" ("+n+")");
      reportLines("گزارش سلامت محتوا",[
        "امتیاز تکمیل اطلاعات: "+q.ratio+"%",
        "تعداد کل: "+q.games.length,
        "منتشرشده: "+q.published,
        "پیش‌نویس: "+(q.games.length-q.published),
        "بازی‌های نیازمند تکمیل: "+q.incomplete.length,
        "بازی‌های بدون جلد: "+q.noCover.length,
        "گروه نام‌های تکراری: "+q.duplicateCount,
        "",
        "موارد نیازمند تکمیل:",
        ...q.incomplete.slice(0,60).map(x=>"• "+x.title),
        "",
        "نام‌های تکراری:",
        ...(duplicates.length?duplicates:["موردی پیدا نشد."])
      ]);
      return q;
    }
    function reportLines(title,lines){
      const old=$("gvHealthReport");if(old)old.remove();
      const box=document.createElement("div");box.id="gvHealthReport";box.className="admin-pro-report";
      const header=document.createElement("div");header.className="admin-pro-report-head";
      const strong=document.createElement("strong");strong.textContent=title;
      const close=document.createElement("button");close.className="admin-button small ghost";close.type="button";close.textContent="بستن";close.addEventListener("click",()=>box.remove());
      const download=document.createElement("button");download.className="admin-button small ghost";download.type="button";download.textContent="دانلود گزارش";download.addEventListener("click",()=>downloadJson("gamevortex-quality-report.json",{createdAt:new Date().toISOString(),title,lines}));
      header.append(strong,download,close);
      const pre=document.createElement("pre");pre.textContent=lines.join("\n");pre.style.whiteSpace="pre-wrap";
      box.append(header,pre);health.append(box);
      box.scrollIntoView({behavior:"smooth",block:"nearest"});
    }
    function downloadJson(name,data){
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
      const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }

    $("gvFindIncomplete").addEventListener("click",()=>{
      const rows=qualityData().incomplete;api.setSelectedIds(rows.map(x=>x.id));status(rows.length+" بازی ناقص انتخاب شد.");
    });
    $("gvShowDuplicate").addEventListener("click",()=>{
      const all=api.getGames(),map=new Map();all.forEach(x=>{const k=String(x.title||"").trim().toLowerCase();if(k)map.set(k,[...(map.get(k)||[]),x]);});
      const groups=Array.from(map.values()).filter(g=>g.length>1);
      api.setSelectedIds(groups.flat().map(x=>x.id));
      reportLines("نام‌های تکراری",groups.length?groups.map(g=>g.map(x=>x.title).join(" ↔ ")):["نام تکراری پیدا نشد."]);
    });
    $("gvExportQuality").addEventListener("click",()=>{
      const q=runQuality();downloadJson("gamevortex-content-audit.json",{generatedAt:new Date().toISOString(),total:q.games.length,score:q.ratio,incomplete:q.incomplete,noCover:q.noCover});
      status("گزارش کیفیت دانلود شد.");
    });
    $("gvRefreshHealth").addEventListener("click",()=>{qualityData();status("آمار سلامت به‌روز شد.");});
    $("gvNormalizeTitle").addEventListener("click",()=>{
      $("gameTitle").value=$("gameTitle").value.trim().replace(/\s+/g," ");updatePreview();status("فاصله‌های نام بازی مرتب شد؛ تغییر هنوز ذخیره نشده.");
    });
    $("gvTrimDescription").addEventListener("click",()=>{
      $("gameDescription").value=$("gameDescription").value.trim().replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n");updatePreview();status("توضیحات مرتب شد؛ تغییر هنوز ذخیره نشده.");
    });
    $("gvFillOrder").addEventListener("click",()=>{
      $("gameOrder").value=String(api.getGames().reduce((max,row)=>Math.max(max,Number(row.display_order)||0),0)+1);updatePreview();status("ترتیب پیشنهادی قرار گرفت؛ ذخیره نهایی با خودت است.");
    });
    $("gvCopySummary").addEventListener("click",()=>{
      const text="بازی: "+$("gameTitle").value+"\nدسته: "+$("gameCategory").selectedOptions[0]?.text+"\nپلتفرم: "+$("gamePlatforms").value+"\nتوضیحات: "+$("gameDescription").value+"\nلینک: "+$("gameUrl").value;
      navigator.clipboard?.writeText(text).then(()=>status("خلاصه بازی کپی شد.")).catch(()=>status("کپی در این مرورگر در دسترس نیست.",false));
    });
    $("gvRestoreDraft").addEventListener("click",restoreDraft);

    fields.forEach(id=>{
      $(id)?.addEventListener("input",()=>{
        updatePreview();
        clearTimeout(draftTimer);
        draftTimer=setTimeout(saveDraft,850);
      });
      $(id)?.addEventListener("change",updatePreview);
    });
    $("gameForm").addEventListener("submit",()=>{try{localStorage.removeItem(DRAFT_KEY);}catch{}});
    $("gameTitle").insertAdjacentHTML("afterend",'<div class="gv-field-hint"><span>نام یکتا و کوتاه بهتر دیده می‌شود.</span><span id="gvTitleCounter">0/90</span></div>');
    $("gameDescription").insertAdjacentHTML("afterend",'<div class="gv-field-hint"><span>توضیح کوتاه و خوانا؛ حداکثر ۷۰۰ نویسه.</span><span id="gvDescCounter">0/700</span></div>');
    document.addEventListener("keydown",event=>{
      if(!dashboard||dashboard.hidden)return;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="s"&&editorCardContains(document.activeElement)){
        event.preventDefault();saveDraft();
      }
      if((event.ctrlKey||event.metaKey)&&event.key==="Enter"&&editorCardContains(document.activeElement)){
        event.preventDefault();$("saveGameButton").click();
      }
    });
    function editorCardContains(node){return Boolean(node&&node.closest&&node.closest(".editor-card"));}
    qualityData();updatePreview();
  }

  window.addEventListener("gamevortex:admin-ready",attach);
  if(window.GAMEVORTEX_ADMIN_API)attach();
  const dashboard=$("dashboard");
  if(dashboard){new MutationObserver(()=>{if(!attached&&window.GAMEVORTEX_ADMIN_API&&!dashboard.hidden)attach();}).observe(dashboard,{attributes:true,attributeFilter:["hidden"]});}
})();