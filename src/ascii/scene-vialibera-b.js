/* ==================================================================
   PER TELEFONO: le scene di Via Libera, parte B. Punta Cieca:
   il sentiero, la casa del guardiano, il faro da sotto, la sala
   della lanterna, Kessel sulla porta, Cala del Morto (oggi e nel '44).
   Ogni scena è una funzione (F, t, st): F è la griglia di Ascii.Field
   (84 x 56 celle), t il tempo in secondi, st lo stato (facoltativo).
   Le celle sono alte quasi il doppio di quanto sono larghe: un cerchio
   si scrive con rx circa 1,7 volte ry.
   Tinte: 0 grigio-azzurro, 1 ambra, 2 rosso, 3 bianco caldo, 4 blu notte.
   Le chiavi di cache di questo file cominciano per "vb".
   ================================================================== */
(function () {
  "use strict";
  var A = Ascii, K = A.kit, noise = A.noise, fbm = A.fbm, hash = A.hash, clamp = A.clamp, mix = A.mix, smooth = A.smooth;
  var PI = Math.PI;

  /* ---------- attrezzi ---------- */
  /* un carattere, in coordinate di scena */
  function pt(F, x, y, l, tint, mode, ch) { F.put(Math.round(F.X(x)), Math.round(F.Y(y)), l, tint || 0, mode === undefined ? 2 : mode, 0, ch || 0); }
  /* scatola: fondo scuro e filo di contorno */
  function box(F, x0, y0, x1, y1, l, rim, tint, rt) {
    F.rect(x0, y0, x1, y1, l, tint || 0);
    F.path([[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], rim, rt === undefined ? (tint || 0) : rt);
  }
  /* la luce non deve bruciare: tetto a 1,3 */
  function cap(F) { var a = F.lum, i; for (i = 0; i < a.length; i++) { if (a[i] > 1.3) { a[i] = 1.3; } } }
  /* fascio in una direzione qualsiasi (ang in radianti, 0 = verso destra, positivo = verso il basso).
     Parte largo w0 e si apre di `spread` per cella; si somma a quello che c'è, con la sua polvere */
  function beam(F, ax, ay, ang, len, w0, spread, p, tint, t) {
    var X = F.X(ax), Y = F.Y(ay), s = F.s, ca = Math.cos(ang), sa = Math.sin(ang), x, y, dx, dy, al, pe, hw, d;
    if (p <= 0.01) { return; }
    for (y = 0; y < F.H; y++) {
      dy = (y - Y) / s * 1.7;
      for (x = 0; x < F.W; x++) {
        dx = (x - X) / s;
        al = dx * ca + dy * sa; if (al <= 0 || al > len) { continue; }
        pe = Math.abs(dy * ca - dx * sa); hw = w0 + al * spread; if (pe >= hw) { continue; }
        d = pe / hw;
        F.put(x, y, p * (1 - d * d) * (0.3 + 0.7 * (1 - al / len)) * (0.72 + 0.28 * noise(x * 0.3 + t * 0.4, y * 0.35 - t * 0.3)), tint, 1);
      }
    }
  }
  /* pioggia dentro un riquadro di scena (una finestra, una porta) */
  function rainIn(F, t, x0, y0, x1, y1, n, seed) {
    var ax = Math.max(0, Math.ceil(F.X(x0))), bx = Math.min(F.W, Math.floor(F.X(x1)) + 1), ay = Math.max(0, Math.ceil(F.Y(y0))), by = Math.min(F.H, Math.floor(F.Y(y1)) + 1);
    if (bx - ax < 2 || by - ay < 2) { return; }
    F.snow(t, n, 17, 0.22, seed, { x0: ax, x1: bx, y0: ay, y1: by, sway: 0.2, wind: -5, ch: "/" });
    F.snow(t, Math.round(n * 0.5), 24, 0.42, seed + 1, { x0: ax, x1: bx, y0: ay, y1: by, sway: 0.2, wind: -7, ch: "/" });
  }
  /* una ruota dentata, o un rotolo di cima: n segni su un'ellisse */
  function ring(F, cx, cy, rx, ry, l, tint, n, a, ch) {
    for (var i = 0; i < n; i++) { pt(F, cx + rx * Math.cos(a + i * 2 * PI / n), cy + ry * Math.sin(a + i * 2 * PI / n), l, tint, 2, ch); }
  }
  /* un uomo in piedi: sagoma scura, filo di contorno. x, y: i piedi; h: l'altezza in righe.
     o.hat "fedora" | "kepi" | "none"; o.body, o.bt: luce e tinta del cappotto; o.rim, o.rt: il filo */
  function man(F, x, y, h, o) {
    o = o || {};
    var b = o.body === undefined ? 0.03 : o.body, bt = o.bt || 0, rim = o.rim || 0.45, rt = o.rt || 0;
    var sw = h * 0.235, hw = h * 0.2, yS = y - h * 0.8, yH = y - h * 0.2, hy = y - h * 0.87, d;
    /* gambe */
    F.rect(x - sw * 0.55, yH, x - sw * 0.12, y, 0.03, 0); F.rect(x + sw * 0.12, yH, x + sw * 0.55, y, 0.03, 0);
    if (h > 12) { F.line(x - sw * 0.55, yH, x - sw * 0.55, y, rim * 0.7, 0, { st: 2 }); F.line(x + sw * 0.55, yH, x + sw * 0.55, y, rim * 0.7, 0, { st: 2 }); F.line(x, yH + 1, x, y, rim * 0.4, 0, { st: 2 }); }
    /* cappotto */
    d = [[x - hw, yH], [x - sw, yS + h * 0.06], [x - sw * 0.6, yS], [x + sw * 0.6, yS], [x + sw, yS + h * 0.06], [x + hw, yH]];
    F.poly(d, b, bt); F.path(d, rim, rt);
    if (h > 12) { F.line(x - hw, yH, x + hw, yH, rim * 0.6, rt); }
    /* testa e cappello */
    F.ell(x, hy, h * 0.085, h * 0.062, 0.03, 0);
    if (o.hat === "kepi") {
      F.rect(x - h * 0.09, y - h, x + h * 0.09, y - h * 0.93, 0.05, 0);
      F.path([[x - h * 0.09, y - h * 0.93], [x - h * 0.09, y - h], [x + h * 0.09, y - h], [x + h * 0.09, y - h * 0.93]], rim, 0);
      F.line(x - h * 0.09, y - h * 0.92, x + h * 0.17, y - h * 0.92, rim + 0.1, 0, { st: 5 });
    } else if (o.hat !== "none") {
      F.rect(x - h * 0.09, y - h, x + h * 0.09, y - h * 0.94, 0.03, 0);
      F.path([[x - h * 0.09, y - h * 0.94], [x - h * 0.09, y - h], [x + h * 0.09, y - h], [x + h * 0.09, y - h * 0.94]], rim, 0);
      F.line(x - h * 0.17, y - h * 0.93, x + h * 0.17, y - h * 0.93, rim + 0.1, 0, { st: 6 });
    } else {
      F.path([[x - h * 0.085, hy], [x - h * 0.05, hy - h * 0.06], [x + h * 0.05, hy - h * 0.06], [x + h * 0.085, hy]], rim * 0.8, 0);
    }
  }
  /* la brace di una sigaretta, e il suo fumo. k: quanto è accesa (0..1) */
  function ember(F, x, y, k, t, seed, n) {
    var i, a;
    pt(F, x, y, 0.45 + 0.7 * k, 2, 0, 42);
    if (k > 0.05) { F.glow(x, y, 3.4, 2, 0.4 * k, 2); }
    for (i = 0; i < (n || 7); i++) {
      a = (t * 1.3 + i * 1.4 + seed) % 9;
      pt(F, x - 0.4 + Math.sin(t * 0.9 + i * 1.3 + seed) * (0.5 + a * 0.3) - a * 0.35, y - 0.8 - a, 0.3 - a * 0.025, 0, 2, i % 2 ? 126 : 39);
    }
  }
  function gull(F, x, y, l) { pt(F, x - 1, y, l, 0, 2, 92); pt(F, x, y, l, 0, 2, 118); pt(F, x + 1, y, l, 0, 2, 47); }

  /* ================= IL SENTIERO DI PUNTA CIECA ================= */
  /* st.sereno: ha smesso di piovere (capitolo 4) */
  function strada(night) {
    return function (F, t, st) {
      st = st || {};
      var L = night ? 0.42 : 0.55, sw = Math.sin(t * 1.7) + 0.5 * Math.sin(t * 3.1 + 1), ph = t % 5, on = night && ph < 0.6, k = on ? Math.sin(PI * ph / 0.6) : 0, i, x, y, r, u, v;
      /* cielo */
      if (night) { F.shade(0, 0, 84, 22, function (px, py) { return 0.04 + 0.09 * fbm(px * 0.05 + t * 0.02, py * 0.1 + 3); }, 4, 0, "vb1"); }
      else { F.shade(0, 0, 84, 22, function (px, py) { return 0.15 + 0.2 * fbm(px * 0.04 + t * 0.035, py * 0.12 + 1); }, 0, 0, "vb2"); }
      /* il mare, sotto lo strapiombo */
      if (night) { F.shade(0, 21.4, 60, 52, function (px, py) { return 0.04 + 0.08 * noise(px * 0.25 + t * 0.2, py * 1.8 + t * 0.07); }, 4, 0, "vb3", 2); }
      else { F.shade(0, 21.4, 60, 52, function (px, py) { return 0.12 + 0.13 * noise(px * 0.25 + t * 0.2, py * 1.8 + t * 0.07); }, 4, 0, "vb4", 2); }
      F.line(0, 21.4, 60, 21.4, night ? 0.2 : 0.42, 4);
      /* il promontorio lontano, e il faro */
      F.poly([[34, 21.6], [46, 18.4], [60, 16.4], [84, 15.4], [84, 24], [34, 24]], night ? 0.03 : 0.1, 0);
      F.path([[34, 21.6], [46, 18.4], [60, 16.4], [84, 15.4]], night ? 0.3 : 0.48, 0);
      for (i = 0; i < 5; i++) { F.rect(64.8, 6 + i * 2.1, 67.2, 8 + i * 2.1, i % 2 ? 0.07 : (night ? 0.42 : 0.8), i % 2 ? 0 : 3); }
      F.line(64.2, 6, 64.2, 16.4, L, 0, { st: 2 }); F.line(67.8, 6, 67.8, 16.4, L, 0, { st: 2 });
      F.line(63.4, 5.6, 68.6, 5.6, L + 0.1, 0, { st: 6 });
      F.rect(65, 3.6, 67, 4.8, night ? 0.3 + 0.8 * k : 0.3, night ? 1 : 0);
      F.path([[64.4, 3.2], [66, 1.8], [67.6, 3.2]], L, 0);
      if (on) {
        beam(F, 65, 4.2, PI - 0.1, 72, 0.7, 0.085, 0.6 * k, 1, t);
        F.glow(66, 4.2, 8, 4.4, 0.9 * k, 1);
        F.glow(26, 27, 24, 3.4, 0.16 * k, 1);
      }
      /* la terra: l'orlo, e sotto la parete che cade */
      F.poly([[0, 46], [14, 40], [30, 32], [44, 25], [52, 22.8], [84, 21.8], [84, 56], [0, 56]], night ? 0.05 : 0.13, 0);
      F.poly([[0, 46], [14, 40], [30, 32], [44, 25], [44, 28], [30, 36.6], [14, 45.6], [0, 52.4]], night ? 0.12 : 0.22, 0, { st: 2 });
      F.path([[0, 46], [14, 40], [30, 32], [44, 25], [52, 22.8]], L + 0.08, 0);
      /* il sentiero che sale */
      F.poly([[36, 56], [63, 56], [57.4, 42], [53.6, 30], [52.2, 23], [50.4, 23], [48, 30], [43, 42]], night ? 0.2 : 0.34, 0);
      F.path([[36, 56], [43, 42], [48, 30], [50.4, 23]], L - 0.1, 0); F.path([[63, 56], [57.4, 42], [53.6, 30], [52.2, 23]], L - 0.1, 0);
      for (i = 0; i < 12; i++) { u = hash(i + 7); y = 27 + hash(i) * 28; pt(F, 51.3 + (y - 23) * (-0.34 + 0.62 * u), y, night ? 0.3 : 0.5, 0, 2, i % 2 ? 46 : 44); }
      /* il muretto, crollato in un punto */
      for (i = 0; i < 13; i++) {
        if (i === 4 || i === 5) { continue; }
        u = i / 12; x = 33.4 + u * 14.6; y = 55 - u * 31; r = 2.3 * (1 - u) + 0.7;
        F.ell(x, y, r, r * 0.55, night ? 0.03 : 0.1, 0);
        F.path([[x - r, y + 0.2], [x - r * 0.6, y - r * 0.55], [x + r * 0.6, y - r * 0.55], [x + r, y + 0.2]], L + 0.1 - 0.2 * u, 0);
      }
      pt(F, 38.2, 46.4, L - 0.1, 0, 2, 46); pt(F, 39.6, 47.4, L - 0.1, 0, 2, 58); pt(F, 37, 48.8, L - 0.1, 0, 2, 46);
      /* la casa di pietra, coi sigilli sulla porta */
      F.rect(62, 31, 82, 44, night ? 0.07 : 0.19, 0);
      for (i = 0; i < 16; i++) { x = 63 + hash(i + 3) * 17; y = 32 + hash(i + 40) * 11; F.line(x, y, x + 1.6, y, night ? 0.16 : 0.32, 0, { st: 5 }); }
      F.path([[62, 44], [62, 31], [82, 31], [82, 44]], L, 0);
      F.poly([[60, 31], [72, 24.6], [84, 31]], night ? 0.04 : 0.1, 0); F.path([[60, 31], [72, 24.6], [84, 31]], L + 0.12, 0); F.line(60, 31, 84, 31, L - 0.1, 0);
      F.rect(77, 25.4, 79, 28, night ? 0.06 : 0.14, 0); F.path([[77, 28], [77, 25.4], [79, 25.4], [79, 28.6]], L - 0.1, 0);
      box(F, 67.4, 35, 73, 44, 0.03, L - 0.04, 0);
      F.line(67.8, 35.6, 72.6, 43.4, 0.75, 3); F.line(72.6, 35.6, 67.8, 43.4, 0.75, 3);
      pt(F, 70.2, 39.5, 1.05, 2, 0, 64);
      box(F, 76, 34.4, 80, 38.4, 0.03, L - 0.1, 0); F.line(78, 34.4, 78, 38.4, L - 0.2, 0, { st: 2 });
      F.line(56, 44.4, 84, 44.4, night ? 0.2 : 0.34, 0);
      /* le tamerici, piegate dal vento */
      F.ell(11 - sw * 0.5, 37.4, 11.4, 9.4, 0.02, 0); F.rect(13, 44, 20, 56, 0.02, 0);
      F.path([[17, 56], [15, 47], [12.4, 39.6]], L + 0.05, 0, { st: 2 }); F.line(18, 56, 16, 47, L - 0.12, 0, { st: 2 });
      F.line(12.4, 39.6, 3 - sw * 0.6, 31, L, 0); F.line(13.6, 43, 20 - sw * 0.5, 33.4, L, 0); F.line(12.4, 39.6, 9.6 - sw * 0.6, 28, L, 0); F.line(14.6, 46, 5 - sw * 0.4, 40.6, L - 0.08, 0);
      for (i = 0; i < 48; i++) {
        u = hash(i + 5); v = hash(i + 71); r = i % 4;
        x = r === 0 ? mix(12.4, 3, u) : (r === 1 ? mix(13.6, 20, u) : (r === 2 ? mix(12.4, 9.6, u) : mix(14.6, 5, u)));
        y = r === 0 ? mix(39.6, 31, u) : (r === 1 ? mix(43, 33.4, u) : (r === 2 ? mix(39.6, 28, u) : mix(46, 40.6, u)));
        x -= sw * (0.3 + 0.5 * u);
        F.line(x, y, x - 1.6 - v * 1.6 - sw * 0.7, y + 1.6 + v * 2.2, (night ? 0.3 : 0.42) + 0.22 * v, 0, { st: 1 });
      }
      if (night) {
        if (st.sereno) { for (i = 0; i < 14; i++) { pt(F, 2 + hash(i + 2) * 56, 1 + hash(i + 50) * 12, hash(i + Math.floor(t * 1.5)) > 0.25 ? 0.45 : 0.18, 0, 2, 46); } }
        else { K.rainfall(F, t, 0.9); }
      } else {
        gull(F, 22 + Math.sin(t * 0.31) * 9, 9 + Math.sin(t * 0.47) * 2.4, 0.75);
        gull(F, 41 + Math.sin(t * 0.23 + 2) * 7, 13 + Math.cos(t * 0.4) * 1.6, 0.6);
      }
      cap(F);
    };
  }

  /* ================= LA CASA DEL GUARDIANO ================= */
  function casa(F, t) {
    var i, x, y, u, sw = Math.sin(t * 1.1) * 1.3, b = Math.sin(t * 1.3) + 0.5 * Math.sin(t * 2.9), lamp = 0.82 + 0.18 * noise(t * 2.2, 5);
    var PAP = [[39, 45.4, 4.4, 0.5], [46, 50, 4.6, -0.6], [33, 52.6, 4.4, 0.6], [54, 47, 4, -0.4], [6, 49.6, 4.6, 0.5], [50.6, 53.4, 4.4, 0.7], [49, 42.4, 3.6, 0.2], [12.4, 53, 4, -0.5]];
    F.shade(0, 0, 84, 38, function (px, py) { return 0.035 + 0.045 * noise(px * 0.13, py * 0.22); }, 0, 0, "vb9");
    F.shade(0, 38, 84, 56, function (px, py) { return 0.05 + 0.04 * noise(px * 0.16, py * 1.8); }, 0, 0, "vb10");
    for (i = 0; i < 4; i++) { F.line(0, 41.6 + i * 4.2, 84, 41.6 + i * 4.2, 0.12, 0, { st: 4 }); }
    F.line(0, 38, 84, 38, 0.24, 0);
    /* la finestra sul golfo: giorno grigio, il faro lontano */
    F.setClip(54, 7, 74, 27);
    F.shade(54, 7, 74, 20, function (px, py) { return 0.14 + 0.26 * fbm(px * 0.09 + t * 0.03, py * 0.2); }, 0, 0, "vb11");
    F.shade(54, 20, 74, 27, function (px, py) { return 0.12 + 0.14 * noise(px * 0.3 + t * 0.25, py * 1.7); }, 4, 0, "vb12", 2);
    F.line(54, 20, 74, 20, 0.5, 4);
    F.poly([[63, 20], [67, 18.6], [74, 18], [74, 20.4], [63, 20.4]], 0.05, 0); F.path([[63, 20], [67, 18.6], [74, 18]], 0.34, 0);
    F.rect(69.6, 13.4, 70.4, 18, 0.7, 3); F.rect(69.6, 15, 70.4, 15.6, 0.06, 0); F.rect(69.6, 17, 70.4, 17.4, 0.06, 0); pt(F, 70, 12.6, 0.5, 0, 0, 94);
    F.setClip();
    F.path([[54, 7], [74, 7], [74, 27], [54, 27], [54, 7]], 0.65, 0);
    F.line(64, 7, 64, 27, 0.5, 0, { st: 2, mode: 0 }); F.line(54, 17, 74, 17, 0.42, 0, { mode: 0 });
    F.rect(52, 27.8, 76, 28.6, 0.4, 0, { st: 6 });
    /* la tenda, che il vento muove */
    F.poly([[54, 6.4], [60 + b, 6.4], [62 + b * 1.6, 17], [60.4 + b * 2, 27], [54, 27.6]], 0.13, 0);
    F.path([[60 + b, 6.4], [62 + b * 1.6, 17], [60.4 + b * 2, 27], [54, 27.6]], 0.55, 0);
    for (i = 0; i < 3; i++) { F.path([[55.4 + i * 1.8, 7], [55.8 + i * 2 + b * 0.5 * (i + 1) / 3, 17], [55.4 + i * 1.9 + b * (i + 1) / 3, 26.6]], 0.3, 0, { st: 2 }); }
    F.line(51, 5.6, 77, 5.6, 0.4, 0);
    F.glow(64, 44, 15, 5, 0.1, 0);
    /* attaccapanni: la cerata e il cappello di Zanon */
    F.line(13, 7, 27, 7, 0.4, 0, { st: 6 });
    F.poly([[15, 8], [18.4, 8], [20.4, 11.6], [21, 23], [13.6, 23], [13.6, 11.6]], 0.1, 0); F.path([[15, 8], [13.6, 11.6], [13.6, 23], [21, 23], [20.4, 11.6], [18.4, 8]], 0.34, 0); F.line(17, 9, 17.4, 22.4, 0.2, 0, { st: 2 });
    F.ell(24.4, 9.6, 2.4, 0.9, 0.08, 0); F.line(22, 9.8, 26.8, 9.8, 0.4, 0, { st: 5 }); F.path([[23.2, 9.4], [23.4, 8], [25.4, 8], [25.6, 9.4]], 0.34, 0);
    /* la fotografia, storta: sul muro il segno di dove stava dritta */
    for (x = 31; x <= 40; x += 1.5) { pt(F, x, 11.4, 0.16, 0, 2, 46); pt(F, x, 18, 0.16, 0, 2, 46); }
    for (y = 12.6; y < 18; y += 1.4) { pt(F, 31, y, 0.16, 0, 2, 58); pt(F, 40, y, 0.16, 0, 2, 58); }
    F.poly([[31.6, 13.4], [41, 11.6], [42.4, 18], [33, 19.8]], 0.07, 0);
    F.path([[31.6, 13.4], [41, 11.6], [42.4, 18], [33, 19.8], [31.6, 13.4]], 0.6, 0);
    F.poly([[33.6, 14.6], [39.8, 13.4], [40.6, 17], [34.4, 18.2]], 0.34, 3);
    pt(F, 36.4, 15.6, 0.05, 0, 0, 0); pt(F, 38, 15.4, 0.05, 0, 0, 0);
    F.line(36, 10.4, 36.2, 12.4, 0.4, 0, { st: 2 });
    /* la stufa: lo sportello aperto, la cenere fresca */
    F.rect(4, 0, 6.6, 19, 0.11, 0); F.line(7, 0, 7, 19, 0.34, 0, { st: 2 }); F.line(4, 7, 6.6, 7, 0.26, 0); F.line(4, 13, 6.6, 13, 0.26, 0);
    F.rect(1, 20, 10, 38, 0.07, 0); F.path([[1, 38], [1, 20], [10, 20], [10, 38]], 0.55, 0); F.rect(0, 19, 11, 19.8, 0.34, 0, { st: 6 });
    box(F, 3, 25, 8, 31, 0.02, 0.34, 0);
    for (i = 0; i < 7; i++) { pt(F, 3.6 + hash(i + 3) * 4, 29 + hash(i + 9) * 1.6, 0.34, 0, 0, i % 2 ? 58 : 46); }
    F.poly([[8, 25], [12.4, 23.6], [12.4, 30.2], [8, 31]], 0.14, 0); F.path([[8, 25], [12.4, 23.6], [12.4, 30.2], [8, 31]], 0.4, 0);
    F.line(2, 38, 2, 40, 0.3, 0, { st: 2 }); F.line(9, 38, 9, 40, 0.3, 0, { st: 2 });
    F.ell(8, 42, 6.4, 1.3, 0.15, 0);
    for (i = 0; i < 12; i++) { pt(F, 2.6 + hash(i) * 11, 41 + hash(i + 9) * 2.2, 0.36, 0, 2, i % 3 ? 46 : 58); }
    for (i = 0; i < 6; i++) { u = (t * 0.9 + i * 1.5) % 9; pt(F, 5.6 + Math.sin(t * 0.8 + i) * (0.4 + u * 0.14), 28.4 - u * 0.5, 0.26 - u * 0.02, 0, 2, i % 2 ? 126 : 39); }
    /* la scrivania: i cassetti sfilati, il registro rimasto sopra */
    F.poly([[14, 29.6], [36, 29.6], [38.4, 32.2], [11.6, 32.2]], 0.16, 0); F.path([[14, 29.6], [36, 29.6], [38.4, 32.2], [11.6, 32.2], [14, 29.6]], 0.46, 0);
    F.rect(12.4, 32.4, 37.6, 43, 0.07, 0); F.path([[12.4, 32.4], [12.4, 43], [37.6, 43], [37.6, 32.4]], 0.4, 0);
    box(F, 14.4, 34, 23.4, 37, 0.02, 0.3, 0); box(F, 26.4, 34, 35.6, 37, 0.02, 0.3, 0); box(F, 14.4, 38.6, 23.4, 41.6, 0.02, 0.3, 0);
    F.poly([[26.4, 38.6], [35.6, 38.6], [37, 43.6], [25, 43.6]], 0.14, 0); F.path([[26.4, 38.6], [25, 43.6], [37, 43.6], [35.6, 38.6], [26.4, 38.6]], 0.5, 0); pt(F, 31, 41.4, 0.7, 0, 0, 111);
    F.line(13.4, 43, 13.4, 46, 0.34, 0, { st: 2 }); F.line(36.6, 43, 36.6, 45.4, 0.34, 0, { st: 2 });
    F.poly([[20, 27.8], [28, 27.8], [28.8, 30.2], [19.2, 30.2]], 0.8, 3); F.line(24, 27.8, 24, 30.2, 0.2, 0, { st: 2, mode: 0 }); F.line(20.6, 29, 23, 29, 0.36, 0, { st: 4, mode: 0 }); F.line(25, 29, 27.6, 29, 0.36, 0, { st: 4, mode: 0 });
    F.rect(32, 28, 33.4, 29.6, 0.3, 0); F.line(34.4, 27, 37, 29.4, 0.4, 0);
    /* un cassetto rovesciato, e le carte per terra */
    F.poly([[18, 47.4], [30, 46.2], [32, 50.4], [20, 51.8]], 0.09, 0); F.path([[18, 47.4], [30, 46.2], [32, 50.4], [20, 51.8], [18, 47.4]], 0.46, 0); F.line(19.6, 48.6, 30, 47.6, 0.26, 0);
    for (i = 0; i < PAP.length; i++) {
      x = PAP[i][0]; y = PAP[i][1]; u = PAP[i][2]; b = PAP[i][3];
      F.poly([[x, y], [x + u, y + b], [x + u - 0.7, y + b + 1.7], [x - 0.7, y + 1.7]], 0.55, 3);
      F.line(x + 0.4, y + 0.9 + b * 0.2, x + u - 1.2, y + 0.9 + b * 0.8, 0.2, 0, { st: 4, mode: 0 });
    }
    /* la sedia rovesciata */
    F.line(43, 34.6, 42, 40, 0.42, 0); F.line(49.6, 33, 49.2, 38.6, 0.42, 0); F.line(53, 35.4, 51.6, 41, 0.42, 0); F.line(45.6, 37, 45, 42.4, 0.42, 0);
    F.poly([[42, 40], [49.2, 38.4], [52, 41], [44.8, 42.8]], 0.12, 0); F.path([[42, 40], [49.2, 38.4], [52, 41], [44.8, 42.8], [42, 40]], 0.5, 0);
    F.line(42, 40, 37.6, 44.4, 0.4, 0); F.line(44.8, 42.8, 40, 47, 0.4, 0); F.line(37.6, 44.4, 40, 47, 0.4, 0);
    /* il letto: il materasso aperto come un pesce, la lana fuori */
    F.rect(81, 30, 84, 56, 0.12, 0); F.line(80.6, 30, 80.6, 44, 0.4, 0, { st: 2 }); F.line(75, 31.4, 84, 31.4, 0.34, 0); for (x = 76.4; x < 81; x += 1.5) { F.line(x, 32, x, 41, 0.22, 0, { st: 2 }); }
    F.poly([[59, 43.4], [84, 40.6], [84, 53.6], [62, 56]], 0.13, 0);
    for (i = 0; i < 8; i++) { F.line(60.6 + i * 3, 43.4 - i * 0.34, 63 + i * 3, 55.6 - i * 0.3, 0.22, 0, { st: 2 }); }
    F.path([[62, 56], [59, 43.4], [84, 40.6]], 0.5, 0);
    F.path([[64, 45], [67, 47], [65.4, 49], [69.4, 50.4], [67.6, 52.4], [72.6, 54.2]], 0.85, 3);
    F.ell(69, 47.6, 2.2, 1.2, 0.55, 3); F.ell(72, 45.8, 1.8, 1, 0.5, 3); F.ell(66, 50.8, 1.8, 0.9, 0.5, 3); F.ell(74.4, 48.4, 1.5, 0.9, 0.45, 3);
    /* la lampadina, rimasta accesa: dondola */
    F.line(42, 0, 42 + sw, 5, 0.3, 0, { st: 2 });
    F.poly([[39.4 + sw, 7], [44.6 + sw, 7], [43.4 + sw, 5], [40.6 + sw, 5]], 0.2, 0); F.rect(41 + sw, 7, 43 + sw, 7.4, 1.1 * lamp, 1);
    F.cone(42 + sw, 7.6, 20 + sw * 3, 64 + sw * 3, 38, 0.13 * lamp, 1, t);
    F.glow(42 + sw, 7.4, 5, 2.4, 0.7 * lamp, 1); F.glow(42 + sw * 3, 44, 20, 6, 0.14 * lamp, 1);
    cap(F);
  }

  /* ================= IL FARO, DA SOTTO ================= */
  function bandY(k) { return 48 - 38 * (1 - Math.pow(0.8, k)) / (1 - Math.pow(0.8, 9)); }
  function towerHW(y) { return 6 + (y - 10) * 9 / 38; }
  /* st.sereno: ha smesso di piovere (capitolo 4) */
  function torre(night) {
    return function (F, t, st) {
      st = st || {};
      var L = night ? 0.45 : 0.6, ph = t * 2 * PI / 5, c = Math.cos(ph), s = Math.sin(ph), face = Math.max(0, s), i, x, y, y0, y1, a, b, w, d;
      if (night) { F.shade(0, 0, 84, 48, function (px, py) { return 0.035 + 0.08 * fbm(px * 0.045 + t * 0.03, py * 0.1 + 2); }, 4, 0, "vb5"); }
      else { F.shade(0, 0, 84, 48, function (px, py) { return 0.14 + 0.24 * fbm(px * 0.04 + t * 0.06, py * 0.11 + 4); }, 0, 0, "vb6", 4); }
      /* il fascio, che gira: lungo quando passa di lato, corto e largo quando ti viene addosso */
      if (night) {
        beam(F, c >= 0 ? 46 : 38, 4.4, c >= 0 ? -0.2 : PI + 0.2, 14 + 62 * Math.abs(c), 1.6, 0.1 + 0.3 * (1 - Math.abs(c)), 0.42 + 0.3 * face, 1, t);
        F.glow(42, 4.4, 12 + 12 * face, 5 + 5 * face, 0.4 + 0.6 * face * face, 1);
      }
      /* il mare, a destra, e la terra */
      if (night) { F.shade(60, 43, 84, 48, function (px, py) { return 0.05 + 0.08 * noise(px * 0.3 + t * 0.25, py * 1.8); }, 4, 0, "vb7", 2); }
      else { F.shade(60, 43, 84, 48, function (px, py) { return 0.13 + 0.14 * noise(px * 0.3 + t * 0.25, py * 1.8); }, 4, 0, "vb8", 2); }
      F.line(60, 43, 84, 43, night ? 0.22 : 0.45, 4);
      F.poly([[0, 47.6], [20, 46.4], [42, 47.4], [64, 46.4], [84, 47.6], [84, 56], [0, 56]], night ? 0.05 : 0.13, 0);
      F.path([[0, 47.6], [20, 46.4], [42, 47.4], [64, 46.4], [84, 47.6]], L - 0.15, 0);
      d = Math.sin(t * 1.9) * 0.5;
      for (i = 0; i < 22; i++) { x = 2 + hash(i) * 80; y = 49 + hash(i + 20) * 6.4; F.line(x, y, x - 0.8 - d, y - 1.5, night ? 0.24 : 0.4, 0, { st: 1 }); F.line(x + 1, y, x + 1.4 - d, y - 1.6, night ? 0.2 : 0.34, 0, { st: 2 }); }
      /* la torre a fasce, che si stringe verso l'alto */
      for (i = 0; i < 9; i++) {
        y1 = bandY(i); y0 = bandY(i + 1); a = towerHW(y0); b = towerHW(y1); w = i % 2 === 0;
        F.poly([[42 - a, y0], [42 + a, y0], [42 + b, y1], [42 - b, y1]], w ? (night ? 0.34 : 0.72) : 0.02, w ? 3 : 0);
        F.poly([[42 + a * 0.42, y0], [42 + a, y0], [42 + b, y1], [42 + b * 0.42, y1]], w ? (night ? 0.2 : 0.42) : 0.02, w ? 3 : 0);
      }
      F.line(36, 10, 27, 48, L + 0.1, 0); F.line(48, 10, 57, 48, L, 0);
      box(F, 41.4, 19.6, 42.6, 21.4, 0.02, 0.3, 0); box(F, 41.2, 29, 42.8, 31.6, 0.02, 0.3, 0);
      /* il ballatoio e la lanterna */
      F.rect(33, 8.6, 51, 10, 0.1, 0); F.line(33, 8.6, 51, 8.6, L + 0.12, 0, { st: 6 }); F.line(33.6, 10.2, 50.4, 10.2, L - 0.15, 0, { st: 5 });
      F.line(34, 6.6, 50, 6.6, L - 0.05, 0); for (x = 34; x <= 50; x += 2) { F.line(x, 6.8, x, 8.4, L - 0.15, 0, { st: 2 }); }
      F.rect(37.6, 2.6, 46.4, 6.4, night ? 0.55 + 0.6 * face : 0.3, night ? 1 : 0, night ? undefined : { st: 2 });
      F.line(40.6, 2.6, 40.6, 6.4, 0.12, 0, { st: 2, mode: 0 }); F.line(43.4, 2.6, 43.4, 6.4, 0.12, 0, { st: 2, mode: 0 });
      F.path([[37.4, 6.4], [37.4, 2.6], [46.6, 2.6], [46.6, 6.4]], L, 0);
      F.poly([[36, 2.4], [42, -0.8], [48, 2.4]], 0.1, 0); F.path([[36, 2.4], [42, -0.8], [48, 2.4]], L + 0.05, 0); F.line(36, 2.4, 48, 2.4, L - 0.1, 0);
      /* la porta di ferro, in cima a uno scalino */
      F.rect(38.6, 41, 45.4, 47.4, 0.04, 0); F.ell(42, 41, 3.4, 1.6, 0.04, 0);
      F.path([[38.4, 47.4], [38.4, 41], [39.6, 39.8], [42, 39.2], [44.4, 39.8], [45.6, 41], [45.6, 47.4]], L + 0.1, 0);
      F.line(42, 39.6, 42, 47.4, 0.2, 0, { st: 2 });
      for (y = 41.4; y < 47; y += 1.9) { pt(F, 39.6, y, 0.4, 0, 0, 46); pt(F, 44.4, y, 0.4, 0, 0, 46); }
      pt(F, 43.2, 44.2, 0.75, 0, 0, 111);
      F.rect(36.6, 47.8, 47.4, 48.6, night ? 0.26 : 0.45, 0, { st: 6 });
      if (night) {
        F.glow(42, 12, 12, 5, 0.1 + 0.16 * face, 1);
        if (!st.sereno) { K.rainfall(F, t, 0.9); }
        else { for (i = 0; i < 16; i++) { x = hash(i + 2) * 84; if (x > 30 && x < 54) { continue; } pt(F, x, 12 + hash(i + 50) * 26, hash(i + Math.floor(t * 1.5)) > 0.25 ? 0.42 : 0.16, 0, 2, 46); } }
      } else {
        for (i = 0; i < 3; i++) { a = t * (0.5 + i * 0.13) + i * 2.1; gull(F, 42 + Math.cos(a) * (15 + i * 5), 6 + i * 2.4 + Math.sin(a) * 3, 0.85 - i * 0.12); }
      }
      cap(F);
    };
  }

  /* ================= LA SALA DELLA LANTERNA ================= */
  /* boat: al largo c'è la lanterna di una barca (capitolo 4). st.ferma: la lente non gira, luce fissa */
  function lente(boat) {
    return function (F, t, st) {
      st = st || {};
      var ferma = !!st.ferma, ph = t * 2 * PI / 5, c = ferma ? 0 : Math.cos(ph), face = ferma ? 0.6 : Math.max(0, Math.sin(ph)), hx = 42 + 11.4 * c, i, x, y, r, a, bob;
      /* fuori: cielo e mare neri */
      F.shade(0, 0, 84, 27, function (px, py) { return 0.03 + 0.05 * fbm(px * 0.05 + t * 0.02, py * 0.1 + 6); }, 4, 0, "vb13");
      F.shade(0, 27, 84, 39, function (px, py) { return 0.04 + 0.07 * noise(px * 0.24 + t * 0.2, py * 1.7 + t * 0.06); }, 4, 0, "vb14", 2);
      F.line(0, 27, 84, 27, 0.2, 4);
      /* il fascio che esce, da una parte e poi dall'altra */
      if (!ferma) { beam(F, c < 0 ? 28 : 56, 22, c < 0 ? PI : 0, 34, 3.4, 0.16, 0.4 * Math.abs(c), 1, t); }
      if (!boat) { rainIn(F, t, 0, 2, 84, 38, 34, 21); }
      /* la gabbia di vetri, a losanghe */
      for (i = -3; i < 9; i++) { F.line(i * 10.5, 2, i * 10.5 + 26.6, 38.6, 0.2, 0); F.line(i * 10.5 + 26.6, 2, i * 10.5, 38.6, 0.2, 0); }
      F.rect(0, 0, 84, 1.6, 0.1, 0); F.line(0, 2, 84, 2, 0.36, 0); F.line(0, 20.4, 84, 20.4, 0.28, 0);
      /* la lanterna che non dovrebbe esserci */
      if (boat) {
        bob = Math.sin(t * 1.2) * 0.6;
        F.rect(8.4, 24.6, 16.6, 28.4, 0.03, 4);
        F.line(9.6, 26.4 + bob * 0.5, 14.6, 26.4 + bob * 0.5, 0.34, 0, { st: 5 });
        pt(F, 12, 25 + bob, 1.1, 1, 0, 42); F.glow(12, 25 + bob, 4.4, 2.4, 0.5 + 0.1 * noise(t * 3, 2), 1);
        for (i = 0; i < 4; i++) { if (noise(t * 2.4 + i * 3, i) > 0.36) { pt(F, 12 + Math.sin(t * 1.7 + i) * 0.7, 28.4 + i * 1.5, 0.6 - i * 0.1, 1, 0, 45); } }
      }
      /* il pavimento di lamiera */
      F.shade(0, 39, 84, 56, function (px, py) { return ((Math.floor(px / 2) + Math.floor(py)) % 2 ? 0.09 : 0.045) + 0.03 * noise(px * 0.2, py * 0.5); }, 0, 0, "vb15");
      F.line(0, 39, 84, 39, 0.42, 0);
      /* la botola della scala */
      F.poly([[0, 46.4], [15, 45], [20, 56], [0, 56]], 0.01, 0); F.path([[0, 46.4], [15, 45], [20, 56]], 0.42, 0);
      for (i = 0; i < 4; i++) { F.line(0.6, 48.6 + i * 2.2, 11 - i * 2.4, 48.6 + i * 2.2, 0.3 - i * 0.05, 0, { st: 5 }); }
      F.line(15, 45, 15, 36, 0.42, 0, { st: 2 }); F.line(0, 37.4, 15, 36, 0.42, 0); F.line(7.6, 36.8, 7.6, 45.6, 0.3, 0, { st: 2 });
      /* la lente: il corpo d'ottone, i prismi, gli anelli */
      F.poly([[31, 5], [53, 5], [57, 11], [57, 33], [53, 39], [31, 39], [27, 33], [27, 11]], 0.05, 1);
      for (i = 0; i < 5; i++) {
        F.line(31 - i * 0.8, 6 + i * 1.3, 53 + i * 0.8, 6 + i * 1.3, i % 2 ? 0.2 : 0.5, 1, { st: 6, mode: 0 });
        F.line(31 - i * 0.8, 38 - i * 1.3, 53 + i * 0.8, 38 - i * 1.3, i % 2 ? 0.2 : 0.5, 1, { st: 6, mode: 0 });
      }
      F.rect(27.6, 12.6, 56.4, 31.4, 0.09, 1);
      for (i = 0, r = 8.6; r > 1.6; r -= 1.2, i++) { F.ell(42, 22, r * 1.62, r, i % 2 ? 0.14 : 0.52 + 0.1 * face, 1); }
      F.ell(42, 22, 2.6, 1.5, 1.05, 3);
      /* la luce che le gira dentro */
      F.rect(hx - 1.4, 13, hx + 1.4, 31, 0.3 + 0.2 * face, 1, { mode: 1 });
      if (!ferma) { F.line(hx + (c < 0 ? 2.6 : -2.6), 14, hx + (c < 0 ? 2.6 : -2.6), 30, 0.08, 1, { st: 2, mode: 0 }); }
      F.glow(42, 22, 22, 13, 0.22 + 0.3 * face, 1);
      F.line(34.4, 5, 34.4, 39, 0.5, 1, { st: 2, mode: 0 }); F.line(49.6, 5, 49.6, 39, 0.5, 1, { st: 2, mode: 0 });
      F.line(27, 12, 57, 12, 0.5, 1, { mode: 0 }); F.line(27, 32, 57, 32, 0.5, 1, { mode: 0 });
      F.path([[31, 5], [53, 5], [57, 11], [57, 33], [53, 39], [31, 39], [27, 33], [27, 11], [31, 5]], 0.62, 1);
      /* il basamento, con lo sportello */
      F.rect(31, 40, 53, 53, 0.09, 0); F.path([[31, 40], [31, 53], [53, 53], [53, 40], [31, 40]], 0.46, 0);
      F.rect(29.6, 53.4, 54.4, 54.6, 0.32, 0, { st: 6 });
      for (x = 32.6; x < 53; x += 3.4) { pt(F, x, 41, 0.4, 0, 0, 46); pt(F, x, 52.2, 0.4, 0, 0, 46); }
      box(F, 37, 42.4, 47, 51, 0.035, 0.62, 0); F.path([[38.4, 43.6], [45.6, 43.6], [45.6, 49.8], [38.4, 49.8], [38.4, 43.6]], 0.26, 0);
      pt(F, 36.4, 44, 0.6, 0, 0, 91); pt(F, 36.4, 49.4, 0.6, 0, 0, 91);
      pt(F, 44.4, 46.8, 0.95, 1, 0, 111);
      F.glow(42, 41, 16, 4, 0.12 + 0.1 * face, 1);
      /* i ruotismi */
      a = ferma ? 0.4 : t * 0.9;
      F.ell(23.4, 50, 3.6, 2.2, 0.1, 0); ring(F, 23.4, 50, 4.4, 2.7, 0.5, 0, 12, a, 43);
      F.line(23.4 - 3 * Math.cos(a), 50 - 1.8 * Math.sin(a), 23.4 + 3 * Math.cos(a), 50 + 1.8 * Math.sin(a), 0.42, 0); pt(F, 23.4, 50, 0.8, 0, 0, 111);
      F.ell(18.6, 45.4, 2, 1.2, 0.1, 0); ring(F, 18.6, 45.4, 2.8, 1.7, 0.42, 0, 8, -a * 1.6, 43); pt(F, 18.6, 45.4, 0.7, 0, 0, 111);
      F.line(27, 50, 31, 50, 0.4, 0);
      /* il quadro elettrico: la leva e il tasto d'ottone */
      F.line(72, 0, 72, 13, 0.34, 0, { st: 2, mode: 0 });
      box(F, 63, 13, 81, 36, 0.07, 0.55, 0);
      F.text(65, 15.4, "AUT", ferma ? 0.4 : 0.95, ferma ? 0 : 3); F.text(76, 15.4, "MAN", ferma ? 0.95 : 0.4, ferma ? 3 : 0);
      for (i = 0; i < 7; i++) { pt(F, 72 + 6.4 * Math.cos(PI * (1.2 + i * 0.1)), 26 + 5 * Math.sin(PI * (1.2 + i * 0.1)), 0.3, 0, 0, 46); }
      x = ferma ? 76.6 : 67.4;
      F.line(72, 26, x, 20, 0.85, 0); F.ell(x, 19.4, 1.5, 0.9, 0.95, 3); pt(F, 72, 26, 0.7, 0, 0, 111);
      F.ell(72, 31.6, 2, 1.1, 1, 1); F.glow(72, 31.6, 5, 2.6, 0.26, 1);
      pt(F, 65, 34.4, 0.4, 0, 0, 43); pt(F, 79, 34.4, 0.4, 0, 0, 43);
      /* la latta dell'olio, e uno straccio */
      F.rect(62, 46.4, 65.6, 51.4, 0.1, 0); F.path([[62, 51.4], [62, 46.4], [63.8, 44.4], [65.6, 46.4], [65.6, 51.4], [62, 51.4]], 0.45, 0); F.line(63.8, 44.4, 68, 43, 0.45, 0);
      F.poly([[69, 51], [74.6, 50], [76, 52.4], [70, 53.2]], 0.3, 0);
      cap(F);
    };
  }

  /* ================= KESSEL SULLA PORTA ================= */
  function kessel(F, t) {
    var i, x, y, k = Math.pow(Math.max(0, Math.sin(t * 1.1)), 3), lamp = 0.85 + 0.15 * noise(t * 2.6, 7);
    /* il muro della torre */
    F.shade(0, 0, 84, 47, function (px, py) { return 0.035 + 0.03 * noise(px * 0.2, py * 0.3); }, 0, 0, "vb22");
    for (y = 3; y < 45; y += 3) { for (x = ((y / 3) % 2) * 3.5 + 1; x < 84; x += 7) { if (x < 19 || x > 56) { F.line(x, y, x + 2.4, y, 0.11, 0, { st: 5 }); } } }
    /* fuori: la notte, i lumi del porto, la pioggia */
    F.setClip(30, 5, 54, 46);
    F.shade(30, 5, 54, 34, function (px, py) { return 0.06 + 0.08 * fbm(px * 0.08 + t * 0.03, py * 0.12); }, 4, 0, "vb23");
    F.shade(30, 34, 54, 38, function (px, py) { return 0.04 + 0.06 * noise(px * 0.4 + t * 0.3, py * 2); }, 4, 0, "vb24", 2);
    F.line(30, 34, 54, 34, 0.24, 4);
    for (i = 0; i < 7; i++) {
      x = 31.4 + i * 3.4 + (i % 2) * 0.6; y = 33.2 - (i % 3) * 0.5;
      pt(F, x, y, 0.75 + 0.3 * noise(t * 2 + i * 5, i), 1, 0, i % 3 ? 46 : 42);
      if (noise(t * 2.2 + i * 3, 4) > 0.34) { pt(F, x + Math.sin(t * 1.4 + i) * 0.5, 35.4 + (i % 2), 0.45, 1, 0, 45); }
    }
    F.poly([[30, 46.4], [54, 46.4], [49, 38], [35.6, 38]], 0.08, 0); F.line(35.6, 38, 30, 46.4, 0.24, 0); F.line(49, 38, 54, 46.4, 0.24, 0);
    for (i = 0; i < 6; i++) { F.line(34 + i * 2.6, 40 + (i % 3) * 1.9, 35.6 + i * 2.6, 40 + (i % 3) * 1.9, 0.3, 4, { st: 5 }); }
    rainIn(F, t, 30, 5, 55, 46, 22, 31);
    F.setClip();
    /* l'architrave e gli stipiti */
    F.rect(28, 2, 56, 4.4, 0.13, 0); F.path([[28, 4.6], [28, 2], [56, 2], [56, 4.6]], 0.4, 0);
    F.path([[29.6, 46.6], [29.6, 4.8], [54.4, 4.8], [54.4, 46.6]], 0.6, 0);
    /* il battente di ferro, aperto verso l'interno */
    F.poly([[29.4, 5], [20.6, 1.6], [20.6, 51], [29.4, 46.6]], 0.09, 0); F.path([[29.4, 5], [20.6, 1.6], [20.6, 51], [29.4, 46.6]], 0.46, 0);
    for (i = 0; i < 4; i++) { y = 8 + i * 12; F.line(21.4, y - 2, 28.8, y, 0.3, 0); pt(F, 23, y - 0.6, 0.4, 0, 0, 46); pt(F, 26.6, y + 0.4, 0.4, 0, 0, 46); }
    box(F, 22, 26, 24.4, 31, 0.16, 0.42, 0); pt(F, 23.2, 33, 0.6, 0, 0, 111);
    /* il pavimento: la lama di luce della porta, e l'ombra lunga */
    F.shade(0, 47, 84, 56, function (px, py) { return 0.05 + 0.03 * noise(px * 0.2, py * 1.4); }, 0, 0, "vb25");
    F.line(0, 47, 20, 47, 0.24, 0); F.line(55, 47, 84, 47, 0.24, 0);
    F.poly([[30, 47], [54, 47], [72, 56], [12, 56]], 0.17, 4);
    F.poly([[38.4, 47], [45.6, 47], [52, 56], [32, 56]], 0.02, 0);
    F.line(54, 47, 72, 56, 0.24, 4); F.line(30, 47, 12, 56, 0.2, 4);
    /* Kessel: il cappello, il cappotto con la cintura, la busta */
    man(F, 42, 47.4, 33, { rim: 0.5 });
    F.line(34.6, 30.6, 49.4, 30.6, 0.34, 0, { st: 5 }); pt(F, 42, 30.6, 0.6, 0, 0, 35);
    F.path([[39.6, 21.2], [42, 26], [44.4, 21.2]], 0.34, 0);
    F.line(34.2, 23.4, 33.4, 34, 0.4, 0, { st: 2 }); F.line(49.8, 23.4, 49, 31, 0.4, 0, { st: 2 });
    F.line(49, 31, 46.4, 21.4, 0.3, 0);
    F.rect(30.6, 34, 35.4, 35.4, 0.9, 3); pt(F, 33, 34.4, 0.3, 0, 0, 118);
    ember(F, 45.6, 19.8, k, t, 0, 9);
    /* la scala di ferro, in primo piano, sotto una lampada in gabbia */
    F.rect(0, 0, 2.4, 56, 0.1, 0); F.line(2.8, 0, 2.8, 56, 0.42, 0, { st: 2 });
    box(F, 10, 4.6, 13, 7, 1.1 * lamp, 0.4, 1, 0); F.line(11.5, 0, 11.5, 4.4, 0.3, 0, { st: 2 });
    F.glow(11.5, 6, 9, 5, 0.6 * lamp, 1); F.cone(11.5, 7.4, -4, 24, 54, 0.16 * lamp, 1, t);
    for (i = 0; i < 5; i++) {
      y = 51 - i * 7; x = 18.6 - i * 2.2;
      F.poly([[3, y + 2.2], [x - 1, y + 3.2], [x - 3, y + 6.4], [3, y + 6.4]], 0.04, 0);
      F.poly([[3, y], [x, y + 1.2], [x, y + 2.8], [3, y + 2.2]], 0.26, 1, { st: 6 });
      F.line(3, y, x, y + 1.2, 0.8 - i * 0.04, 1); F.line(x, y + 1.2, x, y + 2.8, 0.5, 1, { st: 2 });
    }
    F.line(4, 12, 19.6, 45, 0.5, 0); for (i = 0; i < 5; i++) { F.line(6.4 + i * 2.9, 17.6 + i * 6.2, 6.4 + i * 2.9, 24 + i * 6.2, 0.3, 0, { st: 2 }); }
    /* i fusti dell'olio, la cima, gli orari */
    for (i = 0; i < 2; i++) {
      x = i ? 77 : 67; y = i ? 31.6 : 35;
      F.rect(x - 4.2, y, x + 4.2, 50, 0.08, 0); F.path([[x - 4.2, y], [x - 4.2, 50], [x + 4.2, 50], [x + 4.2, y]], 0.42, 0);
      F.ell(x, y, 4.2, 0.9, 0.2, 0); F.line(x - 4.2, y + 5, x + 4.2, y + 5, 0.26, 0, { st: 5 }); F.line(x - 4.2, y + 11, x + 4.2, y + 11, 0.26, 0, { st: 5 });
    }
    F.text(75, 39.6, "OLIO", 0.6, 0);
    for (i = 0; i < 3; i++) { ring(F, 73, 20, 2 + i * 1.3, 1.8 + i * 1, 0.34, 0, 10 + i * 4, i * 0.4, i % 2 ? 41 : 40); } F.line(73, 12.6, 73, 16.6, 0.34, 0, { st: 2 });
    box(F, 59, 20, 67, 29, 0.05, 0.36, 0); F.text(60.6, 21.6, "ORARI", 0.6, 3); for (y = 23.6; y < 28.4; y += 1.4) { F.line(60.4, y, 65.6, y, 0.2, 0, { st: 4 }); }
    cap(F);
  }

  /* ================= CALA DEL MORTO ================= */
  var CL = [[0, 0], [24, 0], [19, 5.4], [23.4, 11], [17, 16.6], [21.6, 22.6], [15, 28], [18.6, 33.6], [0, 38.6]];
  var CR = [[84, 0], [58, 0], [63.6, 6.4], [58.6, 12.6], [65, 18.6], [60.4, 24.6], [66.4, 30], [65, 32], [84, 35.4]];
  function edgeX(p, y) { for (var i = 1; i < p.length - 2; i++) { if (y >= p[i][1] && y <= p[i + 1][1]) { return p[i][0] + (y - p[i][1]) / (p[i + 1][1] - p[i][1]) * (p[i + 1][0] - p[i][0]); } } return p[p.length - 2][0]; }
  function shoreY(x) { return 33.4 - (x - 18.6) * 0.03; }
  /* old: marzo 1944, all'alba. Senza: stanotte, le undici e mezza */
  function cala(old) {
    return function (F, t) {
      var L = old ? 0.5 : 0.42, i, x, y, xe, u, br = Math.sin(t * 0.8), bob = Math.sin(t * 1.1) * 0.5, k;
      /* cielo */
      if (old) {
        F.shade(0, 0, 84, 22, function (px, py) { return 0.08 + 0.3 * smooth(4, 21, py) + 0.1 * fbm(px * 0.05 + t * 0.03, py * 0.14); }, 0, 0, "vb16");
        F.glow(42, 21, 30, 4.4, 0.26, 3);
      } else {
        F.shade(0, 0, 84, 22, function (px, py) { return 0.03 + 0.06 * fbm(px * 0.05 + t * 0.02, py * 0.1 + 8); }, 4, 0, "vb17");
        for (i = 0; i < 26; i++) { pt(F, 23 + hash(i) * 37, 1 + hash(i + 31) * 17, hash(i + Math.floor(t * 1.4 + hash(i) * 3)) > 0.22 ? (i % 6 === 0 ? 0.75 : 0.42) : 0.14, 0, 2, i % 6 === 0 ? 42 : 46); }
      }
      /* il mare */
      if (old) { F.shade(0, 21.4, 84, 37, function (px, py) { return 0.15 + 0.15 * noise(px * 0.22 + t * 0.25, py * 1.7 + t * 0.1) + 0.12 * smooth(27, 21, py); }, 4, 0, "vb18", 2); }
      else { F.shade(0, 21.4, 84, 37, function (px, py) { return 0.05 + 0.13 * noise(px * 0.22 + t * 0.25, py * 1.7 + t * 0.1); }, 4, 0, "vb19", 2); }
      F.line(0, 21.4, 84, 21.4, old ? 0.6 : 0.36, old ? 3 : 4);
      if (!old) {
        /* la barca al largo, ferma, con la lanterna */
        F.poly([[37.6, 22 + bob * 0.4], [48.4, 22 + bob * 0.4], [46.8, 24], [39.2, 24]], 0.03, 0);
        F.path([[37.6, 22 + bob * 0.4], [39.2, 24], [46.8, 24], [48.4, 22 + bob * 0.4]], 0.6, 0); F.line(37.6, 22 + bob * 0.4, 48.4, 22 + bob * 0.4, 0.5, 0);
        F.line(43, 14.6, 43 + bob * 0.3, 21.6, 0.55, 0, { st: 2 }); F.line(40, 16.6, 46, 16, 0.42, 0); F.line(43, 15, 38.6, 21.6, 0.26, 0); F.line(43, 15, 47.6, 21.6, 0.26, 0);
        pt(F, 47.6, 20.4 + bob, 1.1, 1, 0, 42); F.glow(47.6, 20.4 + bob, 5.4, 2.8, 0.5 + 0.08 * noise(t * 3, 1), 1);
        for (i = 0; i < 5; i++) { if (noise(t * 2.2 + i * 3.1, i) > 0.3) { pt(F, 47.6 + Math.sin(t * 1.5 + i * 1.3) * (0.5 + i * 0.25), 25 + i * 1.5, 0.62 - i * 0.07, 1, 0, i % 2 ? 45 : 126); } }
      } else {
        /* la foschia dell'alba, che scorre sull'acqua */
        F.shade(14, 18, 70, 30, function (px, py) { return 0.16 * fbm(px * 0.09 - t * 0.08, py * 0.5 + 2) * (1 - Math.abs(py - 24) / 6); }, 0, 1, "vb21", 3);
        gull(F, 34 + Math.sin(t * 0.3) * 8, 10 + Math.sin(t * 0.5) * 2, 0.8); gull(F, 52 + Math.sin(t * 0.24 + 1) * 6, 14 + Math.cos(t * 0.42) * 1.6, 0.6);
      }
      /* la ghiaia */
      F.shade(0, 30, 84, 56, function (px, py) { return py < shoreY(px) ? null : (old ? 0.13 : 0.06) + 0.07 * noise(px * 0.9, py * 1.4) + 0.02 * (py - 32) / 24; }, 0, 0, old ? "vb20" : "vb26");
      /* l'onda sulla ghiaia: sale, si ritira, lascia il bagnato */
      for (x = 15; x <= 68; x += 0.5) {
        y = shoreY(x) + 0.9 + br * 1.1 + 0.7 * Math.sin(x * 0.33 + t * 1.3);
        pt(F, x, y, (old ? 0.85 : 0.7) - 0.2 * noise(x * 0.7, t), old ? 3 : 0, 0, (Math.floor(x * 2) + Math.floor(t * 3)) % 3 ? 126 : 45);
        if ((Math.floor(x * 2) + Math.floor(t * 2)) % 4 < 2) { pt(F, x, y - 1.2, old ? 0.45 : 0.34, 4, 2, 45); }
        if (Math.floor(x * 2) % 5 < 2) { pt(F, x, y + 1.3, old ? 0.34 : 0.24, 0, 2, 46); }
      }
      /* le due pareti di roccia */
      F.poly(CL, old ? 0.07 : 0.035, 0); F.poly(CR, old ? 0.07 : 0.035, 0);
      for (y = 3; y < 34; y += 3.6) {
        xe = edgeX(CL, y); for (x = 0; x < xe - 3.4; x += 4.4) { u = Math.sin(x * 0.5 + y) * 0.8; F.line(x, y + u, x + 2.6, y + u + 0.4, old ? 0.24 : 0.15, 0); }
        xe = edgeX(CR, y); for (x = 82; x > xe + 3.4; x -= 4.4) { u = Math.sin(x * 0.5 + y) * 0.8; F.line(x - 2.6, y + u + 0.4, x, y + u, old ? 0.24 : 0.15, 0); }
      }
      F.path(CL.slice(1, 9), L, 0); F.path(CR.slice(1, 8), L, 0);
      F.path([[10, 0], [13, 7], [8, 13], [12.6, 20], [7.4, 27], [9.6, 35]], old ? 0.2 : 0.13, 0); F.path([[74, 0], [71, 8], [75.4, 15], [71, 23], [76, 31]], old ? 0.2 : 0.13, 0);
      /* sassi */
      for (i = 0; i < 5; i++) { x = [5, 72, 79, 56, 43][i]; y = [53, 47.6, 53.4, 54.4, 55][i]; F.ell(x, y, 1.8 + (i % 2) * 0.7, 0.8, 0.03, 0); F.line(x - 1.6, y - 0.8, x + 1.6, y - 0.8, L - 0.1, 0, { st: 5 }); }
      if (old) {
        /* la barca tirata in secco, col remo */
        F.poly([[3.6, 42.6], [20.4, 40.6], [22, 44], [19, 46.8], [6, 47.6]], 0.08, 0);
        F.path([[3.6, 42.6], [20.4, 40.6], [22, 44], [19, 46.8], [6, 47.6], [3.6, 42.6]], 0.6, 0); F.line(6, 43.6, 19.6, 42, 0.34, 0);
        F.line(9.6, 43.4, 10.2, 47, 0.26, 0, { st: 2 }); F.line(15, 42.8, 15.6, 46.6, 0.26, 0, { st: 2 }); F.line(21, 41.4, 27, 37, 0.5, 0);
        /* nove persone, di spalle, che guardano il mare */
        for (i = 0; i < 9; i++) {
          man(F, 28.6 + i * 4.5 + (i % 2) * 0.7, 47.4 + (i % 3) * 1.1, i === 4 ? 7.6 : 10.6 + (i % 4) * 0.8, { hat: i % 3 === 1 ? "none" : "fedora", rim: 0.55 });
        }
        
        /* le orme */
        for (i = 0; i < 14; i++) { pt(F, 25 + i * 3.2, 51.6 + (i % 2) * 1.1 + i * 0.2, 0.42, 0, 2, i % 2 ? 96 : 39); }
        cap(F);
        return;
      }
      /* i solchi delle gomme */
      for (x = 0; x < 10; x += 1.2) { pt(F, x, 52.2 - x * 0.1, 0.3, 0, 2, 45); pt(F, x + 0.5, 54.8 - x * 0.12, 0.3, 0, 2, 45); }
      /* l'automobile nera, a fari spenti */
      F.ell(26, 52.4, 17, 1.2, 0.02, 0);
      F.poly([[9.8, 48.6], [10.2, 45.2], [14, 43.4], [17.6, 38.8], [19.8, 37.8], [29.6, 37.8], [32.4, 39.6], [35.2, 43.4], [39.4, 44.2], [41.2, 46], [41.4, 49], [9.8, 49.8]], 0.03, 0);
      F.path([[9.8, 48.6], [10.2, 45.2], [14, 43.4], [17.6, 38.8], [19.8, 37.8], [29.6, 37.8], [32.4, 39.6], [35.2, 43.4], [39.4, 44.2], [41.2, 46], [41.4, 49]], 0.55, 0);
      F.poly([[18.8, 39.4], [24, 39], [24, 43], [16, 43]], 0.1, 4); F.path([[18.8, 39.4], [24, 39], [24, 43], [16, 43], [18.8, 39.4]], 0.3, 0);
      F.poly([[25.4, 39], [29.6, 39], [33.2, 43], [25.4, 43]], 0.1, 4); F.path([[25.4, 39], [29.6, 39], [33.2, 43], [25.4, 43], [25.4, 39]], 0.3, 0);
      F.line(20, 49.6, 31.6, 49.6, 0.3, 0, { st: 5 }); pt(F, 23.4, 44.6, 0.5, 0, 0, 45); pt(F, 32, 44.6, 0.5, 0, 0, 45);
      F.ell(16.2, 50.2, 3.3, 2.1, 0.02, 0); ring(F, 16.2, 50.2, 3.3, 2.1, 0.45, 0, 12, 0, 111); pt(F, 16.2, 50.2, 0.5, 0, 0, 43);
      F.ell(35.2, 50.2, 3.3, 2.1, 0.02, 0); ring(F, 35.2, 50.2, 3.3, 2.1, 0.45, 0, 12, 0, 111); pt(F, 35.2, 50.2, 0.5, 0, 0, 43);
      F.ell(40.4, 45.8, 0.8, 0.8, 0.26, 0); pt(F, 40.4, 45.8, 0.5, 0, 0, 79);
      /* i due uomini di Brandi, che fumano */
      man(F, 48.6, 53, 16.6, {}); k = Math.pow(Math.max(0, Math.sin(t * 0.9)), 3); ember(F, 51, 39, k, t, 0, 6);
      man(F, 55.4, 52, 15.4, {}); k = Math.pow(Math.max(0, Math.sin(t * 0.7 + 2.2)), 3); ember(F, 57.6, 39.2, k, t, 4, 5);
      /* il brigadiere Lodi, in disparte, che si guarda le scarpe */
      man(F, 75, 50.6, 13.6, { hat: "kepi" });
      /* Brandi, col cappotto di cammello */
      man(F, 65, 54, 18.4, { body: 0.4, bt: 3, rim: 0.7, rt: 3 });
      F.line(65, 39.6, 65, 50, 0.16, 0, { st: 2, mode: 0 }); pt(F, 64.4, 43.6, 0.2, 0, 0, 46); pt(F, 64.4, 46.4, 0.2, 0, 0, 46);
      cap(F);
    };
  }

  A.add({
    strada: strada(true), stradaGiorno: strada(false), casa: casa,
    torre: torre(true), torreGiorno: torre(false),
    lente: lente(false), lente4: lente(true),
    cala: cala(false), cala44: cala(true), kessel: kessel
  });
})();
