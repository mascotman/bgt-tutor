/* google-signup.js — "สมัครด้วย Google" บนหน้าสมัคร 3 หน้า
 * สร้าง 2026-09-06 (หน้าจอตัวอย่าง) · 🔴 เปลี่ยนเป็นของจริง 2026-09-14 (ก้อน H · ต่อ Supabase)
 *
 * Owner เคาะ 2026-09-14: "บังคับล็อคอินผ่าน google"
 *
 * 🔴 Google แทนได้แค่ 2 อย่างในใบสมัคร: ① ช่องอีเมล  ② ขั้นยืนยันรหัส 6 หลัก
 *    ที่เหลือ (ชื่อเล่น อายุ ระดับชั้น วิชา ราคา ตารางว่าง ฯลฯ) Google ไม่รู้ ต้องกรอกในใบเดิม — ไม่มีใบสมัครใบที่สอง
 *
 * ทำอะไร
 *   1. เปิดปุ่ม "สมัครด้วย Google" เฉพาะเมื่อโหลดตัวต่อหลังบ้าน (shared/auth.js) ได้จริง — ไม่งั้นปิดค้างตามที่เขียนใน HTML
 *   2. กดปุ่ม → ไปเลือกบัญชี Google → เด้งกลับมาหน้าเดิมพร้อม ?via=google
 *   3. กลับมาแล้วล็อกอินอยู่จริง → ล็อกช่องอีเมลเป็น Gmail จริง + แถบเขียว "ยืนยันแล้วด้วย Google" + ข้ามขั้นรหัส 6 หลัก
 *      กดส่งใบสมัคร → accounts.js ลงทะเบียนฝั่งที่ฐานข้อมูลให้เอง (ค้น registerInCloud)
 *   4. มี ?via=google แต่ไม่ได้ล็อกอินอยู่ → บอกตรง ๆ ว่ายังไม่ได้เข้าสู่ระบบด้วย Google (ห้ามแกล้งทำเป็นยืนยันแล้ว)
 */
