const reminderDialog = document.querySelector("#reminderDialog");
const reminderTime = document.querySelector("#reminderTime");
for (let minute = 0; minute < 1440; minute += 15) {
  const value = String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0");
  reminderTime.add(new Option(value, value));
}
try { reminderTime.value = localStorage.getItem("streak-reminder-time") || "20:00"; } catch { reminderTime.value = "20:00"; }
if (!reminderTime.value) reminderTime.value = "20:00";
function updateReminderLinks() {
  const value = reminderTime.value;
  const apple = new URL("reminders/" + value.replace(":", "") + ".ics", location.href);
  apple.protocol = "webcal:";
  document.querySelector("#appleReminder").href = apple.href;
  const start = new Date();
  const [hours, minutes] = value.split(":").map(Number);
  start.setHours(hours, minutes, 0, 0);
  if (start <= new Date()) start.setDate(start.getDate() + 1);
  const format = date => date.getFullYear() + String(date.getMonth()+1).padStart(2,"0") + String(date.getDate()).padStart(2,"0") + "T" + String(date.getHours()).padStart(2,"0") + String(date.getMinutes()).padStart(2,"0") + "00";
  const end = new Date(start.getTime() + 5*60000);
  const params = new URLSearchParams({
    action: "TEMPLATE", text: "Keep your streak alive",
    dates: format(start) + "/" + format(end),
    recur: "RRULE:FREQ=DAILY",
    details: "Did something useful today? Tap your flame. https://notunis.github.io/streak-spark/",
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  document.querySelector("#googleReminder").href = "https://calendar.google.com/calendar/render?" + params;
  try { localStorage.setItem("streak-reminder-time", value); } catch {}
}
document.querySelector("#reminderOpen").addEventListener("click", () => { updateReminderLinks(); reminderDialog.showModal(); });
document.querySelector(".close-reminder").addEventListener("click", () => reminderDialog.close());
reminderDialog.addEventListener("click", event => { if(event.target === reminderDialog) reminderDialog.close(); });
reminderTime.addEventListener("change", updateReminderLinks);
