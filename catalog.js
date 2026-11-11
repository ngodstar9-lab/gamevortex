/* Curated GameVortex discovery catalogue: 40 additional games.
   Descriptions are editorial summaries; official_url points to publisher/game pages. */
(() => {
  "use strict";
  const games = [
    ["Half-Life 2","action","ماجراجویی علمی‌تخیلی اول‌شخص با روایت قوی، فیزیک محیطی و معماهای خلاقانه. (هف لایف ۲)","https://store.steampowered.com/app/220/HalfLife_2/","cs","PC"],
    ["Portal","puzzle","معماهای محیطی با ابزار پورتال؛ انتخابی عالی برای طرفداران فکر و خلاقیت. (پورتال یک)","https://store.steampowered.com/app/400/Portal/","portal","PC"],
    ["Left 4 Dead 2","action","تجربه همکاری چهارنفره در مرحله‌های پرتنش؛ تمرکز بازی روی هماهنگی گروهی است. (لفت فور دد ۲)","https://store.steampowered.com/app/550/Left_4_Dead_2/","cs","PC"],
    ["Team Fortress 2","action","تیراندازی تیمی با کلاس‌های متفاوت و مسابقه‌های سریع و رنگارنگ. (تیم فورترس ۲)","https://www.teamfortress.com/","rocket","PC"],
    ["Dota 2","strategy","بازی رقابتی تیمی با قهرمان‌های متنوع و تصمیم‌گیری تاکتیکی عمیق. (دوتا ۲)","https://www.dota2.com/","civ","PC"],
    ["VALORANT","action","تیراندازی تاکتیکی پنج‌به‌پنج با عامل‌هایی دارای توانایی‌های ویژه. (ولورانت)","https://playvalorant.com/","cs","PC"],
    ["Fortnite","action","بازی آنلاین چندحالته با ساخت‌وساز، رویدادها و حالت‌های خلاقانه. (فورتنایت)","https://www.fortnite.com/","minecraft","PC, PlayStation, Xbox, Nintendo Switch, Mobile"],
    ["Apex Legends","action","بتل‌رویال تیمی با شخصیت‌های متفاوت و حرکت سریع در میدان رقابت. (ایپکس لجندز)","https://www.ea.com/games/apex-legends","rocket","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Overwatch 2","action","تیراندازی تیمی با قهرمان‌ها و نقش‌های متنوع؛ همکاری تیمی اهمیت زیادی دارد. (اورواچ ۲)","https://overwatch.blizzard.com/","rocket","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Rainbow Six Siege","action","رقابت تاکتیکی مبتنی بر همکاری، برنامه‌ریزی و انتخاب اپراتورهای مختلف. (رینبو سیکس سیج)","https://www.ubisoft.com/game/rainbow-six/siege","cs","PC, PlayStation, Xbox"],
    ["PUBG: Battlegrounds","action","بتل‌رویال واقع‌گرایانه با نقشه‌های بزرگ و مسابقه‌های بقا. (پابجی)","https://pubg.com/","cs","PC, PlayStation, Xbox, Mobile"],
    ["Warframe","action","اکشن علمی‌تخیلی سریع با مأموریت‌های مشارکتی، تجهیزات متنوع و پیشرفت طولانی‌مدت. (وارفریم)","https://www.warframe.com/","rocket","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Destiny 2","action","جهان علمی‌تخیلی آنلاین با مأموریت‌های گروهی، داستان و فعالیت‌های متنوع. (دستینی ۲)","https://www.destinythegame.com/","cs","PC, PlayStation, Xbox"],
    ["Deep Rock Galactic","action","همکاری چهار بازیکن در غارهای تصادفی؛ معدن‌کاری، اکتشاف و هماهنگی تیمی. (دیپ راک گلکتیک)","https://www.deeprockgalactic.com/","minecraft","PC, PlayStation, Xbox"],
    ["Hades","action","روگ‌لایک داستان‌محور با مبارزه‌های سریع، شخصیت‌های به‌یادماندنی و پیشرفت مرحله‌ای. (هیدیز)","https://www.supergiantgames.com/games/hades/","stardew","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Hollow Knight","puzzle","ماجراجویی دوبعدی در دنیایی زیرزمینی با اکتشاف، مسیرهای پنهان و چالش‌های دقیق. (هالو نایت)","https://www.hollowknight.com/","portal","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Ori and the Will of the Wisps","puzzle","ماجراجویی سکوبازی چشم‌نواز با موسیقی، اکتشاف و معماهای محیطی. (اوری)","https://www.orithegame.com/","stardew","PC, Xbox, Nintendo Switch"],
    ["Celeste","puzzle","سکوبازی دقیق و چالش‌برانگیز با داستانی درباره پشتکار و شناخت خود. (سلست)","https://www.celestegame.com/","portal","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Cuphead","action","بازی اکشن دوبعدی با طراحی الهام‌گرفته از انیمیشن‌های کلاسیک و مبارزه‌های دشوار. (کاپ هد)","https://www.cupheadgame.com/","human","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Terraria","creative","جهان دوبعدی برای اکتشاف، ساخت‌وساز، جمع‌آوری منابع و ماجراجویی. (تراریا)","https://terraria.org/","minecraft","PC, PlayStation, Xbox, Nintendo Switch, Mobile"],
    ["Don't Starve Together","creative","بازی بقا و همکاری با دنیایی عجیب، ساخت ابزار و مدیریت منابع. (دونت استارو توگدر)","https://www.klei.com/games/dont-starve-together","stardew","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Slay the Spire","strategy","ترکیب ساخت دسته کارت و برنامه‌ریزی نوبتی؛ هر بار مسیر و انتخاب تازه‌ای دارد. (اسلی د اسپایر)","https://www.megacrit.com/","civ","PC, PlayStation, Xbox, Nintendo Switch, Mobile"],
    ["Balatro","strategy","بازی کارتی تک‌نفره با ترکیب‌های خلاقانه و امتیازگیری تاکتیکی. (بلاترو)","https://www.playbalatro.com/","civ","PC, PlayStation, Xbox, Nintendo Switch, Mobile"],
    ["The Witness","puzzle","جزیره‌ای پر از معماهای خطی که با مشاهده دقیق و کشف الگوها حل می‌شوند. (د ویتنس)","https://the-witness.net/","portal","PC, PlayStation, Xbox, Mobile"],
    ["The Talos Principle 2","puzzle","معماهای فلسفی و محیطی سه‌بعدی درباره منطق، فناوری و انتخاب‌ها. (تالوس پرینسیپل ۲)","https://www.devolverdigital.com/games/the-talos-principle-2","portal","PC, PlayStation, Xbox"],
    ["Baba Is You","puzzle","معماهایی که در آن‌ها خود قوانین بازی را جابه‌جا می‌کنی و تغییر می‌دهی. (بابا ایز یو)","https://www.hempuli.com/baba/","portal","PC, Nintendo Switch, Mobile"],
    ["The Room","puzzle","معماهای جعبه‌ای و مکانیکی با جزئیات دقیق و فضای رازآلود. (د روم)","https://www.fireproofgames.com/","human","PC, Mobile"],
    ["Factorio","strategy","طراحی خط تولید، خودکارسازی کارخانه و حل مسئله در مقیاسی رو به رشد. (فکتوریو)","https://www.factorio.com/","civ","PC, Nintendo Switch"],
    ["Satisfactory","strategy","ساخت کارخانه‌های سه‌بعدی، مدیریت منابع و بهینه‌سازی زنجیره تولید. (سَتیسفکتوری)","https://www.satisfactorygame.com/","minecraft","PC"],
    ["RimWorld","strategy","مدیریت یک کلونی فضایی؛ تصمیم‌های مدیریتی و رویدادهای داستان‌ساز. (ریم‌ورلد)","https://rimworldgame.com/","civ","PC"],
    ["Age of Empires II: Definitive Edition","strategy","استراتژی کلاسیک تاریخی با تمدن‌های مختلف و مسابقه‌های چندنفره. (ایج آو امپایرز ۲)","https://www.ageofempires.com/games/aoeiide/","civ","PC, Xbox"],
    ["StarCraft II","strategy","استراتژی علمی‌تخیلی هم‌زمان با سه جناح متفاوت و رقابت‌های مهارتی. (استارکرفت ۲)","https://starcraft2.blizzard.com/","civ","PC"],
    ["XCOM 2","strategy","استراتژی نوبتی با مدیریت گروه، انتخاب تجهیزات و تصمیم‌های تاکتیکی. (ایکس کام ۲)","https://xcom.com/xcom-2/","civ","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Total War: WARHAMMER III","strategy","ترکیب مدیریت امپراتوری و نبردهای بزرگ در دنیایی فانتزی. (توتال وار وارهمر ۳)","https://www.totalwar.com/games/warhammer-3/","civ","PC"],
    ["Crusader Kings III","strategy","شبیه‌ساز تاریخی دودمان‌ها؛ سیاست، دیپلماسی و مدیریت قلمرو. (کروسیدر کینگز ۳)","https://www.crusaderkings.com/","civ","PC, PlayStation, Xbox"],
    ["Cities: Skylines","creative","شهر دلخواهت را بساز و حمل‌ونقل، خدمات و رشد آن را مدیریت کن. (سیتیز اسکای‌لاینز)","https://www.paradoxinteractive.com/games/cities-skylines/about","minecraft","PC, PlayStation, Xbox, Nintendo Switch"],
    ["Euro Truck Simulator 2","sport","رانندگی و مدیریت مسیرهای حمل‌ونقل در جاده‌های اروپا. (یورو تراک سیمولیتر ۲)","https://eurotrucksimulator2.com/","track","PC"],
    ["Forza Horizon 5","sport","رانندگی آزاد در نقشه‌ای بزرگ با خودروهای متعدد و رویدادهای مسابقه‌ای. (فورزا هورایزن ۵)","https://forza.net/horizon","track","PC, Xbox"],
    ["The Sims 4","creative","شبیه‌ساز زندگی برای ساخت شخصیت، خانه و داستان‌های شخصی. (سیمز ۴)","https://www.ea.com/games/the-sims/the-sims-4","stardew","PC, PlayStation, Xbox"],
    ["Among Us","creative","بازی گروهی استنتاج اجتماعی؛ بازیکنان باید با گفت‌وگو نقش‌ها را تشخیص دهند. (امانگ آس)","https://www.innersloth.com/games/among-us/","human","PC, PlayStation, Xbox, Nintendo Switch, Mobile"]
  ];
  window.GAMEVORTEX_CATALOG = games.map((row,index) => ({
    title:row[0], category:row[1], description:row[2], official_url:row[3],
    art_theme:row[4], platforms:row[5], display_order:index+9,
    is_published:true, is_featured:false, aliases:row[0].toLocaleLowerCase()
  }));
})();