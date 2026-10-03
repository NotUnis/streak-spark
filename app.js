const STORAGE_KEY = "streak-spark-v1";
const countEl = document.querySelector("#streakCount");
const statusEl = document.querySelector("#statusLabel");
const button = document.querySelector("#streakButton");
const buttonCopy = document.querySelector("#buttonCopy");
const hint = document.querySelector("#streakHint");
const weekGrid = document.querySelector("#weekGrid");
const weekScore = document.querySelector("#weekScore");
const celebration = document.querySelector("#celebration");
const resetDialog = document.querySelector("#resetDialog");

const dateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data && Array.isArray(data.days) ? data : { days: [] };
  } catch { return { days: [] }; }
}

function save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function streakFor(days) {
  const set = new Set(days);
  const cursor = new Date();
  if (!set.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function weekDates() {
  const today = new Date();
  const monday = new Date(today);
  const shift = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - shift);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

function render() {
  const data = load();
  const checked = new Set(data.days);
  const today = dateKey();
  const done = checked.has(today);
  countEl.textContent = streakFor(data.days);
  statusEl.textContent = done ? "today is locked in" : "ready for today?";
  button.classList.toggle("done", done);
  button.disabled = done;
  buttonCopy.textContent = done ? "done for today" : "i did something useful";
  hint.textContent = done ? "come back tomorrow and keep it alive." : "tap only when you’ve earned it today.";
  const dates = weekDates();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  weekGrid.innerHTML = dates.map(day => {
    const key = dateKey(day);
    const classes = ["day", checked.has(key) ? "checked" : "", key === today ? "today" : ""].join(" ");
    return `<div class="${classes}"><div class="day-dot">${checked.has(key) ? "✓" : day.getDate()}</div><span>${dayNames[day.getDay()]}</span></div>`;
  }).join("");
  weekScore.textContent = `${dates.filter(d => checked.has(dateKey(d))).length} / 7`;
}

function sparks() {
  const rect = button.getBoundingClientRect();
  const colors = ["#ff4fa0", "#9b6cff", "#ffd166", "#ff8a3d", "#68e6c1"];
  for (let i = 0; i < 22; i += 1) {
    const spark = document.createElement("i");
    spark.className = "spark";
    spark.style.left = `${rect.left + rect.width / 2}px`;
    spark.style.top = `${rect.top + rect.height / 2}px`;
    spark.style.background = colors[i % colors.length];
    const angle = (Math.PI * 2 * i) / 22;
    const distance = 90 + Math.random() * 100;
    spark.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    document.body.append(spark);
    setTimeout(() => spark.remove(), 950);
  }
}

button.addEventListener("click", () => {
  const data = load();
  const today = dateKey();
  if (data.days.includes(today)) return;
  data.days.push(today);
  save(data);
  button.classList.add("ignite");
  sparks();
  celebration.textContent = "streak saved. nice work ✦";
  if (navigator.vibrate) navigator.vibrate([30, 30, 60]);
  setTimeout(() => button.classList.remove("ignite"), 800);
  render();
});

document.querySelector("#resetButton").addEventListener("click", () => resetDialog.showModal());
resetDialog.addEventListener("close", () => {
  if (resetDialog.returnValue === "confirm") {
    localStorage.removeItem(STORAGE_KEY);
    celebration.textContent = "fresh start. you’ve got this.";
    render();
  }
});

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
render();
