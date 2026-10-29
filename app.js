/* ===== Ứng dụng làm bài ===== */
(function () {
  'use strict';
  var CFG = window.EXAM_CONFIG || {};
  var CORE = EXAM_CORE;
  var DUR_MS = (CFG.DURATION_MIN || 120) * 60 * 1000;
  var LS_KEY = 'oly_' + CORE.EXAM_ID;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- lưu trữ cục bộ ---------- */
  var store = loadStore();
  function loadStore() {
    try { var s = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (s && s.profiles) return s; } catch (e) {}
    return { profiles: {}, last: null };
  }
  function saveStore() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(store)); }
    catch (e) { toast('Không lưu được vào trình duyệt (bộ nhớ đầy hoặc chế độ ẩn danh).'); }
  }
  function pidOf(name, cls) { return CORE.norm(name) + '|' + CORE.norm(cls); }
  function profile(name, cls) {
    var id = pidOf(name, cls);
    if (!store.profiles[id]) store.profiles[id] = { name: name, cls: cls, current: null, history: [] };
    var p = store.profiles[id]; p.name = name; p.cls = cls; return p;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }

  var P = null;          // hồ sơ đang dùng
  var cur = null;        // lần làm đang diễn ra
  var mode = 'start';    // start | doing | review | result
  var tick = null;

  /* ---------- tiện ích hiển thị ---------- */
  function fmtScore(x) { return (Math.round(x * 10) / 10).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function fmtDate(t) {
    var d = new Date(t), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ' ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), s = sec % 60;
    return m + ' phút ' + (s < 10 ? '0' : '') + s + ' giây';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var toastT;
  function toast(msg, ms) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 3200);
  }
  function show(id) {
    ['startScreen', 'examScreen', 'resultScreen'].forEach(function (s) { $('#' + s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }
  $$('.durText').forEach(function (e) { e.textContent = CFG.DURATION_MIN || 120; });

  /* ---------- dựng đề ---------- */
  $('#examBody').innerHTML = EXAM_CONTENT.html;
  (function buildPalette() {
    var g = $('#palGrid'), h = '';
    for (var q = 1; q <= 100; q++) h += '<a href="#q' + q + '" data-p="' + q + '">' + q + '</a>';
    g.innerHTML = h;
    g.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return; e.preventDefault();
      var el = document.getElementById('q' + a.dataset.p);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); var f = el.matches('input,select,textarea') ? el : el.querySelector('input:not([type=radio]),select,textarea'); if (f && mode === 'doing') setTimeout(function () { f.focus({ preventScroll: true }); }, 350); }
      if (window.innerWidth < 760) togglePalette(false);
    });
  })();
  function togglePalette(v) {
    var p = $('#palette'); var open = v == null ? p.hidden : v;
    p.hidden = !open; $('#btnPalette').setAttribute('aria-expanded', open);
  }
  $('#btnPalette').onclick = function () { togglePalette(); };

  /* ---------- đọc / ghi câu trả lời ---------- */
  function readAnswers() {
    var a = {};
    $$('#examBody input[type=radio]:checked').forEach(function (r) { a[r.dataset.q] = r.value; });
    $$('#examBody .gap, #examBody .sel, #examBody .rwin').forEach(function (el) { if (el.value.trim()) a[el.dataset.q] = el.value.trim(); });
    $$('#examBody .ecin').forEach(function (el) {
      if (!el.value.trim()) return;
      var q = el.dataset.q; a[q] = a[q] || {}; a[q][el.dataset.f] = el.value.trim();
    });
    return a;
  }
  function writeAnswers(a) {
    a = a || {};
    $$('#examBody input[type=radio]').forEach(function (r) { r.checked = a[r.dataset.q] === r.value; });
    $$('#examBody .gap, #examBody .sel, #examBody .rwin').forEach(function (el) { el.value = a[el.dataset.q] || ''; });
    $$('#examBody .ecin').forEach(function (el) { var v = a[el.dataset.q]; el.value = (v && v[el.dataset.f]) || ''; });
    $$('#examBody .rwin').forEach(autoGrow);
    refreshFilled();
  }
  function setDisabled(dis) {
    $$('#examBody input, #examBody select, #examBody textarea').forEach(function (el) { el.disabled = dis; });
  }
  function autoGrow(t) { if (!t.offsetParent) return; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
  function refreshFilled() {
    $$('#examBody .gap, #examBody .sel, #examBody .rwin, #examBody .ecin').forEach(function (el) { el.classList.toggle('filled', !!el.value.trim()); });
    var a = readAnswers(), n = 0;
    $$('#palGrid a').forEach(function (l) { var d = !CORE.isBlank(+l.dataset.p, a[l.dataset.p]); l.classList.toggle('done', d); if (d) n++; });
    $('#cntDone').textContent = n;
  }
  var saveT;
  function onEdit(e) {
    if (mode !== 'doing') return;
    if (e.target.classList.contains('rwin')) autoGrow(e.target);
    refreshFilled();
    clearTimeout(saveT);
    saveT = setTimeout(function () { if (cur) { cur.answers = readAnswers(); saveStore(); } }, 300);
  }
  $('#examBody').addEventListener('input', onEdit);
  $('#examBody').addEventListener('change', onEdit);
  $('#examBody').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList.contains('rwin')) e.preventDefault(); });

  /* ---------- tô sáng ---------- */
  var HL = (function () {
    var tip = $('#hlTip'), pending = null;
    function okNode(n, root) {
      for (var p = n.parentNode; p && p !== root; p = p.parentNode) {
        if (/^(SELECT|OPTION|TEXTAREA|BUTTON|SCRIPT|STYLE)$/.test(p.nodeName)) return false;
      }
      return true;
    }
    function textNodes(root) {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), out = [], n;
      while ((n = w.nextNode())) if (okNode(n, root)) out.push(n);
      return out;
    }
    function rangeToOffsets(root, range) {
      var acc = 0, s = -1, e = -1;
      textNodes(root).forEach(function (n) {
        var len = n.nodeValue.length;
        if (range.intersectsNode(n)) {
          var a = n === range.startContainer ? range.startOffset : 0;
          var b = n === range.endContainer ? range.endOffset : len;
          if (b > a) { if (s < 0) s = acc + a; e = acc + b; }
        }
        acc += len;
      });
      return s >= 0 && e > s ? [s, e] : null;
    }
    function clear(root) {
      $$('mark.hlm', root).forEach(function (m) { var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); });
      root.normalize();
    }
    function paint(root, segs) {
      clear(root);
      (segs || []).forEach(function (sg) {
        var acc = 0;
        textNodes(root).forEach(function (n) {
          var len = n.nodeValue.length, a = Math.max(sg[0] - acc, 0), b = Math.min(sg[1] - acc, len);
          acc += len;
          if (b <= a || !n.nodeValue.slice(a, b).trim() && b - a < 2) return;
          var mid = n; if (a > 0) mid = n.splitText(a);
          if (b - a < mid.nodeValue.length) mid.splitText(b - a);
          var m = document.createElement('mark'); m.className = 'hlm';
          mid.parentNode.insertBefore(m, mid); m.appendChild(mid);
        });
      });
    }
    function merge(segs) {
      segs.sort(function (x, y) { return x[0] - y[0]; });
      var out = [];
      segs.forEach(function (s) { var l = out[out.length - 1]; if (l && s[0] <= l[1]) l[1] = Math.max(l[1], s[1]); else out.push([s[0], s[1]]); });
      return out;
    }
    function store_() { return cur ? (cur.hl = cur.hl || {}) : null; }
    function placeTip(rect, label, cls) {
      tip.textContent = label; tip.className = 'hltip ' + (cls || '');
      tip.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
      tip.style.top = (rect.top + window.scrollY) + 'px';
      tip.hidden = false;
    }
    function hide() { tip.hidden = true; pending = null; }
    function onSelect() {
      if (mode !== 'doing') return;
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      var range = sel.getRangeAt(0);
      var root = (range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode).closest('.hl');
      if (!root) {
        // chọn vượt qua nhiều đoạn: lấy đoạn chứa điểm đầu
        var sn = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentNode;
        root = sn.closest && sn.closest('.hl');
        if (!root) return;
        var r2 = document.createRange(); r2.setStart(range.startContainer, range.startOffset); r2.setEnd(root, root.childNodes.length); range = r2;
      }
      var off = rangeToOffsets(root, range); if (!off) return;
      pending = { kind: 'add', root: root, off: off };
      placeTip(range.getBoundingClientRect(), 'Tô sáng');
    }
    document.addEventListener('mouseup', function (e) { if (e.target === tip) return; setTimeout(onSelect, 10); });
    document.addEventListener('touchend', function (e) { if (e.target === tip) return; setTimeout(onSelect, 350); });
    document.addEventListener('selectionchange', function () {
      var s = window.getSelection(); if (pending && pending.kind === 'add' && (!s || s.isCollapsed)) setTimeout(function () { if (pending && pending.kind === 'add' && window.getSelection().isCollapsed) hide(); }, 200);
    });
    document.addEventListener('click', function (e) {
      if (e.target === tip) return;
      var m = e.target.closest && e.target.closest('mark.hlm');
      if (m && mode === 'doing' && window.getSelection().isCollapsed) {
        var root = m.closest('.hl'), r = document.createRange(); r.selectNodeContents(m);
        var off = rangeToOffsets(root, r);
        pending = { kind: 'remove', root: root, off: off };
        placeTip(m.getBoundingClientRect(), 'Bỏ tô sáng', 'remove');
      } else if (!tip.hidden && (!window.getSelection() || window.getSelection().isCollapsed)) hide();
    });
    window.addEventListener('scroll', function () { if (pending && pending.kind === 'remove') hide(); }, { passive: true });
    tip.addEventListener('mousedown', function (e) { e.preventDefault(); });
    tip.addEventListener('click', function () {
      if (!pending) return;
      var st = store_(); if (!st) return hide();
      var id = pending.root.dataset.hid, segs = st[id] || [];
      if (pending.kind === 'add') segs = merge(segs.concat([pending.off]));
      else segs = segs.filter(function (s) { return !(pending.off && s[0] <= pending.off[0] && s[1] >= pending.off[1]); });
      if (segs.length) st[id] = segs; else delete st[id];
      paint(pending.root, segs);
      window.getSelection().removeAllRanges();
      hide(); saveStore();
    });
    function applyAll(map) {
      $$('#examBody .hl').forEach(function (root) { if ((map && map[root.dataset.hid]) || root.querySelector('mark.hlm')) paint(root, map && map[root.dataset.hid]); });
    }
    return { applyAll: applyAll, hide: hide };
  })();
  $('#btnClearHl').onclick = function () {
    if (!cur || mode !== 'doing') return;
    cur.hl = {}; HL.applyAll({}); saveStore(); toast('Đã xoá tất cả chỗ tô sáng.');
  };

  /* ---------- toàn màn hình & theo dõi rời màn hình ---------- */
  var FS = {
    supported: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
    active: function () { return !!(document.fullscreenElement || document.webkitFullscreenElement); },
    enter: function () {
      if (!FS.supported || FS.active()) return;
      var el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
      try { var p = f.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    },
    exit: function () {
      if (!FS.active()) return;
      var f = document.exitFullscreen || document.webkitExitFullscreen;
      try { var p = f.call(document); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
  };
  var OUT_LABEL = { blur: 'Chuyển sang cửa sổ/ứng dụng khác', tab: 'Chuyển tab / thu nhỏ trình duyệt', fs: 'Thoát chế độ toàn màn hình', reload: 'Tải lại hoặc đóng trang' };
  function isBack() { return document.visibilityState === 'visible' && document.hasFocus() && (!FS.supported || FS.active()); }
  function goAway(type) {
    if (mode !== 'doing' || !cur) return;
    if (!cur.out.away) {
      cur.out.away = { t: Date.now(), type: type };
      cur.out.n++;
      saveStore();
      updOut();
    }
    $('#ovCount').textContent = cur.out.n;
    $('#outOverlay').hidden = false;
  }
  function checkBack() {
    if (mode !== 'doing' || !cur || !cur.out.away) return;
    if (!isBack()) return;
    var a = cur.out.away, s = Math.round((Date.now() - a.t) / 1000);
    cur.out.secs += s; cur.out.ev.push({ t: a.t, type: a.type, s: s });
    if (cur.out.ev.length > 200) cur.out.ev.shift();
    delete cur.out.away;
    saveStore();
    $('#outOverlay').hidden = true;
    toast('Đã ghi nhận lần rời màn hình thứ ' + cur.out.n + ' (' + s + ' giây).');
  }
  function updOut() {
    var n = cur ? cur.out.n : 0;
    $('#outCnt').textContent = n;
    $('#outStat').classList.toggle('has', n > 0);
  }
  window.addEventListener('blur', function () { setTimeout(function () { if (!document.hasFocus()) goAway('blur'); }, 120); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') goAway('tab'); else checkBack(); });
  window.addEventListener('focus', checkBack);
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    document.addEventListener(ev, function () { if (FS.active()) checkBack(); else goAway('fs'); });
  });
  $('#btnBackFs').onclick = function () {
    FS.enter();
    setTimeout(function () { window.focus(); checkBack(); if (cur && cur.out.away && !FS.supported) checkBack(); }, 400);
    if (!FS.supported) { $('#outOverlay').hidden = true; checkBack(); }
  };
  window.addEventListener('pagehide', function () { if (mode === 'doing' && cur) { cur.answers = readAnswers(); if (!cur.out.away) { cur.out.away = { t: Date.now(), type: 'reload' }; cur.out.n++; } saveStore(); } });

  /* ---------- đồng hồ ---------- */
  function startTimer() {
    clearInterval(tick);
    var el = $('#timerText'), box = $('#timer'), warned5 = false, warned1 = false;
    function upd() {
      if (!cur) return;
      var left = cur.deadline - Date.now();
      if (left <= 0) { el.textContent = '00:00'; clearInterval(tick); submit(true); return; }
      var s = Math.floor(left / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
      el.textContent = (h ? h + ':' + (m < 10 ? '0' : '') : '') + m.toString().padStart(h ? 2 : 2, '0') + ':' + (ss < 10 ? '0' : '') + ss;
      box.classList.toggle('warn', left < 10 * 60e3 && left >= 60e3);
      box.classList.toggle('danger', left < 60e3);
      if (!warned5 && left < 5 * 60e3 && left > 4.9 * 60e3) { warned5 = true; toast('Còn 5 phút. Kiểm tra lại bài nhé.', 5000); }
      if (!warned1 && left < 60e3 && left > 58e3) { warned1 = true; toast('Còn 1 phút! Hết giờ bài sẽ tự nộp.', 5000); }
    }
    upd(); tick = setInterval(upd, 1000);
  }

  /* ---------- màn hình bắt đầu ---------- */
  var inName = $('#inName'), inClass = $('#inClass');
  if (store.last && store.profiles[store.last]) { inName.value = store.profiles[store.last].name; inClass.value = store.profiles[store.last].cls; }
  function refreshStart() {
    var n = inName.value.trim(), c = inClass.value.trim();
    var p = n && c ? store.profiles[pidOf(n, c)] : null;
    $('#btnContinue').hidden = !(p && p.current);
    if (p && p.current) {
      var left = p.current.deadline - Date.now();
      $('#btnContinue').textContent = left > 0 ? 'Tiếp tục bài đang làm (còn ' + Math.ceil(left / 60000) + ' phút)' : 'Nộp bài đang làm dở (đã hết giờ)';
    }
    renderHistory($('#startHistory .histwrap'), p);
    $('#startHistory').hidden = !(p && p.history.length);
  }
  inName.addEventListener('input', refreshStart); inClass.addEventListener('input', refreshStart);
  function getProfileFromForm() {
    var n = inName.value.replace(/\s+/g, ' ').trim(), c = inClass.value.replace(/\s+/g, ' ').trim();
    if (n.length < 2 || c.length < 1) { $('#startErr').textContent = 'Nhập đầy đủ họ tên và lớp/trường.'; return null; }
    $('#startErr').textContent = '';
    P = profile(n, c); store.last = pidOf(n, c); return P;
  }
  $('#startForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!getProfileFromForm()) return;
    if (P.current) { if (!window.confirm('Bạn đang có một bài làm dở. Bỏ bài đó và bắt đầu lần mới?')) return; }
    FS.enter(); // phải gọi ngay trong thao tác bấm
    P.current = { aid: uid(), startedAt: Date.now(), deadline: Date.now() + DUR_MS, answers: {}, hl: {}, out: { n: 0, secs: 0, ev: [] } };
    saveStore();
    enterExam();
  });
  $('#btnContinue').onclick = function () {
    if (!getProfileFromForm() || !P.current) return;
    FS.enter();
    var c = P.current;
    if (c.out.away) { // lần trước rời trang giữa chừng
      var s = Math.round((Date.now() - c.out.away.t) / 1000);
      c.out.secs += s; c.out.ev.push({ t: c.out.away.t, type: c.out.away.type, s: s }); delete c.out.away;
    }
    saveStore();
    enterExam();
  };

  function enterExam() {
    cur = P.current; mode = 'doing';
    document.body.classList.remove('reviewing');
    $('#tbName').textContent = P.name; $('#tbClass').textContent = P.cls;
    $('#timer').hidden = false; $('#reviewTag').hidden = true; $('#reviewBanner').hidden = true;
    $('#btnSubmit').hidden = false; $('#btnCloseReview').hidden = true; $('#btnClearHl').hidden = false;
    $('#outStat').hidden = false;
    setDisabled(false); writeAnswers(cur.answers); HL.applyAll(cur.hl);
    updOut(); show('examScreen'); $$('#examBody .rwin').forEach(autoGrow); startTimer();
    if (cur.deadline <= Date.now()) submit(true);
  }

  /* ---------- nộp bài ---------- */
  $('#btnSubmit').onclick = function () {
    if (mode !== 'doing') return;
    var a = readAnswers(), left = 100 - CORE.countAnswered(a);
    $('#cfText').innerHTML = left ? 'Bạn còn <b>' + left + ' câu</b> chưa làm. Nộp bài bây giờ?' : 'Bạn đã làm đủ 100 câu. Nộp bài bây giờ?';
    $('#confirmModal').hidden = false; $('#cfYes').focus();
  };
  $('#cfNo').onclick = function () { $('#confirmModal').hidden = true; };
  $('#cfYes').onclick = function () { $('#confirmModal').hidden = true; submit(false); };

  function submit(timeUp) {
    if (mode !== 'doing' || !cur) return;
    clearInterval(tick);
    mode = 'result';
    var c = cur; c.answers = readAnswers();
    if (c.out.away) { var s = Math.round((Date.now() - c.out.away.t) / 1000); c.out.secs += s; c.out.ev.push({ t: c.out.away.t, type: c.out.away.type, s: s }); delete c.out.away; }
    var now = Date.now();
    var entry = {
      aid: c.aid, no: P.history.length + 1, startedAt: c.startedAt, at: now,
      dur: Math.round((Math.min(now, c.deadline) - c.startedAt) / 1000), timeUp: !!timeUp,
      answers: c.answers, hl: c.hl, out: { n: c.out.n, secs: c.out.secs, ev: c.out.ev },
      result: null, sent: false
    };
    P.history.push(entry); P.current = null; cur = null; saveStore();
    $('#outOverlay').hidden = true; HL.hide();
    FS.exit();
    if (timeUp) toast('Hết giờ – bài đã được nộp tự động.', 5000);
    showResult(entry);
    send(entry);
  }

  function payloadOf(e) {
    return {
      action: 'submit', exam: CORE.EXAM_ID, sid: e.aid, name: P.name, cls: P.cls,
      startedAt: e.startedAt, submittedAt: e.at, durationSec: e.dur, timeUp: e.timeUp,
      answers: e.answers, out: e.out, ua: navigator.userAgent.slice(0, 160)
    };
  }
  function send(entry, quiet) {
    if (!CFG.API_URL || /PASTE_/.test(CFG.API_URL)) {
      entry.err = 'Chưa cấu hình địa chỉ chấm bài (API_URL trong config.js).'; saveStore();
      if (!quiet) showResult(entry); return Promise.resolve();
    }
    entry.err = null; if (!quiet && mode === 'result') showResult(entry);
    return fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify(payloadOf(entry)), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'Máy chủ không nhận bài');
        entry.result = { correct: res.correct, score: res.score, parts: res.parts, sections: res.sections };
        if (res.attemptNo) entry.serverNo = res.attemptNo;
        entry.sent = true; entry.err = null; saveStore();
      })
      .catch(function (err) {
        entry.err = 'Chưa gửi được bài: ' + (err && err.message ? err.message : 'lỗi mạng') + '.';
        saveStore();
      })
      .then(function () { if (mode === 'result' && shownAid === entry.aid) showResult(entry); refreshHistoryViews(); });
  }
  function retryPending() {
    Object.keys(store.profiles).forEach(function (k) {
      var p = store.profiles[k];
      p.history.forEach(function (e) {
        if (!e.sent) { var keep = P; P = p; send(e, true); P = keep; }
      });
    });
  }

  /* ---------- kết quả ---------- */
  var shownAid = null;
  function ring(score) {
    var r = 56, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, score / 20));
    return '<div class="ring"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="' + r + '" fill="none" stroke="#e6edf6" stroke-width="12"/>' +
      '<circle cx="66" cy="66" r="' + r + '" fill="none" stroke="#1f3a5f" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (c * f) + ' ' + c + '"/></svg>' +
      '<div class="val"><b>' + fmtScore(score) + '</b><span>/ 20 điểm</span></div></div>';
  }
  function showResult(e) {
    shownAid = e.aid; mode = 'result';
    show('resultScreen');
    var h = '';
    if (!e.result) {
      h = '<div class="rpending">' + (e.err ? '' : '<div class="spinner"></div>') +
        '<h2>' + (e.err ? 'Bài đã được lưu trên máy này' : 'Đang chấm bài…') + '</h2>' +
        (e.err ? '<p class="muted">' + esc(e.err) + ' Bài làm của bạn không bị mất. Kiểm tra kết nối mạng rồi bấm gửi lại.</p><div class="actions" style="justify-content:center"><button class="btn primary" id="btnResend">Gửi lại bài</button></div>' : '<p class="muted">Vui lòng chờ trong giây lát.</p>') +
        '</div>';
    } else {
      var R = e.result, best = bestOf(P);
      h += '<div class="rtop">' + ring(R.score) + '<div class="rinfo"><h2>Kết quả lần làm thứ ' + e.no + '</h2>' +
        '<p class="big">Số câu đúng: <b>' + R.correct + '/100</b></p>' +
        '<p class="big">Điểm: <b>' + fmtScore(R.score) + '/20</b>' + (best && best.aid === e.aid && P.history.filter(function (x) { return x.result; }).length > 1 ? '<span class="badge">Cao nhất</span>' : '') + '</p>' +
        '<p class="muted">Thời gian làm: ' + fmtDur(e.dur) + (e.timeUp ? ' (hết giờ)' : '') + ' · Rời màn hình: <b' + (e.out.n ? ' style="color:var(--warn)"' : '') + '>' + e.out.n + ' lần</b></p></div></div>';
      h += '<div class="parts">' + CORE.PARTS.map(function (p) {
        var x = R.parts[p.id] || { correct: 0, total: p.to - p.from + 1, score: 0 };
        return '<div class="pbox"><div class="pn">' + p.name.replace('–', '·') + '</div><div class="ps">' + fmtScore(x.score) + '<small class="muted">/' + p.max + '</small></div><div class="pc">' + x.correct + '/' + x.total + ' câu đúng</div></div>';
      }).join('') + '</div>';
      if (CFG.SHOW_SECTION_DETAIL !== false && R.sections) {
        h += '<table class="secs">' + R.sections.map(function (s) {
          return '<tr><td>' + esc(s.title) + ' <span class="muted">(câu ' + s.from + '–' + s.to + ')</span></td><td><div class="bar"><i style="width:' + Math.round(100 * s.correct / s.total) + '%"></i></div></td><td class="n">' + s.correct + '/' + s.total + '</td></tr>';
        }).join('') + '</table>';
      }
      h += '<p class="rnote">Đáp án không được hiển thị. Bạn có thể xem lại bài làm của mình và làm lại bao nhiêu lần tuỳ ý.</p>';
    }
    h += '<div class="actions"><button class="btn ghost" id="btnHome">Về trang đầu</button><button class="btn ghost" id="btnReview">Xem lại bài làm</button><button class="btn primary" id="btnRetry">Làm lại</button></div>';
    $('#resultCard').innerHTML = h;
    var rs = $('#btnResend'); if (rs) rs.onclick = function () { send(e); };
    $('#btnReview').onclick = function () { openReview(e); };
    $('#btnRetry').onclick = function () { inName.value = P.name; inClass.value = P.cls; refreshStart(); show('startScreen'); mode = 'start'; inName.focus(); };
    $('#btnHome').onclick = function () { mode = 'start'; refreshStart(); show('startScreen'); };
    renderHistory($('#resultHistory .histwrap'), P);
    $('#resultHistory').hidden = !P.history.length;
  }
  function bestOf(p) {
    var b = null;
    (p ? p.history : []).forEach(function (e) { if (e.result && (!b || e.result.score > b.result.score)) b = e; });
    return b;
  }
  function renderHistory(box, p) {
    if (!p || !p.history.length) { box.innerHTML = ''; return; }
    var best = bestOf(p);
    var rows = p.history.slice().reverse().map(function (e) {
      var sc = e.result ? '<span class="sc">' + fmtScore(e.result.score) + '</span>/20' : '<span class="badge pending">Chưa chấm</span>';
      return '<tr class="' + (best && best.aid === e.aid ? 'best' : '') + '"><td class="num">' + e.no + '</td><td>' + fmtDate(e.at) + '</td>' +
        '<td class="num">' + Math.round(e.dur / 60) + ' phút</td><td class="num">' + (e.result ? e.result.correct + '/100' : '–') + '</td><td>' + sc + '</td>' +
        '<td class="num ' + (e.out.n ? 'warnc' : '') + '">' + e.out.n + '</td>' +
        '<td><button class="btn link" data-act="res" data-aid="' + e.aid + '">Kết quả</button> · <button class="btn link" data-act="rev" data-aid="' + e.aid + '">Xem lại</button></td></tr>';
    }).join('');
    box.innerHTML = '<table class="hist"><thead><tr><th>Lần</th><th>Nộp lúc</th><th>Thời gian</th><th>Câu đúng</th><th>Điểm</th><th>Rời MH</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
    box.onclick = function (ev) {
      var b = ev.target.closest('button[data-aid]'); if (!b) return;
      P = p; store.last = pidOf(p.name, p.cls);
      var e = p.history.filter(function (x) { return x.aid === b.dataset.aid; })[0]; if (!e) return;
      if (b.dataset.act === 'rev') openReview(e); else showResult(e);
    };
  }
  function refreshHistoryViews() {
    if (!$('#startScreen').hidden) refreshStart();
    if (!$('#resultScreen').hidden && P) renderHistory($('#resultHistory .histwrap'), P);
  }

  /* ---------- xem lại (không hiện đáp án) ---------- */
  var reviewFrom = null;
  function openReview(e) {
    reviewFrom = e; mode = 'review'; cur = null;
    document.body.classList.add('reviewing');
    $('#tbName').textContent = P.name; $('#tbClass').textContent = P.cls;
    $('#timer').hidden = true; $('#reviewTag').hidden = false; $('#reviewTag').textContent = 'Xem lại lần ' + e.no;
    $('#btnSubmit').hidden = true; $('#btnCloseReview').hidden = false; $('#btnClearHl').hidden = true; $('#outStat').hidden = true;
    $('#reviewBanner').hidden = false;
    $('#reviewBanner').innerHTML = '<b>Lần ' + e.no + '</b> · nộp lúc ' + fmtDate(e.at) + ' · ' +
      (e.result ? e.result.correct + '/100 câu đúng · <b>' + fmtScore(e.result.score) + '/20</b>' : 'chưa chấm') +
      ' · rời màn hình ' + e.out.n + ' lần. <span class="muted">Đây là bài làm của bạn; đáp án không được hiển thị.</span>';
    writeAnswers(e.answers); setDisabled(true); HL.applyAll(e.hl || {});
    show('examScreen'); $$('#examBody .rwin').forEach(autoGrow);
  }
  $('#btnCloseReview').onclick = function () { document.body.classList.remove('reviewing'); if (reviewFrom) showResult(reviewFrom); };

  /* ---------- khởi động ---------- */
  refreshStart();
  retryPending();
  window.addEventListener('beforeunload', function (e) { if (mode === 'doing') { e.preventDefault(); e.returnValue = ''; } });
})();
