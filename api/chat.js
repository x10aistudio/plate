export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const RESTAURANT_INFO = {
    name: "Plate Cafe & Restaurant",
    address: "สีลม ซอย 30, กรุงเทพฯ",
    phone: "02-989-8888",
    line: "@platefood",
    email: "contact@platefood.co.th",
    hours: "Mon–Fri: 8:00 – 22:00 / Sat–Sun: 9:00 – 23:00",
    parking: "มีที่จอดรถหน้าร้านประมาณ 5–6 คัน (จอดฟรี 2 ชั่วโมง)"
  };

  const MENU = [
    { title: "Garlic Butter Toast", price: 95, description: "ขนมปังโฮมเมดอบกรอบ ทาเนยกระเทียมหอม ๆ" },
    { title: "Roasted Cauliflower Bites", price: 135, description: "ดอกกะหล่ำอบเครื่องเทศ เสิร์ฟพร้อมซอสกระเทียมไอโอลี" },
    { title: "Crispy Chicken Bites", price: 135, description: "ไก่ทอดกรอบชิ้นพอดีคำ เสิร์ฟพร้อมซอสสูตรทางร้าน" },
    { title: "Fresh Garden Salad", price: 120, description: "สลัดผักสดจากฟาร์ม น้ำสลัดงาคั่ว" },
    { title: "Avocado & Egg Toast", price: 165, description: "อะโวคาโดบดกับไข่ออนเซ็นบนขนมปังซาวโดว์" },
    { title: "Grilled Chicken Rice Bowl", price: 185, description: "อกไก่ย่างนุ่ม ราดซอสเทอริยากิ" },
    { title: "Grilled Halloumi & Quinoa Bowl", price: 245, description: "คีนัว มันหวานอบ ชีสฮาลูมีย่าง" },
    { title: "Creamy Mushroom Pasta", price: 195, description: "พาสต้าซอสครีมเห็ดหอม เข้มข้น" },
    { title: "Salmon Teriyaki Bowl", price: 245, description: "แซลมอนย่างซอสเทอริยากิ ข้าวญี่ปุ่น" },
    { title: "Thai Basil Chicken Pasta", price: 175, description: "พาสต้าผัดซอสกะเพราสไตล์ฟิวชั่น" },
    { title: "Roasted Vegetable & Pesto Tart", price: 175, description: "ผักตามฤดูกาลอบ แป้งพายกรอบ เพสโต้วีแกน" },
    { title: "French Fries", price: 89, description: "มันฝรั่งทอดกรอบ" },
    { title: "Sweet Potato Fries", price: 95, description: "มันหวานทอด หอมหวาน" },
    { title: "Garlic Edamame", price: 85, description: "ถั่วแระญี่ปุ่นผัดกระเทียม" },
    { title: "Truffle Fries", price: 125, description: "มันฝรั่งทอด คลุกน้ำมันทรัฟเฟิล" },
    { title: "Cheese Garlic Bread", price: 110, description: "ขนมปังกระเทียมอบชีส" },
    { title: "Lemon Cheesecake", price: 145, description: "ชีสเค้กเลมอน เปรี้ยวหวาน" },
    { title: "Classic Chocolate Cake", price: 135, description: "เค้กช็อกโกแลตเนื้อนุ่ม" },
    { title: "Honey Toast", price: 165, description: "โทสต์กรอบนอกนุ่มใน เสิร์ฟพร้อมไอศกรีม" },
    { title: "Matcha Tiramisu", price: 155, description: "ทีรามิสุมัทฉะ หอมชาเขียว" },
    { title: "Iced Americano", price: 85, description: "กาแฟอเมริกาโน่เย็น" },
    { title: "Latte", price: 95, description: "ลาเต้หอมมัน" },
    { title: "Matcha Latte", price: 110, description: "มัทฉะพรีเมียม ผสมนมสด" },
    { title: "Thai Milk Tea", price: 85, description: "ชาไทยสูตรเข้มข้น" },
    { title: "Fresh Lime Soda", price: 75, description: "โซดามะนาวสด เปรี้ยวซ่า" },
    { title: "Honey Lemon Tea", price: 90, description: "ชามะนาวน้ำผึ้ง" },
    { title: "Berry Basil Cooler", price: 95, description: "เบอร์รีรวม ผสมใบโหระพาสด" }
  ];

  try {
    const { history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `คุณคือพนักงานร้าน ${RESTAURANT_INFO.name} ข้อมูลร้าน: ${JSON.stringify(RESTAURANT_INFO)} 
    เมนู: ${MENU.map(m => `${m.title} ${m.price}บาท`).join(", ")}
    หน้าที่: แนะนำเมนูและจองโต๊ะ (ถามชื่อ, วันที่, เวลา, จำนวนท่าน) ลงท้าย "ค่ะ" เสมอ ห้ามบอกว่าเป็น AI`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "System: " + systemInstruction }] }, { role: "model", parts: [{ text: "รับทราบค่ะ" }] }, ...history] })
    });

    const data = await response.json();
    return res.status(200).json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || "ขออภัยค่ะ ลองใหม่อีกครั้งนะขา" });
  } catch (e) {
    return res.status(500).json({ text: "Error: " + e.message });
  }
}
