/* teacher-data.js — ข้อมูลของ "ครูที่ล็อกอินอยู่" ที่หน้าอื่นต้องอ่านร่วมกัน
 * สร้าง 2026-09-04 · Owner สั่ง: "อันนี้เข้าใจได้ว่ายังไม่ได้ลิ้งค์ข้อมูล ทำได้เลยครับ
 *                                เอาให้ใช้งานได้จริง ๆ มันจะ deadline แล้ว"
 *
 * 🔴 ทำไมต้องมีไฟล์นี้: วิชา / ระดับชั้น / รูปแบบ / ตารางว่าง / ราคา / โปรไฟล์
 *    เคยประกาศอยู่ใน teacher-settings.html ไฟล์เดียว หน้าอื่นเลยอ่านไม่ได้
 *    (หน้าแดชบอร์ดอยากโชว์ "วิชาที่เปิดสอน" กับ "ชั่วโมงว่างต่อสัปดาห์" ก็ดึงไม่ได้)
 *
 * 🔴 เก็บลง localStorage = กดบันทึกแล้วอยู่จริง ไม่หายตอนรีเฟรช
 *    ยังไม่ใช่บัญชีจริงบนเซิร์ฟเวอร์ — งาน B (ต่อฐานข้อมูล) ค่อยเปลี่ยน read/write 2 ตัวนี้
 *    ให้ยิง API แทน โดยหน้าเว็บไม่ต้องแก้สักบรรทัด
 */
