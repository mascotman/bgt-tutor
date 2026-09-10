/* ═══════════════════════════════════════════════════════════════════════════
   v4-stepflow.js — ยก "วิธีจัดหน้า" ของจอจำลองใน index-v3 มาใช้กับหน้าใช้งานจริง
   สร้าง 2026-08-31 (คู่กับ v4-stepflow.css) · ทำให้ใช้ได้ทุกหน้าเมื่อ 2026-08-31 รอบสอง

   🔴 ชั้นทับล้วน — ไม่แตะ HTML เดิม ไม่แตะตัวตรวจข้อมูลเดิม ไม่ย้ายช่องกรอก
      ทำงานหลังสคริปต์ของหน้าโหลดจบ แล้วเปลี่ยนแค่ "ก้อนไหนโชว์อยู่"

   ทำอะไร (อ่านโครงจากสารบัญ `.sidenav` ของหน้านั้นเอง ไม่ต้องตั้งค่าอะไร):
     1. ถอดแถบเมนูซ้ายทิ้ง -> เอาแถบบนมาโชว์แทนทุกความกว้างจอ (Owner สั่ง: จอใน landing ไม่มีแถบข้าง)
     2. สารบัญกลายเป็น "แท็บแถวบน" ท่า .mock-tabs
     3. โชว์ทีละก้อนตามแท็บที่เลือก

   2 โหมด — เดาเองจากหน้า ไม่ต้องสั่ง:
     • form  = ก้อนทั้งหมดอยู่ใน <form> เดียว (หน้าสมัคร/หน้าโพสต์/หน้าจอง)
               -> มีแถบความคืบหน้า · ปุ่มถัดไป-ย้อนกลับ · เครื่องหมายครบ/ไม่ครบ · ปุ่มดูทั้งหมด
     • tabs  = หน้ารวมรายการ (กระดานงาน/ตารางสอน/งานของฉัน)
               -> มีแค่แท็บ ไม่มีความคืบหน้า ไม่มีปุ่มถัดไป (มันไม่ใช่ของที่ต้อง "ทำให้ครบ")

   กันของหายไว้แล้ว:
     - ลิงก์ในสารบัญที่ชี้ออกไปหน้าอื่น (เช่น "หางานเพิ่ม") -> ย้ายขึ้นแถบบน ไม่ได้ทิ้ง
     - ของอื่นในแถบข้าง (เช่นกล่องสรุปคาบของหน้าจอง) -> ย้ายมาไว้ใต้แท็บ ไม่ได้ทิ้ง
     - กดส่งแล้วช่องผิดอยู่ในก้อนที่ซ่อน -> เด้งไปก้อนนั้นให้ก่อนเลื่อนหา
     - ส่งสำเร็จแล้วฟอร์มถูกซ่อน -> เก็บแท็บ/แถบความคืบหน้าตามไปด้วย
   ═════════════════════════════════════════════════════════════════════════ */
