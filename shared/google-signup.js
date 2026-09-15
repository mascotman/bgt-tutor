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
      '.gs-err{color:var(--color-error);font-weight:600}' +
      /* ล็อกใบสมัคร (2026-09-15) — เห็นได้ แต่จางลงและกรอกไม่ได้ */
      '.gs-locked{opacity:.45;filter:grayscale(.3);user-select:none}' +
      '.gs-gate{outline:2px solid var(--color-accent);outline-offset:4px;border-radius:var(--radius-md)}' +
      '.gs-lockbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin:0 0 var(--space-6);' +
      'padding:14px 16px;background:var(--color-level-soft);border-radius:var(--radius-md);' +
      'font-size:var(--text-sm);line-height:1.6;color:var(--color-ink)}' +
      '.gs-lockbar>span:nth-child(2){flex:1;min-width:200px}';
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

    /* เติม "ชื่อจริง" จากโปรไฟล์ Google ให้ ถ้าช่องยังว่าง (แก้ได้)
       🔴 2026-09-14 ห้ามเติมช่อง "ชื่อเล่น" เด็ดขาด — ชื่อเล่นคือชื่อที่คนอื่นเห็น
          (ผู้เรียน: ครูเห็นในใบคำขอ · ครู: โชว์บนหน้าค้นหาสาธารณะ)
          เจอจริงบนเว็บจริง: Owner สมัครแล้ว display_name ในฐานข้อมูลเป็นชื่อ-นามสกุลจริงจาก Google
          เพราะรอบก่อนเติมชื่อเต็มลงช่องชื่อเล่นให้ แล้วผู้ใช้กดส่งโดยไม่ได้แก้
       ช่อง "ชื่อจริง" เป็นข้อมูลส่วนตัว (คนอื่นเห็นหลังจ่ายเงินเท่านั้น) → เติมได้ แต่ใช้แค่คำแรก ไม่ใส่นามสกุลลงช่องชื่อ */
    if (name) {
      var firstWord = String(name).trim().split(/\s+/)[0] || '';
      var first = document.getElementById('firstname') || document.getElementById('s-first') || document.getElementById('p-first');
      if (first && !first.value && firstWord) first.value = firstWord;
    }
  }

  function notice(text) {
    var bar = document.createElement('div');
    bar.className = 'gs-note';
    bar.setAttribute('role', 'status');
    bar.textContent = text;
    document.body.insertBefore(bar, document.body.firstChild);
  }

  /* ── 🔴 2026-09-15 ล็อกใบสมัครจนกว่าจะเข้าด้วย Google ──────────────────────────
     Owner: "เพื่อนผมไปกดสมัครเป็นครู ด้านล่างครับ ไม่ได้กดเข้าด้วย google" · "ติดที่ต้องได้อีเมลจากเรา"
     ต้นเหตุ = คนที่เปิดหน้าสมัครตรง ๆ (ไม่ผ่านปุ่ม Google) ยังเจอขั้น "ส่งรหัสไปที่อีเมล" ของต้นแบบ
       ซึ่งไม่เคยส่งอีเมลจริง → รอเก้อ · และต่อให้กรอกจบ ใบสมัครก็อยู่แค่ในเครื่อง ไม่ถึงฐานข้อมูล
     ข้อตกลง Owner 2026-09-14: สมัครด้วย Google อย่างเดียว (LOG "ตัดขั้นกรอกอีเมล + รหัส 6 หลักออกจากทางหลัก")
     ท่าที่เลือก: ให้เห็นใบสมัครได้ (รู้ว่าต้องกรอกอะไร) แต่ "กรอกไม่ได้" จนกว่าจะกด Google
       → ไม่มีใครกรอกยาวครบทุกขั้นแล้วต้องเด้งไป Google จนข้อมูลที่พิมพ์หายหมด
     ข้อยกเว้น: มีบัญชีในเครื่องล็อกอินอยู่แล้ว (บัญชีตัวอย่าง / โหมดแก้โปรไฟล์) = ปล่อยทำงานแบบเดิม */
  var locked = false;

  function hideOtpUi() {
    ['send-otp', 'otp-box', 'otp-field', 'otp-ok'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.hidden = true; el.style.display = 'none'; }
    });
    [].forEach.call(document.querySelectorAll('.badge-note'), function (box) {
      if (/รหัส 6 หลัก/.test(box.textContent)) box.style.display = 'none';
    });
  }

  function lockForm(msg) {
    var form = document.querySelector('form');
    if (!form) return;
    locked = true;
    hideOtpUi();
    [].forEach.call(form.querySelectorAll('.section'), function (s) {
      s.inert = true;
      s.classList.add('gs-locked');
    });
    var submit = form.querySelector('button[type=submit]');
    if (submit) { submit.disabled = true; submit.dataset.gsLocked = '1'; }

    var box = document.querySelector('.social-signup');
    if (box) {
      box.classList.add('gs-gate');
      var qEl = box.querySelector('.social-q');
      if (qEl) qEl.textContent = 'ขั้นแรก: เข้าสู่ระบบด้วย Google';
      var why = box.querySelector('.social-why');
      if (why && msg) { why.textContent = msg; why.classList.add('gs-err'); }
    }

    /* ป้ายเหนือขั้นแรก — คนที่เลื่อนผ่านกล่อง Google ไปแล้วจะได้รู้ว่าทำไมกรอกไม่ได้ */
    var first = form.querySelector('.section');
    if (first && !document.getElementById('gs-lockbar')) {
      var bar = document.createElement('div');
      bar.id = 'gs-lockbar';
      bar.className = 'gs-lockbar';
      bar.setAttribute('role', 'note');
      bar.innerHTML = '<span aria-hidden="true">🔒</span><span><b>กรอกได้หลังเข้าสู่ระบบด้วย Google</b> — '
        + 'อีเมลจะมาจากบัญชี Google เลย ไม่ต้องรอรหัสทางอีเมล</span>'
        + '<button type="button" class="btn btn-secondary">ไปที่ปุ่ม Google</button>';
      bar.querySelector('button').addEventListener('click', function () {
        var b = document.querySelector('.social-signup .btn-social');
        if (!b) return;
        b.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (!b.disabled) b.focus({ preventScroll: true });
      });
      first.parentNode.insertBefore(bar, first);
    }
  }

  function unlockForm() {
    if (!locked) return;
    locked = false;
    [].forEach.call(document.querySelectorAll('.gs-locked'), function (s) {
      s.inert = false;
      s.classList.remove('gs-locked');
    });
    var submit = document.querySelector('form button[type=submit][data-gs-locked]');
    if (submit) { submit.disabled = false; delete submit.dataset.gsLocked; }
    var bar = document.getElementById('gs-lockbar');
    if (bar) bar.parentNode.removeChild(bar);
  }

  ready(function () {
    css();
    var auth = window.BGTAuth;
    if (auth && auth.available) enableButtons(auth);

    var err = auth ? auth.urlError() : '';
    if (err) notice('เข้าสู่ระบบด้วย Google ไม่สำเร็จ — ' + err);

    var localSession = window.BGTAccounts && BGTAccounts.session && BGTAccounts.session();
    if (!localSession) {
      lockForm(auth && auth.available ? '' : ((auth && auth.loadError) || 'โหลดระบบเข้าสู่ระบบไม่สำเร็จ — ลองรีเฟรชหน้า'));
    }
    if (!auth || !auth.available) return;

    auth.ready().then(function (session) {
      if (q.get('via') === 'google') auth.cleanUrl();
      if (session && session.user && session.user.email) {
        /* ล็อกอิน Google อยู่แล้ว (มาจากปุ่ม หรือเปิดหน้านี้ทีหลังก็ตาม) = ใช้อีเมล Google + ปลดล็อก */
        unlockForm();
        applyVerified(session.user.email, auth.googleName(session));
      } else if (q.get('via') === 'google' && !err) {
        notice('ยังไม่ได้เข้าสู่ระบบด้วย Google — กดปุ่ม "สมัครด้วย Google" ในใบสมัครก่อน');
      }
    });
  });
})();
