/* ===== Lõi dùng chung: cấu trúc đề + chấm điểm (chạy cả trên trình duyệt và Apps Script) ===== */
var EXAM_CORE = (function () {
  var EXAM_ID = 'OLY-ANH11-LCHN-2026';
  var EXAM_TITLE = 'Olympic Tiếng Anh 11 – Liên cụm trường THPT Hà Nội 2025–2026';
  var TOTAL_Q = 100;
  var MAX_SCORE = 20; // thang 20, mỗi câu 0.2 điểm

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

  var META = {};
  function set(a, b, obj) { for (var q = a; q <= b; q++) { var o = {}; for (var k in obj) o[k] = obj[k]; META[q] = o; } }
  set(1, 20, { type: 'choice', opts: ['A', 'B', 'C', 'D'] });
  set(21, 25, { type: 'text' });
  set(26, 30, { type: 'ec' });
  set(31, 45, { type: 'text' });
  set(46, 52, { type: 'choice', opts: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] });
  set(53, 58, { type: 'choice', opts: ['TRUE', 'FALSE', 'NOT GIVEN'] });
  set(59, 65, { type: 'text' });
  set(66, 75, { type: 'choice', opts: ['A', 'B', 'C', 'D', 'E'] });
  set(76, 80, { type: 'choice', opts: ['A', 'B', 'C', 'D'] });
  set(81, 90, { type: 'text' });
  var RW = {
    91: ['I only found out she had moved when I spoke to Jerry.', 'It wasn’t', ''],
    92: ['I find it amazing that he can’t even fry an egg.', 'What I', ''],
    93: ['We have not sat in the garden house since last summer.', 'The last', ''],
    94: ['My friend Albert has decided to buy a motorbike. His car was stolen last week.', 'My friend Albert,', ''],
    95: ['It was the first time that she had lied to her parents.', 'She had', ''],
    96: ['Your attitude will have to change if you want to succeed. (LEAF)', 'You have to', 'if you want to succeed.'],
    97: ['Carol wanted to celebrate when she got the promotion. (FELT)', 'Carol', 'when she got the promotion.'],
    98: ['They will expect you to wear a suit for the interview. (HAVE)', 'You', 'the interview.'],
    99: ['I like my new job, even if I have to spend much time on the phone. (DESPITE)', 'Despite', ', I like my new job.'],
    100: ['As a child, David was never in the habit of eating cornflakes. (USED)', 'As a child, David', 'cornflakes.']
  };
  for (var r in RW) META[r] = { type: 'rw', prompt: RW[r][0], prefix: RW[r][1], suffix: RW[r][2] };
  for (var e = 26; e <= 30; e++) META[e].hint = 'Ghi: lỗi -> sửa';

  /* Chuẩn hoá câu trả lời: chữ thường, dấu nháy, viết tắt, bỏ dấu câu, gộp khoảng trắng */
  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    s = s.replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"');
    s = s.replace(/\bcan't\b/g, 'can not').replace(/\bcannot\b/g, 'can not')
      .replace(/\bwon't\b/g, 'will not').replace(/\bshan't\b/g, 'shall not')
      .replace(/n't\b/g, ' not')
      .replace(/\bcant\b/g, 'can not').replace(/\bwont\b/g, 'will not')
      .replace(/\b(did|does|do|was|were|is|are|has|have|had|could|would|should)nt\b/g, '$1 not');
    s = s.replace(/[.,!?;:"()\[\]]/g, ' ').replace(/-/g, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }
  function normPair(p) {
    var i = String(p).indexOf('->');
    if (i < 0) return '';
    return norm(String(p).slice(0, i)) + ' -> ' + norm(String(p).slice(i + 2));
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

  /* Chấm: trả về {q: 0|1} */
  function grade(answers, keys) {
    answers = answers || {};
    var res = {};
    for (var q = 1; q <= TOTAL_Q; q++) {
      var m = META[q], a = answers[q], k = keys[q] || [];
      if (m.type === 'ec') continue;
      res[q] = 0;
      if (isBlank(q, a)) continue;
      var i;
      if (m.type === 'choice') {
        var A = String(a).trim().toUpperCase();
        for (i = 0; i < k.length; i++) if (String(k[i]).trim().toUpperCase() === A) res[q] = 1;
      } else if (m.type === 'text') {
        var n = norm(a);
        for (i = 0; i < k.length; i++) if (norm(k[i]) === n) res[q] = 1;
      } else if (m.type === 'rw') {
        var s = stripFix(q, a);
        for (i = 0; i < k.length; i++) if (norm(k[i]) === s) res[q] = 1;
      }
    }
    // Sửa lỗi 26-30: không phụ thuộc thứ tự, mỗi lỗi đáp án chỉ được tính 1 lần
    var used = {};
    for (var e = 26; e <= 30; e++) {
      res[e] = 0;
      var row = answers[e];
      if (!row || !String(row.m || '').trim() || !String(row.c || '').trim()) continue;
      var pair = norm(row.m) + ' -> ' + norm(row.c);
      for (var kq = 26; kq <= 30; kq++) {
        if (used[kq]) continue;
        var ks = keys[kq] || [], hit = false;
        for (var j = 0; j < ks.length; j++) if (normPair(ks[j]) === pair) hit = true;
        if (hit) { used[kq] = 1; res[e] = 1; break; }
      }
    }
    return res;
  }

  /* Tổng hợp điểm; overrides = {q: 0|1} do giáo viên chấm tay */
  function summarize(res, overrides) {
    overrides = overrides || {};
    var out = { correct: 0, score: 0, parts: {}, sections: [] };
    function eff(q) { return overrides[q] === 0 || overrides[q] === 1 ? overrides[q] : (res[q] || 0); }
    PARTS.forEach(function (p) {
      var c = 0;
      for (var q = p.from; q <= p.to; q++) c += eff(q);
      out.parts[p.id] = { correct: c, total: p.to - p.from + 1, score: Math.round(c * 2) / 10, max: p.max };
      out.correct += c;
    });
    SECTIONS.forEach(function (s) {
      var c = 0;
      for (var q = s.from; q <= s.to; q++) c += eff(q);
      out.sections.push({ title: s.title, from: s.from, to: s.to, correct: c, total: s.to - s.from + 1 });
    });
    out.score = Math.round(out.correct * 2) / 10;
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
    norm: norm, grade: grade, summarize: summarize, fmtAnswer: fmtAnswer,
    isBlank: isBlank, countAnswered: countAnswered
  };
})();
