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

  /* ── แถบบัญชี + ปุ่มออกจากระบบ (Owner สั่ง 2026-09-06) ──────────────
     หน้าฝั่งครูกับฝั่งผู้เรียนโครงแถบบนคนละแบบ (topnav / sidebar / mobile-header)
     -> ไม่ไล่แก้ทีละหน้า แต่ให้ไฟล์นี้เสียบเข้าไปเองในที่ที่มีอยู่แล้วของแต่ละหน้า
        (แก้ทีละหน้า = พลาดง่ายและ session หน้าตามไม่ทัน — บทเรียนแถบบน 4 หน้าคนละชุด 2026-09-01)
     หน้าไหนไม่อยากได้ ใส่ <body data-no-session-bar> */

  var CSS = '.bgt-acct{display:inline-flex;align-items:center;gap:8px;font-size:var(--text-sm);'
          + 'color:var(--color-ink-2);white-space:nowrap}'
          + '.bgt-acct .bgt-who{font-weight:600;color:var(--color-ink)}'
          + '.bgt-acct .bgt-out{font:inherit;font-weight:600;color:var(--color-accent-deep);background:none;'
          + 'border:0;padding:6px 4px;min-height:32px;cursor:pointer;text-decoration:underline}'
          + '.bgt-acct .bgt-out:hover{color:var(--color-ink)}'
          + '.bgt-acct a{color:var(--color-accent-deep);font-weight:600}'
          + '.sidebar .bgt-acct{display:flex;flex-wrap:wrap;margin-top:var(--space-5);'
          + 'padding-top:var(--space-4);border-top:1px solid var(--color-rule)}';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ../ กี่ชั้นถึงจะถึงรากเว็บ — หน้าในโฟลเดอร์ teacher/ กับ student/ ต้องถอยขึ้น 1 ชั้น */
  function rootPrefix() {
    var p = location.pathname.replace(/\\/g, '/');
    return /\/(teacher|student)\//.test(p) ? '../' : '';
  }

  function buildBar() {
    var box = el('div', 'bgt-acct');
    var s = session();
    var root = rootPrefix();
    if (!s) {
      var a = el('a', null, 'เข้าสู่ระบบ');
      a.href = root + 'login.html';
      box.appendChild(a);
      return box;
    }
    var who = el('span', 'bgt-who', (s.name || s.email) + (s.role === 'teacher' ? ' (ครู)' : ' (ผู้เรียน)'));
    var out = el('button', 'bgt-out', 'ออกจากระบบ');
    out.type = 'button';
    out.addEventListener('click', function () {
      logout();
      location.href = root + 'index.html';
    });
    box.appendChild(who);
    box.appendChild(out);
    return box;
  }

  function mountSessionBar() {
    if (document.body.hasAttribute('data-no-session-bar')) return;
    if (document.querySelector('.bgt-acct')) return;          /* กันเสียบซ้ำ */

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    /* เสียบเข้าไปในของที่หน้านั้นมีอยู่แล้ว — ได้หลายจุดก็เสียบหลายจุด (จอเล็กกับจอใหญ่คนละที่) */
    var spots = [
      document.querySelector('nav.topnav'),                    /* ฝั่งครู 4 หน้า */
      document.querySelector('aside.sidebar'),                 /* ฝั่งผู้เรียนที่มีเมนูข้าง */
      document.querySelector('header.mobile-header'),          /* แถบบนตอนจอแคบ */
      document.querySelector('header.topbar')                  /* กันไว้เผื่อหน้าที่ไม่มี topnav */
    ].filter(Boolean);

    if (!spots.length) return;
    spots.forEach(function (spot) {
      if (spot.querySelector('.bgt-acct')) return;
      spot.appendChild(buildBar());
    });
  }

  function boot() { mountSessionBar(); applyGate(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ── ด่าน "ต้องเข้าสู่ระบบก่อน" (Owner ทัก 2026-09-06) ──────────────
     Owner: *"ทำไมหน้านี้มีปุ่มเข้าสู่ระบบละครับ? ไม่ใช่ว่าเข้าระบบมาแล้วถึงเจอหน้า post-job.html หรอ?"*
     -> ถูกต้อง · ของเดิมไม่มีด่านอะไรเลย ทุกหน้าเปิดตรงได้หมด แถบบนเลยขึ้น "เข้าสู่ระบบ" ค้างไว้เฉย ๆ
        ซึ่งอ่านแล้วสับสน: อยู่ในหน้าที่ต้องเป็นสมาชิก แต่ยังไม่ได้เป็นสมาชิก

     วิธีใช้: ใส่ `data-require="learner"` (หรือ "teacher") ที่ <body> ของหน้านั้น — จบ
     🔴 ทำที่นี่ที่เดียว ห้ามไล่เขียนทีละหน้า (บทเรียนเดิม: แก้ทีละหน้า = พลาดง่าย session หน้าตามไม่ทัน)
     🔴 **ซ่อน ไม่ใช่ลบ** — สคริปต์ของหน้าเดิมยังเดินอยู่และยังเขียนค่าลง element พวกนั้น
        ถ้า .remove() ทิ้งจะพังแบบ "Cannot set properties of null" (เจอจริงตอนถอด sidebar 2026-08-31) */
  var GATE_CSS = '.bgt-gate{max-width:520px;margin:var(--space-16) auto;padding:var(--space-8);'
               + 'background:var(--color-surface);border:1px solid var(--color-rule);'
               + 'border-radius:var(--radius-lg);box-shadow:var(--shadow-raise);text-align:center}'
               + '.bgt-gate h2{font-family:var(--font-display);font-size:var(--text-xl);margin:0 0 var(--space-3)}'
               + '.bgt-gate p{color:var(--color-ink-2);line-height:1.6;margin:0 0 var(--space-6)}'
               + '.bgt-gate .bgt-gate-btns{display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap}'
               + '.bgt-gate .bgt-gate-note{font-size:var(--text-sm);margin:var(--space-6) 0 0}';

  var ROLE_WORD = { learner: 'ผู้เรียน / ผู้ปกครอง', teacher: 'ครูผู้สอน' };

  function buildGate(need, s) {
    var root = rootPrefix();
    var box = el('div', 'bgt-gate');
    var wrongSide = !!s;      /* ล็อกอินอยู่ แต่ผิดฝั่ง */
    box.appendChild(el('h2', null, wrongSide ? 'หน้านี้สำหรับ' + ROLE_WORD[need] : 'เข้าสู่ระบบก่อนถึงจะใช้หน้านี้ได้'));
    box.appendChild(el('p', null, wrongSide
      ? 'ตอนนี้คุณเข้าสู่ระบบเป็น' + ROLE_WORD[s.role === 'teacher' ? 'teacher' : 'learner'] + ' — สลับบัญชีก่อนถึงจะเข้าหน้านี้ได้'
      : 'หน้านี้เป็นของบัญชี' + ROLE_WORD[need] + ' ระบบต้องรู้ว่าคุณเป็นใครก่อน ถึงจะบันทึกให้ถูกบัญชี'));

    var btns = el('div', 'bgt-gate-btns');
    var login = el('a', 'btn btn-primary', wrongSide ? 'สลับบัญชี' : 'เข้าสู่ระบบ');
    login.href = root + 'login.html';
    btns.appendChild(login);
    if (!wrongSide) {
      var signup = el('a', 'btn btn-secondary', 'ยังไม่มีบัญชี — สมัคร');
      signup.href = root + (need === 'teacher' ? 'teacher/signup-teacher.html' : 'student/signup-parent.html');
      btns.appendChild(signup);
    }
    box.appendChild(btns);
    box.appendChild(el('p', 'bgt-gate-note', 'ต้นแบบนี้มีบัญชีตัวอย่างให้กดเข้าได้เลยที่หน้าเข้าสู่ระบบ ไม่ต้องกรอกใบสมัครทั้งใบก่อน'));
    return box;
  }

  function applyGate() {
    var need = document.body.getAttribute('data-require');
    if (need !== 'learner' && need !== 'teacher') return;
    var s = session();
    if (s && s.role === need) return;                 /* ผ่านด่าน */

    var style = document.createElement('style');
    style.textContent = GATE_CSS;
    document.head.appendChild(style);

    /* ซ่อนเนื้อหาของหน้า แล้ววางการ์ดด่านแทน — ที่ที่หน้านี้ใช้วางเนื้อหาจริง */
    var host = document.querySelector('.content-col') || document.querySelector('main') || document.body;
    [].forEach.call(host.children, function (c) { c.style.display = 'none'; });
    host.appendChild(buildGate(need, s));
  }

  window.BGTAccounts = {
    all: all, find: find, save: save,
    login: login, logout: logout, session: session,
    homeFor: homeFor, normalize: norm, applyGate: applyGate,
    mountSessionBar: mountSessionBar
  };
})();
