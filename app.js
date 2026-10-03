const STORAGE_KEY = "streak-spark-v1";
const clock = document.querySelector("#clock");
const button = document.querySelector("#streakButton");
const count = document.querySelector("#streakCount");
const status = document.querySelector("#status");
const streak = document.querySelector(".streak");
const tiers = [
  { day: 0, name: "Ember", hue: 0, text: "Every fire starts somewhere." },
  { day: 7, name: "Azure", hue: 185, text: "Seven days. A cooler kind of fire." },
  { day: 30, name: "Amethyst", hue: 265, text: "Thirty days of showing up." },
  { day: 100, name: "Solar", hue: 25, text: "One hundred days. Radiant." }
];
const collection = document.querySelector("#flameCollection");
const dialog = document.querySelector("#evolutions");
let previewTier = null;
function tierFor(value) { return tiers.filter(tier => value >= tier.day).at(-1); }
function applyTier(tier) {
  document.documentElement.style.setProperty("--flame-hue", tier.hue + "deg");
  button.dataset.tier = tier.name.toLowerCase();
}
function updateEvolution(value) {
  const current = tierFor(value), next = tiers.find(tier => tier.day > value);
  applyTier(previewTier || current);
  document.querySelector("#flameName").textContent = previewTier ? previewTier.name + " · preview" : current.name;
  document.querySelector("#nextGoal").textContent = next ? (next.day-value) + " days to " + next.name : "Final evolution";
  document.querySelector("#progressFill").style.width = next ? ((value-current.day)/(next.day-current.day)*100) + "%" : "100%";
}
document.querySelector("#evolutionButton").addEventListener("click", () => {
  const value = Number(count.textContent);
  collection.replaceChildren();
  tiers.forEach(tier => {
    const card = document.createElement("button");
    card.className = "flame-card";
    card.style.setProperty("--card-hue", tier.hue + "deg");
    const miniature = button.querySelector(".fire").cloneNode(true);
    miniature.classList.add("miniature");
    // Keep gradient IDs unique inside each miniature.
    miniature.querySelectorAll("[id]").forEach(node => { node.id += "-" + tier.name; });
    miniature.querySelectorAll("[fill]").forEach(node => node.setAttribute("fill", node.getAttribute("fill").replace("#fire)", "#fire-" + tier.name + ")").replace("#heart)", "#heart-" + tier.name + ")")));
    const info = document.createElement("span");
    const name = document.createElement("strong"); name.textContent = tier.name;
    const desc = document.createElement("span"); desc.textContent = tier.text;
    info.append(name, desc);
    const badge = document.createElement("small");
    badge.textContent = value >= tier.day ? (tier === tierFor(value) ? "Current" : "Reached") : tier.day + " days";
    card.append(miniature, info, badge);
    card.addEventListener("click", () => { previewTier = tier; dialog.close(); render(); });
    collection.append(card);
  });
  dialog.showModal();
});
document.querySelector("#closeEvolution").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if(event.target === dialog) dialog.close(); });
let previewTimer;
dialog.addEventListener("close", () => { clearTimeout(previewTimer); if(previewTier) previewTimer = setTimeout(() => { previewTier = null; render(); }, 5000); });
const dateKey = (date = new Date()) => [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { days: [] };
  const data = JSON.parse(raw);
  if (!Array.isArray(data.days)) throw new Error("Invalid save");
  return data;
}
function streakFor(days) {
  const dates = new Set(days), cursor = new Date();
  if (!dates.has(dateKey(cursor))) cursor.setDate(cursor.getDate()-1);
  let value = 0;
  while (dates.has(dateKey(cursor))) { value++; cursor.setDate(cursor.getDate()-1); }
  return value;
}
function render() {
  clock.textContent = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  clock.dateTime = new Date().toISOString();
  try {
    const data = load();
    count.textContent = streakFor(data.days);
    updateEvolution(Number(count.textContent));
    button.setAttribute("aria-label", data.days.includes(dateKey()) ? "Today saved. Tap to enjoy the flame." : "I did something useful today. Save my streak.");
  } catch { status.textContent = "Your saved streak could not be read. Please enable browser storage and reload."; }
}
let animationTimer;
button.addEventListener("click", () => {
  if (previewTier) { previewTier = null; clearTimeout(previewTimer); render(); return; }
  try {
    const data = load(), today = dateKey();
    const isNew = !data.days.includes(today);
    if (isNew) {
      data.days.push(today);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      status.textContent = "Today saved.";
    }
    clearTimeout(animationTimer);
    button.classList.remove("ignite"); streak.classList.remove("bump");
    void button.offsetWidth;
    button.classList.add("ignite");
    if (isNew) streak.classList.add("bump");
    if (navigator.vibrate) navigator.vibrate(20);
    animationTimer = setTimeout(() => { button.classList.remove("ignite"); streak.classList.remove("bump"); }, 900);
    render();
  } catch { status.textContent = "Unable to save. Please enable browser storage and try again."; }
});
render();
setInterval(render, 1000);
window.addEventListener("storage", render);
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
