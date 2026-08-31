# แก้ build error + ตรวจสอบ API keys

## 1. แก้ TypeScript build error (2 บรรทัด)

`src/lib/supabase/client.ts` บรรทัด 10-11 อ่านตัวแปร env ด้วย dot notation ซึ่งโปรเจกต์ตั้งค่า TS ให้ห้าม (TS4111):

```ts
const url = import.meta.env["VITE_SUPABASE_URL"]?.trim();
const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim();
```

ไม่มีการเปลี่ยนพฤติกรรมใด ๆ แค่เปลี่ยนรูปแบบการเข้าถึงค่า

## 2. ตรวจสอบคีย์จริง

คีย์ที่ตั้งไว้ในโปรเจกต์แล้ว: `BLS_API_KEY`, `BEA_API_KEY`, `FRED_API_KEY`, `CENSUS_API_KEY`, `LOVABLE_API_KEY`

จาก network log ล่าสุดของหน้าเว็บ: BLS, BEA (PCE + GDP) และ FRED/DOL คืนข้อมูลจริงสำเร็จทั้งหมด

สิ่งที่จะทำเพิ่ม: ยิงทดสอบ Census API ด้วยคีย์ปัจจุบัน เพื่อยืนยันว่าคีย์ใหม่ใช้ได้แล้วหรือยังถูกปฏิเสธ แล้วรายงานผล (ยังไม่แก้โค้ดปฏิทินถ้าไม่จำเป็น)
