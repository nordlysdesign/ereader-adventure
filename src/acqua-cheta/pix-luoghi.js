/* ==================================================================
   ACQUA CHETA: le tavole dei luoghi. La libreria di disegno sta in
   src/gfx.js. Il secondo argomento di ogni scena e' il fotogramma.
   ================================================================== */
(function () {
  var K = Pix.kit, W = K.W, H = K.H, PI = K.PI, h1 = K.h1, waves = K.waves, smoke = K.smoke, man = K.man,
    bust = K.bust, stars = K.stars, woman = K.woman;
  var SWAY = [0, 1, 0, -1];

  /* ---------- mattoni ---------- */
  /* neve: fiocchi di uno o due punti, che scendono piano e ondeggiano */
  function snow(g, f, n, x0, y0, x1, y1) {
    var i, x, y, w = x1 - x0 + 1, h = y1 - y0 + 1;
    for (i = 0; i < n; i++) {
      y = y0 + Math.floor(h1(i + 31) * h + f * (2 + i % 3)) % h;
      x = x0 + (Math.floor(h1(i) * w + 2 * Math.sin((f + i) * 0.9)) + w) % w;
      g.px(x, y, 0); if (i % 4 === 0 && x < x1) { g.px(x + 1, y, 0); } if (i % 9 === 0 && y < y1) { g.px(x, y + 1, 0); }
    }
  }
  /* fumo di un colore qualsiasi (quello della libreria e' solo bianco) */
  function fumo(g, x, y, f, n, t) {
    var j, sx;
    for (j = 0; j < n; j++) { sx = x + Math.round(2.4 * Math.sin((j + f * 2) * 0.42) + j * 0.25); if ((j + f) % 4 !== 0) { g.px(sx, y - j, t); } if (j > n / 3 && (j + f) % 3 === 0) { g.px(sx + 1, y - j, t); } }
  }
  /* la crepa a M della Marcia */
  function crepa(g, x, y, s, t, th) { g.pline([[x, y + 9 * s], [x + 7 * s, y], [x + 14 * s, y + 7 * s], [x + 22 * s, y - 2 * s], [x + 31 * s, y + 10 * s]], t, th); }
  function nuvole(g, f, t) { g.ell(50 + (f % 8) * 2, 10, 44, 4, t); g.ell(186 - (f % 8) * 2, 18, 38, 4, t); }
  function lampada(g, x, sw, lit) {
    g.line(x, 0, x + sw * 2, 10, 16); g.maskOn(); g.poly([[x - 7 + sw * 2, 16], [x + 7 + sw * 2, 16], [x + 3 + sw * 2, 10], [x - 3 + sw * 2, 10]], 16); g.keyline(0);
    g.ell(x + sw * 2, 17, 2, 1, lit ? 0 : 9);
  }

  /* ================= LA FERMATA DELLA CORRIERA ================= */
  function fermata(night) {
    return function (g, f) {
      var L = night ? 0 : 16, i, x;
      g.rect(0, 0, 239, 92, night ? 16 : 2);
      if (!night) {
        nuvole(g, f, 0);
        /* in fondo alla valle, il muro della diga */
        g.maskOn(); g.poly([[100, 60], [142, 60], [135, 92], [107, 92]], 0); g.keyline(16);
        for (x = 108; x < 136; x += 5) { g.vline(x, 66, 91, 5); } g.hline(102, 140, 63, 16);
      }
      g.maskOn();
      g.poly([[0, 92], [0, 38], [28, 20], [52, 42], [78, 28], [100, 58], [108, 92]], night ? 16 : 6);
      g.poly([[134, 92], [142, 58], [166, 26], [196, 44], [239, 16], [239, 92]], night ? 16 : 7);
      g.keyline(L);
      /* neve sulle creste */
      g.poly([[28, 21], [20, 30], [27, 28], [32, 34], [38, 29]], 0); g.poly([[78, 29], [70, 38], [78, 35], [86, 40]], 0);
      g.poly([[166, 27], [156, 40], [165, 36], [172, 42], [178, 34]], 0); g.poly([[239, 17], [222, 32], [232, 30], [239, 36]], 0);
      for (i = 0; i < 12; i++) { x = 6 + i * 20; g.line(x, 78 + (i % 3) * 3, x + 4, 88, night ? 9 : 16); }
      /* neve a terra, la strada */
      g.rect(0, 93, 239, 149, night ? 2 : 0); g.hline(0, 239, 93, 16);
      g.poly([[112, 94], [130, 94], [232, 149], [44, 149]], night ? 11 : 4);
      g.line(118, 95, 104, 149, night ? 3 : 12); g.line(125, 95, 178, 149, night ? 3 : 12);
      g.line(112, 94, 44, 149, 16); g.line(130, 94, 232, 149, 16);
      /* il lampione */
      if (night) { g.poly([[25, 42], [37, 42], [70, 124], [-8, 124]], 11); g.poly([[28, 42], [34, 42], [52, 124], [10, 124]], 6); g.ell(30, 126, 36, 6, 0); }
      g.vline(30, 40, 126, night ? 0 : 16); g.vline(31, 40, 126, 16); g.rect(27, 124, 34, 128, 16);
      g.maskOn(); g.poly([[22, 41], [39, 41], [35, 34], [26, 34]], 16); g.keyline(0); g.rect(28, 42, 33, 44, night ? 0 : 9);
      /* la palina */
      g.vline(186, 62, 128, night ? 0 : 16); g.vline(187, 62, 128, 16);
      g.rect(170, 50, 203, 62, 0); g.frame(170, 50, 203, 62, 16); g.frame(169, 49, 204, 63, 0); g.text(173, 54, "FERMATA", 16, 1);
      if (!night) {
        g.rect(174, 68, 200, 92, 0); g.frame(174, 68, 200, 92, 16); g.text(178, 71, "ORARI", 16, 1);
        for (i = 0; i < 4; i++) { g.hline(177, 186, 79 + i * 3, 9); g.hline(190, 197, 79 + i * 3, 16); }
      }
      /* cumuli */
      g.ell(214, 128, 46, 9, 0); g.arc(214, 128, 46, 9, PI, 2 * PI, 16); for (x = 180; x < 239; x += 6) { g.px(x, 132 + (x % 4), 9); }
      g.ell(4, 138, 40, 10, 0); g.arc(4, 138, 40, 10, PI, 2 * PI, 16);
      if (night) {
        /* la corriera che riparte */
        g.maskOn(); g.rect(107, 70, 135, 97, 16); g.ell(121, 70, 14, 4, 16); g.rect(109, 97, 113, 100, 16); g.rect(129, 97, 133, 100, 16); g.keyline(0);
        g.rect(111, 74, 131, 83, 7); g.frame(111, 74, 131, 83, 0); g.vline(121, 74, 83, 0);
        g.rect(109, 89, 111, 91, f % 4 === 3 ? 9 : 0); g.rect(131, 89, 133, 91, f % 4 === 3 ? 9 : 0); g.rect(118, 90, 124, 93, 0);
        smoke(g, 113, 101, f, 14); fumo(g, 114, 106, f, 8, 9);
        /* Ada, di spalle, con la valigia */
        man(g, 84, 147, 62, { coat: 3, key: 16 });
        g.maskOn(); g.rect(100, 130, 118, 146, 13); g.rect(106, 127, 112, 129, 16); g.keyline(16); g.hline(100, 118, 135, 0); g.px(104, 138, 0); g.px(114, 138, 0);
        snow(g, f, 140, 0, 0, 239, 149);
      } else {
        /* impronte, e un corvo sulla palina */
        for (i = 0; i < 6; i++) { g.rect(150 + i * 5, 120 + i * 5, 151 + i * 5, 121 + i * 5, 12); g.rect(155 + i * 5, 118 + i * 5, 156 + i * 5, 119 + i * 5, 12); }
        g.maskOn(); g.ell(178, 46, 4, 2, 16); g.poly([[181, 45], [186, 43 + (f % 2)], [182, 47]], 16); g.keyline(0); g.px(174, 45 + (f % 4 === 0 ? 1 : 0), 16);
      }
    };
  }

  /* ================= PIAZZA DELLA PIEVE ================= */
  function pieve(night) {
    return function (g, f) {
      var B = night ? 13 : 0, L = night ? 0 : 16, D = night ? 16 : 11, i, k, x, y;
      g.rect(0, 0, 239, 149, night ? 16 : 2);
      if (!night) { nuvole(g, f, 0); }
      g.maskOn(); g.poly([[0, 72], [30, 44], [66, 56], [112, 22], [150, 36], [190, 12], [239, 30], [239, 116], [0, 116]], night ? 16 : 6); g.keyline(L);
      g.poly([[112, 23], [100, 38], [111, 34], [118, 42], [126, 32]], 0); g.poly([[190, 13], [176, 30], [188, 26], [196, 34], [206, 22]], 0);
      /* la chiesa, a ovest */
      g.rect(12, 62, 70, 116, B); g.poly([[8, 62], [41, 38], [74, 62]], B); g.frame(12, 62, 70, 116, L);
      g.line(8, 62, 41, 38, 0, 1); g.line(41, 38, 74, 62, 0, 1); g.line(8, 64, 41, 40, 16); g.line(41, 40, 74, 64, 16);
      g.vline(41, 27, 37, L); g.hline(38, 44, 30, L);
      g.ell(41, 62, 6, 6, D); g.ring(41, 62, 6, 6, L); g.vline(41, 57, 67, L); g.hline(36, 46, 62, L);
      g.rect(33, 92, 49, 116, D); g.ell(41, 92, 8, 7, D); g.arc(41, 92, 8, 7, PI, 2 * PI, L); g.vline(33, 92, 116, L); g.vline(49, 92, 116, L); g.vline(41, 86, 116, L);
      g.rect(18, 76, 23, 90, D); g.frame(18, 76, 23, 90, L); g.rect(59, 76, 64, 90, D); g.frame(59, 76, 64, 90, L);
      /* il campanile */
      g.rect(78, 30, 98, 116, B); g.frame(78, 30, 98, 116, L);
      g.maskOn(); g.poly([[76, 30], [88, 5], [100, 30]], night ? 13 : 10); g.keyline(L); g.line(77, 29, 88, 6, 0, 1); g.vline(88, 0, 5, L); g.hline(86, 90, 2, L);
      g.rect(83, 36, 93, 50, D); g.frame(83, 36, 93, 50, L); g.poly([[86, 40], [90, 40], [92, 47], [84, 47]], night ? 0 : 16); g.px(88, 49, night ? 0 : 16);
      g.ell(88, 64, 5, 5, 0); g.ring(88, 64, 5, 5, 16); g.line(88, 64, 88, 61, 16); g.line(88, 64, 90, 65, 16);
      g.rect(87, 80, 89, 90, D); g.frame(86, 79, 90, 91, L);
      /* l'albergo, a est */
      g.rect(150, 54, 239, 116, B); g.rect(146, 48, 239, 53, 0); g.hline(146, 239, 47, L); g.hline(146, 239, 54, 16); g.vline(150, 54, 116, L);
      g.rect(206, 34, 214, 47, B); g.frame(206, 34, 214, 47, L); g.hline(205, 215, 33, 0);
      for (i = 0; i < 3; i++) {
        x = 160 + i * 27;
        g.rect(x, 60, x + 14, 76, night ? ((i === 1 && f % 4 === 2) ? 4 : 0) : 11); g.frame(x, 60, x + 14, 76, L); g.vline(x + 7, 60, 76, 16); g.hline(x, x + 14, 68, 16);
        g.hline(x - 1, x + 15, 77, 0);
      }
      g.rect(168, 82, 214, 92, 0); g.frame(168, 82, 214, 92, 16); g.text(172, 85, "ALLA POSTA", 16, 1);
      g.rect(184, 96, 200, 116, D); g.frame(184, 96, 200, 116, L); g.vline(192, 96, 116, L); if (night) { g.rect(186, 99, 190, 106, 0); g.rect(194, 99, 198, 106, 0); }
      for (i = 0; i < 2; i++) { x = 158 + i * 56; g.rect(x, 98, x + 14, 110, night ? 0 : 11); g.frame(x, 98, x + 14, 110, L); g.vline(x + 7, 98, 110, 16); }
      /* la neve in piazza */
      g.rect(0, 117, 239, 149, night ? 3 : 0); g.hline(0, 239, 117, 16);
      if (night) { for (k = 0; k < 3; k++) { x = [165, 192, 221][k]; for (y = 119 + (f % 2); y < 140; y += 3) { g.hline(x - 5 + (y % 2), x + 5 - ((y >> 1) % 2), y, 0); } } }
      for (i = 0; i < 9; i++) { g.rect(44 + i * 8, 122 + i * 3, 45 + i * 8, 123 + i * 3, 12); g.rect(184 - i * 7, 122 + i * 3, 185 - i * 7, 123 + i * 3, 12); }
      /* la fontana gelata */
      g.maskOn(); g.rect(116, 100, 122, 130, night ? 9 : 5); g.rect(113, 96, 125, 100, night ? 9 : 5); g.ell(119, 134, 24, 6, night ? 9 : 5); g.keyline(16);
      g.ell(119, 133, 19, 3, 0); g.hline(113, 125, 95, 0); g.hline(122, 129, 108, 16); g.hline(122, 129, 109, 16);
      g.poly([[126, 110], [130, 110], [128, 127]], 0); g.line(126, 110, 128, 127, 16); g.line(130, 110, 128, 127, 16);
      if (night) { snow(g, f, 140, 0, 0, 239, 149); }
      else { fumo(g, 210, 31, f, 16, 16); fumo(g, 60, 36, f + 2, 10, 16); }
    };
  }

  /* ================= L'ALBERGO «ALLA POSTA» ================= */
  function tavolo(g, x, y, w, sedie) {
    var i, sx;
    g.maskOn(); g.rect(x, y, x + w, y + 3, 0); g.rect(x + 3, y + 4, x + 5, 149, 0); g.rect(x + w - 5, y + 4, x + w - 3, 149, 0); g.keyline(16);
    for (i = 0; i < sedie; i++) {
      sx = x + 4 + i * 40;
      g.maskOn(); g.rect(sx, y - 6, sx + 24, y - 1, 0); g.rect(sx + 1, y - 30, sx + 3, y - 7, 0); g.rect(sx + 21, y - 30, sx + 23, y - 7, 0); g.rect(sx + 7, y - 25, sx + 8, y - 7, 0); g.rect(sx + 16, y - 25, sx + 17, y - 7, 0); g.keyline(16);
      g.hline(sx + 1, sx + 23, y - 18, 0); g.hline(sx + 1, sx + 23, y - 17, 16);
    }
  }
  function osteria(notte) {
    return function (g, f) {
      var sw = SWAY[f % 4], i, x, y, r;
      g.rect(0, 0, 239, 104, notte ? 14 : 4);
      if (notte) { g.poly([[124, 17], [136, 17], [206, 104], [70, 104]], 9); g.poly([[127, 17], [133, 17], [176, 104], [96, 104]], 5); }
      g.rect(0, 105, 239, 149, notte ? 15 : 9); g.hline(0, 239, 104, 16); g.hline(0, 239, 105, 0);
      for (x = -120; x <= 360; x += 60) { g.line(120 + (x - 120) * 0.45, 106, x, 149, notte ? 12 : 16); }
      /* la cabina del telefono */
      g.maskOn(); g.rect(6, 14, 46, 104, 12); g.keyline(0); g.frame(6, 14, 46, 104, 16); g.frame(8, 16, 44, 102, 16);
      g.rect(12, 36, 40, 74, notte ? 16 : 1); g.frame(12, 36, 40, 74, 0); g.frame(11, 35, 41, 75, 16); g.vline(26, 36, 74, 0);
      if (!notte) { g.rect(20, 46, 30, 62, 16); g.ring(25, 52, 3, 3, 0); g.rect(22, 58, 28, 60, 0); }
      g.rect(9, 19, 43, 29, 0); g.frame(9, 19, 43, 29, 16); g.text(11, 22, "TELEFONO", 16, 1);
      g.frame(13, 82, 39, 98, 16); g.rect(42, 58, 43, 68, 0);
      /* la nicchia del centralino */
      g.maskOn(); g.rect(88, 14, 140, 72, 16); g.keyline(0);
      for (r = 0; r < 3; r++) { for (i = 0; i < 7; i++) { x = 94 + i * 6; y = 26 + r * 9; g.rect(x, y, x + 1, y + 1, 0); g.px(x, y - 4, 9); } }
      g.px(112, 22, f % 2 ? 0 : 16); g.px(113, 22, f % 2 ? 0 : 16); g.px(112, 21, f % 2 ? 0 : 16);
      g.pline([[100, 37], [98, 50], [102, 60], [106, 64]], 0); g.pline([[118, 28], [121, 46], [116, 58], [118, 64]], 0); g.pline([[130, 46], [133, 56], [129, 64]], 0);
      g.rect(90, 64, 138, 66, 0); for (i = 0; i < 6; i++) { g.vline(96 + i * 7, 60, 63, 0); }
      /* Olga */
      woman(g, 158, 130, 86, 16, 0);
      g.ell(158, 59, 4, 5, 0); g.px(156, 59, 16); g.px(160, 59, 16); g.hline(157, 159, 62, 16);
      if (notte) { g.line(152, 70, 158, 78, 0); g.line(164, 70, 158, 78, 0); g.vline(158, 78, 92, 0); }
      else { g.poly([[152, 72], [164, 72], [166, 94], [150, 94]], 0); g.line(152, 72, 155, 66, 0); g.line(164, 72, 161, 66, 0); g.arc(158, 53, 6, 6, PI * 1.1, PI * 1.9, 0); }
      /* il banco */
      g.maskOn(); g.rect(72, 90, 182, 94, 0); g.rect(74, 95, 180, 128, notte ? 12 : 8); g.keyline(16);
      g.hline(72, 182, 95, 16); g.frame(80, 100, 124, 122, 16); g.frame(130, 100, 174, 122, 16); g.frame(82, 102, 122, 120, 0); g.frame(132, 102, 172, 120, 0);
      g.maskOn(); g.rect(84, 76, 88, 89, 16); g.rect(85, 71, 87, 76, 16); g.keyline(0); g.rect(84, 80, 88, 84, 0);
      g.rect(94, 84, 98, 89, 0); g.frame(94, 84, 98, 89, 16); g.rect(102, 84, 106, 89, 0); g.frame(102, 84, 106, 89, 16);
      /* la stufa di maiolica */
      g.rect(203, 0, 207, 30, 16); g.vline(202, 0, 30, 0); g.vline(208, 0, 30, 0);
      g.maskOn(); g.rect(190, 34, 220, 118, 0); g.rect(186, 30, 224, 34, 0); g.rect(186, 114, 224, 121, 0); g.keyline(16);
      for (y = 44; y < 112; y += 10) { g.hline(190, 220, y, 9); } for (x = 200; x < 220; x += 10) { g.vline(x, 35, 113, 9); }
      for (y = 39; y < 112; y += 10) { for (x = 195; x < 220; x += 10) { g.px(x, y, 16); } }
      g.rect(200, 96, 210, 108, 16); g.frame(199, 95, 211, 109, 16); g.px(208, 102, 0); g.hline(186, 224, 34, 16); g.hline(186, 224, 114, 16);
      lampada(g, 130, sw, true);
      if (notte) {
        /* Vescovi, seduto accanto alla cabina, col cappotto addosso */
        g.rect(50, 112, 51, 140, 0); g.rect(74, 112, 75, 140, 0); g.rect(49, 84, 50, 140, 0);
        bust(g, 63, 96, 0.5, { hair: 1, coat: 16, glasses: 1, scarf: 0, collarUp: 1 });
        g.maskOn(); g.poly([[44, 126], [82, 126], [88, 134], [86, 149], [72, 149], [72, 138], [50, 138]], 16); g.keyline(0);
        tavolo(g, 150, 132, 86, 2);
      } else {
        /* Vescovi alla macchina da scrivere */
        bust(g, 216, 102, 0.5, { hair: 1, coat: 16, glasses: 1, scarf: 0, smoke: 1, f: f });
        tavolo(g, 166, 130, 72, 0);
        g.maskOn(); g.rect(174, 119, 198, 129, 16); g.rect(177, 115, 195, 119, 16); g.keyline(0);
        for (x = 177; x < 197; x += 3) { g.px(x, 123, 0); g.px(x + 1, 126, 0); }
        g.rect(180, 102 + (f % 2), 192, 116, 0); g.frame(180, 102 + (f % 2), 192, 116, 16); g.hline(182, 189, 106 + (f % 2), 9); g.hline(182, 190, 109 + (f % 2), 9); g.hline(182, 187, 112 + (f % 2), 9);
      }
    };
  }

  /* ================= CAMERA 3 ================= */
  function camera3(night) {
    return function (g, f) {
      var L = night ? 0 : 16, sw = SWAY[f % 4], i, x, y;
      g.rect(0, 0, 239, 104, night ? 13 : 3);
      for (y = 6; y < 100; y += 10) { for (x = ((y / 10) % 2 > 0.5 ? 5 : 0) + 2; x < 240; x += 10) { g.px(x, y, night ? 9 : 16); } }
      g.rect(0, 105, 239, 149, night ? 15 : 10); g.hline(0, 239, 104, 16); g.hline(0, 239, 105, 0);
      for (y = 112; y < 150; y += 8) { g.hline(0, 239, y, 16); }
      /* la finestra: il lago e la Marcia */
      g.c = [112, 14, 196, 84];
      g.rect(112, 14, 196, 84, night ? 16 : 1);
      if (!night) { g.ell(130 + (f % 8) * 2, 20, 22, 3, 0); g.ell(180 - (f % 8), 26, 20, 2, 4); }
      g.maskOn(); g.poly([[112, 46], [134, 30], [158, 36], [180, 22], [196, 26], [196, 68], [112, 68]], night ? 16 : 4); g.keyline(L);
      if (night) { crepa(g, 126, 46, 1.6, 9, 0); g.line(180, 23, 172, 34, 9); g.line(134, 31, 128, 40, 9); }
      else {
        g.poly([[180, 23], [172, 32], [180, 30], [188, 34]], 0); g.poly([[134, 31], [128, 38], [135, 36], [140, 40]], 0);
        crepa(g, 126, 46, 1.6, 16, 1); crepa(g, 126, 48, 1.6, 0, 0);
        for (i = 0; i < 9; i++) { x = 118 + i * 9; g.line(x, 66 - (i % 3) * 2, x + 2, 60 - (i % 3) * 2, 16); }
      }
      g.rect(112, 69, 196, 84, night ? 16 : 13); waves(g, f, 112, 196, 69, 84); g.hline(112, 196, 68, L);
      if (night) { snow(g, f, 34, 112, 14, 196, 84); }
      g.c = null;
      g.frame(111, 13, 197, 85, 0); g.frame(110, 12, 198, 86, 0); g.frame(109, 11, 199, 87, 16);
      g.rect(153, 14, 155, 84, 0); g.vline(152, 14, 84, 16); g.vline(156, 14, 84, 16); g.rect(112, 46, 196, 47, 0); g.hline(112, 196, 45, 16); g.hline(112, 196, 48, 16);
      g.rect(104, 88, 204, 91, 0); g.frame(104, 88, 204, 91, 16);
      /* tende */
      g.maskOn(); g.poly([[100, 8], [116, 8], [114 + sw, 60], [118 + sw, 92], [102, 92]], 0); g.poly([[192, 8], [208, 8], [206, 92], [190 - sw, 92], [194 - sw, 60]], 0); g.keyline(16);
      g.line(106, 10, 107, 90, 9); g.line(111, 10, 111 + sw, 90, 9); g.line(198, 10, 198 - sw, 90, 9); g.line(203, 10, 202, 90, 9); g.rect(96, 5, 212, 8, 16); g.hline(96, 212, 4, 0);
      /* il letto, la valigia */
      g.maskOn(); g.rect(6, 56, 11, 132, 16); g.rect(6, 60, 20, 100, 16); g.rect(96, 86, 101, 132, 16); g.rect(11, 106, 96, 118, 16); g.keyline(0);
      g.maskOn(); g.ell(54, 100, 42, 10, 0); g.rect(14, 100, 94, 108, 0); g.ell(24, 92, 11, 6, 0); g.keyline(16);
      g.arc(54, 100, 30, 6, PI * 1.1, PI * 1.9, 9); g.arc(30, 102, 12, 5, PI * 1.1, PI * 1.8, 9); g.arc(78, 102, 12, 5, PI * 1.2, PI * 1.9, 9);
      g.maskOn(); g.rect(52, 76, 88, 93, 12); g.rect(66, 72, 74, 75, 16); g.keyline(16); g.frame(52, 76, 88, 93, 16); g.vline(60, 76, 93, 0); g.vline(80, 76, 93, 0); g.rect(68, 82, 72, 85, 0);
      /* il catino */
      g.maskOn(); g.rect(208, 108, 236, 111, 0); g.rect(211, 112, 213, 140, 0); g.rect(231, 112, 233, 140, 0); g.keyline(16);
      g.maskOn(); g.poly([[210, 100], [234, 100], [230, 107], [214, 107]], 0); g.keyline(16); g.hline(211, 233, 101, 16);
      g.maskOn(); g.poly([[219, 84], [227, 84], [229, 99], [217, 99]], 0); g.rect(221, 80, 225, 84, 0); g.keyline(16); g.arc(229, 90, 4, 4, -PI / 2, PI / 2, 16);
      /* un lume sul comodino, di notte */
      if (night) { g.ell(222, 70, 9 + (f % 2), 8, 9); g.rect(221, 66, 223, 74, 0); g.px(222, 64 - (f % 2), 0); g.rect(219, 75, 225, 78, 16); g.frame(219, 75, 225, 78, 0); }
    };
  }

  /* ================= LA PIEVE, CAPPELLA LATERALE ================= */
  function cero(g, x, base, top, f, k) {
    var fl = (f + k) % 3;
    g.ell(x, top - 12, 8, 8, 12); g.ell(x, top - 12, 4, 5, 8);
    g.maskOn(); g.poly([[x - 6, base], [x + 6, base], [x + 1, base - 7], [x - 1, base - 7]], 0); g.rect(x - 1, top, x, base - 7, 0); g.rect(x - 3, top - 1, x + 2, top, 0); g.keyline(16);
    g.rect(x - 1, top - 9, x, top - 2, 0); g.vline(x + 1, top - 9, top - 2, 16);
    g.px(x - 1 + (fl === 1 ? 1 : 0), top - 11, 0); g.px(x - 1 + (fl === 2 ? 1 : 0), top - 12, 0); g.px(x, top - 11, 0); if (fl !== 2) { g.px(x - (fl ? 0 : 1), top - 13, 0); }
  }
  function chiesa(g, f) {
    var i, x, y;
    g.rect(0, 0, 239, 110, 14);
    for (y = 12; y < 110; y += 14) { for (x = ((y / 14) % 2 > 0.5 ? 12 : 0); x < 240; x += 24) { g.hline(x, x + 9, y, 16); } }
    /* la finestra alta e la sua luce */
    g.poly([[27, 56], [51, 56], [124, 110], [66, 110]], 11);
    g.maskOn(); g.rect(26, 14, 52, 56, 2); g.ell(39, 14, 13, 10, 2); g.keyline(0);
    g.vline(39, 5, 56, 16); g.hline(27, 51, 24, 16); g.hline(27, 51, 40, 16); g.arc(39, 14, 13, 10, PI, 2 * PI, 16); g.frame(26, 14, 52, 56, 16);
    /* un crocifisso */
    g.rect(119, 14, 121, 46, 0); g.rect(110, 22, 130, 24, 0); g.frame(118, 13, 122, 47, 16);
    /* pavimento a scacchi */
    g.rect(0, 111, 239, 149, 4); g.hline(0, 239, 110, 0); g.hline(0, 239, 111, 16);
    for (x = -200; x <= 440; x += 32) { g.line(120 + (x - 120) * 0.5, 112, x, 149, 16); }
    g.hline(0, 239, 120, 16); g.hline(0, 239, 132, 16);
    /* i ceri dietro */
    cero(g, 76, 118, 62, f, 0); cero(g, 164, 118, 62, f, 1);
    /* i cavalletti e il feretro */
    for (i = 0; i < 2; i++) { x = 84 + i * 72; g.line(x - 9, 134, x + 7, 104, 0, 1); g.line(x + 9, 134, x - 7, 104, 0, 1); g.line(x - 10, 134, x + 6, 104, 16); g.line(x + 10, 135, x - 6, 105, 16); }
    g.maskOn(); g.poly([[58, 86], [182, 86], [188, 92], [186, 106], [56, 106], [54, 92]], 16); g.rect(60, 82, 180, 86, 16); g.keyline(0);
    g.hline(56, 186, 92, 0); g.rect(119, 95, 121, 104, 0); g.rect(115, 97, 125, 98, 0);
    g.ring(76, 99, 3, 2, 0); g.ring(164, 99, 3, 2, 0);
    /* i ceri davanti */
    cero(g, 42, 140, 76, f, 2); cero(g, 190, 140, 76, f, 1);
    /* Marta, in nero, sulla sedia impagliata */
    g.rect(229, 84, 230, 144, 0); g.rect(207, 122, 230, 124, 0); g.rect(208, 125, 209, 144, 0); g.vline(231, 84, 144, 16); for (y = 90; y < 118; y += 6) { g.hline(224, 229, y, 0); }
    g.maskOn();
    g.ell(217, 84, 5, 6, 16); g.poly([[211, 80], [222, 78], [226, 96], [209, 96]], 16);
    g.poly([[208, 94], [226, 94], [228, 120], [206, 120]], 16);
    g.poly([[206, 112], [228, 112], [228, 123], [208, 124], [202, 144], [192, 144], [195, 118]], 16);
    g.keyline(0);
    g.rect(211, 83, 213, 88, 0); g.px(210, 86, 0); g.ell(201, 117, 3, 2, 0); g.ring(201, 117, 3, 2, 16);
    for (i = 0; i < 4; i++) { g.px(212 + i * 3, 80 + (i % 2), 9); }
  }

  /* ================= LA STRADA DEL LAGO ================= */
  function lago(night) {
    return function (g, f) {
      var L = night ? 0 : 16, i, x, y, t, s;
      g.rect(0, 0, 239, 70, night ? 16 : 2);
      if (night) { stars(g, f, 0, 239, 2, 50, 44); } else { nuvole(g, f, 0); }
      /* la diga, in fondo */
      if (night) { g.poly([[90, 50], [66, 0], [84, 0], [96, 50]], 11); g.poly([[106, 50], [120, 0], [138, 0], [112, 50]], 11); }
      g.maskOn(); g.poly([[60, 50], [136, 50], [120, 70], [82, 70]], 0); g.keyline(night ? 0 : 16);
      g.hline(60, 136, 53, 16); for (x = 82; x < 122; x += 9) { g.vline(x, 54, 69, 9); } g.hline(60, 136, 50, 16);
      if (night) { g.rect(92, 47, 94, 49, 0); g.rect(108, 47, 110, 49, 0); }
      /* il versante di qua */
      g.maskOn(); g.poly([[0, 70], [0, 14], [30, 26], [62, 48], [86, 62], [90, 70]], night ? 16 : 5); g.keyline(L);
      /* la Marcia */
      g.maskOn(); g.poly([[112, 70], [130, 44], [160, 24], [196, 12], [239, 4], [239, 70]], night ? 16 : 5); g.keyline(L);
      if (night) { crepa(g, 150, 38, 2, 7, 0); }
      else {
        g.poly([[196, 13], [184, 24], [196, 21], [206, 28], [220, 14]], 0);
        crepa(g, 150, 38, 2, 16, 1); crepa(g, 150, 41, 2, 0, 0);
        for (i = 0; i < 12; i++) { x = 128 + i * 9; y = 66 - (i % 4) * 3; g.line(x, y, x + 3 + (i % 2), y - 7, 16); g.line(x, y - 3, x + 4, y - 4, 16); }
      }
      /* il lago */
      g.rect(84, 71, 239, 149, night ? 16 : 13); waves(g, f, 84, 239, 71, 149); g.hline(84, 239, 70, L);
      if (night) { for (y = 73; y < 100; y += 2) { g.hline(96 + (y % 3), 99, y, 0); g.hline(104, 106 - (y % 3), y, 0); } }
      /* la riva, la strada */
      g.maskOn(); g.poly([[0, 71], [92, 71], [120, 78], [176, 96], [214, 124], [228, 149], [0, 149]], night ? 3 : 0); g.keyline(16);
      g.poly([[74, 72], [84, 72], [162, 149], [28, 149]], night ? 12 : 5); g.line(74, 72, 28, 149, 16); g.line(84, 72, 162, 149, 16);
      g.line(79, 74, 92, 149, night ? 6 : 0);
      /* il sentiero e la baracca */
      g.maskOn(); g.rect(20, 36, 42, 48, night ? 16 : 12); g.poly([[17, 36], [31, 28], [45, 36]], 16); g.keyline(L);
      g.line(18, 35, 31, 27, 0, 1); g.line(31, 27, 44, 35, 0, 1); g.rect(29, 41, 33, 48, night ? 13 : 16); if (!night) { for (x = 22; x < 42; x += 4) { g.vline(x, 37, 47, 16); } }
      for (i = 0; i < 12; i++) { t = i / 11; g.px(34 + t * 28 + Math.sin(t * 5) * 6, 50 + t * 36, L); g.px(35 + t * 28 + Math.sin(t * 5) * 6, 50 + t * 36, L); }
      /* la villetta della Societa' */
      g.maskOn(); g.rect(138, 96, 182, 120, night ? 13 : 0); g.poly([[134, 96], [160, 84], [186, 96]], night ? 16 : 12); g.rect(170, 82, 175, 92, night ? 13 : 0); g.keyline(16);
      g.line(134, 95, 160, 83, 0, 1); g.line(160, 83, 186, 95, 0, 1);
      g.rect(143, 100, 150, 108, night ? 0 : 11); g.frame(143, 100, 150, 108, 16); g.rect(170, 100, 177, 108, night ? 16 : 11); g.frame(170, 100, 177, 108, 16); g.rect(156, 106, 164, 120, 16);
      g.rect(143, 111, 177, 119, 0); g.frame(143, 111, 177, 119, 16); g.rect(155, 106, 165, 110, night ? 13 : 0); g.text(145, 113, "S.I.M.A.", 16, 1);
      /* i paracarri */
      for (i = 0; i < 6; i++) {
        t = i / 5; t = t * t; x = Math.round(88 + t * 74); y = Math.round(76 + t * 70); s = Math.round(2 + t * 7);
        g.maskOn(); g.rect(x, y - s, x + Math.max(1, Math.round(s / 2)), y, 0); g.keyline(16); g.hline(x, x + Math.max(1, Math.round(s / 2)), y - s, 16); if (s > 4) { g.hline(x, x + Math.round(s / 2), y - s + 1, 16); }
      }
      if (!night) { fumo(g, 172, 80, f, 12, 16); }
      else { g.hline(144, 149, 109, 0); }
    };
  }

  /* ================= LA DIREZIONE LAVORI ================= */
  function direzione(g, f) {
    var i, x, y, a = -PI / 2 + f * PI / 4;
    g.rect(0, 0, 239, 100, 2);
    g.rect(0, 78, 239, 100, 6); g.hline(0, 239, 77, 16);
    g.rect(0, 101, 239, 149, 11); g.hline(0, 239, 100, 16); g.hline(0, 239, 101, 0);
    for (x = -120; x <= 360; x += 24) { g.line(120 + (x - 120) * 0.4, 102, x, 149, 16); }
    /* la finestra grande: la diga */
    g.c = [18, 12, 106, 70];
    g.rect(18, 12, 106, 70, 1); g.ell(40 + (f % 8) * 2, 18, 22, 3, 0); g.ell(90 - (f % 8), 24, 18, 2, 0);
    g.maskOn(); g.poly([[18, 70], [18, 30], [40, 40], [52, 70]], 8); g.poly([[106, 70], [106, 24], [82, 38], [72, 70]], 9); g.keyline(16);
    g.maskOn(); g.poly([[46, 44], [78, 44], [74, 70], [52, 70]], 0); g.keyline(16); g.hline(47, 77, 46, 16); for (x = 53; x < 76; x += 4) { g.vline(x, 50, 70, 6); }
    g.c = null;
    g.frame(17, 11, 107, 71, 0); g.frame(16, 10, 108, 72, 16); g.frame(15, 9, 109, 73, 16);
    g.rect(47, 12, 48, 70, 0); g.vline(46, 12, 70, 16); g.vline(49, 12, 70, 16); g.rect(76, 12, 77, 70, 0); g.vline(75, 12, 70, 16); g.vline(78, 12, 70, 16);
    g.rect(12, 74, 112, 76, 0); g.frame(12, 74, 112, 76, 16);
    /* la fotografia della prima pietra */
    g.rect(190, 16, 228, 46, 16); g.rect(193, 19, 225, 43, 3); g.frame(193, 19, 225, 43, 0);
    for (i = 0; i < 5; i++) { x = 198 + i * 6; g.ell(x, 30, 2, 2, 16); g.rect(x - 2, 33, x + 2, 41, 16); g.hline(x - 3, x + 3, 28, 16); }
    g.px(209, 18, 0); g.line(196, 12, 209, 8, 16); g.line(222, 12, 209, 8, 16);
    /* l'orologio */
    g.ell(160, 26, 9, 9, 0); g.ring(160, 26, 9, 9, 16); g.ring(160, 26, 8, 8, 16); g.line(160, 26, 160 + Math.round(6 * Math.cos(a)), 26 + Math.round(6 * Math.sin(a)), 16); g.line(160, 26, 163, 23, 16, 1);
    /* la scrivania col fascicolo */
    g.maskOn(); g.rect(156, 100, 238, 104, 0); g.rect(160, 105, 236, 138, 6); g.keyline(16);
    g.hline(156, 238, 105, 16); g.frame(166, 110, 196, 122, 16); g.frame(202, 110, 232, 122, 16); g.rect(179, 115, 183, 116, 16); g.rect(215, 115, 219, 116, 16);
    g.maskOn(); g.poly([[172, 95], [200, 94], [202, 99], [174, 100]], 0); g.keyline(16); g.hline(176, 196, 97, 9); g.text(178, 95, "SIMA", 16, 1);
    g.rect(222, 88, 224, 99, 16); g.poly([[214, 88], [232, 88], [228, 81], [218, 81]], 16); g.poly([[216, 89], [230, 89], [234, 99], [212, 99]], 0);
    /* Morandin */
    man(g, 134, 138, 92, { coat: 3, key: 16, face: true, arms: "smoke", f: f });
    g.maskOn(); g.poly([[128, 69], [140, 69], [139, 75], [129, 75]], 0); g.poly([[135, 75], [139, 75], [140, 88], [136, 88]], 0); g.keyline(16);
    /* il plastico sotto vetro, in primo piano */
    g.maskOn(); g.rect(8, 124, 108, 128, 0); g.rect(12, 129, 16, 149, 0); g.rect(100, 129, 104, 149, 0); g.keyline(16);
    g.rect(14, 84, 102, 124, 1);
    g.rect(16, 116, 100, 123, 16);
    g.maskOn(); g.poly([[16, 116], [16, 92], [30, 96], [46, 116]], 14); g.poly([[100, 116], [100, 90], [84, 96], [70, 116]], 14); g.keyline(16);
    g.rect(34, 100, 82, 104, 9);
    g.maskOn(); g.poly([[38, 116], [43, 102], [73, 102], [78, 116]], 0); g.keyline(16); g.arc(58, 103, 15, 3, 0, PI, 16); for (x = 46; x < 74; x += 6) { g.vline(x, 107, 115, 9); }
    g.frame(14, 84, 102, 124, 16); g.frame(13, 83, 103, 125, 16); g.line(18, 88, 28, 88, 0); g.line(18, 88, 18, 98, 0); g.line(88, 88, 98, 98, 0); g.line(92, 88, 98, 94, 0);
  }

  /* ================= LA BARACCA DEL GEOLOGO ================= */
  function baracca(g, f) {
    var i, x, y, j = [0, 1, 0, -1, 2, 0, -1, 0][f % 8], off = (f * 3) % 12;
    g.rect(0, 0, 239, 100, 3); for (x = 8; x < 240; x += 16) { g.vline(x, 0, 100, 16); g.vline(x + 1, 0, 100, 0); }
    for (i = 0; i < 12; i++) { g.px(14 + i * 19, 20 + (i * 37) % 60, 16); g.px(15 + i * 19, 21 + (i * 37) % 60, 16); }
    g.rect(0, 101, 239, 149, 12); g.hline(0, 239, 100, 16); for (y = 108; y < 150; y += 8) { g.hline(0, 239, y, 16); }
    /* la lavagna */
    g.rect(10, 10, 86, 66, 16); g.frame(10, 10, 86, 66, 0); g.frame(9, 9, 87, 67, 16); g.rect(9, 68, 87, 70, 0); g.frame(9, 68, 87, 70, 16);
    g.text(15, 15, "QUOTA", 0, 1); g.text(56, 15, "MM", 0, 1); g.hline(14, 82, 22, 0); g.vline(48, 14, 62, 0);
    g.text(18, 27, "680", 0, 1); g.text(60, 27, "3", 0, 1); g.text(18, 36, "700", 0, 1); g.text(58, 36, "12", 0, 1);
    g.text(18, 45, "710", 0, 1); g.text(58, 45, "35", 0, 1); g.text(18, 54, "715", 0, 1); g.text(60, 54, "?", 0, 1); g.ring(61, 56, 6, 5, 0);
    /* le carte geologiche */
    g.maskOn(); g.rect(100, 8, 166, 60, 0); g.keyline(16); g.px(102, 10, 16); g.px(164, 10, 16);
    for (i = 0; i < 4; i++) { g.arc(120, 38, 16 - i * 4, 12 - i * 3, 0, 2 * PI, 9); }
    g.poly([[136, 20], [162, 16], [162, 54], [140, 56]], "d"); crepa(g, 136, 30, 0.8, 16, 1); g.rect(104, 50, 126, 56, 0); g.frame(104, 50, 126, 56, 16); g.hline(106, 122, 53, 9);
    g.maskOn(); g.poly([[172, 14], [200, 12], [202, 46], [174, 48]], 0); g.keyline(16); for (y = 20; y < 44; y += 4) { g.hline(177, 197, y, 9); } g.line(176, 42, 198, 22, 16);
    /* la stufetta fredda */
    g.rect(214, 0, 218, 60, 16); g.vline(213, 0, 60, 0); g.vline(219, 0, 60, 0);
    g.maskOn(); g.rect(204, 60, 230, 114, 16); g.rect(201, 56, 233, 60, 16); g.rect(206, 114, 209, 122, 16); g.rect(225, 114, 228, 122, 16); g.keyline(0);
    g.frame(210, 76, 224, 92, 0); g.hline(212, 222, 98, 0); g.hline(212, 222, 101, 0); g.px(222, 84, 0);
    /* il tavolo, col cassetto forzato */
    g.maskOn(); g.rect(22, 100, 192, 105, 0); g.rect(28, 106, 33, 149, 0); g.rect(181, 106, 186, 149, 0); g.rect(34, 106, 180, 122, 4); g.keyline(16);
    g.hline(22, 192, 106, 16); g.frame(126, 109, 172, 120, 16); g.rect(146, 114, 152, 115, 16);
    g.maskOn(); g.poly([[52, 109], [100, 111], [100, 127], [50, 124]], 0); g.keyline(16); g.rect(54, 112, 97, 122, 16);
    g.line(72, 109, 68, 104, 16); g.line(76, 110, 79, 105, 16); g.line(80, 110, 84, 107, 16); g.rect(73, 110, 79, 112, 0); g.px(76, 111, 16);
    /* la custodia degli occhiali */
    g.maskOn(); g.rect(40, 92, 72, 99, 16); g.poly([[40, 92], [72, 92], [70, 84], [42, 84]], 13); g.keyline(0);
    g.ring(50, 95, 4, 3, 0); g.ring(62, 95, 4, 3, 0); g.hline(54, 58, 94, 0);
    /* il sismografo: il tamburo gira, il pennino trema */
    g.maskOn(); g.rect(104, 94, 174, 99, 16); g.rect(108, 74, 112, 94, 16); g.rect(164, 74, 168, 94, 16); g.keyline(0);
    g.maskOn(); g.rect(114, 72, 162, 92, 0); g.ell(114, 82, 3, 10, 0); g.ell(162, 82, 3, 10, 0); g.keyline(16);
    g.arc(162, 82, 3, 10, -PI / 2, PI / 2, 16);
    for (x = 116; x < 160; x++) { y = 82; if ((x + off) % 12 === 6) { y = 82 - 6; } else if ((x + off) % 12 === 7) { y = 82 + 4; } else if ((x + off) % 12 === 5) { y = 82 - 1; } g.px(x, y, 16); if (y !== 82) { g.vline(x, Math.min(y, 82), Math.max(y, 82), 16); } }
    for (x = 118; x < 160; x += 8) { g.px(x, 74, 9); g.px(x, 90, 9); }
    g.line(182, 66, 160, 82 + j, 16); g.rect(180, 62, 186, 70, 16); g.frame(180, 62, 186, 70, 0); g.rect(182, 70, 184, 99, 16); g.px(159, 82 + j, 16); g.px(159, 83 + j, 16);
  }

  /* ================= IL CORONAMENTO DELLA DIGA ================= */
  function diga(mode) {
    return function (g, f) {
      var night = mode !== "giorno", morto = mode === "morto", L = night ? 0 : 16, i, x, y, t, s;
      g.rect(0, 0, 239, 149, night ? 16 : 2);
      if (!night) { nuvole(g, f, 0); } else if (!morto) { stars(g, f, 0, 239, 2, 40, 40); }
      /* la gola, a destra */
      g.poly([[139, 44], [239, 44], [239, 149], [222, 149], [222, 118]], night ? 16 : 12);
      if (!night) { for (i = 0; i < 9; i++) { x = 150 + i * 11; g.line(x, 46 + i * 8, x + 4, 149, 16); } }
      g.maskOn(); g.poly([[176, 44], [200, 16], [239, 0], [239, 96], [214, 70]], night ? 16 : 7); g.keyline(L);
      if (!night) { g.line(210, 30, 222, 70, 16); g.line(226, 20, 232, 80, 16); }
      /* il lago, a sinistra, e la Marcia */
      g.maskOn(); g.poly([[0, 52], [0, 18], [40, 8], [78, 22], [108, 40], [118, 52]], night ? 16 : 8); g.keyline(L);
      if (!night) { crepa(g, 22, 28, 1.6, 16, 1); crepa(g, 22, 30, 1.6, 0, 0); } else { crepa(g, 22, 28, 1.6, 7, 0); }
      g.poly([[0, 53], [118, 53], [121, 46], [40, 122], [40, 149], [0, 149]], night ? 16 : 10); g.hline(0, 118, 52, L);
      g.c = [0, 53, 100, 149]; waves(g, f, 0, 110, 53, 149); g.c = null;
      /* la spalla di roccia, in fondo, col portello del cunicolo */
      g.maskOn(); g.poly([[100, 52], [108, 24], [128, 10], [156, 14], [176, 34], [172, 52]], night ? 15 : 13); g.keyline(L);
      if (!night) { g.line(116, 28, 112, 46, 16); g.line(150, 20, 160, 44, 16); }
      g.rect(126, 37, 134, 50, 16); g.frame(126, 37, 134, 50, 0); g.hline(127, 133, 43, 0); g.px(132, 45, 0);
      /* la strada del coronamento, i parapetti */
      g.poly([[60, 149], [200, 149], [136, 50], [124, 50]], morto ? 0 : (night ? 11 : 3));
      if (!morto) { for (i = 0; i < 7; i++) { t = i / 6; t = t * t; y = 52 + t * 97; g.hline(124 - (y - 50) * 0.646, 136 + (y - 50) * 0.646, y, night ? 14 : 9); } }
      g.maskOn(); g.poly([[40, 149], [40, 122], [121, 44], [124, 50], [60, 149]], night ? 6 : 0); g.poly([[200, 149], [220, 149], [220, 122], [139, 44], [136, 50]], night ? 6 : 0); g.keyline(16);
      g.line(40, 122, 121, 44, 16); g.line(60, 149, 124, 50, 16); g.line(220, 122, 139, 44, 16); g.line(200, 149, 136, 50, 16);
      g.line(44, 124, 122, 47, 0); g.line(216, 124, 138, 47, 0);
      for (i = 1; i < 6; i++) { t = i / 6; t = t * t; y = 50 + t * 99; g.line(40 + (149 - y) * 0.82, y - 27 * t - 4, 60 + (149 - y) * 0.646, y, 16); g.line(220 - (149 - y) * 0.82, y - 27 * t - 4, 200 - (149 - y) * 0.646, y, 16); }
      if (mode === "giorno") {
        /* il casello, Bepi sulla porta */
        g.maskOn(); g.rect(64, 60, 98, 104, 0); g.poly([[60, 60], [81, 48], [102, 60]], 13); g.rect(88, 44, 92, 56, 0); g.keyline(16);
        g.line(60, 59, 81, 47, 0, 1); g.line(81, 47, 102, 59, 0, 1); g.hline(60, 102, 60, 16);
        g.rect(69, 68, 79, 80, 11); g.frame(69, 68, 79, 80, 16); g.vline(74, 68, 80, 16); g.rect(84, 74, 95, 104, 16);
        fumo(g, 90, 42, f, 12, 16);
        man(g, 104, 110, 40, { coat: 16, key: 0, hat: "kepi", face: true, arms: "smoke", f: f });
        /* l'asta idrometrica */
        g.rect(22, 70, 27, 149, 0); g.frame(22, 70, 27, 149, 16); for (y = 74; y < 110; y += 4) { g.hline(23, y % 8 === 2 ? 26 : 24, y, 16); }
        g.rect(0, 112, 39, 149, 10); g.c = [0, 112, 39, 149]; waves(g, f, 0, 39, 112, 149); g.c = null;
      } else if (morto) {
        /* una sola lampada, e le impronte che finiscono al parapetto */
        g.poly([[152, 20], [159, 20], [176, 60], [136, 60]], 11);
        g.vline(155, 12, 86, 0); g.vline(156, 12, 86, 16); g.maskOn(); g.poly([[148, 16], [164, 16], [160, 10], [152, 10]], 16); g.keyline(0); g.rect(153, 17, 158, 19, 0);
        for (i = 0; i < 8; i++) { t = i / 7; x = 150 - t * 68; y = 146 - t * 44; s = 3 - Math.round(t * 2); g.rect(x, y, x + s, y + 1, 16); g.rect(x + 5 - Math.round(t * 2), y - 4, x + 5 - Math.round(t * 2) + s, y - 3, 16); }
        g.rect(72, 96, 76, 97, 16); g.rect(66, 100, 70, 101, 16);
        for (i = 0; i < 6; i++) { g.px(58 + i * 2, 106 - i * 2, 0); }
        g.line(62, 104, 74, 92, 0, 1);
        snow(g, f, 100, 0, 0, 239, 149);
      } else {
        /* la notte del collaudo: riflettori, la commissione, la 1100 */
        for (i = 0; i < 2; i++) {
          x = i ? 196 : 66;
          g.poly([[x - 2, 22], [x + 2, 22], [i ? 150 : 150, 110], [i ? 110 : 80, 110]], 12);
          g.vline(x, 18, 100 - i * 20, 0); g.rect(x - 4, 14, x + 4, 20, 0); g.frame(x - 4, 14, x + 4, 20, 16); g.rect(x - 2, 16, x + 2, 18, f % 4 === 3 && i ? 9 : 0);
        }
        man(g, 112, 98, 30, { coat: 16, key: 0 }); man(g, 124, 96, 30, { coat: 16, key: 0, arms: "smoke", f: f }); man(g, 137, 98, 30, { coat: 16, key: 0 });
        man(g, 152, 108, 38, { coat: 3, key: 16, face: true });
        g.rect(150, 81, 154, 84, 0);
        /* l'asta idrometrica, l'acqua al segno */
        g.rect(0, 96 - (f % 4 === 0 ? 0 : 1), 39, 149, 16);
        g.rect(20, 56, 27, 149, 0); g.frame(20, 56, 27, 149, 16); for (y = 60; y < 100; y += 4) { g.hline(21, y % 8 === 4 ? 26 : 23, y, 16); }
        g.rect(28, 74, 39, 82, 16); g.text(29, 76, "715", 0, 1); g.hline(18, 28, 76, 0); g.hline(20, 27, 76, 16);
        g.rect(0, 98, 39, 149, 16); g.c = [0, 98, 39, 149]; waves(g, f, 0, 39, 98, 149); g.c = null; g.hline(0, 39, 98, 0);
        /* la Fiat 1100 nera */
        g.maskOn(); g.poly([[128, 136], [132, 124], [146, 122], [154, 112], [182, 112], [190, 124], [198, 127], [198, 138], [128, 138]], 16); g.ell(144, 139, 7, 7, 16); g.ell(184, 139, 7, 7, 16); g.keyline(0);
        g.poly([[156, 115], [167, 115], [167, 122], [150, 122]], 9); g.poly([[170, 115], [180, 115], [186, 122], [170, 122]], 9);
        g.ell(144, 139, 3, 3, 9); g.ell(184, 139, 3, 3, 9); g.hline(130, 196, 130, 0); g.rect(129, 126, 131, 128, 0);
      }
    };
  }

  /* ================= IL CUNICOLO D'ISPEZIONE ================= */
  function cunicolo(g, f) {
    var i, k, x, y, sw = [0, 2, 3, 2, 0, -2, -3, -2][f % 8], cx = 120, cy = 72, hw, top, bot, fl = f % 3;
    g.rect(0, 0, 239, 149, 16);
    /* la luce della lampada a carburo */
    g.ell(104, 92, 104, 66, 14); g.ell(100, 96, 80, 50, 11); g.ell(96, 100, 56, 36, 7); g.ell(92, 106, 32, 22, 4);
    /* la galleria: centine che si allontanano */
    for (k = 0; k < 6; k++) {
      i = [1, 0.7, 0.48, 0.32, 0.2, 0.12][k]; hw = 112 * i; top = cy - 62 * i; bot = cy + 74 * i;
      g.arc(cx, top + 26 * i, hw, 36 * i, PI, 2 * PI, k < 2 ? 0 : 16); g.arc(cx, top + 26 * i + 1, hw, 36 * i, PI, 2 * PI, 16);
      g.vline(cx - hw, top + 26 * i, bot, k < 2 ? 0 : 16); g.vline(cx + hw, top + 26 * i, bot, k < 2 ? 0 : 16); g.vline(cx - hw + 1, top + 26 * i, bot, 16); g.vline(cx + hw - 1, top + 26 * i, bot, 16);
      g.hline(cx - hw, cx + hw, bot, 16);
    }
    g.ell(cx, cy + 2, 11, 12, 16);
    g.line(cx - 112, 146, cx - 13, 81, 16); g.line(cx + 112, 146, cx + 13, 81, 16); g.line(cx - 40, 149, cx - 4, 82, 16); g.line(cx + 40, 149, cx + 4, 82, 16);
    for (i = 0; i < 6; i++) { y = 92 + i * i * 2.2; g.hline(cx - (y - 72) * 0.5, cx + (y - 72) * 0.5, y, 16); }
    /* la crepa e le spie di vetro, spezzate */
    g.pline([[30, 14], [36, 34], [30, 52], [40, 74], [34, 96], [42, 120]], 16, 1); g.pline([[36, 34], [46, 40]], 16); g.pline([[40, 74], [50, 70]], 16);
    for (i = 0; i < 3; i++) {
      x = [33, 35, 37][i]; y = [42, 64, 106][i];
      g.maskOn(); g.rect(x - 9, y - 2, x - 2, y + 1, 0); g.rect(x + 2, y - 1, x + 9, y + 2, 0); g.keyline(16); g.line(x - 2, y - 2, x, y + 1, 16);
    }
    g.text(12, 50, "II", 16, 1);
    /* gocce */
    for (i = 0; i < 4; i++) { x = [70, 152, 186, 206][i]; y = 20 + ((f * 9 + i * 23) % 100); g.px(x, y, i < 1 ? 16 : 0); g.px(x, y + 1, i < 1 ? 16 : 0); }
    g.ell(186, 134, 9, 2, 9); if (f % 4 === 1) { g.ring(186, 134, 5, 1, 0); }
    /* il pendolo: il filo, il peso, la vaschetta */
    g.line(166, 0, 166 + sw, 104, 0); g.line(167, 0, 167 + sw, 104, 16);
    g.maskOn(); g.poly([[162 + sw, 104], [171 + sw, 104], [169 + sw, 116], [166 + sw, 121], [164 + sw, 116]], 0); g.keyline(16);
    g.maskOn(); g.rect(148, 122, 186, 128, 0); g.rect(152, 129, 155, 140, 0); g.rect(179, 129, 182, 140, 0); g.keyline(16);
    for (x = 150; x < 186; x += 4) { g.vline(x, 122, x % 8 === 2 ? 125 : 123, 16); } g.vline(166, 122, 127, 16);
    /* la lampada posata a terra */
    g.maskOn(); g.rect(84, 122, 96, 138, 0); g.rect(87, 118, 93, 122, 0); g.ell(98, 116, 6, 6, 0); g.keyline(16);
    g.hline(84, 96, 130, 16); g.ring(98, 116, 3, 3, 16); g.arc(90, 112, 6, 8, PI, 2 * PI, 16);
    g.px(104 + (fl === 1 ? 1 : 0), 115, 0); g.px(105, 116, 0); g.px(105 + (fl === 2 ? 1 : 0), 114, 0); g.px(106, 115 - (fl ? 1 : 0), 0);
  }

  /* ================= IL CENTRALINO ================= */
  var TARGHE = ["MILANO", "GIORNALE", "DIGA", "CANONICA"];
  function centralino(g, f) {
    var r, i, x, y, a = -PI / 2 - 0.5 + (f % 8) * 0.012, on;
    g.rect(0, 0, 239, 149, 13);
    for (y = 6; y < 150; y += 12) { for (x = ((y / 12) % 2 > 0.5 ? 6 : 0); x < 240; x += 12) { g.px(x, y, 16); } }
    g.poly([[86, 0], [114, 0], [176, 122], [24, 122]], 9);
    /* il mobile */
    g.maskOn(); g.rect(24, 8, 176, 122, 16); g.rect(18, 96, 182, 104, 16); g.rect(28, 123, 34, 149, 16); g.rect(166, 123, 172, 149, 16); g.keyline(0);
    g.frame(28, 12, 172, 92, 0);
    for (r = 0; r < 4; r++) {
      for (i = 0; i < 8; i++) {
        x = 42 + i * 17; y = 26 + r * 17; on = (r === 1 && i === 5 && f % 2 === 0);
        g.ring(x, y, 4, 4, 0); g.px(x, y, 0);
        g.rect(x - 1, y - 9, x + 1, y - 7, on ? 0 : 9); if (on) { g.px(x - 3, y - 8, 0); g.px(x + 3, y - 8, 0); g.px(x, y - 11, 0); }
      }
    }
    /* le spine in fila, i cordoni */
    for (i = 0; i < 8; i++) { x = 46 + i * 16; if (i !== 2 && i !== 6) { g.rect(x, 88, x + 2, 95, 0); g.px(x + 1, 86, 0); g.px(x + 1, 87, 0); } }
    g.pline([[79, 96], [84, 110], [76, 118], [70, 100], [74, 62], [76, 47]], 0, 1); g.rect(75, 40, 77, 47, 0);
    g.pline([[143, 96], [150, 112], [158, 104], [150, 70], [145, 30]], 0, 1); g.rect(144, 23, 146, 30, 0);
    g.hline(18, 182, 96, 0); g.rect(36, 108, 60, 116, 0); g.text(39, 110, "PIEVE", 16, 1);
    for (i = 0; i < 4; i++) { g.rect(88 + i * 18, 108, 98 + i * 18, 111, 0); g.rect(92 + i * 18, 112, 94 + i * 18, 116, 0); }
    /* la cuffia, appesa */
    g.rect(205, 60, 207, 62, 0); g.line(206, 62, 206, 66, 0);
    g.arc(206, 80, 12, 14, PI, 2 * PI, 0); g.arc(206, 80, 11, 13, PI, 2 * PI, 0);
    g.maskOn(); g.ell(194, 82, 4, 6, 0); g.ell(218, 82, 4, 6, 0); g.keyline(16);
    g.pline([[194, 88], [192, 98], [198, 104]], 0); g.maskOn(); g.poly([[197, 101], [206, 100], [208, 110], [199, 108]], 0); g.keyline(16);
    g.pline([[218, 88], [222, 104], [214, 122], [190, 126], [182, 104]], 0);
    /* l'orologio: quasi mezzanotte */
    g.ell(208, 28, 15, 15, 0); g.ring(208, 28, 15, 15, 16); g.ring(208, 28, 14, 14, 16);
    for (i = 0; i < 12; i++) { g.px(208 + 12 * Math.cos(i * PI / 6), 28 + 12 * Math.sin(i * PI / 6), 16); }
    g.line(208, 28, 208 + Math.round(10 * Math.cos(a)), 28 + Math.round(10 * Math.sin(a)), 16); g.line(208, 28, 207, 21, 16, 1);
    g.px(208 + Math.round(11 * Math.cos(f * PI / 4)), 28 + Math.round(11 * Math.sin(f * PI / 4)), 0);
    /* lo sgabello */
    g.maskOn(); g.ell(100, 134, 20, 4, 6); g.rect(86, 136, 88, 149, 6); g.rect(112, 136, 114, 149, 6); g.keyline(16);
  }
  /* primo piano del quadro: il cordone nella presa scelta */
  function tx(n) {
    return function (g, f) {
      var i, x, on = f % 2 === 0, cx = 31 + n * 59, w;
      g.rect(0, 0, 239, 149, 16);
      for (i = 0; i < 6; i++) { g.px(6 + i * 45, 6, 9); g.px(6 + i * 45, 104, 9); }
      g.frame(3, 3, 236, 108, 9);
      for (i = 0; i < 4; i++) {
        x = 31 + i * 59;
        /* lampadina */
        if (i === n && on) { g.ell(x, 17, 11, 11, 12); g.ell(x, 17, 8, 8, 6); g.ell(x, 17, 5, 5, 0); g.px(x - 14, 17, 0); g.px(x + 14, 17, 0); g.px(x - 10, 7, 0); g.px(x + 10, 7, 0); g.px(x - 10, 27, 0); g.px(x + 10, 27, 0); }
        else { g.ell(x, 17, 5, 5, i === n ? 9 : 12); g.ring(x, 17, 5, 5, 0); g.px(x - 2, 15, 0); }
        /* targhetta */
        w = TARGHE[i].length * 4 - 1;
        g.rect(x - 22, 34, x + 22, 48, 0); g.frame(x - 22, 34, x + 22, 48, 16); g.frame(x - 23, 33, x + 23, 49, 0); g.px(x - 20, 41, 16); g.px(x + 20, 41, 16);
        g.text(x - Math.floor(w / 2), 39, TARGHE[i], 16, 1);
        /* presa */
        g.ell(x, 70, 10, 10, 9); g.ring(x, 70, 10, 10, 0); g.ring(x, 70, 9, 9, 0); g.ell(x, 70, 5, 5, 16); g.ring(x, 70, 5, 5, 0);
      }
      g.rect(0, 112, 239, 149, 13); g.hline(0, 239, 111, 0); g.hline(0, 239, 112, 16);
      /* le altre spine, a riposo */
      for (i = 0; i < 4; i++) { if (i !== n) { x = 31 + i * 59; g.maskOn(); g.rect(x - 3, 122, x + 3, 142, 0); g.rect(x - 1, 114, x + 1, 122, 0); g.keyline(16); g.hline(x - 3, x + 3, 128, 16); } }
      /* la spina infilata, il cordone, la mano di Ada */
      g.maskOn(); g.rect(cx - 4, 72, cx + 4, 90, 0); g.rect(cx - 3, 66, cx + 3, 72, 0); g.keyline(16); g.hline(cx - 4, cx + 4, 78, 16); g.hline(cx - 4, cx + 4, 81, 16);
      g.pline([[cx, 91], [cx - 3, 106], [cx - 9 + (f % 4 < 2 ? 0 : 1), 128], [cx - 5, 149]], 0, 1); g.pline([[cx + 2, 91], [cx - 1, 106], [cx - 7 + (f % 4 < 2 ? 0 : 1), 128], [cx - 3, 149]], 16);
      g.maskOn(); g.poly([[cx + 18, 149], [cx + 62, 149], [cx + 62, 124], [cx + 30, 98], [cx + 18, 106]], 3); g.keyline(16);
      g.line(cx + 24, 110, cx + 52, 136, 16); g.rect(cx + 36, 120, cx + 38, 122, 16);
      g.maskOn(); g.ell(cx + 15, 86, 9, 8, 0); g.ell(cx + 6, 78, 6, 3, 0); g.ell(cx + 6, 84, 7, 3, 0); g.ell(cx + 7, 90, 6, 3, 0); g.poly([[cx + 13, 92], [cx + 23, 82], [cx + 31, 98], [cx + 19, 106]], 0); g.keyline(16);
      g.hline(cx + 3, cx + 11, 81, 16); g.hline(cx + 3, cx + 11, 87, 16); g.line(cx + 18, 104, cx + 30, 98, 16);
    };
  }

  Pix.add({
    fermata: { w: W, h: H, n: 8, draw: fermata(true) },
    fermataGiorno: { w: W, h: H, n: 8, draw: fermata(false) },
    pieve: { w: W, h: H, n: 8, draw: pieve(true) },
    pieveGiorno: { w: W, h: H, n: 8, draw: pieve(false) },
    osteria: { w: W, h: H, n: 12, draw: osteria(false) },
    osteriaNotte: { w: W, h: H, n: 8, draw: osteria(true) },
    camera3: { w: W, h: H, n: 8, draw: camera3(true) },
    camera3Giorno: { w: W, h: H, n: 8, draw: camera3(false) },
    chiesa: { w: W, h: H, n: 6, draw: chiesa },
    lago: { w: W, h: H, n: 8, draw: lago(true) },
    lagoGiorno: { w: W, h: H, n: 8, draw: lago(false) },
    direzione: { w: W, h: H, n: 8, draw: direzione },
    baracca: { w: W, h: H, n: 8, draw: baracca },
    diga: { w: W, h: H, n: 8, draw: diga("giorno") },
    digaNotte: { w: W, h: H, n: 8, draw: diga("notte") },
    digaMorto: { w: W, h: H, n: 8, draw: diga("morto") },
    cunicolo: { w: W, h: H, n: 8, draw: cunicolo },
    centralino: { w: W, h: H, n: 8, draw: centralino },
    tx_milano: { w: W, h: H, n: 6, draw: tx(0) },
    tx_giornale: { w: W, h: H, n: 6, draw: tx(1) },
    tx_diga: { w: W, h: H, n: 6, draw: tx(2) },
    tx_paese: { w: W, h: H, n: 6, draw: tx(3) }
  });
})();