(function () {
  'use strict';

  var KEY = 'bgt_teacher_v1';

  /* ค่าตั้งต้นของ "ครูพลอย" — ใช้ตอนยังไม่เคยบันทึกอะไรเลย */
  var DEFAULTS = {
    profile: {
      nick: 'ครูพลอย',
      first: 'สมหญิง',
      last: 'ใจดี',
      birth: '1999-04-12',
      gender: 'female',
      expYears: 6,
      intro: 'สอนคณิตศาสตร์และฟิสิกส์ให้เด็กที่ “ไม่ชอบเลข” มา 6 ปี เริ่มจากรื้อพื้นฐานที่หายไปก่อนเสมอ ไม่เร่งตามหลักสูตร',
      phone: '081-234-5678',
      /* 🔴 Owner เคาะ 2026-09-04: OTP เบอร์ย้ายออกจากหน้าสมัคร มาอยู่ที่ teacher-settings แทน
         phoneVerified = ยืนยันเบอร์ด้วย OTP แล้วหรือยัง (คนละเรื่องกับ verified = ทีมงานตรวจเอกสารผ่าน) */
      phoneVerified: true,
      verified: true,
      verifiedAt: '2026-08-12',
      works: ['สมุดงาน น้องภูมิ', 'บรรยากาศคาบติวสอบเข้า', 'ชีทสรุปฟิสิกส์ ม.5']
    },
    subjects: [
      { name: 'คณิตศาสตร์', on: true },
      { name: 'ฟิสิกส์',    on: true },
      { name: 'เคมี',       on: false },
      { name: 'ชีววิทยา',   on: false },
      { name: 'ติวสอบเข้า ม.4', on: false }
    ],
    /* 🔴 ป้ายไทยเปลี่ยนได้ แต่ลำดับต้องตรงกับลิสต์กลางของหน้าสมัคร */
    grades: [
      ['อนุบาล', false], ['ประถมต้น', false], ['ประถมปลาย', false],
      ['มัธยมต้น', true], ['มัธยมปลาย/ปวช.', true], ['มหาวิทยาลัย', false], ['ผู้ใหญ่ทั่วไป', false]
    ],
    /* 🔴 รหัสล็อกทั้งเว็บ: online / home / public — ห้ามเปลี่ยน value */
    modes: [['online', 'ออนไลน์', true], ['home', 'ที่บ้าน', true], ['public', 'สถานที่อื่นๆ', false]],
    avail: {
      mon: { on: true,  a: 1020, b: 1200 },
      tue: { on: false, a: 1020, b: 1200 },
      wed: { on: true,  a: 1080, b: 1260 },
      thu: { on: false, a: 1020, b: 1200 },
      fri: { on: false, a: 1020, b: 1200 },
      sat: { on: false, a: 540,  b: 720 },
      sun: { on: false, a: 540,  b: 720 }
    },
    prices: [
      { level: 'มัธยมต้น', mode: 'ออนไลน์', amount: 380 },
      { level: 'มัธยมปลาย/ปวช.', mode: 'ที่บ้าน', amount: 450 }
    ]
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function read() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return clone(DEFAULTS); }
    if (!raw) return clone(DEFAULTS);
    var o = null;
    try { o = JSON.parse(raw); } catch (e) { return clone(DEFAULTS); }
    if (!o || o.v !== 1 || !o.data) return clone(DEFAULTS);
    /* เติมคีย์ที่ยังไม่มี (เผื่อเพิ่มฟิลด์ใหม่ทีหลัง ของเก่าจะได้ไม่พัง) */
    var d = clone(DEFAULTS), got = o.data;
    Object.keys(d).forEach(function (k) { if (got[k] != null) d[k] = got[k]; });
    if (got.profile) Object.keys(DEFAULTS.profile).forEach(function (k) {
      if (got.profile[k] != null) d.profile[k] = got.profile[k];
    });
    return d;
  }

  function write(data) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, ts: Date.now(), data: data })); return true; }
    catch (e) { return false; }
  }

  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }

  /* ── ตัวช่วยที่หน้าอื่นเรียกใช้บ่อย ── */
  function openSubjects(d) {
    return (d || read()).subjects.filter(function (s) { return s.on; }).map(function (s) { return s.name; });
  }
  function openGrades(d) {
    return (d || read()).grades.filter(function (g) { return g[1]; }).map(function (g) { return g[0]; });
  }
  function openModes(d) {
    return (d || read()).modes.filter(function (m) { return m[2]; }).map(function (m) { return m[1]; });
  }
  /* ชั่วโมงว่างต่อสัปดาห์ = ผลรวมช่วงที่เปิดไว้ */
  function weeklyHours(d) {
    var av = (d || read()).avail, sum = 0;
    Object.keys(av).forEach(function (k) { if (av[k].on) sum += (av[k].b - av[k].a) / 60; });
    return Math.round(sum * 10) / 10;
  }
  function openDays(d) {
    var av = (d || read()).avail, n = 0;
    Object.keys(av).forEach(function (k) { if (av[k].on) n++; });
    return n;
  }
  /* ช่วงราคาที่ตั้งไว้ */
  function priceRange(d) {
    var p = (d || read()).prices.filter(function (x) { return Number(x.amount) > 0; });
    if (!p.length) return null;
    var nums = p.map(function (x) { return Number(x.amount); });
    return { min: Math.min.apply(null, nums), max: Math.max.apply(null, nums), n: p.length };
  }
  /* อายุคำนวณจากวันเกิดเสมอ — ห้ามเก็บเป็นตัวเลข ไม่งั้นปีหน้าค้างเท่าเดิม */
  function age(d) {
    var iso = (d || read()).profile.birth;
    if (!iso) return null;
    var b = new Date(iso + 'T00:00:00');
    if (isNaN(b.getTime())) return null;
    var t = new Date(), a = t.getFullYear() - b.getFullYear(), m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a >= 0 && a < 120 ? a : null;
  }

  window.BGT_TEACHER = {
    KEY: KEY, DEFAULTS: DEFAULTS,
    read: read, write: write, reset: reset,
    openSubjects: openSubjects, openGrades: openGrades, openModes: openModes,
    weeklyHours: weeklyHours, openDays: openDays, priceRange: priceRange, age: age
  };
})();
