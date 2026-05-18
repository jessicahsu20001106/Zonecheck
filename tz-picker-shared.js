// Shared timezone catalog, Google-style labels, search, and combobox (content script + popup).
(function (global) {
  "use strict";

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escAttr(s) {
    return escHtml(s).replace(/'/g, "&#39;");
  }

/** Minutes east of UTC for `when` (DST-aware). */
function tzOffsetMinutesAt(ianaTz, when = new Date()) {
  try {
    const now = new Date(when);
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone: ianaTz }));
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    return Math.round((tzDate - utcDate) / 60000);
  } catch {
    return 0;
  }
}

/** Google-style offset token without outer parens, e.g. GMT+09:00 / GMT-07:00. */
function tzGmtOffsetLabel(tz, when = new Date()) {
  const mins = tzOffsetMinutesAt(tz, when);
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function tzShortAbbrAt(iana, when) {
  try {
    return (
      new Intl.DateTimeFormat("en-US", { timeZone: iana, timeZoneName: "short" })
        .formatToParts(new Date(when))
        .find((p) => p.type === "timeZoneName")?.value || ""
    ).replace(/\u00a0/g, " ");
  } catch {
    return "";
  }
}
const TZ_DISPLAY_NAMES = {
  "UTC": "Coordinated Universal Time",
  "Pacific/Midway": "Midway Island, Samoa",
  "Pacific/Niue": "Niue",
  "Pacific/Pago_Pago": "Pago Pago",
  "Pacific/Rarotonga": "Rarotonga",
  "Pacific/Honolulu": "Hawaii",
  "Pacific/Marquesas": "Marquesas Islands",
  "Pacific/Gambier": "Gambier Islands",
  "America/Adak": "Aleutian Islands",
  "Pacific/Tahiti": "Tahiti",
  "America/Anchorage": "Alaska",
  "America/Juneau": "Juneau",
  "America/Nome": "Nome",
  "America/Los_Angeles": "Pacific Time (US & Canada)",
  "America/Vancouver": "Pacific Time — Vancouver",
  "America/Tijuana": "Pacific Time — Tijuana",
  "America/Phoenix": "Mountain Time — Arizona",
  "America/Denver": "Mountain Time (US & Canada)",
  "America/Boise": "Mountain Time — Boise",
  "America/Chihuahua": "Chihuahua, La Paz, Mazatlan",
  "America/Chicago": "Central Time (US & Canada)",
  "America/Winnipeg": "Central Time — Winnipeg",
  "America/Mexico_City": "Guadalajara, Mexico City, Monterrey",
  "America/Regina": "Saskatchewan",
  "America/Bogota": "Bogota, Lima, Quito",
  "America/New_York": "Eastern Time (US & Canada)",
  "America/Toronto": "Eastern Time — Toronto",
  "America/Havana": "Havana",
  "America/Indiana/Indianapolis": "Indiana (East)",
  "America/Caracas": "Caracas",
  "America/Halifax": "Atlantic Time — Halifax",
  "America/Santiago": "Santiago",
  "America/St_Johns": "Newfoundland",
  "America/Sao_Paulo": "Brasilia",
  "America/Argentina/Buenos_Aires": "Buenos Aires",
  "America/Montevideo": "Montevideo",
  "America/Asuncion": "Asuncion",
  "America/La_Paz": "La Paz",
  "America/Guatemala": "Central America",
  "America/Panama": "Panama",
  "America/Costa_Rica": "Costa Rica",
  "America/El_Salvador": "El Salvador",
  "America/Managua": "Managua",
  "America/Jamaica": "Jamaica",
  "America/Barbados": "Barbados",
  "America/Puerto_Rico": "Puerto Rico",
  "America/Cayenne": "Cayenne, Fortaleza",
  "America/Nuuk": "Greenland",
  "Atlantic/Azores": "Azores",
  "Atlantic/Cape_Verde": "Cape Verde Islands",
  "Atlantic/Reykjavik": "Reykjavik",
  "Atlantic/South_Georgia": "Mid-Atlantic",
  "Europe/London": "Dublin, Edinburgh, Lisbon, London",
  "Europe/Paris": "Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna",
  "Europe/Brussels": "Brussels, Copenhagen, Madrid, Paris",
  "Europe/Berlin": "Belgrade, Bratislava, Budapest, Ljubljana, Prague",
  "Europe/Warsaw": "Sarajevo, Skopje, Warsaw, Zagreb",
  "Europe/Athens": "Athens, Bucharest",
  "Europe/Helsinki": "Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius",
  "Europe/Istanbul": "Istanbul",
  "Europe/Moscow": "Moscow, St. Petersburg",
  "Europe/Madrid": "Madrid",
  "Europe/Rome": "Rome",
  "Europe/Zurich": "Bern, Zurich",
  "Europe/Stockholm": "Stockholm",
  "Europe/Oslo": "Oslo",
  "Europe/Dublin": "Dublin",
  "Europe/Lisbon": "Lisbon",
  "Europe/Prague": "Prague",
  "Europe/Vienna": "Vienna",
  "Europe/Copenhagen": "Copenhagen",
  "Europe/Bucharest": "Bucharest",
  "Europe/Kyiv": "Kyiv",
  "Africa/Cairo": "Cairo",
  "Africa/Johannesburg": "Johannesburg",
  "Africa/Lagos": "West Central Africa",
  "Africa/Casablanca": "Casablanca",
  "Africa/Nairobi": "Nairobi",
  "Africa/Addis_Ababa": "Addis Ababa",
  "Asia/Dubai": "Abu Dhabi, Muscat",
  "Asia/Riyadh": "Kuwait, Riyadh",
  "Asia/Baghdad": "Baghdad",
  "Asia/Tehran": "Tehran",
  "Asia/Baku": "Baku",
  "Asia/Tbilisi": "Tbilisi",
  "Asia/Yerevan": "Yerevan",
  "Asia/Kabul": "Kabul",
  "Asia/Karachi": "Islamabad, Karachi",
  "Asia/Kolkata": "Chennai, Kolkata, Mumbai, New Delhi",
  "Asia/Kathmandu": "Kathmandu",
  "Asia/Dhaka": "Astana, Dhaka",
  "Asia/Yangon": "Yangon",
  "Asia/Bangkok": "Bangkok, Hanoi, Jakarta",
  "Asia/Jakarta": "Jakarta",
  "Asia/Singapore": "Kuala Lumpur, Singapore",
  "Asia/Manila": "Manila",
  "Asia/Shanghai": "Beijing, Chongqing, Hong Kong, Urumqi",
  "Asia/Hong_Kong": "Hong Kong",
  "Asia/Taipei": "Taipei",
  "Asia/Seoul": "Seoul",
  "Asia/Tokyo": "Osaka, Sapporo, Tokyo",
  "Australia/Perth": "Perth",
  "Australia/Darwin": "Darwin",
  "Australia/Adelaide": "Adelaide",
  "Australia/Brisbane": "Brisbane",
  "Australia/Sydney": "Canberra, Melbourne, Sydney",
  "Pacific/Port_Moresby": "Guam, Port Moresby",
  "Pacific/Fiji": "Fiji",
  "Pacific/Auckland": "Auckland, Wellington",
  "Pacific/Chatham": "Chatham Islands",
  "Pacific/Tongatapu": "Nuku'alofa",
  "America/Guayaquil": "Guayaquil",
  "America/Manaus": "Manaus",
  "America/Cuiaba": "Cuiaba",
  "America/Campo_Grande": "Campo Grande",
  "America/Belem": "Belem",
  "America/Fortaleza": "Fortaleza",
  "America/Recife": "Recife",
  "America/Maceio": "Maceio",
  "America/Bahia": "Salvador",
  "America/Danmarkshavn": "Danmarkshavn",
  "America/Scoresbysund": "Scoresbysund",
  "America/Thule": "Thule",
  "Europe/Amsterdam": "Amsterdam",
  "Europe/Minsk": "Minsk",
  "Europe/Sofia": "Sofia",
  "Europe/Zaporozhye": "Zaporozhye",
  "Asia/Colombo": "Sri Jayawardenepura",
  "Asia/Ulaanbaatar": "Ulaanbaatar",
  "Asia/Vladivostok": "Vladivostok",
  "Asia/Magadan": "Magadan",
  "Asia/Kamchatka": "Kamchatka",
  "Asia/Almaty": "Almaty, Novosibirsk",
  "Asia/Tashkent": "Tashkent",
  "Asia/Samarkand": "Samarkand",
  "Asia/Oral": "Oral",
  "Asia/Qyzylorda": "Qyzylorda",
  "Asia/Novosibirsk": "Novosibirsk",
  "Asia/Krasnoyarsk": "Krasnoyarsk",
  "Asia/Irkutsk": "Irkutsk",
  "Asia/Chita": "Chita",
  "Asia/Yakutsk": "Yakutsk",
  "Asia/Sakhalin": "Sakhalin",
  "Asia/Seoul": "Seoul",
  "Australia/Hobart": "Hobart",
  "Australia/Currie": "Currie",
  "Australia/Eucla": "Eucla",
  "Australia/Lord_Howe": "Lord Howe Island",
  "Indian/Maldives": "Maldives",
  "Indian/Mauritius": "Mauritius",
  "Indian/Reunion": "Reunion",
  "Africa/Accra": "Accra",
  "Africa/Algiers": "West Central Africa",
  "Africa/Tunis": "Tunis",
  "America/Whitehorse": "Whitehorse",
  "America/Yellowknife": "Yellowknife",
  "America/Inuvik": "Inuvik",
  "America/Iqaluit": "Iqaluit",
  "America/Rankin_Inlet": "Rankin Inlet",
  "America/Resolute": "Resolute",
  "America/Rainy_River": "Rainy River",
  "America/Thunder_Bay": "Thunder Bay",
  "America/Nipigon": "Nipigon",
  "America/Atikokan": "Atikokan",
  "America/Blanc-Sablon": "Blanc-Sablon",
  "America/Glace_Bay": "Glace Bay",
  "America/Moncton": "Moncton",
  "America/Goose_Bay": "Goose Bay",
  "America/Miquelon": "Miquelon",
  "America/Argentina/Cordoba": "Cordoba",
  "America/Argentina/Mendoza": "Mendoza",
  "America/Hermosillo": "Hermosillo",
  "America/Mazatlan": "Mazatlan",
  "America/Ojinaga": "Ojinaga",
  "America/Monterrey": "Monterrey",
  "America/Merida": "Merida",
  "America/Cancun": "Cancun",
  "America/Belize": "Belize",
  "America/Detroit": "Detroit",
  "America/Kentucky/Louisville": "Louisville",
  "America/Kentucky/Monticello": "Monticello",
  "America/North_Dakota/Center": "Center, ND",
  "America/Menominee": "Menominee",
  "America/North_Dakota/New_Salem": "New Salem, ND",
  "America/Indiana/Vincennes": "Vincennes, IN",
  "America/Indiana/Winamac": "Winamac, IN",
  "America/Indiana/Marengo": "Marengo, IN",
  "America/Indiana/Petersburg": "Petersburg, IN",
  "America/Indiana/Vevay": "Vevay, IN",
  "America/Indiana/Tell_City": "Tell City, IN",
  "America/Indiana/Knox": "Knox, IN",
  "Europe/Kaliningrad": "Kaliningrad",
  "Europe/Samara": "Samara",
  "Europe/Volgograd": "Volgograd",
  "Asia/Hebron": "Hebron",
  "Asia/Jerusalem": "Jerusalem",
  "Asia/Amman": "Amman",
  "Asia/Beirut": "Beirut",
  "Asia/Damascus": "Damascus",
  "Asia/Nicosia": "Nicosia",
  "Asia/Gaza": "Gaza",
  "Asia/Famagusta": "Famagusta",
  "Asia/Qatar": "Qatar",
  "Asia/Bahrain": "Bahrain",
  "Asia/Kuwait": "Kuwait",
  "Asia/Aden": "Aden",
  "Asia/Muscat": "Muscat",
  "Asia/Pyongyang": "Pyongyang",
  "Asia/Macau": "Macau",
  "Asia/Brunei": "Brunei",
  "Asia/Pontianak": "Pontianak",
  "Asia/Makassar": "Makassar",
  "Asia/Jayapura": "Jayapura",
  "Asia/Dili": "Dili",
  "Asia/Chongqing": "Chongqing",
  "Asia/Harbin": "Harbin",
  "Asia/Urumqi": "Urumqi",
  "Asia/Aqtobe": "Aqtobe",
  "Asia/Aqtau": "Aqtau",
  "America/St_Vincent": "St. Vincent",
  "America/Port_of_Spain": "Port of Spain",
  "America/Aruba": "Aruba",
  "America/Curacao": "Curacao",
  "America/Kralendijk": "Kralendijk",
  "America/Lower_Princes": "Lower Prince's Quarter",
  "America/Marigot": "Marigot",
  "America/St_Barthelemy": "St. Barthelemy",
  "America/St_Kitts": "St. Kitts",
  "America/St_Lucia": "St. Lucia",
  "America/St_Thomas": "St. Thomas",
  "America/Tortola": "Tortola",
  "America/Dominica": "Dominica",
  "America/Grenada": "Grenada",
  "America/Antigua": "Antigua",
  "America/Anguilla": "Anguilla",
  "America/Dawson": "Dawson",
  "America/Dawson_Creek": "Dawson Creek",
  "America/Creston": "Creston",
  "America/Fort_Nelson": "Fort Nelson",
  "America/Sitka": "Sitka",
  "America/Metlakatla": "Metlakatla",
  "America/Swift_Current": "Swift Current",
  "America/Eirunepe": "Eirunepe",
  "America/Rio_Branco": "Rio Branco",
  "America/Porto_Velho": "Porto Velho",
  "America/Boa_Vista": "Boa Vista",
};

/** Extra lowercase tokens for picker search (cities / nicknames not in display names). */
const TZ_SEARCH_SYNONYMS = {
  "America/Los_Angeles":
    "seattle tacoma bellingham everett spokane olympia portland salem eugene bend medford boise victoria vancouver washington state oregon california bay area san francisco oakland berkeley san jose silicon valley palo alto mountain view sacramento fresno monterey santa barbara santa monica los angeles la san diego orange county irvine long beach las vegas reno carson city",
  "America/Vancouver": "british columbia richmond burnaby surrey victoria bc",
  "America/Tijuana": "ensenada mexicali baja california",
  "America/Denver":
    "denver boulder colorado springs fort collins pueblo cheyenne casper laramie billings missoula bozeman helena great falls albuquerque santa fe taos farmington provo ogden salt lake city utah idaho montana wyoming new mexico",
  "America/Phoenix": "phoenix tucson scottsdale mesa tempe flagstaff sedona yuma lake havasu arizona no dst",
  "America/Chicago":
    "chicago milwaukee madison green bay minneapolis st paul duluth kansas city st louis springfield memphis nashville knoxville chattanooga little rock tulsa oklahoma city dallas fort worth houston austin san antonio wichita des moines cedar rapids iowa illinois wisconsin minnesota missouri kansas nebraska oklahoma texas louisiana arkansas mississippi alabama central time",
  "America/New_York":
    "new york nyc manhattan brooklyn queens bronx staten island boston cambridge philadelphia pittsburgh washington dc dulles baltimore richmond norfolk charlotte raleigh atlanta miami tampa orlando jacksonville savannah charleston columbus cleveland detroit indianapolis cincinnati louisville lexington buffalo rochester syracuse hartford new haven providence eastern time",
  "America/Detroit": "detroit ann arbor lansing grand rapids flint",
  "America/Toronto": "toronto ottawa mississauga hamilton london ontario niagara kingston",
  "America/Montreal": "montreal quebec laval gatineau sherbrooke",
  "America/Halifax": "halifax moncton charlottetown prince edward island new brunswick nova scotia atlantic canada",
  "America/St_Johns": "st johns newfoundland labrador",
  "America/Caracas": "caracas maracaibo valencia barquisimeto venezuela",
  "America/Bogota": "bogota medellin cali cartagena colombia",
  "America/Lima": "lima cusco arequipa trujillo peru",
  "America/Santiago": "santiago valparaiso concepcion chile",
  "America/Sao_Paulo": "sao paulo rio de janeiro brasilia belo horizonte curitiba porto alegre salvador recife fortaleza brazil brt",
  "America/Argentina/Buenos_Aires": "buenos aires cordoba rosario mendoza argentina",
  "America/Mexico_City": "mexico city guadalajara monterrey puebla cancun merida mexico cst",
  "Europe/London": "london manchester birmingham liverpool leeds edinburgh glasgow cardiff belfast dublin cork galway uk ireland gmt bst",
  "Europe/Paris": "paris lyon marseille toulouse nice strasbourg brussels belgium amsterdam netherlands luxembourg monaco france western europe",
  "Europe/Berlin": "berlin hamburg munich frankfurt cologne stuttgart dresden leipzig germany",
  "Europe/Rome": "rome milan naples turin florence venice palermo italy vatican",
  "Europe/Madrid": "madrid barcelona valencia seville bilbao spain canary",
  "Europe/Zurich": "zurich geneva basel bern lausanne switzerland liechtenstein",
  "Europe/Vienna": "vienna salzburg graz austria",
  "Europe/Warsaw": "warsaw krakow gdansk wroclaw poland",
  "Europe/Prague": "prague brno czech",
  "Europe/Budapest": "budapest hungary",
  "Europe/Athens": "athens thessaloniki greece cyprus",
  "Europe/Helsinki": "helsinki tampere finland tallinn estonia riga latvia vilnius lithuania eastern europe eet",
  "Europe/Bucharest": "bucharest cluj romania sofia bulgaria",
  "Europe/Istanbul": "istanbul ankara izmir turkey",
  "Europe/Moscow": "moscow st petersburg novosibirsk yekaterinburg russia msk",
  "Africa/Johannesburg": "johannesburg cape town durban pretoria south africa cat",
  "Africa/Cairo": "cairo alexandria giza egypt",
  "Africa/Nairobi": "nairobi mombasa kenya kampala uganda dar tanzania",
  "Africa/Lagos": "lagos abuja nigeria accra ghana",
  "Asia/Dubai": "dubai abu dhabi sharjah uae gulf",
  "Asia/Riyadh": "riyadh jeddah mecca dammam saudi arabia",
  "Asia/Jerusalem": "jerusalem tel aviv haifa israel",
  "Asia/Baghdad": "baghdad basra iraq",
  "Asia/Tehran": "tehran mashhad iran irst",
  "Asia/Karachi": "karachi lahore islamabad pakistan",
  "Asia/Kolkata": "mumbai delhi bangalore chennai hyderabad kolkata pune india ist",
  "Asia/Dhaka": "dhaka chittagong bangladesh",
  "Asia/Bangkok": "bangkok phuket chiang mai pattaya vietnam hanoi ho chi minh laos cambodia indochina",
  "Asia/Singapore": "singapore kuala lumpur penang malaysia",
  "Asia/Jakarta": "jakarta surabaya bandung bali indonesia wib",
  "Asia/Manila": "manila cebu davao philippines",
  "Asia/Hong_Kong": "hong kong macau hkt",
  "Asia/Shanghai": "shanghai beijing guangzhou shenzhen chengdu hangzhou wuhan china cst",
  "Asia/Taipei": "taipei kaohsiung taichung taiwan",
  "Asia/Tokyo": "tokyo osaka kyoto yokohama nagoya sapporo fukuoka hiroshima sendai okinawa japan jst",
  "Asia/Seoul": "seoul busan incheon daegu south korea kst",
  "Australia/Sydney": "sydney melbourne canberra hobart tasmania australia eastern aest aedt",
  "Australia/Brisbane": "brisbane gold coast cairns queensland aest no dst",
  "Australia/Adelaide": "adelaide south australia acst",
  "Australia/Perth": "perth western australia awst",
  "Pacific/Auckland": "auckland wellington christchurch new zealand nzst nzdt",
  "Pacific/Fiji": "fiji suva",
  "Pacific/Guam": "guam northern mariana",
  "America/Anchorage": "anchorage fairbanks juneau alaska akst akdt",
  "Pacific/Honolulu": "honolulu hawaii maui oahu kauai hst",
};

let timezoneCatalog = Object.keys(TZ_DISPLAY_NAMES);

let _timezonesSortedCache = null;
function getTimezonesSorted() {
  if (_timezonesSortedCache) return _timezonesSortedCache;
  const now = Date.now();
  _timezonesSortedCache = [...timezoneCatalog].sort((a, b) => {
    const ma = tzOffsetMinutesAt(a, now);
    const mb = tzOffsetMinutesAt(b, now);
    if (ma !== mb) return ma - mb;
    return tzOutlookListLabel(a).localeCompare(tzOutlookListLabel(b));
  });
  return _timezonesSortedCache;
}

const TZ_SEARCH_CACHE = new Map();
function normalizeTzQuery(q) {
  return String(q || "")
    .trim()
    .toLowerCase()
    .replace(/\u2212/g, "-")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tzSearchBlobFor(iana) {
  if (TZ_SEARCH_CACHE.has(iana)) return TZ_SEARCH_CACHE.get(iana);
  let blob;
  try {
    const label = tzOutlookListLabel(iana).toLowerCase();
    const slug = iana.toLowerCase().replace(/\//g, " ").replace(/_/g, " ");
    const mins = tzOffsetMinutesAt(iana, new Date());
    const sign = mins >= 0 ? "+" : "-";
    const ah = Math.floor(Math.abs(mins) / 60);
    const am = Math.abs(mins) % 60;
    const pieces = [
      iana.toLowerCase(),
      label,
      slug,
      `gmt${sign}${ah}`,
      `gmt${sign}${String(ah).padStart(2, "0")}`,
      `gmt${sign}${String(ah).padStart(2, "0")}:${String(am).padStart(2, "0")}`,
      `utc${sign}${ah}`,
      `utc${sign}${String(ah).padStart(2, "0")}`,
    ];
    const jan = tzShortAbbrAt(iana, Date.UTC(2026, 0, 15)).toLowerCase();
    const jul = tzShortAbbrAt(iana, Date.UTC(2026, 6, 15)).toLowerCase();
    if (jan) pieces.push(jan);
    if (jul && jul !== jan) pieces.push(jul);
    const syn = TZ_SEARCH_SYNONYMS[iana];
    if (syn) pieces.push(String(syn).toLowerCase());
    blob = pieces.join(" ");
  } catch {
    blob = iana.toLowerCase();
  }
  TZ_SEARCH_CACHE.set(iana, blob);
  return blob;
}

function tzMatchesQuery(iana, q) {
  const nq = normalizeTzQuery(q);
  if (!nq) return true;
  const blob = tzSearchBlobFor(iana);
  const tokens = nq.split(" ").filter(Boolean);
  for (const t of tokens) {
    if (!blob.includes(t)) return false;
  }
  return true;
}

function ensureTzInCatalog(iana) {
  if (!iana || timezoneCatalog.includes(iana)) return;
  try {
    void tzOutlookListLabel(iana);
  } catch {
    return;
  }
  timezoneCatalog.push(iana);
  _timezonesSortedCache = null;
  TZ_SEARCH_CACHE.delete(iana);
}

function tzRegionLabel(tz) {
  if (TZ_DISPLAY_NAMES[tz]) return TZ_DISPLAY_NAMES[tz];
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "longGeneric",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || tz;
  } catch {
    return tz;
  }
}

function tzOutlookListLabel(tz) {
  const offset = tzGmtOffsetLabel(tz);
  const name = tzRegionLabel(tz);
  return offset ? `(${offset}) ${name}` : name;
}

function tzOutlookSelectedLabel(tz) {
  const offset = tzGmtOffsetLabel(tz);
  const name = tzRegionLabel(tz);
  return offset ? `${name} (${offset})` : name;
}



let openTzPickerWrap = null;

function initTzPickerGlobalListeners() {
  if (initTzPickerGlobalListeners.done) return;
  initTzPickerGlobalListeners.done = true;
  document.addEventListener(
    "mousedown",
    (e) => {
      if (!openTzPickerWrap || openTzPickerWrap.contains(e.target)) return;
      closeTzPicker();
    },
    true
  );
  document.addEventListener("keydown", (e) => {
    if (!openTzPickerWrap || e.key !== "Escape") return;
    const search = openTzPickerWrap.querySelector(".zc-tz-picker-search");
    if (document.activeElement === search && search?.value) {
      e.preventDefault();
      search.value = "";
      refreshTzPickerList(openTzPickerWrap, "");
      return;
    }
    e.preventDefault();
    closeTzPicker();
  });
}

function closeTzPicker() {
  if (!openTzPickerWrap) return;
  const wrap = openTzPickerWrap;
  openTzPickerWrap = null;
  const panel = wrap.querySelector(".zc-tz-picker-panel");
  const trig = wrap.querySelector(".zc-tz-picker-trigger");
  const search = wrap.querySelector(".zc-tz-picker-search");
  if (panel) panel.hidden = true;
  if (trig) trig.setAttribute("aria-expanded", "false");
  if (search) search.value = "";
}

function openTzPicker(wrap) {
  if (wrap.dataset.tzDisabled === "1") return;
  if (openTzPickerWrap && openTzPickerWrap !== wrap) closeTzPicker();
  openTzPickerWrap = wrap;
  const panel = wrap.querySelector(".zc-tz-picker-panel");
  const trig = wrap.querySelector(".zc-tz-picker-trigger");
  const search = wrap.querySelector(".zc-tz-picker-search");
  if (panel) panel.hidden = false;
  if (trig) trig.setAttribute("aria-expanded", "true");
  if (search) {
    search.value = "";
    refreshTzPickerList(wrap, "");
    queueMicrotask(() => search.focus());
  } else {
    refreshTzPickerList(wrap, "");
  }
}

function toggleTzPicker(wrap) {
  if (openTzPickerWrap === wrap) closeTzPicker();
  else openTzPicker(wrap);
}

function refreshTzPickerList(wrap, query) {
  const ul = wrap.querySelector(".zc-tz-picker-list");
  const empty = wrap.querySelector(".zc-tz-picker-empty");
  if (!ul) return;
  const q = typeof query === "string" ? query : (wrap.querySelector(".zc-tz-picker-search")?.value ?? "");
  const sorted = getTimezonesSorted();
  const filtered = q.trim() ? sorted.filter((z) => tzMatchesQuery(z, q)) : sorted;
  const current = wrap.dataset.tz || "";
  ul.innerHTML = filtered
    .map((tz) => {
      const selected = tz === current;
      const cls = selected ? "zc-tz-picker-item zc-tz-picker-item-selected" : "zc-tz-picker-item";
      return `<li role="option" tabindex="-1" data-tz="${escAttr(tz)}" aria-selected="${selected ? "true" : "false"}" class="${cls}">${escHtml(
        tzOutlookListLabel(tz)
      )}</li>`;
    })
    .join("");
  if (empty) empty.hidden = filtered.length > 0;
}

function buildTimezoneSelectHtml(which, selectedTz) {
  ensureTzInCatalog(selectedTz);
  const labelWhich = which === "their" ? "Their timezone" : "Your timezone";
  const cur = escHtml(tzOutlookListLabel(selectedTz));
  return `<div class="zc-tz-picker" data-which="${escAttr(which)}" data-tz="${escAttr(selectedTz)}" aria-label="${escAttr(labelWhich)}"><button type="button" class="zc-tz-picker-trigger" aria-expanded="false" aria-haspopup="listbox" aria-label="${escAttr(
    labelWhich
  )}"><span class="zc-tz-picker-label">${cur}</span></button><div class="zc-tz-picker-panel" hidden><input type="search" class="zc-tz-picker-search" placeholder="Search time zones" autocomplete="off" spellcheck="false" aria-label="Search by city, abbreviation, region, or GMT offset" /><ul class="zc-tz-picker-list" role="listbox" aria-label="Time zones"></ul><div class="zc-tz-picker-empty" hidden>No matching time zones</div></div></div>`;
}

function syncTimezoneSelects(el, s) {
  el.querySelectorAll(".zc-tz-picker").forEach((wrap) => {
    const which = wrap.dataset.which;
    const tz = which === "their" ? s.theirTz : s.yourTz;
    ensureTzInCatalog(tz);
    const prev = wrap.dataset.tz;
    wrap.dataset.tz = tz;
    const lab = wrap.querySelector(".zc-tz-picker-label");
    if (lab) lab.textContent = tzOutlookListLabel(tz);
    if (openTzPickerWrap === wrap && prev !== tz) {
      refreshTzPickerList(wrap, wrap.querySelector(".zc-tz-picker-search")?.value ?? "");
    }
  });
}

function bindTimezoneSelects(el, onPick) {
  initTzPickerGlobalListeners();
  if (el.dataset.zcTzPickerBound === "1") return;
  el.dataset.zcTzPickerBound = "1";
  el.addEventListener("click", (e) => {
    const trig = e.target.closest(".zc-tz-picker-trigger");
    if (trig && el.contains(trig)) {
      const wrap = trig.closest(".zc-tz-picker");
      if (!wrap || wrap.dataset.tzDisabled === "1") return;
      e.preventDefault();
      toggleTzPicker(wrap);
      return;
    }
    const item = e.target.closest(".zc-tz-picker-item");
    if (!item || !el.contains(item)) return;
    const wrap = item.closest(".zc-tz-picker");
    if (!wrap) return;
    const newTz = item.dataset.tz;
    const which = wrap.dataset.which;
    if (!newTz || !which) return;
    if (typeof onPick === "function") onPick(wrap, which, newTz, el);
    wrap.dataset.tz = newTz;
    const lab = wrap.querySelector(".zc-tz-picker-label");
    if (lab) lab.textContent = tzOutlookListLabel(newTz);
    closeTzPicker();
  });
  el.addEventListener("input", (e) => {
    if (!e.target.classList.contains("zc-tz-picker-search")) return;
    const wrap = e.target.closest(".zc-tz-picker");
    if (!wrap || openTzPickerWrap !== wrap) return;
    refreshTzPickerList(wrap, e.target.value);
  });
}

  global.ZC_TIMEZONE = {
    TZ_DISPLAY_NAMES,
    tzOffsetMinutesAt,
    tzGmtOffsetLabel,
    tzShortAbbrAt,
    tzRegionLabel,
    tzOutlookListLabel,
    tzOutlookSelectedLabel,
    ensureTzInCatalog,
    getTimezonesSorted,
    normalizeTzQuery,
    tzMatchesQuery,
    buildTimezoneSelectHtml,
    syncTimezoneSelects,
    bindTimezoneSelects,
    closeTzPicker,
    openTzPicker,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
