(function () {

  const STORAGE_KEY = "plate_chat_v1";

  // ---------- UI ----------
  const root = document.createElement("div");
  root.innerHTML = `
  <div id="plate-ai-win" style="display:none; position:fixed; bottom:100px; right:20px; width:350px; height:550px; background:#fff; border-radius:15px; box-shadow:0 12px 40px rgba(0,0,0,0.15); z-index:9999; flex-direction:column; overflow:hidden; border:1px solid #eee; font-family:sans-serif;">
    
    <div style="background:#000; color:#fff; padding:16px; font-weight:bold; display:flex; justify-content:space-between;">
      <span>Plate Assistant</span>
      <span id="plate-close" style="cursor:pointer;">✕</span>
    </div>

    <div id="plate-msgs" style="flex:1; padding:12px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; background:#fafafa;"></div>

    <div style="padding:12px; border-top:1px solid #eee; display:flex; gap:6px;">
      <input id="plate-input" placeholder="สอบถามเมนู หรือจองโต๊ะ..." style="flex:1; padding:8px; border:1px solid #ddd; border-radius:6px;">
      <button id="plate-send" style="background:#000; color:#fff; border:none; padding:8px 12px; border-radius:6px;">ส่ง</button>
    </div>

  </div>
  `;
  document.body.appendChild(root);

  const win = document.getElementById("plate-ai-win");
  const msgs = document.getElementById("plate-msgs");
  const input = document.getElementById("plate-input");

  // ---------- Storage ----------
  function save(role, text) {
    const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    h.push({ role, parts: [{ text }] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
  }

  function load() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  }

  // ---------- UI ----------
  function add(role, text, saveFlag = true) {
    const div = document.createElement("div");
    div.style.alignSelf = role === "model" ? "flex-start" : "flex-end";
    div.style.background = role === "model" ? "#fff" : "#000";
    div.style.color = role === "model" ? "#333" : "#fff";
    div.style.padding = "8px 10px";
    div.style.borderRadius = "10px";
    div.style.maxWidth = "80%";
    div.innerText = text;
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

  // ---------- API ----------
  async function send(msg) {
    add("user", msg);

    const history = load();

    const res = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ history })
    });

    const data = await res.json();
    add("model", data.text);
  }

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

  // ---------- Bind "จองโต๊ะ" ----------
  function bindBooking() {
    document.querySelectorAll("a,button,div").forEach(el => {
      if (el.innerText && el.innerText.trim() === "จองโต๊ะ" && !el.dataset.ai) {
        el.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          win.style.display = "flex";
        };
        el.dataset.ai = "true";
      }
    });
  }

  setInterval(bindBooking, 1000);

  // ---------- Init ----------
  loadHistory();

})();
