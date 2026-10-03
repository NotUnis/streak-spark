(() => {
  const $ = id => document.getElementById(id);
  const dialog = $("alarmDialog");
  let context, target = null, ringing = false, soundTimer, testTimer, wakeLock;
  const voices = new Set();
  try { $("alarmTime").value = localStorage.getItem("streak-alarm-time") || "20:00"; } catch {}
  async function unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error("Audio unavailable");
    context ||= new Audio();
    await context.resume();
    if (context.state !== "running") throw new Error("Audio blocked");
  }
  function tone(delay, frequency) {
    const oscillator = context.createOscillator(), gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = "sine"; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(.22, start + .025);
    gain.gain.setValueAtTime(.22, start + .14);
    gain.gain.exponentialRampToValueAtTime(.001, start + .25);
    oscillator.connect(gain); gain.connect(context.destination);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start + .27);
  }
  function pulse() {
    if (context?.state !== "running") return;
    [0,.3,.6,.9].forEach((delay,index) => tone(delay,index % 2 ? 1046 : 784));
  }
  function silence() {
    clearInterval(soundTimer); clearTimeout(testTimer);
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
  }
  function sound() { silence(); pulse(); soundTimer = setInterval(pulse, 1600); }
  async function keepAwake() {
    try { if (!wakeLock && navigator.wakeLock && !document.hidden) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } } catch {}
  }
  function release() { if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; } }
  function display(message) {
    $("alarmStatus").textContent = message;
    $("alarmRinging").hidden = !ringing;
    $("alarmSetup").hidden = ringing;
    $("alarmCancel").hidden = target === null;
    $("alarmTime").disabled = ringing;
    $("alarmOpen").textContent = ringing ? "Alarm ringing" : target ? "Alarm · " + new Date(target).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "Set alarm";
  }
  function scheduled() {
    display("Armed for " + new Date(target).toLocaleString([], {weekday:"short",hour:"2-digit",minute:"2-digit"}) + ". Keep this app open.");
  }
  function stop() {
    silence(); ringing = false; target = null; release(); display("Alarm stopped.");
  }
  function check() {
    if (!target || ringing || Date.now() < target) return;
    target = null; ringing = true; sound();
    if (!dialog.open) dialog.showModal();
    display(context?.state === "running" ? "Time’s up. Keep your fire alive." : "Time’s up. Sound was paused by your phone.");
  }
  $("alarmOpen").addEventListener("click", () => dialog.showModal());
  $("alarmClose").addEventListener("click", () => { if(ringing) stop(); else if(!target) silence(); dialog.close(); });
  dialog.addEventListener("cancel", () => { if(ringing) stop(); else silence(); });
  $("alarmSet").addEventListener("click", async () => {
    if (!$("alarmTime").reportValidity()) return;
    try {
      await unlock(); silence();
      const [hour,minute] = $("alarmTime").value.split(":").map(Number);
      const next = new Date(); next.setHours(hour,minute,0,0);
      if (next.getTime() <= Date.now()) next.setDate(next.getDate()+1);
      target = next.getTime(); ringing = false;
      try { localStorage.setItem("streak-alarm-time", $("alarmTime").value); } catch {}
      keepAwake(); scheduled();
    } catch { display("Sound could not start. Try again in Safari or Chrome."); }
  });
  $("alarmTest").addEventListener("click", async () => {
    try { await unlock(); sound(); display("Playing a 3-second test. Check your volume.");
      testTimer = setTimeout(() => { silence(); if(target) scheduled(); else display("Test finished. Choose a time and tap Set alarm."); },3000);
    } catch { display("Sound could not start. Try again in Safari or Chrome."); }
  });
  $("alarmCancel").addEventListener("click", stop);
  $("alarmStop").addEventListener("click", stop);
  $("alarmSnooze").addEventListener("click", () => {
    silence(); ringing = false; target = Date.now() + 300000; keepAwake(); scheduled();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { if(target || ringing) keepAwake(); check(); }
  });
  setInterval(check, 250);
})();
