/* learner-data.js — ข้อมูล "ผู้เรียนในบัญชีที่ล็อกอินอยู่" ที่หน้าอื่นต้องอ่านร่วมกัน
 * สร้าง 2026-09-06 · Owner สั่ง: "นักเรียนอายุเท่านี้ ระดับชั้นนี้ แล้วมีอีกตัวเลือกนึงของอีกหน้า
 *                                ที่ให้เลือกระดับชั้น ก็ควรจะล็อก User นั้นตามที่กรอกไปเลย
 *                                เพื่อที่จะง่ายต่อการค้นหา"
 *
 * 🔴 ทำไมต้องมีไฟล์นี้: ค่าที่ผู้เรียนกรอกตอนสมัคร (ระดับชั้น · อายุ · หลักสูตร · วิชา · งบ · รูปแบบ · จังหวัด)
 *    เคยเดินทางด้วย sessionStorage['bgt_learners'] อย่างเดียว = แยกต่อแท็บ + หมดอายุ 2 ชม.
 *    เปิดแท็บใหม่ทีก็ต้องพิมพ์ใหม่ทั้งชุด · post-job.html ยังอ่านไปแค่ 4 ฟิลด์ (id/nick/grade/age)
 *    ที่เหลือ (วิชา/งบ/รูปแบบ/เวลา/เป้าหมาย) ตกหล่นหมด ผู้เรียนเลยต้องกรอกซ้ำ
 *    → ฝั่งครูแก้ปัญหานี้ไปแล้วด้วย shared/teacher-data.js · ไฟล์นี้คือคู่ของมันฝั่งผู้เรียน
 *
 * 🔴 เก็บลง localStorage = ค่าอยู่ข้ามแท็บ/ข้ามวัน เหมือน "ข้อมูลติดบัญชี" จริง ๆ
 *    ยังไม่ใช่บัญชีบนเซิร์ฟเวอร์ — งาน B (ต่อฐานข้อมูล) ค่อยเปลี่ยน read/write 2 ตัวนี้ให้ยิง API
 *    โดยหน้าเว็บไม่ต้องแก้สักบรรทัด (สัญญาเดียวกับ teacher-data.js)
 *
 * 🔴 กติกาความเป็นส่วนตัวที่ยังต้องถืออยู่ (LEGAL ข้อ 1 · กติกาถาวรข้อ 5):
 *    - ห้ามใส่ชื่อ-นามสกุลจริง · เบอร์ · ที่อยู่/ย่าน (zone_detail) ลงก้อนนี้ — เก็บได้แค่ชื่อเล่น + เงื่อนไขการเรียน
 *    - ผูกกับอีเมลของบัญชี: ถ้าเครื่องนี้ล็อกอินเป็นคนอื่นอยู่ จะอ่านไม่เห็นของบัญชีเดิม
 *    - หมดอายุ 90 วัน (ของเดิม 2 ชม. สั้นไปจนใช้งานจริงไม่ได้ · Owner สั่งให้ค่าติดบัญชี)
 */
