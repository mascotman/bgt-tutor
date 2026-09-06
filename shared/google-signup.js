/* google-signup.js — โฟลว์ "สมัครด้วย Google" ฝั่งหน้าจอ
 * สร้าง 2026-09-06 · Owner เคาะ: เอา Google อย่างเดียว ตัด Apple ทิ้ง
 *
 * 🔴 คำตอบของคำถาม Owner: "ต้องมีอีก workflow นึงไหม หรือไม่ควรมีเลย"
 *    -> ไม่ต้องมีใบสมัครใบที่สอง · Google แทนได้แค่ 2 อย่างเท่านั้น:
 *         1) ช่องกรอกอีเมล      2) ขั้นยืนยันรหัส 6 หลัก (Google ยืนยันอีเมลมาให้แล้ว)
 *       ส่วนที่เหลือ (ชื่อเล่น อายุ ระดับชั้น วิชา ราคา ตารางว่าง ฯลฯ) Google ไม่รู้ ยังไงก็ต้องกรอกเหมือนเดิม
 *    -> เพราะงั้น "ขั้นยืนยันอีเมล" มี 2 หน้าตาในใบสมัครใบเดียวกัน:
 *         ปกติ      = กรอกอีเมล -> ส่งรหัส -> กรอกรหัส 6 หลัก
 *         มาจาก Google = แถบเขียว "ยืนยันแล้วด้วยบัญชี Google" อ่านอย่างเดียว ไม่มีรหัสให้กรอก
 *
 * 🔴 ตอนนี้ยังไม่ได้ต่อ Google จริง (ต้องมีระบบหลังบ้าน = งาน B)
 *    หน้านี้เข้าโหมดนั้นได้ทาง ?via=google เพื่อ "ดูโฟลว์" เท่านั้น และต้องมีป้ายบอกเสมอว่าเป็นตัวอย่าง
 *    ห้ามเอาป้ายออกจนกว่าจะต่อของจริง (กฎเหล็กข้อ 1)
 */
(function () {
  'use strict';

  var q = new URLSearchParams(location.search);
  if (q.get('via') !== 'google') return;

  var demoEmail = q.get('email') || 'you@gmail.com';
  var demoName  = q.get('name')  || '';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    /* ช่องอีเมลของหน้านี้ชื่อไม่เหมือนกันทุกหน้า -> หาเอาจากช่องที่มีจริง */
    var mail = document.getElementById('email')      /* หน้าครู */
            || document.getElementById('s-email')    /* หน้านักเรียน */
            || document.getElementById('p-email');   /* หน้าผู้ปกครอง */
    if (!mail) return;

    mail.value = demoEmail;
    mail.readOnly = true;

    /* ธงยืนยันอีเมลของแต่ละหน้า — ใส่ให้ครบทั้ง 2 ชื่อ หน้าไหนใช้ตัวไหนก็ผ่าน */
    document.body.dataset.emailVerified = '1';
    document.body.dataset.otpVerified = '1';

    /* ซ่อนของที่ไม่ต้องใช้แล้ว: ปุ่มส่งรหัส + กล่องกรอกรหัส + กล่องอธิบายว่าทำไมต้องมีรหัส */
    ['send-otp', 'otp-box', 'otp-field', 'otp-ok'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.hidden = true; el.style.display = 'none'; }
    });
    var otpInput = document.getElementById('otp');
    if (otpInput) {
      var row = otpInput.closest('.otp-row') || otpInput.closest('.field');
      if (row) row.style.display = 'none';
    }
    var whyBox = document.querySelector('.badge-note .badge-icon');
    if (whyBox && /รหัส 6 หลัก/.test(whyBox.parentElement.textContent)) {
      whyBox.parentElement.style.display = 'none';
    }

    /* กล่องปุ่ม "สมัครด้วย Google" ไม่ต้องโชว์แล้ว เพราะเข้ามาทางนั้นอยู่ */
    var socialBox = document.querySelector('.social-signup');
    if (socialBox) socialBox.style.display = 'none';

    /* แถบเขียว "ยืนยันแล้วด้วย Google" วางแทนที่ช่องรหัส */
    var badge = document.createElement('div');
    badge.className = 'gs-ok';
    badge.innerHTML =
      '<span class="gs-ok-ic" aria-hidden="true">✓</span>' +
      '<span><b>ยืนยันอีเมลแล้วด้วยบัญชี Google</b><br>' +
      '<span class="gs-mail"></span> — ไม่ต้องกรอกรหัส 6 หลัก</span>';
    badge.querySelector('.gs-mail').textContent = demoEmail;
    mail.parentElement.appendChild(badge);

    /* เติมชื่อให้ถ้า Google ส่งมา (ของจริงจะได้ชื่อมาจากโปรไฟล์ Google) */
    if (demoName) {
      var nick = document.getElementById('nickname') || document.getElementById('s-nick');
      if (nick && !nick.value) nick.value = demoName;
      var first = document.getElementById('firstname') || document.getElementById('s-first')
               || document.getElementById('p-first');
      if (first && !first.value) first.value = demoName;
    }

    /* 🔴 ป้ายบอกว่านี่เป็นแค่ตัวอย่างโฟลว์ ยังไม่ได้ต่อ Google จริง */
    var ribbon = document.createElement('div');
    ribbon.className = 'gs-demo';
    ribbon.textContent = 'โหมดดูตัวอย่าง: สมมติว่าเข้าด้วยบัญชี Google มาแล้ว — ยังไม่ได้ต่อ Google จริง (งาน B)';
    document.body.insertBefore(ribbon, document.body.firstChild);

    var css = document.createElement('style');
    css.textContent =
      '.gs-ok{display:flex;gap:10px;align-items:flex-start;margin-top:12px;padding:12px 14px;' +
      'background:var(--color-ok-soft);border-radius:var(--radius-md);font-size:var(--text-sm);' +
      'line-height:1.6;color:var(--color-ink)}' +
      '.gs-ok-ic{width:24px;height:24px;flex-shrink:0;border-radius:50%;background:var(--color-ok);' +
      'color:var(--color-surface);display:grid;place-items:center;font-weight:700}' +
      '.gs-mail{font-weight:600}' +
      '.gs-demo{background:var(--color-level-soft);color:var(--color-level);text-align:center;' +
      'font-size:var(--text-sm);font-weight:600;padding:10px 16px}';
    document.head.appendChild(css);
  });
})();
