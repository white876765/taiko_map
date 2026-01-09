// ===== 定数 =====
const PREF_ORDER = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県",
  "沖縄県"
];

let originalShops = [];

// ===== Map 初期化 =====
const map = L.map("map", { zoomControl: false }).setView([36.5, 138], 5);

L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const cluster = L.markerClusterGroup({
  disableClusteringAtZoom: 16
});
map.addLayer(cluster);

// ===== フィルタ系 =====
function getSelectedFilters() {
  return [...document.querySelectorAll(".machineFilter:checked")].map(c => c.value);
}

function matchMachineFilter(m, filters) {
  if (filters.length === 0) return true;
  for (const f of filters) {
    if (f === "1" && m === 1) return true;
    if (f === "2" && m === 2) return true;
    if (f === "3" && m === 3) return true;
    if (f === "4" && m === 4) return true;
    if (f === "5" && m === 5) return true;
    if (f === "6-7" && m >= 6 && m <= 7) return true;
    if (f === "8-9" && m >= 8 && m <= 9) return true;
    if (f === "10+" && m >= 10) return true;
  }
  return false;
}

// ===== 描画 =====
function renderMap() {
  cluster.clearLayers();

  const keyword = document.getElementById("searchBox").value.toLowerCase();
  const pref = document.getElementById("prefFilter").value;
  const filters = getSelectedFilters();

  let count = 0;
  let total = 0;
  const bounds = [];

  originalShops.forEach(shop => {
    if (!shop.lat || !shop.lng) return;
    if (pref !== "ALL" && shop.pref !== pref) return;
    if (!matchMachineFilter(shop.machines, filters)) return;
    if (keyword && !shop.name.toLowerCase().includes(keyword)) return;

    const marker = L.marker([shop.lat, shop.lng])
      .bindPopup(`<strong>${shop.name}</strong><br>${shop.address}<br>${shop.machines}台`);

    cluster.addLayer(marker);
    bounds.push([shop.lat, shop.lng]);

    count++;
    total += shop.machines ?? 0;
  });

  document.getElementById("stats").textContent =
    `表示店舗数: ${count} / 台数合計: ${total}`;

  if (pref !== "ALL" && bounds.length) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  } else {
    map.setView([36.5, 138], 5);
  }
}

// ===== イベント =====
document.querySelectorAll(".machineFilter").forEach(cb =>
  cb.addEventListener("change", renderMap)
);
document.getElementById("searchBox").addEventListener("input", renderMap);
document.getElementById("prefFilter").addEventListener("change", renderMap);

document.getElementById("selectAll").onclick = () => {
  document.querySelectorAll(".machineFilter").forEach(c => c.checked = true);
  renderMap();
};
document.getElementById("clearAll").onclick = () => {
  document.querySelectorAll(".machineFilter").forEach(c => c.checked = false);
  renderMap();
};

document.getElementById("toggleControls").onclick = () => {
  const c = document.getElementById("controls");
  c.style.display = c.style.display === "none" ? "block" : "none";
};

// ===== JSON 読み込み =====
fetch("shops.json")
  .then(r => r.json())
  .then(data => {
    originalShops = data.shops;
    originalShops.forEach(s => {
      if (!s.pref && s.address) s.pref = s.address.split(" ")[0];
    });

    const prefs = new Set(originalShops.map(s => s.pref));
    const select = document.getElementById("prefFilter");

    PREF_ORDER.forEach(p => {
      if (prefs.has(p)) {
        const o = document.createElement("option");
        o.value = p;
        o.textContent = p;
        select.appendChild(o);
      }
    });

    renderMap();
  });