(function () {
  'use strict';

  var KEY     = 'bgt_learner_v1';
  var OLD_KEY = 'bgt_learners';                  /* ก้อน sessionStorage เดิม — ใช้ย้ายของเก่าเข้ามาเท่านั้น */
  var MAX_AGE = 90 * 24 * 60 * 60 * 1000;        /* 90 วัน */
  var OLD_MAX_AGE = 2 * 60 * 60 * 1000;          /* ก้อนเดิมยังคิดอายุ 2 ชม. เท่าเดิม */

  var MODE_CODES = ['online', 'home', 'public'];               /* 🔴 รหัสล็อกทั้งเว็บ ห้ามเปลี่ยน */
  var SLOT_CODES = ['morning', 'afternoon', 'evening', 'night'];
  var GOAL_CODES = ['catch_up', 'exam_prep', 'contest', 'enrich'];

  function str(v, max) { return String(v == null ? '' : v).slice(0, max || 80); }
  function num(v, lo, hi) {
    var n = parseInt(v, 10);
    return (isNaN(n) || n < lo || n > hi) ? null : n;
  }
  function pickList(arr, allowed) {
    if (!Array.isArray(arr)) return [];
    var out = [];
    arr.forEach(function (v) {
      var s = String(v == null ? '' : v);
      if (allowed && allowed.indexOf(s) === -1) return;
      if (out.indexOf(s) === -1) out.push(s);
    });
    return out.slice(0, 20);
  }

  /* รูปร่างมาตรฐานของ "ผู้เรียน 1 คน" — ทุกหน้าที่อ่านไฟล์นี้ได้ชุดคีย์เดียวกันเสมอ
     (ต้นฉบับของฟิลด์: signup-parent.html ค้น learnerCriteria) */
  function normLearner(L) {
    if (!L || typeof L.id !== 'string' || !L.id || !L.nick) return null;
    return {
      id:         str(L.id, 20),
      nick:       str(L.nick, 40),
      grade:      str(L.grade, 40),          /* รายชั้น เช่น "ม.2" — ฝั่งรับแปลงเป็นช่วงชั้นเอง */
      age:        num(L.age, 1, 120),
      curriculum: str(L.curriculum, 60),
      goal:       GOAL_CODES.indexOf(L.goal) > -1 ? L.goal : '',
      subj:       pickList(L.subj),
      time:       pickList(L.time, SLOT_CODES),
      mode:       pickList(L.mode, MODE_CODES),
      budget:     num(L.budget, 1, 20000),
      sesLen:     num(L.sesLen, 30, 480)
    };
  }

  function empty() { return { prov: '', email: '', activeId: '', learners: [] }; }

  function sessionEmail() {
    try {
      var s = window.BGTAccounts && BGTAccounts.session();
      return s && s.role === 'learner' ? String(s.email || '') : '';
    } catch (e) { return ''; }
  }

  /* ── ย้ายของเก่าจาก sessionStorage['bgt_learners'] เข้ามา ─────────────
     หน้าที่ยังไม่ได้แก้ (หรือแท็บที่เปิดค้างจากรอบก่อน) จะได้ไม่สะดุด
     🔴 อ่านครั้งเดียวแล้วเขียนลง localStorage เลย — ไม่ลบของเดิมทิ้ง เพราะแท็บอื่นอาจกำลังใช้อยู่ */
  function importOld() {
    var raw = null;
    try { raw = sessionStorage.getItem(OLD_KEY); } catch (e) { return null; }
    if (!raw) return null;
    var o = null;
    try { o = JSON.parse(raw); } catch (e) { return null; }
    if (!o || o.v !== 1 || !Array.isArray(o.learners) || !o.learners.length) return null;
    if (!o.ts || (Date.now() - o.ts) > OLD_MAX_AGE) return null;
    var list = o.learners.map(normLearner).filter(Boolean);
    if (!list.length) return null;
    var d = empty();
    d.prov = str(o.prov, 40);
    d.email = sessionEmail();
    d.learners = list;
    d.activeId = list[0].id;
    write(d);
    return d;
  }

  function read() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return empty(); }
    if (!raw) return importOld() || empty();
    var o = null;
    try { o = JSON.parse(raw); } catch (e) { return empty(); }
    if (!o || o.v !== 1 || !o.data || !o.ts || (Date.now() - o.ts) > MAX_AGE) return empty();

    /* 🔴 เครื่องเดียวกันแต่ล็อกอินคนละบัญชี = ห้ามเห็นชื่อเล่น/ชั้นเรียนของลูกบ้านอื่น
       (ก้อนที่ยังไม่ผูกอีเมล — สมัครเสร็จแต่ยังไม่ได้ล็อกอิน — ปล่อยผ่าน) */
    var now = sessionEmail();
    if (now && o.data.email && o.data.email !== now) return empty();

    var d = empty();
    d.prov     = str(o.data.prov, 40);
    d.email    = str(o.data.email, 120);
    d.learners = (Array.isArray(o.data.learners) ? o.data.learners : []).map(normLearner).filter(Boolean);
    d.activeId = str(o.data.activeId, 20);
    if (!byIdIn(d.learners, d.activeId)) d.activeId = d.learners.length ? d.learners[0].id : '';
    return d;
  }

  function write(data) {
    var d = empty();
    d.prov     = str((data || {}).prov, 40);
    d.email    = str((data || {}).email, 120) || sessionEmail();
    d.learners = (Array.isArray((data || {}).learners) ? data.learners : []).map(normLearner).filter(Boolean);
    d.activeId = str((data || {}).activeId, 20);
    if (!byIdIn(d.learners, d.activeId)) d.activeId = d.learners.length ? d.learners[0].id : '';
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, ts: Date.now(), data: d })); return true; }
    catch (e) { return false; }   /* เบราว์เซอร์ปิดพื้นที่เก็บข้อมูล -> ต้องไม่พังทั้งหน้า */
  }

  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }

  /* ── ตัวช่วยที่หน้าอื่นเรียกใช้บ่อย ── */
  function byIdIn(list, id) {
    if (!id) return null;
    var hit = null;
    (list || []).forEach(function (L) { if (!hit && L.id === id) hit = L; });
    return hit;
  }

  function list()      { return read().learners; }
  function prov()      { return read().prov; }
  function byId(id)    { return byIdIn(read().learners, id); }
  function has()       { return read().learners.length > 0; }

  /* ผู้เรียนที่ "กำลังเปิดอยู่" — ผู้ปกครองที่มีลูกหลายคนสลับได้ ระดับชั้นล็อกตามลูกคนที่เลือก */
  function active() {
    var d = read();
    return byIdIn(d.learners, d.activeId) || (d.learners.length ? d.learners[0] : null);
  }
  function setActive(id) {
    var d = read();
    if (!byIdIn(d.learners, id)) return false;
    d.activeId = id;
    return write(d);
  }

  /* เรียกจากหน้าสมัคร (ผู้เรียน/ผู้ปกครอง) ตอนกดส่งใบสมัคร — จุดเดียวกับที่เรียก BGTAccounts.save() */
  function save(provName, learners, email) {
    var arr = (learners || []).map(normLearner).filter(Boolean);
    if (!arr.length) return false;
    return write({ prov: provName, learners: arr, activeId: arr[0].id, email: email || sessionEmail() });
  }

  window.BGT_LEARNER = {
    KEY: KEY, MODE_CODES: MODE_CODES, SLOT_CODES: SLOT_CODES, GOAL_CODES: GOAL_CODES,
    read: read, write: write, reset: reset, save: save,
    list: list, prov: prov, byId: byId, has: has,
    active: active, setActive: setActive
  };
})();
