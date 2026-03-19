(function () {
  if (window.PLATE_WIDGET_LOADED) return;
  window.PLATE_WIDGET_LOADED = true;

  const STORAGE_KEY = "plate_chat_v1";
  const API_URL = "/api";

  // 1. สร้าง UI และปรับ Font ขนาด 18px ในช่อง Input
  const root = document.createElement("div");
  root.innerHTML = `
  <div id="plate-ai-win" style="display:none;position:fixed;bottom:90px;right:20px;width:380px;height:600px;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.15);z-index:9999;flex-direction:column;overflow:hidden;border:1px solid #eee;font-family:sans-serif;">
    <div style="background:#000;color:#fff;padding:14px 16px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:18px;">Plate Assistant</span>
      <span id="plate-close" style="cursor:pointer;font-size:20px;">✕</span>
    </div>
    <div id="plate-msgs" style="flex:1;padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:#f9fafb;"></div>
    <div style="padding:10px;border-top:1px solid #eee;display:flex;gap:6px;background:#fff;">
      <input id="plate-input" placeholder="สอบถามเมนู หรือจองโต๊ะ..." style="
        flex:1;
        padding:12px;
        border:1px solid #ddd;
        border-radius:8px;
        font-size:18px; /* ปรับขนาดตัวหนังสือตรงช่องพิมพ์เป็น 18px */
        outline:none;
      ">
      <button id="plate-send" style="background:#000;color:#fff;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:18px;">ส่ง</button>
    </div>
  </div>
  `;
  document.body.appendChild(root);

  const win = document.getElementById("plate-ai-win");
  const msgs = document.getElementById("plate-msgs");
  const input = document.getElementById("plate-input");

  // 2. ฟังก์ชันแสดงข้อความ และปรับ Font ขนาด 18px ในช่องแชท
  function add(role, text, saveFlag = true) {
    const div = document.createElement("div");
    
    // ลบคำสั่งระบบออกก่อนแสดงผล
    let cleanText = text.replace(/RESERVATION_REQUEST:\s*true/gi, '').trim();
    if (!cleanText && role === "model") return;

    div.style.alignSelf = role === "model" ? "flex-start" : "flex-end";
    div.style.background = role === "model" ? "#e5e7eb" : "#000";
    div.style.color = role === "model" ? "#111" : "#fff";
    div.style.padding = "12px 16px";
    div.style.borderRadius = "14px";
    div.style.maxWidth = "85%";
    div.style.fontSize = "18px"; // ปรับขนาดตัวหนังสือในช่องแชทเป็น 18px
    div.style.lineHeight = "1.6";
    div.style.wordBreak = "break-word";

    div.innerText = cleanText;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;

    if (saveFlag) {
      const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      h.push({ role, parts: [{ text }] });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
    }

    // เช็คเพื่อบันทึกข้อมูลการจองลง LocalStorage
    if (role === "model" && text.includes("RESERVATION_REQUEST: true")) {
      saveBookingToLocal(text);
    }
  }

  function saveBookingToLocal(fullText) {
    const bookings = JSON.parse(localStorage.getItem("plate_bookings") || "[]");
    bookings.push({
      id: Date.now(),
      date: new Date().toLocaleString("th-TH"),
      details: fullText.replace(/RESERVATION_REQUEST:\s*true/gi, '').trim()
    });
    localStorage.setItem("plate_bookings", JSON.stringify(bookings));
    console.log("จองสำเร็จ: บันทึกข้อมูลลงเครื่องแล้ว");
  }

  async function send(msg) {
    add("user", msg);
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    
    const loader = document.createElement("div");
    loader.style.fontSize = "18px";
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

  document.getElementById("plate-send").onclick = () => {
    const val = input.value.trim();
    if (!val) return;
    input.value = "";
    send(val);
  };

  input.onkeypress = (e) => { if (e.key === "Enter") document.getElementById("plate-send").click(); };
  document.getElementById("plate-close").onclick = () => win.style.display = "none";

  // โหลดประวัติแชท
  const h = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (h.length === 0) {
    add("model", "สวัสดีค่ะ ยินดีต้อนรับสู่ Plate สนใจจองโต๊ะหรือดูเมนูดีคะ?", false);
  } else {
    h.forEach(m => add(m.role, m.parts[0].text, false));
  }

  // ดักปุ่มจองโต๊ะ
  setInterval(() => {
    document.querySelectorAll("button, a").forEach(el => {
      if (el.innerText.includes("จองโต๊ะ") && !el.dataset.bound) {
        el.onclick = (e) => { e.preventDefault(); win.style.display = "flex"; };
        el.dataset.bound = "true";
      }
    });
  }, 1000);
})();
