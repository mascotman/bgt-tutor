/* lessons-seed.js — ข้อมูลคาบตัวอย่าง + ค่าคงที่เรื่องเงิน (สร้าง 2026-09-01 · ก้อน 4)
 * ที่มา: ยกออกจาก teacher/teacher-jobs.html ตอนแยกหน้า "ยอดเงิน" ออกมาตามจอ ④
 * 🔴 ทำไมต้องอยู่ไฟล์เดียว: teacher-jobs กับ teacher-earnings ต้องคิดเงินจากตัวเลขชุดเดียวกัน
 *    ถ้าปล่อยให้แต่ละหน้าถือ SEED/CONFIG ของตัวเอง วันหนึ่งราคาหรือค่าแพลตฟอร์มจะเพี้ยนกันเงียบ ๆ
 * 🔴 งาน B (ต่อฐานข้อมูลจริง): ลบไฟล์นี้ทิ้ง แล้วให้ทั้ง 2 หน้าอ่านจากเซิร์ฟเวอร์แทน
 */
window.BGT_LESSON_CONFIG = {
    confirmWindowH: 48,      /* ผู้เรียนมีเวลายืนยันกี่ชั่วโมง — Owner เคาะ 2026-08-24 (LOG 150) */
    earlyStartMin: 15,       /* ครูกดเริ่มคาบได้เร็วสุดกี่นาทีก่อนเวลาเรียน */
    feeSingle: 0.30,         /* ค่าแพลตฟอร์ม รายครั้ง (MODEL ข้อ 0) */
    feePackage: 0.20,        /* ค่าแพลตฟอร์ม แพ็กเกจ — เก็บแยกไว้ตั้งแต่แรก (MODEL ข้อ 7.2) */
    /* 🔴 รอบโอนจริง + ใครออกค่าโอน = ยังไม่ผ่าน Owner (MODEL ข้อ 8.4 · SYSTEM ข้อ 5)
       ห้ามเขียนวันโอนบนจอเป็นคำสัญญาจนกว่าจะเคาะ (กฎเหล็กข้อ 1 · ผลตรวจ logic 2026-08-24 ข้อ 9) */
    payoutRoundTh: 'รอบโอนถัดไป'
  };
window.BGT_LESSON_SEED = [
    { id: 'L-3081a', jobId: 'BGT-2081', learner: 'น้องภูมิ', learnerId: 'k1',
      subject: 'ฟิสิกส์', mode: 'online', offsetMin: -20, len: 120, price: 560, status: 'confirmed' },
    { id: 'L-2058a', jobId: 'BGT-2058', learner: 'น้องข้าวปุ้น', learnerId: 'x7',
      subject: 'คณิตศาสตร์', mode: 'home', offsetMin: 240, len: 90, price: 420, status: 'confirmed' },
    { id: 'L-3081b', jobId: 'BGT-2081', learner: 'น้องภูมิ', learnerId: 'k1',
      subject: 'ฟิสิกส์', mode: 'online', offsetMin: 2 * 1440, len: 120, price: 560, status: 'confirmed' },
    { id: 'L-3081c', jobId: 'BGT-2081', learner: 'น้องภูมิ', learnerId: 'k1',
      subject: 'ฟิสิกส์', mode: 'online', offsetMin: -26 * 60, len: 120, price: 560, status: 'taught',
      taughtAgoH: 25 },
    { id: 'L-3081d', jobId: 'BGT-2081', learner: 'น้องภูมิ', learnerId: 'k1',
      subject: 'ฟิสิกส์', mode: 'online', offsetMin: -8 * 1440, len: 120, price: 560, status: 'completed',
      confirmedBy: 'learner' }
  ];