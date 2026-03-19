(function () {

  const STORAGE_KEY = "plate_chat_v1";
  const API_URL = "/api";

  // =========================
  // UI
  // =========================
  const root = document.createElement("div");
  root.innerHTML = `
  <div id="plate-ai-win" style="
    display:none;
    position:fixed;
    bottom:90px;
    right:20px;
    width:360px;
    height:560px;
    background:#fff;
    border-radius:16px;
    box-shadow:0 12px 40px rgba(0,0,0,0.15);
    z-index:9999;
    flex-direction:column;
    overflow:hidden;
    border:1px solid #eee;
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;
  ">
    
    <div style="
      background:#000;
      color:#fff;
      padding:14px 16px;
      font-weight:600;
      display:flex;
      justify-content:space-between;
      align-items:center;
    ">
      <span>Plate Assistant</span>
      <span id="plate-close" style="cursor:pointer;">✕</span>
    </div>

    <div id="plate-msgs" style="
      flex:1;
      padding:12px;
      overflow-y:auto;
      display:flex;
      flex-direction:column;
      gap:8px;
      background:#f9fafb;
    "></div>

    <div style="
      padding:10px;
      border-top:1px solid #eee;
      display:flex;
      gap:6px;
    ">
      <input id="plate-input" placeholder="สอบถามเรื่องจองโต๊ะ..." style="
        flex:1;
        padding:10px;
        border:1px solid #ddd;
        border-radius:8px;
        font-size:16px;
      ">
      <button id="plate-send" style="
        background:#000;
        color:#fff;
        border:none;
        padding:10px 14px;
        border-radius:8px;
        cursor:pointer;
      ">ส่ง</button>
    </div>

  </div>
  `;
  document.body.appendChild(root);

  const win = document.getElementById("plate-ai-win");
  const msgs = document.getElementById("plate-msgs");
  const input = document.getElementById("plate-input");

  // =========================
  // STORAGE
  // =========================
  function save(role, text) {
    const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    h.push({ role, parts: [{ text }] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
  }

  function load() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  }

  // =========================
  // UI MESSAGE
  // =========================
  function add(role, text, saveFlag = true) {
    const div = document.createElement("div");

    div.style.alignSelf = role === "model" ? "flex-start" : "flex-end";
    div.style.background = role === "model" ? "#e5e7eb" : "#000";
    div.style.color = role === "model" ? "#111" : "#fff";
    div.style.padding = "10px 12px";
    div.style.borderRadius = "12px";
    div.style.maxWidth = "80%";
    div.style.fontSize = "14px";
    div.style.lineHeight = "1.5";

    // clean hidden commands
    let clean = text
      .replace(/RESERVATION_REQUEST:\s*true/gi, '')
      .replace(/MENU_CARDS:\s*\[.*?\]/gi, '')
      .trim();

    if (!clean && role === "model") return;

    div.innerText = clean;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;

    if (saveFlag) save(role, text);
  }

  function loadHistory() {
    const h = load();
    if (!h.length) {
      add("model", "สวัสดีค่ะ ยินดีต้อนรับสู่ Plate สนใจจองโต๊ะหรือดูเมนูดีคะ?", false);
    } else {
      h.forEach(m => add(m.role, m.parts[0].text, false));
    }
  }

  // =========================
  // LOADING
  // =========================
  function showDots() {
    const d = document.createElement("div");
    d.style.display = "flex";
    d.style.gap = "4px";
    d.style.padding = "8px";
    d.innerHTML = `
      <div style="width:6px;height:6px;background:#000;border-radius:50%;animation:bounce 1.2s infinite"></div>
      <div style="width:6px;height:6px;background:#000;border-radius:50%;animation:bounce 1.2s infinite .2s"></div>
      <div style="width:6px;height:6px;background:#000;border-radius:50%;animation:bounce 1.2s infinite .4s"></div>
    `;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  // =========================
  // API
  // =========================
  async function send(msg) {
    add("user", msg);

    const history = load();
    const loader = showDots();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history })
      });

      const data = await res.json();
      loader.remove();

      add("model", data.text || "ขออภัยค่ะ ระบบขัดข้อง");

    } catch (e) {
      loader.remove();
      add("model", "ขออภัยค่ะ ระบบขัดข้อง");
    }
  }

  // =========================
  // INPUT
  // =========================
  document.getElementById("plate-send").onclick = () => {
    const val = input.value.trim();
    if (!val) return;
    input.value = "";
    send(val);
  };

  input.onkeypress = (e) => {
    if (e.key === "Enter") document.getElementById("plate-send").click();
  };

  document.getElementById("plate-close").onclick = () => {
    win.style.display = "none";
  };

  // =========================
  // MATCH TEXT "จองโต๊ะ"
  // =========================
  function bindBooking() {
    document.querySelectorAll("a, button, div, span").forEach(el => {
      if (el.dataset.bound) return;

      const text = el.innerText?.trim();

      if (
        text &&
        text.includes("จองโต๊ะ") &&
        el.offsetParent !== null
      ) {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          win.style.display = "flex";
        });

        el.dataset.bound = "true";
      }
    });
  }

  setInterval(bindBooking, 1000);

  // =========================
  // INIT
  // =========================
  loadHistory();

})();
