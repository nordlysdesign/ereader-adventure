/* ==================================================================
   PROVA PER TELEFONO: le scene del capitolo 1 di Acqua Cheta.
   Ogni scena è una funzione (F, t, st): F è la griglia di Ascii.Field
   (84 x 56 celle), t il tempo in secondi, st lo stato che le passano
   i filmati (dove sta la corriera, a che punto è il colpo...).
   Le celle sono alte quasi il doppio di quanto sono larghe: un cerchio
   si scrive con rx circa 1,7 volte ry.
   Tinte: 0 grigio-azzurro, 1 ambra, 2 rosso, 3 bianco caldo, 4 blu notte.
   ================================================================== */
var AsciiScenes = (function () {
  "use strict";
  var A = Ascii, noise = A.noise, fbm = A.fbm, hash = A.hash, clamp = A.clamp, mix = A.mix, smooth = A.smooth;

  /* ---------- mattoni ---------- */
  function sky(F, t, y1, k) {
    F.shade(0, 0, 84, y1, function (x, y) { return 0.05 + (k || 0.1) * fbm(x * 0.045 + t * 0.012, y * 0.1 + 3); }, 4, 0, "s1");
  }
  /* una montagna: sagoma scura, filo di cresta, un po' di neve sotto le cime */
  function mountain(F, p, body, ridge, tint) {
    var q = p.slice(), i;
    q.push([p[p.length - 1][0], 60]); q.push([p[0][0], 60]);
    F.poly(q, body, tint === undefined ? 4 : tint);
    F.path(p, ridge, 0);
    for (i = 1; i < p.length - 1; i++) {
      if (p[i][1] < p[i - 1][1] && p[i][1] < p[i + 1][1]) { F.poly([[p[i][0], p[i][1] + 0.6], [p[i][0] - 3.4, p[i][1] + 3.6], [p[i][0] - 0.6, p[i][1] + 2.6], [p[i][0] + 1.2, p[i][1] + 4], [p[i][0] + 3.2, p[i][1] + 3]], ridge * 0.9, 0); }
    }
  }
  function snowfall(F, t, k) {
    k = k === undefined ? 1 : k;
    F.snow(t, Math.round(70 * k), 2.2, 0.2, 1, { sway: 1 });
    F.snow(t, Math.round(46 * k), 3.6, 0.38, 2, { sway: 1.8 });
    F.snow(t, Math.round(22 * k), 5.5, 0.62, 3, { sway: 2.6, ch: "*.'" });
  }
  /* Ada di spalle: cappello di feltro, bavero alzato. side: da che parte le arriva la luce (-1 sinistra, 1 destra) */
  function ada(F, x, y, s, side, rim) {
    var d = [[x - 9 * s, y], [x - 8.4 * s, y - 9 * s], [x - 5 * s, y - 12.4 * s], [x + 5 * s, y - 12.4 * s], [x + 8.4 * s, y - 9 * s], [x + 9 * s, y]];
    F.poly(d, 0.14, 0);
    F.ell(x, y - 14.4 * s, 3 * s, 2.3 * s, 0.03, 0);
    F.ell(x, y - 16.6 * s, 6.6 * s, 1 * s, 0.03, 0);
    F.rect(x - 3.4 * s, y - 20 * s, x + 3.4 * s, y - 17 * s, 0.03, 0);
    F.path([[x - 9 * s, y], [x - 8.4 * s, y - 9 * s], [x - 5 * s, y - 12.4 * s], [x + 5 * s, y - 12.4 * s], [x + 8.4 * s, y - 9 * s], [x + 9 * s, y]], 0.4, 0);
    F.line(x - 6.6 * s, y - 16.6 * s, x + 6.6 * s, y - 16.6 * s, 0.5, 0, { st: 6 });
    F.path([[x - 3.4 * s, y - 17.4 * s], [x - 3.4 * s, y - 20.4 * s], [x + 3.4 * s, y - 20.4 * s], [x + 3.4 * s, y - 17.4 * s]], 0.4, 0);
    F.line(x, y - 11 * s, x, y, 0.03, 0, { mode: 0 });
    if (side) {
      F.path([[x + side * 5 * s, y - 12.4 * s], [x + side * 8.4 * s, y - 9 * s], [x + side * 9 * s, y]], rim || 0.8, 1);
      F.line(x + side * 3.4 * s, y - 20 * s, x + side * 3.4 * s, y - 17.4 * s, rim || 0.8, 1);
      F.line(x + side * 4 * s, y - 16.6 * s, x + side * 6.6 * s, y - 16.6 * s, rim || 0.8, 1);
    }
  }
  /* finestra accesa: vetri d'ambra, croce scura, un po' di luce che esce */
  function litWindow(F, x0, y0, x1, y1, l, t, seed) {
    var k = l * (0.9 + 0.1 * noise(t * 1.3 + seed, seed));
    F.rect(x0, y0, x1, y1, k, 1);
    F.line((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, 0.12, 0, { mode: 0 });
    F.line(x0, (y0 + y1) / 2, x1, (y0 + y1) / 2, 0.12, 0, { mode: 0 });
    F.glow((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 1.5, (y1 - y0) * 1.3, 0.22 * l, 1);
  }

  /* ================= LA FERMATA ================= */
  function fermata(F, t, st) {
    st = st || {};
    var p = st.bus === undefined ? (t % 50) / 17 : st.bus, s, bx, by, i;
    sky(F, t, 36);
    mountain(F, [[0, 21], [7, 13], [12, 17], [19, 8], [26, 17], [32, 25], [38, 33]], 0.02, 0.42);
    mountain(F, [[46, 33], [51, 25], [58, 14], [64, 9], [69, 15], [76, 7], [84, 13]], 0.02, 0.42);
    /* la diga, in fondo alla valle: più chiara del cielo */
    F.poly([[36.5, 22], [47.5, 22], [46, 34], [38, 34]], function (x, y) { return 0.3 + 0.06 * noise(x, y * 0.4); }, 0, { st: 2 });
    F.line(36, 21.6, 48, 21.6, 0.5, 0, { st: 6 });
    /* neve a terra, e la strada che scende */
    F.shade(0, 34, 84, 56, function (x, y) { return 0.07 + 0.07 * noise(x * 0.3, y * 0.9) + 0.03 * (y - 34) / 22; }, 0, 0, "s2");
    F.poly([[38.5, 34], [45.5, 34], [74, 56], [10, 56]], 0.02, 0);
    F.line(38.5, 34, 10, 56, 0.24, 0); F.line(45.5, 34, 74, 56, 0.24, 0);
    for (i = 0; i < 5; i++) { F.line(42, 36 + i * 4.4, 42, 37.6 + i * 4.4, 0.16, 0, { st: 2 }); }
    /* la corriera che riparte in discesa */
    if (p >= 0 && p < 1) {
      s = 1 - 0.82 * p; bx = 43.5 - 1.6 * p; by = 49 - 14 * p;
      F.glow(bx, by + 1, 13 * s, 3 * s, 0.3 * s, 1);
      F.rect(bx - 7 * s, by - 8.5 * s, bx + 7 * s, by, 0.16, 0);
      F.rect(bx - 7 * s, by - 9 * s, bx + 7 * s, by - 8.5 * s, 0.34, 0, { st: 5 });
      F.rect(bx - 5.4 * s, by - 7 * s, bx + 5.4 * s, by - 4.4 * s, 0.6 * (0.9 + 0.1 * noise(t * 2, 1)), 1);
      if (s > 0.4) { F.line(bx, by - 7 * s, bx, by - 4.4 * s, 0.12, 0, { mode: 0 }); }
      F.rect(bx - 6.6 * s, by - 2 * s, bx - 4.6 * s, by - 1.2 * s, 1, 2); F.rect(bx + 4.6 * s, by - 2 * s, bx + 6.6 * s, by - 1.2 * s, 1, 2);
      F.glow(bx - 5.6 * s, by - 1.5 * s, 4 * s + 1, 1.6 * s + 0.6, 0.5, 2); F.glow(bx + 5.6 * s, by - 1.5 * s, 4 * s + 1, 1.6 * s + 0.6, 0.5, 2);
      /* lo scarico */
      for (i = 0; i < 9; i++) { F.put(Math.round(F.X(bx - 3 * s + Math.sin(t * 2 + i) * 1.5 + i * 0.3)), Math.round(F.Y(by + 0.5 - ((t * 3 + i * 1.3) % 6) * s)), 0.22, 0, 2, 0, 126); }
    }
    /* il lampione, col suo cono di neve accesa */
    F.line(13, 13, 13, 46, 0.42, 0, { st: 2 }); F.line(13, 13, 18, 12, 0.42, 0);
    F.rect(16.5, 12.4, 20, 13, 1.1, 1);
    F.cone(18.2, 13.6, 5.5, 31, 47, 0.62, 1, t);
    F.glow(18.2, 13, 5, 2.4, 0.8, 1);
    F.glow(18.2, 47, 15, 3.4, 0.5, 1);
    /* la palina */
    F.line(66.5, 23, 66.5, 46, 0.4, 0, { st: 2 });
    F.rect(59, 17, 74, 21, 0.1, 0); F.path([[59, 17], [74, 17], [74, 21], [59, 21], [59, 17]], 0.5, 0);
    F.text(63, 19, "FERMATA", 0.95, 3);
    F.rect(62, 25, 71, 31, 0.08, 0); F.path([[62, 25], [71, 25], [71, 31], [62, 31], [62, 25]], 0.3, 0);
    F.text(63, 27, "7.10", 0.5, 0); F.text(63, 29, "18.40", 0.5, 0);
    /* la valigia, e Ada */
    if (!st.noAda) {
      F.rect(66, 51, 73, 56, 0.1, 0); F.path([[66, 56], [66, 51], [73, 51], [73, 56]], 0.45, 0); F.line(68, 50, 71, 50, 0.45, 0);
      ada(F, 53, 59, 1.15, -1, 0.85);
    }
    snowfall(F, t);
  }

  /* ================= LA PIAZZA ================= */
  function pieve(F, t) {
    var i, x, y;
    sky(F, t, 30);
    /* la Marcia, dietro i tetti: una massa senza una luce */
    mountain(F, [[0, 16], [10, 9], [22, 6], [36, 10], [50, 5], [64, 9], [74, 6], [84, 12]], 0.02, 0.3);
    for (i = 0; i < 26; i++) { x = 3 + i * 3.1; y = 12 + 5 * hash(i) + 4 * noise(i * 0.4, 2); F.line(x, y, x + 0.8, y + 2.2, 0.11, 0, { st: 1 }); }
    /* la chiesa, a ovest */
    F.rect(2, 27, 24, 44, 0.1, 0); F.poly([[1, 27], [13, 19], [25, 27]], 0.12, 0); F.path([[1, 27], [13, 19], [25, 27]], 0.55, 0);
    F.line(2, 27, 2, 44, 0.42, 0); F.line(24, 27, 24, 44, 0.42, 0);
    F.ell(13, 28, 2.2, 1.3, 0.3, 0); F.rect(10, 36, 16, 44, 0.04, 0); F.path([[10, 44], [10, 36], [13, 34.6], [16, 36], [16, 44]], 0.3, 0);
    F.rect(5.4, 32, 7, 36, 0.36 * (0.85 + 0.15 * noise(t * 3, 5)), 1); F.glow(6.2, 34, 5, 3.4, 0.22, 1);
    F.line(13, 15.4, 13, 19, 0.4, 0, { st: 2 }); F.line(11.6, 16.6, 14.4, 16.6, 0.4, 0);
    /* il campanile */
    F.rect(27, 10, 35, 44, 0.11, 0); F.line(27, 10, 27, 44, 0.5, 0); F.line(35, 10, 35, 44, 0.5, 0);
    F.poly([[26, 10], [31, 1], [36, 10]], 0.14, 0); F.path([[26, 10], [31, 1], [36, 10]], 0.6, 0); F.line(26, 10, 36, 10, 0.3, 0);
    F.rect(29, 13, 33, 18, 0.03, 0); F.path([[29, 18], [29, 13], [31, 12], [33, 13], [33, 18]], 0.3, 0);
    F.ell(31 + Math.sin(t * 0.8) * 0.3, 15.6, 1.4, 1.5, 0.34, 0);
    F.ell(31, 24.6, 2.6, 1.6, 0.34, 0); F.line(31, 24.6, 31, 23.4, 0.05, 0, { mode: 0 }); F.line(31, 24.6, 32.4, 24.6, 0.05, 0, { mode: 0 });
    /* l'albergo, a est: l'unica cosa accesa */
    F.rect(50, 20, 84, 44, 0.1, 0); F.rect(49, 18.6, 84, 20, 0.28, 0, { st: 6 }); F.line(50, 20, 50, 44, 0.26, 0);
    F.rect(76, 14, 79, 18, 0.14, 0);
    for (i = 0; i < 3; i++) { litWindow(F, 54 + i * 10, 23, 59 + i * 10, 28, 0.9, t, i); }
    litWindow(F, 54, 36, 59, 41, 0.95, t, 7); litWindow(F, 74, 36, 79, 41, 0.8, t, 9);
    F.rect(53, 30.6, 80, 33.4, 0.06, 0); F.path([[53, 30.6], [80, 30.6], [80, 33.4], [53, 33.4], [53, 30.6]], 0.42, 0);
    F.text(61, 32, "ALLA  POSTA", 0.95, 3);
    F.rect(63, 36, 69, 44, 0.05, 0); F.path([[63, 44], [63, 36], [69, 36], [69, 44]], 0.4, 0); F.line(63.6, 43.8, 68.4, 43.8, 0.9, 1);
    /* il fumo del camino */
    for (i = 0; i < 12; i++) { F.put(Math.round(77.5 + Math.sin(t * 0.7 + i * 0.6) * (1 + i * 0.25) + i * 0.3), Math.round(13 - i * 0.9 - ((t * 1.2) % 1)), 0.22 - i * 0.012, 0, 2, 0, i % 2 ? 126 : 39); }
    /* neve a terra, e le finestre che ci cadono sopra */
    F.shade(0, 44, 84, 56, function (px, py) { return 0.07 + 0.07 * noise(px * 0.25, py * 0.9); }, 0, 0, "s3");
    F.line(0, 44, 84, 44, 0.26, 0);
    F.glow(57, 48, 9, 3.4, 0.36, 1); F.glow(66, 47, 6, 3.6, 0.5, 1); F.glow(76, 48, 8, 3.2, 0.28, 1);
    /* la fontana gelata */
    F.ell(40, 50.4, 9, 2, 0.08, 0); F.path([[31, 50.4], [33.5, 52.2], [40, 52.6], [46.5, 52.2], [49, 50.4]], 0.34, 0); F.path([[31, 50.4], [34, 49], [40, 48.6], [46, 49], [49, 50.4]], 0.24, 0);
    F.rect(39, 43, 41, 50, 0.16, 0); F.line(39, 43, 39, 50, 0.32, 0); F.rect(38, 42, 42, 43, 0.3, 0);
    F.line(42.6, 45, 42.6, 49.4, 0.7, 4, { st: 2 }); F.line(41, 45, 42.6, 45, 0.4, 0);
    snowfall(F, t);
  }

  /* ================= L'ALBERGO ================= */
  function osteria(F, t, st) {
    st = st || {};
    var i, j, x, y, fire = 0.75 + 0.25 * noise(t * 2.4, 3), on, sw = Math.sin(t * 0.9) * 0.6;
    /* pareti e pavimento, tiepidi */
    F.shade(0, 0, 84, 40, function (px, py) { return 0.03 + 0.05 * noise(px * 0.12, py * 0.2); }, 1, 0, "s4");
    F.shade(0, 40, 84, 56, function (px, py) { return 0.05 + 0.04 * noise(px * 0.15, py * 2); }, 1, 0, "s5");
    for (i = 0; i < 4; i++) { F.line(0, 43 + i * 4, 84, 43 + i * 4, 0.13, 1, { st: 4 }); }
    F.line(0, 40, 84, 40, 0.24, 1);
    /* la cabina del telefono */
    F.rect(3, 6, 20, 46, 0.07, 0); F.path([[3, 46], [3, 6], [20, 6], [20, 46]], 0.42, 0);
    F.rect(3, 6, 20, 9, 0.12, 0); F.text(4, 7.5, "TELEFONO", 0.9, 3); F.line(3, 9.6, 20, 9.6, 0.36, 0);
    F.rect(6, 13, 17, 32, 0.035, 4); F.path([[6, 13], [17, 13], [17, 32], [6, 32], [6, 13]], 0.3, 0);
    F.rect(9.4, 17, 13.6, 24, 0.2, 0); F.ell(11.5, 19.6, 1.6, 1, 0.5, 0); F.line(8, 18, 8, 24, 0.34, 0, { st: 2 });
    if (st.cabina) { F.glow(11.5, 22, 9, 9, 0.5, 1); }
    F.ell(18.2, 28, 0.6, 0.5, 0.6, 1);
    /* il quadro del centralino, nella nicchia */
    F.rect(30, 7, 56, 25, 0.03, 0); F.path([[30, 7], [56, 7], [56, 25], [30, 25], [30, 7]], 0.4, 0);
    for (j = 0; j < 4; j++) {
      for (i = 0; i < 8; i++) {
        x = 32.5 + i * 3; y = 9.5 + j * 3.4;
        on = hash(i * 7 + j * 13 + Math.floor(t * 0.7 + hash(i + j * 5) * 4)) > 0.86 || (st.milano && i === 6 && j === 1 && Math.floor(t * 3) % 2 === 0);
        F.put(Math.round(F.X(x)), Math.round(F.Y(y)), on ? 1.05 : 0.26, on ? 1 : 0, 0, 0, on ? 64 : 111);
        if (on) { F.glow(x, y, 3, 1.8, 0.4, 1); }
      }
    }
    for (i = 0; i < 4; i++) { x = 35.5 + i * 5; F.path([[x, 23], [x + 0.8 + sw * 0.3, 28], [x - 1.2, 32], [x + 0.5, 36]], 0.3, 0); }
    /* Olga, dietro il banco, con la cuffia */
    F.poly([[38, 37], [39.4, 29.4], [43, 27.6], [47, 27.6], [50.6, 29.4], [52, 37]], 0.03, 0);
    F.path([[38, 37], [39.4, 29.4], [43, 27.6], [47, 27.6], [50.6, 29.4], [52, 37]], 0.6, 3); F.path([[44, 27.6], [45, 30], [46, 27.6]], 0.5, 3);
    F.ell(45, 24.2, 2.6, 2.3, 0.72, 3); F.ell(45, 22.2, 2.8, 1, 0.03, 0);
    F.path([[42.2, 24.4], [42.6, 21.6], [45, 20.4], [47.4, 21.6], [47.8, 24.4]], 0.6, 0); F.ell(42.2, 24.6, 0.8, 0.9, 0.7, 0); F.ell(47.8, 24.6, 0.8, 0.9, 0.7, 0);
    /* il banco di larice */
    F.rect(26, 36, 62, 46, 0.09, 1); F.rect(26, 35, 62, 36, 0.55, 1, { st: 6 });
    for (i = 0; i < 4; i++) { F.line(30 + i * 9, 37, 30 + i * 9, 46, 0.22, 1, { st: 2 }); }
    F.line(26, 46, 62, 46, 0.3, 1);
    F.rect(30, 32, 31, 35, 0.34, 5); F.line(30.5, 30, 30.5, 32, 0.34, 5, { st: 2 });
    /* la lampada sul banco: il cono caldo */
    F.line(45 + sw, 0, 45 + sw, 4, 0.3, 0, { st: 2 });
    F.poly([[42 + sw, 6], [48 + sw, 6], [46.4 + sw, 4], [43.6 + sw, 4]], 0.2, 0); F.rect(43.6 + sw, 6, 46.4 + sw, 6.4, 1.1, 1);
    F.cone(45 + sw, 6.6, 30, 60, 35, 0.16, 1, t);
    F.glow(45 + sw, 6.4, 5, 2.4, 0.7, 1);
    /* la stufa di maiolica, col fuoco che respira */
    F.rect(66, 12, 79, 46, 0.06, 5);
    for (y = 14; y < 44; y += 4) { F.line(66, y, 79, y, 0.26, 5, { st: 4 }); }
    for (x = 69.2; x < 79; x += 3.3) { F.line(x, 12, x, 46, 0.22, 5, { st: 2 }); }
    F.path([[66, 46], [66, 12], [79, 12], [79, 46]], 0.4, 5); F.rect(65, 10.6, 80, 12, 0.3, 5, { st: 6 });
    F.rect(70, 37, 75, 42, 0.9 * fire, 1); F.path([[70, 37], [75, 37], [75, 42], [70, 42], [70, 37]], 0.3, 0);
    F.glow(72.5, 40, 12, 7, 0.5 * fire, 1); F.glow(72.5, 49, 14, 4, 0.3 * fire, 1);
    F.rect(71.6, 0, 73, 10.6, 0.16, 0);
    /* Vescovi, alla macchina da scrivere */
    if (!st.noVescovi) {
      F.rect(60, 50, 84, 51, 0.36, 1, { st: 6 }); F.line(63, 51, 63, 56, 0.26, 1, { st: 2 });
      F.poly([[70, 50], [71, 44.4], [74, 43], [78, 43], [81, 44.4], [82, 50]], 0.03, 0);
      F.path([[70, 50], [71, 44.4], [74, 43], [78, 43], [81, 44.4], [82, 50]], 0.5, 0);
      F.ell(76, 40.4, 2.4, 2, 0.6, 3); F.ell(76, 38.8, 2.5, 0.9, 0.03, 0);
      F.put(Math.round(F.X(75)), Math.round(F.Y(40.6)), 0.8, 0, 0, 0, 111); F.put(Math.round(F.X(77)), Math.round(F.Y(40.6)), 0.8, 0, 0, 0, 111);
      F.rect(62, 47, 68, 50, 0.1, 0); F.path([[62, 50], [62, 47], [68, 47], [68, 50]], 0.42, 0);
      F.rect(63.4, 44 - (Math.floor(t * 0.4) % 2) * 0.6, 66.6, 47, 0.7, 3);
      if (Math.floor(t * 5) % 3 === 0) { F.put(Math.round(F.X(63 + hash(Math.floor(t * 5)) * 4)), Math.round(F.Y(48.4)), 1, 3, 0, 0, 39); }
    }
    /* la pentola sul fuoco, e il suo fumo */
    for (i = 0; i < 7; i++) { F.put(Math.round(F.X(72.5 + Math.sin(t * 1.1 + i) * 1.4)), Math.round(F.Y(35.4 - ((t * 1.6 + i * 1.4) % 8))), 0.26, 3, 2, 0, i % 2 ? 126 : 39); }
  }

  /* ================= LA CAMERA 3 ================= */
  /* st.colpo: secondi dall'inizio del colpo (undefined: nessun colpo). st.sereno: ha smesso di nevicare */
  function camera3(F, t, st) {
    st = st || {};
    var c = st.colpo, sh = 0, i, k, r, lamp = st.buio ? 0 : 0.8 + 0.2 * noise(t * 1.6, 9), sx, sy;
    if (c !== undefined && c > 1.2 && c < 4.2) { sh = Math.round(Math.sin(c * 31) * 1.2 * (1 - (c - 1.2) / 3)); }
    /* la stanza, quasi buia */
    F.shade(0, 0, 84, 42, function (px, py) { return 0.03 + 0.04 * noise(px * 0.14, py * 0.2); }, 0, 0, "s6");
    F.shade(0, 42, 84, 56, function (px, py) { return 0.045 + 0.04 * noise(px * 0.2, py * 1.5); }, 0, 0, "s7");
    F.line(0, 42, 84, 42, 0.18, 0);
    /* fuori dalla finestra: il cielo, la Marcia, il lago */
    F.setClip(27 + sh, 5, 68 + sh, 35);
    F.shade(26, 4, 70, 36, function (px, py) { return 0.1 + 0.12 * fbm(px * 0.05 + t * 0.01, py * 0.12); }, 4, 0, "s8");
    if (st.sereno) {
      F.glow(36, 10, 9, 5, 0.5, 3); F.ell(36, 10, 2.8, 1.7, 1, 3);
      for (i = 0; i < 16; i++) { F.put(Math.round(28 + hash(i) * 40) + sh, Math.round(5 + hash(i + 40) * 9), hash(i + Math.floor(t)) > 0.2 ? 0.5 : 0.2, 0, 2, 0, 46); }
    }
    mountain(F, [[26 + sh, 20], [34 + sh, 14], [42 + sh, 16], [50 + sh, 10], [58 + sh, 13], [64 + sh, 9], [70 + sh, 15]], 0.02, st.sereno ? 0.6 : 0.42);
    /* la crepa, a forma di M */
    F.path([[36 + sh, 22], [42 + sh, 18.4], [47 + sh, 22], [53 + sh, 17], [60 + sh, 22]], st.sereno ? 0.4 : 0.22, 0);
    F.shade(26, 26, 70, 36, function (px, py) {
      var w = 0.14 + 0.16 * noise(px * 0.22 + t * 0.35, py * 1.6) + (st.sereno ? 0.3 * Math.max(0, 1 - Math.abs(px - 36 - sh) / (2 + (py - 26) * 0.9)) * noise(px * 0.8, py * 2 + t) : 0);
      var d, ring;
      if (c !== undefined && c > 2.4) {
        d = Math.sqrt((px - 54 - sh) * (px - 54 - sh) + (py - 27) * (py - 27) * 9); ring = (c - 2.4) * 5;
        w += 0.5 * Math.max(0, 1 - Math.abs(d - ring) / 1.6) * Math.max(0, 1 - ring / 30) + 0.35 * Math.max(0, 1 - Math.abs(d - ring * 0.55) / 1.4) * Math.max(0, 1 - ring / 30);
      }
      return w;
    }, 4);
    F.line(26, 26, 70, 26, 0.34, 4);
    if (c !== undefined) {
      /* la lastra che si stacca e scivola in acqua, con lo sbuffo */
      k = clamp((c - 1) / 1.6, 0, 1); k = k * k;
      if (c < 3) { sx = 52 + sh + k * 2.4; sy = 18 + k * 8; F.poly([[sx - 3.4, sy], [sx + 1, sy - 1.6], [sx + 4, sy + 0.4], [sx + 0.6, sy + 2]], 0.7 - 0.2 * k, 0); F.path([[49 + sh, 17.4], [52 + sh, 16], [55.6 + sh, 18]], 0.5, 0); }
      if (c > 2.2 && c < 7) { r = (c - 2.2); for (i = 0; i < 26; i++) { F.put(Math.round(54 + sh + (hash(i) - 0.5) * (4 + r * 5)), Math.round(26 - hash(i + 9) * (1 + r * 1.6) * Math.max(0, 1 - r / 5)), 0.75 * Math.max(0, 1 - r / 4.8), 0, 2, 0, i % 3 ? 39 : 58); } }
    }
    if (!st.sereno) { F.snow(t, 46, 3.2, 0.34, 5, { x0: 27, x1: 69, y0: 5, y1: 35 }); F.snow(t, 20, 5, 0.55, 6, { x0: 27, x1: 69, y0: 5, y1: 35, ch: "*." }); }
    F.setClip();
    /* il telaio, con la croce */
    F.path([[26 + sh, 4], [69 + sh, 4], [69 + sh, 36], [26 + sh, 36], [26 + sh, 4]], 0.7, 0);
    F.line(47.5 + sh, 4, 47.5 + sh, 36, 0.6, 0, { st: 2, mode: 0 }); F.line(26 + sh, 20, 69 + sh, 20, 0.5, 0, { mode: 0 });
    F.rect(24 + sh, 36.6, 71 + sh, 37.4, 0.4, 0, { st: 6 });
    /* le tende */
    for (i = 0; i < 4; i++) { F.line(21 + i * 1.4, 3, 21.4 + i * 1.4, 38, 0.16 + 0.05 * (i % 2), 0, { st: 2 }); F.line(70.6 + i * 1.4, 3, 71 + i * 1.4, 38, 0.16 + 0.05 * (i % 2), 0, { st: 2 }); }
    F.line(19, 2.4, 77, 2.4, 0.4, 0);
    /* il letto, col piumino alto */
    F.rect(0, 37, 2, 52, 0.14, 0); F.line(2, 37, 2, 52, 0.32, 0);
    F.poly([[2, 47], [3, 42.6], [8, 41], [16, 41.6], [22, 43.6], [23, 47]], 0.2, 0); F.path([[2, 47], [3, 42.6], [8, 41], [16, 41.6], [22, 43.6], [23, 47]], 0.44, 0);
    F.rect(2, 47, 23, 52, 0.1, 0); F.line(2, 47, 23, 47, 0.26, 0); F.line(23, 44, 23, 54, 0.3, 0);
    /* la valigia sulla sedia */
    F.rect(8, 37.4, 16, 41, 0.07, 0); F.path([[8, 41], [8, 37.4], [16, 37.4], [16, 41]], 0.3, 0); F.line(11, 36.6, 13, 36.6, 0.3, 0);
    /* il comodino con il lume: l'unico caldo della stanza */
    F.rect(73, 44, 82, 45, 0.3, 0, { st: 6 }); F.line(75, 45, 75, 56, 0.22, 0, { st: 2 }); F.line(80, 45, 80, 56, 0.22, 0, { st: 2 });
    F.poly([[76.4, 43.6], [79.6, 43.6], [79, 40.4], [77, 40.4]], 0.2, 0);
    if (lamp) { F.rect(77, 39, 79, 40.2, 1.05 * lamp, 1); F.glow(78, 40, 13, 8, 0.55 * lamp, 1); F.glow(78, 45, 9, 2.4, 0.3 * lamp, 1); }
  }

  /* ================= IL CORONAMENTO, LA NOTTE DELL'8 ================= */
  function digaMorto(F, t) {
    var i, k, x, y;
    sky(F, t, 30);
    mountain(F, [[0, 14], [9, 8], [17, 12], [25, 6], [33, 15], [39, 20]], 0.06, 0.26);
    mountain(F, [[45, 20], [52, 12], [60, 7], [68, 12], [76, 5], [84, 10]], 0.06, 0.26);
    /* il lago a sinistra, il vuoto a destra */
    F.shade(0, 22, 40, 56, function (px, py) { return 0.05 + 0.07 * noise(px * 0.25 + t * 0.2, py * 1.8); }, 4, 0, "s10", 2);
    F.line(0, 22, 38, 22, 0.2, 4);
    F.shade(46, 22, 84, 56, function () { return 0.02; }, 0, 0, "s11");
    /* il coronamento, in prospettiva */
    F.poly([[39.6, 20], [44.4, 20], [70, 56], [12, 56]], function (px, py) { return 0.2 + 0.07 * noise(px * 0.4, py * 0.5) + 0.05 * (py - 20) / 36; }, 0);
    F.poly([[39.6, 20], [37.6, 20], [3, 56], [12, 56]], 0.1, 0); F.line(37.6, 20, 3, 56, 0.4, 0); F.line(39.6, 20, 12, 56, 0.28, 0);
    F.poly([[44.4, 20], [46.4, 20], [80, 56], [70, 56]], 0.1, 0); F.line(46.4, 20, 80, 56, 0.4, 0); F.line(44.4, 20, 70, 56, 0.28, 0);
    /* in fondo, il portello nella roccia */
    F.rect(40.6, 16.4, 43.4, 20, 0.04, 0); F.path([[40.6, 20], [40.6, 16.4], [43.4, 16.4], [43.4, 20]], 0.34, 0);
    /* una lampada sola */
    F.line(57, 9, 57, 33, 0.38, 0, { st: 2 }); F.line(57, 9, 52.6, 8.2, 0.38, 0);
    F.rect(50.6, 8.4, 53.6, 9, 1.1, 1);
    F.cone(52, 9.4, 37, 60, 37, 0.5, 1, t);
    F.glow(52, 9, 5, 2.4, 0.8, 1); F.glow(47, 36, 15, 4.4, 0.42, 1);
    /* le impronte: arrivano al parapetto di destra, e lì finiscono */
    for (i = 0; i < 9; i++) {
      k = i / 8; x = mix(40, 63.4, k * k * 0.5 + k * 0.5); y = mix(55, 41.6, k);
      F.put(Math.round(F.X(x + (i % 2) * 1.4)), Math.round(F.Y(y)), 0.03, 0, 0, 0, 0);
      F.put(Math.round(F.X(x + (i % 2) * 1.4 + 1)), Math.round(F.Y(y)), 0.42, 0, 0, 0, i % 2 ? 96 : 39);
    }
    snowfall(F, t, 0.9);
  }

  /* ================= LA TELEFONATA ================= */
  function chiamata(F, t) {
    var i, j, x, y, on, sw = Math.sin(t * 1.3) * 1.2, lamp = 0.85 + 0.15 * noise(t * 2, 4);
    F.shade(0, 0, 84, 56, function (px, py) { return 0.045 + 0.03 * noise(px * 0.25, py * 0.3); }, 0, 0, "s12");
    /* la cabina: legno, vetro, una lampadina */
    F.rect(4, 3, 46, 56, 0.06, 1);
    F.rect(8, 9, 42, 50, 0.03, 1);
    F.path([[4, 56], [4, 3], [46, 3], [46, 56]], 0.46, 1); F.path([[8, 50], [8, 9], [42, 9], [42, 50], [8, 50]], 0.34, 1);
    F.text(18, 6, "T E L E F O N O", 0.95, 3);
    F.rect(23.6, 9.6, 26.4, 10.2, 1.1, 1); F.glow(25, 10, 6, 2.6, 0.7 * lamp, 1); F.cone(25, 10.6, 10, 40, 50, 0.2 * lamp, 1, t);
    /* l'apparecchio a muro */
    F.rect(31, 19, 39, 33, 0.05, 0); F.path([[31, 33], [31, 19], [39, 19], [39, 33], [31, 33]], 0.44, 0);
    F.ell(35, 23.4, 2.6, 1.6, 0.34, 0); F.ell(35, 23.4, 1, 0.6, 0.05, 0); F.rect(33, 28, 37, 31, 0.3, 0);
    /* Ada, di spalle, la cornetta all'orecchio */
    ada(F, 22, 58, 1.25, 1, 0.9);
    F.line(27.4, 37.6, 27.8, 41, 0.75, 0, { st: 2 }); F.ell(27.4, 37.4, 1, 0.8, 0.7, 0);
    /* il filo, che dondola */
    for (i = 0; i <= 24; i++) { j = i / 24; F.put(Math.round(F.X(mix(28, 33, j) + Math.sin(j * 3.14) * sw)), Math.round(F.Y(mix(41, 31, j) + Math.sin(j * 3.14) * 7)), 0.45, 0, 2, 0, i % 2 ? 40 : 41); }
    /* di là dal vetro: il quadro, e Olga che ascolta */
    F.rect(52, 6, 82, 26, 0.03, 0); F.path([[52, 6], [82, 6], [82, 26], [52, 26], [52, 6]], 0.4, 0);
    for (j = 0; j < 4; j++) {
      for (i = 0; i < 8; i++) {
        x = 55 + i * 3.4; y = 9 + j * 4;
        on = (i === 5 && j === 1) ? Math.floor(t * 2.5) % 2 === 0 : hash(i * 3 + j * 11 + Math.floor(t * 0.4)) > 0.93;
        F.put(Math.round(F.X(x)), Math.round(F.Y(y)), on ? 1.05 : 0.24, on ? 1 : 0, 0, 0, on ? 64 : 111);
        if (on) { F.glow(x, y, 3.4, 2, 0.5, 1); }
      }
    }
    F.path([[72, 13], [71 + sw * 0.3, 22], [66, 30], [64, 34]], 0.5, 1);
    F.poly([[55, 56], [56.6, 39], [61, 36.6], [67, 36.6], [71.4, 39], [73, 56]], 0.16, 0);
    F.path([[55, 56], [56.6, 39], [61, 36.6]], 0.4, 0); F.path([[67, 36.6], [71.4, 39], [73, 56]], 0.4, 0);
    F.ell(64, 32.4, 3, 2.6, 0.46, 3); F.ell(64, 30.4, 3.2, 1.3, 0.12, 0); F.ell(66.8, 29.6, 1.3, 1, 0.12, 0);
    F.path([[60.8, 32.6], [61.2, 29.4], [64, 28], [66.8, 29.4], [67.2, 32.6]], 0.75, 1); F.ell(60.8, 32.8, 0.9, 1, 0.9, 1); F.ell(67.2, 32.8, 0.9, 1, 0.9, 1);
    F.rect(50, 44, 84, 45, 0.4, 1, { st: 6 }); F.rect(50, 45, 84, 56, 0.1, 1);
    /* la neve, dalla finestrella */
    F.rect(74, 30, 82, 40, 0.03, 4); F.path([[74, 30], [82, 30], [82, 40], [74, 40], [74, 30]], 0.3, 0);
    F.snow(t, 9, 3, 0.4, 8, { x0: 75, x1: 82, y0: 31, y1: 40 });
  }

  /* ================= LA MAPPA ================= */
  /* Non una tavola: uno schema, come lo disegnerebbe Ada su un tovagliolo. st = { visited, room } */
  var PLACE = { corriera: [42, 47, "CORRIERA"], piazza: [42, 34, "PIAZZA"], albergo: [67, 34, "ALBERGO"], chiesa: [15, 34, "CHIESA"], strada: [42, 21, "STRADA DEL LAGO"] };
  var LINK = [["corriera", "piazza"], ["piazza", "albergo"], ["piazza", "chiesa"], ["piazza", "strada"]];
  var ALIAS = { camera: "albergo", centralino: "albergo" };
  function mappa(F, t, st) {
    var vis = {}, seen = {}, here = ALIAS[st.room] || st.room, id, i, a, b, p, w, name, on;
    for (id in st.visited) { if (st.visited.hasOwnProperty(id)) { vis[ALIAS[id] || id] = 1; } }
    for (id in vis) { if (vis.hasOwnProperty(id)) { seen[id] = 1; } }
    for (i = 0; i < LINK.length; i++) { if (vis[LINK[i][0]]) { seen[LINK[i][1]] = 1; } if (vis[LINK[i][1]]) { seen[LINK[i][0]] = 1; } }
    /* curve di livello, appena accennate */
    F.shade(0, 0, 84, 56, function (px, py) { var v = fbm(px * 0.045, py * 0.07) * 7; return v - Math.floor(v) < 0.1 ? 0.1 : 0; }, 0, 0, "s13");
    /* il lago, e la Marcia di là */
    F.ell(66, 12, 15, 6.5, 0.02, 4);
    F.shade(50, 5, 82, 19, function (px, py) { var d = ((px - 66) * (px - 66)) / 225 + ((py - 12) * (py - 12)) / 42; return d < 1 ? 0.12 + 0.12 * noise(px * 0.3 + t * 0.3, py * 1.6) : null; }, 4, 0, "s14", 2);
    F.text(59, 12, "LAGO DEL GORGO", 0.6, 4);
    F.path([[70, 3], [74, 1], [77, 3], [80, 1], [83, 3]], 0.32, 0); F.text(72, 4, "LA MARCIA", 0.34, 0);
    F.rect(55, 1.6, 60, 2.4, 0.5, 0, { st: 6 }); F.text(47, 2, "LA DIGA", 0.4, 0);
    F.text(3, 12, "VAL SORDA", 0.9, 3); F.text(3, 14, "FEBBRAIO 1957", 0.4, 0);
    F.text(4, 46, "N", 0.6, 0); F.line(4.4, 44.6, 4.4, 41.6, 0.5, 0, { st: 2 }); F.text(4, 41, "^", 0.6, 0);
    for (i = 0; i < LINK.length; i++) {
      a = PLACE[LINK[i][0]]; b = PLACE[LINK[i][1]];
      if (seen[LINK[i][0]] && seen[LINK[i][1]]) { F.line(a[0], a[1], b[0], b[1], 0.3, 0); }
    }
    for (id in PLACE) {
      if (!PLACE.hasOwnProperty(id) || !seen[id]) { continue; }
      p = PLACE[id]; name = vis[id] ? p[2] : "?"; w = name.length / 2 + 2; on = id === here;
      F.rect(p[0] - w, p[1] - 1.6, p[0] + w, p[1] + 1.6, 0.02, 0);
      F.path([[p[0] - w, p[1] - 1.6], [p[0] + w, p[1] - 1.6], [p[0] + w, p[1] + 1.6], [p[0] - w, p[1] + 1.6], [p[0] - w, p[1] - 1.6]], on ? 0.9 : 0.4, on ? 1 : 0);
      F.text(p[0] - name.length / 2, p[1], name, on ? 1 : 0.6, on ? 3 : 0);
      if (on) { F.glow(p[0], p[1], w * 1.8, 4, 0.22 + 0.12 * Math.sin(t * 3), 1); }
    }
  }

  return { fermata: fermata, pieve: pieve, osteria: osteria, camera3: camera3, digaMorto: digaMorto, m_chiamata: chiamata, mappa: mappa };
})();
