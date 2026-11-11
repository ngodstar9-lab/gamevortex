(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const groups=[
    ["گزارش‌ها و آمار","نمای کلی از وضعیت کتابخانه.",[["overview","گزارش کلی کتابخانه"],["categories","آمار دسته‌بندی‌ها"],["publishing","آمار انتشار"],["recent","۱۰ تغییر اخیر"],["quality","گزارش کیفیت محتوا"]]],
    ["بازبینی و سلامت داده","تکراری‌ها و اطلاعات ناقص را پیدا کن.",[["duplicate_titles","پیداکردن نام‌های تکراری"],["duplicate_links","پیداکردن لینک‌های تکراری"],["bad_links","بررسی لینک‌های غیر HTTPS"],["missing_descriptions","بازی‌های بدون توضیح"],["missing_covers","بازی‌های بدون تصویر جلد"]]],
    ["فیلترهای سریع","جدول مدیریت را روی یک مجموعه تنظیم کن.",[["filter_published","فقط منتشرشده‌ها"],["filter_drafts","فقط پیش‌نویس‌ها"],["filter_featured","فقط بازی‌های ویژه"],["filter_action","فقط اکشن"],["filter_puzzle","فقط فکری"]]],
    ["انتخاب هوشمند","انتخاب گروهی بر اساس وضعیت و کیفیت.",[["select_visible","انتخاب نتایج فعلی"],["select_published","انتخاب منتشرشده‌ها"],["select_drafts","انتخاب پیش‌نویس‌ها"],["select_incomplete","انتخاب اطلاعات ناقص"],["clear_selection","پاک‌کردن انتخاب‌ها"]]],
    ["عملیات گروهی","وضعیت چند بازی را با هم تغییر بده.",[["publish","انتشار منتخب‌ها"],["draft","تبدیل منتخب‌ها به پیش‌نویس"],["feature","ویژه‌کردن منتخب‌ها"],["unfeature","لغو ویژه برای منتخب‌ها"],["delete","حذف منتخب‌ها"]]],
    ["ویرایش گروهی","فیلدهای مشترک را با یک عملیات اصلاح کن.",[["set_category","تغییر دسته منتخب‌ها"],["set_platform","تغییر پلتفرم منتخب‌ها"],["set_theme","تغییر طرح کارت منتخب‌ها"],["trim_titles","پاک‌کردن فاصله اضافی نام‌ها"],["fill_platform","تکمیل پلتفرم خالی با PC"]]],
    ["خروجی و پشتیبان","گزارش و فایل قابل انتقال بساز.",[["export_selected_csv","خروجی CSV منتخب‌ها"],["export_published_csv","خروجی CSV منتشرشده‌ها"],["export_drafts_csv","خروجی CSV پیش‌نویس‌ها"],["export_selected_json","خروجی JSON منتخب‌ها"],["export_audit","خروجی گزارش سلامت"]]],
    ["انتشار و ترتیب","کنترل سریع چیدمان کتابخانه.",[["normalize_order","شماره‌گذاری مجدد ترتیب نمایش"],["alphabetical","مرتب‌سازی الفبایی جدول"],["reset_filters","بازنشانی فیلترها"],["refresh","بارگیری دوباره از دیتابیس"],["import_catalog","افزودن کاتالوگ پیشنهادی"]]],
    ["سایت و نشست مدیر","دسترسی سریع و نگهداری امن حساب.",[["open_site","بازکردن سایت عمومی"],["copy_site","کپی لینک سایت"],["session_info","نمایش اطلاعات نشست"],["save_editor","ذخیره پیش‌نویس فرم روی همین مرورگر"],["restore_editor","بازیابی پیش‌نویس فرم"]]],
    ["اعلان‌های سایت","ساخت اعلان آماده و کنترل متن.",[["notice_games","قالب اعلان بازی‌های تازه"],["notice_guide","قالب اعلان راهنمای تازه"],["notice_update","قالب اعلان به‌روزرسانی"],["clear_notice","پاک‌کردن متن اعلان"],["notice_count","بررسی تعداد نویسه اعلان"]]]
  ];
  let attached=false;
  function style(){
    if($("adminProStyles"))return;
    const s=document.createElement("style");s.id="adminProStyles";
    s.textContent=".admin-pro{margin-top:18px;padding:20px;background:#12151d;border:1px solid #343744;border-radius:7px}.admin-pro-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:14px}.admin-pro-head h3{font-size:19px;margin:4px 0}.admin-pro-head p{font-size:10px;color:#9298a7;margin:0}.admin-pro-count{border:1px solid #794455;background:#24151d;color:#ffb2bd;padding:7px 10px;border-radius:4px;font-size:9px;white-space:nowrap}.admin-pro-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.admin-pro-group{background:#0d1017;border:1px solid #2d3240;border-radius:5px;overflow:hidden}.admin-pro-group summary{cursor:pointer;padding:11px 13px;font-size:10px;color:#f1f2f5;font-weight:700;list-style:none}.admin-pro-group summary::-webkit-details-marker{display:none}.admin-pro-group summary:after{content:'＋';float:left;color:#ff7a8b}.admin-pro-group[open] summary:after{content:'−'}.admin-pro-group summary small{display:block;color:#7e8595;font-size:8px;font-weight:400;margin-top:3px}.admin-pro-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:0 9px 10px}.admin-pro-tools button{border:1px solid #343947;background:#171b25;color:#d9dce5;border-radius:4px;padding:8px;text-align:right;font:9px Vazirmatn,Tahoma,sans-serif;cursor:pointer;min-height:36px}.admin-pro-tools button:hover{border-color:#b44b60;background:#281820;color:white}.admin-pro-tools button:disabled{opacity:.45;cursor:not-allowed}.admin-pro-report{margin-top:12px;padding:12px;background:#090c12;border:1px solid #333846;border-radius:5px}.admin-pro-report[hidden]{display:none}.admin-pro-report-head{display:flex;justify-content:space-between;gap:8px;align-items:center;color:#ff9ba8;font-size:10px;margin-bottom:8px}.admin-pro-report pre{margin:0;color:#c6cad4;font:10px/2 Vazirmatn,Tahoma,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;max-height:280px;overflow:auto}.admin-pro-status{min-height:17px;margin-top:10px;color:#8fe0bd;font-size:9px}@media(max-width:760px){.admin-pro-groups{grid-template-columns:1fr}.admin-pro{padding:13px}.admin-pro-head{align-items:flex-start;flex-direction:column}}";
    document.head.append(s);
  }
  function attach(){
    const api=window.GAMEVORTEX_ADMIN_API,dashboard=$("dashboard");
    if(attached||!api||!dashboard||dashboard.hidden)return;
    attached=true;style();
    const section=document.createElement("section");section.className="admin-pro";section.id="adminPro";
    section.innerHTML='<div class="admin-pro-head"><div><div class="panel-kicker">ADVANCED CONTROL / 50 TOOLS</div><h3>مرکز ابزارهای پیشرفته</h3><p>۵۰ ابزار تازه برای بررسی داده، ویرایش دسته‌ای، خروجی و مدیریت سایت.</p></div><span class="admin-pro-count">۵۰ قابلیت مدیریتی</span></div><div class="admin-pro-groups" id="adminProGroups"></div><div class="admin-pro-report" id="adminProReport" hidden><div class="admin-pro-report-head"><strong id="adminProReportTitle">گزارش</strong><button type="button" class="admin-button small ghost" id="adminProReportClose">بستن گزارش</button></div><pre id="adminProReportText"></pre></div><div class="admin-pro-status" id="adminProStatus" role="status"></div>';
    const anchor=$("dashboard").querySelector(".settings-card");
    dashboard.insertBefore(section,anchor||null);
    const list=$("adminProGroups");
    groups.forEach(([title,description,items],index)=>{
      const details=document.createElement("details");details.className="admin-pro-group";details.open=index===0;
      const summary=document.createElement("summary");summary.textContent=title;const small=document.createElement("small");small.textContent=description;summary.append(small);
      const tools=document.createElement("div");tools.className="admin-pro-tools";
      items.forEach(([action,label])=>{const b=document.createElement("button");b.type="button";b.dataset.adminAction=action;b.textContent=label;tools.append(b);});
      details.append(summary,tools);list.append(details);
    });
    $("adminProReportClose").addEventListener("click",()=>{$("adminProReport").hidden=true;});
    list.addEventListener("click",event=>{
      const button=event.target.closest("[data-admin-action]");if(!button)return;
      run(button.dataset.adminAction,api).catch(error=>status("خطا: "+(error?.message||error)));
    });
    status("پنل ابزارهای پیشرفته آماده است.");
  }
  function status(text){const node=$("adminProStatus");if(node)node.textContent=text;}
  function report(title,lines){
    $("adminProReportTitle").textContent=title;
    $("adminProReportText").textContent=Array.isArray(lines)?lines.join("\n"):String(lines);
    $("adminProReport").hidden=false;
    $("adminProReport").scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  function download(name,content,type){
    const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function csvEscape(value){let s=String(value??"");if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function exportRows(rows,filename){
    const fields=["title","category","description","official_url","cover_url","platforms","art_theme","display_order","is_published","is_featured"];
    const content=[fields.join(","),...rows.map(row=>fields.map(key=>csvEscape(row[key])).join(","))].join("\r\n");
    download(filename,"\uFEFF"+content,"text/csv;charset=utf-8");
    status(rows.length+" ردیف خروجی گرفته شد.");
  }
  function duplicates(rows,keyFn){
    const map=new Map();rows.forEach(row=>{const key=keyFn(row);if(key){if(!map.has(key))map.set(key,[]);map.get(key).push(row);}});
    return Array.from(map.values()).filter(group=>group.length>1);
  }
  function select(api,rows){api.setSelectedIds(rows.map(row=>row.id).filter(Boolean));status(rows.length+" بازی انتخاب شد.");}
  function safeHttps(value){try{return new URL(value).protocol==="https:";}catch{return false;}}
  function announcement(text){
    const input=$("announcementText");input.value=text;$("announcementEnabled").checked=true;
    input.dispatchEvent(new Event("input",{bubbles:true}));$("announcementEnabled").dispatchEvent(new Event("change",{bubbles:true}));
    status("قالب اعلان در فرم قرار گرفت؛ برای انتشار، دکمه ذخیره تنظیمات را بزن.");
    input.scrollIntoView({behavior:"smooth",block:"center"});
  }
  function saveEditor(){
    const ids=["gameTitle","gameCategory","gameTheme","gameDescription","gameUrl","gameCover","gamePlatforms","gameOrder","gamePublished","gameFeatured"];
    const data={savedAt:new Date().toISOString(),fields:{}};
    ids.forEach(id=>{const el=$(id);data.fields[id]=el.type==="checkbox"?el.checked:el.value;});
    localStorage.setItem("gamevortex-admin-editor-draft-v1",JSON.stringify(data));status("پیش‌نویس فرم روی همین مرورگر ذخیره شد.");
  }
  function restoreEditor(){
    try{
      const data=JSON.parse(localStorage.getItem("gamevortex-admin-editor-draft-v1")||"null");
      if(!data?.fields)throw Error("پیش‌نویسی ذخیره نشده است.");
      Object.entries(data.fields).forEach(([id,value])=>{const el=$(id);if(el){if(el.type==="checkbox")el.checked=Boolean(value);else el.value=String(value??"");}});
      status("پیش‌نویس ذخیره‌شده در فرم بازیابی شد.");
    }catch(error){status(error.message||"پیش‌نویس پیدا نشد.");}
  }
  async function run(action,api){
    const all=api.getGames(),selected=api.getSelectedIds(),chosen=all.filter(row=>selected.includes(row.id));
    const titleMap={"action":"اکشن","strategy":"استراتژی","puzzle":"فکری","sport":"ورزشی","creative":"خلاقانه"};
    if(action==="overview"){
      const lines=["کل بازی‌ها: "+all.length,"منتشرشده: "+all.filter(x=>x.is_published).length,"پیش‌نویس: "+all.filter(x=>!x.is_published).length,"ویژه: "+all.filter(x=>x.is_featured).length,"اطلاعات ناقص: "+all.filter(x=>!x.description||!x.official_url||!x.platforms).length];
      report("گزارش کلی",lines);return;
    }
    if(action==="categories"){report("آمار دسته‌بندی‌ها",Object.entries(titleMap).map(([key,label])=>label+": "+all.filter(row=>row.category===key).length));return;}
    if(action==="publishing"){report("آمار انتشار",["منتشرشده: "+all.filter(x=>x.is_published).length,"پیش‌نویس: "+all.filter(x=>!x.is_published).length,"ویژه: "+all.filter(x=>x.is_featured).length]);return;}
    if(action==="recent"){const rows=all.slice().sort((a,b)=>(Date.parse(b.updated_at)||0)-(Date.parse(a.updated_at)||0)).slice(0,10);report("۱۰ تغییر اخیر",rows.map(row=>(row.title||"بدون نام")+" — "+(row.updated_at||row.created_at||"زمان ثبت نشده")));return;}
    if(action==="quality"){
      report("گزارش کیفیت محتوا",["بدون توضیح: "+all.filter(x=>!String(x.description||"").trim()).length,"بدون لینک رسمی: "+all.filter(x=>!String(x.official_url||"").trim()).length,"لینک غیر HTTPS/نامعتبر: "+all.filter(x=>x.official_url&&!safeHttps(x.official_url)).length,"بدون جلد: "+all.filter(x=>!String(x.cover_url||"").trim()).length,"بدون پلتفرم: "+all.filter(x=>!String(x.platforms||"").trim()).length]);return;
    }
    if(action==="duplicate_titles"||action==="duplicate_links"){
      const groups=duplicates(all,row=>(action==="duplicate_titles"?String(row.title||"").trim().toLocaleLowerCase():String(row.official_url||"").trim().toLocaleLowerCase()));
      const rows=groups.flat();
      report(action==="duplicate_titles"?"نام‌های تکراری":"لینک‌های تکراری",groups.length?groups.map(g=>g.map(x=>x.title).join(" ↔ ")):["مورد تکراری پیدا نشد."]);
      if(rows.length)select(api,rows);return;
    }
    if(action==="bad_links"){const rows=all.filter(x=>x.official_url&&!safeHttps(x.official_url));report("لینک‌های نیازمند بررسی",rows.length?rows.map(x=>x.title+" — "+x.official_url):["لینک غیر HTTPS پیدا نشد."]);if(rows.length)select(api,rows);return;}
    if(action==="missing_descriptions"||action==="missing_covers"){
      const rows=all.filter(x=>action==="missing_descriptions"?!String(x.description||"").trim():!String(x.cover_url||"").trim());
      report(action==="missing_descriptions"?"بازی‌های بدون توضیح":"بازی‌های بدون تصویر جلد",rows.length?rows.map(x=>x.title):["موردی پیدا نشد."]);select(api,rows);return;
    }
    if(action==="filter_published"||action==="filter_drafts"||action==="filter_featured"||action==="filter_action"||action==="filter_puzzle"){
      $("statusFilter").value=action==="filter_published"?"published":action==="filter_drafts"?"draft":action==="filter_featured"?"featured":"all";
      $("categoryFilter").value=action==="filter_action"?"action":action==="filter_puzzle"?"puzzle":"all";
      $("gamesSearch").value="";$("gamesSearch").dispatchEvent(new Event("input",{bubbles:true}));$("statusFilter").dispatchEvent(new Event("change",{bubbles:true}));$("categoryFilter").dispatchEvent(new Event("change",{bubbles:true}));
      status("فیلتر جدول به‌روزرسانی شد.");return;
    }
    if(action==="select_visible"){select(api,api.getVisibleGames());return;}
    if(action==="select_published"){select(api,all.filter(x=>x.is_published));return;}
    if(action==="select_drafts"){select(api,all.filter(x=>!x.is_published));return;}
    if(action==="select_incomplete"){select(api,all.filter(x=>!x.description||!x.official_url||!x.platforms));return;}
    if(action==="clear_selection"){api.setSelectedIds([]);status("انتخاب‌ها پاک شد.");return;}
    if(action==="publish"||action==="draft"||action==="feature"||action==="unfeature"){
      if(!chosen.length)return status("ابتدا بازی‌ها را انتخاب کن.");
      await api.bulkUpdate(action==="publish"?{is_published:true}:action==="draft"?{is_published:false}:action==="feature"?{is_featured:true}:{is_featured:false});
      status(chosen.length+" بازی به‌روزرسانی شد.");return;
    }
    if(action==="delete"){if(!chosen.length)return status("ابتدا بازی‌ها را انتخاب کن.");await api.bulkDelete();status("عملیات حذف گروهی پایان یافت.");return;}
    if(action==="set_category"||action==="set_platform"||action==="set_theme"){
      if(!chosen.length)return status("ابتدا بازی‌ها را انتخاب کن.");
      const promptText=action==="set_category"?"دسته را بنویس: action, strategy, puzzle, sport, creative":action==="set_platform"?"نام پلتفرم را وارد کن (مثلاً PC, Xbox)":"طرح را بنویس: cs, portal, civ, rocket, minecraft, human, track, stardew";
      const value=prompt(promptText,"");if(value===null)return;
      if(action==="set_category"&&!Object.hasOwn(titleMap,value))return status("دسته‌بندی معتبر نیست.");
      if(action==="set_theme"&&!["cs","portal","civ","rocket","minecraft","human","track","stardew"].includes(value))return status("طرح کارت معتبر نیست.");
      await api.bulkUpdate(action==="set_category"?{category:value}:action==="set_theme"?{art_theme:value}:{platforms:value});
      status("اطلاعات "+chosen.length+" بازی تغییر کرد.");return;
    }
    if(action==="trim_titles"){if(!chosen.length)return status("ابتدا بازی‌ها را انتخاب کن.");const patches=chosen.map(row=>({id:row.id,patch:{title:String(row.title||"").trim().replace(/\s+/g," ")}}));await api.updateGames(patches);status("نام "+chosen.length+" بازی اصلاح شد.");return;}
    if(action==="fill_platform"){const base=chosen.length?chosen:all,rows=base.filter(x=>!String(x.platforms||"").trim());if(!rows.length)return status("در مجموعه انتخاب‌شده پلتفرم خالی وجود ندارد.");await api.updateGames(rows.map(row=>({id:row.id,patch:{platforms:"PC"}})));status("برای "+rows.length+" بازی مقدار PC ثبت شد.");return;}
    if(action==="export_selected_csv"){return exportRows(chosen,"gamevortex-selected.csv");}
    if(action==="export_published_csv"){return exportRows(all.filter(x=>x.is_published),"gamevortex-published.csv");}
    if(action==="export_drafts_csv"){return exportRows(all.filter(x=>!x.is_published),"gamevortex-drafts.csv");}
    if(action==="export_selected_json"){download("gamevortex-selected.json",JSON.stringify({project:"GameVortex",exportedAt:new Date().toISOString(),games:chosen},null,2),"application/json");status(chosen.length+" بازی خروجی گرفته شد.");return;}
    if(action==="export_audit"){const data={generatedAt:new Date().toISOString(),totals:{all:all.length,published:all.filter(x=>x.is_published).length,drafts:all.filter(x=>!x.is_published).length},missingDescriptions:all.filter(x=>!x.description).map(x=>x.title),missingLinks:all.filter(x=>!x.official_url).map(x=>x.title),missingCovers:all.filter(x=>!x.cover_url).map(x=>x.title),invalidLinks:all.filter(x=>x.official_url&&!safeHttps(x.official_url)).map(x=>({title:x.title,url:x.official_url})),duplicateTitles:duplicates(all,x=>(x.title||"").trim().toLowerCase()).map(g=>g.map(x=>x.title))};download("gamevortex-content-audit.json",JSON.stringify(data,null,2),"application/json");status("گزارش سلامت دانلود شد.");return;}
    if(action==="normalize_order"){const rows=(chosen.length?chosen:all).slice().sort((a,b)=>(Number(a.display_order)||0)-(Number(b.display_order)||0));await api.updateGames(rows.map((row,index)=>({id:row.id,patch:{display_order:index+1}})));status("ترتیب نمایش "+rows.length+" بازی بازشماری شد.");return;}
    if(action==="alphabetical"){$("managerSort").value="name";$("managerSort").dispatchEvent(new Event("change",{bubbles:true}));status("جدول بر اساس نام مرتب شد.");return;}
    if(action==="reset_filters"){$("gamesSearch").value="";$("statusFilter").value="all";$("categoryFilter").value="all";$("managerSort").value="order";["gamesSearch","statusFilter","categoryFilter","managerSort"].forEach(id=>$(id).dispatchEvent(new Event(id==="gamesSearch"?"input":"change",{bubbles:true})));status("فیلترها پاک شدند.");return;}
    if(action==="refresh"){await api.refresh();status("اطلاعات از دیتابیس تازه شد.");return;}
    if(action==="import_catalog"){$("importCatalogButton").click();return;}
    if(action==="open_site"){window.open(new URL("./",location.href).href,"_blank","noopener,noreferrer");return;}
    if(action==="copy_site"){const url=new URL("./",location.href).href;if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);status("لینک سایت کپی شد.");}else status(url);return;}
    if(action==="session_info"){const user=api.getUser();report("اطلاعات نشست",["ایمیل مدیر: "+(user?.email||"نامشخص"),"وضعیت ورود: فعال","زمان بررسی: "+new Date().toLocaleString("fa-IR"),"مدیریت دسترسی از طریق جدول admin_users انجام می‌شود."]);return;}
    if(action==="save_editor"){saveEditor();return;}
    if(action==="restore_editor"){restoreEditor();return;}
    if(action==="notice_games"){announcement("به‌روزرسانی تازه GameVortex؛ بازی‌های جدید به کتابخانه اضافه شدند.");return;}
    if(action==="notice_guide"){announcement("راهنمای تازه GameVortex منتشر شد؛ به بخش راهنماها سر بزن.");return;}
    if(action==="notice_update"){announcement("GameVortex به‌روزرسانی شد؛ از امکانات تازه سایت دیدن کن.");return;}
    if(action==="clear_notice"){$("announcementText").value="";$("announcementEnabled").checked=false;$("announcementText").dispatchEvent(new Event("input",{bubbles:true}));$("announcementEnabled").dispatchEvent(new Event("change",{bubbles:true}));status("اعلان در فرم پاک شد؛ برای ذخیره تغییر، دکمه ذخیره را بزن.");return;}
    if(action==="notice_count"){const length=$("announcementText").value.length;status("تعداد نویسه‌های پیام: "+length+" از ۱۸۰");return;}
  }
  window.addEventListener("gamevortex:admin-ready",attach);
  if(window.GAMEVORTEX_ADMIN_API)attach();
  const watcher=new MutationObserver(()=>{if(!attached&&window.GAMEVORTEX_ADMIN_API&&!$("dashboard")?.hidden)attach();});
  const dashboard=$("dashboard");if(dashboard)watcher.observe(dashboard,{attributes:true,attributeFilter:["hidden"]});
})();