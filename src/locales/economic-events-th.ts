/** Thai labels for US economic release names. Technical tickers/abbreviations stay in Latin script. */
export const economicEventsTh: Record<string, string> = {
  "ADP Non-Farm Employment Change": "การจ้างงานภาคเอกชน ADP",
  "Average Hourly Earnings m/m": "ค่าจ้างรายชั่วโมงเฉลี่ย m/m",
  "Building Permits": "ใบอนุญาตก่อสร้าง",
  "CPI m/m": "เงินเฟ้อผู้บริโภค CPI m/m",
  "Core CPI m/m": "เงินเฟ้อพื้นฐาน Core CPI m/m",
  "Core PPI m/m": "เงินเฟ้อผู้ผลิตพื้นฐาน Core PPI m/m",
  "Construction Spending m/m": "การใช้จ่ายก่อสร้าง m/m",
  "Consumer Sentiment": "ดัชนีความเชื่อมั่นผู้บริโภค",
  "Continuing Jobless Claims": "ผู้ขอรับสวัสดิการว่างงานต่อเนื่อง",
  "Durable Goods Orders m/m": "ยอดสั่งซื้อสินค้าคงทน m/m",
  "Existing Home Sales": "ยอดขายบ้านมือสอง",
  "Fed Funds Rate": "อัตราดอกเบี้ยนโยบาย Fed Funds Rate",
  "GDP q/q": "อัตราการเติบโตเศรษฐกิจ GDP q/q",
  "Housing Starts": "การเริ่มสร้างบ้านใหม่",
  "ISM Manufacturing PMI": "ดัชนี ISM ภาคการผลิต (PMI)",
  "ISM Manufacturing Prices": "ดัชนีราคา ISM ภาคการผลิต",
  "ISM Services PMI": "ดัชนี ISM ภาคบริการ (PMI)",
  "Industrial Production m/m": "ผลผลิตภาคอุตสาหกรรม m/m",
  "Initial Jobless Claims": "ผู้ขอรับสวัสดิการว่างงานครั้งแรก",
  "JOLTS Job Openings": "ตำแหน่งงานว่าง JOLTS",
  "Labor Force Participation Rate": "อัตราการมีส่วนร่วมกำลังแรงงาน",
  NFP: "การจ้างงานนอกภาคเกษตร (NFP)",
  "New Home Sales": "ยอดขายบ้านใหม่",
  "PCE m/m": "เงินเฟ้อ PCE m/m",
  "PPI m/m": "เงินเฟ้อผู้ผลิต PPI m/m",
  "Retail Sales m/m": "ยอดค้าปลีก m/m",
  "Trade Balance": "ดุลการค้า",
  Unemployment: "อัตราการว่างงาน",
};

export function eventLabel(event: string, lang: string): string {
  return lang === "th" ? (economicEventsTh[event] ?? event) : event;
}
