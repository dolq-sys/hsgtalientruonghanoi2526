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
  var VIEWS = $$('#examBody .view'), curView = 0;
  (function buildNav() {
    var h = '', last = '';
    VIEWS.forEach(function (v, i) {
      if (v.dataset.part !== last) { h += (i ? '<span class="snsep"></span>' : '') + '<span class="snpart">' + v.dataset.part + '</span>'; last = v.dataset.part; }
      h += '<button type="button" class="sn" data-v="' + i + '"><span class="snt">' + v.dataset.short + '</span><span class="snr">' + v.dataset.from + '–' + v.dataset.to + '</span><span class="snc"></span></button>';
    });
    $('#secNav').innerHTML = h;
    $('#secNav').addEventListener('click', function (e) { var b = e.target.closest('.sn'); if (b) showView(+b.dataset.v); });
  })();
  function viewOfQ(q) { for (var i = 0; i < VIEWS.length; i++) if (q >= +VIEWS[i].dataset.from && q <= +VIEWS[i].dataset.to) return i; return 0; }
  function showView(i, noFocus) {
    i = Math.max(0, Math.min(VIEWS.length - 1, i)); curView = i;
    VIEWS.forEach(function (v, k) { v.classList.toggle('active', k === i); });
    $$('#secNav .sn').forEach(function (b, k) { b.classList.toggle('active', k === i); if (k === i) b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
    var v = VIEWS[i];
    $('#botInfo').innerHTML = '<b>Câu ' + v.dataset.from + '–' + v.dataset.to + '</b><span>Phần ' + (i + 1) + '/' + VIEWS.length + '</span>';
    $('#btnPrevV').disabled = i === 0; $('#btnNextV').disabled = i === VIEWS.length - 1;
    $$('.rwin', v).forEach(autoGrow);
    if (cur && mode === 'doing') { cur.view = i; saveStoreSoon(); }
    HL.hide();
  }
  function goToQ(q) {
    showView(viewOfQ(q));
    var el = document.getElementById('q' + q); if (!el) return;
    setTimeout(function () {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1300);
      var f = el.matches('input,textarea') ? el : el.querySelector('input:not([type=radio]),textarea');
      if (f && mode === 'doing') setTimeout(function () { f.focus({ preventScroll: true }); }, 350);
    }, 30);
  }
  $('#btnPrevV').onclick = function () { showView(curView - 1); };
  $('#btnNextV').onclick = function () { showView(curView + 1); };
  var saveSoonT; function saveStoreSoon() { clearTimeout(saveSoonT); saveSoonT = setTimeout(saveStore, 400); }
  (function buildPalette() {
    var g = $('#palGrid'), h = '';
    for (var q = 1; q <= 100; q++) h += '<a href="#q' + q + '" data-p="' + q + '">' + q + '</a>';
    g.innerHTML = h;
    g.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return; e.preventDefault();
      goToQ(+a.dataset.p);
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
    $$('#examBody .gap, #examBody .rwin').forEach(function (el) { if (el.value.trim()) a[el.dataset.q] = el.value.trim(); });
    $$('#examBody .ecin').forEach(function (el) {
      if (!el.value.trim()) return;
      var q = el.dataset.q; a[q] = a[q] || {}; a[q][el.dataset.f] = el.value.trim();
    });
    return a;
  }
  function writeAnswers(a) {
    a = a || {};
    $$('#examBody input[type=radio]').forEach(function (r) { r.checked = a[r.dataset.q] === r.value; });
    $$('#examBody .gap, #examBody .rwin').forEach(function (el) { el.value = a[el.dataset.q] || ''; });
    $$('#examBody .ecin').forEach(function (el) { var v = a[el.dataset.q]; el.value = (v && v[el.dataset.f]) || ''; });
    $$('#examBody .rwin').forEach(autoGrow);
    refreshFilled();
  }
  function setDisabled(dis) {
    $$('#examBody input, #examBody select, #examBody textarea').forEach(function (el) { el.disabled = dis; });
  }
  function autoGrow(t) { if (!t.offsetParent) return; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
  function refreshFilled() {
    $$('#examBody .gap, #examBody .rwin, #examBody .ecin').forEach(function (el) { el.classList.toggle('filled', !!el.value.trim()); });
    var a = readAnswers(), n = 0;
    $$('#palGrid a').forEach(function (l) { var d = !CORE.isBlank(+l.dataset.p, a[l.dataset.p]); l.classList.remove('t-ok', 't-half', 't-bad', 't-blank'); l.classList.toggle('done', d); if (d) n++; });
    $('#cntDone').textContent = n;
    if (mode !== 'teacher') VIEWS.forEach(function (v, i) {
      var f = +v.dataset.from, t = +v.dataset.to, c = 0;
      for (var q = f; q <= t; q++) if (!CORE.isBlank(q, a[q])) c++;
      var b = $$('#secNav .sn')[i]; b.querySelector('.snc').textContent = c + '/' + (t - f + 1);
      b.classList.toggle('full', c === t - f + 1); b.classList.toggle('some', c > 0 && c < t - f + 1);
      b.classList.remove('t-good', 't-mid', 't-bad');
    });
  }
  var saveT;
  function onEdit(e) {
    if (mode !== 'doing') return;
    var t = e.target;
    if (e.type === 'input' && t.dataset && t.dataset.allow) { // ô gõ 1 ký tự: chỉ nhận chữ/số hợp lệ
      var v = t.value.toUpperCase().replace(new RegExp('[^' + t.dataset.allow + ']', 'g'), '').slice(-1);
      if (t.value !== v) t.value = v;
      if (v) { var all = $$('input[data-allow]', VIEWS[curView]), k = all.indexOf(t); if (k >= 0 && all[k + 1] && t.classList.contains('letter')) all[k + 1].focus(); }
    }
    if (e.target.classList.contains('rwin')) autoGrow(e.target);
    refreshFilled();
    clearTimeout(saveT);
    saveT = setTimeout(function () { if (cur) { cur.answers = readAnswers(); saveStore(); } }, 300);
  }
  $('#examBody').addEventListener('input', onEdit);
  $('#examBody').addEventListener('change', onEdit);
  $('#examBody').addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.key === 'Enter' && t.matches('.rwin, .gap, .ecin')) { // Enter = sang ô tiếp theo
      e.preventDefault();
      var all = $$('.gap, .ecin, .rwin', VIEWS[curView]).filter(function (x) { return !x.disabled; }), k = all.indexOf(t);
      if (all[k + 1]) all[k + 1].focus();
    }
  });

  /* ---------- tô sáng ---------- */
  var HL = (function () {
    var tip = $('#hlTip'), pending = null;
    function okNode(n, root) {
      for (var p = n.parentNode; p && p !== root; p = p.parentNode) {
        if (/^(SELECT|OPTION|TEXTAREA|BUTTON|SCRIPT|STYLE)$/.test(p.nodeName)) return false;
        if (p.classList && p.classList.contains('tkey')) return false;
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
      tip.style.left = (rect.left + rect.width / 2) + 'px';
      tip.style.top = rect.top + 'px';
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
    document.addEventListener('scroll', function () { if (pending) hide(); }, { passive: true, capture: true });
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
    clearMarks(); setDisabled(false); writeAnswers(cur.answers); HL.applyAll(cur.hl);
    updOut(); show('examScreen'); showView(cur.view || 0); startTimer();
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
      answers: e.answers, out: e.out, hl: e.hl || {}, ua: navigator.userAgent.slice(0, 160)
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
        entry.result = { correct: res.correct, half: res.half || 0, score: res.score, parts: res.parts, sections: res.sections, marks: res.marks || null };
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
        '<p class="big">Số câu đúng: <b>' + R.correct + '/100</b>' + (R.half ? ' <span class="muted">+ ' + R.half + ' câu được nửa điểm</span>' : '') + '</p>' +
        '<p class="big">Điểm: <b>' + fmtScore(R.score) + '/20</b>' + (best && best.aid === e.aid && P.history.filter(function (x) { return x.result; }).length > 1 ? '<span class="badge">Cao nhất</span>' : '') + '</p>' +
        '<p class="muted">Thời gian làm: ' + fmtDur(e.dur) + (e.timeUp ? ' (hết giờ)' : '') + ' · Rời màn hình: <b' + (e.out.n ? ' style="color:var(--warn)"' : '') + '>' + e.out.n + ' lần</b></p></div></div>';
      h += '<div class="parts">' + CORE.PARTS.map(function (p) {
        var x = R.parts[p.id] || { correct: 0, total: p.to - p.from + 1, score: 0 };
        return '<div class="pbox"><div class="pn">' + p.name.replace('–', '·') + '</div><div class="ps">' + fmtScore(x.score) + '<small class="muted">/' + p.max + '</small></div><div class="pc">' + x.correct + '/' + x.total + ' câu đúng' + (x.half ? ', ' + x.half + ' nửa' : '') + '</div></div>';
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
      (e.result ? '<b>' + fmtScore(e.result.score) + '/20</b> · ' + e.result.correct + ' câu đúng' + (e.result.half ? ' · ' + e.result.half + ' câu nửa điểm' : '') : 'chưa chấm') +
      ' · rời màn hình ' + e.out.n + ' lần' +
      (e.result && e.result.marks ? '<span class="legend2 rv"><i class="lg ok"></i>Đúng <i class="lg half"></i>Nửa điểm <i class="lg bad"></i>Sai <i class="lg blank"></i>Bỏ trống</span>' +
        '<div class="muted rvnote">Mỗi câu đã được đánh dấu đúng/sai; đáp án đúng không được hiển thị. Bấm "Danh sách câu" để thấy toàn bộ.</div>'
       : '<div class="muted rvnote">Lần làm này nộp trước khi có tính năng đánh dấu từng câu, nên chỉ xem được bài làm.</div>');
    clearMarks(); writeAnswers(e.answers); setDisabled(true); HL.applyAll(e.hl || {});
    var mk = e.result && e.result.marks;
    if (mk) {
      ecHeader();
      var ef = function (q) { return mk[q] || 0; };
      for (var q = 1; q <= CORE.TOTAL_Q; q++) markOne(q, ef(q), CORE.isBlank(q, e.answers[q]), false, null, false);
      colorNav(ef, e.answers);
    }
    show('examScreen'); showView(0);
  }
  $('#btnCloseReview').onclick = function () { document.body.classList.remove('reviewing'); if (reviewFrom) showResult(reviewFrom); };

  /* ---------- gọi file hứng: fetch, nếu bị chặn thì JSONP ---------- */
  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      var cb = 'oly_cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e6), s = document.createElement('script'), t;
      function done() { clearTimeout(t); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function (d) { done(); resolve(d); };
      s.onerror = function () { done(); reject(new Error('Không kết nối được tới file hứng')); };
      t = setTimeout(function () { done(); reject(new Error('File hứng không phản hồi (quá 25 giây)')); }, 25000);
      s.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + cb;
      document.head.appendChild(s);
    });
  }
  /* Gọi bằng POST (giống lúc nộp bài – không bị lỗi khi trình duyệt đăng nhập nhiều tài khoản Google); nếu hỏng mới thử JSONP */
  function apiGet(params) {
    var body = { action: params.api };
    Object.keys(params).forEach(function (k) { if (k !== 'api') body[k] = params[k]; });
    if (body.val === '' || body.val === undefined) body.val = null;
    var url = CFG.API_URL + '?' + Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k] == null ? '' : params[k]); }).join('&');
    return fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .catch(function () { return jsonp(url); });
  }

  /* ---------- CHẾ ĐỘ GIÁO VIÊN: xem bài làm của HS ngay trên tờ đề ---------- */
  var T = null, wrongPtr = 0;
  var ICON_OK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_BAD = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 6.5l7 7M13.5 6.5l-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  function tEff(q) { var o = T.ov[q]; return o === 0 || o === 0.5 || o === 1 ? o : (T.auto[q] || 0); }
  function tManual(q) { var o = T.ov[q]; return o === 0 || o === 0.5 || o === 1; }
  var ICON_HALF = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M10 4a6 6 0 0 1 0 12z" fill="currentColor"/></svg>';
  function tLabel(v, blank) { return v === 1 ? 'Đúng' : v === 0.5 ? 'Nửa điểm' : (blank ? 'Bỏ trống' : 'Sai'); }
  function teacherLoad(sid, k) {
    mode = 'teacher'; T = null;
    document.body.classList.add('reviewing', 'teacher');
    $('#timer').hidden = true; $('#btnSubmit').hidden = true; $('#btnClearHl').hidden = true; $('#btnCloseReview').hidden = true;
    $('#outStat').hidden = true; $$('.tonly').forEach(function (b) { b.hidden = false; });
    $('#reviewTag').hidden = false; $('#reviewTag').textContent = 'Đang tải…';
    $('#tbName').textContent = ''; $('#tbClass').textContent = '';
    $('#reviewBanner').hidden = false; $('#reviewBanner').innerHTML = '<div class="spinner"></div><p style="text-align:center">Đang tải bài làm…</p>';
    show('examScreen'); showView(0);
    if (!CFG.API_URL || /PASTE_/.test(CFG.API_URL)) { $('#reviewBanner').textContent = 'Chưa cấu hình API_URL trong config.js.'; return; }
    apiGet({ api: 'review', sid: sid, k: k })
      .then(function (d) {
        if (!d || !d.ok) throw new Error((d && d.error) || 'Không đọc được dữ liệu');
        T = d; T.k = k; wrongPtr = 0;
        try { history.replaceState(null, '', location.pathname + '?xem=' + encodeURIComponent(sid) + '&k=' + encodeURIComponent(k)); } catch (e) {}
        document.title = 'Bài làm – ' + d.name;
        teacherRender();
      })
      .catch(function (err) {
        $('#reviewTag').textContent = 'Lỗi';
        var test = CFG.API_URL + '?api=review&sid=' + encodeURIComponent(sid) + '&k=' + encodeURIComponent(k);
        $('#reviewBanner').innerHTML = '<b>Không tải được bài làm.</b> ' + esc(err.message || err) +
          '<br><span class="muted">Bấm nút dưới để mở thẳng file hứng. Nếu thấy dòng chữ bắt đầu bằng <code>{"ok":true</code> thì file hứng vẫn chạy; nếu thấy trang báo lỗi của Google, hãy chụp lại trang đó.</span>' +
          '<div style="margin-top:8px"><a class="btn small primary" target="_blank" rel="noopener" href="' + esc(test) + '">Mở file hứng để kiểm tra</a></div>';
      });
  }
  function teacherRender() {
    $('#tbName').textContent = T.name;
    $('#tbClass').textContent = T.cls + ' · lần ' + T.no;
    writeAnswers(T.answers); setDisabled(true); HL.applyAll(T.hl || {});
    clearMarks(); ecHeader();
    for (var q = 1; q <= CORE.TOTAL_Q; q++) markQ(q);
    var ecKeys = [];
    for (var e = 26; e <= 30; e++) ecKeys.push((T.keys[e] || []).join(' / '));
    var ecTable = $('#examBody table.ec');
    if (ecTable) ecTable.insertAdjacentHTML('afterend', '<div id="ecKeys" class="tkey block"><b>Đáp án 26–30</b> (HS ghi theo thứ tự nào cũng được): ' + ecKeys.map(esc).join(' · ') + '</div>');
    teacherBanner(); teacherScore();
  }
  function keyText(q) { return (T.keys[q] || []).join('  /  '); }
  function markQ(q) {
    markOne(q, tEff(q), CORE.isBlank(q, T.answers[q]), tManual(q), T.keys[q] || [], true);
  }
  /* Đánh dấu 1 câu trên tờ đề. keys = null → không hiện đáp án (HS xem lại); interactive = nút chấm tay */
  function markOne(q, ok, blank, man, keys, interactive) {
    var m = CORE.META[q], el = document.getElementById('q' + q); if (!el) return;
    $$('[data-tq="' + q + '"]', el).forEach(function (x) { x.remove(); });
    if (el.tagName === 'TR') $$('.tres', el).forEach(function (x) { x.remove(); });
    var st = ok === 1 ? 'ok' : ok === 0.5 ? 'half' : (blank ? 'blank' : 'bad');
    var tag = interactive ? 'button' : 'span';
    var btn = '<' + tag + (interactive ? ' type="button"' : '') + ' class="tmk ' + st + (man ? ' manual' : '') + (interactive ? '' : ' static') + '" data-tq="' + q + '"' +
      (interactive ? ' title="Bấm để chấm tay câu ' + q + ' (Đúng → Nửa điểm → Sai)"' : '') + '>' +
      (ok === 1 ? ICON_OK : ok === 0.5 ? ICON_HALF : ICON_BAD) + '<span>' + tLabel(ok, blank) + '</span>' + (man ? '<i>chấm tay</i>' : '') + '</' + tag + '>';
    var kt = keys ? keys.join('  /  ') : '';
    var key = (keys && ok !== 1) ? '<span class="tkey" data-tq="' + q + '">Đáp án: <b>' + esc(kt) + '</b></span>' : '';
    $$('input, textarea', el).forEach(function (f) { f.classList.remove('r-ok', 'r-half', 'r-bad'); if (f.value && f.type !== 'radio') f.classList.add(ok === 1 ? 'r-ok' : ok === 0.5 ? 'r-half' : 'r-bad'); });
    if (m.type === 'choice' && el.querySelector('input[type=radio]')) {
      var ks = (keys || []).map(function (x) { return String(x).toUpperCase(); });
      $$('label.ch', el).forEach(function (l) {
        var inp = l.querySelector('input');
        l.classList.toggle('is-key', !!keys && ks.indexOf(inp.value.toUpperCase()) >= 0);
        l.classList.toggle('pick-ok', inp.checked && ok === 1);
        l.classList.toggle('pick-bad', inp.checked && ok !== 1);
      });
      el.insertAdjacentHTML(el.querySelector('.choices.word') ? 'beforeend' : 'afterbegin', btn);
    } else if (m.type === 'choice') {
      el.querySelector('input.letter').insertAdjacentHTML('afterend', btn + key);
    } else if (m.type === 'ec') {
      el.insertAdjacentHTML('beforeend', '<td class="tres">' + btn + '</td>');
    } else if (m.type === 'rw') {
      el.insertAdjacentHTML('afterbegin', btn);
      if (key) el.insertAdjacentHTML('beforeend', '<div class="tkey block" data-tq="' + q + '">Đáp án (phần điền): <b>' + esc(kt) + '</b></div>');
    } else {
      el.querySelector('input').insertAdjacentHTML('afterend', btn + key);
    }
  }
  function clearMarks() {
    $$('#examBody .tmk, #examBody .tkey, #examBody .tres, #ecKeys').forEach(function (x) { x.remove(); });
    $$('#examBody .r-ok, #examBody .r-half, #examBody .r-bad').forEach(function (x) { x.classList.remove('r-ok', 'r-half', 'r-bad'); });
    $$('#examBody .is-key, #examBody .pick-ok, #examBody .pick-bad').forEach(function (x) { x.classList.remove('is-key', 'pick-ok', 'pick-bad'); });
  }
  function ecHeader() {
    var ecHead = $('#examBody table.ec thead tr');
    if (ecHead && !ecHead.querySelector('.tres')) ecHead.insertAdjacentHTML('beforeend', '<th class="tres">Kết quả</th>');
    var eg = $('#examBody table.ec tr.eg'); if (eg && !eg.querySelector('.tres')) eg.insertAdjacentHTML('beforeend', '<td class="tres"></td>');
  }
  function colorNav(effFn, answers) {
    $$('#palGrid a').forEach(function (l) {
      var q = +l.dataset.p, ok = effFn(q), blank = CORE.isBlank(q, answers[q]);
      l.classList.remove('done'); l.classList.toggle('t-ok', ok === 1); l.classList.toggle('t-half', ok === 0.5); l.classList.toggle('t-bad', !ok && !blank); l.classList.toggle('t-blank', !ok && blank);
    });
    VIEWS.forEach(function (v, i) {
      var f = +v.dataset.from, t = +v.dataset.to, pts = 0;
      for (var q = f; q <= t; q++) pts += effFn(q);
      var b = $$('#secNav .sn')[i], r = pts / (t - f + 1);
      b.querySelector('.snc').textContent = String(pts).replace('.', ',') + '/' + (t - f + 1);
      b.classList.remove('full', 'some'); b.classList.toggle('t-good', r >= 0.8); b.classList.toggle('t-mid', r >= 0.5 && r < 0.8); b.classList.toggle('t-bad', r < 0.5);
    });
  }
  function teacherScore() {
    var s = T.sum;
    $('#reviewTag').innerHTML = '<b>' + fmtScore(s.score) + '</b>/20 · ' + s.correct + ' câu đúng' + (s.half ? ' · ' + s.half + ' nửa điểm' : '');
    var tp = $('#tParts');
    if (tp) tp.innerHTML = CORE.PARTS.map(function (p) { var x = s.parts[p.id]; return '<span class="chip">Part ' + p.id + ': <b>' + fmtScore(x.score) + '</b>/' + p.max + ' <span class="muted">(' + x.correct + '/' + x.total + (x.half ? ', ' + x.half + ' nửa' : '') + ')</span></span>'; }).join('');
    colorNav(tEff, T.answers);
  }
  function teacherBanner() {
    var h = '<div class="tb-row"><div><div class="tb-name">' + esc(T.name) + ' <span class="muted">– lần ' + esc(T.no) + '</span></div>' +
      '<div class="muted">' + esc(T.cls) + ' · nộp lúc ' + esc(T.time) + ' · làm trong ' + esc(T.dur) + ' phút' + (T.timeUp ? ' (hết giờ, tự nộp)' : '') + '</div></div>' +
      '<div class="tb-nav"><button class="btn small ghost" id="tPrev"' + (T.prev ? '' : ' disabled') + '>&larr; Bài trước</button><button class="btn small ghost" id="tNext"' + (T.next ? '' : ' disabled') + '>Bài sau &rarr;</button></div></div>' +
      '<div class="tb-parts" id="tParts"></div>' +
      '<div class="tb-row2"><span class="' + (T.outN ? 'warnc' : '') + '">Rời màn hình: <b>' + esc(T.outN) + ' lần</b> · ' + esc(T.outS) + ' giây</span>' +
      '<span class="legend2"><i class="lg ok"></i>Đúng <i class="lg half"></i>Nửa điểm <i class="lg bad"></i>Sai <i class="lg key"></i>Đáp án đúng <i class="lg hl"></i>HS tô sáng</span></div>';
    if (T.outLog && T.outLog.length) {
      h += '<details class="tlog"><summary>Nhật ký rời màn hình (' + T.outLog.length + ')</summary><ol>' + T.outLog.map(function (x) {
        return '<li>' + esc(x.t) + ' – ' + esc(x.type) + ' – ' + esc(x.s) + ' giây</li>';
      }).join('') + '</ol></details>';
    }
    h += '<p class="muted tnote">Bấm vào nút kết quả cạnh mỗi câu để chấm tay (Đúng → Nửa điểm → Sai); điểm trong Google Sheet cập nhật luôn.</p>';
    $('#reviewBanner').innerHTML = h;
    $('#tPrev').onclick = function () { if (T.prev) teacherLoad(T.prev, T.k); };
    $('#tNext').onclick = function () { if (T.next) teacherLoad(T.next, T.k); };
  }
  $('#examBody').addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('.tmk'); if (!b || mode !== 'teacher' || !T) return;
    ev.preventDefault();
    var q = +b.dataset.tq, c = tEff(q), val = c === 1 ? 0.5 : c === 0.5 ? 0 : 1;
    if (val === (T.auto[q] || 0)) val = null;
    b.disabled = true; b.classList.add('busy');
    apiGet({ api: 'override', sid: T.sid, k: T.k, q: q, val: val })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'lỗi');
        T.ov = res.ov || {}; T.sum = res.sum; markQ(q); teacherScore();
        toast('Câu ' + q + ': ' + tLabel(tEff(q), false) + '. Điểm mới ' + fmtScore(T.sum.score) + '/20.');
      })
      .catch(function (err) { b.disabled = false; b.classList.remove('busy'); toast('Không lưu được: ' + (err.message || err)); });
  });
  $('#btnNextWrong').onclick = function () {
    if (!T) return;
    var list = []; for (var q = 1; q <= 100; q++) if (tEff(q) < 1) list.push(q);
    if (!list.length) { toast('Không có câu sai.'); return; }
    var q2 = list[wrongPtr % list.length]; wrongPtr++;
    goToQ(q2);
  };

  /* ---------- khởi động ---------- */
  var QS = new URLSearchParams(location.search);
  if (QS.get('xem') && QS.get('k')) teacherLoad(QS.get('xem'), QS.get('k'));
  else { refreshStart(); retryPending(); }
  window.addEventListener('beforeunload', function (e) { if (mode === 'doing') { e.preventDefault(); e.returnValue = ''; } });
})();
