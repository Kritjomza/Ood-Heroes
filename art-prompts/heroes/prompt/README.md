# ChatGPT Hero Prompt Workflow

โฟลเดอร์นี้มี prompt สำหรับสร้างภาพฮีโร่ 6 ตัว รวม 48 ภาพ แยกหนึ่ง prompt ต่อหนึ่งไฟล์

## วิธีใช้

1. เลือกฮีโร่หนึ่งตัวและเริ่มจาก `master_hero_<slug>.md`.
2. นำข้อความในหัวข้อ **Copy-Ready Prompt** ไปวางใน ChatGPT เพื่อสร้าง Master Reference.
3. ตรวจและอนุมัติ Master จากนั้นเก็บไฟล์เป็น `master_hero_<slug>.webp`.
4. เมื่อสร้างภาพอื่นของฮีโร่ตัวเดิม ให้แนบ Master ที่อนุมัติกับข้อความทุกครั้ง.
5. เปิดไฟล์ variant ที่ต้องการ แล้ววาง **Copy-Ready Prompt** ในคำขอเดียวกับภาพ Master.
6. ตรวจผลด้วย **Review Checklist** ก่อนสร้างภาพถัดไป.

หากไม่ได้แนบ Master ห้ามให้โมเดลเดาหรือออกแบบตัวละครใหม่ เพราะจะทำให้หน้าตา สี รูปร่าง และอุปกรณ์เปลี่ยนไป

## ภาพต่อฮีโร่

- `master_hero_<slug>.md` — สร้างต้นแบบอ้างอิง
- `hero_<slug>_portrait.md` — Portrait 512 × 512
- `hero_<slug>_icon.md` — Icon 128 × 128
- `hero_<slug>_collection_card.md` — Collection art 640 × 800
- `hero_<slug>_idle_a.md` — Gameplay frame 0
- `hero_<slug>_idle_b.md` — Gameplay frame 1
- `hero_<slug>_move_left_a.md` — Gameplay frame 2
- `hero_<slug>_move_left_b.md` — Gameplay frame 3

Gameplay source ทั้งสี่เป็นภาพ 96 × 96 พื้นหลังโปร่งใส หลังผ่านการตรวจจึงนำไปประกอบด้วยโปรแกรมตามลำดับ `idle_a, idle_b, move_left_a, move_left_b`. ห้ามสั่ง ChatGPT สร้าง atlas โดยตรง รูปเดินขวาใช้ runtime mirror จากรูปเดินซ้าย

ไฟล์ในโฟลเดอร์นี้เป็น intake prompt เท่านั้น ไม่เปลี่ยน Asset ID หรือ production path ใน manifest
