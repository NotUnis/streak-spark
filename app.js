const STORAGE_KEY = "streak-spark-v1";
const clock = document.querySelector("#clock");
const button = document.querySelector("#streakButton");
const count = document.querySelector("#streakCount");
const status = document.querySelector("#status");
const streak = document.querySelector(".streak");
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
    button.setAttribute("aria-label", data.days.includes(dateKey()) ? "Today saved. Tap to enjoy the flame." : "I did something useful today. Save my streak.");
  } catch { status.textContent = "Your saved streak could not be read. Please enable browser storage and reload."; }
}
let animationTimer;
button.addEventListener("click", () => {
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