(function () {
  'use strict';

  var q = new URLSearchParams(location.search);

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function css() {
    if (document.getElementById('gs-css')) return;
    var el = document.createElement('style');
    el.id = 'gs-css';
    el.textContent =
      '.gs-ok{display:flex;gap:10px;align-items:flex-start;margin-top:12px;padding:12px 14px;' +
      'background:var(--color-ok-soft);border-radius:var(--radius-md);font-size:var(--text-sm);' +
      'line-height:1.6;color:var(--color-ink)}' +
      '.gs-ok-ic{width:24px;height:24px;flex-shrink:0;border-radius:50%;background:var(--color-ok);' +
      'color:var(--color-surface);display:grid;place-items:center;font-weight:700}' +
      '.gs-mail{font-weight:600}' +
      '.gs-note{background:var(--color-level-soft);color:var(--color-level);text-align:center;' +
      'font-size:var(--text-sm);font-weight:600;padding:10px 16px}' +
      '.gs-err{color:var(--color-error);font-weight:600}';
    document.head.appendChild(el);
  }

  /* ช่องอีเมลของแต่ละหน้าชื่อไม่เหมือนกัน → หาจากช่องที่มีจริง */
  function mailInput() {
    return document.getElementById('email')        /* หน้าครู */
        || document.getElementById('s-email')      /* หน้านักเรียน */
        || document.getElementById('p-email');     /* หน้าผู้ปกครอง */
  }

  function enableButtons(auth) {
    var btns = document.querySelectorAll('.social-signup .btn-social');
    if (!btns.length) return;
    var why = document.querySelector('.social-signup .social-why');
    [].forEach.call(btns, function (b) {
      b.disabled = false;
      var soon = b.querySelector('.soon');
      if (soon) soon.parentNode.removeChild(soon);
      b.addEventListener('click', function () {
        b.disabled = true;
        auth.signInWithGoogle(location.origin + location.pathname + '?via=google').catch(function (err) {
          b.disabled = false;
          if (why) { why.textContent = auth.explain(err); why.classList.add('gs-err'); }
        });
      });
    });
    if (why) {
      why.innerHTML = 'กดแล้วเลือกบัญชี Google — <b>ไม่ต้องกรอกอีเมลและรหัส 6 หลัก</b> · '
                    + 'ส่วนที่เหลือ (ชื่อเล่น ระดับชั้น ฯลฯ) ยังกรอกในใบนี้เหมือนเดิม';
    }
  }

  /* เข้ามาด้วย Google จริงแล้ว → แทนขั้นอีเมล + รหัส 6 หลัก ด้วยแถบเขียว */
  function applyVerified(email, name) {
    var mail = mailInput();
    if (!mail) return;
    mail.value = email;
    mail.readOnly = true;

    /* ธงยืนยันอีเมลของแต่ละหน้า — ใส่ครบทั้ง 2 ชื่อ หน้าไหนใช้ตัวไหนก็ผ่าน */
    document.body.dataset.emailVerified = '1';
    document.body.dataset.otpVerified = '1';

    ['send-otp', 'otp-box', 'otp-field', 'otp-ok'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.hidden = true; el.style.display = 'none'; }
    });
    var otpInput = document.getElementById('otp');
    if (otpInput) {
      var row = otpInput.closest('.otp-row') || otpInput.closest('.field');
      if (row) row.style.display = 'none';
    }
    /* กล่อง "ทำไมต้องมีรหัส 6 หลัก?" — ซ่อน "ทุกกล่อง" ที่พูดถึงรหัส
       🔴 2026-09-14 เดิมหาแค่กล่องแรกของหน้า → หน้านักเรียนกล่องนี้ยังโผล่ใต้แถบเขียว (Owner เห็นบนเว็บจริง) */
    [].forEach.call(document.querySelectorAll('.badge-note'), function (box) {
      if (/รหัส 6 หลัก/.test(box.textContent)) box.style.display = 'none';
    });

    var socialBox = document.querySelector('.social-signup');
    if (socialBox) socialBox.style.display = 'none';

    /* การ์ด "ใครเป็นคนสมัคร?" — เลือกฝั่งมาแล้วจากหน้าล็อกอิน ไม่ต้องถามซ้ำ
       Owner ทัก 2026-09-14: "คุณถามมาตั้งแต่แรกแล้วนะ แล้วทุกๆหน้ายังมีการ์ดใครเป็นคนสมัคร? อยู่อีก มันไม่สมควร"
       🔴 ซ่อนด้วยสคริปต์เฉพาะตอนเข้าด้วย Google จริง — คนที่เปิดหน้าสมัครตรง ๆ ยังต้องใช้การ์ดนี้สลับหน้า */
    var who = document.querySelector('.who');
    if (who) who.style.display = 'none';

    if (!document.querySelector('.gs-ok')) {
      var badge = document.createElement('div');
      badge.className = 'gs-ok';
      badge.innerHTML = '<span class="gs-ok-ic" aria-hidden="true">✓</span>'
        + '<span><b>ยืนยันอีเมลแล้วด้วยบัญชี Google</b><br><span class="gs-mail"></span> — ไม่ต้องกรอกรหัส 6 หลัก</span>';
      badge.querySelector('.gs-mail').textContent = email;
      mail.parentElement.appendChild(badge);
    }

    /* เติมชื่อจากโปรไฟล์ Google ให้ ถ้าช่องยังว่าง (แก้ได้) */
    if (name) {
      var nick = document.getElementById('nickname') || document.getElementById('s-nick');
      if (nick && !nick.value) nick.value = name;
      var first = document.getElementById('firstname') || document.getElementById('s-first') || document.getElementById('p-first');
      if (first && !first.value) first.value = name;
    }
  }

  function notice(text) {
    var bar = document.createElement('div');
    bar.className = 'gs-note';
    bar.setAttribute('role', 'status');
    bar.textContent = text;
    document.body.insertBefore(bar, document.body.firstChild);
  }

  ready(function () {
    css();
    var auth = window.BGTAuth;
    if (auth && auth.available) enableButtons(auth);

    var err = auth ? auth.urlError() : '';
    if (err) notice('เข้าสู่ระบบด้วย Google ไม่สำเร็จ — ' + err);

    if (q.get('via') !== 'google') return;

    if (!auth || !auth.available) {
      notice((auth && auth.loadError) || 'โหลดระบบเข้าสู่ระบบไม่สำเร็จ — ลองรีเฟรชหน้า');
      return;
    }
    auth.ready().then(function (session) {
      auth.cleanUrl();
      if (session && session.user && session.user.email) {
        applyVerified(session.user.email, auth.googleName(session));
      } else if (!err) {
        notice('ยังไม่ได้เข้าสู่ระบบด้วย Google — กดปุ่ม "สมัครด้วย Google" ในใบสมัครก่อน');
      }
    });
  });
})();
