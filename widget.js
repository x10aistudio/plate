(function () {
  // ป้องกันการรันซ้ำ 100%
  if (window.PLATE_WIDGET_LOADED) return;
  window.PLATE_WIDGET_LOADED = true;

  const STORAGE_KEY = "plate_chat_v1";
  const API_URL = "/api";

  // สร้าง UI
  const root = document.createElement("div");
  root.innerHTML = `
  <div id="plate-ai-win" style="display:none;position:fixed;bottom:90px;right:20px;width:360px;height:560px;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.15);z-index:9999;flex-direction:column;overflow:hidden;border:1px solid #eee;font-family:sans-serif;">
    <div style="background:#000;color:#fff;padding:14px 16px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">
      <span>Plate Assistant</span>
      <span id="plate-close" style="cursor:pointer;">✕</span>
    </div>
    <div id="plate-msgs" style="flex:1;padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;background:#f9fafb;"></div>
    <div style="padding:10px;border-top:1px solid #eee;display:flex;gap:6px;">
      <input id="plate-input" placeholder="สอบถามเมนู หรือจองโต๊ะ..." style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:18px;">
      <button id="plate-send" style="background:#000;color:#fff;border:none;padding:10px 14px;border-radius:8px;cursor:pointer;">ส่ง</button>
    </div>
  </div>
  `;
  document.body.appendChild(root);

  const win = document.getElementById("plate-ai-win");
  const msgs = document.getElementById("plate-msgs");
  const input = document.getElementById("plate-input");

  function add(role, text, saveFlag = true) {
    const div = document.createElement("div");
    div.style.alignSelf = role === "model" ? "flex-start" : "flex-end";
    div.style.background = role === "model" ? "#e5e7eb" : "#000";
    div.style.color = role === "model" ? "#111" : "#fff";
    div.style.padding = "10px 12px";
    div.style.borderRadius = "12px";
    div.style.maxWidth = "80%";
    div.style.fontSize = "18px";
    
    let clean = text.replace(/RESERVATION_REQUEST:\s*true/gi, '').trim();
    if (!clean && role === "model") return;

    div.innerText = clean;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;

    if (saveFlag) {
      const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      h.push({ role, parts: [{ text }] });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
    }
  }

  async function send(msg) {
    add("user", msg);
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    
    const loader = document.createElement("div");
    loader.innerText = "...";
    msgs.appendChild(loader);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history })
      });
      const data = await res.json();
      loader.remove();
      add("model", data.text);
    } catch (e) {
      loader.remove();
      add("model", "ขออภัย ระบบขัดข้อง");
    }
  }

  // Event Listeners
  document.getElementById("plate-send").onclick = () => {
    const val = input.value.trim();
    if (!val) return;
    input.value = "";
    send(val);
  };

  document.getElementById("plate-close").onclick = () => win.style.display = "none";

  // Initial Welcome Message
  const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (h.length === 0) {
    add("model", "สวัสดีค่ะ ยินดีต้อนรับสู่ Plate สนใจจองโต๊ะหรือดูเมนูดีคะ?", false);
  } else {
    h.forEach(m => add(m.role, m.parts[0].text, false));
  }

  // ดักจับปุ่มจองโต๊ะบน Framer
  setInterval(() => {
    document.querySelectorAll("button, a").forEach(el => {
      if (el.innerText.includes("จองโต๊ะ") && !el.dataset.bound) {
        el.onclick = (e) => { e.preventDefault(); win.style.display = "flex"; };
        el.dataset.bound = "true";
      }
    });
  }, 1000);
})();
