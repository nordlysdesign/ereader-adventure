/* ==================================================================
   TAVOLE A PIXEL. 240x150 punti, solo bianco e nero.
   Ogni scena e' disegnata come si disegna a mano: forme piene, sagome
   con il filo bianco intorno, tratti, scritte a pixel, una sopra
   l'altra. Il secondo argomento di ogni scena e' il fotogramma.
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
  function code(a, b) {
    var s = "", i;
    for (i = 0; i < a; i++) { s += "10"; }
    s += "00";
    for (i = 0; i < b; i++) { s += "10"; }
    return s + "00000";
  }

  /* ================= IL GOLFO E IL FARO ================= */
  function gulf(pattern, win) {
    var LX = 176, LY = 27, TOP = [[64, 104], [96, 96], [130, 84], [160, 77], [200, 73], [239, 70]];
    function topY(x) { for (var i = 0; i < TOP.length - 1; i++) { if (x >= TOP[i][0] && x <= TOP[i + 1][0]) { return TOP[i][1] + (x - TOP[i][0]) / (TOP[i + 1][0] - TOP[i][0]) * (TOP[i + 1][1] - TOP[i][1]); } } return 104; }
    return function (g, f) {
      var on = pattern.charAt(f % pattern.length) === "1", x, y, i, hh, d, t;
      if (win) { g.c = [24, 12, 215, 120]; }
      g.rect(0, 0, 239, 103, 16);
      g.ell(44, 16, 54, 9, 13); g.ell(40, 12, 30, 4, 11); g.ell(128, 7, 64, 6, 13); g.ell(120, 5, 30, 3, 11); g.ell(210, 50, 40, 5, 14); g.ell(96, 40, 44, 4, 14); g.ell(30, 60, 36, 4, 14);
      g.poly([[0, 104], [0, 97], [18, 94], [40, 96], [58, 100], [70, 104]], 13); g.pline([[0, 97], [18, 94], [40, 96], [58, 100], [70, 104]], 9);
      for (i = 0; i < 8; i++) { g.px(4 + i * 7 + (i % 2) * 3, 98 + (i % 3), 0); }
      if (on) {
        g.ell(LX, LY, 17, 13, 13); g.ell(LX, LY, 11, 9, 8);
        for (x = 0; x < 240; x++) { d = Math.abs(x - LX); if (d < 7) { continue; } hh = 1 + d * 0.1; t = d < 36 ? 0 : (d < 80 ? 4 : (d < 130 ? 8 : 11)); g.vline(x, LY - hh, LY + hh, t); }
      }
      g.rect(0, 104, 239, 149, 16);
      waves(g, f, 0, 239, 104, 149);
      for (i = 0; i < 8; i++) { g.px(6 + i * 7 + (i % 2) * 3, 106 + (i % 2) * 2, 0); }
      if (on) { for (y = 106; y < 150; y += 2) { d = 1 + (y - 104) * 0.32; g.hline(LX - d + (y % 3), LX + d - ((y >> 1) % 3), y, 0); } }
      /* barche all'ormeggio, lontane */
      g.poly([[18, 102], [34, 102], [31, 105], [20, 105]], 16); g.hline(18, 34, 101, 0); g.vline(26, 86, 101, 0); g.line(26, 88, 33, 100, 9);
      g.poly([[40, 103], [52, 103], [50, 106], [42, 106]], 16); g.hline(40, 52, 102, 0); g.vline(46, 91, 102, 0);
      /* promontorio */
      g.poly([[64, 104], [96, 96], [130, 84], [160, 77], [200, 73], [239, 70], [239, 114], [150, 114], [100, 110]], 9);
      g.poly([[64, 104], [100, 110], [150, 114], [239, 114], [239, 104], [200, 100], [160, 99], [112, 99]], "D");
      for (i = 0; i < 9; i++) { x = 110 + i * 15; g.line(x, 100 + (i % 2), x - 3, 112, 16); }
      g.pline(TOP, 0);
      for (i = 0; i < 16; i++) { x = 100 + i * 8 + (i % 3) * 2; y = Math.round(topY(x)) + 4 + (i % 4) * 2; if (x < 166 || x > 186) { g.px(x, y, 0); g.px(x - 1, y - 1, 0); g.px(x + 1, y - 1, 0); } }
      g.pline([[176, 77], [168, 84], [150, 88], [128, 94], [104, 100]], 3);
      g.ell(84, 110, 6, 2, 16); g.hline(80, 88, 108, 0); g.ell(126, 115, 9, 2, 16); g.hline(119, 132, 113, 0); g.ell(54, 108, 4, 1, 16); g.hline(51, 57, 107, 0); g.ell(196, 116, 10, 2, 16); g.hline(188, 203, 114, 0);
      /* casa del guardiano */
      g.rect(206, 58, 230, 71, 0); g.poly([[202, 58], [218, 48], [234, 58]], 16); g.pline([[202, 58], [218, 48], [234, 58]], 0);
      g.rect(224, 45, 227, 52, 0); g.rect(210, 61, 215, 66, 16); g.vline(212, 61, 66, 0); g.hline(210, 215, 63, 0); g.rect(221, 62, 225, 71, 16); g.px(224, 67, 0);
      for (x = 186; x < 204; x += 4) { g.vline(x, 67, 73, 0); } g.hline(186, 203, 69, 0);
      /* torre */
      for (y = 38; y <= 76; y++) {
        hh = 4.5 + (y - 38) * 0.085; g.hline(LX - hh, LX + hh, y, 0);
        if (Math.floor((y - 38) / 7.7) % 2 === 1) { g.hline(Math.round(LX - hh) + 1, Math.round(LX + hh) - 1, y, 16); }
        else if (y % 3 === 0) { g.px(LX - 2 + (y % 2) * 3, y, 9); }
      }
      g.rect(LX, 41, LX, 43, 16); g.rect(LX, 56, LX, 58, 16); g.rect(LX - 2, 70, LX + 2, 76, 16); g.px(LX + 1, 73, 0);
      g.rect(166, 35, 186, 37, 0); g.hline(165, 187, 31, 0); for (x = 165; x <= 187; x += 3) { g.vline(x, 31, 35, 0); }
      g.rect(171, 21, 181, 31, on ? 0 : 9); g.frame(171, 21, 181, 31, 0); g.vline(174, 22, 30, on ? 16 : 0); g.vline(178, 22, 30, on ? 16 : 0);
      g.poly([[169, 21], [176, 14], [183, 21]], 0); g.vline(176, 8, 14, 0); g.px(175, 10, 0); g.px(177, 10, 0);
      if (!win) {
        g.poly([[37, 52], [45, 52], [72, 121], [8, 121]], 13); g.poly([[39, 52], [43, 52], [58, 121], [24, 121]], 10);
      }
      rain(g, f, win ? 60 : 80, 0, 0, 239, win ? 120 : 118, false);
      if (!win) {
        /* il molo in primo piano */
        g.poly([[0, 121], [100, 116], [137, 149], [0, 149]], 4);
        g.ell(40, 129, 30, 6, 0);
        for (i = 0; i < 9; i++) { t = i / 8; t = t * t * 0.6 + t * 0.4; g.line(0, 123 + t * 27, 100 + t * 37, 116 + t * 33, 16); }
        for (i = 0; i < 6; i++) { g.line(14 + i * 22, 122 - i * 0.6 + 3, 22 + i * 26, 149, 9); }
        g.line(101, 116, 138, 149, 0, 1); g.line(99, 117, 135, 149, 16);
        g.rect(29, 44, 31, 123, 0); g.vline(32, 44, 123, 16); g.rect(25, 121, 36, 126, 16); g.hline(25, 36, 120, 0);
        g.line(31, 47, 40, 42, 0); g.poly([[34, 42], [48, 42], [45, 48], [37, 48]], 0); g.rect(39, 48, 43, 51, 0); g.px(41, 50, 16); g.vline(41, 38, 41, 0);
        g.maskOn(); g.rect(86, 109, 93, 119, 16); g.ell(89.5, 108, 6, 2, 16); g.keyline(0);
        g.pline([[93, 114], [104, 119], [116, 130], [122, 142], [120, 149]], 16);
        g.ell(66, 129, 13, 2, 11);
        g.maskOn(); g.rect(55, 112, 75, 127, 16); g.rect(61, 108, 69, 111, 16); g.keyline(16);
        g.rect(63, 110, 67, 111, 4); g.vline(59, 113, 126, 0); g.vline(71, 113, 126, 0); g.rect(62, 117, 68, 121, 0); g.hline(63, 67, 119, 16);
        g.frame(55, 112, 75, 127, 16);
      } else {
        g.c = null;
        g.rect(0, 0, 239, 11, 13); g.rect(0, 121, 239, 149, 13); g.rect(0, 12, 23, 120, 13); g.rect(216, 12, 239, 120, 13);
        for (y = 4; y < 150; y += 8) { for (x = ((y >> 3) % 2) * 5 + 2; x < 240; x += 10) { if (x < 22 || x > 217 || y < 10 || y > 128) { g.px(x, y, 0); g.px(x + 1, y, 0); g.px(x, y + 1, 0); } } }
        g.frame(21, 9, 218, 123, 0); g.frame(22, 10, 217, 122, 0); g.frame(23, 11, 216, 121, 0); g.frame(24, 12, 215, 120, 16);
        g.rect(118, 12, 121, 120, 0); g.vline(117, 12, 120, 16); g.vline(122, 12, 120, 16);
        g.rect(24, 64, 215, 67, 0); g.hline(24, 215, 63, 16); g.hline(24, 215, 68, 16);
        for (i = 0; i < 46; i++) { x = 50 + Math.floor(h1(i) * 140); y = 14 + Math.floor(h1(i + 50) * 100); g.px(x, y, 0); if (i % 3 === 0) { g.px(x, y + 1, 0); g.px(x, y + 2, 0); g.px(x, y + 3, 0); } }
        for (i = 0; i < 2; i++) {
          d = i ? 193 : 25;
          g.rect(d, 13, d + 21, 119, 0);
          for (x = d + 2; x < d + 21; x += 4) { g.vline(x, 13, 116 + (x % 3), 16); g.vline(x + 1, 30, 100, 3); }
          g.vline(i ? d - 1 : d + 22, 13, 119, 16);
          g.rect(d, 78, d + 21, 80, 16);
        }
        g.rect(15, 123, 224, 127, 0); g.hline(15, 224, 128, 16); g.hline(15, 224, 122, 16);
        g.rect(136, 135, 238, 138, 0); g.hline(136, 238, 139, 16); for (x = 142; x < 236; x += 9) { g.rect(x, 140, x + 1, 149, 0); }
        g.ell(137, 134, 3, 3, 0); g.ell(237, 134, 3, 3, 0);
        g.ell(40, 149, 26, 9, 0); g.arc(40, 149, 26, 9, PI, 2 * PI, 16); g.line(22, 146, 58, 146, 7);
      }
    };
  }

  /* ================= LA LOCANDA ================= */
  function bar(g, f) {
    var sw = [0, 1, 0, -1][f % 4], i, x, y, t, cx = 78 + sw;
    g.rect(0, 0, 239, 149, 11);
    g.rect(0, 70, 239, 118, 13); for (x = 4; x < 240; x += 9) { g.vline(x, 71, 118, 16); } g.hline(0, 239, 69, 0); g.hline(0, 239, 70, 16);
    /* finestra con mezza tendina */
    g.rect(8, 16, 50, 64, 16); rain(g, f, 14, 9, 17, 49, 63, false);
    g.frame(7, 15, 51, 65, 0); g.frame(6, 14, 52, 66, 16); g.vline(29, 16, 64, 0); g.hline(8, 50, 34, 0);
    g.rect(8, 42, 50, 64, 2); for (x = 10; x < 50; x += 4) { g.vline(x, 43, 64, 16); } g.hline(6, 52, 41, 0); g.hline(6, 52, 42, 16);
    g.rect(4, 66, 54, 68, 0);
    /* cono di luce della lampada */
    g.poly([[cx - 6, 21], [cx + 6, 21], [96, 44], [96, 84], [44, 84]], 6); g.poly([[cx - 4, 21], [cx + 4, 21], [90, 84], [58, 84]], 3);
    /* scaffale delle bottiglie */
    g.rect(98, 16, 190, 82, 15); g.frame(97, 15, 191, 83, 0); g.frame(96, 14, 192, 84, 16);
    for (i = 0; i < 3; i++) { y = 36 + i * 22; g.rect(98, y, 190, y + 1, 0); g.hline(98, 190, y + 2, 16); }
    for (i = 0; i < 27; i++) {
      x = 101 + (i % 9) * 10; y = 35 + Math.floor(i / 9) * 22; t = (i * 7 + Math.floor(i / 9) * 3) % 4;
      g.maskOn();
      if (t === 0) { g.rect(x, y - 13, x + 4, y, 16); g.rect(x + 1, y - 18, x + 3, y - 13, 16); }
      else if (t === 1) { g.rect(x, y - 9, x + 6, y, 16); g.rect(x + 2, y - 13, x + 4, y - 9, 16); }
      else if (t === 2) { g.ell(x + 3, y - 5, 3, 5, 16); g.rect(x + 2, y - 15, x + 4, y - 9, 16); }
      else { g.rect(x + 1, y - 11, x + 5, y, 16); g.poly([[x + 1, y - 11], [x + 3, y - 17], [x + 5, y - 11]], 16); }
      g.keyline(0);
      if (i % 3 !== 1) { g.rect(x + 1, y - 6, x + (t === 1 ? 5 : 3), y - 3, 0); }
      if (i % 4 === 2) { g.rect(x + 1, y - 8, x + 3, y - 1, 6); }
    }
    g.rect(104, 2, 184, 13, 0); g.frame(104, 2, 184, 13, 16); g.text(109, 3, "AL FANALE", 16, 2);
    /* orologio e licenza */
    g.ell(68, 30, 9, 9, 0); g.ring(68, 30, 9, 9, 16); g.ring(68, 30, 8, 8, 16); g.line(68, 30, 68, 24, 16); g.line(68, 30, 73, 32, 16); g.px(68, 22, 16); g.px(76, 30, 16); g.px(68, 38, 16); g.px(60, 30, 16);
    g.rect(58, 46, 78, 60, 0); g.frame(58, 46, 78, 60, 16); g.frame(60, 48, 76, 58, 16); g.hline(63, 73, 51, 9); g.hline(63, 73, 53, 9); g.hline(63, 70, 55, 9);
    /* lampada */
    g.vline(78, 0, 13, 0); g.poly([[cx - 9, 20], [cx + 9, 20], [cx + 4, 13], [cx - 4, 13]], 0); g.hline(cx - 9, cx + 9, 21, 16); g.rect(cx - 1, 21, cx + 1, 23, 0);
    /* telefono a gettoni e scala */
    g.maskOn(); g.rect(205, 30, 225, 62, 16); g.keyline(0);
    g.ring(215, 42, 6, 6, 0); g.ring(215, 42, 3, 3, 0); for (i = 0; i < 8; i++) { g.px(215 + 4.6 * Math.cos(i * 0.785), 42 + 4.6 * Math.sin(i * 0.785), 0); }
    g.rect(208, 32, 213, 33, 0); g.rect(210, 54, 220, 58, 0); g.hline(212, 218, 56, 16);
    g.rect(199, 34, 202, 54, 16); g.frame(198, 33, 203, 55, 0); g.arc(206, 60, 7, 10, PI * 0.5, PI * 1.2, 0);
    g.text(206, 22, "TEL.", 0, 1);
    g.poly([[228, 118], [239, 118], [239, 60], [228, 72]], 16);
    for (i = 0; i < 6; i++) { g.hline(196 + i * 8, 204 + i * 8, 116 - i * 8, 0); g.vline(204 + i * 8, 108 - i * 8, 116 - i * 8, 0); }
    g.line(190, 96, 239, 46, 0, 1); for (i = 0; i < 7; i++) { g.vline(194 + i * 7, 92 - i * 7, 112 - i * 7, 0); }
    /* Nives */
    g.maskOn();
    g.poly([[58, 84], [60, 66], [67, 59], [81, 59], [88, 66], [90, 84]], 16);
    g.poly([[87, 67], [100, 76], [97, 81], [85, 73]], 16);
    g.ell(74, 44, 8, 8, 16); g.ell(83, 40, 4, 4, 16);
    g.keyline(0);
    g.rect(71, 53, 77, 59, 0); g.ell(74, 47, 6, 7, 0);
    g.poly([[66, 46], [68, 38], [74, 36], [80, 38], [82, 46], [79, 42], [74, 41], [69, 42]], 16);
    g.px(71, 47, 16); g.px(72, 47, 16); g.px(76, 47, 16); g.px(77, 47, 16); g.hline(70, 72, 45, 16); g.hline(76, 78, 45, 16); g.vline(74, 47, 50, 9); g.hline(72, 76, 52, 16); g.px(79, 49, 9); g.px(79, 50, 9);
    g.poly([[68, 62], [80, 62], [82, 84], [66, 84]], 0); g.line(68, 62, 70, 58, 0); g.line(80, 62, 78, 58, 0); g.hline(67, 81, 72, 9);
    g.ell(100, 79, 2, 2, 0); g.rect(102, 72, 107, 82, 0); g.frame(102, 72, 107, 82, 16); g.hline(103, 106, 80, 9); g.poly([[96, 80], [102, 78], [103, 84], [97, 85]], 0);
    /* banco di zinco */
    g.rect(38, 84, 198, 87, 0); g.hline(38, 198, 88, 16); g.hline(40, 196, 85, 6);
    g.rect(40, 89, 196, 118, 10);
    for (i = 0; i < 5; i++) { x = 44 + i * 31; g.frame(x, 93, x + 26, 113, 0); g.frame(x + 2, 95, x + 24, 111, 16); }
    g.hline(40, 196, 116, 0); g.hline(40, 196, 117, 16);
    g.frame(118, 77, 122, 83, 0); g.frame(125, 77, 129, 83, 0); g.hline(119, 121, 82, 0);
    g.maskOn(); g.rect(136, 68, 140, 83, 16); g.rect(137, 62, 139, 68, 16); g.keyline(0); g.rect(137, 74, 139, 79, 0);
    g.maskOn(); g.rect(158, 62, 188, 83, 16); g.rect(162, 56, 184, 62, 16); g.keyline(0);
    g.rect(164, 58, 182, 60, 0); for (i = 0; i < 12; i++) { g.rect(161 + (i % 6) * 4, 66 + Math.floor(i / 6) * 5, 163 + (i % 6) * 4, 68 + Math.floor(i / 6) * 5, 0); } g.rect(160, 78, 186, 81, 4); g.vline(190, 66, 76, 0); g.ell(190, 65, 1, 1, 0);
    /* stufa */
    g.maskOn(); g.rect(6, 82, 30, 122, 16); g.rect(15, 0, 21, 82, 16); g.rect(4, 80, 32, 83, 16); g.keyline(0);
    g.rect(11, 94, 25, 108, (f % 3) ? 2 : 5); g.frame(11, 94, 25, 108, 0); for (y = 96; y < 108; y += 3) { g.hline(12, 24, y, 16); } g.vline(18, 95, 107, 16);
    g.rect(8, 123, 10, 127, 16); g.rect(26, 123, 28, 127, 16); g.hline(15, 21, 30, 0); g.hline(15, 21, 56, 0);
    /* pavimento */
    g.rect(0, 119, 239, 149, 5); g.hline(0, 239, 118, 16);
    for (i = 0; i < 4; i++) { y = 124 + i * 7 + i * i; g.hline(0, 239, y, 16); for (x = (i * 37) % 60; x < 240; x += 60) { g.vline(x, y, y + 6 + i * 2, 16); } }
    /* Kessel al tavolo, in primo piano */
    g.ell(176, 133, 40, 8, 13);
    g.maskOn();
    g.poly([[158, 132], [162, 106], [173, 97], [197, 97], [209, 106], [214, 132]], 16);
    g.ell(185, 86, 9, 10, 16);
    g.poly([[174, 79], [176, 65], [194, 65], [196, 79]], 16); g.ell(185, 79, 17, 3, 16);
    g.keyline(0);
    g.hline(175, 195, 75, 0); g.hline(175, 195, 76, 0);
    g.poly([[178, 82], [192, 82], [193, 92], [189, 97], [181, 97], [177, 92]], 0);
    g.rect(178, 82, 192, 84, 9); g.hline(180, 183, 86, 16); g.hline(187, 190, 86, 16); g.px(181, 87, 16); g.px(188, 87, 16); g.vline(185, 87, 91, 9); g.hline(182, 188, 93, 16); g.hline(183, 187, 92, 9);
    g.line(180, 98, 185, 108, 0); g.line(190, 98, 185, 108, 0); g.rect(184, 100, 186, 118, 0); g.vline(185, 100, 118, 16);
    g.maskOn(); g.ell(176, 131, 38, 7, 0); g.keyline(16); g.rect(172, 138, 180, 149, 16); g.hline(140, 212, 133, 9);
    /* giornale */
    g.maskOn(); g.poly([[136, 100], [172, 95], [176, 128], [140, 131]], 0); g.keyline(16);
    g.rect(140, 102, 170, 105, 16); g.line(155, 98, 158, 129, 16);
    for (y = 109; y < 128; y += 3) { g.hline(141, 153, y + 1, 9); g.hline(160, 172, y, 9); } g.rect(160, 110, 170, 117, 11);
    g.ell(138, 116, 3, 3, 0); g.ring(138, 116, 3, 3, 16); g.ell(176, 112, 3, 3, 0); g.ring(176, 112, 3, 3, 16);
    g.maskOn(); g.ell(200, 129, 6, 2, 16); g.keyline(0); g.line(198, 127, 204, 125, 0);
    if (f % 3 !== 2) { g.px(205, 124, 0); }
    smoke(g, 205, 122, f, 34);
    g.maskOn(); g.rect(148, 124, 154, 129, 0); g.keyline(16); g.arc(155, 127, 3, 2, -1.3, 1.3, 16);
  }

  /* ================= LA CASA DEL GUARDIANO ================= */
  function casa(g, f) {
    var sw = [0, 1, 0, -1][f % 4], i, x, y, x0, bl = f % 2;
    g.rect(0, 0, 239, 100, 3); g.rect(0, 92, 239, 100, 5); g.hline(0, 239, 91, 16); g.hline(0, 239, 100, 16);
    g.rect(0, 101, 239, 149, 7);
    for (x0 = -260; x0 <= 500; x0 += 30) { g.line(120 + (x0 - 120) * 41 / 90, 101, x0, 150, 16); }
    g.poly([[150, 104], [208, 104], [194, 142], [108, 142]], 1);
    for (x0 = -260; x0 <= 500; x0 += 30) { g.line(120 + (x0 - 120) * 41 / 90, 101, x0, 150, 16); }
    /* finestra aperta sul golfo */
    g.rect(150, 16, 208, 72, 16); g.rect(153, 19, 205, 69, 2);
    g.rect(153, 50, 205, 69, "h"); g.hline(153, 205, 50, 16);
    g.poly([[176, 50], [184, 47], [196, 45], [205, 46], [205, 50]], 16); g.rect(193, 36, 195, 45, 0); g.frame(192, 35, 196, 46, 16); g.hline(193, 195, 39, 16); g.hline(193, 195, 42, 16); g.rect(192, 32, 196, 34, 16); g.px(194, 30, 16);
    g.ell(166, 28, 9, 2, 0); g.ell(182, 24, 7, 2, 0);
    g.rect(178, 19, 180, 69, 16); g.hline(153, 205, 44, 16);
    g.maskOn(); g.poly([[153, 19], [168 + bl * 3, 19], [174 + bl * 5, 44], [170 + bl * 6, 68], [154, 70]], 0); g.keyline(16);
    for (i = 0; i < 4; i++) { g.line(156 + i * 4, 21, 158 + i * 5 + bl * 2, 67, 16); }
    g.rect(146, 73, 212, 76, 0); g.frame(146, 73, 212, 76, 16);
    /* attaccapanni, cerata e cappello */
    g.hline(30, 76, 20, 16); g.hline(30, 76, 21, 16); for (i = 0; i < 4; i++) { g.rect(34 + i * 12, 22, 35 + i * 12, 25, 16); }
    g.maskOn(); g.poly([[42, 24], [52, 24], [58, 34], [60, 66], [38, 66], [38, 34]], 16); g.keyline(16);
    g.line(47, 26, 48, 64, 0); g.line(41, 36, 43, 62, 6); g.px(49, 38, 0); g.px(49, 46, 0); g.px(49, 54, 0);
    g.maskOn(); g.ell(70, 28, 7, 3, 16); g.ell(70, 25, 4, 3, 16); g.keyline(16); g.hline(66, 74, 27, 0);
    /* almanacco delle maree */
    g.rect(118, 18, 136, 40, 0); g.frame(118, 18, 136, 40, 16); g.rect(118, 18, 136, 22, 16);
    for (y = 25; y < 40; y += 4) { g.hline(120, 134, y, 9); } for (x = 123; x < 136; x += 4) { g.vline(x, 23, 39, 9); } g.ring(129, 31, 2, 2, 16);
    /* cornice storta, e il segno chiaro dove stava dritta */
    g.rect(86, 30, 110, 48, 0); for (x = 86; x <= 110; x += 2) { g.px(x, 30, 16); g.px(x, 48, 16); } for (y = 30; y <= 48; y += 2) { g.px(86, y, 16); g.px(110, y, 16); }
    g.poly([[88, 36], [112, 31], [116, 49], [92, 54]], 16); g.poly([[91, 38], [110, 34], [113, 47], [94, 51]], 0); g.poly([[93, 40], [108, 37], [110, 45], [96, 48]], 6);
    g.line(103, 38, 104, 45, 0); g.line(104, 38, 105, 45, 0); g.px(98, 44, 16); g.px(98, 45, 16); g.px(100, 43, 16); g.px(100, 44, 16); g.line(100, 28, 101, 34, 16);
    /* stufa con lo sportello aperto e la cenere */
    g.maskOn(); g.rect(2, 50, 24, 100, 16); g.rect(9, 0, 15, 50, 16); g.rect(0, 48, 26, 51, 16); g.keyline(16);
    g.rect(6, 64, 20, 80, 0); g.frame(6, 64, 20, 80, 16); g.rect(8, 72, 18, 79, 11); g.poly([[20, 64], [30, 60], [30, 78], [20, 80]], 9); g.pline([[20, 64], [30, 60], [30, 78], [20, 80]], 16);
    g.hline(9, 15, 20, 0); g.hline(9, 15, 36, 0);
    g.ell(20, 106, 12, 3, 12); for (i = 0; i < 10; i++) { g.px(10 + h1(i) * 22, 104 + h1(i + 9) * 5, 0); } g.px(34, 108, 16); g.px(38, 111, 16); g.px(6, 110, 16);
    /* scrivania: cassetti sfilati */
    g.maskOn(); g.poly([[30, 78], [102, 78], [108, 85], [24, 85]], 0); g.rect(26, 86, 106, 118, 0); g.keyline(16);
    g.hline(26, 106, 86, 16); g.rect(31, 90, 62, 99, 16); g.rect(68, 90, 100, 99, 16); g.rect(31, 103, 62, 113, 16);
    g.frame(68, 103, 100, 113, 16); g.ring(84, 108, 2, 1, 16);
    g.rect(28, 119, 31, 126, 16); g.rect(101, 119, 104, 124, 16);
    g.maskOn(); g.rect(50, 71, 72, 78, 16); g.keyline(16); g.rect(55, 73, 67, 76, 0); g.hline(57, 65, 74, 16); g.hline(51, 71, 79, 0);
    g.maskOn(); g.rect(84, 73, 88, 78, 16); g.keyline(16); g.line(90, 70, 99, 77, 16);
    /* cassetto e carte per terra */
    g.maskOn(); g.poly([[52, 124], [86, 121], [92, 134], [56, 138]], 0); g.keyline(16); g.poly([[56, 127], [84, 124], [88, 132], [59, 135]], 16); g.ring(72, 137, 2, 1, 16);
    var PAP = [[112, 118, 12, 7, 2], [130, 132, 13, 8, -3], [94, 142, 12, 6, 3], [154, 124, 12, 8, -2], [36, 134, 13, 7, 2], [178, 138, 12, 7, 4], [140, 110, 10, 6, 1], [16, 124, 11, 6, -2], [118, 140, 11, 6, -4]];
    for (i = 0; i < PAP.length; i++) {
      x = PAP[i][0]; y = PAP[i][1];
      g.maskOn(); g.poly([[x, y], [x + PAP[i][2], y + PAP[i][4]], [x + PAP[i][2] - 2, y + PAP[i][3] + PAP[i][4]], [x - 2, y + PAP[i][3]]], 0); g.keyline(16);
      g.line(x + 1, y + 2, x + PAP[i][2] - 2, y + 2 + PAP[i][4], 9); g.line(x, y + 4, x + PAP[i][2] - 4, y + 4 + PAP[i][4], 9);
    }
    /* sedia rovesciata */
    g.line(124, 98, 121, 113, 16, 1); g.line(142, 94, 141, 109, 16, 1); g.line(152, 100, 148, 115, 16, 1); g.line(131, 104, 129, 119, 16, 1);
    g.maskOn(); g.poly([[120, 113], [141, 108], [149, 115], [128, 120]], 0); g.keyline(16);
    g.line(120, 113, 106, 124, 16, 1); g.line(128, 120, 113, 131, 16, 1); g.line(106, 124, 113, 131, 16, 1); g.line(113, 119, 120, 126, 16); g.line(109, 122, 116, 128, 16);
    /* letto: materasso aperto, lana fuori */
    g.rect(232, 78, 236, 149, 16); g.rect(214, 82, 216, 112, 16); g.hline(214, 236, 82, 16); g.hline(214, 236, 83, 16); for (x = 219; x < 232; x += 4) { g.vline(x, 84, 110, 16); }
    g.maskOn(); g.poly([[170, 114], [239, 107], [239, 141], [178, 147]], 0); g.keyline(16);
    for (i = 0; i < 9; i++) { g.line(174 + i * 8, 114 - i * 0.8, 181 + i * 8, 146 - i * 0.7, 9); }
    g.poly([[184, 118], [192, 124], [188, 129], [198, 133], [194, 138], [206, 143], [204, 145], [190, 140], [194, 135], [184, 131], [188, 126], [181, 121]], 16);
    g.maskOn(); g.ell(196, 126, 6, 4, 0); g.ell(204, 121, 5, 3, 0); g.ell(188, 134, 5, 3, 0); g.ell(211, 127, 4, 3, 0); g.keyline(16);
    g.px(196, 126, 16); g.px(205, 121, 16); g.px(189, 135, 16); g.px(199, 128, 16);
    /* lampadina */
    g.line(120, 0, 120 + sw * 2, 14, 16); g.poly([[114 + sw * 2, 20], [126 + sw * 2, 20], [123 + sw * 2, 14], [117 + sw * 2, 14]], 16); g.ell(120 + sw * 2, 22, 2, 2, 0); g.ring(120 + sw * 2, 22, 2, 2, 16);
  }

  /* ================= LA SALA DELLA LANTERNA ================= */
  function lente(boat) {
    return function (g, f) {
      var i, x, y, a, r, hx = 96 + (f % 4) * 16, dir = (f % 4) < 2 ? -1 : 1;
      g.rect(0, 0, 239, 149, 16);
      g.hline(0, 239, 74, 13); for (x = (f * 2) % 9; x < 240; x += 9) { g.hline(x, x + 3, 80 + (x % 4) * 2, 0); }
      if (boat && (f % 4) < 2) { g.px(30, 71, 0); g.px(31, 71, 0); g.px(30, 70, 0); g.px(31, 70, 0); g.px(29, 71, 0); g.px(32, 71, 0); g.px(30, 76, 0); g.px(31, 78, 0); }
      if (boat) { g.hline(26, 35, 73, 0); }
      /* fascio */
      if (dir < 0) { g.poly([[84, 60], [0, 44], [0, 82], [84, 66]], 8); g.poly([[84, 61], [0, 52], [0, 74], [84, 65]], 3); }
      else { g.poly([[156, 60], [239, 44], [239, 82], [156, 66]], 8); g.poly([[156, 61], [239, 52], [239, 74], [156, 65]], 3); }
      rain(g, f, 40, 0, 6, 239, 100, true);
      /* vetrata a losanghe */
      for (i = -4; i < 12; i++) { g.line(i * 30, 8, i * 30 + 76, 104, 0); g.line(i * 30 + 76, 8, i * 30, 104, 0); }
      g.rect(0, 6, 239, 8, 0); g.rect(0, 55, 239, 56, 0); g.rect(0, 103, 239, 105, 0); g.rect(0, 0, 239, 5, 13);
      /* pavimento di lamiera */
      g.rect(0, 106, 239, 149, 11);
      for (y = 110; y < 150; y += 5) { for (x = ((y / 5) % 2) * 4; x < 240; x += 8) { g.px(x, y, 0); g.px(x + 1, y + 1, 0); } }
      g.hline(0, 239, 106, 16);
      /* botola della scala */
      g.poly([[0, 124], [44, 120], [58, 149], [0, 149]], 16); g.pline([[0, 124], [44, 120], [58, 149]], 0);
      for (i = 0; i < 4; i++) { g.hline(2, 30 - i * 7, 130 + i * 6, 0); }
      g.line(44, 120, 44, 96, 0, 1); g.line(0, 100, 44, 96, 0, 1); g.line(22, 98, 22, 122, 0);
      /* lente */
      g.maskOn(); g.poly([[90, 20], [150, 20], [160, 38], [160, 88], [150, 106], [90, 106], [80, 88], [80, 38]], 16); g.keyline(0);
      g.frame(84, 40, 156, 86, 0);
      for (i = 0; i < 6; i++) { y = 23 + i * 3; x = 89 - i * 1.4; g.hline(x, 240 - x, y, i % 2 ? 0 : 5); }
      for (i = 0; i < 6; i++) { y = 103 - i * 3; x = 89 - i * 1.4; g.hline(x, 240 - x, y, i % 2 ? 0 : 5); }
      g.rect(85, 41, 155, 85, 4);
      for (r = 22; r > 0; r -= 3) { g.ell(120, 63, r * 1.05, r, (r / 3) % 2 < 1 ? 0 : 16); }
      g.ell(120, 63, 4, 4, 0); g.px(120, 63, 16);
      for (x = 86; x < 98; x += 2) { g.vline(x, 42, 84, 16); g.vline(240 - x, 42, 84, 16); }
      g.rect(hx, 42, hx + 4, 84, 0); g.vline(hx + 6, 46, 80, 0);
      for (i = 0; i < 4; i++) { x = [97, 109, 131, 143][i]; g.rect(x, 21, x + 1, 105, 16); g.vline(x - 1, 21, 105, 0); }
      g.hline(81, 159, 40, 0); g.hline(81, 159, 86, 0);
      /* basamento, sportello, ruotismi */
      g.rect(90, 107, 150, 142, 12); g.frame(90, 107, 150, 142, 0); g.frame(88, 142, 152, 146, 0); g.rect(89, 143, 151, 145, 12);
      for (x = 94; x < 150; x += 7) { g.px(x, 110, 0); g.px(x, 139, 0); }
      g.rect(107, 112, 133, 137, 16); g.frame(107, 112, 133, 137, 0); g.frame(109, 114, 131, 135, 0); g.rect(105, 116, 107, 119, 0); g.rect(105, 130, 107, 133, 0);
      g.ell(127, 125, 2, 2, 0); g.px(127, 125, 16); g.px(127, 126, 16);
      for (i = 0; i < 2; i++) {
        x = i ? 54 : 70; y = i ? 120 : 132; r = i ? 6 : 10; a = (i ? -1 : 0.6) * f * 0.5;
        g.ell(x, y, r, r, 16); g.ring(x, y, r, r, 0); g.ring(x, y, r - 3, r - 3, 0);
        for (var q = 0; q < (i ? 6 : 10); q++) { g.px(x + (r + 1) * Math.cos(a + q * 2 * PI / (i ? 6 : 10)), y + (r + 1) * Math.sin(a + q * 2 * PI / (i ? 6 : 10)), 0); }
        g.line(x, y, x + (r - 3) * Math.cos(a), y + (r - 3) * Math.sin(a), 0); g.line(x, y, x - (r - 3) * Math.cos(a), y - (r - 3) * Math.sin(a), 0);
      }
      g.line(80, 132, 90, 132, 0);
      /* quadro elettrico */
      g.rect(203, 0, 205, 42, 0); g.vline(206, 0, 42, 16);
      g.maskOn(); g.rect(182, 42, 228, 102, 16); g.keyline(0); g.frame(184, 44, 226, 100, 0);
      g.text(188, 49, "AUT", 0, 1); g.text(210, 49, "MAN", 0, 1);
      g.arc(205, 80, 16, 16, PI * 1.2, PI * 1.8, 0); g.line(205, 80, 196, 63, 0, 1); g.ell(195, 61, 3, 3, 0); g.ell(205, 80, 2, 2, 0);
      g.ell(205, 92, 5, 5, 0); g.ring(205, 92, 5, 5, 16); g.ell(205, 92, 2, 2, 16); g.ring(205, 92, 7, 7, 0);
      g.rect(188, 88, 192, 92, 0); g.px(190, 90, 16); g.rect(218, 88, 222, 92, 0); g.px(220, 90, 16);
      /* latta dell'olio e straccio */
      g.maskOn(); g.rect(170, 128, 180, 142, 16); g.poly([[170, 128], [175, 122], [180, 128]], 16); g.keyline(0); g.line(175, 122, 186, 118, 0); g.rect(172, 133, 178, 137, 0);
      g.poly([[188, 140], [202, 137], [206, 144], [190, 146]], 0); g.line(192, 141, 202, 140, 9);
    };
  }

  /* ================= KESSEL SULLA PORTA ================= */
  function kessel(g, f) {
    var i, x, y;
    g.rect(0, 0, 239, 149, 16);
    for (y = 4; y < 128; y += 7) { for (x = ((y / 7) % 2) * 9 + 3; x < 240; x += 18) { if (x < 52 || x > 164) { g.hline(x, x + 6 + (y % 3), y, 12); if ((x + y) % 5 === 0) { g.vline(x, y, y + 6, 12); } } } }
    /* fuori: la notte, i lumi del porto, la pioggia */
    g.rect(84, 14, 156, 128, 13);
    g.rect(84, 96, 156, 104, 16); g.hline(84, 156, 96, 9);
    for (i = 0; i < 9; i++) { x = 88 + i * 8 + (i % 2) * 2; g.px(x, 94 - (i % 3), 0); g.px(x, 99 + (i % 2), 0); g.px(x, 102, 9); }
    g.poly([[84, 128], [156, 128], [140, 105], [104, 105]], 10); g.line(104, 105, 84, 128, 13); g.line(140, 105, 156, 128, 13);
    for (i = 0; i < 6; i++) { g.hline(100 + i * 7, 104 + i * 7, 112 + (i % 3) * 5, 3); }
    rain(g, f, 26, 84, 14, 156, 127, false);
    g.rect(78, 6, 162, 13, 6); g.frame(78, 6, 162, 13, 0); for (x = 90; x < 162; x += 12) { g.vline(x, 7, 12, 16); } g.rect(116, 4, 124, 13, 2); g.frame(116, 4, 124, 13, 16);
    g.frame(83, 13, 157, 129, 0); g.frame(82, 13, 158, 129, 0);
    /* battente aperto verso l'interno */
    g.maskOn(); g.poly([[82, 14], [54, 4], [54, 142], [82, 128]], 12); g.keyline(0);
    for (i = 0; i < 4; i++) { y = 20 + i * 34; g.line(56, y - 6, 80, y, 0); for (x = 58; x < 80; x += 5) { g.px(x, y - 4 + (x - 56) * 0.25 + 3, 0); } }
    g.rect(58, 70, 66, 84, 16); g.frame(58, 70, 66, 84, 0); g.ring(62, 90, 3, 4, 0); g.px(62, 76, 0); g.px(62, 77, 0);
    /* pavimento, lama di luce, ombra lunga */
    g.rect(0, 130, 239, 149, 15); g.hline(0, 239, 130, 12);
    g.poly([[84, 130], [156, 130], [206, 149], [34, 149]], 7);
    g.poly([[108, 130], [132, 130], [152, 149], [92, 149]], 16);
    for (i = 0; i < 7; i++) { g.hline(60 + i * 19, 66 + i * 19, 138 + (i % 3) * 4, 2); }
    /* Kessel */
    man(g, 120, 130, 104, { belt: true, env: true, arms: "smoke", f: f });
    /* scala a chiocciola */
    g.rect(0, 0, 8, 149, 12); g.vline(9, 0, 149, 0);
    for (i = 0; i < 6; i++) { y = 142 - i * 15; g.poly([[9, y], [48 - i * 6, y + 3], [48 - i * 6, y + 7], [9, y + 5]], 3); g.pline([[9, y], [48 - i * 6, y + 3], [48 - i * 6, y + 7]], 0); g.poly([[9, y + 6], [46 - i * 6, y + 8], [40 - i * 6, y + 14], [9, y + 14]], 13); }
    g.line(10, 40, 50, 124, 0, 1); for (i = 0; i < 6; i++) { g.line(16 + i * 6, 54 + i * 13, 16 + i * 6, 70 + i * 13, 0); }
    /* fusti, cima arrotolata, avviso */
    for (i = 0; i < 2; i++) {
      x = i ? 214 : 190; y = i ? 96 : 104;
      g.maskOn(); g.rect(x - 11, y, x + 11, 136, 16); g.ell(x, 136, 11, 3, 16); g.ell(x, y, 11, 3, 16); g.keyline(0);
      g.arc(x, y, 11, 3, 0, PI, 0); g.arc(x, y + 12, 11, 3, 0, PI, 0); g.arc(x, y + 24, 11, 3, 0, PI, 0); g.ell(x - 4, y, 2, 1, 0); g.vline(x + 6, y + 4, 132, 9);
    }
    g.text(206, 112, "OLIO", 0, 1);
    for (i = 0; i < 4; i++) { g.ring(200, 52, 5 + i * 3, 8 + i * 4, 0); } g.rect(199, 28, 201, 38, 0); g.px(200, 27, 0);
    g.rect(176, 58, 196, 82, 0); g.frame(176, 58, 196, 82, 9); g.text(179, 61, "ORARI", 16, 1); for (y = 69; y < 80; y += 3) { g.hline(179, 193, y, 9); } g.px(186, 59, 16);
  }

  /* ================= LA CALA ================= */
  var CL = [[0, 0], [64, 0], [56, 16], [62, 34], [52, 52], [60, 68], [48, 86], [54, 102], [0, 112]];
  var CR = [[239, 0], [172, 0], [180, 20], [170, 40], [182, 58], [174, 78], [188, 96], [239, 104]];
  function edgeX(p, y) { for (var i = 1; i < p.length - 2; i++) { if (y >= p[i][1] && y <= p[i + 1][1]) { return p[i][0] + (y - p[i][1]) / (p[i + 1][1] - p[i][1]) * (p[i + 1][0] - p[i][0]); } } return p[p.length - 2][0]; }
  function cala(mode) {
    return function (g, f) {
      var i, x, y, on = (f % 4) < 2, xe;
      g.rect(0, 0, 239, 149, 16);
      for (i = 0; i < 46; i++) { x = 60 + Math.floor(h1(i) * 120); y = 2 + Math.floor(h1(i + 31) * 50); if ((i + f) % 5 !== 0) { g.px(x, y, 0); } if (i % 9 === 0) { g.px(x + 1, y, 0); g.px(x, y + 1, 0); g.px(x - 1, y, 0); g.px(x, y - 1, 0); } }
      g.ell(120, 30, 40, 3, 14); g.ell(140, 42, 30, 2, 14);
      g.hline(56, 180, 57, 12);
      waves(g, f, 44, 196, 58, 100);
      /* barca al largo */
      g.maskOn(); g.poly([[112, 61], [140, 61], [136, 66], [116, 66]], 16); g.keyline(0);
      g.vline(126, 42, 60, 0); g.line(118, 47, 134, 45, 0, 1); g.line(126, 43, 113, 60, 9); g.line(126, 43, 139, 60, 9);
      if (on) { g.px(138, 56, 0); g.px(139, 56, 0); g.px(138, 55, 0); g.px(139, 57, 0); g.px(137, 56, 0); g.px(140, 56, 0); for (y = 69; y < 82; y += 3) { g.hline(136, 140 + (y % 2), y, 0); } }
      g.vline(138, 57, 60, 0);
      /* scogliere */
      g.poly(CL, 10); g.poly(CR, 10);
      for (y = 8; y < 108; y += 9) {
        xe = edgeX(CL, y); for (x = 0; x < xe - 3; x += 3) { g.px(x, y + Math.round(2 * Math.sin(x * 0.2 + y)), 16); g.px(x + 1, y + Math.round(2 * Math.sin((x + 1) * 0.2 + y)), 16); }
        xe = edgeX(CR, y); for (x = 239; x > xe + 3; x -= 3) { g.px(x, y + Math.round(2 * Math.sin(x * 0.2 + y)), 16); g.px(x - 1, y + Math.round(2 * Math.sin((x - 1) * 0.2 + y)), 16); }
      }
      g.pline(CL.slice(1, 8), 0); g.pline(CR.slice(1, 7), 0);
      g.pline([[30, 0], [40, 20], [26, 38], [38, 58], [24, 78], [34, 98], [30, 110]], 2);
      /* spiaggia */
      g.poly([[0, 112], [54, 102], [188, 96], [239, 104], [239, 149], [0, 149]], 5);
      g.poly([[54, 102], [188, 96], [190, 101], [54, 107]], 10);
      for (x = 54; x < 188; x++) { y = 102 - (x - 54) * 0.045 + Math.round(1.2 * Math.sin(x * 0.25 + f * 0.8)); g.px(x, y, 0); if ((x + f) % 3) { g.px(x, y - 1, 0); } if ((x + f * 2) % 7 < 3) { g.px(x, y + 2, 0); } }
      for (i = 0; i < 60; i++) { x = Math.floor(h1(i + 5) * 240); y = 110 + Math.floor(h1(i + 77) * 38); g.px(x, y, 16); if (i % 4 === 0) { g.px(x + 1, y, 16); g.px(x, y + 1, 0); } }
      for (i = 0; i < 5; i++) { x = [14, 206, 226, 160, 122][i]; y = [140, 126, 142, 144, 146][i]; g.maskOn(); g.ell(x, y, 5 + (i % 2) * 2, 2, 13); g.keyline(16); g.hline(x - 3, x + 1, y - 1, 0); }
      if (mode === "44") {
        /* marzo 1944: nove persone, di spalle, e una barca che non arriva */
        g.maskOn(); g.poly([[16, 122], [58, 118], [62, 126], [54, 132], [22, 134]], 16); g.keyline(0); g.line(22, 124, 56, 121, 0); g.line(30, 123, 32, 132, 9); g.line(44, 122, 46, 131, 9); g.line(60, 120, 76, 110, 16);
        for (i = 0; i < 9; i++) { man(g, 78 + i * 13 + (i % 2) * 2, 119 + (i % 3) * 3, 26 + (i % 4) * 2, { hat: i % 3 === 1 ? "kepi" : "fedora" }); }
        for (i = 0; i < 14; i++) { g.px(70 + i * 9, 132 + (i % 2) * 3 + i * 0.6, 16); g.px(71 + i * 9, 132 + (i % 2) * 3 + i * 0.6, 16); }
        return;
      }
      /* solchi delle gomme */
      for (x = 0; x < 30; x += 3) { g.px(x, 140 - x * 0.1, 16); g.px(x + 1, 147 - x * 0.12, 16); }
      /* l'Aprilia a fari spenti */
      g.ell(72, 141, 46, 3, 12);
      g.maskOn();
      g.poly([[28, 130], [29, 121], [40, 116], [50, 104], [56, 101], [84, 101], [92, 106], [100, 116], [112, 118], [117, 123], [118, 131], [28, 133]], 16);
      g.ell(46, 134, 9, 9, 16); g.ell(100, 134, 9, 9, 16);
      g.keyline(0);
      g.poly([[53, 105], [68, 104], [68, 115], [45, 115]], 9); g.poly([[72, 104], [84, 104], [95, 115], [72, 115]], 9); g.frame(70, 104, 70, 130, 0);
      g.hline(56, 90, 132, 0); g.px(66, 119, 0); g.px(67, 119, 0); g.px(90, 119, 0); g.px(91, 119, 0);
      g.ring(46, 134, 6, 6, 0); g.ell(46, 134, 2, 2, 0); g.ring(100, 134, 6, 6, 0); g.ell(100, 134, 2, 2, 0);
      g.arc(46, 133, 12, 11, PI, 2 * PI, 0); g.arc(100, 133, 12, 11, PI, 2 * PI, 0);
      g.ell(115, 122, 2, 3, mode === "luci" ? 0 : 9); g.ring(115, 122, 2, 3, 0); g.hline(116, 121, 130, 0); for (y = 120; y < 128; y += 2) { g.px(118, y, 0); }
      g.px(30, 124, 0); g.px(30, 125, 0);
      /* gli uomini di Brandi, il brigadiere, Brandi */
      man(g, 138, 138, 46, { arms: "smoke", f: f });
      man(g, 154, 136, 44, { f: f });
      man(g, 204, 134, 38, { hat: "kepi" });
      man(g, 178, 140, 50, { coat: 1, key: 16 });
      
    };
  }

  /* ================= FOTOTESSERA ================= */
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

  /* ================= MAPPA ================= */
  var COAST = [[0, 0], [128, 0], [134, 10], [150, 8], [176, 4], [204, 10], [218, 24], [214, 40], [196, 48], [178, 48], [166, 56], [158, 62], [150, 68], [138, 74], [150, 82], [154, 92], [150, 104], [144, 118], [132, 123], [105, 122], [105, 142], [95, 142], [95, 122], [60, 124], [30, 120], [0, 126]];
  var PLACE = { molo: [100, 135], piazza: [100, 110], locanda: [124, 110], caserma: [76, 110], strada: [114, 82], casa: [134, 66], faro: [202, 26], cala: [144, 76] };
  var ALIAS = { camera: "locanda", lanterna: "faro" };
  var LINK = [["molo", "piazza"], ["piazza", "locanda"], ["piazza", "caserma"], ["piazza", "strada"], ["strada", "casa"], ["strada", "faro"], ["strada", "cala"]];
  var LABEL = { molo: ["MOLO", 108, 136, 0], piazza: ["PIAZZA", 100, 99, 1], locanda: ["LOCANDA", 124, 121, 1], caserma: ["POLIZIA", 76, 121, 1], strada: ["SENTIERO", 106, 82, 2], casa: ["CASA", 134, 55, 1], faro: ["FARO", 202, 39, 1], cala: ["CALA", 153, 77, 0] };
  function drawMap(g, st) {
    var seen = {}, vis = {}, here = ALIAS[st.room] || st.room, id, i, x, y, w = g.w, land, k, a, b, n, L, tw, x0;
    for (id in st.visited) { if (st.visited.hasOwnProperty(id)) { vis[ALIAS[id] || id] = 1; } }
    for (id in vis) { if (vis.hasOwnProperty(id)) { seen[id] = 1; } }
    for (i = 0; i < LINK.length; i++) {
      if (LINK[i][1] === "cala" && !st.cala) { continue; }
      if (vis[LINK[i][0]]) { seen[LINK[i][1]] = 1; }
      if (vis[LINK[i][1]]) { seen[LINK[i][0]] = 1; }
    }
    g.rect(0, 0, 239, 149, 0);
    for (y = 5; y < 150; y += 7) { for (x = (y * 5) % 16; x < 240; x += 16) { g.px(x, y, 16); g.px(x + 1, y - 1, 16); g.px(x + 2, y, 16); g.px(x + 3, y + 1, 16); g.px(x + 4, y, 16); } }
    g.maskOn(); g.poly(COAST, 0); land = g.m; g.m = null;
    for (y = 0; y < 150; y++) {
      for (x = 0; x < 240; x++) {
        k = y * w + x;
        if (land[k]) { if (!land[k - 1] || !land[k + 1] || !land[k - w] || !land[k + w]) { if (x > 0 && y > 0) { g.d[k] = 1; } } continue; }
        n = 0;
        for (i = 1; i <= 4; i++) { if (land[k - i] || land[k + i] || land[k - i * w] || land[k + i * w]) { n = i; break; } }
        if (n) { g.d[k] = (n < 4 && y % 2 === 0) || (n === 4 && y % 2 === 0 && x % 2 === 0) ? 1 : 0; }
      }
    }
    function onLand(px, py) { return px >= 0 && py >= 0 && px < 240 && py < 150 && land[py * w + px]; }
    /* rilievo */
    for (i = 0; i < 3; i++) { for (a = 0; a < 2 * PI; a += 0.09) { x = Math.round(194 + (20 - i * 6) * Math.cos(a)); y = Math.round(26 + (13 - i * 4) * Math.sin(a)); if (onLand(x, y) && onLand(x + 3, y) && onLand(x - 3, y) && onLand(x, y + 3) && onLand(x, y - 3)) { g.px(x, y, 16); } } }
    for (i = 0; i < 3; i++) { for (a = 0; a < 2 * PI; a += 0.12) { x = Math.round(44 + (34 - i * 10) * Math.cos(a)); y = Math.round(46 + (22 - i * 7) * Math.sin(a)); if (Math.round(a * 20) % 2 === 0 && onLand(x, y)) { g.px(x, y, 16); } } }
    for (i = 0; i < 2; i++) { for (a = 0; a < 2 * PI; a += 0.14) { x = Math.round(92 + (22 - i * 9) * Math.cos(a)); y = Math.round(34 + (12 - i * 5) * Math.sin(a)); if (Math.round(a * 20) % 2 === 0) { g.px(x, y, 16); } } }
    for (i = 0; i < 30; i++) { x = 6 + Math.floor(h1(i + 3) * 150); y = 8 + Math.floor(h1(i + 60) * 80); if (onLand(x, y) && onLand(x + 4, y) && !(x > 60 && x < 150 && y > 56)) { g.px(x, y, 16); g.px(x + 1, y - 1, 16); g.px(x + 2, y, 16); } }
    /* il paese */
    var BL = [[58, 98, 6, 4], [67, 98, 7, 4], [58, 105, 5, 5], [58, 114, 8, 4], [84, 98, 6, 5], [84, 116, 5, 4], [110, 98, 7, 4], [120, 98, 5, 4], [134, 100, 6, 4], [134, 108, 5, 5], [110, 116, 6, 4], [128, 116, 7, 3], [66, 90, 5, 4], [76, 91, 6, 3], [120, 91, 6, 3], [46, 108, 6, 4], [46, 116, 5, 3], [88, 106, 4, 4], [110, 104, 4, 4]];
    for (i = 0; i < BL.length; i++) { g.rect(BL[i][0], BL[i][1], BL[i][0] + BL[i][2], BL[i][1] + BL[i][3], 16); }
    g.rect(93, 124, 107, 126, 0); g.vline(95, 122, 142, 16); g.vline(105, 122, 142, 16); for (y = 126; y < 142; y += 3) { g.hline(96, 104, y, 9); }
    /* sentieri */
    for (i = 0; i < LINK.length; i++) {
      a = LINK[i][0]; b = LINK[i][1];
      if (seen[a] && seen[b] && (vis[a] || vis[b])) {
        n = Math.max(Math.abs(PLACE[a][0] - PLACE[b][0]), Math.abs(PLACE[a][1] - PLACE[b][1]));
        for (k = 0; k <= n; k++) { x = Math.round(PLACE[a][0] + (PLACE[b][0] - PLACE[a][0]) * k / n); y = Math.round(PLACE[a][1] + (PLACE[b][1] - PLACE[a][1]) * k / n); g.rect(x - 1, y - 1, x + 1, y + 1, 0); }
        for (k = 0; k <= n; k++) { if (k % 3 !== 2) { g.px(PLACE[a][0] + (PLACE[b][0] - PLACE[a][0]) * k / n, PLACE[a][1] + (PLACE[b][1] - PLACE[a][1]) * k / n, 16); } }
      }
    }
    if (seen.faro) { for (i = 0; i < 8; i++) { g.line(202 + 6 * Math.cos(i * 0.785), 26 + 6 * Math.sin(i * 0.785), 202 + 10 * Math.cos(i * 0.785), 26 + 10 * Math.sin(i * 0.785), 16); } }
    for (id in PLACE) {
      if (PLACE.hasOwnProperty(id) && seen[id]) {
        x = PLACE[id][0]; y = PLACE[id][1];
        g.rect(x - 4, y - 4, x + 4, y + 4, 0); g.frame(x - 3, y - 3, x + 3, y + 3, 16);
        if (vis[id]) { g.rect(x - 2, y - 2, x + 2, y + 2, 16); g.px(x, y, 0); }
      }
    }
    for (id in LABEL) {
      if (LABEL.hasOwnProperty(id) && seen[id]) {
        L = LABEL[id]; a = vis[id] ? L[0] : "?"; tw = a.length * 4 - 1; x0 = L[3] === 1 ? L[1] - Math.floor(tw / 2) : (L[3] === 2 ? L[1] - tw - 6 : L[1]);
        g.rect(x0 - 2, L[2] - 4, x0 + tw + 1, L[2] + 4, id === here ? 16 : 0); g.frame(x0 - 3, L[2] - 5, x0 + tw + 2, L[2] + 5, 16);
        g.text(x0, L[2] - 2, a, id === here ? 0 : 16, 1);
      }
    }
    /* scandagli, scogli, nome del golfo */
    g.text(196, 72, "14", 16, 1); g.text(180, 104, "22", 16, 1); g.text(56, 138, "9", 16, 1); g.text(124, 138, "6", 16, 1); g.text(222, 60, "31", 16, 1); g.text(20, 136, "11", 16, 1);
    for (i = 0; i < 3; i++) { x = [226, 230, 224][i]; y = [16, 32, 46][i]; g.hline(x - 2, x + 2, y, 16); g.vline(x, y - 2, y + 2, 16); }
    g.text(176, 88, "GOLFO", 16, 1);
    /* rosa dei venti */
    g.ell(24, 26, 12, 12, 0); g.ring(24, 26, 12, 12, 16); g.ring(24, 26, 9, 9, 9);
    g.poly([[24, 10], [21, 26], [27, 26]], 16); g.poly([[24, 42], [21, 26], [27, 26]], 0); g.pline([[21, 26], [24, 42], [27, 26]], 16);
    g.poly([[8, 26], [24, 23], [24, 29]], 0); g.pline([[24, 23], [8, 26], [24, 29]], 16); g.poly([[40, 26], [24, 23], [24, 29]], 16);
    g.rect(22, 2, 26, 8, 0); g.text(23, 3, "N", 16, 1);
    /* scala e cartiglio */
    g.rect(8, 142, 44, 146, 0); g.hline(10, 42, 144, 16); g.vline(10, 142, 146, 16); g.vline(26, 143, 145, 16); g.vline(42, 142, 146, 16); g.rect(10, 144, 26, 145, 16);
    g.rect(143, 117, 235, 145, 0); g.frame(143, 117, 235, 145, 16); g.frame(145, 119, 233, 143, 16);
    g.text(146, 122, "PORTO SCURO", 16, 2); g.text(164, 136, "NOVEMBRE 1953", 16, 1);
    g.frame(0, 0, 239, 149, 16); g.frame(2, 2, 237, 147, 16);
    for (x = 12; x < 240; x += 12) { g.px(x, 1, 16); g.px(x, 148, 16); } for (y = 12; y < 150; y += 12) { g.px(1, y, 16); g.px(238, y, 16); }
    return here;
  }

  var REG = "100000";
  var SC = {
    faro: { w: W, h: H, n: 6, draw: gulf(REG, false) },
    finestra: { w: W, h: H, n: 6, draw: gulf(REG, true) },
    finestra21: { w: W, h: H, n: code(2, 1).length, draw: gulf(code(2, 1), true) },
    tx13: { w: W, h: H, n: code(1, 3).length, draw: gulf(code(1, 3), false) },
    tx21: { w: W, h: H, n: code(2, 1).length, draw: gulf(code(2, 1), false) },
    tx22: { w: W, h: H, n: code(2, 2).length, draw: gulf(code(2, 2), false) },
    tx31: { w: W, h: H, n: code(3, 1).length, draw: gulf(code(3, 1), false) },
    bar: { w: W, h: H, n: 12, draw: bar },
    casa: { w: W, h: H, n: 4, draw: casa },
    lente: { w: W, h: H, n: 8, draw: lente(false) },
    lente4: { w: W, h: H, n: 8, draw: lente(true) },
    kessel: { w: W, h: H, n: 12, draw: kessel },
    cala: { w: W, h: H, n: 12, draw: cala("") },
    cala44: { w: W, h: H, n: 12, draw: cala("44") },
    ritratto: { w: 64, h: 80, n: 12, draw: ritratto }
  };
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
      if (PLACE[here]) { ctx.fillStyle = (f % 2) ? "#f1f0ea" : "#111111"; ctx.fillRect((PLACE[here][0] - 2) * k, (PLACE[here][1] - 2) * k, 5 * k, 5 * k); }
    };
    c._paint(0);
    return c;
  }

  return { make: make, makeMap: makeMap, scenes: SC, render: render, Gfx: Gfx, drawMap: drawMap };
})();