(() => {
  /* ═══ 🔴 2026-09-10 · กฎกลาง "กด Enter ในช่องที่มีปุ่มคู่" ═══
     อาการที่เจอ: ช่องอีเมล / ช่องรหัส OTP มีปุ่ม "ส่งรหัสไปที่อีเมล" · "ยืนยันรหัส" อยู่ข้าง ๆ
     แต่ปุ่มพวกนั้นเป็น type="button" (ไม่ใช่ปุ่มส่งฟอร์ม) และไม่มีใครดัก Enter ไว้
     -> ผู้ใช้พิมพ์อีเมลเสร็จกด Enter คิดว่าจะเป็นการกดปุ่มนั้น แต่ได้ "ส่งใบสมัครทั้งใบ" แทน
        แล้วหน้าจอเด้งข้ามขั้นเพราะช่องอื่นยังกรอกไม่ครบ (พบ 3 หน้า: สมัครผู้ปกครอง/นักเรียน/ครู)

     ท่าที่ถูกมีอยู่แล้วในบ้านที่ login.html:230,251 -> ยกขึ้นมาเป็นกฎกลาง ทุกหน้าได้พร้อมกัน

     🔴 ขอบเขต: แตะเฉพาะช่องที่ "มีปุ่มคู่จริง" เท่านั้น
        ช่องธรรมดา (ชื่อ · อายุ · งบ · เขต) ไม่แตะ เพราะ Enter = ส่งฟอร์ม
        เป็นพฤติกรรมมาตรฐานของ HTML ไม่ใช่บั๊ก — ถ้าจะเปลี่ยนต้องให้ Owner เคาะก่อน */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.defaultPrevented) return;      /* ช่องที่ดักเองแล้ว (เช่นช่องวิชา) ไม่ยุ่ง */
    const el = e.target;
    if (!el || el.tagName !== 'INPUT') return;
    if (['submit', 'button', 'reset', 'checkbox', 'radio', 'file'].indexOf(el.type) > -1) return;
    if (!el.closest('form')) return;                          /* ไม่อยู่ในฟอร์ม = ไม่มีอะไรให้กัน */

    /* หาปุ่มคู่: ขึ้นไปไม่เกิน 2 ชั้น (โครงจริงคือ .field > input แล้วปุ่มเป็นพี่น้องของ .field
       หรือปุ่มอยู่ใน .field เดียวกันเลย — เกินกว่านี้จะไปเจอปุ่มของก้อนอื่น) */
    let box = el.parentElement, btn = null;
    for (let i = 0; i < 2 && box && !btn; i++) {
      btn = [...box.querySelectorAll('button[type="button"]')]
        .find((b) => !b.closest('.tag') && !b.classList.contains('suggest-item')
                  && !b.hasAttribute('hidden') && b.offsetParent !== null);
      box = box.parentElement;
    }
    if (!btn) return;                                          /* ไม่มีปุ่มคู่ = ปล่อยตามมาตรฐาน HTML */
    e.preventDefault();
    btn.click();
  });

  const nav = document.querySelector('.sidenav');
  if (!nav) return;

  const rawLinks = [...nav.querySelectorAll('a')];
  const items = [];
  const awayLinks = [];                       /* ลิงก์ที่ชี้ออกไปหน้าอื่น */
  rawLinks.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const el = href.startsWith('#') ? document.getElementById(href.slice(1)) : null;
    if (el) items.push({
      id: el.id, el,
      name: a.textContent.replace(/^\s*\d+[.\s]*/, '').trim(),
      /* ตัวเลขในสารบัญที่ "มี id" = ตัวนับที่สคริปต์ของหน้าอัปเดตอยู่ (เช่นจำนวนคาบวันนี้)
         ต้องย้ายตัวจริงไปไว้บนแท็บ ไม่ใช่ copy ข้อความ ไม่งั้นตัวเลขจะค้างไม่อัปเดต
         ส่วนเลขลำดับขั้นของหน้าสมัคร (01/02/…) ไม่มี id -> ไม่ต้องเอาไป */
      count: a.querySelector('.sidenav-num[id]'),
    });
    else awayLinks.push(a);
  });
  if (items.length < 2) return;

  const root = document.documentElement;
  root.classList.add('v4');

  const form = items[0].el.closest('form');
  const MODE = form ? 'form' : 'tabs';
  if (form) form.classList.add('v4-card');

  const host = items[0].el.parentNode;          /* กล่องที่ห่อทุกก้อนอยู่ */
  const first = items[0].el;

  let current = 0;
  let showAll = false;

  /* ── แท็บแถวบน ── */
  const steps = document.createElement('div');
  steps.className = 'v4-steps';
  steps.setAttribute('role', 'tablist');
  steps.setAttribute('aria-label', nav.getAttribute('aria-label') || 'หัวข้อในหน้านี้');
  items.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'v4-step';
    b.setAttribute('role', 'tab');
    b.innerHTML = '<span class="t"></span><span class="mark"></span>';
    b.querySelector('.t').textContent = s.name;
    if (s.count) { s.count.classList.add('v4-count'); b.appendChild(s.count); }
    b.addEventListener('click', () => go(i));
    steps.appendChild(b);
    s.btn = b;
  });
  host.insertBefore(steps, first);

  /* ── แถบความคืบหน้า (โหมดฟอร์มเท่านั้น) ── */
  let bar = null, lbl = null, fill = null, allBtn = null;
  if (MODE === 'form') {
    bar = document.createElement('div');
    bar.className = 'v4-progress';
    bar.innerHTML = '<span class="lbl"></span><span class="bar"><i style="width:0%"></i></span>'
                  + '<button type="button" class="all"></button>';
    host.insertBefore(bar, first);
    lbl = bar.querySelector('.lbl');
    fill = bar.querySelector('.bar i');
    allBtn = bar.querySelector('.all');
    allBtn.addEventListener('click', () => setAll(!showAll));
  }

  /* ── ย้ายของที่เหลือในแถบข้างออกมา ไม่ให้หายไปพร้อมแถบ ── */
  /* 🔴 2026-09-10 — ตอนแปลง 9 หน้าเข้ามาตรฐาน หน้าเปลี่ยนมาใช้ .stepindex (สารบัญขั้นตอน)
     กับ .topbar (แถบบนของกลาง) ตาม STANDARD -> ต้องรับทั้งชื่อเก่าและใหม่
     ไม่งั้นลิงก์ "กลับ…" กับของในแถบข้างจะหายไปพร้อมแถบ */
  const sidebar = document.querySelector('.sidebar, .stepindex');
  const header = document.querySelector('.mobile-header, .topbar');
  if (sidebar) {
    /* ปุ่ม "กลับ…" ในแถบข้าง = ทางออกของหน้า ห้ามให้หายไปกับแถบ -> ย้ายขึ้นแถบบน
       ⚠️ หลายหน้ามีปุ่มนี้ "สองตัว" อยู่แล้ว (ตัวหนึ่งในแถบข้างสำหรับจอกว้าง
          อีกตัวในแถบบนสำหรับจอแคบ) ถ้าย้ายดื้อ ๆ จะได้ปุ่มซ้ำสองอันติดกัน
          -> ปลายทางเดียวกันและข้อความเหมือนกัน = ทิ้งตัวที่จะย้าย (เจอจริง 2026-08-31) */
    if (header) {
      const already = new Set([...header.querySelectorAll('a')]
        .map((a) => a.getAttribute('href') + '|' + a.textContent.trim()));
      sidebar.querySelectorAll('.back-link').forEach((a) => {
        if (already.has(a.getAttribute('href') + '|' + a.textContent.trim())) return;
        header.appendChild(a);
      });
    }
    const keep = [...sidebar.children].filter(
      (c) => c !== nav && !c.classList.contains('logo') && !c.classList.contains('back-link')
    );
    if (keep.length) {
      const box = document.createElement('div');
      box.className = 'v4-side-extra';
      keep.forEach((c) => box.appendChild(c));
      host.insertBefore(box, first);
      /* หน้าเดิมมีของบางชิ้น "คู่แฝด" — ตัวหนึ่งไว้แถบข้าง (จอกว้าง) อีกตัวไว้แถบบน (จอแคบ)
         เช่น #quota-side กับ #quota-mobile · พอถอดแถบข้างแล้วมันจะโผล่พร้อมกันสองอัน
         -> ตัวไหนที่แถบบนมีคลาสชุดเดียวกันอยู่แล้ว ให้ "ซ่อน" ตัวที่ย้ายมา
         🔴 ห้ามใช้ .remove() — สคริปต์ของหน้าเดิมยังเขียนค่าลงตัวนั้นอยู่
            (เจอจริง 2026-08-31: my-jobs พัง "Cannot set properties of null" ตอนนาฬิกาเดิน) */
      if (header) {
        const inHeader = new Set([...header.querySelectorAll('*')].map((e) => e.className).filter(Boolean));
        box.querySelectorAll('*').forEach((e) => { if (inHeader.has(e.className)) e.style.display = 'none'; });
      }
    }
  }
  /* 🔴 2026-09-10 — ตั้งแต่ฝั่งผู้เรียนมีเมนูบนชุดเดียวกัน (.topnav) แล้ว
     ลิงก์ในสารบัญที่ชี้ออกไปหน้าอื่นมักเป็นปลายทางเดียวกับเมนูบน -> ถ้าย้ายดื้อ ๆ จะได้ปุ่มซ้ำสองอัน
     เทียบจาก href ไม่ใช่ข้อความ เพราะข้อความอาจเขียนต่างกัน ("ค้นหาครู" กับ "← กลับ") */
  if (header) {
    const inHeaderHref = new Set([...header.querySelectorAll('a')].map((a) => a.getAttribute('href')));
    awayLinks.forEach((a) => {
      if (inHeaderHref.has(a.getAttribute('href'))) { a.remove(); return; }
      a.classList.add('back-link');
      header.appendChild(a);
    });
  }

  /* ── โหมดฟอร์ม: "ก้อนนี้กรอกครบหรือยัง" ──
        อ่านจากช่องในก้อนนั้นตรง ๆ ไม่เรียกตัวตรวจของหน้าเดิม
        เพราะตัวนั้นขึ้นข้อความแดงด้วย (ไม่อยากขึ้นแดงตั้งแต่ยังไม่ได้กรอก) */
  const EXTRA = {
    /* ราคา: หน้าสมัครครูเติมแถวเปล่าให้ 1 แถวตั้งแต่โหลด -> นับแถวอย่างเดียวไม่พอ ต้องมีตัวเลขจริง */
    'sec-price': () => [...document.querySelectorAll('#price-rows .price-row')]
      .some((r) => r.querySelector('select[name=price_level]')?.value
                && String(r.querySelector('input[name=price_amount]')?.value || '').trim()),
    /* รูป/เอกสาร: รูปโปรไฟล์บังคับ (ตัวส่งฟอร์มเดิมเช็คจากรูปที่แสดงในกรอบ) */
    'sec-media': () => !!document.querySelector('#avatar-preview img'),
  };

  function stepDone(s) {
    /* 🔴 ห้ามใช้ offsetParent วัดว่าช่องนี้ "ใช้อยู่ไหม" — ก้อนที่ยังไม่ถึงถูกซ่อนทั้งก้อน
          offsetParent จะเป็น null หมด แล้วก้อนนั้นจะขึ้น ✓ ทั้งที่ยังไม่ได้กรอก (เจอจริง)
          ที่ถูกคือดู display:none ที่หน้าเดิมสั่งไว้กับช่องเป็นราย ๆ */
    const applicable = (el) => {
      for (let n = el; n && n !== s.el; n = n.parentElement)
        if (n.style && n.style.display === 'none') return false;
      return true;
    };
    const req = [...s.el.querySelectorAll('input[required],select[required],textarea[required]')]
      .filter(applicable);
    for (const el of req) {
      if (el.type === 'checkbox') { if (!el.checked) return false; }
      else if (!String(el.value || '').trim()) return false;
    }
    for (const g of s.el.querySelectorAll('[aria-required="true"]')) {
      const boxes = g.querySelectorAll('input[type=checkbox]');
      if (boxes.length && ![...boxes].some((b) => b.checked)) return false;
    }
    const subj = s.el.querySelector('#subjects-value');
    if (subj && !subj.value) return false;
    const more = EXTRA[s.id];
    if (more && !more()) return false;
    return true;
  }

  /* ── ปุ่มเดินหน้า-ถอยหลัง (โหมดฟอร์มเท่านั้น) ── */
  if (MODE === 'form') {
    items.forEach((s, i) => {
      const box = document.createElement('div');
      box.className = 'v4-nav';
      if (i > 0) {
        const back = document.createElement('button');
        back.type = 'button'; back.textContent = '← ย้อนกลับ';
        back.addEventListener('click', () => go(i - 1));
        box.appendChild(back);
      }
      box.appendChild(Object.assign(document.createElement('span'), { className: 'grow' }));
      if (i < items.length - 1) {
        const next = document.createElement('button');
        next.type = 'button'; next.className = 'next'; next.textContent = 'ถัดไป →';
        next.addEventListener('click', () => go(i + 1));
        box.appendChild(next);
      }
      s.el.appendChild(box);
    });
  }

  function paint() {
    items.forEach((s, i) => {
      s.el.hidden = !showAll && i !== current;
      s.btn.setAttribute('aria-current', String(!showAll && i === current));
      if (MODE === 'form') s.btn.dataset.state = stepDone(s) ? 'done' : 'todo';
    });
    if (MODE !== 'form') return;
    const done = items.filter(stepDone).length;
    fill.style.width = Math.round((done / items.length) * 100) + '%';
    lbl.textContent = showAll
      ? 'กรอกครบแล้ว ' + done + ' จาก ' + items.length + ' ขั้น'
      : 'ขั้นที่ ' + (current + 1) + ' จาก ' + items.length + ' · ' + items[current].name;
    allBtn.textContent = showAll ? 'กลับไปทีละขั้น' : 'ดูทั้งหมดในหน้าเดียว';
  }

  function go(i) {
    current = Math.max(0, Math.min(items.length - 1, i));
    if (showAll) { setAll(false); return; }
    paint();
    /* จอแคบ: แถบแท็บเลื่อนแนวนอนได้ แท็บที่เปิดอยู่อาจอยู่นอกจอ -> ดึงเข้ามาให้เห็น
       (block:'nearest' กันไม่ให้หน้าเลื่อนตาม — เรามี scrollTo(0) ของเราเองอยู่แล้ว) */
    items[current].btn.scrollIntoView({ block: 'nearest', inline: 'center' });
    /* โฟกัสหัวข้อของก้อนใหม่ ไม่ใช่ช่องแรก — คนใช้คีย์บอร์ดจะได้รู้ว่ามาถึงหัวข้อไหน */
    const h = items[current].el.querySelector('h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── 🔴 จุดที่พังง่ายที่สุดของการ "โชว์ทีละก้อน" ──
     สคริปต์ของหน้าเดิมหลายที่สั่ง `scrollIntoView` / `focus()` ข้ามไปก้อนอื่น
     (หน้าจอง: เลือกวันเสร็จแล้วกระโดดไปขั้นเลือกเวลา · หน้าโพสต์งาน: กระโดดไปขั้นตรวจ
      · ทุกหน้า: กดส่งแล้วกระโดดไปช่องที่กรอกผิด)
     ถ้าก้อนปลายทางถูกซ่อนอยู่ คำสั่งพวกนี้จะ "เงียบ" — คนกดแล้วเหมือนไม่มีอะไรเกิดขึ้น
     -> ดักไว้: ปลายทางอยู่ก้อนไหน สลับไปก้อนนั้นให้ก่อน แล้วค่อยปล่อยให้ทำงานตามเดิม
     (แก้ที่นี่ที่เดียว ดีกว่าไล่แก้สคริปต์ของทุกหน้า และถอดออกได้พร้อมกันทั้งชั้น) */
  function revealFor(el) {
    if (showAll || !el || !el.nodeType) return;
    const idx = items.findIndex((s) => s.el === el || s.el.contains(el));
    if (idx >= 0 && idx !== current) { current = idx; paint(); }
  }
  const nativeScroll = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...args) {
    revealFor(this);
    return nativeScroll.apply(this, args);
  };
  const nativeFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (...args) {
    revealFor(this);
    return nativeFocus.apply(this, args);
  };

  function setAll(on) {
    showAll = on;
    root.classList.toggle('v4-all', on);
    items.forEach((s) => { s.el.hidden = false; });
    paint();
  }

  if (MODE === 'form') {
    /* ส่งแล้วมีช่องผิดในก้อนที่ซ่อนอยู่ — ตัวนี้ผูกทีหลังตัวเดิม
       จึงทำงานหลังตัวเดิมตั้ง aria-invalid เสร็จแล้ว */
    form.addEventListener('submit', () => {
      const agree = document.getElementById('agree');
      const bad = form.querySelector('[aria-invalid="true"]')
               || (agree && !agree.checked ? agree : null);
      if (!bad) return;
      const idx = items.findIndex((s) => s.el.contains(bad));
      if (idx >= 0 && idx !== current && !showAll) {
        current = idx;
        paint();
        requestAnimationFrame(() => bad.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      }
    });

    /* ส่งสำเร็จ ฟอร์มถูกซ่อน -> เก็บแท็บกับแถบความคืบหน้าด้วย */
    new MutationObserver(() => {
      const gone = form.style.display === 'none';
      steps.style.display = gone ? 'none' : '';
      bar.style.display = gone ? 'none' : '';
    }).observe(form, { attributes: true, attributeFilter: ['style'] });

    form.addEventListener('input', paint);
    form.addEventListener('change', paint);
  }

  paint();
})();
