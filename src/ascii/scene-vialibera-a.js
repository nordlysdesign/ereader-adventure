/* ==================================================================
   PER TELEFONO: le scene di «Via Libera», prima parte.
   Porto Scuro, novembre 1953: il golfo e il faro (dal molo e dalla
   finestra, col lampo regolare o coi segnali), il molo di giorno,
   la piazza, la locanda «Al Fanale», la camera 7, la polizia portuale.
   Ogni scena è una funzione (F, t, st): F la griglia di Ascii.Field
   (84 x 56 celle), t il tempo in secondi, st uno stato facoltativo.
   Le celle sono alte quasi il doppio di quanto sono larghe: un cerchio
   si scrive con rx circa 1,7 volte ry.
   Tinte: 0 grigio-azzurro, 1 ambra (le luci accese), 2 rosso (una volta
   sola per scena), 3 bianco caldo, 4 blu notte, 5 verde spento.
   Le chiavi di cache degli sfondi cominciano tutte per "va".
   ================================================================== */
(function () {
  "use strict";
  var A = Ascii, K = A.kit, noise = A.noise, fbm = A.fbm, hash = A.hash, clamp = A.clamp, mix = A.mix, smooth = A.smooth;

  /* ---------- attrezzi ---------- */
  /* un carattere in coordinate di scena */
  function pc(F, x, y, l, tint, ch, mode) { F.put(Math.round(F.X(x)), Math.round(F.Y(y)), l, tint || 0, mode === undefined ? 2 : mode, 0, ch); }
  function box(F, x0, y0, x1, y1, l, tint) { F.path([[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], l, tint || 0); }
  /* nessuna cella oltre 1,3: le luci si sommano, ma non accecano */
  function tetto(F) { var v = F.lum, i; for (i = 0; i < v.length; i++) { if (v[i] > 1.3) { v[i] = 1.3; } } }
  /* fumo: riccioli che salgono, si allargano e si spengono */
  function fumo(F, t, x, y, n, h, l, seed, drift) {
    var i, p;
    for (i = 0; i < n; i++) {
      p = (t * 1.3 + i * h / n + seed) % h;
      pc(F, x + Math.sin(t * 0.8 + i * 1.3 + seed) * (0.3 + p * 0.2) + p * (drift || 0), y - p, l * (1 - 0.8 * p / h), 0, i % 2 ? 126 : 39);
    }
  }
  /* pioggia dentro un riquadro (una finestra), in coordinate di scena */
  function pioggia(F, t, k, x0, y0, x1, y1) {
    var a = Math.round(F.X(x0)), b = Math.round(F.X(x1)), c = Math.round(F.Y(y0)), d = Math.round(F.Y(y1));
    if (b - a < 2 || d - c < 2) { return; }
    F.snow(t, Math.round(22 * k), 14, 0.26, 21, { x0: a, x1: b, y0: c, y1: d, sway: 0.2, wind: -4, ch: "/" });
    F.snow(t, Math.round(12 * k), 20, 0.48, 22, { x0: a, x1: b, y0: c, y1: d, sway: 0.2, wind: -6, ch: "/'" });
  }
  /* quanto è acceso il faro all'istante t (0..1). Senza codice: un lampo ogni cinque secondi.
     Con codice [a, b]: a lampi, pausa, b lampi, pausa lunga, e da capo */
  function colpo(p, d) { return smooth(0, 0.07, p) * (1 - smooth(d - 0.1, d, p)); }
  function lampo(t, code) {
    var a, b, p, tot;
    if (!code) { p = ((t % 5) + 5) % 5; return p < 0.6 ? colpo(p, 0.6) : 0; }
    a = code[0] || 0; b = code[1] || 0; tot = (a + b) * 0.9 + 1.2 + 3;
    p = ((t % tot) + tot) % tot;
    if (p < a * 0.9) { p = p % 0.9; return p < 0.45 ? colpo(p, 0.45) : 0; }
    p -= a * 0.9 + 1.2;
    if (p >= 0 && p < b * 0.9) { p = p % 0.9; return p < 0.45 ? colpo(p, 0.45) : 0; }
    return 0;
  }
  /* un uomo in piedi, in sagoma: cappotto, testa, cappello. y sono i piedi, h l'altezza in righe */
  function uomo(F, x, y, h, o) {
    o = o || {};
    var w = h * 0.2, hy = y - h * 0.86, ry = h * 0.085, rx = ry * 1.7, rim = o.rim || 0.45,
      d = [[x - w * 0.8, y], [x - w * 1.15, y - h * 0.35], [x - w, y - h * 0.7], [x - w * 0.45, y - h * 0.77], [x + w * 0.45, y - h * 0.77], [x + w, y - h * 0.7], [x + w * 1.15, y - h * 0.35], [x + w * 0.8, y]];
    F.poly(d, o.body === undefined ? 0.04 : o.body, 0); F.path(d, rim, o.tint || 0);
    F.ell(x, hy, rx, ry, o.face || 0.05, o.face ? 3 : 0);
    if (!o.noHat) { F.line(x - rx * 1.7, hy - ry * 0.8, x + rx * 1.7, hy - ry * 0.8, rim + 0.1, o.tint || 0, { st: 6 }); F.rect(x - rx, hy - ry * 2.2, x + rx, hy - ry * 1.1, 0.05, 0); F.line(x - rx, hy - ry * 2.3, x + rx, hy - ry * 2.3, rim, o.tint || 0, { st: 5 }); }
  }
  /* un gabbiano: due tratti che battono */
  function gabbiano(F, x, y, up, l) {
    if (up) { pc(F, x - 1, y, l, 0, 92); pc(F, x + 1, y, l, 0, 47); }
    else { pc(F, x - 1, y, l, 0, 45); pc(F, x, y, l, 0, 118); pc(F, x + 1, y, l, 0, 45); }
  }

  /* ================= IL GOLFO E IL FARO ================= */
  /* st.code = [a, b]: il segnale. st.win: dalla finestra della camera, senza molo */
  function golfo(code0, win0) {
    return function (F, t, st) {
      st = st || {};
      var code = st.code || code0, win = st.win || win0, k = lampo(t, code), ox = win ? -9 : 0, LX = 62 + ox, LY = 7, HY = 30, i, y, hw, x, P;
      if (win) { F.setClip(11, 4, 73, 43); }
      /* cielo e mare: quasi lo stesso buio */
      F.shade(0, 0, 84, HY, function (px, py) { return 0.04 + 0.09 * fbm(px * 0.05 + t * 0.015, py * 0.11 + 2); }, 4, 0, win ? "va2" : "va1", 16);
      F.shade(0, HY, 84, 56, function (px, py) { return 0.045 + 0.1 * noise(px * 0.22 + t * 0.3, py * 1.7) + 0.02 * (py - HY) / 26; }, 4, 0, win ? "va4" : "va3", 2);
      F.line(0, HY, 84, HY, 0.16, 4);
      /* il lampo: alone, fascio che si allarga, riflesso. Sta dietro le sagome */
      if (k > 0.01) {
        F.glow(LX, LY, 22, 12, 0.5 * k, 1); F.glow(LX, LY, 8, 4.4, 0.6 * k, 1);
        F.shade(0, LY - 6, 84, LY + 6, function (px, py) {
          var d = Math.abs(px - LX), hh, v;
          if (d < 1.5) { return null; }
          hh = 0.5 + d * 0.075; v = 1 - Math.abs(py - LY) / hh;
          return v <= 0 ? null : k * 0.5 * v * Math.max(0, 1 - d / 80) * (0.7 + 0.3 * noise(px * 0.3 - t * 2, py * 0.8));
        }, 1, 1);
        F.shade(LX - 11, HY + 1, LX + 11, 56, function (px, py) {
          var w = 1.4 + (py - HY) * 0.3, v = 1 - Math.abs(px - LX) / w;
          return v <= 0 ? null : k * 0.6 * v * (0.3 + 0.7 * noise(px * 0.9, py * 1.5 - t * 2.4));
        }, 1, 1);
      }
      /* barche all'ormeggio, lontane */
      for (i = 0; i < 2; i++) {
        x = 22 + i * 7 + ox * 0.4; y = HY - 0.4 + Math.sin(t * 0.9 + i * 2) * 0.25;
        F.poly([[x - 2.6, y - 0.6], [x + 2.6, y - 0.6], [x + 1.8, y + 0.8], [x - 1.8, y + 0.8]], 0.03, 0); F.line(x - 2.6, y - 0.7, x + 2.6, y - 0.7, 0.3, 0); F.line(x, y - 4 + i, x, y - 1, 0.26, 0, { st: 2 });
      }
      /* Punta Cieca */
      P = [[30 + ox, HY], [40 + ox, 27.6], [50 + ox, 24.6], [58 + ox, 22.2], [68 + ox, 21], [78 + ox, 20], [100 + ox, 19]];
      F.poly(P.concat([[100 + ox, HY + 1.8], [44 + ox, HY + 1.8], [34 + ox, HY + 0.8]]), 0.025, 4);
      F.path(P, 0.3 + 0.25 * k, 0);
      for (i = 0; i < 7; i++) { F.line(46 + ox + i * 6.4, HY + 0.4 + (i % 2) * 0.6, 48.4 + ox + i * 6.4, HY + 1.4 + (i % 2) * 0.6, 0.2, 0); }
      for (i = 0; i < 8; i++) { x = 42 + ox + i * 2.6; pc(F, x, 26.6 - i * 0.62 + (i % 2), 0.13, 0, 46); }
      /* la casa del guardiano: buia */
      F.rect(70 + ox, 16, 79 + ox, 20.4, 0.04, 0); F.poly([[69 + ox, 16], [74.5 + ox, 13], [80 + ox, 16]], 0.05, 0);
      F.path([[69 + ox, 16], [74.5 + ox, 13], [80 + ox, 16]], 0.38 + 0.3 * k, 0); F.line(70 + ox, 16, 70 + ox, 20.4, 0.3 + 0.4 * k, k > 0.3 ? 1 : 0); F.line(79 + ox, 16, 79 + ox, 20.4, 0.24, 0);
      F.rect(72 + ox, 17.4, 73.4 + ox, 18.6, 0.12, 0); F.rect(77 + ox, 12.6, 78 + ox, 14.4, 0.2, 0);
      /* la torre, a fasce */
      for (y = 9; y < 21; y++) { hw = 1.5 + (y - 9) * 0.1; F.rect(LX - hw, y, LX + hw, y + 1, Math.floor((y - 9) / 3) % 2 ? 0.07 : 0.24 + 0.1 * k, 0); }
      F.line(LX - 1.6, 9, LX - 2.8, 21.6, 0.42, 0, { st: 2 }); F.line(LX + 1.6, 9, LX + 2.8, 21.6, 0.42, 0, { st: 2 });
      F.line(LX - 2.8, 8.6, LX + 2.8, 8.6, 0.55, 0, { st: 6 });
      F.rect(LX - 1.3, 6, LX + 1.3, 7.8, 0.2 + 1.1 * k, k > 0.15 ? 3 : 1);
      F.line(LX - 1.6, 6, LX - 1.6, 8, 0.4, 0, { st: 2 }); F.line(LX + 1.6, 6, LX + 1.6, 8, 0.4, 0, { st: 2 });
      F.poly([[LX - 2.2, 5.6], [LX, 3.6], [LX + 2.2, 5.6]], 0.08, 0); F.path([[LX - 2.2, 5.6], [LX, 3.6], [LX + 2.2, 5.6]], 0.45, 0); F.line(LX, 2, LX, 3.4, 0.36, 0, { st: 2 });
      if (!win) {
        /* il molo in primo piano: assi bagnate, la bitta, la cima */
        F.poly([[0, 44], [46, 42.4], [62, 56], [0, 56]], function (px, py) { return 0.06 + 0.04 * noise(px * 0.5, py * 0.9); }, 0);
        for (i = 1; i < 6; i++) { y = i / 5; y = y * y * 0.5 + y * 0.5; F.line(0, 44 + y * 12, 46 + y * 16, 42.4 + y * 13.6, 0.17, 0); }
        F.line(0, 44, 46, 42.4, 0.4, 0); F.line(46, 42.4, 62, 56, 0.45, 0);
        F.rect(36.8, 40.6, 39.2, 44.4, 0.09, 0); F.line(36.8, 40.6, 36.8, 44.4, 0.5, 0, { st: 2 }); F.line(39.2, 40.6, 39.2, 44.4, 0.5, 0, { st: 2 }); F.rect(36, 39.8, 40, 40.4, 0.55, 0, { st: 6 });
        F.path([[39.4, 43], [44, 44.6], [50, 49], [53, 53], [52, 56]], 0.32, 0);
        /* il lampione, che illumina solo la propria pioggia */
        F.line(10, 12, 10, 46, 0.42, 0, { st: 2 }); F.line(10, 12, 15, 11, 0.42, 0); F.rect(8.8, 45.6, 11.2, 46.4, 0.4, 0, { st: 6 });
        F.cone(15.3, 12.6, 3, 30, 47, 0.55, 1, t);
        F.glow(15.3, 12, 5, 2.4, 0.7, 1); F.glow(17, 48, 15, 3.6, 0.45, 1);
        F.rect(13.6, 11.4, 17, 12, 1.1, 1);
        K.rainfall(F, t);
      } else {
        K.rainfall(F, t, 0.8);
        F.setClip();
        /* la parete, con la sua carta a puntini */
        F.shade(0, 0, 84, 56, function (px, py) {
          if (px > 10.5 && px < 73.5 && py > 3.5 && py < 43.5) { return null; }
          return (Math.floor(px) % 6 === (Math.floor(py / 3) % 2) * 3 && Math.floor(py) % 3 === 0) ? 0.13 : 0.03 + 0.03 * noise(px * 0.2, py * 0.3);
        }, 0, 0, "va5", 120);
        /* gocce sul vetro */
        for (i = 0; i < 12; i++) { x = 20 + hash(i + 3) * 44; y = 6 + (hash(i + 30) * 36 + t * (0.3 + 1.2 * hash(i + 60))) % 36; pc(F, x, y, 0.42, 0, i % 3 ? 58 : 39); }
        /* il telaio, con la croce */
        box(F, 11, 4, 73, 43, 0.55 + 0.15 * k, 0);
        F.line(42, 4, 42, 43, 0.5 + 0.1 * k, 0, { st: 2, mode: 0 }); F.line(11, 25, 73, 25, 0.42, 0, { mode: 0 });
        F.rect(9, 44, 75, 44.8, 0.4 + 0.3 * k, 0, { st: 6 });
        /* le tende */
        for (i = 0; i < 2; i++) {
          x = i ? 66 : 11.6;
          F.rect(x, 4.6, x + 6.4, 42.4, 0.05, 0);
          for (y = 0; y < 4; y++) { F.line(x + 0.4 + y * 1.8, 4, x + 0.4 + y * 1.8 + Math.sin(t * 0.6 + y + i) * 0.35, 42.6, 0.17 + 0.07 * (y % 2) + 0.2 * k, 0, { st: 2 }); }
          F.line(x, 30, x + 6.4, 30, 0.34, 0, { mode: 0 });
        }
        F.line(7, 2.6, 77, 2.6, 0.4, 0);
        /* la testiera del letto, e il lampo che entra */
        F.line(50, 49, 84, 49, 0.42, 0); for (i = 0; i < 6; i++) { F.line(53 + i * 6, 49, 53 + i * 6, 56, 0.3, 0, { st: 2 }); }
        F.ell(50, 48.6, 1.2, 0.8, 0.5, 0);
        if (k > 0.01) { F.glow(42, 50, 34, 7, 0.24 * k, 1); }
      }
      tetto(F);
    };
  }

  /* ================= IL MOLO, DI GIORNO ================= */
  function moloGiorno(F, t) {
    var HY = 26, i, x, y, b = Math.sin(t * 1.1), s;
    F.shade(0, 0, 84, HY, function (px, py) { return 0.05 + 0.1 * fbm(px * 0.05 + t * 0.02, py * 0.12 + 1); }, 0, 0, "va6", 16);
    /* acqua color peltro */
    F.shade(0, HY, 84, 56, function (px, py) { return 0.1 + 0.15 * noise(px * 0.2 + t * 0.25, py * 1.6) + 0.03 * (py - HY) / 30; }, 0, 0, "va7", 2);
    F.line(0, HY, 84, HY, 0.42, 0);
    /* in fondo Punta Cieca, col faro spento e innocente */
    F.poly([[48, HY], [58, 23.6], [68, 21.8], [84, 20.4], [84, HY + 1], [52, HY + 1]], 0.09, 0); F.path([[48, HY], [58, 23.6], [68, 21.8], [84, 20.4]], 0.46, 0);
    for (y = 11; y < 21; y++) { F.rect(72, y, 74, y + 1, Math.floor((y - 11) / 2.5) % 2 ? 0.12 : 0.55, 0); }
    F.line(71.6, 11, 71.2, 21.6, 0.5, 0, { st: 2 }); F.line(74.4, 11, 74.8, 21.6, 0.5, 0, { st: 2 });
    F.line(71, 10.6, 75, 10.6, 0.6, 0, { st: 6 }); F.rect(72.2, 8.6, 73.8, 10, 0.26, 0); box(F, 72, 8.4, 74, 10.2, 0.5, 0);
    F.path([[71.6, 8.2], [73, 6.8], [74.4, 8.2]], 0.5, 0);
    F.rect(78, 18, 83, 20.6, 0.14, 0); F.path([[77.4, 18], [80.5, 16.2], [83.6, 18]], 0.5, 0);
    /* gabbiani */
    for (i = 0; i < 3; i++) { x = (12 + i * 27 + t * (2.2 + i * 0.8)) % 90 - 3; y = 6 + i * 3.4 + Math.sin(t * 0.7 + i * 2) * 1.2; gabbiano(F, x, y, Math.floor(t * 3 + i) % 2, 0.85); }
    /* barche all'ormeggio */
    for (i = 0; i < 2; i++) {
      x = 52 + i * 16; y = 32 + i * 4 + (i ? -b : b) * 0.4;
      F.poly([[x - 6, y], [x + 6, y], [x + 4.4, y + 2.4], [x - 4.6, y + 2.4]], 0.05, 0); F.line(x - 6, y - 0.2, x + 6, y - 0.2, 0.7, 0); F.path([[x - 6, y], [x - 4.6, y + 2.4], [x + 4.4, y + 2.4], [x + 6, y]], 0.36, 0);
      F.line(x, y - 8, x, y - 0.6, 0.6, 0, { st: 2 }); F.line(x, y - 7.4, x + 4, y - 0.8, 0.3, 0);
      F.rect(x - 2.4, y - 2, x - 0.8, y - 0.8, 0.2, 0);
    }
    /* reti stese ad asciugare, che non asciugano */
    s = 0.5 * b;
    for (x = 7; x < 30; x++) {
      i = (x - 6) / 24; y = 17.4 + Math.sin(i * 3.14) * 3;
      for (; y < 37 + Math.sin(i * 3.14 + s) * 1.6; y++) { if ((Math.floor(x) + Math.floor(y)) % 2 === 0) { pc(F, x, y, 0.36 + 0.1 * noise(x * 0.4, y * 0.4 + t * 0.4), 0, 120, 0); } }
      pc(F, x, 17.4 + Math.sin(i * 3.14) * 3, 0.7, 0, 45, 0);
    }
    F.line(6, 15, 6, 41, 0.62, 0, { st: 2, mode: 0 }); F.line(30, 15, 30, 42, 0.62, 0, { st: 2, mode: 0 });
    /* il molo */
    F.poly([[0, 40], [50, 41.6], [70, 56], [0, 56]], function (px, py) { return 0.05 + 0.03 * noise(px * 0.5, py * 0.9); }, 0);
    for (i = 1; i < 6; i++) { y = i / 5; y = y * y * 0.5 + y * 0.5; F.line(0, 40 + y * 16, 50 + y * 20, 41.6 + y * 14.4, 0.26, 0); }
    F.line(0, 40, 50, 41.6, 0.6, 0); F.line(50, 41.6, 70, 56, 0.6, 0);
    F.rect(16.8, 43.6, 19.2, 47.4, 0.14, 0); F.line(16.8, 43.6, 16.8, 47.4, 0.6, 0, { st: 2 }); F.line(19.2, 43.6, 19.2, 47.4, 0.6, 0, { st: 2 }); F.rect(16, 42.8, 20, 43.4, 0.7, 0, { st: 6 });
    F.path([[19.4, 46], [26, 48], [34, 53], [36, 56]], 0.4, 0);
    /* due uomini che smettono di parlare quando passi */
    uomo(F, 38, 45, 13, { rim: 0.7, body: 0.02 }); uomo(F, 45.4, 46, 13.6, { rim: 0.6, body: 0.02 });
    pc(F, 40.4, 36.6, 1, 2, 42, 0); fumo(F, t, 41, 35.6, 5, 7, 0.5, 1, 0.25);
    tetto(F);
  }

  /* ================= PIAZZA DELLA DOGANA ================= */
  function piazza(night) {
    return function (F, t) {
      var B = night ? 0.05 : 0.1, L = night ? 0.34 : 0.56, D = night ? 0.02 : 0.03, n = night ? "n" : "g", i, k, x, y, w1, w2, puls;
      F.shade(0, 0, 84, 30, night ? function (px, py) { return 0.04 + 0.08 * fbm(px * 0.05 + t * 0.012, py * 0.1 + 3); } : function (px, py) { return 0.1 + 0.13 * fbm(px * 0.05 + t * 0.02, py * 0.12 + 5); }, night ? 4 : 0, 0, "va8" + n, 16);
      /* la polizia portuale, a ovest: buia */
      F.rect(0, 20, 18, 42, B, 0); F.rect(0, 19, 19.4, 19.6, L * 0.9, 0, { st: 6 }); F.line(18, 20, 18, 42, L, 0, { st: 2 });
      for (i = 0; i < 2; i++) { x = 2 + i * 8.4; F.rect(x, 23, x + 5, 28, D, 0); box(F, x, 23, x + 5, 28, L * 0.8, 0); F.line(x + 2.5, 23, x + 2.5, 28, L * 0.6, 0, { st: 2 }); }
      F.rect(3.6, 30, 13.4, 32, 0.03, 0); box(F, 3.6, 30, 13.4, 32, L * 0.8, 0); F.text(5, 31, "POLIZIA", night ? 0.5 : 0.9, 0);
      F.rect(6.4, 34, 11.4, 42, D, 0); F.path([[6.4, 42], [6.4, 34], [11.4, 34], [11.4, 42]], L * 0.8, 0);
      /* il municipio, col frontone */
      F.rect(22, 14, 62, 42, B, 0); F.poly([[20, 14], [42, 5], [64, 14]], B * 1.2, 0);
      F.path([[20, 14], [42, 5], [64, 14]], L + 0.1, 0); F.line(20, 14, 64, 14, L, 0); F.line(22, 14, 22, 42, L, 0, { st: 2 }); F.line(62, 14, 62, 42, L, 0, { st: 2 });
      F.text(38, 11, "MUNICIPIO", night ? 0.6 : 0.95, 0);
      for (i = 0; i < 4; i++) { x = [23.6, 30.4, 49.6, 56.4][i]; F.rect(x, 17, x + 4, 23, D, 0); box(F, x, 17, x + 4, 23, L * 0.8, 0); F.line(x + 2, 17, x + 2, 23, L * 0.6, 0, { st: 2 }); }
      F.line(22, 26.6, 62, 26.6, L * 0.8, 0);
      /* il balcone e le tre bandiere fradice: nessuna che comandi */
      F.rect(36, 24.6, 49, 25.2, L, 0, { st: 6 });
      for (k = 0; k < 3; k++) {
        x = 37.4 + k * 4.2; w1 = 0.6 * Math.sin(t * 1.3 + k * 1.9); w2 = 0.7 * Math.sin(t * 1.1 + k * 2.6 + 1);
        F.line(x, 14.8, x, 24.6, L + 0.1, 0, { st: 2, mode: 0 });
        F.poly([[x + 0.6, 15.6], [x + 2, 15.8 + w1 * 0.5], [x + 3.2, 16.2 + w1], [x + 3.2, 21 + w2], [x + 2, 20.6 + w2 * 0.6], [x + 0.6, 20.4]], [0.62, 0.3, 0.46][k] * (night ? 0.75 : 1), [3, 0, 5][k], { st: w1 > 0 ? 3 : 2 });
        pc(F, x + 2.6, 21.8 + (t * 3.4 + k * 1.3) % 4, night ? 0.4 : 0.6, 0, 39);
      }
      /* i portici */
      for (i = 0; i < 4; i++) {
        x = 23.6 + i * 10;
        F.poly([[x, 42], [x, 31.4], [x + 1.5, 29.6], [x + 4.5, 29.6], [x + 6, 31.4], [x + 6, 42]], night ? 0.012 : 0.03, 0);
        F.path([[x, 42], [x, 31.4], [x + 1.5, 29.6], [x + 4.5, 29.6], [x + 6, 31.4], [x + 6, 42]], L, 0);
      }
      /* il manifesto che si scolla */
      F.rect(40.4, 32.6, 42.8, 37.4, night ? 0.3 : 0.6, 3, { st: 4 });
      if (Math.floor(t * 0.8) % 2) { pc(F, 42.8, 32.6, B, 0, 0, 0); pc(F, 42, 32.6, 0.7, 3, 92, 0); pc(F, 42.8, 33.6, 0.7, 3, 92, 0); }
      else { pc(F, 42.8, 32.6, 0.75, 3, 92, 0); }
      /* un uomo sotto il portico, che non aspetta nessuno */
      puls = 0.55 + 0.45 * Math.max(0, Math.sin(t * 1.6));
      uomo(F, 56.4, 42, 9.4, { rim: night ? 0.5 : 0.62, body: 0.03 });
      pc(F, 58.2, 34.8, 0.5 + 0.6 * puls, 2, 42, 0); F.glow(58.2, 34.8, 2.6, 1.6, 0.25 * puls, 2);
      fumo(F, t, 58.6, 33.8, 5, 6, night ? 0.4 : 0.55, 2, 0.2);
      /* la locanda, a est: l'unica cosa accesa */
      F.rect(66, 18, 84, 42, B, 0); F.rect(64.6, 17, 84, 17.6, L * 0.9, 0, { st: 6 }); F.line(66, 18, 66, 42, L, 0, { st: 2 });
      F.rect(78, 12.6, 80, 16.6, B * 1.4, 0); F.line(78, 12.6, 80, 12.6, L, 0);
      fumo(F, t, 79, 12, 7, 9, night ? 0.24 : 0.5, 5, -0.3);
      if (night) { K.litWindow(F, 68.6, 21, 73.4, 26, 0.85, t, 1); K.litWindow(F, 76.6, 21, 81.4, 26, 0.9, t, 4); K.litWindow(F, 79.4, 34, 83.4, 39, 0.7, t, 6); }
      else { for (i = 0; i < 3; i++) { x = [68.6, 76.6, 79.4][i]; y = i === 2 ? 34 : 21; F.rect(x, y, x + (i === 2 ? 4 : 4.8), y + 5, D, 0); box(F, x, y, x + (i === 2 ? 4 : 4.8), y + 5, L * 0.8, 0); } }
      F.rect(69, 29, 81.4, 31, 0.04, 0); box(F, 69, 29, 81.4, 31, L, 0); F.text(71, 30, "AL FANALE", 0.95, night ? 3 : 0);
      F.rect(72, 33, 77, 42, D, 0); F.path([[72, 42], [72, 33], [77, 33], [77, 42]], L, 0);
      F.line(66, 28, 64.4, 28, L, 0); F.line(64.4, 28, 64.4, 29.4, L, 0, { st: 2 });
      if (night) { F.line(72.4, 41.8, 76.6, 41.8, 0.9, 1); F.glow(64.4, 30.4, 6, 3.4, 0.6 * (0.85 + 0.15 * noise(t * 2, 8)), 1); pc(F, 64.4, 30.4, 1.15, 1, 64, 0); }
      else { pc(F, 64.4, 30.4, 0.5, 0, 111, 0); }
      /* il selciato bagnato */
      F.shade(0, 42, 84, 56, night ? function (px, py) { return 0.035 + 0.055 * noise(px * 0.3, py * 0.9); } : function (px, py) { return 0.06 + 0.07 * noise(px * 0.3, py * 0.9); }, 0, 0, "va9" + n, 120);
      F.line(0, 42, 84, 42, L * 0.8, 0);
      for (x = -78; x <= 162; x += 24) { F.line(42 + (x - 42) * 0.3, 42.8, x, 56, night ? 0.1 : 0.22, 0); }
      if (night) {
        /* le finestre della locanda, per terra */
        F.shade(60, 43, 84, 56, function (px, py) {
          var v = Math.max(0, 1 - Math.abs(px - 74.5) / 6) * 0.42 + Math.max(0, 1 - Math.abs(px - 64.4) / 3) * 0.3;
          return v <= 0 ? null : v * (0.35 + 0.65 * noise(px * 1.3, py * 0.7 - t * 1.6)) * (1 - 0.6 * (py - 43) / 13);
        }, 1, 1);
        K.rainfall(F, t);
      } else {
        /* pozzanghere: un po' di cielo che trema */
        F.shade(4, 45, 80, 55, function (px, py) { return noise(px * 0.11 + 4, py * 0.5) > 0.56 ? 0.1 + 0.16 * noise(px * 0.8 + t * 0.8, py * 2) : null; }, 0, 1);
      }
      tetto(F);
    };
  }

  /* ================= LA LOCANDA «AL FANALE» ================= */
  /* kessel: la sala aperta, con Kessel al tavolo d'angolo. Senza: sedie capovolte, stufa spenta, una lampada sola */
  function bar(kessel) {
    return function (F, t, st) {
      st = st || {};
      var sw = Math.sin(t * 0.9) * 0.8, lamp = (kessel ? 0.9 : 0.75) + 0.1 * noise(t * 1.7, 2), fire = kessel ? 0.75 + 0.25 * noise(t * 2.4, 3) : 0, n = kessel ? "a" : "b", wl = kessel ? 1 : 0.55, i, j, x, y, h, a;
      F.shade(0, 0, 84, 42, function (px, py) { return (0.03 + 0.045 * noise(px * 0.12, py * 0.2)) * wl; }, 1, 0, "va10" + n, 120);
      F.shade(0, 42, 84, 56, function (px, py) { return (0.05 + 0.04 * noise(px * 0.15, py * 2)) * wl; }, 1, 0, "va11" + n, 120);
      for (i = 0; i < 3; i++) { F.line(0, 46 + i * 4, 84, 46 + i * 4, 0.12 * wl, 1, { st: 4 }); }
      F.line(0, 42, 84, 42, 0.24 * wl, 1);
      /* lo scaffale delle bottiglie */
      F.text(30, 3, "AL FANALE", 0.7 * wl + 0.15, 3);
      F.rect(8, 5, 40, 18.6, 0.025, 0); box(F, 8, 5, 40, 18.6, 0.4, 0);
      for (j = 0; j < 3; j++) {
        y = 9 + j * 4.6; F.line(8, y, 40, y, 0.34, 0, { mode: 0 });
        for (i = 0; i < 10; i++) {
          h = hash(i * 7 + j * 31); x = 10.4 + i * 3;
          if (h < 0.12) { continue; }
          a = (0.34 + 0.5 * hash(i * 3 + j * 17 + 5)) * (kessel ? 1 : 0.7);
          pc(F, x, y - 1, a, h > 0.72 ? 1 : (h > 0.45 ? 5 : 0), h > 0.6 ? 73 : (h > 0.35 ? 108 : 65), 0);
          pc(F, x, y - 2, a * 0.75, h > 0.72 ? 1 : (h > 0.45 ? 5 : 0), h > 0.5 ? 105 : 33, 0);
          /* una bottiglia ogni tanto prende la lampada */
          if (hash(i + j * 9 + Math.floor(t * 0.8)) > 0.93) { pc(F, x, y - 1, 1, 3, 42, 0); }
        }
      }
      /* l'orologio sopra il banco */
      F.ell(45, 7.4, 3, 1.8, 0.4, 0); F.ell(45, 7.4, 2.2, 1.2, 0.05, 0);
      a = Math.floor(t) * 0.105; F.line(45, 7.4, 45 + Math.sin(a) * 1.9, 7.4 - Math.cos(a) * 1.1, 0.8, 3); pc(F, 45, 7.4, 0.9, 3, 111, 0);
      /* il telefono a gettoni */
      F.text(49, 10, "TELEFONO", 0.9, 3);
      F.rect(50, 13, 56, 27, 0.06, 0); box(F, 50, 13, 56, 27, 0.46, 0);
      F.ell(53, 18, 2.3, 1.5, 0.42, 0); F.ell(53, 18, 0.9, 0.5, 0.05, 0); F.rect(51.6, 23.4, 54.4, 24.4, 0.3, 0, { st: 6 });
      F.line(48.4, 15, 48.4, 21, 0.4, 0, { st: 2 }); F.ell(48.4, 14.6, 0.9, 0.6, 0.5, 0); F.ell(48.4, 21.4, 0.9, 0.6, 0.5, 0);
      F.path([[48.4, 22], [47.6 + sw * 0.2, 26], [49, 29], [50, 26.6]], 0.26, 0);
      /* Nives, dietro il banco */
      F.cone(25 + sw, 6.6, 5 + sw, 45 + sw, 33, 0.2 * lamp, 1, t);
      F.poly([[15, 34], [16.4, 28.6], [20, 26.8], [24, 26.8], [27.6, 28.6], [29, 34]], 0.04, 0);
      F.path([[15, 34], [16.4, 28.6], [20, 26.8], [24, 26.8], [27.6, 28.6], [29, 34]], 0.58, 3); F.path([[21, 26.8], [22, 29], [23, 26.8]], 0.45, 3);
      F.ell(22, 23.4, 2.5, 2.2, 0.72, 3); F.ell(22, 21.4, 2.8, 1, 0.04, 0); F.ell(24.8, 21.6, 1.2, 0.9, 0.04, 0);
      F.path([[19.2, 22.4], [19.8, 20.8], [22, 20], [24.2, 20.6], [26, 21.4]], 0.42, 0);
      pc(F, 21, 23.6, 0.14, 0, 45, 0); pc(F, 23, 23.6, 0.14, 0, 45, 0);
      if (kessel) {
        /* lo stesso bicchiere, da un po' */
        x = 31.4 + Math.sin(t * 2.6) * 0.5;
        F.path([[27.4, 29.4], [29.4, 30.8], [31, 31]], 0.5, 3);
        pc(F, 32, 31, 1.05, 3, 85, 0); pc(F, x + 1.4, 30.4 + Math.cos(t * 2.6) * 0.5, 0.75, 0, 126, 0);
      }
      /* il banco di zinco */
      F.rect(6, 34, 44, 46, 0.08, 0); F.rect(5, 33, 45, 33.8, 0.66, 0, { st: 6 });
      for (i = 0; i < 4; i++) { F.line(11 + i * 9.4, 35, 11 + i * 9.4, 46, 0.2, 0, { st: 2 }); }
      F.line(6, 46, 44, 46, 0.3, 0); F.line(6, 34, 6, 46, 0.3, 0, { st: 2 }); F.line(44, 34, 44, 46, 0.3, 0, { st: 2 });
      pc(F, 9 + ((t * 5) % 34), 33.4, 1.05, 3, 61, 0);
      /* la grappa senza etichetta */
      pc(F, 39, 32, 0.8, 5, 73, 0); pc(F, 39, 31, 0.6, 5, 105, 0);
      /* la lampada sul banco */
      F.line(25, 0, 25 + sw, 4, 0.3, 0, { st: 2 });
      F.poly([[22 + sw, 6], [28 + sw, 6], [26.4 + sw, 4], [23.6 + sw, 4]], 0.2, 0);
      F.glow(25 + sw, 6.4, 5, 2.4, 0.6 * lamp, 1); F.glow(25, 33.6, 16, 2.4, 0.22 * lamp, 1);
      F.rect(23.6 + sw, 6, 26.4 + sw, 6.4, 1.1, 1);
      /* la stufa, che fa più fumo che caldo */
      F.rect(63.2, 8, 64.8, 26, 0.13, 0); F.line(63, 8, 63, 26, 0.3, 0, { st: 2 }); F.line(65, 8, 65, 26, 0.3, 0, { st: 2 });
      F.rect(63.2, 7, 84, 8, 0.2, 0, { st: 6 });
      F.rect(60, 27, 68, 46, 0.06, 0); box(F, 60, 27, 68, 46, 0.42, 0); F.rect(59, 26, 69, 26.8, 0.34, 0, { st: 6 });
      F.line(60, 33, 68, 33, 0.24, 0, { mode: 0 }); F.line(60.6, 46.4, 60.6, 48, 0.3, 0, { st: 2 }); F.line(67.4, 46.4, 67.4, 48, 0.3, 0, { st: 2 });
      F.rect(62.4, 36, 65.6, 40, kessel ? 0.9 * fire : 0.03, 1); box(F, 62.4, 36, 65.6, 40, 0.3, 0);
      if (kessel) {
        F.glow(64, 38, 10, 6, 0.42 * fire, 1); F.glow(64, 48.6, 11, 3, 0.26 * fire, 1);
        fumo(F, t, 64, 25.4, 9, 13, 0.34, 3, -0.45); fumo(F, t, 66, 35, 5, 9, 0.26, 7, 0.3);
      }
      /* un tavolo in mezzo alla sala */
      F.rect(38, 50, 56, 50.8, 0.36 * wl + 0.06, 1, { st: 6 }); F.line(40, 51, 40, 56, 0.22, 1, { st: 2 }); F.line(54, 51, 54, 56, 0.22, 1, { st: 2 });
      if (kessel) {
        F.path([[34, 56], [34, 46.6], [37, 46.6]], 0.3, 1); F.line(34, 51.6, 37, 51.6, 0.3, 1);
        F.path([[60, 56], [60, 46.6], [57, 46.6]], 0.3, 1); F.line(57, 51.6, 60, 51.6, 0.3, 1);
      } else {
        for (i = 0; i < 2; i++) {
          x = 41 + i * 8;
          F.line(x, 49.2, x + 4.6, 49.2, 0.42, 1); F.line(x + 0.4, 48.6, x - 0.2, 43.6, 0.36, 1, { st: 2 }); F.line(x + 4.2, 48.6, x + 4.8, 43.6, 0.36, 1, { st: 2 }); F.line(x + 0.2, 46, x + 4.4, 46, 0.24, 1);
        }
      }
      /* il tavolo d'angolo */
      F.rect(62, 47.6, 84, 48.4, 0.4 * wl + 0.06, 1, { st: 6 }); F.line(66, 48.6, 66, 56, 0.24, 1, { st: 2 });
      if (kessel) {
        /* Kessel, col cappotto buono, dietro un giornale di un altro paese */
        F.poly([[67.6, 47.4], [68.6, 40.6], [72, 38.6], [78, 38.6], [81.4, 40.6], [82.4, 47.4]], 0.03, 0);
        F.path([[67.6, 47.4], [68.6, 40.6], [72, 38.6], [78, 38.6], [81.4, 40.6], [82.4, 47.4]], 0.5, 0);
        F.ell(75, 35.8, 2.5, 2.1, 0.5, 3);
        F.rect(72.6, 31.2, 77.4, 33.4, 0.04, 0); F.path([[72.6, 33.4], [72.6, 31], [77.4, 31], [77.4, 33.4]], 0.45, 0); F.line(70.6, 34, 79.4, 34, 0.6, 0, { st: 6, mode: 0 });
        pc(F, 74, 36, 0.14, 0, 45, 0); pc(F, 76, 36, 0.14, 0, 45, 0);
        y = noise(t * 0.45, 7) > 0.62 ? 38.4 : 37.6;
        F.rect(69, y, 81, 46.6, 0.44, 3, { st: 4 }); box(F, 69, y, 81, 46.6, 0.6, 3); F.line(75, y, 75, 46.6, 0.2, 0, { st: 2, mode: 0 });
        F.text(70, y + 1.4, "NEUE", 1, 3); F.text(76, y + 1.4, "ZEIT", 1, 3);
        pc(F, 68.6, 43, 0.8, 3, 111, 0); pc(F, 81.4, 43, 0.8, 3, 111, 0);
        F.glow(75, 41, 9, 5, 0.12 * fire, 1);
      } else {
        F.line(70, 46.8, 77, 46.8, 0.42, 1); F.line(70.6, 46.2, 70, 40.4, 0.36, 1, { st: 2 }); F.line(76.4, 46.2, 77, 40.4, 0.36, 1, { st: 2 }); F.line(70.4, 43.4, 76.6, 43.4, 0.24, 1);
      }
      tetto(F);
    };
  }

  /* ================= CAMERA 7 ================= */
  function camera(night) {
    return function (F, t) {
      var k = night ? lampo(t) : 0, sw = Math.sin(t * 0.7) * 0.6, n = night ? "n" : "g", L = night ? 0.36 : 0.56, LX = 50, LY = 13.6, bulb = night ? 0.85 + 0.15 * noise(t * 1.5, 4) : 0, i, x, y;
      F.shade(0, 0, 84, 44, night ? function (px, py) { return 0.03 + 0.035 * noise(px * 0.14, py * 0.2); } : function (px, py) { return 0.06 + 0.04 * noise(px * 0.14, py * 0.2); }, 0, 0, "va12" + n, 120);
      F.shade(0, 44, 84, 56, night ? function (px, py) { return 0.04 + 0.04 * noise(px * 0.2, py * 1.5); } : function (px, py) { return 0.07 + 0.04 * noise(px * 0.2, py * 1.5); }, 0, 0, "va13" + n, 120);
      F.line(0, 44, 84, 44, L * 0.6, 0); for (i = 0; i < 3; i++) { F.line(0, 47 + i * 3.4, 84, 47 + i * 3.4, L * 0.3, 0, { st: 4 }); }
      /* dalla finestra: il golfo, e nel golfo la luce */
      F.setClip(27, 6, 57, 32);
      F.shade(26, 5, 58, 23, night ? function (px, py) { return 0.06 + 0.1 * fbm(px * 0.06 + t * 0.012, py * 0.12); } : function (px, py) { return 0.06 + 0.1 * fbm(px * 0.06 + t * 0.025, py * 0.12); }, night ? 4 : 0, 0, "va14" + n, 16);
      F.shade(26, 23, 58, 33, night ? function (px, py) { return 0.07 + 0.11 * noise(px * 0.25 + t * 0.3, py * 1.7); } : function (px, py) { return 0.12 + 0.15 * noise(px * 0.25 + t * 0.3, py * 1.7); }, night ? 4 : 0, 0, "va15" + n, 2);
      F.line(26, 23, 58, 23, L * 0.7, night ? 4 : 0);
      if (k > 0.01) {
        F.glow(LX, LY, 11, 6, 0.6 * k, 1);
        F.shade(26, LY - 3, 58, LY + 3, function (px, py) { var d = Math.abs(px - LX), v = 1 - Math.abs(py - LY) / (0.5 + d * 0.09); return (d < 1 || v <= 0) ? null : k * 0.5 * v * (1 - d / 40); }, 1, 1);
        F.shade(LX - 5, 25, LX + 5, 33, function (px, py) { var v = 1 - Math.abs(px - LX) / (1 + (py - 24) * 0.4); return v <= 0 ? null : k * 0.55 * v * (0.3 + 0.7 * noise(px * 0.9, py * 1.5 - t * 2.4)); }, 1, 1);
      }
      F.poly([[38, 23], [44, 21.4], [50, 20.2], [58, 19.2], [58, 24.4], [41, 24.4]], night ? 0.025 : 0.1, night ? 4 : 0); F.path([[38, 23], [44, 21.4], [50, 20.2], [58, 19.2]], L + 0.2 * k, 0);
      for (y = 15; y < 20; y++) { F.rect(49.4, y, 50.6, y + 1, (y % 2 ? 0.1 : 0.5) * (night ? 0.6 : 1), 0); }
      pc(F, LX, LY, night ? 0.25 + 1.05 * k : 0.4, night ? (k > 0.15 ? 3 : 1) : 0, night ? 64 : 110, 0);
      if (night) { pioggia(F, t, 1, 27, 6, 57, 32); }
      else { gabbiano(F, 30 + (t * 2.4) % 34, 10 + Math.sin(t * 0.8) * 1.5, Math.floor(t * 3) % 2, 0.9); gabbiano(F, 54 - (t * 1.7 + 9) % 30, 15 + Math.cos(t * 0.6), Math.floor(t * 3 + 1) % 2, 0.7); }
      F.setClip();
      /* il telaio, con la croce */
      box(F, 26, 5, 58, 33, 0.58 + 0.14 * k, 0);
      F.line(42, 5, 42, 33, 0.55, 0, { st: 2, mode: 0 }); F.line(26, 19, 58, 19, 0.45, 0, { mode: 0 });
      F.rect(24, 33.8, 60, 34.6, 0.42 + 0.3 * k, 0, { st: 6 });
      /* il lampo entra, e per un momento la stanza ha delle ombre */
      if (k > 0.01) { F.glow(42, 49, 26, 6, 0.3 * k, 1); F.glow(66, 40, 12, 5, 0.14 * k, 1); }
      /* la tenda */
      F.poly([[19.6, 4], [26, 4], [26.6 + sw * 0.5, 20], [25 + sw, 36.6], [19, 36.6]], night ? 0.05 : 0.12, 0);
      for (i = 0; i < 4; i++) { F.line(20.4 + i * 1.6, 4, 20.4 + i * 1.5 + sw * (0.3 + i * 0.2), 36.6, L * 0.6 + 0.06 * (i % 2) + 0.25 * k, 0, { st: 2 }); }
      F.line(17, 3, 62, 3, L, 0);
      /* l'armadio che non chiude */
      F.rect(0, 10, 13, 46, night ? 0.05 : 0.12, 0); F.path([[0, 10], [13, 10], [13, 46], [0, 46]], L, 0);
      F.poly([[7, 11], [15 + sw * 0.6, 9.4], [15 + sw * 0.6, 47.6], [7, 46]], night ? 0.085 : 0.18, 0); F.path([[7, 11], [15 + sw * 0.6, 9.4], [15 + sw * 0.6, 47.6], [7, 46], [7, 11]], L + 0.1, 0);
      pc(F, 13.4 + sw * 0.5, 29, 0.8, 0, 111, 0);
      /* il catino */
      F.line(17.6, 38.4, 16.6, 47, L, 0, { st: 2 }); F.line(22.4, 38.4, 23.4, 47, L, 0, { st: 2 }); F.line(17.2, 43, 22.8, 43, L * 0.7, 0);
      F.ell(20, 37.4, 3.8, 0.9, night ? 0.4 : 0.75, 3); F.line(17.4, 37.4, 22.6, 37.4, night ? 0.12 : 0.3, 0, { mode: 0 });
      /* il letto di ferro, con la valigia sopra */
      for (x = 63; x < 71; x += 2) { F.line(x, 30, x, 42, L, 0, { st: 2 }); }
      F.line(61, 28.4, 61, 55, L + 0.12, 0, { st: 2 }); F.line(61, 29.6, 71.4, 29.6, L + 0.12, 0); F.line(71.4, 29.6, 71.4, 41, L, 0, { st: 2 });
      F.poly([[61.6, 42], [84, 40.6], [84, 48.6], [61.6, 50]], night ? 0.1 : 0.22, 0); F.line(61.6, 42, 84, 40.6, L + 0.1, 0); F.line(61.6, 50, 84, 48.6, L * 0.8, 0);
      F.ell(66.4, 41.4, 3.6, 1.1, night ? 0.26 : 0.6, 3);
      F.rect(72.6, 35, 82.4, 41, 0.1, 0); box(F, 72.6, 35, 82.4, 41, night ? 0.7 : 0.75, night ? 1 : 0);
      F.line(75, 35, 75, 41, L * 0.8, 0, { st: 2 }); F.line(80, 35, 80, 41, L * 0.8, 0, { st: 2 }); F.line(76.4, 34.2, 78.6, 34.2, L + 0.1, 0);
      /* di notte, una lampadina sola */
      F.line(72, 0, 72, 6, L * 0.7, 0, { st: 2 });
      if (night) {
        F.cone(72, 7.4, 58, 86, 41, 0.13 * bulb, 1, t);
        F.glow(72, 7, 7, 3.6, 0.5 * bulb, 1); F.glow(76, 39, 10, 4, 0.2 * bulb, 1);
        pc(F, 72, 6.6, 1.1, 1, 64, 0);
      } else { pc(F, 72, 6.6, 0.4, 0, 111, 0); }
      tetto(F);
    };
  }

  /* ================= POLIZIA PORTUALE, UFFICIO UNICO ================= */
  function caserma(F, t) {
    var sw = Math.sin(t * 1.1) * 1.6, lamp = 0.85 + 0.15 * noise(t * 1.9, 6), a = Math.floor(t) * 0.105, puls = 0.5 + 0.5 * Math.max(0, Math.sin(t * 1.3)), i, x, y;
    F.shade(0, 0, 84, 44, function (px, py) { return 0.035 + 0.04 * noise(px * 0.13, py * 0.2) + (py > 30 ? 0.02 : 0); }, 0, 0, "va16", 120);
    F.shade(0, 44, 84, 56, function (px, py) { return 0.05 + 0.04 * noise(px * 0.2, py * 1.2); }, 0, 0, "va17", 120);
    F.line(0, 30, 84, 30, 0.13, 0); F.line(0, 44, 84, 44, 0.24, 0);
    for (x = -54; x <= 138; x += 16) { F.line(42 + (x - 42) * 0.5, 44.8, x, 56, 0.11, 0); }
    /* la finestra con l'inferriata, e la pioggia */
    F.setClip(5, 8, 21, 28);
    F.shade(5, 8, 21, 28, function (px, py) { return 0.05 + 0.08 * fbm(px * 0.1 + t * 0.02, py * 0.15); }, 4, 0, "va18", 16);
    pioggia(F, t, 0.8, 5, 8, 21, 28);
    F.setClip();
    for (x = 8.2; x < 20; x += 3.2) { F.line(x, 8, x, 28, 0.5, 0, { st: 2, mode: 0 }); }
    F.line(5, 18, 21, 18, 0.46, 0, { mode: 0 });
    box(F, 5, 8, 21, 28, 0.62, 0); F.rect(3.6, 28.8, 22.4, 29.4, 0.4, 0, { st: 6 });
    /* l'avviso */
    F.rect(25.6, 9, 33.4, 20, 0.07, 0); box(F, 25.6, 9, 33.4, 20, 0.4, 0); F.text(27, 11, "AVVISO", 0.8, 3);
    for (y = 13; y < 19; y += 2) { F.line(27, y, 32, y, 0.2, 0, { st: 4 }); }
    /* il segno chiaro di un ritratto tolto, e il chiodo */
    for (x = 48; x <= 54; x += 2) { pc(F, x, 9, 0.16, 0, 46); pc(F, x, 17, 0.16, 0, 46); } for (y = 11; y < 17; y += 2) { pc(F, 48, y, 0.16, 0, 46); pc(F, 54, y, 0.16, 0, 46); }
    pc(F, 51, 7.6, 0.5, 0, 39);
    /* l'orologio */
    F.ell(61, 10, 3.6, 2.1, 0.44, 0); F.ell(61, 10, 2.8, 1.5, 0.05, 0);
    F.line(61, 10, 61 + Math.sin(a) * 2.4, 10 - Math.cos(a) * 1.3, 0.85, 3); pc(F, 61, 10, 0.9, 3, 111, 0);
    /* l'armadietto di ferro */
    F.rect(68, 13, 81, 48, 0.07, 0); box(F, 68, 13, 81, 48, 0.5, 0); F.line(74.5, 13, 74.5, 48, 0.4, 0, { st: 2 });
    for (y = 16; y < 20; y += 1.4) { F.line(69.6, y, 73, y, 0.3, 0, { st: 4 }); F.line(76, y, 79.4, y, 0.3, 0, { st: 4 }); }
    F.line(73.4, 29, 73.4, 32, 0.5, 0, { st: 2 }); F.line(75.6, 29, 75.6, 32, 0.5, 0, { st: 2 }); pc(F, 74.5, 33.6, 0.9, 0, 111, 0);
    F.line(69, 48.4, 69, 50, 0.4, 0, { st: 2 }); F.line(80, 48.4, 80, 50, 0.4, 0, { st: 2 });
    /* il cono della lampada, prima di Lodi: gli resta addosso solo il filo */
    F.cone(42 + sw, 8.4, 24 + sw * 1.6, 64 + sw * 1.6, 35, 0.2 * lamp, 1, t);
    /* il brigadiere Lodi: kepi, baffi, la faccia di chi ha firmato troppe cose */
    F.poly([[37, 35], [38.4, 30], [42, 28.2], [48, 28.2], [51.6, 30], [53, 35]], 0.05, 0);
    F.path([[37, 35], [38.4, 30], [42, 28.2], [48, 28.2], [51.6, 30], [53, 35]], 0.6, 3); F.path([[44, 28.2], [45, 30.6], [46, 28.2]], 0.4, 3);
    pc(F, 45, 32, 0.6, 1, 46, 0); pc(F, 45, 34, 0.6, 1, 46, 0);
    F.ell(45, 24.6, 2.8, 2.6, 0.66, 3);
    F.rect(42.4, 20, 47.6, 21.6, 0.07, 0); F.path([[42.4, 21.6], [42.6, 19.6], [47.4, 19.6], [47.6, 21.6]], 0.55, 0); F.line(41.8, 22.4, 48.6, 22.4, 0.3, 0, { st: 6, mode: 0 });
    pc(F, 45, 20.8, 0.95, 1, 42, 0);
    pc(F, 44, 24, 0.16, 0, 45, 0); pc(F, 46, 24, 0.16, 0, 45, 0);
    pc(F, 44, 25.6, 0.13, 0, 126, 0); pc(F, 45, 25.6, 0.13, 0, 126, 0); pc(F, 46, 25.6, 0.13, 0, 126, 0);
    /* la sigaretta */
    F.path([[51.6, 30.6], [54, 32.6], [55, 32.4]], 0.5, 3);
    pc(F, 56, 32, 0.5 + 0.6 * puls, 2, 42, 0); F.glow(56, 32, 2.6, 1.6, 0.25 * puls, 2);
    fumo(F, t, 56.4, 31, 7, 12, 0.5, 4, 0.12);
    /* la lampada che dondola */
    F.line(42, 0, 42 + sw, 5.6, 0.3, 0, { st: 2 });
    F.poly([[39 + sw, 7.6], [45 + sw, 7.6], [43.4 + sw, 5.6], [40.6 + sw, 5.6]], 0.2, 0);
    F.glow(42 + sw, 8, 5, 2.4, 0.6 * lamp, 1); F.glow(44 + sw * 1.4, 35.6, 17, 2.6, 0.26 * lamp, 1);
    F.rect(40.6 + sw, 7.6, 43.4 + sw, 8, 1.1, 1);
    /* la scrivania di Lodi, col fascicolo sottile */
    F.poly([[29, 34.6], [61, 34.6], [63, 36.6], [27, 36.6]], 0.2, 0); F.line(27, 36.8, 63, 36.8, 0.5, 0, { st: 6 });
    F.rect(28, 37.4, 62, 47.4, 0.08, 0); F.line(28, 37.4, 28, 47.4, 0.34, 0, { st: 2 }); F.line(62, 37.4, 62, 47.4, 0.34, 0, { st: 2 }); F.line(28, 47.4, 62, 47.4, 0.3, 0);
    box(F, 31, 39.4, 43, 43.4, 0.24, 0); box(F, 47, 39.4, 59, 43.4, 0.24, 0); pc(F, 37, 41.4, 0.5, 0, 45, 0); pc(F, 53, 41.4, 0.5, 0, 45, 0);
    F.poly([[32.6, 34.6], [40, 34.6], [40.8, 36], [32, 36]], 0.85, 3, { st: 4 });
    /* la scrivania vuota, con la macchina da scrivere */
    F.rect(0, 48, 23, 56, 0.07, 0); F.rect(0, 47.2, 24, 47.8, 0.42, 0, { st: 6 }); F.line(23, 48, 23, 56, 0.3, 0, { st: 2 });
    F.rect(6, 42.6, 16, 46.6, 0.1, 0); box(F, 6, 42.6, 16, 46.6, 0.46, 0);
    for (x = 7.4; x < 15; x += 1.6) { pc(F, x, 45, 0.4, 0, 111, 0); }
    F.rect(5.4, 41.4, 16.6, 42, 0.36, 0, { st: 6 }); F.rect(8.6, 37.6, 13.4, 41, 0.5, 3, { st: 4 });
    tetto(F);
  }

  A.add({
    faro: golfo(null, false), finestra: golfo(null, true), finestra21: golfo([2, 1], true),
    tx13: golfo([1, 3], false), tx21: golfo([2, 1], false), tx22: golfo([2, 2], false), tx31: golfo([3, 1], false),
    moloGiorno: moloGiorno,
    piazza: piazza(true), piazzaGiorno: piazza(false),
    bar: bar(true), barVuoto: bar(false),
    camera: camera(true), cameraGiorno: camera(false),
    caserma: caserma
  });
})();
