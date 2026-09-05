/* accounts.js — "บัญชีที่เคยสมัครไว้ในเครื่องนี้" + สถานะล็อกอิน
 * สร้าง 2026-09-06 (งานข้อ 2 · หน้าล็อกอิน)
 *
 * 🔴 ต้นแบบ: ยังไม่มีระบบบัญชีจริงบนเซิร์ฟเวอร์
 *    - เก็บแค่ "อีเมล + ฝั่ง (ครู/ผู้เรียน) + ชื่อเรียก" ลง localStorage ของเครื่องคนนั้น
 *    - 🔴 ห้ามเก็บรหัสผ่าน และห้ามทำช่องรหัสผ่านที่ตรวจจริง (กฎเหล็กข้อ 1 — จะกลายเป็นคำสัญญาว่ามีระบบบัญชี)
 *    - ต่างเครื่อง/ต่างเบราว์เซอร์ = คนละชุดข้อมูล เห็นไม่ตรงกัน (งาน B ต่อฐานข้อมูลค่อยแก้ที่ read/write)
 *
 * โครงที่เก็บ:  { v:1, ts:<เวลา>, list:[ {email, role:'teacher'|'learner', name, ts} ] }
 * สถานะล็อกอิน: { v:1, ts:<เวลา>, email, role, name }
 */
(function () {
  'use strict';

  var KEY  = 'bgt_accounts_v1';
  var SKEY = 'bgt_session_v1';

  /* บัญชีตัวอย่าง — มีไว้ให้คนที่เพิ่งเปิดเว็บครั้งแรก (เช่นเพื่อน Owner บน GitHub Pages)
     กดเข้าดูได้เลยโดยไม่ต้องกรอกใบสมัครทั้งใบก่อน
     🔴 ต้องขึ้นป้ายว่าเป็น "บัญชีตัวอย่าง" เสมอ ห้ามทำเนียนเป็นบัญชีจริง */
  var DEMO = [
    { email: 'ploy@example.com',   role: 'teacher', name: 'ครูพลอย',          demo: true },
    { email: 'parent@example.com', role: 'learner', name: 'ผู้ปกครองตัวอย่าง', demo: true }
  ];

  function norm(email) { return String(email || '').trim().toLowerCase(); }

  function read() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return []; }
    if (!raw) return [];
    try {
      var o = JSON.parse(raw);
      return (o && o.v === 1 && Array.isArray(o.list)) ? o.list : [];
    } catch (e) { return []; }
  }

  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, ts: Date.now(), list: list })); return true; }
    catch (e) { return false; }   /* เบราว์เซอร์ปิดพื้นที่เก็บข้อมูล -> ต้องไม่พังทั้งหน้า */
  }

  /* บัญชีทั้งหมดที่ล็อกอินได้ = ที่สมัครไว้จริง + บัญชีตัวอย่าง (ตัวอย่างอยู่ท้ายเสมอ) */
  function all() {
    var mine = read();
    var used = {};
    mine.forEach(function (a) { used[norm(a.email)] = true; });
    return mine.concat(DEMO.filter(function (d) { return !used[norm(d.email)]; }));
  }

  function find(email) {
    var e = norm(email);
    var hit = null;
    all().forEach(function (a) { if (!hit && norm(a.email) === e) hit = a; });
    return hit;
  }

  /* เรียกตอนสมัครเสร็จ — ถ้าอีเมลซ้ำให้ทับของเดิม (สมัครใหม่ทับของเก่า ไม่ใช่เพิ่มซ้ำ) */
  function save(email, role, name) {
    var e = norm(email);
    if (!e) return false;
    var list = read().filter(function (a) { return norm(a.email) !== e; });
    list.push({ email: e, role: role === 'teacher' ? 'teacher' : 'learner', name: name || '', ts: Date.now() });
    return write(list);
  }

  function session() {
    var raw = null;
    try { raw = localStorage.getItem(SKEY); } catch (e) { return null; }
    if (!raw) return null;
    try {
      var o = JSON.parse(raw);
      return (o && o.v === 1 && o.email) ? o : null;
    } catch (e) { return null; }
  }

  function login(email) {
    var acc = find(email);
    if (!acc) return null;
    try {
      localStorage.setItem(SKEY, JSON.stringify({
        v: 1, ts: Date.now(), email: norm(acc.email), role: acc.role, name: acc.name || '', demo: !!acc.demo
      }));
    } catch (e) { /* เก็บไม่ได้ก็ยังให้เข้าหน้าถัดไปได้ */ }
    return acc;
  }

  function logout() { try { localStorage.removeItem(SKEY); } catch (e) {} }

  /* หน้าแรกของแต่ละฝั่ง — ที่เดียวที่กำหนดว่าล็อกอินแล้วไปไหน */
  function homeFor(role, prefix) {
    var p = prefix == null ? '' : prefix;
    return role === 'teacher' ? p + 'teacher/job-board.html' : p + 'student/my-jobs.html';
  }

  window.BGTAccounts = {
    all: all, find: find, save: save,
    login: login, logout: logout, session: session,
    homeFor: homeFor, normalize: norm
  };
})();
