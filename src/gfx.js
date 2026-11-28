/* ==================================================================
   LIBRERIA DI DISEGNO, comune a tutte le storie. 240x150 punti, solo
   bianco e nero: forme piene, sagome con il filo intorno, tratti,
   scritte a pixel. Le scene stanno nei file pix di ogni storia e si
   registrano con Pix.add(), Pix.addObjects() e Pix.setMap().
   ================================================================== */
var Pix = (function () {
  var W = 240, H = 150, PI = Math.PI;
  var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  /* tono: 0 bianco ... 16 nero (retino ordinato), oppure una trama con nome */
  function tone(t, x, y) {
    if (typeof t === "number") { return t <= 0 ? 0 : (t >= 16 ? 1 : (BAY[(y & 3) * 4 + (x & 3)] < t ? 1 : 0)); }
    switch (t) {
      case "h": return y & 1;
      case "h3": return y % 3 === 0 ? 1 : 0;
      case "v": return x & 1;
      case "v3": return x % 3 === 0 ? 1 : 0;
      case "d": return (x + y) % 4 === 0 ? 1 : 0;
      case "D": return (x + y) % 4 === 0 ? 0 : 1;
      case "e": return (x - y + 400) % 4 === 0 ? 1 : 0;
      case "brick": return (y % 7 === 0 || ((x + (Math.floor(y / 7) % 2) * 7) % 14 === 0)) ? 0 : 1;
      case "stone": return (y % 8 === 0 || ((x + (Math.floor(y / 8) % 2) * 9) % 18 === 0)) ? 1 : 0;
      case "dot": return (x % 4 === 0 && y % 4 === 0) ? 1 : 0;
      case "wdot": return (x % 4 === 2 && y % 4 === 2) ? 0 : 1;
    }
    return 0;
  }
  function h1(i) { var v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); }

  /* ---------- tela ---------- */
  function Gfx(w, h) { this.w = w; this.h = h; this.d = []; this.m = null; this.c = null; for (var i = 0; i < w * h; i++) { this.d[i] = 0; } }
  var G = Gfx.prototype;
  G.set = function (x, y, v) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) { return; }
    if (this.c && (x < this.c[0] || x > this.c[2] || y < this.c[1] || y > this.c[3])) { return; }
    this.d[y * this.w + x] = v; if (this.m) { this.m[y * this.w + x] = 1; }
  };
  G.px = function (x, y, t) { x = Math.round(x); y = Math.round(y); this.set(x, y, tone(t, x, y)); };
  G.flip = function (x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h && !(this.c && (x < this.c[0] || x > this.c[2] || y < this.c[1] || y > this.c[3]))) { this.d[y * this.w + x] = 1 - this.d[y * this.w + x]; } };
  G.hline = function (x0, x1, y, t) { x0 = Math.round(x0); x1 = Math.round(x1); y = Math.round(y); for (var x = x0; x <= x1; x++) { this.set(x, y, tone(t, x, y)); } };
  G.vline = function (x, y0, y1, t) { x = Math.round(x); y0 = Math.round(y0); y1 = Math.round(y1); for (var y = y0; y <= y1; y++) { this.set(x, y, tone(t, x, y)); } };
  G.rect = function (x0, y0, x1, y1, t) { y0 = Math.round(y0); y1 = Math.round(y1); for (var y = y0; y <= y1; y++) { this.hline(x0, x1, y, t); } };
  G.frame = function (x0, y0, x1, y1, t) { this.hline(x0, x1, y0, t); this.hline(x0, x1, y1, t); this.vline(x0, y0, y1, t); this.vline(x1, y0, y1, t); };
  G.line = function (x0, y0, x1, y1, t, th) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy, e2, n = 0;
    while (n++ < 2000) {
      this.set(x0, y0, tone(t, x0, y0));
      if (th) { this.set(x0 + 1, y0, tone(t, x0 + 1, y0)); this.set(x0, y0 + 1, tone(t, x0, y0 + 1)); }
      if (x0 === x1 && y0 === y1) { break; }
      e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  G.pline = function (p, t, th) { for (var i = 0; i < p.length - 1; i++) { this.line(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], t, th); } };
  G.ell = function (cx, cy, rx, ry, t) {
    var y, hw;
    for (y = -Math.floor(ry); y <= Math.floor(ry); y++) { hw = rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))); this.hline(Math.round(cx - hw), Math.round(cx + hw), Math.round(cy + y), t); }
  };
  G.arc = function (cx, cy, rx, ry, a0, a1, t) {
    var n = Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) * 1.6) + 2, i, a;
    for (i = 0; i <= n; i++) { a = a0 + (a1 - a0) * i / n; this.px(cx + rx * Math.cos(a), cy + ry * Math.sin(a), t); }
  };
  G.ring = function (cx, cy, rx, ry, t) { this.arc(cx, cy, rx, ry, 0, 2 * PI, t); };
  G.poly = function (p, t) {
    var minY = 1e9, maxY = -1e9, i, j, y, xs, a, b, x;
    for (i = 0; i < p.length; i++) { if (p[i][1] < minY) { minY = p[i][1]; } if (p[i][1] > maxY) { maxY = p[i][1]; } }
    for (y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      xs = [];
      for (i = 0, j = p.length - 1; i < p.length; j = i++) {
        a = p[i]; b = p[j];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) { xs.push(a[0] + (y + 0.5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      }
      xs.sort(function (m, n) { return m - n; });
      for (i = 0; i + 1 < xs.length; i += 2) { for (x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) { this.set(x, y, tone(t, x, y)); } }
    }
  };
  G.maskOn = function () { this.m = []; for (var i = 0; i < this.w * this.h; i++) { this.m[i] = 0; } };
  /* filo intorno a tutto cio' che e' stato disegnato da maskOn in poi */
  G.keyline = function (t) {
    var m = this.m, w = this.w, h = this.h, x, y, i;
    this.m = null;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        i = y * w + x;
        if (!m[i] && ((x > 0 && m[i - 1]) || (x < w - 1 && m[i + 1]) || (y > 0 && m[i - w]) || (y < h - 1 && m[i + w]))) { this.set(x, y, tone(t, x, y)); }
      }
    }
  };
  var FONT = { A: "25755", B: "65656", C: "34443", D: "65556", E: "74647", F: "74644", G: "34553", H: "55755", I: "72227", J: "11152", K: "55655", L: "44447", M: "57755",
    N: "75555", O: "25552", P: "65644", Q: "25563", R: "65655", S: "34216", T: "72222", U: "55557", V: "55552", W: "55775", X: "55255", Y: "55222", Z: "71247",
    "0": "75557", "1": "26227", "2": "61247", "3": "61216", "4": "55711", "5": "74616", "6": "34757", "7": "71222", "8": "75757", "9": "75716",
    ".": "00002", "-": "00700", ":": "02020", "?": "61202", " ": "00000" };
  G.text = function (x, y, s, t, sc) {
    var i, r, c, g, bits, a, b;
    sc = sc || 1;
    for (i = 0; i < s.length; i++) {
      g = FONT[s.charAt(i)] || FONT[" "];
      for (r = 0; r < 5; r++) {
        bits = parseInt(g.charAt(r), 8);
        for (c = 0; c < 3; c++) { if (bits & (4 >> c)) { for (a = 0; a < sc; a++) { for (b = 0; b < sc; b++) { this.px(x + (i * 4 + c) * sc + a, y + r * sc + b, t); } } } }
      }
    }
  };

  /* ---------- mattoni comuni ---------- */
  function rain(g, f, n, x0, y0, x1, y1, flip) {
    var i, x, y, j, w = x1 - x0 + 1, h = y1 - y0 + 1;
    for (i = 0; i < n; i++) {
      x = x0 + Math.floor((h1(i) * w + (w - (f * 5) % w))) % w; y = y0 + Math.floor(h1(i + 97) * h + f * 13) % h;
      for (j = 0; j < 4; j++) { if (y + j * 2 <= y1) { if (flip) { g.flip(x - j, y + j * 2); g.flip(x - j, y + j * 2 + 1); } else { g.px(x - j, y + j * 2, 0); g.px(x - j, y + j * 2 + 1, 0); } } }
    }
  }
  function waves(g, f, x0, x1, y0, y1) {
    var i, y, L, sp, off, x;
    for (i = 0; i < 40; i++) {
      y = y0 + 1 + i * 2 + Math.floor(i * i * 0.06); if (y > y1) { break; }
      L = 2 + Math.floor(i / 2); sp = L * 3 + 3; off = (f * 2 + i * 7) % sp;
      for (x = x0 - off; x <= x1; x += sp) { g.hline(Math.max(x, x0), Math.min(x + L - 1, x1), y, 0); }
    }
  }
  function smoke(g, x, y, f, n) {
    var j, sx;
    for (j = 0; j < n; j++) { sx = x + Math.round(2.4 * Math.sin((j + f * 2) * 0.42) + j * 0.1); if ((j + f) % 4 !== 0) { g.px(sx, y - j, 0); } if (j > n / 2 && (j + f) % 3 === 0) { g.px(sx + 1, y - j, 0); } }
  }
  /* figura in piedi: cappello, cappotto, filo intorno. cx = asse, fy = piedi, h = altezza */
  function man(g, cx, fy, h, o) {
    var s = h / 100, ct = o.coat === undefined ? 16 : o.coat, ink = ct > 8 ? 0 : 16, r = Math.max(1, Math.round(2.4 * s));
    function X(a) { return Math.round(cx + a * s); }
    function Y(b) { return Math.round(fy + b * s); }
    function P(a) { var q = [], i; for (i = 0; i < a.length; i += 2) { q.push([X(a[i]), Y(a[i + 1])]); } return q; }
    g.maskOn();
    g.poly(P([-10, -30, -2, -30, -2, -3, -10, -3]), 16); g.poly(P([2, -30, 10, -30, 10, -3, 2, -3]), 16);
    g.ell(X(-7), Y(-2), Math.max(2, Math.round(6 * s)), Math.max(1, Math.round(2 * s)), 16); g.ell(X(7), Y(-2), Math.max(2, Math.round(6 * s)), Math.max(1, Math.round(2 * s)), 16);
    g.poly(P([-9, -73, 9, -73, 16, -67, 17, -42, 16, -25, -16, -25, -17, -42, -16, -67]), ct);
    g.poly(P([-16, -67, -22, -41, -17, -39, -12, -59]), ct);
    if (o.arms === "smoke") { g.poly(P([15, -67, 23, -51, 18, -48, 11, -61]), ct); g.poly(P([23, -51, 13, -70, 9, -67, 18, -48]), ct); }
    else { g.poly(P([16, -67, 22, -41, 17, -39, 12, -59]), ct); }
    g.poly(P([-7, -72, 7, -72, 5, -77, -5, -77]), ct);
    g.ell(X(0), Y(-81), Math.max(2, Math.round(6 * s)), Math.max(2, Math.round(7 * s)), o.face ? 0 : 16);
    if (o.hat === "kepi") { g.poly(P([-7, -97, 7, -97, 7, -88, -7, -88]), 16); g.poly(P([-7, -90, 11, -90, 11, -87, -7, -87]), 16); }
    else { g.poly(P([-7, -102, 7, -102, 8, -90, -8, -90]), 16); g.ell(X(0), Y(-89), Math.max(3, Math.round(13 * s)), Math.max(1, Math.round(2 * s)), 16); }
    g.keyline(o.key === undefined ? 0 : o.key);
    if (o.hat !== "kepi" && s > 0.5) { g.hline(X(-7), X(7), Y(-93), 0); }
    if (o.hat === "kepi" && s > 0.3) { g.hline(X(-6), X(6), Y(-91), 0); }
    if (o.face) { g.hline(X(-5), X(5), Y(-86), 9); g.px(X(-3), Y(-82), 16); g.px(X(3), Y(-82), 16); g.hline(X(-2), X(2), Y(-76), 16); }
    if (s > 0.42) { g.line(X(0), Y(-57), X(-6), Y(-72), ink); g.line(X(0), Y(-57), X(6), Y(-72), ink); g.line(X(0), Y(-57), X(0), Y(-26), ink); }
    if (s > 0.8) { g.px(X(-3), Y(-48), ink); g.px(X(-3), Y(-38), ink); g.px(X(3), Y(-48), ink); g.px(X(3), Y(-38), ink); g.line(X(-1), Y(-29), X(-1), Y(-4), 0); g.line(X(1), Y(-29), X(1), Y(-4), 0); }
    if (o.belt) { g.hline(X(-16), X(16), Y(-50), ink); g.rect(X(-2), Y(-51), X(2), Y(-49), ink); }
    if (o.env) { g.rect(X(-31), Y(-45), X(-21), Y(-37), 0); g.frame(X(-31), Y(-45), X(-21), Y(-37), 16); g.line(X(-31), Y(-45), X(-26), Y(-41), 16); g.line(X(-21), Y(-45), X(-26), Y(-41), 16); }
    else { g.ell(X(-19), Y(-38), r, r, ct > 8 ? 0 : 16); }
    if (o.arms === "smoke") {
      g.ell(X(10), Y(-70), r, r, 0); g.line(X(11), Y(-72), X(16), Y(-75), 0);
      if (o.f % 3 !== 2) { g.px(X(17), Y(-76), 0); g.px(X(18), Y(-76), 0); }
      smoke(g, X(18), Y(-79), o.f, Math.round(30 * s));
    } else { g.ell(X(19), Y(-38), r, r, ct > 8 ? 0 : 16); }
  }

  /* ================= ADA CORVI, fototessera ================= */
  function ritratto(g, f) {
    var y, x, i;
    g.rect(0, 0, 63, 79, 7); g.ell(32, 40, 30, 36, 4); g.ell(32, 38, 22, 26, 2);
    /* spalle e trench */
    g.maskOn(); g.poly([[6, 79], [8, 66], [20, 58], [44, 58], [56, 66], [58, 79]], 2); g.keyline(16);
    g.line(32, 66, 32, 79, 16); g.px(29, 70, 16); g.px(29, 76, 16); g.px(35, 70, 16); g.px(35, 76, 16); g.line(10, 66, 18, 62, 16); g.line(54, 66, 46, 62, 16);
    /* capelli */
    g.maskOn(); g.ell(32, 38, 15, 17, 16); g.keyline(0);
    /* collo e viso */
    g.rect(27, 48, 37, 60, 0); g.rect(34, 50, 37, 60, 6); g.hline(27, 37, 55, 9);
    g.maskOn(); g.ell(32, 40, 10, 13, 0); g.keyline(16);
    for (y = 30; y < 53; y++) { for (x = 36; x < 43; x++) { if ((x - 32) * (x - 32) / 100 + (y - 40) * (y - 40) / 169 < 0.92) { g.px(x, y, x > 38 ? 7 : 3); } } }
    g.arc(22, 40, 3, 9, 1.2, 4.2, 0); g.arc(43, 42, 3, 8, -1.2, 1.2, 0); g.arc(20, 46, 4, 6, 0.6, 2.4, 0);
    /* occhi, sopracciglia, naso, bocca */
    g.hline(25, 29, 38, 16); g.hline(26, 28, 39, 16); g.px(27, 39, 0); g.hline(34, 38, 38, 16); g.hline(35, 37, 39, 16); g.px(36, 39, 0);
    g.line(24, 35, 29, 34, 16); g.line(34, 34, 39, 35, 16);
    g.line(32, 38, 33, 44, 9); g.hline(31, 34, 45, 16); g.px(30, 44, 16);
    g.hline(28, 36, 49, 16); g.px(29, 48, 16); g.px(31, 48, 16); g.px(33, 48, 16); g.px(35, 48, 16); g.hline(29, 35, 50, 16); g.hline(30, 34, 51, 9);
    g.px(22, 47, 0); g.px(22, 48, 0);
    /* cappello di feltro, un po' di sbieco */
    g.maskOn(); g.poly([[19, 26], [22, 10], [30, 7], [40, 8], [46, 22]], 16); g.poly([[9, 27], [50, 19], [57, 23], [54, 27], [12, 33]], 16); g.keyline(0);
    g.poly([[20, 22], [45, 17], [46, 20], [20, 25]], 0); g.rect(40, 16, 44, 21, 16); g.px(42, 18, 0);
    g.poly([[23, 31], [42, 28], [42, 33], [23, 35]], 9);
    /* bavero alzato */
    g.maskOn(); g.poly([[16, 62], [26, 51], [31, 64], [22, 74]], 0); g.poly([[48, 62], [38, 51], [33, 64], [42, 74]], 0); g.keyline(16);
    g.line(26, 52, 29, 62, 9); g.line(38, 52, 35, 62, 9);
    /* sigaretta */
    g.line(36, 50, 46, 53, 0); g.line(36, 51, 46, 54, 16); if (f % 3 !== 2) { g.px(47, 53, 0); g.px(48, 53, 0); }
    smoke(g, 49, 50, f, 26);
    /* timbro a secco e bordo */
    g.arc(6, 74, 15, 15, -1.5, 0.1, 16); g.arc(6, 74, 12, 12, -1.5, 0.1, 16); for (i = 0; i < 6; i++) { g.px(6 + 13.5 * Math.cos(-1.4 + i * 0.26), 74 + 13.5 * Math.sin(-1.4 + i * 0.26), 0); }
    g.frame(0, 0, 63, 79, 16); g.frame(1, 1, 62, 78, 0); g.frame(2, 2, 61, 77, 16);
  }

  /* ================= OGGETTI: tavolette 120x75 con il cartellino ================= */
  var OW = 120, OH = 75, NREP = 0;
  function plate(label, bg, draw) {
    var n = ++NREP, num = (n < 10 ? "0" : "") + n;
    return function (g, f) {
      g.rect(0, 0, 119, 74, bg === undefined ? 2 : bg);
      draw(g, f);
      g.c = null; g.rect(0, 66, 119, 74, 16); g.text(3, 68, "N." + num + " " + label, 0, 1); g.frame(0, 0, 119, 74, 16);
    };
  }
  /* testo inciso: un filo chiaro sotto, il segno scuro sopra */
  function carve(g, x, y, s, sc) { g.text(x + 1, y + 1, s, 0, sc); g.text(x, y, s, 16, sc); }
  function shadow(g, x0, x1, y) { g.hline(x0 + 2, x1 + 2, y, 12); g.hline(x0 + 3, x1 + 3, y + 1, 6); }

  /* ---------- ritratti a mezzo busto ---------- */
  function bust(g, cx, cy, s, o) {
    function X(a) { return Math.round(cx + a * s); }
    function Y(b) { return Math.round(cy + b * s); }
    var ct = o.coat === undefined ? 16 : o.coat;
    g.maskOn();
    g.poly([[X(-40), Y(60)], [X(-36), Y(34)], [X(-16), Y(24)], [X(16), Y(24)], [X(36), Y(34)], [X(40), Y(60)]], ct);
    if (o.hair) { g.ell(X(0), Y(-2), Math.round(14 * s), Math.round(17 * s), 16); g.ell(X(9), Y(-14), Math.round(6 * s), Math.round(6 * s), 16); }
    g.keyline(o.key === undefined ? 0 : o.key);
    g.rect(X(-5), Y(12), X(5), Y(26), 0); g.hline(X(-5), X(5), Y(22), 9);
    g.ell(X(0), Y(0), Math.round(11 * s), Math.round(14 * s), 0); g.ring(X(0), Y(0), Math.round(11 * s), Math.round(14 * s), 16);
    if (o.hair) { g.poly([[X(-12), Y(-2)], [X(-10), Y(-12)], [X(0), Y(-15)], [X(10), Y(-12)], [X(12), Y(-2)], [X(6), Y(-9)], [X(-6), Y(-9)]], 16); }
    g.hline(X(-6), X(-2), Y(-2), 16); g.hline(X(2), X(6), Y(-2), 16);
    g.px(X(-4), Y(1), 16); g.px(X(4), Y(1), 16); g.px(X(-3), Y(1), 16); g.px(X(3), Y(1), 16);
    g.vline(X(0), Y(1), Y(6), 9); g.px(X(1), Y(6), 16);
    g.hline(X(-3), X(3), Y(9), 16);
    if (o.tired) { g.px(X(-5), Y(3), 9); g.px(X(5), Y(3), 9); g.hline(X(-4), X(-2), Y(4), 9); g.hline(X(2), X(4), Y(4), 9); }
    if (o.mous) { g.rect(X(-5), Y(7), X(5), Y(8), 16); g.px(X(-6), Y(9), 16); g.px(X(6), Y(9), 16); }
    if (o.smirk) { g.px(X(4), Y(8), 16); }
    if (o.glasses) { g.ring(X(-4), Y(1), Math.max(2, Math.round(3 * s)), Math.max(2, Math.round(3 * s)), 16); g.ring(X(4), Y(1), Math.max(2, Math.round(3 * s)), Math.max(2, Math.round(3 * s)), 16); g.hline(X(-1), X(1), Y(0), 16); }
    if (o.hat === "fedora") { g.maskOn(); g.poly([[X(-10), Y(-10)], [X(10), Y(-10)], [X(9), Y(-24)], [X(-9), Y(-24)]], o.hatT || 16); g.ell(X(0), Y(-10), Math.round(20 * s), Math.round(3 * s), o.hatT || 16); g.keyline(0); g.hline(X(-9), X(9), Y(-14), o.hatT ? 16 : 0); }
    if (o.hat === "kepi") { g.maskOn(); g.rect(X(-11), Y(-24), X(11), Y(-11), 16); g.poly([[X(-11), Y(-11)], [X(16), Y(-11)], [X(14), Y(-8)], [X(-11), Y(-8)]], 16); g.keyline(0); g.hline(X(-10), X(10), Y(-14), 0); g.ell(X(0), Y(-19), 2, 2, 0); }
    if (o.cap) { g.maskOn(); g.ell(X(0), Y(-12), Math.round(13 * s), Math.round(5 * s), 16); g.poly([[X(-4), Y(-11)], [X(16), Y(-11)], [X(14), Y(-8)], [X(-4), Y(-8)]], 16); g.keyline(0); }
    if (o.lapels) { g.line(X(-5), Y(24), X(-12), Y(60), o.lapels, 1); g.line(X(5), Y(24), X(12), Y(60), o.lapels, 1); g.poly([[X(-3), Y(24)], [X(3), Y(24)], [X(2), Y(50)], [X(-2), Y(50)]], o.tie || 9); }
    if (o.collarUp) { g.poly([[X(-14), Y(24)], [X(-7), Y(8)], [X(-5), Y(26)]], ct); g.poly([[X(14), Y(24)], [X(7), Y(8)], [X(5), Y(26)]], ct); }
    if (o.scarf) { g.poly([[X(-8), Y(22)], [X(8), Y(22)], [X(6), Y(28)], [X(-6), Y(28)]], o.scarf); g.poly([[X(2), Y(26)], [X(7), Y(26)], [X(9), Y(46)], [X(4), Y(46)]], o.scarf); }
    if (o.shawl) { g.poly([[X(-36), Y(34)], [X(-16), Y(24)], [X(0), Y(40)], [X(16), Y(24)], [X(36), Y(34)], [X(30), Y(46)], [X(0), Y(56)], [X(-30), Y(46)]], o.shawl); }
    if (o.smoke) { g.line(X(3), Y(9), X(14), Y(12), 0, 1); if (o.f % 2) { g.px(X(15), Y(12), 0); } smoke(g, X(15), Y(10), o.f, Math.round(26 * s)); }
  }

  function stars(g, f, x0, x1, y0, y1, n) {
    var i, x, y;
    for (i = 0; i < n; i++) { x = x0 + Math.floor(h1(i + 3) * (x1 - x0)); y = y0 + Math.floor(h1(i + 41) * (y1 - y0)); if ((i + f) % 6 !== 0) { g.px(x, y, 0); } if (i % 11 === 0) { g.px(x + 1, y, 0); g.px(x - 1, y, 0); g.px(x, y - 1, 0); g.px(x, y + 1, 0); } }
  }
  function sky(g, y0, y1, a, b) { for (var y = y0; y <= y1; y++) { g.hline(0, 239, y, Math.round(a + (b - a) * (y - y0) / Math.max(1, y1 - y0))); } }
  /* donna in piedi: scialle, gonna lunga, crocchia */
  function woman(g, cx, fy, h, t, key) {
    var s = h / 100;
    function P(a) { var q = [], i; for (i = 0; i < a.length; i += 2) { q.push([Math.round(cx + a[i] * s), Math.round(fy + a[i + 1] * s)]); } return q; }
    g.maskOn();
    g.poly(P([-15, 0, 15, 0, 10, -46, -10, -46]), t);
    g.poly(P([-10, -46, 10, -46, 13, -68, 6, -73, -6, -73, -13, -68]), t);
    g.poly(P([-16, -66, 16, -66, 11, -48, 0, -40, -11, -48]), t);
    g.poly(P([-4, -72, 4, -72, 3, -77, -3, -77]), t);
    g.ell(Math.round(cx), Math.round(fy - 83 * s), Math.max(2, Math.round(6 * s)), Math.max(2, Math.round(7 * s)), t);
    g.ell(Math.round(cx + 4 * s), Math.round(fy - 89 * s), Math.max(1, Math.round(3 * s)), Math.max(1, Math.round(3 * s)), t);
    g.keyline(key);
  }

  /* ---------- registro delle scene ---------- */
  var SC = { ritratto: { w: 64, h: 80, n: 12, draw: ritratto } }, MAP = { draw: null, place: {} };
  function add(o) { for (var k in o) { if (o.hasOwnProperty(k)) { SC[k] = o[k]; } } }
  function addObjects(obj, names) { for (var i = 0; i < names.length; i++) { SC["o_" + names[i]] = { w: OW, h: OH, n: 1, draw: obj[names[i]] }; } }
  function setMap(draw, place) { MAP.draw = draw; MAP.place = place; }
  function drawMap(g, st) { return MAP.draw(g, st); }
  function render(id, f) { var sc = SC[id], g = new Gfx(sc.w, sc.h); sc.draw(g, f % sc.n); g.c = null; return g; }

  /* ---------- dal disegno al canvas ---------- */
  function sized(w, h, cssW) {
    var k = Math.max(1, Math.floor(cssW / w)), c = document.createElement("canvas");
    c.width = w * k; c.height = h * k;
    if (k === 1 && cssW > w * 1.2) { c.style.width = Math.floor(cssW) + "px"; }
    return c;
  }
  /* Si ingrandisce a mano, punto per punto, e si scrive con putImageData: i browser vecchi
     (Kindle) sbagliano drawImage da tela a tela quando c'è di mezzo un ingrandimento. */
  var big = {}, mapN = 0;
  function blit(c, ctx, key, g) {
    var k = c.width / g.w, ck = key + "@" + k, img = big[ck], d, x, y, i, o, v, dx, dy, W2 = c.width;
    if (!img) {
      img = ctx.createImageData(c.width, c.height); d = img.data;
      for (y = 0; y < g.h; y++) {
        for (x = 0; x < g.w; x++) {
          v = g.d[y * g.w + x];
          for (dy = 0; dy < k; dy++) {
            o = ((y * k + dy) * W2 + x * k) * 4;
            for (dx = 0; dx < k; dx++) { i = o + dx * 4; d[i] = v ? 17 : 241; d[i + 1] = v ? 17 : 240; d[i + 2] = v ? 17 : 234; d[i + 3] = 255; }
          }
        }
      }
      big[ck] = img;
    }
    ctx.putImageData(img, 0, 0);
  }
  var raw = {};
  function grid(id, f) { var key = id + "/" + (f % SC[id].n); if (!raw[key]) { raw[key] = render(id, f); } return raw[key]; }
  function make(id, cssW) {
    var sc = SC[id], c = sized(sc.w, sc.h, cssW), ctx = c.getContext("2d");
    c._paint = function (f) { blit(c, ctx, id + "/" + (f % sc.n), grid(id, f)); };
    c._paint(0);
    return c;
  }
  function makeMap(st, cssW) {
    var g = new Gfx(W, H), here = drawMap(g, st), c = sized(W, H, cssW), ctx = c.getContext("2d"), k = c.width / W, key;
    for (key in big) { if (key.indexOf("mappa") === 0) { delete big[key]; } }
    key = "mappa" + (++mapN);
    c._paint = function (f) {
      blit(c, ctx, key, g);
      if (MAP.place[here]) { ctx.fillStyle = (f % 2) ? "#f1f0ea" : "#111111"; ctx.fillRect((MAP.place[here][0] - 2) * k, (MAP.place[here][1] - 2) * k, 5 * k, 5 * k); }
    };
    c._paint(0);
    return c;
  }

  return { make: make, makeMap: makeMap, scenes: SC, render: render, Gfx: Gfx, drawMap: drawMap, add: add, addObjects: addObjects, setMap: setMap,
    kit: { W: W, H: H, PI: PI, h1: h1, tone: tone, rain: rain, waves: waves, smoke: smoke, man: man, plate: plate, carve: carve, shadow: shadow, bust: bust, stars: stars, sky: sky, woman: woman } };
})();
