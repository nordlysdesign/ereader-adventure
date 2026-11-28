/* ==================================================================
   ACQUA CHETA: i momenti, i finali, la mappa.
   La libreria di disegno sta in src/gfx.js.
   ================================================================== */
(function () {
  var K = Pix.kit, W = K.W, H = K.H, PI = K.PI, h1 = K.h1, waves = K.waves, smoke = K.smoke, man = K.man,
    stars = K.stars, sky = K.sky, woman = K.woman;

  /* la crepa a M della Marcia, in una scatola x0..x1, y0..y1 */
  function crepa(g, x0, y0, x1, y1, t) {
    var w = x1 - x0, h = y1 - y0;
    g.pline([[x0, y1], [x0 + w * 0.22, y0 + h * 0.15], [x0 + w * 0.48, y0 + h * 0.6], [x0 + w * 0.72, y0], [x1, y0 + h * 0.85]], t);
  }
  /* fiamma di una lampada a carburo */
  function fiamma(g, x, y, f) {
    var k = f % 3;
    g.poly([[x - 2, y], [x + 2, y], [x + (k === 1 ? 1 : 0), y - 7 - (k === 2 ? 2 : 0)]], 0);
    g.px(x + (k ? 1 : -1), y - 9 - k, 0);
  }

  /* ================= MOMENTI ================= */

  /* la telefonata a Milano: Ada in cabina, Olga con la cuffia */
  function chiamata(g, f) {
    var i, x, y, t, r, c, bl = f % 4 < 2;
    g.rect(0, 0, 239, 149, 13);
    for (x = 4; x < 240; x += 9) { g.vline(x, 0, 117, 15); }
    g.rect(0, 118, 239, 149, 11); g.hline(0, 239, 118, 0); g.hline(0, 239, 119, 16);
    for (y = 126; y < 150; y += 7) { g.hline(0, 239, y, 16); }
    /* il quadro del centralino */
    g.maskOn(); g.rect(150, 12, 234, 86, 16); g.rect(146, 87, 238, 93, 6); g.keyline(0);
    g.hline(146, 238, 87, 16);
    for (r = 0; r < 4; r++) {
      for (c = 0; c < 8; c++) {
        x = 158 + c * 10; y = 22 + r * 14;
        g.ring(x, y + 5, 2, 2, 0); g.px(x, y, r === 1 && c === 5 ? (bl ? 0 : 16) : 9);
      }
    }
    g.ell(208, 36, 2, 2, bl ? 0 : 16);
    g.pline([[208, 41], [210, 60], [204, 76], [200, 87]], 0); g.pline([[178, 55], [174, 70], [182, 80], [184, 87]], 0);
    g.rect(198, 84, 202, 88, 0); g.rect(182, 84, 186, 88, 0); g.rect(164, 84, 168, 88, 0); g.rect(218, 84, 222, 88, 0);
    /* Olga, di profilo, che guarda altrove */
    woman(g, 136, 149, 98, 16, 0);
    g.ell(139, 68, 4, 6, 0); g.px(140, 66, 16); g.hline(139, 141, 72, 16); g.px(143, 69, 0);
    g.arc(135, 68, 8, 9, PI, 1.9 * PI, 0); g.arc(135, 68, 9, 10, PI, 1.9 * PI, 0);
    g.ell(133, 69, 3, 4, 0); g.ring(133, 69, 3, 4, 16); g.px(133, 69, 16);
    g.line(134, 73, 141, 79, 0); g.ell(143, 79, 2, 2, 0);
    g.pline([[131, 74], [128, 92], [140, 104], [152, 96], [164, 88]], 0);
    /* la cabina */
    g.rect(116, 10, 119, 142, 16);
    g.maskOn(); g.rect(12, 4, 114, 142, 9); g.keyline(0);
    g.rect(12, 4, 114, 19, 16); g.hline(12, 114, 20, 0); g.text(47, 9, "TELEFONO", 0, 1);
    g.rect(22, 26, 104, 112, 2); g.frame(21, 25, 105, 113, 16); g.frame(20, 24, 106, 114, 0);
    g.frame(22, 118, 104, 138, 16); g.frame(24, 120, 102, 136, 6); g.ell(109, 84, 2, 4, 16);
    g.c = [22, 26, 104, 112];
    /* l'apparecchio a muro */
    g.maskOn(); g.rect(80, 42, 100, 84, 16); g.keyline(16);
    g.ring(90, 56, 7, 7, 0); g.ell(90, 56, 2, 2, 0); g.rect(84, 70, 96, 78, 0); g.rect(86, 72, 94, 78, 16); g.rect(86, 44, 94, 45, 0);
    /* Ada */
    man(g, 56, 152, 120, { coat: 3, key: 16, face: true });
    g.maskOn(); g.poly([[37, 73], [30, 84], [45, 74], [46, 64]], 3); g.ell(44, 66, 3, 3, 0); g.keyline(16);
    g.maskOn(); g.line(43, 48, 44, 68, 16, 1); g.ell(43, 49, 3, 4, 16); g.ell(45, 68, 4, 3, 16); g.keyline(0);
    /* il cordone, che dondola */
    for (i = 0; i <= 60; i++) {
      t = i / 60; x = 45 + (84 - 45) * t; y = 71 + (82 - 71) * t + 22 * Math.sin(t * PI) + Math.sin(f * 0.9) * 3 * Math.sin(t * PI);
      g.px(x + 1.5 * Math.cos(t * 50), y + 1.5 * Math.sin(t * 50), 16); g.px(x + 1.5 * Math.cos(t * 50), y + 1 + 1.5 * Math.sin(t * 50), 16);
    }
    g.c = null;
    g.line(26, 60, 44, 30, 0); g.line(30, 62, 40, 46, 0);
  }

  /* le quattro di notte: la Marcia parla */
  function colpo(g, f) {
    var i, x, y, sh = (f >= 2 && f <= 7 && f % 2) ? 1 : 0, k = Math.min(f, 4), sx = 160 - k * 6, sy = 56 + k * 9, r;
    g.c = [24, 12, 215, 120];
    g.rect(0, 0, 239, 120, 16);
    stars(g, f, 24, 215, 12, 44, 24);
    g.ell(56, 30, 14, 14, 14); g.ell(56, 30, 9, 9, 0); g.px(53, 27, 6); g.px(58, 32, 6); g.px(59, 26, 6);
    g.poly([[24, 82], [46, 64], [70, 76], [92, 60], [116, 78], [116, 96], [24, 96]], 14); g.pline([[24, 82], [46, 64], [70, 76], [92, 60], [116, 78]], 9);
    /* la Marcia */
    g.poly([[84, 96], [108, 68], [138, 46], [176, 30], [215, 22], [215, 96]], 10);
    g.poly([[138, 46], [176, 30], [215, 22], [215, 38], [186, 42], [162, 54]], 1);
    g.pline([[84, 96], [108, 68], [138, 46], [176, 30], [215, 22]], 0);
    crepa(g, 118, 52, 200, 88, 0);
    for (i = 0; i < 14; i++) { x = 100 + Math.floor(h1(i + 5) * 108); y = 62 + Math.floor(h1(i + 23) * 28); if (y > 150 - x * 0.62) { g.line(x, y, x - 2, y - 5, 16); g.px(x - 1, y - 6, 0); } }
    /* il lago */
    g.rect(24, 96, 215, 120, 16); waves(g, f, 24, 215, 96, 120);
    for (y = 99; y < 120; y += 3) { g.hline(52 + (y % 2), 60 - ((y >> 1) % 2), y, 0); }
    /* la lastra che scende, e il segno che lascia */
    g.poly([[151, 52], [167, 49], [170, 58], [154, 62]], 16);
    if (f > 0) { g.line(158, 60, sx + 2, sy - 4, 16); g.line(160, 60, sx + 4, sy - 4, 9); }
    if (f < 5) { g.maskOn(); g.poly([[sx - 9, sy - 4], [sx + 7, sy - 7], [sx + 10, sy + 2], [sx - 6, sy + 6]], 0); g.keyline(16); g.px(sx - 2, sy, 9); g.px(sx + 4, sy - 2, 9); }
    if (f >= 4) {
      r = (f - 4) * 8 + 5;
      for (i = 0; i < 12; i++) { g.ell(136 + Math.round(h1(i) * 26 - 13), 95 - Math.round(h1(i + 9) * (15 - (f - 4) * 2)), f < 7 ? 2 : 1, f < 7 ? 2 : 1, 0); }
      g.arc(134, 106, r, r * 0.28, 0, 2 * PI, 0);
      if (f >= 6) { g.arc(134, 106, r - 12, (r - 12) * 0.28, 0, 2 * PI, 0); }
      if (f >= 8) { g.arc(134, 106, r - 24, (r - 24) * 0.28, 0, 2 * PI, 0); }
    }
    g.c = null;
    /* la parete e la finestra della camera 3 */
    g.rect(0, 0, 239, 11, 13); g.rect(0, 121, 239, 149, 13); g.rect(0, 12, 23, 120, 13); g.rect(216, 12, 239, 120, 13);
    for (y = 4; y < 150; y += 8) { for (x = ((y >> 3) % 2) * 5 + 2; x < 240; x += 10) { if (x < 20 || x > 219 || y < 8 || y > 130) { g.px(x, y, 0); g.px(x, y + 1, 0); } } }
    g.frame(21, 9, 218, 123, 0); g.frame(22, 10, 217, 122, 0); g.frame(23, 11, 216, 121, 0); g.frame(24, 12, 215, 120, 16);
    g.rect(118 + sh, 12, 121 + sh, 120, 0); g.vline(117 + sh, 12, 120, 16); g.vline(122 + sh, 12, 120, 16);
    g.rect(24, 64 + sh, 215, 67 + sh, 0); g.hline(24, 215, 63 + sh, 16); g.hline(24, 215, 68 + sh, 16);
    g.rect(115 + sh, 60, 124 + sh, 71, 0); g.frame(115 + sh, 60, 124 + sh, 71, 16);
    g.rect(15, 123, 224, 127, 0); g.hline(15, 224, 128, 16); g.hline(15, 224, 122, 16);
    /* il bicchiere sul davanzale, che trema */
    g.rect(40 + sh, 113, 46 + sh, 122, 0); g.frame(40 + sh, 113, 46 + sh, 122, 16); g.hline(41 + sh, 45 + sh, 117, 9);
    /* la testiera del letto */
    g.rect(136, 135, 238, 138, 0); g.hline(136, 238, 139, 16); for (x = 142; x < 236; x += 9) { g.rect(x, 140, x + 1, 149, 0); }
    g.ell(137, 134, 3, 3, 0); g.ell(237, 134, 3, 3, 0);
  }

  /* il tavolo del casello: gli occhiali, le chiavi di Bepi */
  function occhiali(g, f) {
    var i, x, y, k = Math.min(f, 4), hx = 212 - k * 9, hy = 118 - k * 2;
    g.rect(0, 0, 239, 149, 9);
    g.ell(190, 34, 84, 62, 6); g.ell(190, 34, 56, 40, 4); g.ell(190, 34, 30, 22, 2);
    for (y = 28; y < 150; y += 30) { g.hline(0, 239, y, 16); g.hline(0, 239, y + 1, 4); }
    for (i = 0; i < 26; i++) { x = Math.floor(h1(i + 2) * 220); y = 4 + Math.floor(h1(i + 44) * 140); g.hline(x, x + 10 + (i % 3) * 6, y, 12); }
    g.ell(30, 20, 3, 2, 14); g.ring(30, 20, 5, 3, 13); g.ell(126, 138, 3, 2, 14);
    /* gli occhiali, aperti sul legno */
    g.line(52, 62, 34, 26, 13, 1); g.line(118, 66, 136, 30, 13, 1);
    g.ell(60, 78, 14, 14, 13); g.ell(104, 81, 14, 14, 13);
    g.maskOn();
    g.ell(57, 74, 14, 14, 16); g.ell(101, 77, 14, 14, 16);
    g.line(47, 64, 30, 24, 16, 1); g.line(111, 67, 132, 28, 16, 1); g.line(30, 24, 36, 18, 16, 1); g.line(132, 28, 126, 21, 16, 1);
    g.arc(79, 76, 9, 6, PI, 2 * PI, 16); g.arc(79, 77, 9, 6, PI, 2 * PI, 16);
    g.keyline(0);
    g.ell(57, 74, 11, 11, 1); g.ell(101, 77, 11, 11, 1);
    g.ring(57, 74, 8, 8, 6); g.ring(101, 77, 8, 8, 6); g.ring(57, 74, 5, 5, 4); g.ring(101, 77, 5, 5, 4);
    g.line(51, 68, 55, 66, 0, 1); g.line(95, 71, 99, 69, 0, 1);
    /* la lampada a carburo */
    g.ell(200, 46, 15, 5, 14);
    g.maskOn(); g.rect(188, 22, 210, 44, 16); g.ell(199, 22, 11, 3, 16); g.rect(195, 12, 203, 20, 16); g.keyline(0);
    g.hline(189, 209, 30, 0); g.hline(189, 209, 38, 9); g.arc(199, 10, 7, 7, PI, 2 * PI, 16);
    g.ell(180, 28, 8, 9, 0); g.ring(180, 28, 8, 9, 16); g.ring(180, 28, 5, 6, 9); g.rect(184, 27, 188, 29, 16);
    fiamma(g, 174, 30, f);
    /* la mano di Bepi posa il mazzo */
    g.ring(hx - 30, hy + 2, 7, 7, 16); g.ring(hx - 30, hy + 2, 6, 6, 16);
    g.maskOn(); g.ell(hx - 40, hy + 8, 4, 4, 16); g.line(hx - 43, hy + 11, hx - 66, hy + 22, 16, 1); g.rect(hx - 70, hy + 18, hx - 65, hy + 27, 16); g.keyline(0);
    g.maskOn(); g.ell(hx - 34, hy + 12, 4, 4, 16); g.line(hx - 35, hy + 15, hx - 46, hy + 30, 16, 1); g.rect(hx - 50, hy + 27, hx - 45, hy + 31, 16); g.keyline(0);
    g.maskOn(); g.rect(hx - 28, hy + 10, hx - 12, hy + 18, 0); g.keyline(16); g.text(hx - 26, hy + 12, "CUN", 16, 1); g.line(hx - 29, hy + 8, hx - 27, hy + 11, 16);
    if (f >= 5 && f % 2 === 1) { x = hx - 68; y = hy + 22; g.px(x, y - 4, 0); g.px(x, y + 4, 0); g.px(x - 4, y, 0); g.px(x + 4, y, 0); g.px(x, y, 0); }
    g.maskOn(); g.poly([[239, 78], [239, 134], [hx + 26, hy + 16], [hx + 12, hy - 6]], 16); g.keyline(0);
    for (i = 0; i < 5; i++) { g.line(hx + 20 + i * 11, hy - 2 - i * 5, hx + 28 + i * 11, hy + 10 - i * 4, 9); }
    g.maskOn(); g.ell(hx, hy, 14, 10, 0); g.ell(hx - 13, hy + 6, 8, 4, 0); g.ell(hx - 13, hy - 2, 7, 4, 0); g.ell(hx - 8, hy - 8, 7, 4, 0); g.ell(hx + 2, hy - 11, 5, 4, 0); g.keyline(16);
    g.line(hx - 19, hy + 4, hx - 6, hy + 3, 16); g.line(hx - 18, hy - 4, hx - 5, hy - 3, 9); g.line(hx - 12, hy - 9, hx - 2, hy - 6, 9);
    g.px(hx - 18, hy + 7, 9); g.px(hx - 17, hy - 1, 9); g.px(hx + 6, hy + 2, 9); g.px(hx + 4, hy + 5, 9);
  }

  /* la relazione: il tubo aperto sotto il pendolo */
  function relazione(g, f) {
    var i, x, y, sw = [0, 2, 3, 2, 0, -2, -3, -2][f % 8], px0 = 168 + sw, pts, q;
    g.rect(0, 0, 239, 149, 16);
    g.ell(126, 96, 124, 70, 14); g.ell(126, 100, 96, 54, 11); g.ell(130, 104, 66, 38, 8);
    /* la roccia, le crepe, una spia rotta */
    g.pline([[10, 0], [22, 26], [16, 48], [30, 70]], 9); g.pline([[226, 0], [214, 22], [222, 44]], 9); g.pline([[60, 0], [66, 14], [58, 30]], 12);
    g.rect(12, 34, 26, 38, 0); g.line(18, 33, 20, 39, 16); g.px(34, 80, 0); g.px(34, 80 + (f % 4) * 6, 0);
    /* il tubo, stappato */
    g.maskOn(); g.poly([[4, 122], [58, 104], [64, 118], [10, 138]], 6); g.ell(61, 111, 4, 7, 16); g.keyline(0);
    g.line(8, 126, 56, 109, 0); g.ring(61, 111, 3, 6, 9);
    g.maskOn(); g.ell(20, 144, 8, 4, 9); g.keyline(0); g.ring(20, 144, 5, 2, 16);
    /* i fogli srotolati */
    g.poly([[60, 68], [210, 58], [222, 134], [70, 146]], 16);
    g.maskOn(); g.poly([[56, 64], [206, 54], [218, 130], [66, 142]], 0); g.ell(61, 103, 7, 39, 0); g.ell(212, 92, 7, 38, 0); g.keyline(16);
    g.arc(61, 103, 4, 36, -PI / 2, PI / 2, 9); g.arc(212, 92, 4, 35, PI / 2, 1.5 * PI, 9);
    g.text(76, 68, "QUOTA 715", 16, 2);
    g.line(80, 88, 84, 132, 16); g.line(84, 132, 198, 124, 16);
    for (i = 0; i < 6; i++) { x = 100 + i * 18; g.line(x, 131 - i * 1.2, x, 128 - i * 1.2, 16); }
    for (i = 0; i < 4; i++) { g.hline(80 + i * 0.6, 83 + i * 0.6, 96 + i * 10, 16); }
    pts = [];
    for (i = 0; i <= 20; i++) { q = i / 20; pts.push([88 + q * 96, 128 - q * 6 - 34 * q * q * q * q]); }
    g.pline(pts, 16, 1);
    for (y = 86; y < 124; y += 3) { g.px(184, y, 16); }
    g.ell(184, 90, 3, 3, 0); g.ring(184, 90, 3, 3, 16); g.px(184, 90, 16);
    for (i = 0; i < 4; i++) { g.hline(96, 150 - i * 12, 96 + i * 5, 9); }
    /* il filo del pendolo, e il peso */
    g.line(164, 0, px0, 38, 0);
    g.maskOn(); g.poly([[px0 - 5, 38], [px0 + 5, 38], [px0 + 3, 50], [px0, 56], [px0 - 3, 50]], 16); g.keyline(0);
    g.hline(px0 - 4, px0 + 4, 41, 0);
    /* la lampada */
    g.maskOn(); g.rect(222, 112, 236, 134, 16); g.rect(226, 104, 232, 111, 16); g.keyline(0);
    g.ell(216, 118, 5, 6, 0); g.ring(216, 118, 5, 6, 16); fiamma(g, 211, 120, f);
  }

  /* l'offerta: Morandin sul coronamento, al tramonto */
  function offerta(g, f) {
    var i, x, y, w1 = [0, 2, 3, 1][f % 4], w2 = [0, -1, 1, 2][f % 4];
    sky(g, 0, 64, 11, 1);
    g.ell(120, 60, 15, 11, 0);
    for (i = 0; i < 5; i++) { g.hline(98 - i * 5, 142 + i * 5, 44 + i * 4, 1); }
    g.poly([[0, 64], [0, 36], [34, 26], [70, 46], [104, 64]], 13); g.pline([[0, 36], [34, 26], [70, 46], [104, 64]], 16);
    g.poly([[239, 64], [239, 30], [204, 22], [166, 44], [136, 64]], 14); g.pline([[239, 30], [204, 22], [166, 44], [136, 64]], 16);
    g.poly([[204, 22], [222, 26], [200, 36], [186, 34]], 4);
    for (i = 0; i < 6; i++) { y = 10 + i * 9; x = (i * 67 + f * 19) % 280 - 30; g.hline(x, x + 14 + (i % 2) * 8, y, 0); }
    /* il lago da una parte, il vuoto dall'altra */
    g.poly([[0, 64], [110, 64], [0, 114]], 12);
    for (i = 0; i < 7; i++) { y = 68 + i * 5; x = (i * 23 + f * 3) % 30; g.hline(x, x + 8, y, 0); if (y < 84) { g.hline(x + 44, x + 50, y, 0); } }
    g.poly([[239, 64], [130, 64], [239, 114]], 16);
    g.pline([[190, 66], [200, 80], [196, 92]], 12); g.pline([[224, 66], [230, 86]], 12);
    /* il coronamento */
    g.poly([[30, 149], [210, 149], [126, 64], [114, 64]], 3);
    for (i = 1; i < 6; i++) { y = 64 + i * i * 2.4; g.hline(120 - (y - 64) * 1.06, 120 + (y - 64) * 1.0, y, 9); }
    g.maskOn(); g.poly([[0, 149], [30, 149], [114, 64], [110, 64], [0, 112]], 0); g.poly([[239, 149], [210, 149], [126, 64], [130, 64], [239, 112]], 0); g.keyline(16);
    g.line(0, 112, 110, 64, 16); g.line(239, 112, 130, 64, 16); g.line(0, 118, 108, 67, 9); g.line(239, 118, 132, 67, 9);
    for (i = 0; i < 4; i++) { x = 14 + i * 26; g.line(x, 149 - 0, x + 3, 112 - i * 11 + 6, 9); g.line(239 - x, 149, 236 - x, 112 - i * 11 + 6, 9); }
    /* l'avvocato, dietro, con la cartella */
    man(g, 143, 98, 40, { coat: 16, key: 0, env: 1 });
    /* Morandin sbarra il passaggio */
    g.ell(120, 113, 16, 3, 9);
    man(g, 120, 112, 62, { coat: 2, key: 16, face: true });
    g.maskOn(); g.poly([[116, 66], [124, 66], [125, 71], [115, 71]], 0); g.poly([[122, 67], [136 + w1, 63 + w2], [142 + w1, 67 + w2], [138 + w1, 72 + w2], [124, 72]], 0); g.keyline(16);
    /* Ada, di spalle, col tubo sotto il braccio */
    man(g, 60, 196, 150, { coat: 3, key: 16 });
    g.maskOn(); g.poly([[70, 118], [106, 100], [110, 108], [74, 126]], 0); g.ell(108, 104, 3, 5, 0); g.keyline(16);
    g.ell(108, 104, 2, 3, 16); g.line(74, 121, 104, 106, 9);
    g.maskOn(); g.poly([[76, 96], [86, 100], [84, 124], [72, 128]], 3); g.keyline(16);
  }

  /* quota 715: l'acqua che sale lungo l'asta */
  function quota(g, f) {
    var i, x, y, wy = 56 - f, q, yy;
    g.rect(0, 0, 239, 149, 16);
    stars(g, f, 0, 150, 2, 30, 20);
    g.poly([[0, 46], [30, 30], [70, 40], [110, 24], [150, 38], [150, 60], [0, 60]], 14); g.pline([[0, 46], [30, 30], [70, 40], [110, 24], [150, 38]], 9);
    /* il fascio del riflettore */
    g.poly([[214, 10], [150, 149], [40, 149], [100, 60]], 13); g.poly([[214, 10], [128, 149], [70, 149], [112, 70]], 11);
    /* il coronamento e il paramento */
    g.rect(150, 30, 239, 149, 3); g.rect(144, 26, 239, 31, 0); g.hline(144, 239, 32, 16); g.vline(150, 33, 149, 16);
    for (y = 44; y < 150; y += 12) { g.hline(151, 239, y, 9); } for (x = 170; x < 240; x += 34) { g.vline(x, 33, 149, 6); }
    g.rect(212, 4, 214, 26, 0); g.maskOn(); g.poly([[204, 4], [220, 4], [216, 12], [206, 12]], 0); g.keyline(16); g.rect(208, 12, 214, 13, 0);
    for (x = 156; x < 208; x += 8) { g.vline(x, 18, 26, 0); } g.hline(152, 208, 18, 0);
    /* Morandin guarda l'acqua */
    man(g, 180, 26, 30, { coat: 16, key: 0 });
    /* l'asta idrometrica */
    g.rect(66, 2, 92, 149, 16);
    g.maskOn(); g.rect(64, 0, 90, 149, 0); g.keyline(16);
    for (i = 0; i <= 20; i++) {
      q = 716 - i; yy = 18 + i * 6.8;
      if (q % 5 === 0) { g.rect(64, yy - 1, 90, yy, 16); g.rect(64, yy + 1, 76, yy + 5, (q / 5) % 2 ? 16 : 0); }
      else { g.hline(64, 72 + (q % 5 === 0 ? 8 : 0), yy, 16); if (yy + 3 < 150) { g.rect(64, yy, 68, yy + 3, i % 2 ? 16 : 0); } }
    }
    g.rect(98, 14, 126, 34, 0); g.frame(98, 14, 126, 34, 16); g.frame(96, 12, 128, 36, 0); g.text(101, 19, "715", 16, 2);
    g.line(91, 24, 96, 24, 0);
    g.text(98, 57, "710", 0, 1); g.text(98, 91, "705", 0, 1); g.text(98, 125, "700", 0, 1);
    /* l'acqua */
    g.rect(0, wy, 239, 149, 16); g.hline(0, 239, wy, 0);
    for (x = (f * 5) % 12; x < 240; x += 12) { g.hline(x, x + 5, wy + 1, 16); }
    waves(g, f, 0, 239, wy + 2, 149);
    for (y = wy + 3; y < 150; y += 3) { g.hline(66 + (y % 2) * 2, 88 - ((y >> 1) % 3), y, y < wy + 30 ? 0 : 9); }
    for (y = wy + 4; y < 150; y += 4) { g.hline(120 - (y - wy) * 0.3 + (y % 3), 150 - (y % 5), y, 0); }
  }

  /* ================= FINALI ================= */

  /* La pratica: una scrivania a Milano, con il termosifone */
  function finPratica(g, f) {
    var i, x, y;
    g.rect(0, 0, 239, 149, 5);
    for (y = 6; y < 100; y += 10) { for (x = ((y / 10) % 2) * 6 + 3; x < 240; x += 12) { g.px(x, y, 12); } }
    g.rect(0, 118, 239, 149, 12); g.hline(0, 239, 117, 16);
    /* la finestra: nebbia e tetti */
    g.rect(22, 10, 124, 78, 2);
    g.c = [22, 10, 124, 78];
    g.poly([[22, 78], [22, 60], [40, 50], [58, 60], [58, 54], [78, 54], [78, 62], [96, 46], [114, 60], [124, 58], [124, 78]], 5);
    g.rect(46, 44, 49, 54, 5); g.rect(84, 40, 88, 54, 5); g.vline(68, 38, 54, 6); g.hline(65, 71, 40, 6); g.hline(66, 70, 43, 6);
    g.poly([[22, 78], [22, 70], [50, 64], [70, 72], [100, 62], [124, 70], [124, 78]], 8);
    for (i = 0; i < 4; i++) { x = (i * 40 + f * 3) % 140 + 4; g.ell(x, 30 + i * 9, 22, 3, 1); }
    g.c = null;
    g.frame(21, 9, 125, 79, 16); g.frame(20, 8, 126, 80, 0); g.frame(19, 7, 127, 81, 16);
    g.rect(72, 10, 74, 78, 0); g.vline(71, 10, 78, 16); g.vline(75, 10, 78, 16); g.rect(22, 42, 124, 43, 0); g.hline(22, 124, 44, 16);
    g.rect(14, 82, 132, 85, 0); g.frame(14, 82, 132, 85, 16);
    /* il termosifone */
    g.maskOn(); for (i = 0; i < 9; i++) { g.rect(30 + i * 10, 90, 36 + i * 10, 116, 0); g.ell(33 + i * 10, 90, 3, 2, 0); } g.keyline(16);
    for (i = 0; i < 9; i++) { g.vline(35 + i * 10, 92, 115, 9); }
    g.hline(22, 30, 112, 16); g.rect(20, 110, 23, 114, 16); g.vline(126, 96, 118, 16); g.hline(117, 126, 96, 16);
    for (i = 0; i < 3; i++) { smoke(g, 44 + i * 30, 88, f + i * 2, 5); }
    /* l'orologio */
    g.ell(160, 26, 10, 10, 0); g.ring(160, 26, 10, 10, 16); g.ring(160, 26, 9, 9, 16); g.line(160, 26, 160, 19, 16); g.line(160, 26, 165 + (f % 2), 29, 16);
    /* la scrivania */
    g.maskOn(); g.poly([[92, 98], [232, 98], [239, 114], [239, 122], [84, 122], [84, 114]], 1); g.keyline(16);
    g.hline(84, 239, 115, 16); g.rect(90, 123, 96, 149, 16);
    /* la lampada da tavolo */
    g.poly([[196, 108], [232, 108], [226, 100], [202, 100]], 0);
    g.rect(218, 104, 228, 106, 16); g.line(223, 104, 228, 84, 16, 1); g.line(228, 84, 216, 78, 16, 1);
    g.maskOn(); g.poly([[204, 86], [224, 78], [220, 70], [206, 76]], 16); g.keyline(0);
    /* la pratica, chiusa */
    g.maskOn(); g.poly([[104, 101], [150, 100], [154, 112], [100, 113]], 0); g.keyline(16);
    g.text(108, 103, "MALAN", 16, 1); g.frame(130, 102, 150, 110, 16); g.text(132, 104, "FINE", 16, 1);
    /* Ada, di spalle */
    g.maskOn(); g.rect(140, 112, 196, 149, 9); g.keyline(16);
    for (x = 146; x < 194; x += 8) { g.vline(x, 114, 149, 16); }
    g.maskOn(); g.poly([[136, 149], [140, 118], [154, 108], [182, 108], [196, 118], [200, 149]], 16); g.rect(163, 100, 173, 110, 16);
    g.ell(168, 90, 11, 13, 16); g.ell(168, 100, 7, 5, 16); g.keyline(0);
    g.line(160, 84, 176, 84, 9); g.hline(162, 174, 104, 0);
    g.maskOn(); g.poly([[196, 120], [206, 108], [210, 110], [202, 126]], 16); g.ell(208, 107, 3, 3, 0); g.keyline(0);
    g.line(209, 104, 214, 100, 0); if (f % 3 !== 2) { g.px(215, 99, 0); g.px(216, 99, 0); }
    smoke(g, 216, 96, f, 44);
  }

  /* Il posto: Ada davanti al plastico, il lago pieno fino all'orlo */
  function finPosto(g, f) {
    var i, x, y;
    g.rect(0, 0, 239, 149, 4);
    g.rect(0, 122, 239, 149, 12); g.hline(0, 239, 121, 16);
    for (x = -120; x <= 360; x += 30) { g.line(120 + (x - 120) * 0.4, 122, x, 149, 16); }
    g.rect(0, 84, 239, 86, 9);
    /* la finestra: l'acqua fino all'orlo */
    g.rect(108, 10, 228, 68, 2);
    g.c = [108, 10, 228, 68];
    g.poly([[108, 30], [130, 18], [156, 26], [186, 14], [228, 24], [228, 36], [108, 36]], 11); g.pline([[108, 30], [130, 18], [156, 26], [186, 14], [228, 24]], 16);
    g.poly([[186, 14], [200, 17], [190, 22], [176, 20]], 0);
    g.rect(108, 34, 228, 68, 15); g.hline(108, 228, 33, 0);
    waves(g, f, 108, 228, 34, 68);
    g.rect(108, 58, 228, 62, 0); g.hline(108, 228, 57, 16); g.hline(108, 228, 63, 16); for (x = 112; x < 228; x += 10) { g.vline(x, 58, 62, 9); }
    g.c = null;
    g.frame(107, 9, 229, 69, 16); g.frame(106, 8, 230, 70, 0); g.frame(105, 7, 231, 71, 16);
    g.rect(167, 10, 169, 68, 0); g.vline(166, 10, 68, 16); g.vline(170, 10, 68, 16);
    g.rect(100, 72, 236, 75, 0); g.frame(100, 72, 236, 75, 16);
    /* la porta, con la targhetta nuova */
    g.maskOn(); g.rect(10, 16, 56, 121, 9); g.keyline(16); g.frame(10, 16, 56, 121, 16);
    g.frame(15, 56, 51, 84, 16); g.frame(15, 90, 51, 116, 16); g.ell(50, 72, 2, 2, 0); g.ring(50, 72, 2, 2, 16);
    g.rect(15, 26, 51, 40, 0); g.frame(15, 26, 51, 40, 16); g.frame(16, 27, 50, 39, 16); g.text(18, 31, "A. CORVI", 16, 1);
    g.px(17, 28, 0); g.px(49, 28, 0); g.px(17, 38, 0); g.px(49, 38, 0);
    if (f % 4 < 2) { g.px(53, 24, 0); g.px(54, 23, 0); g.px(52, 23, 0); g.px(53, 22, 0); g.px(53, 26, 0); }
    /* il plastico sotto vetro */
    g.maskOn(); g.rect(116, 108, 214, 113, 0); g.rect(122, 114, 126, 134, 0); g.rect(204, 114, 208, 134, 0); g.keyline(16);
    g.rect(122, 80, 208, 107, 1); g.frame(122, 80, 208, 107, 16); g.frame(121, 79, 209, 108, 16);
    g.poly([[123, 107], [123, 88], [140, 84], [154, 96], [158, 107]], 13); g.poly([[207, 107], [207, 86], [192, 84], [178, 96], [174, 107]], 13);
    g.poly([[154, 96], [178, 96], [174, 107], [158, 107]], 0); g.arc(166, 92, 13, 6, 0.2, PI - 0.2, 16); g.pline([[154, 96], [158, 107]], 16); g.pline([[178, 96], [174, 107]], 16);
    g.rect(156, 89, 176, 95, 9); g.line(126, 82, 134, 98, 0); g.line(130, 82, 136, 94, 0);
    /* Ada */
    g.ell(84, 139, 22, 4, 14);
    man(g, 84, 138, 96, { coat: 3, key: 16 });
  }

  /* Notizie false: il giornale, e sopra l'atto */
  function finNotizie(g, f) {
    var i, x, y;
    g.rect(0, 0, 239, 149, 14);
    for (y = 20; y < 150; y += 34) { g.hline(0, 239, y, 16); g.hline(0, 239, y + 1, 11); }
    /* il giornale */
    g.poly([[16, 8], [196, 3], [202, 149], [20, 149]], 16);
    g.maskOn(); g.poly([[12, 4], [192, 0], [198, 149], [16, 149]], 0); g.keyline(16);
    g.text(60, 6, "LA VOCE DELLE VALLI", 16, 1); g.hline(18, 190, 14, 16); g.hline(18, 190, 16, 16);
    g.text(26, 21, "LA MONTAGNA", 16, 3); g.text(50, 40, "SI MUOVE", 16, 3);
    g.text(144, 59, "14 FEB. 1957", 16, 1);
    /* la V del font, cosi' grande, sembra una U: si ridisegna a punta */
    g.rect(122, 40, 130, 54, 0); g.rect(122, 40, 124, 48, 16); g.rect(128, 40, 130, 48, 16); g.rect(125, 49, 127, 54, 16); g.px(124, 49, 16); g.px(128, 49, 16);
    g.hline(18, 192, 67, 16);
    for (i = 0; i < 4; i++) {
      x = 20 + i * 44;
      for (y = 72; y < 148; y += 3) { if (!(i === 3 && y < 112)) { g.hline(x, x + 38 - ((y * 7 + i) % 5 === 0 ? 14 : 0), y, 9); } }
    }
    g.rect(152, 71, 191, 110, 13); g.frame(152, 71, 191, 110, 16); g.poly([[153, 109], [153, 96], [168, 80], [190, 74], [190, 109]], 16); crepa(g, 160, 84, 186, 104, 0);
    g.rect(153, 100, 170, 109, 6);
    /* l'atto, di traverso */
    g.poly([[36, 74], [134, 66], [142, 146], [44, 149]], 16);
    g.maskOn(); g.poly([[32, 70], [130, 62], [138, 149], [38, 149]], 0); g.keyline(16);
    g.frame(36, 73, 128, 149, 9);
    g.text(60, 76, "TRIBUNALE", 16, 1); g.hline(52, 112, 83, 16);
    g.text(42, 88, "DIFFUSIONE DI NOTIZIE", 16, 1); g.text(42, 96, "FALSE E TENDENZIOSE", 16, 1);
    for (y = 106; y < 146; y += 4) { g.hline(42, 96 + ((y * 3) % 5) * 3, y, 9); }
    g.ring(114, 126, 13, 13, 16); g.ring(114, 126, 12, 12, 16); g.ring(114, 126, 9, 9, 16); g.text(109, 124, "RG", 16, 1);
    for (i = 0; i < 8; i++) { g.px(114 + 11 * Math.cos(i * 0.785), 126 + 11 * Math.sin(i * 0.785), 0); }
    /* la tazza */
    g.ell(221, 30, 15, 12, 16); g.ell(219, 28, 15, 12, 0); g.ring(219, 28, 15, 12, 16); g.ring(219, 28, 11, 9, 9);
    g.ell(219, 28, 8, 6, 16); g.ring(219, 28, 8, 6, 0); g.arc(219, 29, 5, 3, 0.3, 2.4, 9); g.rect(229, 26, 236, 29, 0); g.frame(229, 26, 236, 29, 16);
    /* il posacenere, e la sigaretta che fuma */
    g.ell(221, 112, 14, 10, 16); g.ring(221, 112, 14, 10, 0); g.ring(221, 112, 10, 7, 0); g.ell(221, 112, 8, 5, 12);
    g.line(214, 114, 230, 104, 0, 1); g.px(213, 115, f % 2 ? 0 : 9); g.px(212, 116, 9);
    smoke(g, 213, 110, f, 52);
  }

  /* Acqua bassa: il lago all'alba, e i segni dei livelli */
  function finAcqua(g, f) {
    var i, x, y;
    sky(g, 0, 56, 9, 1);
    g.ell(138, 54, 14, 9, 0); for (i = 0; i < 4; i++) { g.hline(116 - i * 6, 160 + i * 6, 40 + i * 4, 1); }
    g.poly([[100, 58], [124, 44], [150, 56], [170, 46], [190, 58]], 9); g.pline([[100, 58], [124, 44], [150, 56], [170, 46], [190, 58]], 16);
    /* la Marcia, ferma */
    g.poly([[130, 76], [164, 40], [204, 20], [239, 12], [239, 100], [150, 100]], 13);
    g.poly([[204, 20], [239, 12], [239, 26], [214, 30], [192, 36]], 3); g.pline([[130, 76], [164, 40], [204, 20], [239, 12]], 16);
    crepa(g, 166, 42, 232, 80, 0);
    for (i = 0; i < 16; i++) { x = 150 + Math.floor(h1(i + 5) * 86); y = 50 + Math.floor(h1(i + 23) * 40); if (y > 210 - x) { g.line(x, y, x - 2, y - 5, 16); g.px(x - 1, y - 6, 0); } }
    /* la riva nuda, a righe */
    g.poly([[118, 78], [150, 96], [239, 92], [239, 128], [150, 126], [108, 116]], 0);
    for (i = 0; i < 8; i++) { y = 100 + i * 3.6; g.line(124 + (i < 3 ? (3 - i) * 8 : 0), y - (i < 3 ? 2 : 0), 239, y - 4, i % 2 ? 16 : 9); }
    g.pline([[118, 78], [150, 96], [239, 92]], 16);
    /* la diga */
    g.maskOn(); g.poly([[0, 44], [124, 60], [124, 66], [0, 52]], 0); g.keyline(16);
    g.poly([[0, 53], [124, 67], [112, 116], [0, 128]], 0); g.line(124, 67, 112, 116, 16); g.line(123, 67, 111, 116, 16);
    for (x = 24; x < 120; x += 28) { g.line(x, 56 + x * 0.11, x - 2, 92, 6); }
    g.line(0, 88, 119, 88, 16);
    for (i = 0; i < 9; i++) { g.line(0, 92 + i * 4, 118 - i * 0.8, 91 + i * 3, i % 2 ? 9 : 16); }
    for (x = 6; x < 124; x += 8) { g.vline(x, 39 + x * 0.13, 44 + x * 0.13, 16); } g.line(0, 39, 124, 55, 16);
    /* due carabinieri portano via Bepi */
    man(g, 40, 49, 22, { hat: "kepi", coat: 16, key: 0 }); man(g, 64, 52, 22, { hat: "kepi", coat: 16, key: 0 });
    g.maskOn(); g.rect(50, 34, 54, 50, 9); g.ell(52, 31, 2, 3, 9); g.ell(52, 28, 3, 1, 16); g.keyline(16);
    g.line(46, 40, 50, 42, 16); g.line(58, 43, 54, 42, 16);
    /* l'acqua, in basso */
    g.poly([[0, 128], [112, 116], [150, 126], [239, 128], [239, 149], [0, 149]], 16);
    g.pline([[0, 128], [112, 116], [150, 126], [239, 128]], 0);
    waves(g, f, 0, 239, 130, 149);
    for (y = 132; y < 150; y += 3) { g.hline(134 + (y % 2) * 2, 144 - ((y + f) % 3), y, 0); }
  }

  /* Al lupo: l'alba in piazza, la gente che torna a casa */
  function finLupo(g, f) {
    var i, x, y, sw = [-1, 0, 1, 0][f % 4], b;
    sky(g, 0, 96, 10, 1);
    /* la Marcia, intatta */
    g.poly([[70, 96], [110, 62], [150, 44], [200, 30], [239, 26], [239, 96]], 11);
    g.poly([[150, 44], [200, 30], [239, 26], [239, 40], [206, 44], [176, 54]], 1); g.pline([[70, 96], [110, 62], [150, 44], [200, 30], [239, 26]], 16);
    crepa(g, 128, 54, 226, 90, 0);
    for (i = 0; i < 16; i++) { x = 100 + Math.floor(h1(i + 5) * 130); y = 62 + Math.floor(h1(i + 23) * 30); if (y > 150 - x * 0.6) { g.line(x, y, x - 2, y - 5, 16); } }
    /* le case, col fumo */
    for (i = 0; i < 3; i++) {
      x = 150 + i * 32;
      g.maskOn(); g.rect(x, 86 - (i % 2) * 6, x + 26, 114, 13); g.poly([[x - 3, 86 - (i % 2) * 6], [x + 13, 74 - (i % 2) * 6], [x + 29, 86 - (i % 2) * 6]], 0); g.rect(x + 18, 72 - (i % 2) * 6, x + 21, 80 - (i % 2) * 6, 13); g.keyline(16);
      g.rect(x + 5, 94, x + 10, 101, i === 1 ? 0 : 16); g.rect(x + 16, 94, x + 21, 101, 16); g.rect(x + 9, 104, x + 15, 114, 16);
      if (i === 1) { smoke(g, x + 19, 64, f, 22); }
    }
    /* la chiesa e il campanile */
    g.maskOn();
    g.rect(0, 74, 34, 114, 13); g.poly([[0, 74], [0, 60], [36, 74]], 13);
    g.rect(34, 30, 60, 114, 13); g.poly([[32, 30], [47, 2], [62, 30]], 16);
    g.keyline(16);
    g.poly([[33, 29], [47, 8], [61, 29]], 0); g.pline([[33, 29], [47, 3], [61, 29]], 16); g.vline(47, 0, 4, 16); g.hline(45, 49, 1, 16);
    g.hline(34, 60, 30, 16); g.hline(34, 60, 58, 16); g.hline(34, 60, 60, 16);
    g.rect(40, 36, 54, 54, 16); g.ell(47, 36, 7, 4, 16);
    g.maskOn(); g.poly([[45 + sw * 3, 40], [49 + sw * 3, 40], [52 + sw * 5, 50], [42 + sw * 5, 50]], 0); g.keyline(16); g.px(47 + sw * 6, 52, 0); g.vline(47, 34, 39, 0);
    if (sw) { g.arc(47 + sw * 12, 44, 3, 5, sw > 0 ? -1 : PI - 1, sw > 0 ? 1 : PI + 1, 16); g.arc(47 + sw * 16, 44, 4, 8, sw > 0 ? -1 : PI - 1, sw > 0 ? 1 : PI + 1, 16); }
    g.rect(44, 70, 50, 82, 16); g.ell(47, 70, 3, 3, 16);
    g.rect(10, 92, 22, 114, 16); g.ell(16, 92, 6, 5, 16); g.ring(16, 68, 4, 4, 16); g.hline(1, 33, 74, 16);
    /* la neve */
    g.rect(0, 115, 239, 149, 1); g.hline(0, 239, 114, 16);
    g.poly([[0, 114], [30, 110], [60, 114]], 0); g.pline([[0, 114], [30, 110], [60, 114]], 16); g.poly([[190, 114], [220, 110], [239, 112], [239, 114]], 0); g.pline([[190, 114], [220, 110], [239, 112]], 16);
    for (i = 0; i < 30; i++) { x = 20 + i * 7; y = 136 + Math.round(3 * Math.sin(i * 0.5)) + (i % 2) * 3; g.px(x, y, 12); g.px(x + 1, y, 12); }
    for (i = 0; i < 12; i++) { g.hline(Math.floor(h1(i + 8) * 220), Math.floor(h1(i + 8) * 220) + 8, 120 + Math.floor(h1(i + 70) * 26), 4); }
    /* la fila che torna verso le case */
    for (i = 0; i < 7; i++) {
      x = 42 + i * 24 + (f % 4); b = (f + i) % 2; y = 132 + (i % 3) * 2 - b;
      g.ell(x, y + 1, 7, 1, 9);
      if (i % 2) {
        woman(g, x, y, 24 + (i % 3) * 2, 16, 0);
        g.maskOn(); g.ell(x + 5, y - 10, 3, 3, 9); g.keyline(16);
      } else {
        man(g, x, y, 26 + (i % 3), { coat: i === 4 ? 9 : 16, key: i === 4 ? 16 : 0 });
        g.maskOn(); g.poly([[x - 6, y - 19], [x + 6, y - 19], [x + 7, y - 9], [x - 7, y - 9]], 6); g.keyline(16); g.line(x - 6, y - 15, x + 6, y - 13, 16);
      }
      if (i === 2) { woman(g, x + 8, y + 1, 13, 16, 0); }
    }
  }

  /* ================= MAPPA ================= */
  var LAKE = [[114, 24], [134, 24], [154, 40], [172, 60], [178, 82], [168, 100], [148, 110], [128, 104], [116, 90], [110, 70], [108, 46]];
  var PLACE = { corriera: [70, 136], piazza: [70, 112], albergo: [94, 112], chiesa: [46, 112], strada: [86, 84], direzione: [100, 64], baracca: [50, 64], diga: [124, 21] };
  var ALIAS = { camera: "albergo", centralino: "albergo", cunicolo: "diga" };
  var LINK = [["corriera", "piazza"], ["piazza", "albergo"], ["piazza", "chiesa"], ["piazza", "strada"], ["strada", "direzione"], ["strada", "baracca"], ["strada", "diga"]];
  var LABEL = { corriera: ["CORRIERA", 78, 137, 0], piazza: ["PIAZZA", 70, 101, 1], albergo: ["ALBERGO", 102, 113, 0], chiesa: ["CHIESA", 40, 123, 1], strada: ["STRADA", 86, 85, 2],
    direzione: ["DIREZIONE", 96, 53, 1], baracca: ["BARACCA", 50, 53, 1], diga: ["DIGA", 152, 14, 0] };
  function drawMap(g, st) {
    var seen = {}, vis = {}, here = ALIAS[st.room] || st.room, id, i, x, y, w = g.w, lake, k, a, b, n, L, tw, x0, c, rx, ry;
    for (id in st.visited) { if (st.visited.hasOwnProperty(id)) { vis[ALIAS[id] || id] = 1; } }
    for (id in vis) { if (vis.hasOwnProperty(id)) { seen[id] = 1; } }
    for (i = 0; i < LINK.length; i++) {
      if (vis[LINK[i][0]]) { seen[LINK[i][1]] = 1; }
      if (vis[LINK[i][1]]) { seen[LINK[i][0]] = 1; }
    }
    g.rect(0, 0, 239, 149, 0);
    g.maskOn(); g.poly(LAKE, 0); lake = g.m; g.m = null;
    function inLake(px, py) { return px >= 0 && py >= 0 && px < 240 && py < 150 && lake[py * w + px]; }
    function near(px, py, d) { return inLake(px - d, py) || inLake(px + d, py) || inLake(px, py - d) || inLake(px, py + d); }
    /* curve di livello: il versante a ovest, la Marcia a est, la testata a nord */
    var HILL = [[18, 62, 74, 62, 6, 11], [226, 62, 58, 58, 5, 10], [60, 4, 44, 26, 3, 9], [196, 6, 40, 22, 3, 8], [150, 150, 60, 30, 2, 12], [8, 140, 34, 26, 2, 10]];
    for (c = 0; c < HILL.length; c++) {
      for (i = 0; i < HILL[c][4]; i++) {
        rx = HILL[c][2] - i * HILL[c][5]; ry = HILL[c][3] - i * HILL[c][5] * HILL[c][3] / HILL[c][2];
        for (a = 0; a < 2 * PI; a += 0.012) {
          x = Math.round(HILL[c][0] + rx * Math.cos(a) * (1 + 0.08 * Math.sin(a * 5 + c))); y = Math.round(HILL[c][1] + ry * Math.sin(a) * (1 + 0.08 * Math.cos(a * 4 + c)));
          if (!inLake(x, y) && !near(x, y, 3) && (i % 2 === 0 || Math.round(a * 30) % 3)) { g.px(x, y, 16); }
        }
      }
    }
    /* il fondovalle resta bianco intorno al paese */
    g.ell(70, 118, 44, 20, 0);
    /* il lago */
    for (y = 0; y < 150; y++) {
      for (x = 0; x < 240; x++) {
        k = y * w + x;
        if (!lake[k]) { continue; }
        if (!lake[k - 1] || !lake[k + 1] || !lake[k - w] || !lake[k + w]) { g.d[k] = 1; continue; }
        n = 9;
        for (i = 1; i <= 4; i++) { if (!lake[k - i] || !lake[k + i] || !lake[k - i * w] || !lake[k + i * w]) { n = i; break; } }
        g.d[k] = (n === 2) || (n > 4 && y % 3 === 0 && (x + y) % 2 === 0) ? 1 : 0;
      }
    }
    g.text(132, 62, "LAGO", 16, 1); g.text(128, 70, "DEL GORGO", 16, 1);
    g.rect(127, 61, 164, 75, 0); g.text(136, 63, "LAGO", 16, 1); g.text(128, 70, "DEL GORGO", 16, 1);
    /* la diga, e la gola a valle */
    g.rect(110, 17, 138, 25, 0);
    g.arc(124, 16, 13, 7, 0.15, PI - 0.15, 16); g.arc(124, 17, 13, 7, 0.15, PI - 0.15, 16); g.arc(124, 18, 13, 7, 0.15, PI - 0.15, 16);
    for (y = 3; y < 17; y++) { x = 124 + Math.round(2 * Math.sin(y * 0.7)); g.px(x - 2, y, 16); g.px(x + 2, y, 16); if (y % 2) { g.px(x, y, 16); } }
    /* la Marcia: la crepa, tratteggiata */
    g.rect(188, 100, 226, 108, 0); g.text(190, 102, "LA MARCIA", 16, 1);
    var M = [[184, 94], [194, 50], [206, 74], [216, 44], [228, 90]], t;
    for (i = 0; i < M.length - 1; i++) {
      n = Math.max(Math.abs(M[i + 1][0] - M[i][0]), Math.abs(M[i + 1][1] - M[i][1]));
      for (k = 0; k <= n; k++) { if (k % 4 < 3) { t = k / n; x = M[i][0] + (M[i + 1][0] - M[i][0]) * t; y = M[i][1] + (M[i + 1][1] - M[i][1]) * t; g.rect(x - 1, y, x + 1, y, 0); g.px(x, y, 16); g.px(x + 1, y, 16); } }
    }
    for (i = 0; i < 5; i++) { x = 190 + i * 9; y = 82 - (i % 2) * 8; g.line(x, y, x - 2, y + 4, 16); g.line(x, y, x + 2, y + 4, 16); }
    /* boschi a ovest */
    for (i = 0; i < 14; i++) { x = 8 + Math.floor(h1(i + 3) * 60); y = 20 + Math.floor(h1(i + 60) * 60); if (!(x > 34 && x < 66 && y > 44 && y < 72)) { g.rect(x - 1, y - 1, x + 3, y + 1, 0); g.px(x, y, 16); g.px(x + 1, y - 1, 16); g.px(x + 2, y, 16); } }
    /* il paese */
    var BL = [[52, 100, 5, 4], [60, 122, 6, 4], [80, 100, 6, 4], [84, 120, 5, 4], [98, 102, 5, 4], [104, 120, 6, 3], [34, 104, 5, 4], [30, 116, 6, 4], [56, 92, 4, 3], [84, 93, 5, 3], [112, 108, 5, 4], [48, 126, 5, 3]];
    for (i = 0; i < BL.length; i++) { g.rect(BL[i][0], BL[i][1], BL[i][0] + BL[i][2], BL[i][1] + BL[i][3], 16); }
    /* la strada della corriera, che viene da sud */
    for (y = 140; y < 150; y++) { g.px(68, y, 16); g.px(72, y, 16); }
    /* sentieri */
    for (i = 0; i < LINK.length; i++) {
      a = LINK[i][0]; b = LINK[i][1];
      if (seen[a] && seen[b] && (vis[a] || vis[b])) {
        n = Math.max(Math.abs(PLACE[a][0] - PLACE[b][0]), Math.abs(PLACE[a][1] - PLACE[b][1]));
        for (k = 0; k <= n; k++) { x = Math.round(PLACE[a][0] + (PLACE[b][0] - PLACE[a][0]) * k / n); y = Math.round(PLACE[a][1] + (PLACE[b][1] - PLACE[a][1]) * k / n); g.rect(x - 1, y - 1, x + 1, y + 1, 0); }
        for (k = 0; k <= n; k++) { if (k % 3 !== 2) { g.px(PLACE[a][0] + (PLACE[b][0] - PLACE[a][0]) * k / n, PLACE[a][1] + (PLACE[b][1] - PLACE[a][1]) * k / n, 16); } }
      }
    }
    for (id in PLACE) {
      if (PLACE.hasOwnProperty(id) && seen[id]) {
        x = PLACE[id][0]; y = PLACE[id][1];
        g.rect(x - 4, y - 4, x + 4, y + 4, 0); g.frame(x - 3, y - 3, x + 3, y + 3, 16);
        if (vis[id]) { g.rect(x - 2, y - 2, x + 2, y + 2, 16); g.px(x, y, 0); }
      }
    }
    for (id in LABEL) {
      if (LABEL.hasOwnProperty(id) && seen[id]) {
        L = LABEL[id]; a = vis[id] ? L[0] : "?"; tw = a.length * 4 - 1; x0 = L[3] === 1 ? L[1] - Math.floor(tw / 2) : (L[3] === 2 ? L[1] - tw - 8 : L[1]);
        g.rect(x0 - 2, L[2] - 4, x0 + tw + 1, L[2] + 4, id === here ? 16 : 0); g.frame(x0 - 3, L[2] - 5, x0 + tw + 2, L[2] + 5, 16);
        g.text(x0, L[2] - 2, a, id === here ? 0 : 16, 1);
      }
    }
    /* quote */
    g.rect(8, 82, 22, 88, 0); g.text(9, 83, "1840", 16, 1); g.rect(210, 28, 226, 34, 0); g.text(211, 29, "1921", 16, 1); g.rect(140, 86, 152, 92, 0); g.text(141, 87, "715", 16, 1);
    g.hline(24, 26, 85, 16); g.vline(25, 84, 86, 16);
    /* rosa dei venti */
    g.ell(24, 26, 13, 13, 0); g.ring(24, 26, 12, 12, 16); g.ring(24, 26, 9, 9, 9);
    g.poly([[24, 10], [21, 26], [27, 26]], 16); g.poly([[24, 42], [21, 26], [27, 26]], 0); g.pline([[21, 26], [24, 42], [27, 26]], 16);
    g.poly([[8, 26], [24, 23], [24, 29]], 0); g.pline([[24, 23], [8, 26], [24, 29]], 16); g.poly([[40, 26], [24, 23], [24, 29]], 16);
    g.rect(22, 2, 26, 8, 0); g.text(23, 3, "N", 16, 1);
    /* scala e cartiglio */
    g.rect(8, 141, 46, 147, 0); g.hline(10, 42, 144, 16); g.vline(10, 142, 146, 16); g.vline(26, 143, 145, 16); g.vline(42, 142, 146, 16); g.rect(10, 144, 26, 145, 16);
    g.rect(143, 117, 235, 145, 0); g.frame(143, 117, 235, 145, 16); g.frame(145, 119, 233, 143, 16);
    g.text(154, 122, "VAL SORDA", 16, 2); g.text(164, 136, "FEBBRAIO 1957", 16, 1);
    g.frame(0, 0, 239, 149, 16); g.frame(2, 2, 237, 147, 16);
    for (x = 12; x < 240; x += 12) { g.px(x, 1, 16); g.px(x, 148, 16); } for (y = 12; y < 150; y += 12) { g.px(1, y, 16); g.px(238, y, 16); }
    return here;
  }

  Pix.add({
    m_chiamata: { w: W, h: H, n: 12, draw: chiamata },
    m_colpo: { w: W, h: H, n: 10, draw: colpo },
    m_occhiali: { w: W, h: H, n: 8, draw: occhiali },
    m_relazione: { w: W, h: H, n: 8, draw: relazione },
    m_offerta: { w: W, h: H, n: 8, draw: offerta },
    m_quota: { w: W, h: H, n: 8, draw: quota },
    f_pratica: { w: W, h: H, n: 8, draw: finPratica },
    f_posto: { w: W, h: H, n: 8, draw: finPosto },
    f_notizie: { w: W, h: H, n: 8, draw: finNotizie },
    f_acqua: { w: W, h: H, n: 8, draw: finAcqua },
    f_lupo: { w: W, h: H, n: 8, draw: finLupo }
  });
  Pix.setMap(drawMap, PLACE);
})();
