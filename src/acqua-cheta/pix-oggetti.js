/* ==================================================================
   ACQUA CHETA: le tavolette degli oggetti e i ritratti, 120x75, ferme.
   La libreria di disegno sta in src/gfx.js. L'ordine di OBJN da' il
   numero del reperto sul cartellino.
   ================================================================== */
(function () {
  var K = Pix.kit, PI = K.PI, h1 = K.h1, smoke = K.smoke, man = K.man, plate = K.plate, carve = K.carve, shadow = K.shadow, bust = K.bust;
  var OBJ = {};

  /* scrittura a mano: una riga ondulata con qualche stacco */
  function hand(g, x0, x1, y, t) { for (var x = x0; x <= x1; x++) { if (x % 9 !== 0) { g.px(x, y + Math.round(1.4 * Math.sin(x * 1.1)), t); } } }

  OBJ.lettera = plate("LETTERA DI INCARICO", 5, function (g) {
    var y;
    g.rect(31, 6, 95, 65, 13); g.rect(28, 3, 92, 65, 0); g.frame(28, 3, 92, 65, 16);
    g.rect(28, 3, 92, 17, 16); g.text(42, 5, "LA VIGILE", 0, 1); g.text(34, 11, "ASSICURAZIONI", 0, 1);
    for (y = 22; y < 38; y += 4) { g.hline(33, 87 - (y % 3) * 7, y, 9); }
    g.text(33, 41, "CORVI ADA", 16, 1); g.text(33, 48, "PERITO", 16, 1);
    g.ring(78, 51, 9, 9, 16); g.ring(78, 51, 7, 7, 16); g.text(75, 49, "LV", 16, 1);
    g.pline([[33, 60], [38, 56], [41, 61], [46, 56], [50, 60], [60, 58]], 16);
  });

  OBJ.sigarette = plate("NAZIONALI", 3, function (g) {
    shadow(g, 18, 62, 58); shadow(g, 72, 104, 56);
    g.maskOn(); g.poly([[30, 20], [35, 19], [32, 5], [27, 6]], 0); g.keyline(16); g.line(28, 10, 33, 9, 9);
    g.maskOn(); g.poly([[16, 22], [56, 16], [62, 50], [20, 57]], 0); g.keyline(16);
    g.poly([[17, 30], [58, 24], [59, 35], [18, 41]], 16); g.text(20, 31, "NAZIONALI", 0, 1);
    g.line(24, 22, 28, 30, 9); g.line(46, 18, 44, 25, 9); g.line(26, 42, 32, 55, 9); g.line(50, 37, 46, 52, 9); g.line(52, 40, 60, 47, 9);
    g.poly([[40, 17], [56, 16], [57, 21]], 9); g.line(40, 17, 57, 21, 16);
    g.maskOn(); g.rect(72, 40, 104, 54, 6); g.rect(96, 35, 104, 40, 10); g.keyline(16);
    g.vline(94, 40, 54, 16); g.hline(73, 93, 42, 0); g.ell(99, 35, 3, 3, 13); g.ring(99, 35, 3, 3, 16);
  });

  OBJ.chiave = plate("CHIAVE CAMERA 3", 3, function (g) {
    var y;
    shadow(g, 14, 70, 34);
    g.maskOn(); g.ell(22, 22, 9, 9, 6); g.rect(30, 20, 70, 24, 6); g.rect(60, 24, 64, 32, 6); g.rect(66, 24, 69, 30, 6); g.keyline(16);
    g.ell(22, 22, 4, 4, 3); g.ring(22, 22, 4, 4, 16); g.hline(31, 69, 21, 0);
    g.pline([[20, 25], [26, 38], [44, 45], [62, 46]], 16);
    g.poly([[59, 41], [65, 35], [109, 35], [109, 63], [65, 63], [59, 57]], 13);
    g.maskOn(); g.poly([[56, 38], [62, 32], [106, 32], [106, 60], [62, 60], [56, 54]], 2); g.keyline(16);
    for (y = 35; y < 60; y += 4) { g.hline(66, 70, y, 9); g.hline(98, 104, y, 9); }
    g.ell(62, 46, 2, 2, 16);
    g.rect(72, 34, 96, 58, 0); g.frame(72, 34, 96, 58, 16); g.text(78, 36, "3", 16, 4);
  });

  OBJ.chiavetta = plate("CHIAVE DEL LUCCHETTO", 9, function (g) {
    g.rect(17, 21, 107, 62, 14);
    g.maskOn(); g.poly([[14, 18], [26, 13], [36, 19], [48, 12], [60, 18], [72, 12], [84, 19], [96, 13], [104, 17], [104, 59], [14, 59]], 0); g.keyline(16);
    g.line(14, 59, 58, 34, 9); g.line(104, 59, 60, 34, 9);
    g.rect(48, 44, 92, 47, 9);
    g.maskOn(); g.ell(48, 38, 8, 8, 12); g.rect(55, 36, 90, 40, 12); g.rect(76, 40, 79, 45, 12); g.rect(83, 40, 87, 47, 12); g.keyline(16);
    g.ell(48, 38, 3, 3, 0); g.ring(48, 38, 3, 3, 16); g.hline(56, 89, 37, 0);
  });

  OBJ.occhiali = plate("GLI OCCHIALI DI MALAN", 4, function (g) {
    var i, cx;
    g.maskOn(); g.rect(20, 5, 100, 27, 13); g.ell(20, 16, 4, 11, 13); g.ell(100, 16, 4, 11, 13); g.keyline(16);
    g.rect(22, 8, 98, 24, "d"); g.frame(22, 8, 98, 24, 16);
    g.maskOn(); g.rect(20, 31, 100, 61, 16); g.ell(20, 46, 4, 15, 16); g.ell(100, 46, 4, 15, 16); g.keyline(0);
    g.hline(22, 98, 29, 16); g.rect(56, 27, 64, 30, 16);
    g.line(34, 50, 60, 58, 9); g.line(86, 50, 60, 58, 9);
    for (i = 0; i < 2; i++) {
      cx = 45 + i * 30;
      g.ell(cx, 45, 11, 11, 4); g.ring(cx, 45, 11, 11, 0); g.ring(cx, 45, 10, 10, 0); g.ring(cx, 45, 7, 7, 10);
      g.line(cx - 5, 41, cx - 1, 38, 0); g.line(cx - 6, 44, cx - 5, 43, 0);
    }
    g.arc(60, 44, 5, 4, PI, 2 * PI, 0); g.arc(60, 45, 5, 4, PI, 2 * PI, 0);
    g.rect(31, 42, 33, 48, 0); g.rect(87, 42, 89, 48, 0);
  });

  OBJ.chiavi = plate("LE CHIAVI DI BEPI", 3, function (g) {
    g.ring(38, 16, 12, 12, 16); g.ring(38, 16, 11, 11, 16); g.ring(38, 16, 13, 13, 9);
    g.maskOn(); g.ell(25, 31, 5, 5, 13); g.line(23, 35, 15, 60, 13, 1); g.line(24, 35, 16, 60, 13, 1); g.rect(17, 51, 22, 54, 13); g.rect(15, 57, 21, 60, 13); g.keyline(0);
    g.ell(25, 31, 2, 2, 3);
    g.maskOn(); g.ell(50, 30, 5, 5, 9); g.line(52, 34, 62, 58, 9, 1); g.line(53, 34, 63, 58, 9, 1); g.rect(63, 50, 68, 53, 9); g.rect(65, 56, 69, 59, 9); g.keyline(16);
    g.ell(50, 30, 2, 2, 3);
    g.maskOn(); g.ell(38, 34, 6, 6, 16); g.rect(37, 39, 40, 63, 16); g.rect(40, 52, 45, 55, 16); g.rect(40, 58, 44, 62, 16); g.keyline(0);
    g.ell(38, 34, 2, 2, 3);
    g.line(49, 20, 72, 30, 16);
    g.poly([[68, 31], [74, 26], [116, 26], [116, 42], [74, 42]], 12);
    g.maskOn(); g.poly([[66, 29], [72, 24], [114, 24], [114, 40], [72, 40]], 0); g.keyline(16);
    g.ell(73, 31, 1, 1, 16); g.text(78, 30, "CUNICOLO", 16, 1);
  });

  OBJ.lampada = plate("LAMPADA A CARBURO", 14, function (g) {
    g.ell(94, 34, 22, 20, 11); g.ell(94, 34, 14, 12, 7); g.ell(94, 34, 7, 6, 3);
    g.arc(58, 10, 9, 8, PI, 2 * PI, 0); g.arc(58, 11, 9, 8, PI, 2 * PI, 0);
    g.maskOn(); g.rect(54, 10, 62, 14, 6); g.rect(48, 14, 68, 28, 6); g.rect(45, 28, 71, 61, 1); g.ell(58, 61, 13, 3, 1); g.rect(71, 33, 81, 37, 1); g.keyline(16);
    g.hline(45, 71, 28, 16); g.hline(45, 71, 29, 16); g.hline(45, 71, 45, 16); g.rect(64, 31, 69, 60, 8); g.vline(63, 31, 60, 4);
    g.rect(63, 15, 66, 27, 10); g.ell(58, 9, 3, 2, 0); g.ring(58, 9, 3, 2, 16);
    g.maskOn(); g.ell(84, 35, 4, 14, 0); g.keyline(16); g.ell(85, 35, 2, 10, 8);
    g.rect(86, 34, 89, 36, 16);
    g.poly([[90, 35], [96, 28], [100, 34], [95, 40]], 0); g.px(101, 33, 0);
  });

  OBJ.relazione = plate("LA RELAZIONE MALAN", 8, function (g) {
    var y, x;
    g.rect(27, 11, 112, 62, 14);
    g.maskOn(); g.rect(24, 8, 108, 59, 0); g.keyline(16);
    g.rect(103, 9, 107, 58, 4); g.vline(102, 9, 58, 9);
    g.maskOn(); g.rect(13, 6, 27, 61, 2); g.ell(20, 6, 7, 2, 2); g.ell(20, 61, 7, 2, 2); g.keyline(16);
    g.vline(16, 8, 60, 9); g.vline(24, 8, 60, 6); g.ring(20, 6, 4, 1, 16); g.px(20, 6, 16);
    g.vline(36, 13, 48, 16); g.hline(36, 98, 48, 16);
    for (x = 44; x < 98; x += 8) { g.px(x, 49, 16); } for (y = 16; y < 48; y += 8) { g.px(35, y, 16); }
    g.pline([[36, 46], [50, 45], [62, 42], [72, 37], [80, 29], [86, 20], [90, 12]], 16, 1);
    for (y = 14; y < 48; y += 3) { g.px(87, y, 16); }
    g.text(48, 52, "QUOTA 715", 16, 1);
  });

  OBJ.telefono = plate("CABINA TELEFONICA", 9, function (g) {
    var x;
    g.maskOn(); g.rect(34, 1, 86, 65, 13); g.keyline(16);
    g.rect(40, 4, 80, 12, 0); g.frame(40, 4, 80, 12, 16); g.text(45, 6, "TELEFONO", 16, 1);
    g.rect(42, 16, 78, 47, 2); g.frame(42, 16, 78, 47, 0); g.frame(41, 15, 79, 48, 16);
    g.rect(53, 20, 69, 43, 16); g.ring(61, 30, 5, 5, 0); g.ell(61, 30, 2, 2, 0); g.px(61, 30, 16); g.rect(57, 38, 65, 40, 0);
    g.rect(47, 22, 49, 37, 16); g.rect(46, 20, 51, 23, 16); g.rect(46, 36, 51, 39, 16); g.pline([[48, 39], [49, 44], [54, 45], [56, 43]], 16);
    g.line(70, 18, 76, 24, 0); g.line(72, 18, 76, 22, 0);
    g.frame(42, 51, 78, 65, 0); for (x = 45; x < 77; x += 4) { g.vline(x, 53, 65, 16); }
    g.rect(80, 32, 82, 42, 0); g.frame(79, 31, 83, 43, 16);
  });

  OBJ.banco = plate("LA LICENZA", 6, function (g) {
    g.px(60, 1, 16); g.px(60, 2, 16); g.line(60, 2, 40, 5, 16); g.line(60, 2, 80, 5, 16);
    g.rect(16, 7, 108, 65, 14);
    g.rect(13, 5, 107, 63, 16); g.rect(16, 8, 104, 60, 9); g.rect(19, 11, 101, 57, 0); g.frame(19, 11, 101, 57, 16);
    g.text(46, 14, "LICENZA", 16, 1); g.hline(30, 90, 21, 16);
    g.text(32, 25, "DAL MOLIN OLGA", 16, 1); g.text(28, 34, "POSTO TELEFONICO", 16, 1); g.text(44, 41, "PUBBLICO", 16, 1);
    g.hline(24, 62, 51, 9); g.hline(24, 54, 54, 9);
    g.ring(86, 50, 5, 5, 16); g.ring(86, 50, 3, 3, 9);
  });

  OBJ.minestra = plate("MINESTRA DI ORZO", 13, function (g) {
    var i;
    g.rect(0, 46, 119, 65, 15); g.hline(0, 119, 46, 9);
    g.ell(54, 58, 30, 5, 16);
    g.maskOn(); g.line(64, 34, 86, 12, 0, 1); g.line(65, 35, 87, 13, 0, 1); g.keyline(16);
    g.maskOn(); g.poly([[26, 36], [78, 36], [69, 55], [35, 55]], 0); g.ell(52, 36, 26, 8, 0); g.ell(52, 55, 17, 3, 0); g.keyline(16);
    g.ell(52, 36, 22, 6, 10); g.ring(52, 36, 26, 8, 16);
    for (i = 0; i < 14; i++) { g.px(34 + Math.floor(h1(i) * 36), 33 + Math.floor(h1(i + 20) * 7), 0); }
    g.line(32, 44, 36, 52, 9); g.line(72, 44, 68, 52, 6);
    smoke(g, 42, 27, 0, 22); smoke(g, 52, 25, 2, 22); smoke(g, 60, 27, 5, 20);
    g.maskOn(); g.poly([[84, 44], [94, 38], [108, 40], [113, 50], [106, 58], [90, 58]], 4); g.keyline(16);
    g.poly([[94, 38], [108, 40], [113, 50], [106, 46], [96, 44]], 12);
    for (i = 0; i < 8; i++) { g.px(88 + Math.floor(h1(i + 5) * 18), 48 + Math.floor(h1(i + 30) * 8), 16); }
  });

  OBJ.macchina = plate("LA MACCHINA DI VESCOVI", 4, function (g) {
    var r, x, y;
    shadow(g, 20, 100, 63);
    g.maskOn(); g.rect(40, 3, 80, 33, 0); g.keyline(16);
    g.text(46, 7, "LA DIGA", 16, 1); for (y = 15; y < 28; y += 4) { g.hline(44, 76 - (y % 3) * 5, y, 9); }
    g.line(18, 30, 9, 22, 16, 1); g.ell(9, 21, 2, 2, 16);
    g.maskOn(); g.rect(18, 29, 102, 35, 16); g.ell(16, 32, 3, 4, 16); g.ell(104, 32, 3, 4, 16); g.keyline(0);
    g.hline(20, 100, 31, 0); g.rect(38, 33, 82, 34, 9);
    g.maskOn(); g.poly([[26, 36], [94, 36], [102, 63], [18, 63]], 16); g.keyline(0);
    g.arc(60, 39, 16, 6, 0, PI, 0); for (x = 48; x <= 72; x += 3) { g.line(x, 43 - Math.abs(x - 60) / 4, 60 + (x - 60) * 0.3, 39, 9); }
    for (r = 0; r < 3; r++) { y = 50 + r * 4; for (x = 28 - r * 2 + (r % 2) * 3; x <= 90 + r * 2; x += 6) { g.rect(x, y, x + 2, y + 1, 0); } }
    g.rect(44, 62, 76, 63, 0);
  });

  OBJ.stufa = plate("STUFA DI MAIOLICA", 7, function (g) {
    var x, y;
    g.rect(0, 60, 119, 65, 12); g.hline(0, 119, 59, 16);
    g.rect(57, 0, 63, 4, 16);
    g.maskOn(); g.rect(41, 3, 79, 7, 0); g.rect(45, 7, 75, 27, 0); g.rect(39, 27, 81, 30, 0); g.rect(42, 30, 78, 59, 0); g.keyline(16);
    g.hline(41, 79, 7, 16); g.hline(39, 81, 27, 16); g.hline(39, 81, 30, 16);
    g.vline(55, 8, 26, 16); g.vline(65, 8, 26, 16); g.hline(45, 75, 17, 16);
    g.vline(54, 31, 59, 16); g.vline(66, 31, 59, 16); g.hline(42, 78, 40, 16); g.hline(42, 78, 50, 16);
    for (y = 12; y < 26; y += 9) { for (x = 50; x < 76; x += 10) { g.ring(x, y, 2, 2, 9); } }
    for (y = 35; y < 58; y += 10) { for (x = 48; x < 78; x += 12) { if (!(x === 60 && y > 40)) { g.ring(x, y, 2, 2, 9); } } }
    g.rect(55, 42, 65, 57, 16); g.frame(56, 43, 64, 56, 0); g.px(62, 50, 0); g.hline(58, 62, 46, 9); g.hline(58, 62, 48, 9);
    g.vline(76, 8, 26, 9); g.vline(79, 31, 58, 9);
    g.maskOn(); g.rect(16, 48, 41, 51, 13); g.rect(79, 48, 104, 51, 13); g.rect(19, 52, 22, 59, 13); g.rect(98, 52, 101, 59, 13); g.keyline(16);
    g.hline(16, 41, 48, 0); g.hline(79, 104, 48, 0);
  });

  OBJ.valigia = plate("LA TUA VALIGIA", 4, function (g) {
    var x;
    shadow(g, 16, 104, 63);
    g.maskOn(); g.poly([[18, 4], [102, 4], [104, 32], [16, 32]], 13); g.keyline(16);
    g.poly([[22, 7], [98, 7], [100, 29], [20, 29]], 2); g.pline([[22, 7], [98, 7], [100, 29], [20, 29], [22, 7]], 16);
    /* il vuoto nella fodera, a forma di pistola */
    g.poly([[38, 11], [76, 11], [76, 18], [58, 18], [56, 27], [45, 27], [46, 18], [38, 18]], 11);
    for (x = 38; x <= 76; x += 2) { g.px(x, 10, 16); if (x >= 58) { g.px(x, 19, 16); } if (x <= 46) { g.px(x, 19, 16); } if (x >= 45 && x <= 56) { g.px(x, 28, 16); } }
    for (x = 12; x <= 18; x += 2) { g.px(37, x, 16); g.px(77, x, 16); } for (x = 20; x <= 26; x += 2) { g.px(44, x, 16); g.px(57, x, 16); }
    g.maskOn(); g.poly([[14, 34], [106, 34], [102, 63], [18, 63]], 10); g.keyline(16);
    g.maskOn(); g.rect(24, 38, 56, 59, 0); g.keyline(16); g.hline(24, 56, 46, 9); g.line(34, 38, 40, 44, 16); g.line(46, 38, 40, 44, 16); g.px(40, 49, 16); g.px(40, 54, 16);
    g.maskOn(); g.rect(62, 38, 96, 59, 6); g.keyline(16); g.hline(62, 96, 48, 16); for (x = 65; x < 96; x += 5) { g.vline(x, 39, 47, 0); }
    g.rect(14, 33, 19, 36, 16); g.rect(101, 33, 106, 36, 16); g.rect(56, 31, 64, 34, 16); g.px(60, 33, 0);
  });

  OBJ.letto = plate("IL LETTO DELLA 3", 9, function (g) {
    g.rect(0, 62, 119, 65, 13); g.hline(0, 119, 61, 16);
    g.maskOn(); g.rect(14, 10, 21, 61, 16); g.rect(12, 7, 23, 10, 16); g.rect(99, 30, 105, 61, 16); g.rect(97, 27, 107, 30, 16); g.rect(21, 48, 99, 54, 16); g.keyline(0);
    g.vline(17, 12, 46, 9); g.vline(102, 32, 46, 9); g.hline(23, 97, 51, 9);
    g.maskOn(); g.ell(31, 28, 10, 6, 2); g.keyline(16); g.line(25, 28, 36, 26, 9);
    g.maskOn(); g.ell(60, 37, 39, 13, 0); g.ell(42, 35, 18, 12, 0); g.ell(80, 36, 18, 12, 0); g.rect(23, 40, 97, 48, 0); g.keyline(16);
    g.line(46, 25, 48, 47, 9); g.line(64, 25, 64, 47, 9); g.line(82, 26, 80, 47, 9); g.arc(55, 36, 6, 9, -1.2, 1.2, 6); g.arc(73, 36, 6, 9, -1.2, 1.2, 6); g.arc(37, 36, 6, 9, -1.2, 1.2, 6);
    g.hline(24, 96, 44, 9);
  });

  OBJ.biglietto = plate("CARTA INTESTATA", 11, function (g) {
    g.rect(19, 12, 107, 61, 16); g.rect(16, 9, 104, 58, 0); g.frame(16, 9, 104, 58, 16);
    g.text(29, 13, "S.I.M.A.", 16, 2); g.text(28, 26, "DIREZIONE LAVORI", 16, 1); g.hline(22, 98, 33, 16);
    hand(g, 24, 96, 39, 16); hand(g, 24, 78, 45, 16);
    g.pline([[64, 54], [68, 49], [71, 55], [75, 48], [79, 55], [84, 50], [97, 53]], 16);
  });

  OBJ.orario = plate("ORARIO DELLE CORRIERE", 3, function (g) {
    g.rect(58, 54, 61, 65, 16);
    g.rect(26, 6, 98, 56, 12);
    g.rect(23, 3, 95, 54, 0); g.frame(23, 3, 95, 54, 16); g.frame(25, 5, 93, 52, 16);
    g.rect(25, 5, 93, 14, 16); g.text(48, 7, "ORARIO", 0, 1);
    g.text(30, 17, "PARTENZE", 16, 1); g.hline(29, 89, 24, 16);
    g.text(30, 27, "7.10", 16, 2); g.text(30, 40, "18.40", 16, 2);
    g.hline(74, 88, 32, 9); g.hline(74, 88, 45, 9);
    g.ell(59, 3, 34, 2, 0); g.arc(59, 3, 34, 2, PI, 2 * PI, 16);
  });

  OBJ.fontana = plate("LA FONTANA", 10, function (g) {
    var i;
    g.rect(0, 60, 119, 65, 0); g.hline(0, 119, 59, 16);
    g.maskOn(); g.rect(52, 10, 66, 42, 4); g.ell(59, 9, 9, 4, 0); g.keyline(16);
    g.vline(63, 13, 40, 9); g.arc(59, 9, 9, 4, 0, PI, 16);
    g.rect(66, 21, 81, 24, 16); g.hline(66, 81, 21, 0);
    g.maskOn(); g.poly([[74, 25], [83, 25], [81, 34], [80, 47], [77, 34]], 0); g.keyline(16);
    g.vline(79, 27, 40, 9);
    g.maskOn(); g.poly([[22, 42], [98, 42], [92, 59], [28, 59]], 5); g.keyline(16);
    for (i = 0; i < 4; i++) { g.vline(36 + i * 16, 43, 58, 16); } g.hline(25, 95, 50, 16);
    g.maskOn(); g.rect(19, 38, 101, 42, 0); g.ell(70, 38, 22, 2, 0); g.keyline(16);
    for (i = 0; i < 5; i++) { g.poly([[24 + i * 9, 43], [27 + i * 9, 43], [25 + i * 9, 47 + (i % 2) * 3]], 0); g.px(25 + i * 9, 48 + (i % 2) * 3, 16); }
    g.ell(30, 60, 14, 2, 0); g.arc(30, 60, 14, 2, PI, 2 * PI, 16);
  });

  OBJ.avviso = plate("AVVISO DI COLLAUDO", 12, function (g) {
    g.rect(25, 5, 101, 65, 16);
    g.rect(22, 2, 98, 64, 0); g.frame(22, 2, 98, 64, 16); g.frame(24, 4, 96, 62, 16);
    g.text(45, 8, "S.I.M.A.", 16, 1); g.hline(30, 90, 15, 16);
    g.rect(27, 19, 93, 33, 16); g.text(29, 21, "COLLAUDO", 0, 2);
    g.text(38, 38, "14 FEBBRAIO", 16, 1); g.text(42, 47, "QUOTA 715", 16, 1);
    g.hline(32, 88, 55, 9); g.hline(38, 82, 58, 9);
    g.poly([[92, 2], [98, 2], [98, 8]], 12); g.line(92, 2, 98, 8, 16);
  });

  OBJ.corpo = plate("ETTORE MALAN", 14, function (g) {
    var i, cx;
    for (i = 0; i < 2; i++) {
      cx = 10 + i * 100;
      g.ell(cx, 13, 9, 9, 11); g.ell(cx, 13, 5, 5, 6);
      g.rect(cx - 1, 19, cx + 1, 58, 0); g.poly([[cx, 8], [cx + 2, 14], [cx, 18], [cx - 2, 14]], 0);
      g.rect(cx - 4, 59, cx + 4, 61, 0); g.rect(cx - 3, 27, cx + 3, 28, 0);
    }
    g.line(32, 57, 26, 65, 0); g.line(34, 57, 40, 65, 0); g.line(86, 57, 80, 65, 0); g.line(88, 57, 94, 65, 0);
    g.maskOn(); g.poly([[20, 40], [100, 40], [97, 57], [23, 57]], 12); g.keyline(0);
    g.hline(22, 98, 47, 16); g.rect(56, 50, 64, 52, 0);
    g.maskOn(); g.poly([[21, 41], [25, 31], [33, 26], [42, 30], [60, 31], [84, 30], [91, 26], [97, 31], [100, 42], [92, 49], [78, 44], [62, 50], [46, 45], [30, 47]], 0); g.keyline(16);
    g.line(42, 31, 44, 42, 9); g.line(60, 32, 60, 47, 9); g.line(80, 31, 78, 42, 9); g.arc(33, 32, 6, 5, PI, 2 * PI, 6); g.line(88, 28, 90, 44, 6);
  });

  OBJ.mani = plate("LE MANI", 2, function (g) {
    var i, x1;
    g.line(0, 8, 119, 16, 6); g.line(0, 58, 119, 50, 6); g.line(30, 0, 44, 20, 5); g.line(90, 65, 80, 54, 5);
    /* la sinistra, da sinistra */
    g.maskOn(); g.poly([[0, 22], [28, 26], [28, 46], [0, 52]], 16); g.keyline(0);
    g.maskOn(); g.rect(28, 26, 35, 46, 0); g.keyline(16); g.px(32, 42, 16);
    g.maskOn(); g.ell(47, 36, 12, 9, 0); g.ell(46, 27, 7, 3, 0);
    for (i = 0; i < 4; i++) { x1 = [72, 77, 76, 70][i]; g.rect(54, 28 + i * 4, x1, 31 + i * 4, 0); }
    g.keyline(16);
    for (i = 0; i < 4; i++) { x1 = [72, 77, 76, 70][i]; if (i) { g.hline(57, x1 - 1, 28 + i * 4 - 0, 9); } g.vline(x1 - 4, 29 + i * 4, 30 + i * 4, 9); g.px(64, 29 + i * 4, 9); }
    /* la destra, sopra */
    g.maskOn(); g.poly([[119, 30], [92, 33], [92, 53], [119, 58]], 16); g.keyline(0);
    g.maskOn(); g.rect(85, 33, 92, 53, 0); g.keyline(16); g.px(88, 49, 16);
    g.maskOn(); g.ell(73, 43, 12, 9, 0); g.ell(74, 34, 7, 3, 0);
    for (i = 0; i < 4; i++) { x1 = [48, 43, 44, 50][i]; g.rect(x1, 35 + i * 4, 66, 38 + i * 4, 0); }
    g.keyline(16);
    for (i = 0; i < 4; i++) { x1 = [48, 43, 44, 50][i]; if (i) { g.hline(x1 + 1, 63, 35 + i * 4, 9); } g.vline(x1 + 4, 36 + i * 4, 37 + i * 4, 9); g.px(56, 36 + i * 4, 9); }
  });

  OBJ.fascicolo = plate("IL VERBALE", 5, function (g) {
    var i, y, x;
    g.rect(13, 15, 69, 63, 14);
    g.maskOn(); g.rect(10, 12, 66, 60, 10); g.rect(10, 8, 34, 12, 10); g.keyline(16);
    g.rect(18, 22, 46, 32, 0); g.frame(18, 22, 46, 32, 16); g.text(24, 25, "SIMA", 16, 1);
    g.hline(14, 62, 40, 16); g.hline(14, 62, 42, 16);
    g.rect(51, 7, 111, 63, 14);
    g.maskOn(); g.rect(48, 4, 108, 60, 0); g.keyline(16);
    g.text(64, 8, "VERBALE", 16, 1); g.hline(54, 102, 15, 16);
    for (i = 0; i < 6; i++) {
      y = 20 + i * 7;
      if (i === 3) { for (x = 54; x <= 100; x += 3) { g.px(x, y - 1, 16); g.px(x, y + 3, 16); } g.text(104, y - 1, "?", 16, 1); }
      else { g.rect(54, y, 56, y + 2, 16); g.hline(60, 98 - (i % 2) * 10, y + 1, 9); }
    }
  });

  OBJ.plastico = plate("IL PLASTICO", 10, function (g) {
    var y, i;
    g.rect(12, 55, 108, 61, 16); g.frame(12, 55, 108, 61, 0);
    g.poly([[32, 18], [48, 26], [72, 26], [90, 16], [60, 10]], "h");
    g.maskOn(); g.poly([[18, 54], [18, 24], [32, 17], [48, 26], [53, 54]], 13); g.poly([[102, 54], [102, 22], [90, 15], [72, 26], [67, 54]], 13); g.keyline(0);
    for (i = 0; i < 3; i++) { g.line(20, 30 + i * 8, 44 + i * 2, 32 + i * 8, 9); g.line(100, 28 + i * 8, 76 - i * 2, 32 + i * 8, 9); }
    g.maskOn(); g.poly([[46, 25], [74, 25], [69, 54], [51, 54]], 0); g.keyline(16);
    for (y = 30; y < 54; y += 5) { g.arc(60, y - 2, 13 - (y - 25) * 0.16, 3, 0, PI, 9); }
    g.vline(60, 27, 53, 6);
    /* la campana di vetro */
    g.arc(60, 30, 47, 27, PI, 2 * PI, 0); g.arc(60, 31, 46, 27, PI, 2 * PI, 0); g.vline(13, 30, 54, 0); g.vline(107, 30, 54, 0); g.vline(14, 31, 54, 0); g.vline(106, 31, 54, 0);
    g.ell(60, 3, 3, 2, 0); g.line(24, 26, 31, 13, 0); g.line(27, 27, 33, 16, 0);
  });

  OBJ.fotografia = plate("LA PRIMA PIETRA", 6, function (g) {
    var xs = [31, 43, 79, 91], i, x;
    function fig(x, y) {
      g.maskOn(); g.poly([[x - 6, y + 24], [x - 5, y + 9], [x + 5, y + 9], [x + 6, y + 24]], 16); g.ell(x, y + 4, 3, 4, 16); g.rect(x - 3, y - 4, x + 3, y, 16); g.rect(x - 5, y, x + 5, y + 1, 16); g.keyline(0);
      g.px(x, y + 12, 0); g.px(x, y + 16, 0);
    }
    g.rect(16, 5, 108, 65, 13);
    g.rect(14, 3, 106, 63, 16); g.rect(17, 6, 103, 60, 9); g.rect(21, 9, 99, 57, 0); g.rect(23, 11, 97, 55, 3); g.rect(23, 44, 97, 55, 9);
    g.line(23, 15, 97, 13, 16); for (i = 0; i < 9; i++) { x = 27 + i * 8; g.poly([[x, 15], [x + 4, 15], [x + 2, 19]], i % 2 ? 16 : 0); g.pline([[x, 15], [x + 2, 19], [x + 4, 15]], 16); }
    for (i = 0; i < 4; i++) { fig(xs[i], 22 + (i % 2)); }
    g.rect(55, 45, 73, 53, 0); g.frame(55, 45, 73, 53, 16); g.hline(57, 71, 49, 9);
    fig(57, 21);
    g.line(62, 33, 68, 40, 16, 1); g.poly([[66, 40], [73, 40], [69, 45]], 0); g.pline([[66, 40], [73, 40], [69, 45], [66, 40]], 16);
    g.rect(52, 30, 62, 31, 0);
  });

  function lucchetto(open) {
    return function (g) {
      var x, dy = open ? 5 : 0;
      for (x = 0; x < 120; x += 15) { g.vline(x, 0, 65, 16); g.vline(x + 7, 0, 65, 9); }
      /* il catenaccio */
      g.maskOn(); g.rect(open ? 4 : 14, 14, open ? 64 : 104, 21, 4); g.keyline(16);
      g.hline(open ? 5 : 15, open ? 63 : 103, 15, 0);
      g.maskOn(); g.rect(22, 11, 28, 24, 13); g.rect(86, 11, 92, 24, 13); g.keyline(16);
      g.ring(60, 22, 5, 5, 16); g.ring(60, 22, 4, 4, 16);
      /* l'arco */
      if (open) {
        g.arc(57, 22 + dy, 9, 9, PI, 2 * PI, 0); g.arc(57, 22 + dy, 8, 9, PI, 2 * PI, 16); g.arc(57, 22 + dy, 10, 10, PI, 2 * PI, 16); g.arc(57, 22 + dy, 7, 8, PI, 2 * PI, 0);
        g.rect(47, 22 + dy, 50, 36 + dy, 0); g.frame(46, 22 + dy, 50, 36 + dy, 16);
        g.rect(64, 22 + dy, 67, 27 + dy, 0); g.frame(64, 22 + dy, 67, 28 + dy, 16);
      } else {
        g.arc(60, 22, 10, 9, PI, 2 * PI, 0); g.arc(60, 22, 9, 9, PI, 2 * PI, 0); g.arc(60, 22, 11, 10, PI, 2 * PI, 16); g.arc(60, 22, 8, 8, PI, 2 * PI, 16);
        g.rect(49, 22, 51, 32, 0); g.rect(69, 22, 71, 32, 0); g.vline(48, 22, 32, 16); g.vline(52, 22, 32, 16); g.vline(68, 22, 32, 16); g.vline(72, 22, 32, 16);
      }
      g.rect(46, 35 + dy, 80, 62 + dy, 16);
      g.maskOn(); g.rect(42, 31 + dy, 76, 59 + dy, 12); g.keyline(0); g.frame(42, 31 + dy, 76, 59 + dy, 16);
      g.hline(44, 74, 33 + dy, 0); g.vline(44, 33 + dy, 57 + dy, 0);
      g.rect(50, 36 + dy, 68, 43 + dy, 0); g.text(52, 38 + dy, "SIMA", 16, 1);
      g.ell(59, 49 + dy, 2, 2, 0); g.rect(58, 50 + dy, 60, 55 + dy, 0);
    };
  }
  OBJ.lucchetto = plate("IL LUCCHETTO", 12, lucchetto(false));
  OBJ.lucchettoAperto = plate("IL LUCCHETTO APERTO", 12, lucchetto(true));

  OBJ.scrivania = plate("IL CASSETTO", 12, function (g) {
    var x;
    g.rect(0, 0, 119, 5, 16); g.hline(0, 119, 6, 0);
    for (x = 6; x < 120; x += 22) { g.line(x, 8, x + 4, 65, 14); }
    /* l'interno, vuoto */
    g.maskOn(); g.poly([[28, 10], [92, 10], [98, 22], [22, 22]], 16); g.keyline(0);
    g.line(30, 12, 26, 20, 9); g.line(90, 12, 94, 20, 9); g.hline(32, 88, 12, 9);
    /* il frontale */
    g.maskOn(); g.rect(20, 22, 100, 54, 5); g.keyline(16); g.frame(24, 26, 96, 50, 16);
    g.ell(34, 38, 3, 3, 16); g.px(33, 37, 0); g.ell(86, 38, 3, 3, 16); g.px(85, 37, 0);
    /* la serratura saltata */
    g.poly([[52, 22], [57, 30], [54, 34], [60, 40], [66, 33], [63, 29], [69, 22]], 0); g.pline([[52, 22], [57, 30], [54, 34], [60, 40], [66, 33], [63, 29], [69, 22]], 16);
    g.rect(57, 24, 63, 31, 16); g.ell(60, 27, 1, 1, 0); g.px(60, 29, 0);
    g.line(60, 40, 58, 48, 16); g.line(54, 34, 44, 37, 16); g.line(66, 33, 76, 31, 16); g.line(44, 37, 40, 42, 16);
    g.poly([[70, 56], [78, 54], [74, 59]], 0); g.pline([[70, 56], [78, 54], [74, 59], [70, 56]], 16); g.line(46, 58, 54, 60, 0); g.line(84, 60, 90, 57, 0);
  });

  OBJ.sismografo = plate("IL TRACCIATO", 9, function (g) {
    var x, y;
    g.rect(14, 54, 106, 60, 16); g.frame(14, 54, 106, 60, 0); g.rect(18, 30, 22, 54, 16); g.rect(98, 30, 102, 54, 16);
    g.maskOn(); g.rect(22, 12, 98, 50, 0); g.ell(22, 31, 5, 19, 0); g.ell(98, 31, 5, 19, 0); g.keyline(16);
    g.arc(98, 31, 5, 19, -PI / 2, PI / 2, 16); g.arc(22, 31, 5, 19, PI / 2, 3 * PI / 2, 16); g.ell(98, 31, 2, 4, 16);
    for (y = 16; y < 50; y += 8) { for (x = 24; x < 96; x += 4) { g.px(x, y, 6); } }
    for (x = 20; x <= 96; x++) {
      if (x >= 62 && x <= 70) { continue; }
      g.px(x, 36 + (x % 7 === 0 ? 1 : 0) - (x % 11 === 0 ? 1 : 0), 16);
    }
    g.pline([[62, 36], [64, 30], [66, 14], [68, 47], [69, 33], [70, 36]], 16);
    g.rect(30, 16, 54, 24, 0); g.text(33, 18, "ORE 4", 16, 1); g.line(55, 22, 62, 26, 16);
    g.line(108, 6, 72, 34, 16); g.line(108, 7, 72, 35, 0); g.ell(108, 6, 3, 3, 16); g.rect(69, 34, 72, 36, 16);
  });

  OBJ.lavagna = plate("QUOTA E MILLIMETRI", 6, function (g) {
    g.rect(12, 2, 108, 60, 13); g.frame(12, 2, 108, 60, 16);
    g.rect(15, 5, 105, 57, 16);
    g.text(22, 8, "680: 3", 0, 2); g.text(22, 20, "700: 12", 0, 2); g.text(22, 32, "710: 35", 0, 2); g.text(22, 44, "715: ?", 0, 2);
    g.ring(66, 49, 9, 7, 0); g.arc(66, 49, 11, 8, 0.4, 5.6, 0);
    g.hline(84, 100, 54, 9); g.px(92, 12, 9); g.px(96, 30, 9);
    g.rect(12, 61, 108, 63, 13); g.frame(12, 61, 108, 63, 16); g.rect(88, 59, 96, 60, 0);
  });

  OBJ.calendario = plate("14 FEBBRAIO", 7, function (g) {
    g.px(60, 1, 16); g.px(60, 2, 16);
    g.rect(37, 7, 89, 65, 14);
    g.rect(34, 4, 86, 63, 0); g.frame(34, 4, 86, 63, 16);
    g.rect(34, 4, 86, 15, 16); g.text(44, 7, "FEBBRAIO", 0, 1); g.ell(46, 4, 2, 2, 0); g.ell(74, 4, 2, 2, 0);
    g.text(47, 25, "14", 16, 4);
    g.ring(60, 35, 21, 15, 16); g.ring(60, 35, 20, 14, 16); g.arc(59, 36, 24, 17, 0.5, 6.0, 16);
    g.text(52, 56, "1957", 16, 1);
  });

  OBJ.parapetto = plate("IL PARAPETTO", 3, function (g) {
    var x, y;
    g.ell(30, 10, 34, 5, 0); g.ell(96, 16, 30, 4, 1);
    g.rect(0, 60, 119, 65, 0); g.hline(0, 119, 59, 16);
    g.maskOn(); g.rect(0, 26, 119, 59, 6); g.keyline(16);
    g.rect(0, 22, 119, 27, 0); g.hline(0, 119, 21, 16); g.hline(0, 119, 28, 16);
    for (x = 20; x < 120; x += 34) { g.vline(x, 29, 58, 16); } g.hline(0, 119, 43, 9);
    for (x = 6; x < 120; x += 17) { g.px(x, 36, 16); g.px(x + 5, 51, 16); }
    /* una figura, per la misura */
    man(g, 40, 62, 52, { coat: 16, key: 0 });
    /* il metro */
    g.maskOn(); g.rect(84, 22, 88, 59, 0); g.keyline(16);
    for (y = 24; y < 59; y += 3) { g.hline(84, (y % 9 === 6) ? 87 : 85, y, 16); }
    g.hline(92, 96, 22, 16); g.hline(92, 96, 59, 16); g.vline(94, 22, 34, 16); g.vline(94, 46, 59, 16);
    g.rect(91, 36, 111, 44, 0); g.frame(91, 36, 111, 44, 16); g.text(94, 38, "1.20", 16, 1);
  });

  OBJ.orologio = plate("OROLOGIO DI RONDA", 4, function (g) {
    var i, a;
    shadow(g, 22, 74, 62);
    /* la cinghia */
    g.maskOn(); g.poly([[30, 10], [36, 2], [60, 2], [66, 10]], 13); g.keyline(16); g.poly([[36, 9], [40, 5], [56, 5], [60, 9]], 4);
    g.ell(50, 38, 26, 26, 14);
    g.maskOn(); g.ell(48, 35, 26, 26, 12); g.keyline(16);
    g.ell(48, 35, 20, 20, 0); g.ring(48, 35, 20, 20, 16); g.ring(48, 35, 23, 23, 0);
    for (i = 0; i < 12; i++) { a = i * PI / 6; g.line(48 + 16 * Math.cos(a), 35 + 16 * Math.sin(a), 48 + 19 * Math.cos(a), 35 + 19 * Math.sin(a), 16); }
    g.line(48, 35, 48, 21, 16, 1); g.line(48, 35, 58, 40, 16, 1); g.ell(48, 35, 2, 2, 16);
    g.rect(44, 44, 52, 48, 16); g.px(48, 46, 0);
    /* la chiave */
    g.maskOn(); g.ell(88, 14, 6, 6, 13); g.rect(86, 20, 90, 34, 13); g.rect(90, 28, 94, 30, 13); g.rect(90, 32, 93, 34, 13); g.keyline(16); g.ell(88, 14, 2, 2, 4);
    /* il disco di carta */
    g.maskOn(); g.ell(96, 50, 13, 11, 0); g.keyline(16);
    g.ring(96, 50, 9, 8, 9); g.ell(96, 50, 1, 1, 16);
    for (i = 0; i < 7; i++) { a = -2.6 + i * 0.5; g.px(96 + 11 * Math.cos(a), 50 + 9.5 * Math.sin(a), 16); g.px(96 + 6 * Math.cos(a + 0.3), 50 + 5 * Math.sin(a + 0.3), 16); }
  });

  function idrometro(night, q) {
    return function (g) {
      var wy = Math.round(52 - (q - 700) * 2.8), y, i, m, x;
      g.rect(0, 0, 119, 65, night ? 14 : 5);
      for (y = 10; y < 66; y += 14) { g.hline(0, 119, y, night ? 16 : 9); }
      if (night) { g.poly([[0, 0], [40, 0], [16, 30], [0, 34]], 9); g.poly([[0, 0], [22, 0], [6, 24], [0, 26]], 4); }
      /* l'asta */
      g.maskOn(); g.rect(50, 0, 62, 65, 0); g.keyline(16);
      for (m = 696; m <= 718; m++) {
        y = Math.round(52 - (m - 700) * 2.8);
        if (y < 1 || y > 64) { continue; }
        if (m % 5 === 0) { g.rect(50, y, 58, y + 1, 16); } else { g.hline(50, m % 2 ? 53 : 55, y, 16); }
      }
      for (i = 0; i < 4; i++) {
        y = 52 - i * 14;
        g.rect(66, y - 3, 80, y + 4, 0); g.frame(66, y - 3, 80, y + 4, 16); g.text(68, y - 1, String(700 + i * 5), 16, 1);
      }
      /* il segno del massimo */
      g.rect(30, 9, 49, 11, 16); g.hline(30, 49, 8, 0); g.hline(30, 49, 12, 0); g.poly([[44, 6], [49, 10], [44, 14]], 16);
      g.rect(8, 6, 28, 14, 16); g.frame(8, 6, 28, 14, 0); g.text(11, 8, "MAX", 0, 1);
      /* l'acqua */
      g.rect(0, wy, 119, 65, 16); g.hline(0, 119, wy, 0);
      for (y = wy + 3; y < 66; y += 4) { for (x = (y * 7) % 13; x < 120; x += 13 + (y % 3)) { g.hline(x, x + 4 + (y % 4), y, night ? 0 : 9); } }
      for (y = wy + 1; y < 66; y++) { if (y % 2) { g.hline(51, 61, y, 9); } }
      g.hline(46, 66, wy, 0); g.hline(44, 68, wy + 1, 16); g.hline(47, 65, wy + 2, 0);
    };
  }
  OBJ.idrometro = plate("ASTA IDROMETRICA", 5, idrometro(false, 706));
  OBJ.idrometro4 = plate("QUOTA 712", 14, idrometro(true, 712));

  OBJ.scarichi = plate("GLI SCARICHI", 7, function (g) {
    var k, cx, i, a;
    g.rect(0, 60, 119, 65, 13); g.hline(0, 119, 59, 16);
    g.rect(26, 2, 94, 12, 16); g.frame(26, 2, 94, 12, 0); g.text(29, 5, "SCARICO DI FONDO", 0, 1); g.px(28, 4, 0); g.px(92, 4, 0); g.px(28, 10, 0); g.px(92, 10, 0);
    for (k = 0; k < 2; k++) {
      cx = 32 + k * 56;
      g.rect(cx - 3, 38, cx + 3, 59, 16); g.rect(cx - 8, 56, cx + 8, 59, 16);
      g.maskOn();
      g.ring(cx, 36, 19, 19, 16); g.ring(cx, 36, 18, 18, 16); g.ring(cx, 36, 17, 17, 16); g.ring(cx, 36, 16, 16, 16);
      for (i = 0; i < 6; i++) { a = i * PI / 3 + 0.3 + k * 0.4; g.line(cx, 36, cx + 17 * Math.cos(a), 36 + 17 * Math.sin(a), 16, 1); }
      g.ell(cx, 36, 5, 5, 16);
      g.keyline(0);
      g.ell(cx, 36, 2, 2, 0);
      /* catena e lucchetto */
      g.pline([[cx + 10, 46], [cx + 14, 52], [cx + 18, 50]], 0); g.pline([[cx + 10, 47], [cx + 14, 53], [cx + 18, 51]], 16);
      g.arc(cx + 21, 51, 3, 3, PI, 2 * PI, 16);
      g.maskOn(); g.rect(cx + 17, 51, cx + 25, 58, 4); g.keyline(16); g.px(cx + 21, 54, 16); g.px(cx + 21, 55, 16);
    }
  });

  OBJ.portello = plate("IL PORTELLO", 13, function (g) {
    var i, y, x;
    for (i = 0; i < 9; i++) { x = 4 + Math.floor(h1(i) * 110); y = 4 + Math.floor(h1(i + 9) * 56); g.line(x, y, x + 8, y + 3, 16); g.line(x + 8, y + 3, x + 11, y + 9, 16); g.px(x + 2, y - 2, 9); }
    g.maskOn(); g.rect(36, 16, 84, 65, 2); g.ell(60, 16, 24, 11, 2); g.keyline(0);
    g.arc(60, 16, 24, 11, PI, 2 * PI, 16); g.vline(36, 16, 65, 16); g.vline(84, 16, 65, 16); g.arc(60, 17, 21, 9, PI, 2 * PI, 16); g.vline(39, 17, 65, 16); g.vline(81, 17, 65, 16);
    for (y = 22; y < 64; y += 10) { g.px(42, y, 16); g.px(43, y, 16); g.px(77, y, 16); g.px(78, y, 16); g.px(42, y + 1, 0); g.px(77, y + 1, 0); }
    g.rect(32, 24, 37, 29, 16); g.rect(32, 52, 37, 57, 16);
    g.rect(38, 17, 82, 25, 16); g.text(41, 19, "CUNICOLO 2", 0, 1);
    /* catenaccio */
    g.maskOn(); g.rect(52, 40, 94, 45, 2); g.keyline(16); g.hline(53, 93, 41, 0);
    g.maskOn(); g.rect(58, 37, 63, 48, 13); g.rect(86, 37, 91, 48, 13); g.keyline(0);
    g.arc(74, 46, 4, 4, PI, 2 * PI, 0); g.arc(74, 46, 5, 5, PI, 2 * PI, 16);
    g.maskOn(); g.rect(69, 47, 79, 56, 16); g.keyline(0); g.px(74, 51, 0); g.px(74, 52, 0);
  });

  OBJ.pendolo = plate("IL PENDOLO", 10, function (g) {
    var x;
    g.rect(0, 0, 119, 3, 16); g.rect(62, 3, 68, 5, 16);
    g.vline(65, 5, 30, 0); g.vline(66, 5, 30, 16);
    /* scala graduata */
    g.rect(16, 43, 106, 51, 0); g.frame(16, 43, 106, 51, 16);
    for (x = 20; x <= 102; x += 4) { g.vline(x, 43, (x - 20) % 20 === 0 ? 48 : 45, 16); }
    g.rect(55, 52, 65, 60, 0); g.frame(55, 52, 65, 60, 16); g.text(59, 54, "0", 16, 1); g.vline(60, 43, 51, 16); g.vline(61, 43, 51, 16);
    /* il peso */
    g.maskOn(); g.rect(62, 30, 69, 33, 16); g.poly([[58, 33], [73, 33], [70, 40], [66, 46], [65, 46], [61, 40]], 16); g.keyline(0);
    g.vline(62, 34, 39, 9);
    /* di quanto e' fuori */
    g.hline(61, 65, 39, 0);
    g.line(72, 56, 84, 56, 16); g.poly([[70, 56], [74, 53], [74, 59]], 16);
    g.rect(86, 52, 106, 60, 0); g.frame(86, 52, 106, 60, 16); g.text(89, 54, "5 MM", 16, 1);
    /* vaschetta */
    g.rect(8, 61, 111, 65, 13); g.hline(8, 111, 61, 16);
  });

  OBJ.spie = plate("LE SPIE DI VETRO", 5, function (g) {
    var CR = [[62, 0], [58, 8], [63, 15], [57, 24], [61, 32], [55, 41], [60, 50], [56, 58], [59, 65]], i, y, cx, D = ["12.1", "28.1", "9.2"];
    for (i = 0; i < 12; i++) { g.px(8 + Math.floor(h1(i) * 104), 4 + Math.floor(h1(i + 7) * 58), 16); }
    g.hline(0, 119, 22, 9); g.hline(0, 119, 44, 9);
    g.pline(CR, 16, 1); for (i = 0; i < CR.length; i++) { g.px(CR[i][0] + 2, CR[i][1], 16); }
    g.line(57, 24, 48, 28, 16); g.line(61, 32, 70, 35, 16);
    for (i = 0; i < 3; i++) {
      y = 10 + i * 19; cx = [60, 59, 58][i];
      /* due meta' di un vetrino, scostate */
      g.maskOn(); g.poly([[cx - 26, y - 3], [cx - 3, y - 4], [cx - 1, y + 1], [cx - 4, y + 4], [cx - 26, y + 5]], 0); g.keyline(16);
      g.maskOn(); g.poly([[cx + 4, y - 2], [cx + 27, y - 1], [cx + 27, y + 7], [cx + 2, y + 6], [cx + 5, y + 2]], 0); g.keyline(16);
      g.rect(cx - 26, y - 3, cx - 22, y + 5, 9); g.rect(cx + 23, y - 1, cx + 27, y + 7, 9);
      g.line(cx - 18, y + 3, cx - 10, y - 2, 6); g.line(cx + 10, y + 5, cx + 18, y, 6);
      g.text(cx + 32, y, D[i], 16, 1);
    }
  });

  function tubo(st) {
    return function (g) {
      var i, x, y;
      g.rect(0, 52, 119, 65, 12); g.hline(0, 119, 51, 16);
      for (i = 0; i < 6; i++) { g.px(10 + i * 19, 57 + (i % 2) * 4, 16); }
      if (st === 0) {
        /* chiuso, dietro l'asse */
        g.maskOn(); g.rect(14, 28, 98, 42, 4); g.ell(14, 35, 3, 7, 4); g.rect(98, 26, 108, 44, 13); g.ell(108, 35, 3, 9, 13); g.keyline(16);
        g.hline(14, 97, 30, 0); g.hline(14, 97, 40, 9); g.vline(98, 27, 43, 16); g.hline(99, 107, 29, 0);
        for (x = 30; x < 96; x += 22) { g.line(x, 28, x + 6, 42, 9); }
        g.maskOn(); g.rect(34, 0, 62, 65, 12); g.keyline(16);
        for (y = 3; y < 64; y += 5) { g.hline(36 + (y % 3) * 2, 60 - (y % 4) * 3, y, 16); }
        g.vline(34, 0, 65, 0); g.ell(48, 10, 2, 2, 16); g.px(48, 10, 0); g.ell(48, 56, 2, 2, 16); g.px(48, 56, 0);
        return;
      }
      /* stappato: il tappo e' li' accanto */
      g.ell(60, 47, 44, 3, 15);
      g.maskOn(); g.poly([[14, 26], [86, 22], [88, 38], [16, 44]], 4); g.ell(15, 35, 3, 9, 4); g.ell(87, 30, 4, 8, 4); g.keyline(16);
      g.line(16, 28, 84, 24, 0); g.line(18, 42, 84, 37, 9); for (x = 28; x < 80; x += 20) { g.line(x, 26, x + 6, 41, 9); }
      g.ell(87, 30, 3, 7, st === 1 ? 0 : 16); g.ring(87, 30, 4, 8, 16);
      if (st === 1) {
        /* i fogli arrotolati, che sporgono */
        g.maskOn(); g.poly([[87, 24], [104, 22], [105, 35], [88, 37]], 0); g.ell(104, 28, 3, 6, 0); g.keyline(16);
        g.ring(104, 28, 3, 6, 16); g.ring(104, 28, 1, 3, 16); g.line(90, 27, 101, 26, 9); g.line(90, 31, 101, 30, 9); g.line(90, 34, 100, 33, 9);
      } else { g.arc(87, 30, 2, 5, -1, 1, 9); }
      g.maskOn(); g.rect(96, 44, 108, 50, 13); g.ell(102, 44, 6, 2, 13); g.keyline(16); g.ell(102, 44, 5, 1, 9); g.hline(96, 108, 47, 16);
    };
  }
  OBJ.tubo = plate("TUBO PORTADISEGNI", 8, tubo(0));
  OBJ.tuboAperto = plate("IL TUBO APERTO", 8, tubo(1));
  OBJ.tuboVuoto = plate("IL TUBO VUOTO", 8, tubo(2));

  OBJ.quadro = plate("IL QUADRO", 12, function (g) {
    var r, i, x, y;
    g.maskOn(); g.rect(14, 2, 106, 44, 16); g.keyline(0); g.frame(16, 4, 104, 42, 9);
    for (r = 0; r < 3; r++) {
      for (i = 0; i < 8; i++) {
        x = 25 + i * 10; y = 13 + r * 11;
        g.ring(x, y, 2, 2, 0); g.px(x, y - 5, (r * 8 + i) % 5 === 0 ? 0 : 9); g.px(x + 1, y - 5, (r * 8 + i) % 5 === 0 ? 0 : 9);
      }
    }
    g.rect(10, 46, 110, 51, 4); g.frame(10, 46, 110, 51, 16); g.hline(11, 109, 47, 0);
    for (i = 0; i < 8; i++) { x = 24 + i * 10; if (i === 2 || i === 5) { continue; } g.rect(x, 41, x + 2, 46, 0); g.frame(x - 1, 40, x + 3, 46, 16); }
    /* due cordoni infilati */
    g.pline([[45, 47], [40, 58], [34, 60], [30, 52], [34, 36], [35, 26]], 0, 1); g.rect(33, 21, 37, 27, 0); g.ell(35, 24, 1, 1, 16);
    g.pline([[75, 47], [82, 60], [90, 58], [92, 44], [86, 22], [85, 15]], 0, 1); g.rect(83, 10, 87, 16, 0); g.ell(85, 13, 1, 1, 16);
    g.rect(0, 52, 119, 65, 15); g.hline(0, 119, 52, 0);
    g.pline([[40, 58], [34, 60], [30, 53]], 0, 1); g.pline([[82, 60], [90, 58], [92, 53]], 0, 1);
  });

  OBJ.cuffia = plate("LA CUFFIA", 5, function (g) {
    var i;
    shadow(g, 30, 92, 62);
    g.maskOn();
    for (i = 0; i < 4; i++) { g.arc(60, 34, 25 + i, 27 + i, PI, 2 * PI, 16); }
    g.ell(34, 37, 8, 10, 16); g.ell(86, 37, 8, 10, 16); g.rect(33, 30, 36, 36, 16); g.rect(84, 30, 87, 36, 16);
    g.keyline(0);
    g.ring(60, 34, 30, 32, 16);
    g.ell(37, 37, 4, 7, 9); g.ring(37, 37, 4, 7, 0); g.ell(83, 37, 4, 7, 9); g.ring(83, 37, 4, 7, 0);
    /* il microfono a cornetto */
    g.maskOn(); g.pline([[86, 46], [84, 54], [76, 58], [66, 57]], 16, 1); g.poly([[66, 53], [66, 61], [52, 64], [52, 49]], 16); g.keyline(0);
    g.poly([[52, 51], [56, 52], [56, 61], [52, 62]], 0); g.ell(52, 56, 2, 6, 0); g.ring(52, 56, 2, 7, 16);
    /* il cordone */
    for (i = 0; i <= 40; i++) { g.px(34 - i * 0.6 + 2 * Math.sin(i * 0.8), 47 + i * 0.4 + 2 * Math.cos(i * 0.8), 16); }
  });

  OBJ.marcia = plate("LA MARCIA", 2, function (g) {
    var i, x, y, M = [[18, 32], [34, 16], [52, 30], [70, 14], [92, 30], [104, 26]], t;
    g.ell(26, 6, 30, 4, 0); g.ell(92, 4, 34, 3, 0);
    g.maskOn(); g.poly([[0, 50], [0, 26], [14, 14], [34, 5], [56, 9], [78, 3], [100, 10], [119, 20], [119, 50]], 13); g.keyline(16);
    g.poly([[26, 9], [34, 5], [44, 7], [38, 11]], 0); g.poly([[70, 6], [78, 3], [90, 7], [80, 9]], 0);
    /* la crepa a M */
    g.pline(M, 0, 1); for (i = 0; i < M.length; i++) { g.px(M[i][0], M[i][1] + 2, 16); }
    g.pline([[18, 34], [34, 18], [52, 32], [70, 16], [92, 32], [104, 28]], 16);
    /* alberi storti, sotto la crepa */
    for (i = 0; i < 12; i++) {
      x = 10 + i * 9 + (i % 3) * 2; y = 38 + (i % 4) * 3; t = (i % 2) ? 3 : -3;
      g.line(x, y + 6, x + t, y - 4, 0); g.poly([[x + t, y - 6], [x + t - 3, y + 1], [x + t + 3, y + 1]], 0); g.pline([[x + t - 3, y + 1], [x + t, y - 6], [x + t + 3, y + 1]], 16);
    }
    for (i = 0; i < 16; i++) { g.px(6 + Math.floor(h1(i) * 108), 22 + Math.floor(h1(i + 4) * 12), 9); }
    /* il lago */
    g.rect(0, 50, 119, 65, "h"); g.hline(0, 119, 50, 16); g.hline(0, 119, 51, 0);
    for (i = 0; i < 6; i++) { g.hline(8 + i * 19, 16 + i * 19, 56 + (i % 2) * 4, 0); }
  });

  OBJ.campanile = plate("IL CAMPANILE", 3, function (g) {
    var y, sw = 2;
    g.ell(24, 14, 22, 4, 0); g.ell(100, 24, 20, 3, 0);
    g.poly([[0, 65], [0, 52], [30, 44], [48, 50], [48, 65]], 9); g.poly([[72, 65], [72, 48], [96, 40], [119, 50], [119, 65]], 9);
    g.pline([[0, 52], [30, 44], [48, 50]], 16); g.pline([[72, 48], [96, 40], [119, 50]], 16);
    g.maskOn(); g.rect(48, 24, 72, 65, 0); g.poly([[45, 24], [60, 0], [75, 24]], 16); g.rect(46, 22, 74, 25, 0); g.keyline(16);
    g.vline(60, 0, 3, 16); g.hline(58, 62, 1, 16);
    g.poly([[52, 14], [60, 2], [57, 16]], 9);
    g.hline(46, 74, 25, 16); g.hline(48, 72, 44, 16); g.hline(46, 74, 22, 0); g.hline(47, 73, 21, 0);
    for (y = 48; y < 65; y += 5) { g.px(52 + (y % 3) * 4, y, 9); g.px(66 - (y % 2) * 3, y + 2, 9); }
    /* cella campanaria */
    g.rect(54, 30, 66, 43, 16); g.ell(60, 30, 6, 4, 16);
    g.maskOn(); g.poly([[58 + sw, 31], [62 + sw, 31], [64 + sw, 39], [56 + sw, 39]], 0); g.keyline(16); g.rect(59 + sw, 40, 60 + sw, 41, 0);
    g.vline(60, 26, 31, 0);
    /* orologio e feritoia */
    g.ring(60, 51, 4, 4, 16); g.line(60, 51, 60, 48, 16); g.line(60, 51, 62, 52, 16);
    g.rect(59, 58, 61, 64, 16);
    g.vline(71, 26, 65, 9); g.vline(69, 26, 65, 6);
  });

  /* ---------- ritratti a mezzo busto ---------- */
  OBJ.olga = plate("OLGA DAL MOLIN", 10, function (g) {
    bust(g, 60, 21, 1, { hair: 1, coat: 13 });
    /* grembiule */
    g.maskOn(); g.poly([[50, 49], [70, 49], [73, 65], [47, 65]], 0); g.keyline(16);
    g.line(50, 49, 45, 45, 0); g.line(51, 49, 46, 45, 0); g.line(70, 49, 75, 45, 0); g.line(69, 49, 74, 45, 0);
    g.hline(52, 68, 53, 9);
    /* la cuffia, al collo */
    g.arc(60, 42, 13, 6, 0, PI, 0); g.arc(60, 43, 13, 6, 0, PI, 0); g.arc(60, 44, 13, 6, 0, PI, 16);
    g.maskOn(); g.ell(47, 42, 4, 5, 16); g.ell(73, 42, 4, 5, 16); g.keyline(0); g.ell(47, 42, 2, 3, 9); g.ell(73, 42, 2, 3, 9);
    g.pline([[73, 47], [78, 54], [76, 62], [80, 65]], 0);
  });
  OBJ.vescovi = plate("GINO VESCOVI", 4, function (g) {
    bust(g, 60, 26, 1, { coat: 13, key: 0, glasses: 1, scarf: 0, smoke: 1, f: 0 });
    g.poly([[49, 22], [50, 13], [56, 10], [64, 9], [70, 13], [71, 22], [68, 17], [60, 15], [54, 18]], 16);
    g.line(64, 10, 70, 8, 16); g.line(66, 12, 72, 11, 16);
    g.line(52, 49, 68, 49, 16); g.line(54, 52, 66, 52, 9); g.line(63, 55, 68, 55, 16); g.line(64, 62, 69, 62, 16);
  });
  OBJ.marta = plate("MARTA MALAN", 6, function (g) {
    var x, y, dx, dy;
    bust(g, 60, 24, 1, { hair: 1, coat: 16, tired: 1 });
    /* cappellino e veletta */
    g.maskOn(); g.ell(59, 9, 12, 4, 16); g.rect(52, 4, 66, 9, 16); g.keyline(0); g.hline(52, 66, 8, 9);
    for (y = 12; y <= 29; y++) {
      for (x = 48; x <= 72; x++) {
        dx = (x - 60) / 12; dy = (y - 24) / 15;
        if (dx * dx + dy * dy < 1 && ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0)) { g.px(x, y, 16); }
      }
    }
    g.hline(50, 70, 30, 9);
    g.ell(60, 49, 2, 2, 0); g.ring(60, 49, 2, 2, 16);
  });
  OBJ.bepi = plate("BEPI TORMEN", 4, function (g) {
    bust(g, 60, 26, 1, { cap: 1, coat: 13, key: 16, mous: 1, tired: 1, collarUp: 1 });
    g.line(52, 31, 55, 36, 9); g.line(68, 31, 65, 36, 9); g.hline(55, 65, 19, 9);
    g.px(54, 37, 16); g.px(57, 39, 16); g.px(63, 39, 16); g.px(66, 37, 16); g.px(60, 39, 16);
    g.rect(54, 33, 66, 34, 0); g.rect(55, 33, 65, 33, 16); g.px(53, 35, 16); g.px(67, 35, 16);
    g.px(60, 56, 0); g.px(60, 62, 0);
  });
  OBJ.morandin = plate("ING. MORANDIN", 14, function (g) {
    bust(g, 60, 26, 1, { hat: "fedora", hatT: 2, coat: 3, key: 16, scarf: 0, smirk: 1, lapels: 9, tie: 16 });
    g.hline(57, 63, 33, 16); g.px(56, 34, 16);
    g.frame(52, 48, 68, 54, 16); g.poly([[40, 58], [46, 56], [46, 60]], 0); g.pline([[40, 58], [46, 56], [46, 60], [40, 58]], 16);
  });
  OBJ.commissione = plate("LA COMMISSIONE", 9, function (g) {
    bust(g, 24, 24, 0.7, { hat: "fedora", coat: 16, key: 0, glasses: 1, lapels: 0, tie: 9 });
    bust(g, 96, 24, 0.7, { hat: "fedora", hatT: 12, coat: 14, key: 0, mous: 1, lapels: 0, tie: 16 });
    bust(g, 60, 21, 0.78, { hat: "fedora", coat: 16, key: 0, glasses: 1, scarf: 0, lapels: 0, tie: 6 });
    /* la cartella */
    g.maskOn(); g.poly([[78, 46], [100, 44], [102, 62], [80, 64]], 0); g.keyline(16);
    g.hline(84, 96, 50, 9); g.hline(84, 94, 54, 9); g.rect(88, 43, 94, 46, 16);
  });

  var OBJN = ["lettera", "sigarette", "chiave", "chiavetta", "occhiali", "chiavi", "lampada", "relazione", "telefono", "banco", "minestra", "macchina", "stufa",
    "valigia", "letto", "biglietto", "orario", "fontana", "avviso", "corpo", "mani", "fascicolo", "plastico", "fotografia", "lucchetto", "lucchettoAperto",
    "scrivania", "sismografo", "lavagna", "calendario", "parapetto", "orologio", "idrometro", "idrometro4", "scarichi", "portello", "pendolo", "spie",
    "tubo", "tuboAperto", "tuboVuoto", "quadro", "cuffia", "marcia", "campanile", "olga", "vescovi", "marta", "bepi", "morandin", "commissione"];
  Pix.addObjects(OBJ, OBJN);
})();
