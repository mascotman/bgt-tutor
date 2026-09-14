/* auth.js — เข้าสู่ระบบ/สมัครด้วย Google ผ่าน Supabase (ก้อน H · สร้าง 2026-09-14)
 *
 * Owner เคาะ 2026-09-14: "บังคับล็อคอินผ่าน google" → ทางเข้าหลักมีทางเดียว
 *
 * ต้องโหลดตามลำดับนี้ในทุกหน้าที่ใช้:
 *   supabase-js (CDN · ล็อกเวอร์ชัน + integrity) → supabase-config.js → auth.js → accounts.js
 *
 * 🔴 หลัก 3 ข้อ
 *   1. โหลดตัวต่อหลังบ้านไม่ได้ (เน็ตหลุด / CDN ล่ม) = ปุ่ม Google ต้อง "ปิดค้างไว้" ไม่ใช่กดแล้วเงียบ
 *      ปุ่มใน HTML จึงเขียน disabled ไว้เสมอ แล้วให้ไฟล์นี้/ไฟล์หน้าเปิดเองเมื่อพร้อมจริง
 *   2. ฝั่งหน้าเว็บเชื่อ "ใครล็อกอินอยู่" จาก Supabase เท่านั้น · สิทธิ์จริงตรวจที่ฐานข้อมูล (backend/schema.sql)
 *   3. ใช้ PKCE — รหัสที่ Google ส่งกลับมาใช้แลกครั้งเดียว และถูกลบออกจากแถบที่อยู่ทันที (ไม่ค้างในประวัติ)
 */
(function () {
  'use strict';

  var LOAD_ERR = 'โหลดระบบเข้าสู่ระบบไม่สำเร็จ — ลองรีเฟรชหน้า หรือเช็กอินเทอร์เน็ต';
  var cfg = window.BGT_SUPABASE;
  var sb = null;
  try {
    if (cfg && window.supabase && typeof window.supabase.createClient === 'function') {
      sb = window.supabase.createClient(cfg.url, cfg.publishableKey, {
        auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
      });
    }
  } catch (e) { sb = null; }

  /* รอให้ Supabase อ่านรหัสที่ Google ส่งกลับมา (ถ้ามี) แล้วค่อยบอกว่าล็อกอินอยู่ไหม — เรียกกี่ครั้งก็ได้ */
  var readyPromise = null;
  function ready() {
    if (!sb) return Promise.resolve(null);
    if (!readyPromise) {
      readyPromise = sb.auth.getSession()
        .then(function (r) { return (r && r.data && r.data.session) || null; })
        .catch(function () { return null; });
    }
    return readyPromise;
  }

  /* ข้อความผิดพลาดที่ Supabase/Google ส่งกลับมาทางแถบที่อยู่ (เช่นผู้ใช้กดยกเลิก) */
  function urlError() {
    var q = new URLSearchParams(location.search);
    var h = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
    return q.get('error_description') || h.get('error_description') || '';
  }

  /* ลบรหัสชั่วคราวออกจากแถบที่อยู่ · เก็บพารามิเตอร์ของหน้าเอง (เช่น ?via=google) ไว้ */
  function cleanUrl() {
    try {
      var u = new URL(location.href);
      ['code', 'state', 'error', 'error_code', 'error_description'].forEach(function (k) { u.searchParams.delete(k); });
      var hash = /access_token|refresh_token|error/.test(u.hash) ? '' : u.hash;
      history.replaceState(null, '', u.pathname + u.search + hash);
    } catch (e) { /* เบราว์เซอร์เก่า — ปล่อยไว้ ไม่กระทบการใช้งาน */ }
  }

  /* ส่งไปหน้าเลือกบัญชี Google · returnTo = หน้าที่จะให้เด้งกลับมา (ต้องอยู่ใน Redirect URLs ของ Supabase) */
  function signInWithGoogle(returnTo) {
    if (!sb) return Promise.reject(new Error(LOAD_ERR));
    return sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: returnTo || (location.origin + location.pathname),
        queryParams: { prompt: 'select_account' }     /* ให้เลือกบัญชีทุกครั้ง — เครื่องที่มีหลายบัญชีจะได้ไม่เข้าผิดบัญชี */
      }
    }).then(function (r) { if (r.error) throw r.error; return r; });
  }

  /* โปรไฟล์ของบัญชีนี้ในเว็บเรา — null = ยังไม่เคยสมัคร (มีบัญชี Google แต่ยังไม่ได้เลือกฝั่ง) */
  function profile(session) {
    if (!sb || !session) return Promise.resolve(null);
    return sb.from('profiles').select('role,display_name').eq('id', session.user.id).maybeSingle()
      .then(function (r) { if (r.error) throw r.error; return r.data || null; });
  }

  /* ลงทะเบียนฝั่ง (ครู/ผู้เรียน) ที่ฐานข้อมูล — ฐานข้อมูลกันไม่ให้ 1 บัญชีเปลี่ยนฝั่งเอง */
  function register(role, name, prov) {
    if (!sb) return Promise.reject(new Error(LOAD_ERR));
    return sb.rpc('bgt_register', { p_role: role, p_name: name, p_prov: prov || '' })
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }

  function signOut() {
    if (!sb) return Promise.resolve();
    return sb.auth.signOut().catch(function () {});
  }

  function googleName(session) {
    var m = (session && session.user && session.user.user_metadata) || {};
    return String(m.full_name || m.name || '').slice(0, 60);
  }

  /* แปลง error จากฐานข้อมูลเป็นภาษาคน (รหัส bgt:xxx มาจาก backend/schema.sql) */
  function explain(err) {
    var m = String((err && (err.message || err.error_description)) || err || '');
    if (/bgt:role_locked/.test(m)) return 'บัญชี Google นี้สมัครไว้อีกฝั่งแล้ว — 1 บัญชีเป็นได้ฝั่งเดียว ใช้บัญชี Google อื่นสมัครฝั่งนี้';
    if (/bgt:not_signed_in/.test(m)) return 'ยังไม่ได้เข้าสู่ระบบด้วย Google — กดปุ่ม Google ก่อน';
    if (/provider is not enabled|Unsupported provider/i.test(m)) return 'ระบบเข้าสู่ระบบด้วย Google ยังไม่ได้เปิดที่หลังบ้าน';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'ติดต่อเซิร์ฟเวอร์ไม่ได้ — เช็กอินเทอร์เน็ตแล้วลองใหม่';
    return m ? 'เกิดข้อผิดพลาด: ' + m : LOAD_ERR;
  }

  window.BGTAuth = {
    available: !!sb,
    loadError: sb ? '' : LOAD_ERR,
    ready: ready,
    urlError: urlError,
    cleanUrl: cleanUrl,
    signInWithGoogle: signInWithGoogle,
    profile: profile,
    register: register,
    signOut: signOut,
    googleName: googleName,
    explain: explain
  };
})();
