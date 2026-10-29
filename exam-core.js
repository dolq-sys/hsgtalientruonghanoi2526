/* ===== Lõi dùng chung: cấu trúc đề + chấm điểm (chạy cả trên trình duyệt và Apps Script) ===== */
var EXAM_CORE = (function () {
  var EXAM_ID = 'OLY-ANH11-LCHN-2026';
  var EXAM_TITLE = 'Olympic Tiếng Anh 11 – Liên cụm trường THPT Hà Nội 2025–2026';
  var TOTAL_Q = 100;
  var MAX_SCORE = 20; // thang 20, mỗi câu 0.2 điểm (nửa câu = 0.1)

  var PARTS = [
    { id: 'A', name: 'Part A – Phonetics', from: 1, to: 10, max: 2 },
    { id: 'B', name: 'Part B – Lexico-grammar', from: 11, to: 35, max: 5 },
    { id: 'C', name: 'Part C – Reading', from: 36, to: 75, max: 8 },
    { id: 'D', name: 'Part D – Writing', from: 76, to: 100, max: 5 }
  ];

  var SECTIONS = [
    { from: 1, to: 5, title: 'A.I – Pronunciation' },
    { from: 6, to: 10, title: 'A.II – Stress' },
    { from: 11, to: 20, title: 'B.I – Multiple choice' },
    { from: 21, to: 25, title: 'B.II – Word form (Voices of the Poor)' },
    { from: 26, to: 30, title: 'B.III – Error correction (Black carbon)' },
    { from: 31, to: 35, title: 'B.IV – Verb + preposition' },
    { from: 36, to: 45, title: 'C.I – Open cloze (Mindfulness)' },
    { from: 46, to: 52, title: 'C.II – Gapped text (To Buy or Not to Buy)' },
    { from: 53, to: 58, title: 'C.III – True / False / Not Given' },
    { from: 59, to: 61, title: 'C.III – Sentence completion' },
    { from: 62, to: 65, title: 'C.III – Summary completion' },
    { from: 66, to: 75, title: 'C.IV – Matching (Theme parks)' },
    { from: 76, to: 80, title: 'D.I – Arrangement' },
    { from: 81, to: 90, title: 'D.II – Press release' },
    { from: 91, to: 95, title: 'D.III – Sentence transformation' },
    { from: 96, to: 100, title: 'D.IV – Key word transformation' }
  ];

  /* type: choice | text | ec | rw ;  partial: sai nhẹ được nửa điểm ;  strict: bài đọc – đúng chính tả 100% */
  var META = {};
  function set(a, b, obj) { for (var q = a; q <= b; q++) { var o = {}; for (var k in obj) o[k] = obj[k]; META[q] = o; } }
  set(1, 20, { type: 'choice', opts: ['A', 'B', 'C', 'D'] });
  set(21, 25, { type: 'text', partial: true });
  set(26, 30, { type: 'ec' });
  set(31, 35, { type: 'text', partial: true });
  set(36, 45, { type: 'text', strict: true });
  set(46, 52, { type: 'choice', opts: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] });
  set(53, 58, { type: 'choice', opts: ['TRUE', 'FALSE', 'NOT GIVEN'] });
  set(59, 65, { type: 'text', strict: true });
  set(66, 75, { type: 'choice', opts: ['A', 'B', 'C', 'D', 'E'] });
  set(76, 80, { type: 'choice', opts: ['A', 'B', 'C', 'D'] });
  set(81, 90, { type: 'text', partial: true });
  var RW = {
    91: ['I only found out she had moved when I spoke to Jerry.', 'It wasn’t', '', ''],
    92: ['I find it amazing that he can’t even fry an egg.', 'What I', '', ''],
    93: ['We have not sat in the garden house since last summer.', 'The last', '', ''],
    94: ['My friend Albert has decided to buy a motorbike. His car was stolen last week.', 'My friend Albert,', '', ''],
    95: ['It was the first time that she had lied to her parents.', 'She had', '', ''],
    96: ['Your attitude will have to change if you want to succeed.', 'You have to', 'if you want to succeed.', 'LEAF'],
    97: ['Carol wanted to celebrate when she got the promotion.', 'Carol', 'when she got the promotion.', 'FELT'],
    98: ['They will expect you to wear a suit for the interview.', 'You', 'the interview.', 'HAVE'],
    99: ['I like my new job, even if I have to spend much time on the phone.', 'Despite', ', I like my new job.', 'DESPITE'],
    100: ['As a child, David was never in the habit of eating cornflakes.', 'As a child, David', 'cornflakes.', 'USED']
  };
  var MUST = { 96: ['leaf'], 97: ['felt'], 98: ['have'], 100: ['used', 'use'] };
  for (var r in RW) META[r] = { type: 'rw', partial: true, prompt: RW[r][0], prefix: RW[r][1], suffix: RW[r][2], word: RW[r][3], must: MUST[r] || null };

  /* ---------- chuẩn hoá ---------- */
  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    s = s.replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"');
    s = s.replace(/\bcan't\b/g, 'can not').replace(/\bcannot\b/g, 'can not')
      .replace(/\bwon't\b/g, 'will not').replace(/\bshan't\b/g, 'shall not')
      .replace(/n't\b/g, ' not')
      .replace(/\bcant\b/g, 'can not').replace(/\bwont\b/g, 'will not')
      .replace(/\b(did|does|do|was|were|is|are|has|have|had|could|would|should)nt\b/g, '$1 not');
    s = s.replace(/[.,!?;:"()\[\]\/]/g, ' ').replace(/-/g, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }
  /* "(a|b|)" trong đáp án = một trong các lựa chọn (để trống = có thể bỏ) */
  function expand(k) {
    var parts = String(k).split(/(\([^()]*\))/), out = [''];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i]; if (p === '') continue;
      var alts = /^\(.*\)$/.test(p) ? p.slice(1, -1).split('|') : [p], next = [];
      for (var a = 0; a < out.length && next.length < 600; a++)
        for (var b = 0; b < alts.length; b++) next.push(out[a] + alts[b]);
      out = next;
    }
    return out;
  }
  var _cache = {};
  function variants(list) {
    var key = list.join('\u0001');
    if (_cache[key]) return _cache[key];
    var seen = {}, out = [];
    list.forEach(function (k) { expand(k).forEach(function (v) { var n = norm(v); if (n && !seen[n]) { seen[n] = 1; out.push(n); } }); });
    return (_cache[key] = out);
  }
  function stripFix(q, ans) {
    var s = norm(ans), m = META[q];
    var pre = norm(m.prefix), suf = norm(m.suffix);
    if (pre && (s === pre || s.indexOf(pre + ' ') === 0)) s = s.slice(pre.length).trim();
    if (suf && (s === suf || s.slice(-(suf.length + 1)) === ' ' + suf)) s = s.slice(0, s.length - suf.length).trim();
    return s;
  }
  function isBlank(q, a) {
    if (a == null) return true;
    if (META[q].type === 'ec') return !(a.m || a.c || a.l);
    return String(a).trim() === '';
  }

  /* ---------- so khớp "gần đúng" để cho nửa điểm ---------- */
  var FUNC = { a: 1, an: 1, the: 1, to: 1, at: 1, on: 1, in: 1, of: 1, for: 1, with: 1, by: 1, from: 1, into: 1, onto: 1, up: 1, out: 1, off: 1, about: 1, that: 1, as: 1, over: 1, down: 1, away: 1, back: 1, through: 1, across: 1 };
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function bases(w) { // các dạng gốc có thể có của một từ
    var out = {}, c = [w];
    if (/s$/.test(w)) c.push(w.slice(0, -1));
    if (/es$/.test(w)) c.push(w.slice(0, -2));
    if (/d$/.test(w)) c.push(w.slice(0, -1));
    if (/ed$/.test(w)) c.push(w.slice(0, -2));
    if (/ing$/.test(w)) { c.push(w.slice(0, -3)); c.push(w.slice(0, -3) + 'e'); }
    if (/(ies|ied)$/.test(w)) c.push(w.slice(0, -3) + 'y');
    c.slice().forEach(function (x) { if (/([bcdfghjklmnpqrstvz])\1$/.test(x)) c.push(x.slice(0, -1)); });
    c.forEach(function (x) { if (x.length >= 2) { out[x] = 1; out[x.replace(/e$/, '')] = 1; } });
    return out;
  }
  function minorPair(a, b) { // hai từ khác nhau nhưng chỉ là lỗi nhẹ (thiếu s/ed/ing, sai 1 chữ cái)
    var A = bases(a), B = bases(b);
    for (var k in A) if (B[k]) return true;
    var L = Math.min(a.length, b.length);
    return L >= 4 && lev(a, b) <= 1;
  }
  /* chi phí sửa giữa 2 dãy từ: lỗi nhẹ = 1, lỗi nặng = 2 */
  function cost(x, y) {
    var m = x.length, n = y.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = []; d[i][0] = i === 0 ? 0 : d[i - 1][0] + (FUNC[x[i - 1]] ? 1 : 2); }
    for (j = 1; j <= n; j++) d[0][j] = d[0][j - 1] + (FUNC[y[j - 1]] ? 1 : 2);
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      var sub = x[i - 1] === y[j - 1] ? 0 : (minorPair(x[i - 1], y[j - 1]) ? 1 : 2);
      d[i][j] = Math.min(d[i - 1][j] + (FUNC[x[i - 1]] ? 1 : 2), d[i][j - 1] + (FUNC[y[j - 1]] ? 1 : 2), d[i - 1][j - 1] + sub);
    }
    return d[m][n];
  }
  function scoreText(q, s, keys) {
    var v = variants(keys), i;
    for (i = 0; i < v.length; i++) if (v[i] === s) return 1;
    var m = META[q];
    if (!m.partial || !s) return 0;
    if (m.must) {
      var toks = s.split(' '), ok = false;
      m.must.forEach(function (w) { if (toks.indexOf(w) >= 0) ok = true; });
      if (!ok) return 0;
    }
    var st = s.split(' ');
    for (i = 0; i < v.length; i++) if (cost(st, v[i].split(' ')) <= 1) return 0.5;
    return 0;
  }

  /* Chấm: trả về {q: 0 | 0.5 | 1} */
  function grade(answers, keys) {
    answers = answers || {};
    var res = {};
    for (var q = 1; q <= TOTAL_Q; q++) {
      var m = META[q], a = answers[q], k = keys[q] || [];
      if (m.type === 'ec') continue;
      res[q] = 0;
      if (isBlank(q, a)) continue;
      if (m.type === 'choice') {
        var A = String(a).trim().toUpperCase();
        for (var i = 0; i < k.length; i++) if (String(k[i]).trim().toUpperCase() === A) res[q] = 1;
      } else if (m.type === 'text') {
        res[q] = scoreText(q, norm(a), k);
      } else if (m.type === 'rw') {
        res[q] = scoreText(q, stripFix(q, a), k);
      }
    }
    // Sửa lỗi 26-30: không phụ thuộc thứ tự, mỗi lỗi chỉ tính 1 lần
    var used = {};
    for (var e = 26; e <= 30; e++) {
      res[e] = 0;
      var row = answers[e];
      if (!row || !String(row.m || '').trim() || !String(row.c || '').trim()) continue;
      var pair = norm(row.m) + ' -> ' + norm(row.c);
      for (var kq = 26; kq <= 30; kq++) {
        if (used[kq]) continue;
        var hit = false;
        (keys[kq] || []).forEach(function (p) {
          expand(p).forEach(function (v) { var x = v.indexOf('->'); if (x >= 0 && norm(v.slice(0, x)) + ' -> ' + norm(v.slice(x + 2)) === pair) hit = true; });
        });
        if (hit) { used[kq] = 1; res[e] = 1; break; }
      }
    }
    return res;
  }

  /* Tổng hợp; overrides = {q: 0 | 0.5 | 1} do giáo viên chấm tay */
  function eff(res, ov, q) { var o = ov && ov[q]; return o === 0 || o === 0.5 || o === 1 ? o : (res[q] || 0); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function summarize(res, overrides) {
    var out = { correct: 0, half: 0, points: 0, score: 0, parts: {}, sections: [] };
    PARTS.forEach(function (p) {
      var c = 0, h = 0, pts = 0;
      for (var q = p.from; q <= p.to; q++) { var v = eff(res, overrides, q); pts += v; if (v === 1) c++; else if (v === 0.5) h++; }
      out.parts[p.id] = { correct: c, half: h, points: pts, total: p.to - p.from + 1, score: r1(pts * 0.2), max: p.max };
      out.correct += c; out.half += h; out.points += pts;
    });
    SECTIONS.forEach(function (s) {
      var pts = 0;
      for (var q = s.from; q <= s.to; q++) pts += eff(res, overrides, q);
      out.sections.push({ title: s.title, from: s.from, to: s.to, correct: pts, total: s.to - s.from + 1 });
    });
    out.score = r1(out.points * 0.2);
    return out;
  }

  function fmtAnswer(q, a) {
    if (isBlank(q, a)) return '';
    if (META[q].type === 'ec') return (a.l ? 'Dòng ' + a.l + ': ' : '') + (a.m || '…') + ' → ' + (a.c || '…');
    return String(a);
  }
  function countAnswered(answers) {
    var n = 0;
    for (var q = 1; q <= TOTAL_Q; q++) if (!isBlank(q, answers && answers[q])) n++;
    return n;
  }

  return {
    EXAM_ID: EXAM_ID, EXAM_TITLE: EXAM_TITLE, TOTAL_Q: TOTAL_Q, MAX_SCORE: MAX_SCORE,
    PARTS: PARTS, SECTIONS: SECTIONS, META: META,
    norm: norm, expand: expand, grade: grade, summarize: summarize, eff: eff, fmtAnswer: fmtAnswer,
    isBlank: isBlank, countAnswered: countAnswered
  };
})();
