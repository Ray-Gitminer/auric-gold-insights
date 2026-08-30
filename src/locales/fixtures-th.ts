/**
 * Thai translations for demo fixture content (strategy, journal, bias,
 * impact score, alerts, system health). Keyed by the English source string so
 * components can pass fixture text straight through `tx()`.
 * Technical terms (XAU/USD, EMA, RSI, CPI, BUY, SELL, IBKR…) stay untranslated.
 */
export const fixturesTh: Record<string, string> = {
  // ---------- strategy ----------
  "Gold trend continuation (1D)": "แนวโน้มทองคำต่อเนื่อง (1D)",
  "Price above 50 EMA": "ราคาอยู่เหนือ EMA 50",
  "2,354.6 > 2,301.4": "2,354.6 > 2,301.4",
  "Higher high structure": "โครงสร้างยอดสูงขึ้นต่อเนื่อง",
  "Last swing high broken 14 May": "ทะลุยอดสวิงล่าสุดเมื่อ 14 พ.ค.",
  "Pullback into value zone": "ย่อตัวเข้าสู่โซนราคาที่เหมาะสม",
  "Awaiting retest of 2,330": "รอการกลับมาทดสอบ 2,330",
  "Momentum not overextended": "โมเมนตัมยังไม่ยืดเกินไป",
  "RSI 61.4": "RSI 61.4",
  "No high-impact event < 60m": "ไม่มีเหตุการณ์ผลกระทบสูงภายใน 60 นาที",
  "CPI y/y in 42m": "CPI y/y ในอีก 42 นาที",
  "Spread within tolerance": "สเปรดอยู่ในเกณฑ์ที่ยอมรับได้",
  "0.28 vs max 0.45": "0.28 เทียบเพดาน 0.45",

  // ---------- gold impact score ----------
  "Moderately bullish": "ค่อนข้างเป็นบวกต่อทองคำ",
  "Softer USD (DXY -0.4%)": "ดอลลาร์อ่อนค่า (DXY -0.4%)",
  "Core CPI in line": "Core CPI ออกมาตามคาด",
  "Central bank buying headlines": "ข่าวธนาคารกลางเข้าซื้อทองคำ",
  "Rising real yields": "อัตราผลตอบแทนที่แท้จริงปรับสูงขึ้น",

  // ---------- market bias ----------
  Bullish: "ขาขึ้น",
  Bearish: "ขาลง",
  Neutral: "เป็นกลาง",
  High: "สูง",
  Medium: "ปานกลาง",
  Low: "ต่ำ",
  "1–3 sessions": "1–3 รอบการซื้อขาย",
  "1–2 quarters": "1–2 ไตรมาส",
  "Trend structure intact on the daily with dollar weakness and steady central-bank demand supporting dips toward the 2,330 value zone.":
    "โครงสร้างแนวโน้มบนกราฟรายวันยังสมบูรณ์ ประกอบกับดอลลาร์อ่อนค่าและแรงซื้อจากธนาคารกลางที่สม่ำเสมอ ช่วยพยุงการย่อตัวลงมาบริเวณโซนราคา 2,330",
  "Real yields have ticked higher for three sessions and positioning is crowded; a hot core CPI print would invalidate the pullback thesis.":
    "อัตราผลตอบแทนที่แท้จริงปรับขึ้นต่อเนื่องสามรอบการซื้อขาย และสถานะการถือครองค่อนข้างหนาแน่น หาก Core CPI ออกมาสูงกว่าคาดจะทำให้สมมติฐานการย่อตัวเป็นโมฆะ",
  "Daily close below 2,300 (S1) or a >1.2% USD rally.":
    "ราคาปิดรายวันต่ำกว่า 2,300 (S1) หรือดอลลาร์แข็งค่ามากกว่า 1.2%",
  Normal: "ปกติ",
  Elevated: "สูงกว่าปกติ",
  Breach: "เกินเพดาน",

  // ---------- journal ----------
  "GCM5 swing setup monitored": "เฝ้าติดตามรูปแบบสวิงของ GCM5",
  "SILM5 trailing stop adjusted": "ปรับ Trailing Stop ของ SILM5",
  "Market recap": "สรุปภาวะตลาด",
  "HGK5 short — early entry": "ชอร์ต HGK5 — เข้าเทรดเร็วเกินไป",
  "Trend continuation": "เทรดตามแนวโน้มต่อเนื่อง",
  "Position management": "การบริหารสถานะ",
  "Pre-session prep": "เตรียมตัวก่อนเปิดตลาด",
  "Mean reversion": "กลับสู่ค่าเฉลี่ย",
  Breakout: "เบรกเอาต์",
  Pullback: "ย่อตัวเข้าเทรด",
  "Watching the 2,300 support zone for a controlled retest before adding to the June future.":
    "เฝ้าดูโซนแนวรับ 2,300 เพื่อรอการกลับมาทดสอบอย่างมีระเบียบ ก่อนเพิ่มสถานะในสัญญาเดือนมิถุนายน",
  "Waited for the level instead of chasing. Good process.":
    "รอที่ระดับราคาแทนการไล่ราคา ถือว่ากระบวนการดี",
  "Moved stop to 31.50 to lock in gains after the breakout extended.":
    "เลื่อน Stop Loss ไปที่ 31.50 เพื่อล็อกกำไรหลังการเบรกเอาต์ขยายตัว",
  "Adjusted stop slightly early": "เลื่อน Stop เร็วกว่าที่วางแผนเล็กน้อย",
  "Reasonable, but the plan called for 31.20.": "พอรับได้ แต่แผนกำหนดไว้ที่ 31.20",
  "Gold firm on softer USD, CPI in focus. No new risk before the print.":
    "ทองคำแข็งแกร่งจากดอลลาร์ที่อ่อนค่า ตลาดจับตา CPI จึงไม่เปิดความเสี่ยงใหม่ก่อนตัวเลขประกาศ",
  "Prep completed before the open.": "เตรียมงานเสร็จก่อนตลาดเปิด",
  "Faded the copper spike without waiting for confirmation.":
    "สวนการพุ่งขึ้นของทองแดงโดยไม่รอสัญญาณยืนยัน",
  "Entered before signal": "เข้าเทรดก่อนเกิดสัญญาณ",
  "Size above plan": "ขนาดสถานะเกินแผน",
  "Cut size next time; the setup was not yet valid.":
    "ครั้งหน้าให้ลดขนาดสถานะ เพราะรูปแบบยังไม่ครบเงื่อนไข",
  Calm: "สงบนิ่ง",
  Confident: "มั่นใจ",
  Anxious: "กังวล",
  Frustrated: "หงุดหงิด",
  Impatient: "ใจร้อน",

  // ---------- alerts ----------
  "Risk Alert: Drawdown 1.28% exceeds daily threshold 1.00%":
    "เตือนความเสี่ยง: การลดลงของพอร์ต 1.28% เกินเพดานรายวัน 1.00%",
  "GCM5 reached resistance R1 (2,390.0)": "GCM5 แตะแนวต้าน R1 (2,390.0)",
  "CPI data released: Core CPI m/m 0.3% (in line)":
    "ประกาศตัวเลข CPI: Core CPI m/m 0.3% (ตามคาด)",
  "Market data snapshot refreshed": "รีเฟรชข้อมูลตลาดล่าสุดแล้ว",
  "Daily drawdown breach": "การลดลงของพอร์ตเกินเพดานรายวัน",
  "Drawdown ≤ -1.00% intraday": "การลดลงของพอร์ต ≤ -1.00% ระหว่างวัน",
  "Gold key level": "ระดับราคาสำคัญของทองคำ",
  "XAUUSD crosses 2,390 or 2,300": "XAU/USD ทะลุ 2,390 หรือ 2,300",
  "Strategy setup valid": "รูปแบบกลยุทธ์ครบเงื่อนไข",
  "Setup state changes to VALID": "สถานะสัญญาณเปลี่ยนเป็น VALID",
  "High-impact US event": "เหตุการณ์สหรัฐฯ ผลกระทบสูง",
  "60 minutes before High impact event": "60 นาทีก่อนเหตุการณ์ผลกระทบสูง",
  "Connection stale": "การเชื่อมต่อไม่เป็นปัจจุบัน",
  "Data feed age > 60s": "ข้อมูลฟีดเก่ากว่า 60 วินาที",
  "In-app": "ในแอป",
  "In-app + Email": "ในแอป + อีเมล",

  // ---------- system health ----------
  "Data Feed": "ฟีดข้อมูล",
  "Snapshot age 12s": "ข้อมูลอายุ 12 วินาที",
  "IBKR Connector": "IBKR Connector",
  "Simulation mode": "โหมดจำลอง",
  "News Engine": "ระบบวิเคราะห์ข่าว",
  "Last run 08:30": "ทำงานล่าสุด 08:30",
  "AI Analysis": "การวิเคราะห์ด้วย AI",
  "Advisory only": "ใช้ประกอบการวิเคราะห์เท่านั้น",
  "Risk Engine": "ระบบบริหารความเสี่ยง",
  "Drawdown near limit": "การลดลงของพอร์ตใกล้เพดาน",
  "Alerts Engine": "ระบบแจ้งเตือน",
  "5 rules active": "เปิดใช้งาน 5 กฎ",
};
