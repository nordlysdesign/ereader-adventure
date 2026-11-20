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
  function bar(kessel) { return function (g, f) {
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
    if (!kessel) {
      /* tavolo vuoto, sedie capovolte */
      g.ell(176, 140, 40, 7, 13);
      g.maskOn(); g.ell(176, 126, 36, 6, 0); g.rect(174, 132, 178, 146, 16); g.keyline(16); g.rect(174, 132, 178, 146, 16);
      g.maskOn(); g.rect(156, 116, 188, 120, 0); g.line(159, 115, 157, 94, 0, 1); g.line(185, 115, 187, 94, 0, 1); g.line(166, 115, 165, 98, 0, 1); g.line(178, 115, 179, 98, 0, 1); g.keyline(16);
      return;
    }
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
  }; }

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

  /* ================= LA PIAZZA ================= */
  function piazza(night) {
    return function (g, f) {
      var B = night ? 13 : 0, L = night ? 0 : 16, D = night ? 16 : 11, i, k, x, y, w1, w2, WV = [0, 1, 0, -1];
      g.rect(0, 0, 239, 149, night ? 16 : 3);
      if (!night) { g.ell(40 + (f % 8) * 2, 12, 46, 5, 0); g.ell(196 - (f % 8) * 2, 22, 52, 5, 1); }
      /* polizia, a ovest */
      g.rect(0, 46, 58, 116, B); g.rect(0, 42, 62, 45, L); g.vline(58, 46, 116, L);
      for (i = 0; i < 2; i++) { x = 8 + i * 26; g.rect(x, 56, x + 12, 74, D); g.frame(x, 56, x + 12, 74, L); g.vline(x + 6, 56, 74, L); }
      g.rect(14, 80, 44, 86, 16); g.frame(13, 79, 45, 87, L); g.text(16, 81, "POLIZIA", 0, 1);
      g.rect(20, 90, 38, 116, D); g.frame(20, 90, 38, 116, L);
      /* locanda, a est */
      g.rect(182, 52, 239, 116, B); g.rect(178, 48, 239, 51, L); g.vline(182, 52, 116, L);
      for (i = 0; i < 2; i++) {
        x = 190 + i * 26;
        g.rect(x, 60, x + 14, 78, night ? ((i === 1 && f % 3 === 2) ? 5 : 0) : 11); g.frame(x, 60, x + 14, 78, L); g.vline(x + 7, 60, 78, 16); g.hline(x, x + 14, 69, 16);
      }
      g.rect(188, 84, 232, 92, 0); g.frame(188, 84, 232, 92, 16); g.text(191, 86, "AL FANALE", 16, 1);
      g.rect(198, 96, 216, 116, D); g.frame(198, 96, 216, 116, L); if (night) { g.hline(199, 215, 115, 0); }
      /* municipio */
      g.rect(68, 36, 172, 116, B); g.poly([[64, 36], [120, 16], [176, 36]], B); g.pline([[64, 36], [120, 16], [176, 36], [64, 36]], L); g.frame(68, 36, 172, 116, L);
      g.text(102, 27, "MUNICIPIO", L, 1);
      for (i = 0; i < 5; i++) { x = 76 + i * 19; g.rect(x, 44, x + 12, 60, D); g.frame(x, 44, x + 12, 60, L); g.vline(x + 6, 44, 60, L); }
      g.rect(94, 62, 146, 63, L); for (x = 95; x < 146; x += 3) { g.vline(x, 64, 68, L); } g.hline(94, 146, 69, L);
      g.hline(68, 172, 82, L); g.hline(68, 172, 84, L);
      /* tre bandiere fradice, nessuna che comandi */
      for (k = 0; k < 3; k++) {
        x = 104 + k * 16; w1 = WV[(f + k) % 4]; w2 = WV[(f + k + 1) % 4];
        g.vline(x, 34, 62, L);
        g.maskOn(); g.poly([[x + 1, 37], [x + 6, 38 + w1], [x + 11, 40 + w2], [x + 11, 50 + w2], [x + 6, 48 + w1], [x + 1, 47]], [16, 0, 8][k]); g.keyline(L);
      }
      /* portici */
      for (i = 0; i < 5; i++) {
        x = 74 + i * 20;
        g.rect(x, 92, x + 14, 116, night ? 16 : 13); g.ell(x + 7, 92, 7, 6, night ? 16 : 13); g.arc(x + 7, 92, 7, 6, PI, 2 * PI, L); g.vline(x, 92, 116, L); g.vline(x + 14, 92, 116, L);
      }
      /* un uomo sotto il portico, che non aspetta nessuno */
      man(g, 141, 116, 24, { coat: 16, key: 0, arms: "smoke", f: f });
      /* il manifesto che si scolla */
      g.rect(102, 94, 112, 108, 0); g.frame(102, 94, 112, 108, 16); for (y = 98; y < 107; y += 2) { g.hline(104, 110, y, 9); }
      if (f % 2) { g.poly([[106, 94], [112, 94], [112, 100]], night ? 16 : 13); g.pline([[106, 94], [109, 99], [112, 100]], 16); } else { g.poly([[109, 94], [112, 94], [112, 97]], night ? 16 : 13); }
      /* selciato */
      g.rect(0, 117, 239, 149, night ? "wdot" : "dot"); g.hline(0, 239, 117, L);
      for (x = -120; x <= 360; x += 40) { g.line(120 + (x - 120) * 0.3, 118, x, 149, night ? 12 : 6); }
      if (night) {
        for (i = 0; i < 2; i++) { x = 197 + i * 26; for (y = 120 + (f % 2); y < 148; y += 3) { g.hline(x - 2 + (y % 2), x + 2 - ((y >> 1) % 2), y, 0); } }
        rain(g, f, 70, 0, 0, 239, 148, false);
      }
    };
  }

  /* ================= IL POSTO DI POLIZIA ================= */
  function caserma(g, f) {
    var sw = [0, 1, 0, -1][f % 4], i, x, y, a = -PI / 2 + f * PI / 6;
    g.rect(0, 0, 239, 149, 4);
    g.rect(0, 78, 239, 112, 9); g.hline(0, 239, 77, 16);
    g.rect(0, 113, 239, 149, 12); g.hline(0, 239, 112, 16);
    for (x = -120; x <= 360; x += 24) { g.line(120 + (x - 120) * 0.4, 113, x, 149, 16); }
    /* finestra con l'inferriata */
    g.rect(14, 20, 58, 66, 16); rain(g, f, 16, 15, 21, 57, 65, false);
    g.frame(13, 19, 59, 67, 0); g.frame(12, 18, 60, 68, 16); for (x = 20; x < 58; x += 8) { g.vline(x, 20, 66, 0); } g.hline(14, 58, 42, 0);
    g.rect(9, 69, 63, 71, 0); g.frame(9, 69, 63, 71, 16);
    /* avviso */
    g.rect(70, 22, 98, 50, 0); g.frame(70, 22, 98, 50, 16); g.text(72, 25, "AVVISO", 16, 1); for (y = 33; y < 48; y += 3) { g.hline(73, 95, y, 9); }
    /* il segno chiaro di un ritratto tolto, e il chiodo */
    g.rect(140, 20, 160, 46, 1); for (x = 140; x <= 160; x += 2) { g.px(x, 20, 9); g.px(x, 46, 9); } for (y = 20; y <= 46; y += 2) { g.px(140, y, 9); g.px(160, y, 9); }
    g.px(150, 17, 16); g.px(150, 18, 16);
    /* orologio */
    g.ell(176, 24, 9, 9, 0); g.ring(176, 24, 9, 9, 16); g.ring(176, 24, 8, 8, 16);
    g.line(176, 24, 176 + Math.round(7 * Math.cos(a)), 24 + Math.round(7 * Math.sin(a)), 16); g.line(176, 24, 180, 22, 16, 1);
    /* armadietto di ferro */
    g.maskOn(); g.rect(194, 30, 232, 124, 0); g.keyline(16); g.frame(194, 30, 232, 124, 16); g.vline(213, 30, 124, 16);
    for (y = 38; y < 52; y += 3) { g.hline(198, 209, y, 16); g.hline(217, 228, y, 16); }
    g.rect(209, 70, 211, 80, 16); g.rect(215, 70, 217, 80, 16); g.ell(213, 88, 3, 3, 16); g.arc(213, 85, 2, 3, PI, 2 * PI, 16);
    g.rect(196, 125, 198, 129, 16); g.rect(228, 125, 230, 129, 16);
    /* la scrivania vuota, con la macchina da scrivere */
    g.maskOn(); g.rect(14, 92, 70, 96, 0); g.rect(16, 97, 20, 126, 0); g.rect(64, 97, 68, 126, 0); g.keyline(16);
    g.rect(28, 82, 54, 91, 16); g.rect(32, 77, 50, 82, 16); for (x = 30; x < 53; x += 3) { g.px(x, 86, 0); g.px(x + 1, 89, 0); }
    g.rect(35, 68, 47, 77, 0); g.frame(35, 68, 47, 77, 16); g.hline(37, 45, 71, 9); g.hline(37, 44, 73, 9);
    /* Lodi */
    man(g, 128, 120, 82, { hat: "kepi", face: true, arms: "smoke", f: f, coat: 16, key: 0 });
    /* la lampada che dondola */
    g.line(110, 0, 110 + sw * 2, 9, 16); g.poly([[104 + sw * 2, 14], [116 + sw * 2, 14], [113 + sw * 2, 9], [107 + sw * 2, 9]], 16); g.ell(110 + sw * 2, 15, 2, 1, 0);
    /* scrivania di Lodi, col fascicolo */
    g.maskOn(); g.rect(84, 91, 178, 95, 0); g.rect(86, 96, 176, 127, 6); g.keyline(16);
    g.hline(84, 178, 96, 16); g.frame(92, 100, 128, 112, 16); g.frame(134, 100, 170, 112, 16); g.rect(108, 105, 112, 106, 16); g.rect(150, 105, 154, 106, 16);
    g.maskOn(); g.poly([[96, 87], [122, 86], [124, 90], [98, 91]], 0); g.keyline(16); g.hline(99, 120, 88, 9);
    g.rect(156, 82, 158, 90, 16); g.poly([[148, 82], [166, 82], [162, 76], [152, 76]], 16); g.poly([[150, 83], [164, 83], [170, 90], [144, 90]], 2);
  }

  /* ================= IL SENTIERO DEL FARO ================= */
  function strada(night) {
    return function (g, f) {
      var sw = [0, 1, 0, -1][f % 4], L = night ? 0 : 16, on = night && f % 2 === 0, i, x, y, s, t;
      g.rect(0, 0, 239, 149, night ? 16 : 3);
      if (!night) { g.ell(70 + (f % 8) * 2, 16, 50, 5, 0); }
      /* mare, sotto */
      g.rect(0, 56, 239, 149, night ? 15 : 7); waves(g, f, 0, 160, 57, 120);
      /* il promontorio lontano e il faro */
      g.poly([[100, 57], [140, 46], [200, 40], [239, 42], [239, 60], [100, 60]], night ? 12 : 10);
      for (y = 18; y <= 44; y++) { s = 2 + (y - 18) * 0.06; g.hline(176 - s, 176 + s, y, Math.floor((y - 18) / 5) % 2 ? 16 : (night ? 6 : 0)); }
      g.rect(173, 11, 179, 17, on ? 0 : 16); g.poly([[172, 11], [176, 7], [180, 11]], 16); g.hline(171, 181, 18, L);
      if (on) { g.poly([[173, 13], [0, 0], [0, 30]], 6); g.poly([[173, 14], [0, 8], [0, 22]], 2); }
      /* la terra, con lo strapiombo */
      g.poly([[0, 120], [40, 104], [90, 84], [130, 64], [150, 60], [239, 58], [239, 149], [0, 149]], night ? 13 : 10);
      g.poly([[0, 120], [40, 104], [90, 84], [130, 64], [130, 72], [90, 94], [40, 116], [0, 134]], night ? 16 : 14);
      for (i = 0; i < 10; i++) { x = 8 + i * 13; g.line(x, 118 - i * 5.5, x + 2, 128 - i * 5.5, L); }
      g.pline([[0, 120], [40, 104], [90, 84], [130, 64], [150, 60]], L);
      /* il sentiero */
      g.poly([[104, 149], [176, 149], [162, 112], [152, 82], [148, 62], [143, 62], [136, 82], [122, 112]], night ? 9 : 0);
      g.pline([[104, 149], [122, 112], [136, 82], [143, 62]], L); g.pline([[176, 149], [162, 112], [152, 82], [148, 62]], L);
      for (i = 0; i < 14; i++) { t = h1(i + 7); y = 70 + Math.floor(h1(i) * 78); x = 140 + (y - 62) * (-0.3 + 0.6 * t) + 5; g.px(x, y, L); }
      /* il muretto */
      for (i = 0; i < 13; i++) {
        if (i === 4 || i === 5) { continue; }
        t = i / 12; x = 98 + t * 40; y = 146 - t * 82; s = 6 * (1 - t) + 2;
        g.maskOn(); g.ell(x, y, s, s * 0.6, night ? 6 : 11); g.keyline(L);
      }
      /* la casa di pietra, coi sigilli */
      g.rect(180, 74, 234, 112, night ? 12 : "stone"); g.frame(180, 74, 234, 112, L);
      g.poly([[174, 75], [207, 56], [240, 75]], 16); g.pline([[174, 75], [207, 56], [240, 75]], L);
      g.rect(196, 88, 212, 112, 16); g.frame(196, 88, 212, 112, L);
      g.line(197, 90, 211, 110, 0, 1); g.line(211, 90, 197, 110, 0, 1); g.ell(204, 100, 2, 2, 0); g.px(204, 100, 16);
      g.rect(219, 84, 228, 94, 16); g.frame(219, 84, 228, 94, L);
      /* tamerici nel vento */
      g.maskOn();
      g.line(30, 149, 34, 104, 16, 1); g.line(34, 116, 56, 86 + sw, 16, 1); g.line(33, 124, 8, 92 - sw, 16, 1); g.line(34, 106, 36, 76 + sw, 16, 1);
      for (i = 0; i < 46; i++) {
        t = h1(i + 5); s = h1(i + 71);
        x = i % 3 === 0 ? 34 + t * 22 : (i % 3 === 1 ? 33 - t * 25 : 34 + t * 2); y = i % 3 === 0 ? 116 - t * 30 : (i % 3 === 1 ? 124 - t * 32 : 106 - t * 30);
        x += sw * (1 + Math.round(t * 2)); g.line(x, y, x + 3 + sw * 2, y + 8 + s * 6, 16);
      }
      g.keyline(night ? 0 : 3);
      if (night) { rain(g, f, 70, 0, 0, 239, 148, false); }
    };
  }

  /* ================= IL FARO, DA SOTTO ================= */
  function torre(night) {
    return function (g, f) {
      var L = night ? 0 : 16, ph = f % 4, i, x, y, hh, band;
      g.rect(0, 0, 239, 149, night ? 16 : 3);
      g.ell((f * 8) % 320 - 40, 30, 50, 6, night ? 14 : 0); g.ell((f * 8 + 160) % 320 - 40, 52, 40, 4, night ? 14 : 1);
      if (night) {
        if (ph === 0) { g.poly([[112, 8], [0, 0], [0, 34]], 6); g.poly([[112, 8], [0, 8], [0, 24]], 2); }
        else if (ph === 2) { g.poly([[128, 8], [239, 0], [239, 34]], 6); g.poly([[128, 8], [239, 8], [239, 24]], 2); }
        else if (ph === 1) { g.ell(120, 8, 30, 14, 8); }
      }
      g.rect(170, 98, 239, 112, night ? 15 : 7); waves(g, f, 170, 239, 99, 112);
      g.poly([[0, 112], [60, 106], [120, 110], [180, 106], [239, 112], [239, 149], [0, 149]], night ? 13 : 4);
      for (i = 0; i < 20; i++) { x = 6 + h1(i) * 228; y = 116 + h1(i + 20) * 30; g.line(x, y, x - 2, y - 4, L); g.line(x, y, x + 1, y - 5, L); }
      /* la torre a fasce */
      for (y = 22; y <= 128; y++) {
        hh = 16 + (y - 22) * 0.17; band = Math.floor((y - 22) / 14) % 2;
        g.hline(120 - hh, 120 + hh, y, band ? 16 : (night ? 4 : 0));
        g.hline(120 + hh - 6, 120 + hh, y, band ? 16 : (night ? 10 : 6));
        g.px(120 - hh, y, L); g.px(120 + hh, y, L);
      }
      g.rect(118, 54, 122, 60, 16); g.rect(118, 82, 122, 88, 16);
      /* ballatoio e lanterna */
      g.rect(96, 18, 144, 21, 16); g.hline(96, 144, 21, L); g.hline(98, 142, 12, L); for (x = 98; x <= 142; x += 4) { g.vline(x, 12, 18, L); }
      g.rect(108, 3, 132, 12, ph === 1 ? 0 : (night ? 9 : 6)); g.frame(108, 3, 132, 12, L); g.vline(116, 3, 12, L); g.vline(124, 3, 12, L);
      g.poly([[105, 3], [120, -8], [135, 3]], 16); g.hline(105, 135, 3, L);
      /* la porta di ferro */
      g.rect(110, 108, 130, 128, 16); g.ell(120, 108, 10, 6, 16); g.arc(120, 108, 11, 7, PI, 2 * PI, 0); g.vline(109, 108, 128, 0); g.vline(131, 108, 128, 0);
      for (y = 104; y < 128; y += 5) { g.px(113, y, 0); g.px(127, y, 0); } g.ell(126, 118, 1, 1, 0);
      g.rect(104, 129, 136, 132, night ? 9 : 6); g.frame(104, 129, 136, 132, L);
      if (night) { rain(g, f, 70, 0, 0, 239, 149, false); }
    };
  }

  /* ================= LA CAMERA 7 ================= */
  function camera(night) {
    return function (g, f) {
      var flash = night && f % 6 === 0, sw = [0, 1, 0, -1][f % 4], L = night ? 0 : 16, i, x, y;
      g.rect(0, 0, 239, 110, night ? (flash ? 8 : 12) : 3); g.hline(0, 239, 110, 16);
      g.rect(0, 111, 239, 149, night ? 14 : 7); for (y = 116; y < 150; y += 5 + (y - 110) / 6) { g.hline(0, 239, Math.round(y), 16); }
      /* finestra sul golfo */
      g.rect(70, 18, 130, 78, night ? 16 : 2); g.rect(70, 58, 130, 78, night ? 15 : 6); waves(g, f, 70, 130, 59, 78);
      g.poly([[96, 58], [112, 52], [130, 50], [130, 58]], night ? 12 : 10);
      for (y = 40; y <= 54; y++) { g.hline(112 - 1, 112 + 1, y, Math.floor((y - 40) / 4) % 2 ? 16 : (night ? 6 : 0)); }
      g.rect(110, 36, 114, 39, flash ? 0 : 16);
      if (flash) { g.poly([[112, 37], [70, 30], [70, 44]], 2); }
      g.frame(69, 17, 131, 79, L); g.frame(68, 16, 132, 80, 16); g.vline(100, 18, 78, L); g.hline(70, 130, 48, L);
      g.rect(64, 80, 136, 82, 0); g.frame(64, 80, 136, 82, 16);
      if (flash) { g.poly([[132, 28], [210, 54], [236, 149], [160, 149], [132, 80]], 3); }
      /* tenda */
      g.maskOn(); g.poly([[58, 12], [74, 12], [76 + sw, 48], [72 + sw * 2, 86], [56, 86]], night ? 9 : 0); g.keyline(16);
      for (i = 0; i < 3; i++) { g.line(61 + i * 4, 14, 61 + i * 4 + sw, 84, 16); }
      g.hline(50, 140, 11, 16); g.hline(50, 140, 12, 16);
      /* armadio che non chiude */
      g.maskOn(); g.rect(0, 22, 38, 112, night ? 13 : 9); g.keyline(L);
      g.maskOn(); g.poly([[20, 24], [40 + sw * 2, 20], [40 + sw * 2, 114], [20, 110]], night ? 11 : 4); g.keyline(16);
      g.ell(26, 66, 1, 2, 16);
      /* catino */
      g.line(42, 130, 48, 98, 16, 1); g.line(60, 130, 54, 98, 16, 1); g.hline(44, 58, 116, 16);
      g.maskOn(); g.ell(51, 96, 12, 4, 0); g.keyline(16); g.ell(51, 96, 9, 2, night ? 10 : 6);
      /* letto di ferro con la valigia */
      for (x = 152; x <= 180; x += 5) { g.vline(x, 62, 100, night ? 4 : 16); } g.rect(150, 58, 152, 128, night ? 4 : 16); g.hline(150, 182, 60, night ? 4 : 16); g.hline(150, 182, 64, night ? 4 : 16);
      g.maskOn(); g.poly([[150, 98], [239, 94], [239, 120], [150, 124]], 0); g.keyline(16);
      g.poly([[176, 100], [239, 97], [239, 120], [176, 122]], "h3"); g.maskOn(); g.ell(164, 98, 10, 4, 0); g.keyline(16);
      g.maskOn(); g.rect(192, 80, 228, 99, 16); g.keyline(0);
      g.vline(200, 80, 99, 0); g.vline(220, 80, 99, 0); g.arc(210, 80, 5, 3, PI, 2 * PI, 16); g.rect(204, 86, 214, 92, 0); g.hline(206, 212, 89, 9);
      g.rect(152, 124, 154, 140, 16); g.rect(236, 120, 238, 140, 16);
    };
  }

  /* ================= IL MOLO, DI GIORNO ================= */
  function moloGiorno(g, f) {
    var b = [0, 1, 0, -1][f % 4], i, x, y, t, gx;
    g.rect(0, 0, 239, 62, 4); g.ell(60 + (f % 8), 16, 52, 6, 1); g.ell(190 - (f % 8), 8, 46, 4, 1);
    g.rect(0, 62, 239, 149, 7); waves(g, f, 0, 239, 63, 149);
    g.poly([[150, 63], [180, 52], [239, 48], [239, 64], [150, 64]], 10);
    for (y = 30; y <= 50; y++) { g.hline(208, 212, y, Math.floor((y - 30) / 4) % 2 ? 16 : 0); } g.rect(207, 25, 213, 29, 16); g.px(210, 23, 16);
    /* gabbiani */
    for (i = 0; i < 3; i++) { gx = 40 + i * 50 + (f * 3 + i * 20) % 30; y = 24 + i * 7 + ((f + i) % 2); t = (f + i) % 2 ? 2 : -1; g.line(gx - 4, y + t, gx, y + 2, 16); g.line(gx, y + 2, gx + 4, y + t, 16); }
    /* barche all'ormeggio */
    for (i = 0; i < 2; i++) {
      x = 150 + i * 44; y = 84 + i * 6 + (i ? -b : b);
      g.maskOn(); g.poly([[x - 16, y], [x + 16, y], [x + 11, y + 7], [x - 12, y + 7]], 16); g.keyline(0);
      g.hline(x - 16, x + 16, y + 2, 0); g.vline(x, y - 22, y, 16); g.line(x, y - 20, x + 10, y - 2, 9); g.rect(x - 2, y - 16, x + 1, y - 6, 12);
    }
    /* reti stese */
    g.vline(26, 54, 108, 16); g.vline(27, 54, 108, 16); g.vline(92, 54, 104, 16); g.vline(93, 54, 104, 16);
    g.poly([[28, 58], [60, 68], [91, 58], [91, 96 + b], [60, 100 - b], [28, 98 + b]], "d");
    g.poly([[28, 58], [60, 68], [91, 58], [91, 96 + b], [60, 100 - b], [28, 98 + b]], "e");
    g.pline([[28, 58], [60, 68], [91, 58]], 16);
    /* il molo */
    g.poly([[0, 104], [150, 112], [196, 149], [0, 149]], 0);
    for (i = 0; i < 9; i++) { t = i / 8; t = t * t * 0.6 + t * 0.4; g.line(0, 106 + t * 43, 150 + t * 46, 112 + t * 37, 16); }
    g.line(150, 112, 196, 149, 16, 1); g.hline(0, 150, 104, 16);
    g.rect(196, 112, 239, 149, 7); waves(g, f + 2, 196, 239, 113, 149);
    g.maskOn(); g.rect(40, 118, 48, 128, 16); g.ell(44, 117, 6, 2, 16); g.keyline(0);
    /* uomini che smettono di parlare quando passi */
    man(g, 112, 114, 36, { coat: 16, key: 0, arms: "smoke", f: f });
    man(g, 132, 116, 38, { coat: 11, key: 0, f: f });
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

  var OBJ = {};
  OBJ.tesserino = plate("TESSERINO", 3, function (g) {
    g.rect(24, 13, 100, 59, 13); g.rect(22, 11, 98, 57, 0); g.frame(22, 11, 98, 57, 16);
    g.rect(22, 11, 98, 19, 16); g.text(26, 13, "SERVIZIO FARI", 0, 1);
    g.rect(27, 24, 45, 50, 4); g.frame(27, 24, 45, 50, 16); g.ell(36, 33, 5, 6, 16); g.poly([[28, 50], [30, 42], [36, 40], [42, 42], [44, 50]], 16); g.hline(34, 38, 34, 0);
    g.text(50, 24, "CORVI ADA", 16, 1); g.text(50, 32, "ISPETTRICE", 16, 1); g.hline(50, 92, 40, 9); g.hline(50, 84, 44, 9);
    g.ring(82, 48, 8, 6, 16); g.ring(82, 48, 6, 4, 16); g.text(77, 46, "SFS", 16, 1);
  });
  OBJ.sigarette = plate("NAZIONALI", 3, function (g) {
    g.rect(22, 18, 60, 60, 13); g.maskOn(); g.rect(20, 16, 58, 58, 0); g.keyline(16);
    g.rect(20, 30, 58, 40, 16); g.text(22, 33, "NAZIONALI", 0, 1); g.hline(20, 58, 22, 9);
    for (var i = 0; i < 3; i++) { g.maskOn(); g.rect(25 + i * 7, 8 + (i % 2) * 3, 29 + i * 7, 16, 0); g.keyline(16); g.hline(25 + i * 7, 29 + i * 7, 9 + (i % 2) * 3, 6); }
    g.rect(74, 28, 94, 60, 13); g.maskOn(); g.rect(72, 26, 92, 58, 6); g.rect(72, 19, 92, 25, 9); g.keyline(16);
    g.hline(72, 92, 25, 16); g.vline(75, 27, 57, 0); g.rect(76, 12, 84, 19, 0); g.frame(76, 12, 84, 19, 16); g.px(78, 15, 16); g.px(81, 15, 16); g.px(78, 17, 16); g.px(81, 17, 16);
    g.ell(88, 15, 3, 3, 12); g.ring(88, 15, 3, 3, 16);
  });
  OBJ.chiave = plate("CHIAVE CAMERA 7", 3, function (g) {
    shadow(g, 20, 96, 46);
    g.maskOn(); g.ell(32, 32, 13, 13, 6); g.rect(44, 29, 96, 35, 6); g.rect(80, 35, 85, 46, 6); g.rect(89, 35, 93, 42, 6); g.rect(46, 26, 50, 38, 6); g.keyline(16);
    g.ell(32, 32, 5, 5, 3); g.ring(32, 32, 5, 5, 16); g.ring(32, 32, 10, 10, 9); g.hline(46, 94, 30, 0); g.hline(46, 94, 34, 12);
    g.text(25, 25, "7", 16, 1); g.text(26, 26, "7", 0, 1); g.text(25, 25, "7", 16, 1);
  });
  OBJ.gettone = plate("GETTONE TELEFONICO", 3, function (g) {
    g.ell(62, 36, 24, 24, 13); g.ell(60, 33, 24, 24, 6); g.ring(60, 33, 24, 24, 16); g.ring(60, 33, 21, 21, 9);
    g.rect(50, 16, 52, 50, 16); g.rect(68, 16, 70, 50, 16); g.vline(53, 16, 50, 0); g.vline(71, 16, 50, 0);
    g.arc(60, 33, 17, 17, -2.6, -0.5, 0);
  });
  OBJ.pistola = plate("BERETTA MOD. 34", 3, function (g) {
    shadow(g, 22, 94, 60);
    g.maskOn();
    g.poly([[20, 20], [94, 20], [96, 23], [96, 30], [20, 30]], 16);
    g.poly([[26, 30], [66, 30], [66, 34], [56, 36], [50, 60], [34, 60], [36, 36], [26, 34]], 16);
    g.keyline(0);
    g.hline(22, 94, 21, 0); g.px(95, 25, 0); for (var x = 24; x < 34; x += 2) { g.vline(x, 22, 28, 0); }
    g.rect(37, 38, 49, 57, "d"); g.frame(37, 38, 49, 57, 0); g.ell(43, 47, 2, 2, 0);
    g.arc(60, 38, 7, 6, 0, PI, 16); g.arc(60, 38, 8, 7, 0, PI, 0); g.line(59, 34, 57, 40, 0);
    g.px(19, 22, 16); g.px(18, 23, 16); g.text(60, 23, "PB", 0, 1);
  });
  OBJ.foto = plate("FOTOGRAFIA IN CORNICE", 4, function (g) {
    g.rect(22, 3, 98, 64, 16); g.rect(25, 6, 95, 61, 9); g.frame(22, 3, 98, 64, 0);
    g.rect(29, 10, 91, 57, 0);
    g.rect(32, 13, 88, 47, 3); g.rect(32, 40, 88, 47, 6);
    for (var y = 15; y <= 40; y++) { var hh = 3 + (y - 15) * 0.08; g.hline(78 - hh, 78 + hh, y, Math.floor((y - 15) / 5) % 2 ? 16 : 0); } g.rect(75, 12, 81, 15, 16);
    g.maskOn(); g.ell(48, 21, 3, 4, 16); g.poly([[44, 25], [52, 25], [53, 40], [50, 46], [46, 46], [43, 40]], 16); g.keyline(0); g.hline(46, 50, 20, 0);
    g.maskOn(); g.ell(60, 23, 3, 4, 16); g.poly([[57, 27], [63, 27], [64, 34], [68, 46], [52, 46], [56, 34]], 12); g.ell(60, 19, 4, 2, 16); g.keyline(0); g.px(59, 24, 0); g.px(61, 24, 0);
    g.line(33, 51, 50, 51, 9); g.line(52, 51, 70, 52, 9); g.line(33, 54, 46, 54, 9);
  });
  OBJ.mazzo = plate("LE CHIAVI DI ZANON", 3, function (g) {
    g.ring(30, 18, 9, 9, 16); g.ring(30, 18, 8, 8, 16); g.ring(30, 18, 10, 10, 0);
    g.maskOn(); g.ell(40, 26, 6, 6, 13); g.line(44, 30, 92, 56, 13, 1); g.line(45, 31, 92, 57, 13, 1); g.rect(84, 52, 90, 62, 13); g.rect(78, 50, 82, 58, 13); g.keyline(0);
    g.ell(40, 26, 2, 2, 2);
    g.maskOn(); g.ell(30, 32, 4, 4, 6); g.rect(29, 35, 31, 52, 6); g.rect(31, 46, 34, 50, 6); g.keyline(16);
    g.maskOn(); g.ell(22, 30, 4, 4, 10); g.line(20, 33, 12, 50, 10, 1); g.rect(10, 46, 14, 50, 10); g.keyline(0);
    g.maskOn(); g.ell(36, 30, 3, 3, 4); g.line(37, 33, 50, 54, 4, 1); g.rect(48, 50, 53, 54, 4); g.keyline(16);
  });
  OBJ.quaderno = plate("IL QUADERNO NERO", 7, function (g) {
    g.poly([[12, 8], [104, 4], [110, 60], [8, 63]], 3); g.pline([[12, 8], [104, 4], [110, 60], [8, 63], [12, 8]], 16);
    for (var i = 0; i < 6; i++) { g.line(14 + i * 16, 8, 12 + i * 16, 62, 6); }
    g.rect(40, 16, 86, 58, 12); g.maskOn(); g.rect(36, 12, 82, 54, 16); g.keyline(0);
    g.vline(40, 12, 54, 12); g.vline(74, 12, 54, 9); g.rect(46, 20, 68, 28, 0); g.frame(46, 20, 68, 28, 16); g.hline(49, 65, 24, 9);
    g.hline(37, 81, 55, 0); g.hline(38, 81, 56, 3);
  });
  OBJ.telefono = plate("TELEFONO A GETTONI", 4, function (g) {
    g.rect(42, 8, 84, 62, 13); g.maskOn(); g.rect(38, 4, 80, 58, 16); g.keyline(0);
    g.ell(59, 22, 11, 11, 13); g.ring(59, 22, 11, 11, 0); for (var i = 0; i < 10; i++) { g.ell(59 + 8 * Math.cos(i * 0.55 + 0.6), 22 + 8 * Math.sin(i * 0.55 + 0.6), 1, 1, 0); } g.ell(59, 22, 3, 3, 0);
    g.rect(55, 40, 63, 42, 0); g.rect(42, 46, 76, 54, 0); g.text(45, 48, "GETTONE", 16, 1);
    g.maskOn(); g.rect(30, 8, 35, 42, 16); g.ell(32, 8, 4, 3, 16); g.ell(32, 42, 4, 3, 16); g.keyline(0); g.rect(35, 14, 38, 16, 0);
    g.line(32, 44, 30, 52, 16); g.line(30, 52, 36, 58, 16);
    g.rect(88, 30, 108, 60, 0); g.frame(88, 30, 108, 60, 16); for (var y = 34; y < 58; y += 3) { g.hline(90, 106, y, 9); } g.line(98, 22, 98, 30, 16); g.px(98, 21, 16);
  });
  OBJ.banco = plate("LA LICENZA", 5, function (g) {
    g.rect(22, 4, 98, 34, 16); g.rect(24, 6, 96, 32, 0); g.frame(25, 7, 95, 31, 9);
    g.text(46, 9, "LICENZA", 16, 1); g.text(32, 17, "BRESSAN NIVES", 16, 1); g.text(28, 24, "MESCITA ALLOGGIO", 16, 1);
    g.rect(0, 46, 119, 65, 10); g.rect(0, 42, 119, 46, 0); g.hline(0, 119, 41, 16); g.hline(0, 119, 47, 16);
    g.arc(30, 44, 5, 2, 0, PI, 9); g.arc(86, 44, 4, 2, 0, PI, 9);
    g.maskOn(); g.poly([[60, 30], [70, 30], [69, 42], [61, 42]], 0); g.keyline(16); g.rect(62, 36, 68, 41, 4);
  });
  OBJ.grappa = plate("SENZA ETICHETTA", 11, function (g) {
    g.maskOn(); g.rect(42, 22, 62, 60, 3); g.rect(48, 8, 56, 22, 3); g.poly([[42, 22], [48, 16], [56, 16], [62, 22]], 3); g.keyline(16);
    g.rect(48, 3, 56, 8, 14); g.rect(43, 34, 61, 60, 6); g.vline(45, 24, 58, 0); g.vline(46, 24, 40, 0);
    g.maskOn(); g.poly([[72, 40], [88, 40], [86, 60], [74, 60]], 0); g.keyline(16); g.rect(75, 50, 85, 59, 5); g.vline(74, 42, 58, 16);
    g.rect(30, 61, 100, 65, 13);
  });
  OBJ.giornale = plate("LISTINI DI BORSA", 12, function (g) {
    g.maskOn(); g.poly([[18, 6], [100, 4], [102, 62], [16, 63]], 0); g.keyline(16);
    g.text(24, 8, "SKRZYDLA", 16, 2); g.hline(20, 98, 19, 16); g.hline(20, 98, 21, 16);
    for (var c = 0; c < 3; c++) { for (var y = 25; y < 60; y += 3) { g.hline(22 + c * 26, 40 + c * 26 - (y % 9 === 1 ? 6 : 0), y, 9); } }
    g.rect(48, 28, 66, 40, 16); for (var i = 0; i < 4; i++) { g.text(49, 29 + 0, "", 0, 1); } g.text(49, 30, "142", 0, 1); g.text(49, 36, "-7", 0, 1);
    g.vline(59, 5, 62, 6);
  });
  OBJ.stufa = plate("GHISA E LIGNITE", 4, function (g, f) {
    g.maskOn(); g.rect(40, 20, 80, 58, 16); g.rect(54, 0, 62, 20, 16); g.rect(36, 18, 84, 21, 16); g.keyline(0);
    g.rect(48, 30, 72, 48, 6); g.frame(48, 30, 72, 48, 0); for (var y = 32; y < 48; y += 3) { g.hline(49, 71, y, 16); }
    g.rect(42, 59, 46, 64, 16); g.rect(74, 59, 78, 64, 16); g.hline(54, 62, 8, 0);
    g.rect(0, 62, 119, 65, 9); g.ring(90, 30, 3, 3, 9); g.ring(94, 22, 4, 4, 6);
  });
  OBJ.stufaCenere = plate("CARTA BRUCIATA", 14, function (g) {
    for (var i = 0; i < 40; i++) { g.px(4 + h1(i) * 112, 4 + h1(i + 40) * 60, 0); }
    g.maskOn(); g.poly([[20, 10], [92, 6], [96, 20], [88, 26], [98, 38], [84, 48], [90, 60], [62, 56], [50, 62], [36, 54], [22, 58], [26, 40], [16, 28]], 1); g.keyline(12);
    g.text(30, 14, "B.", 16, 2); g.text(30, 34, "K.", 16, 2);
    g.text(52, 14, "1200", 16, 1); g.text(52, 21, " 850", 16, 1); g.text(52, 28, "3400", 16, 1); g.text(52, 37, " 600", 16, 1); g.text(52, 44, "1100", 16, 1);
    g.hline(50, 70, 50, 16);
    g.pline([[84, 48], [90, 60], [62, 56], [50, 62]], 16); g.pline([[92, 6], [96, 20], [88, 26], [98, 38], [84, 48]], 16);
  });
  OBJ.valigia = plate("LA TUA VALIGIA", 5, function (g) {
    g.maskOn(); g.poly([[14, 30], [104, 30], [96, 4], [22, 4]], 12); g.keyline(16); g.poly([[20, 28], [98, 28], [92, 8], [26, 8]], 3);
    g.maskOn(); g.rect(10, 32, 108, 62, 13); g.keyline(16);
    g.rect(14, 34, 104, 52, 2); g.maskOn(); g.poly([[18, 36], [60, 36], [62, 48], [16, 50]], 0); g.keyline(16); g.hline(20, 58, 41, 9);
    g.maskOn(); g.poly([[64, 36], [100, 36], [100, 50], [66, 50]], 9); g.keyline(16);
    g.poly([[70, 44], [100, 40], [102, 52], [72, 54]], 16);
    g.rect(30, 30, 34, 34, 0); g.rect(84, 30, 88, 34, 0);
  });
  OBJ.finestraRetro = plate("IL RETRO DELLA CASA", "stone", function (g) {
    g.rect(40, 10, 80, 54, 16); g.frame(38, 8, 82, 56, 0); g.frame(37, 7, 83, 57, 16);
    g.maskOn(); g.poly([[80, 10], [100, 4], [100, 60], [80, 54]], 6); g.keyline(16); for (var y = 10; y < 58; y += 4) { g.line(81, y + 1, 99, y - 3 + (y - 10) * 0.12, 16); }
    g.maskOn(); g.rect(40, 10, 58, 54, 9); g.keyline(16); for (y = 14; y < 54; y += 4) { g.hline(41, 57, y, 16); }
    g.line(82, 30, 88, 26, 0, 1); g.line(88, 26, 86, 22, 0); g.rect(34, 57, 86, 60, 0); g.frame(34, 57, 86, 60, 16);
  });
  OBJ.letto = plate("IL LETTO DELLA 7", 4, function (g) {
    g.rect(14, 6, 16, 64, 16); g.hline(14, 46, 8, 16); g.hline(14, 46, 12, 16); for (var x = 20; x <= 44; x += 6) { g.vline(x, 12, 40, 16); g.ell(x, 26, 1, 2, 16); } g.rect(44, 6, 46, 40, 16);
    g.maskOn(); g.poly([[14, 38], [116, 34], [116, 56], [14, 60]], 0); g.keyline(16);
    g.maskOn(); g.ell(30, 38, 13, 5, 0); g.keyline(16);
    g.poly([[50, 40], [116, 36], [116, 56], [50, 58]], "h3"); g.line(70, 40, 74, 57, 16); g.line(92, 38, 96, 56, 16);
    g.ell(60, 47, 6, 2, 3); g.ell(84, 45, 8, 2, 3);
  });
  OBJ.lampione = plate("IL LAMPIONE", 16, function (g) {
    g.poly([[52, 16], [68, 16], [96, 64], [24, 64]], 6); g.poly([[55, 16], [65, 16], [80, 64], [40, 64]], 3);
    g.rect(58, 18, 61, 64, 16); g.vline(58, 18, 64, 0);
    g.poly([[50, 10], [70, 10], [66, 18], [54, 18]], 16); g.pline([[50, 10], [70, 10], [66, 18], [54, 18], [50, 10]], 0); g.rect(56, 11, 64, 16, 0); g.poly([[54, 10], [60, 4], [66, 10]], 16); g.pline([[54, 10], [60, 4], [66, 10]], 0);
    for (var i = 0; i < 30; i++) { var x = 30 + h1(i) * 62, y = 18 + h1(i + 33) * 40; g.line(x, y, x - 1, y + 3, 16); }
    for (i = 0; i < 18; i++) { x = h1(i + 9) * 118; y = 4 + h1(i + 61) * 58; if (x < 24 || x > 96) { g.line(x, y, x - 1, y + 3, 0); } }
  });
  OBJ.acqua = plate("SOTTO LE ASSI", 16, function (g, f) {
    g.rect(0, 0, 119, 12, 6); for (var x = 0; x < 120; x += 12) { g.vline(x, 0, 12, 16); } g.hline(0, 119, 12, 16); g.hline(0, 119, 13, 0);
    for (var i = 0; i < 4; i++) { x = 12 + i * 30; g.rect(x, 14, x + 6, 64, 12); g.vline(x, 14, 64, 0); for (var y = 40; y < 64; y += 3) { g.px(x + 3, y, 0); } }
    for (y = 36; y < 66; y += 4) { for (x = (y * 7) % 11; x < 120; x += 14) { g.hline(x, x + 4, y, 0); } }
    g.hline(0, 119, 34, 9);
  });
  OBJ.manifesto = plate("VOTATE", 9, function (g) {
    g.maskOn(); g.poly([[28, 4], [92, 4], [92, 52], [86, 56], [80, 50], [72, 58], [62, 52], [52, 60], [40, 54], [28, 58]], 0); g.keyline(16);
    g.text(36, 8, "VOTATE", 16, 2); g.rect(30, 20, 90, 34, 3); g.rect(34, 24, 86, 30, 5);
    g.rect(40, 36, 82, 50, 0); g.frame(40, 36, 82, 50, 16); g.text(42, 38, "COPRIFUOCO", 16, 1); g.hline(43, 79, 44, 9); g.hline(43, 72, 47, 9);
    g.poly([[92, 4], [92, 14], [84, 4]], 9); g.pline([[84, 4], [90, 12], [92, 14]], 16);
  });
  OBJ.fascicolo = plate("FASCICOLO ZANON", 10, function (g) {
    g.maskOn(); g.poly([[10, 10], [104, 6], [108, 62], [12, 64]], 4); g.keyline(16); g.text(70, 54, "PS", 16, 1);
    g.maskOn(); g.poly([[24, 12], [74, 10], [76, 60], [26, 62]], 0); g.keyline(16);
    g.maskOn(); g.poly([[20, 8], [70, 6], [72, 56], [22, 58]], 0); g.keyline(16);
    g.text(30, 11, "VERBALE", 16, 1); for (var y = 20; y < 52; y += 3) { g.hline(26, 64 - (y % 6), y, 9); }
    g.text(28, 44, "ORE 2.10", 16, 1);
    for (var i = 0; i < 3; i++) { g.maskOn(); g.rect(80 + i * 3, 14 + i * 12, 100 + i * 2, 26 + i * 12, 13); g.keyline(0); }
    g.line(24, 4, 24, 14, 16, 1); g.ring(24, 10, 2, 5, 16);
  });
  OBJ.polsi = plate("LA SECONDA FOTOGRAFIA", 3, function (g) {
    g.rect(20, 6, 100, 62, 0); g.frame(20, 6, 100, 62, 16); g.rect(24, 10, 96, 52, 14);
    g.poly([[24, 34], [70, 26], [96, 28], [96, 40], [70, 40], [24, 46]], 5);
    g.poly([[70, 26], [84, 22], [96, 24], [96, 28]], 7);
    g.line(54, 29, 56, 43, 16); g.line(58, 28, 60, 42, 16); g.line(55, 29, 57, 43, 12); g.line(59, 28, 61, 42, 12);
    g.text(26, 55, "2", 16, 1); g.line(32, 57, 60, 56, 9);
  });
  OBJ.armadietto = plate("ARMADIETTO", 9, function (g) {
    g.maskOn(); g.rect(24, 2, 96, 64, 3); g.keyline(16); g.frame(24, 2, 96, 64, 16); g.vline(60, 2, 64, 16);
    for (var y = 8; y < 22; y += 3) { g.hline(30, 54, y, 16); g.hline(66, 90, y, 16); }
    g.text(34, 26, "RISERVATO", 16, 1);
    g.rect(52, 34, 56, 48, 16); g.rect(64, 34, 68, 48, 16);
    g.maskOn(); g.rect(54, 46, 66, 58, 12); g.keyline(16); g.arc(60, 46, 4, 6, PI, 2 * PI, 16); g.arc(60, 46, 5, 7, PI, 2 * PI, 16); g.rect(59, 50, 61, 54, 0);
  });
  OBJ.sigilli = plate("I SIGILLI", "v3", function (g) {
    g.rect(0, 0, 119, 65, "v3"); g.rect(10, 0, 110, 65, 13); for (var x = 12; x < 110; x += 6) { g.vline(x, 0, 65, 16); }
    g.maskOn(); g.poly([[16, 4], [26, 4], [104, 62], [94, 62]], 0); g.poly([[94, 4], [104, 4], [26, 62], [16, 62]], 0); g.keyline(16);
    g.maskOn(); g.ell(60, 33, 11, 11, 0); g.keyline(16); g.ring(60, 33, 9, 9, 16); g.ring(60, 33, 7, 7, 9); g.text(54, 31, "PS", 16, 1);
    g.text(26, 14, "POLIZIA", 9, 1);
  });
  OBJ.muretto = plate("IL MURETTO", 2, function (g) {
    g.rect(0, 22, 119, 65, 7); for (var y = 25; y < 50; y += 4) { for (var x = (y * 5) % 13; x < 120; x += 16) { g.hline(x, x + 3, y, 0); } } g.hline(0, 119, 22, 9);
    var i, r, x0, n;
    for (r = 0; r < 3; r++) {
      for (i = 0; i < 9; i++) {
        x0 = i * 14 + (r % 2) * 7 - 4; n = 46 + r * 7;
        if (x0 > 44 && x0 < 72 && r < 2) { continue; }
        g.maskOn(); g.ell(x0 + 6, n, 7, 4, [0, 4, 3, 6][(i + r) % 4]); g.keyline(16);
      }
    }
    g.maskOn(); g.ell(58, 58, 5, 3, 4); g.ell(66, 61, 4, 2, 0); g.keyline(16);
  });
  OBJ.porta = plate("LA PORTA DEL FARO", "stone", function (g) {
    g.maskOn(); g.rect(30, 4, 90, 65, 13); g.ell(60, 4, 30, 6, 13); g.keyline(0); g.frame(30, 4, 90, 65, 16);
    for (var y = 8; y < 64; y += 8) { for (var x = 34; x < 88; x += 8) { g.px(x, y, 0); } } g.hline(30, 89, 22, 16); g.hline(30, 89, 46, 16);
    g.maskOn(); g.rect(72, 28, 82, 42, 4); g.keyline(16); g.ell(77, 33, 2, 2, 16); g.rect(76, 33, 78, 38, 16);
    for (var i = 0; i < 6; i++) { g.line(38 + i * 9, 24, 36 + i * 9, 30 + (i % 3) * 3, 9); }
  });
  OBJ.scrivania = plate("SOTTO IL PIANO", 10, function (g) {
    for (var y = 2; y < 64; y += 3) { g.hline(0, 119, y, Math.floor(y / 7) % 2 ? 16 : 12); }
    g.rect(16, 18, 104, 50, 6); g.frame(16, 18, 104, 50, 16);
    carve(g, 22, 22, "1-3  2-1", 2); carve(g, 22, 36, "2-2  3-1", 2);
  });
  OBJ.registro = plate("IL REGISTRO DEI FARI", 12, function (g) {
    g.maskOn(); g.poly([[8, 8], [58, 10], [58, 62], [6, 60]], 0); g.poly([[62, 10], [112, 8], [114, 60], [62, 62]], 0); g.keyline(16); g.vline(60, 9, 62, 16);
    g.text(14, 12, "REGISTRO", 16, 1); for (var y = 20; y < 58; y += 4) { g.hline(10, 56, y, 9); g.px(22, y - 1, 16); g.px(34, y - 2, 16); } g.vline(20, 18, 58, 9); g.vline(38, 18, 58, 9);
    for (var i = 0; i < 3; i++) { g.rect(62 + i * 3, 10, 63 + i * 3, 62, i % 2 ? 0 : 3); g.vline(64 + i * 3, 10, 62, 16); }
    for (y = 20; y < 58; y += 4) { g.hline(74, 110, y, 9); } g.text(76, 12, "NOV.", 16, 1);
  });
  function quadro(man) {
    return function (g) {
      g.rect(10, 4, 110, 62, 9); g.frame(10, 4, 110, 62, 16); g.frame(12, 6, 108, 60, 0);
      g.rect(18, 12, 66, 22, 0); g.text(20, 15, "AUTOMATICO", 16, 1); g.rect(18, 44, 66, 54, 0); g.text(26, 47, "MANUALE", 16, 1);
      g.ell(42, 33, 6, 6, 12); g.ring(42, 33, 6, 6, 0);
      if (man) { g.line(42, 33, 42, 44, 16, 1); g.ell(42, 45, 3, 3, 16); } else { g.line(42, 33, 42, 22, 16, 1); g.ell(42, 21, 3, 3, 16); }
      g.maskOn(); g.ell(88, 36, 11, 8, 4); g.keyline(16); g.ell(88, 34, 8, 5, 1); g.ring(88, 36, 11, 8, 16); g.text(78, 48, "TASTO", 0, 1);
    };
  }
  OBJ.leva = plate("IL QUADRO", 3, quadro(false));
  OBJ.levaM = plate("IL QUADRO", 3, quadro(true));
  function sportello(st) {
    return function (g) {
      g.rect(0, 0, 119, 65, 11); for (var i = 0; i < 8; i++) { g.hline(0, 119, 4 + i * 2, i % 2 ? 9 : 4); }
      g.rect(30, 22, 90, 62, 16); g.frame(28, 20, 92, 64, 0);
      if (!st) {
        g.rect(30, 22, 90, 62, 6); g.frame(30, 22, 90, 62, 16); g.maskOn(); g.rect(78, 38, 84, 46, 4); g.keyline(16); g.rect(80, 41, 82, 44, 16);
        for (i = 34; i < 76; i += 8) { g.px(i, 26, 16); g.px(i, 58, 16); }
      } else {
        g.maskOn(); g.poly([[30, 22], [14, 16], [14, 64], [30, 62]], 6); g.keyline(16);
        if (st === "pieno") { g.maskOn(); g.poly([[40, 42], [80, 38], [82, 58], [38, 60]], 9); g.keyline(0); g.line(46, 42, 74, 56, 6); g.line(42, 50, 70, 40, 6); }
        else { g.hline(32, 88, 58, 9); }
      }
    };
  }
  OBJ.sportello = plate("LO SPORTELLO", 3, sportello(""));
  OBJ.sportelloAperto = plate("LO SPORTELLO", 3, sportello("pieno"));
  OBJ.sportelloVuoto = plate("LO SPORTELLO", 3, sportello("vuoto"));
  OBJ.macchina = plate("APRILIA TARGA ROMA", 13, function (g) {
    g.rect(0, 52, 119, 65, 12);
    g.maskOn(); g.poly([[8, 46], [12, 34], [30, 30], [44, 16], [74, 14], [96, 26], [110, 32], [112, 46], [104, 50], [14, 50]], 16); g.keyline(0);
    g.poly([[46, 19], [72, 17], [74, 28], [46, 29]], 6); g.poly([[76, 18], [92, 27], [76, 28]], 6); g.vline(74, 17, 29, 16);
    g.ell(28, 50, 8, 8, 16); g.ring(28, 50, 8, 8, 0); g.ell(28, 50, 3, 3, 9); g.ell(94, 50, 8, 8, 16); g.ring(94, 50, 8, 8, 0); g.ell(94, 50, 3, 3, 9);
    g.hline(14, 104, 38, 9); g.ell(12, 38, 3, 3, 4); g.rect(102, 40, 116, 46, 0); g.text(103, 41, "ROMA", 16, 1);
  });
  OBJ.barca = plate("UNA LANTERNA AL LARGO", 16, function (g) {
    for (var i = 0; i < 20; i++) { g.px(h1(i) * 118, h1(i + 20) * 30, 0); }
    g.hline(0, 119, 36, 9); for (var y = 40; y < 66; y += 3) { for (var x = (y * 3) % 17; x < 120; x += 18) { g.hline(x, x + 2 + (y - 40) / 6, y, 0); } }
    g.poly([[52, 38], [72, 38], [68, 42], [56, 42]], 16); g.pline([[52, 38], [72, 38], [68, 42], [56, 42], [52, 38]], 9); g.vline(62, 28, 38, 9);
    g.ell(66, 34, 2, 2, 0); g.ring(66, 34, 4, 4, 6); for (y = 44; y < 64; y += 2) { g.hline(65 - (y % 3), 67 + (y % 2), y, 0); }
  });

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
  OBJ.nives = plate("NIVES BRESSAN", 10, function (g) { bust(g, 60, 21, 1, { hair: 1, coat: 13, shawl: "d", tired: 1 }); });
  OBJ.kessel = plate("KESSEL", 4, function (g) { bust(g, 60, 26, 1, { hat: "fedora", coat: 16, lapels: 0, tie: 6, glasses: 1, smoke: 1, f: 0 }); });
  OBJ.lodi = plate("BRIGADIERE LODI", 6, function (g) { bust(g, 60, 26, 1, { hat: "kepi", coat: 16, mous: 1, tired: 1, lapels: 9, tie: 16 }); });
  OBJ.brandi = plate("CAPITANO BRANDI", 12, function (g) { bust(g, 60, 26, 1, { hat: "fedora", hatT: 6, coat: 5, key: 16, scarf: 0, smirk: 1, lapels: 9, tie: 16 }); });
  OBJ.uomini = plate("GLI UOMINI DI BRANDI", 13, function (g) {
    bust(g, 36, 26, 0.8, { cap: 1, coat: 16, collarUp: 1 }); bust(g, 84, 24, 0.85, { cap: 1, coat: 15, collarUp: 1, smoke: 1, f: 1 });
    g.ring(30, 56, 5, 3, 0); g.ring(30, 59, 5, 3, 0);
  });
  var OBJN = ["tesserino", "sigarette", "chiave", "gettone", "pistola", "foto", "mazzo", "quaderno", "telefono", "banco", "grappa", "giornale", "stufa", "stufaCenere",
    "valigia", "finestraRetro", "letto", "lampione", "acqua", "manifesto", "fascicolo", "polsi", "armadietto", "sigilli", "muretto", "porta", "scrivania", "registro",
    "leva", "levaM", "sportello", "sportelloAperto", "sportelloVuoto", "macchina", "barca", "nives", "kessel", "lodi", "brandi", "uomini"];

  var REG = "100000";
  var SC = {
    faro: { w: W, h: H, n: 6, draw: gulf(REG, false) },
    finestra: { w: W, h: H, n: 6, draw: gulf(REG, true) },
    finestra21: { w: W, h: H, n: code(2, 1).length, draw: gulf(code(2, 1), true) },
    tx13: { w: W, h: H, n: code(1, 3).length, draw: gulf(code(1, 3), false) },
    tx21: { w: W, h: H, n: code(2, 1).length, draw: gulf(code(2, 1), false) },
    tx22: { w: W, h: H, n: code(2, 2).length, draw: gulf(code(2, 2), false) },
    tx31: { w: W, h: H, n: code(3, 1).length, draw: gulf(code(3, 1), false) },
    bar: { w: W, h: H, n: 12, draw: bar(true) },
    barVuoto: { w: W, h: H, n: 12, draw: bar(false) },
    piazza: { w: W, h: H, n: 8, draw: piazza(true) },
    piazzaGiorno: { w: W, h: H, n: 8, draw: piazza(false) },
    caserma: { w: W, h: H, n: 12, draw: caserma },
    strada: { w: W, h: H, n: 8, draw: strada(true) },
    stradaGiorno: { w: W, h: H, n: 8, draw: strada(false) },
    torre: { w: W, h: H, n: 8, draw: torre(true) },
    torreGiorno: { w: W, h: H, n: 8, draw: torre(false) },
    camera: { w: W, h: H, n: 6, draw: camera(true) },
    cameraGiorno: { w: W, h: H, n: 8, draw: camera(false) },
    moloGiorno: { w: W, h: H, n: 8, draw: moloGiorno },
    casa: { w: W, h: H, n: 4, draw: casa },
    lente: { w: W, h: H, n: 8, draw: lente(false) },
    lente4: { w: W, h: H, n: 8, draw: lente(true) },
    kessel: { w: W, h: H, n: 12, draw: kessel },
    cala: { w: W, h: H, n: 12, draw: cala("") },
    cala44: { w: W, h: H, n: 12, draw: cala("44") },
    ritratto: { w: 64, h: 80, n: 12, draw: ritratto }
  };
  for (var oi = 0; oi < OBJN.length; oi++) { SC["o_" + OBJN[oi]] = { w: OW, h: OH, n: 1, draw: OBJ[OBJN[oi]] }; }
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
