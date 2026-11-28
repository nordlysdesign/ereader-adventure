/* ==================================================================
   PER TELEFONO: «Via Libera», i quattro momenti, le tavole dei cinque
   finali e lo schema di Porto Scuro, a caratteri colorati.
   Ogni scena è una funzione (F, t, st): F è la griglia di Ascii.Field
   (84 x 56 celle), t il tempo in secondi, st lo stato (solo la mappa
   lo usa). Nel gioco la scena è ritagliata di circa 7 righe sopra e
   sotto: quello che conta sta tra le righe 8 e 48.
   Le celle sono alte quasi il doppio di quanto sono larghe: un cerchio
   si scrive con rx circa 1,7 volte ry.
   Tinte: 0 grigio-azzurro, 1 ambra, 2 rosso (una volta sola per scena),
   3 bianco caldo, 4 blu notte, 5 verde spento.
   Chiavi di cache degli sfondi: prefisso «vc».
   ================================================================== */
(function () {
  "use strict";
  var A = Ascii, K = A.kit, noise = A.noise, fbm = A.fbm, hash = A.hash, clamp = A.clamp, mix = A.mix, smooth = A.smooth;
  var PI = Math.PI;

  /* ---------- mattoni di questo file ---------- */
  /* un punto, in coordinate di scena */
  function pt(F, x, y, l, tint, mode, ch, st) { F.put(Math.round(F.X(x)), Math.round(F.Y(y)), l, tint, mode || 0, st || 0, ch || 0); }
  /* contorno chiuso */
  function ring(F, p, l, tint) { F.path(p.concat([p[0]]), l, tint); }
  /* ellisse a filo, senza riempimento */
  function oval(F, cx, cy, rx, ry, l, tint) {
    var n = Math.max(10, Math.ceil((rx + ry) * 2.4 * F.s)), i, a;
    for (i = 0; i < n; i++) { a = i / n * 2 * PI; pt(F, cx + rx * Math.cos(a), cy + ry * Math.sin(a), l, tint, 0); }
  }
  /* il mare: righe di luce che scorrono. Si rifà ogni due fotogrammi */
  function sea(F, x0, y0, x1, y1, t, key, base, amp, tint) {
    F.shade(x0, y0, x1, y1, function (px, py) { return base + amp * noise(px * 0.25 + t * 0.2, py * 1.8 + t * 0.12); }, tint === undefined ? 4 : tint, 0, key, 2);
  }
  /* stelle che tremano */
  function stars(F, t, n, x0, y0, x1, y1, seed) {
    var i, tw;
    for (i = 0; i < n; i++) {
      tw = hash(i * 3.1 + seed + Math.floor(t * 1.4 + hash(i + seed) * 5));
      pt(F, x0 + hash(seed * 17 + i) * (x1 - x0), y0 + hash(seed * 31 + i + 0.5) * (y1 - y0), i % 7 === 0 ? (tw > 0.3 ? 0.75 : 0.4) : (tw > 0.25 ? 0.45 : 0.18), 0, 2, i % 7 === 0 ? 43 : 46);
    }
  }
  /* fumo: riccioli che salgono e si perdono. o = { v, life, spread, drift, l, tint } */
  function smoke(F, x, y, t, n, o) {
    var i, a, k;
    for (i = 0; i < n; i++) {
      a = (t * o.v + i * o.life / n) % o.life; k = a / o.life;
      pt(F, x + Math.sin(t * 0.9 + i * 1.3) * o.spread * k + (o.drift || 0) * a, y - a, o.l * (1 - 0.8 * k), o.tint || 0, 2, i % 2 ? 126 : 39);
    }
  }
  /* pioggia dentro un riquadro (coordinate di scena) */
  function rainIn(F, t, x0, y0, x1, y1, n, seed) {
    var a = Math.ceil(F.X(x0)), b = Math.floor(F.X(x1)) + 1, c = Math.ceil(F.Y(y0)), d = Math.floor(F.Y(y1)) + 1;
    if (b <= a || d <= c) { return; }
    F.snow(t, n, 14, 0.3, seed, { x0: a, x1: b, y0: c, y1: d, sway: 0.2, wind: -4, ch: "/" });
    F.snow(t, Math.round(n / 2), 21, 0.55, seed + 1, { x0: a, x1: b, y0: c, y1: d, sway: 0.2, wind: -6, ch: "/'" });
  }
  /* fascio di luce in una direzione qualsiasi: da (ax, ay) a (bx, by), largo w0 alla partenza e w1 all'arrivo (in righe) */
  function beam(F, ax, ay, bx, by, w0, w1, p, tint, t) {
    var X0 = F.X(ax) * 0.6, Y0 = F.Y(ay), X1 = F.X(bx) * 0.6, Y1 = F.Y(by), dx = X1 - X0, dy = Y1 - Y0, L2 = dx * dx + dy * dy || 1, L = Math.sqrt(L2), s = F.s;
    var m = Math.max(w0, w1) * s + 1, x, y, qx, qy, k, d, hw, n;
    var xa = Math.max(0, Math.floor((Math.min(X0, X1) - m) / 0.6)), xb = Math.min(F.W - 1, Math.ceil((Math.max(X0, X1) + m) / 0.6));
    var ya = Math.max(0, Math.floor(Math.min(Y0, Y1) - m)), yb = Math.min(F.H - 1, Math.ceil(Math.max(Y0, Y1) + m));
    for (y = ya; y <= yb; y++) {
      for (x = xa; x <= xb; x++) {
        qx = x * 0.6 - X0; qy = y - Y0; k = (qx * dx + qy * dy) / L2;
        if (k < 0 || k > 1) { continue; }
        hw = mix(w0, w1, k) * s; d = Math.abs(qx * dy - qy * dx) / L;
        if (d > hw) { continue; }
        d /= hw; n = 0.75 + 0.25 * noise(x * 0.3 + t * 0.4, y * 0.4 - t * 0.3);
        F.put(x, y, p * (1 - d * d) * (1 - 0.6 * k) * n, tint, 1);
      }
    }
  }
  /* le luci si sommano: qui si ferma la somma */
  function cap(F) { var l = F.lum, i, n = l.length; for (i = 0; i < n; i++) { if (l[i] > 1.3) { l[i] = 1.3; } } }
  function scene(fn) { return function (F, t, st) { fn(F, t || 0, st || {}); cap(F); }; }

  /* ================= LA TELEFONATA A ROMA ================= */
  function telefono(F, t) {
    var i, j, sw = Math.sin(t * 1.3) * 1.2, ph = t % 9, peek = smooth(4.6, 5.2, ph) - smooth(7.2, 7.8, ph), top = 24.4 + 3 * peek, lamp = 0.85 + 0.15 * noise(t * 2, 4), y;
    F.shade(0, 0, 84, 44, function (px, py) { return 0.04 + 0.035 * noise(px * 0.14, py * 0.22); }, 0, 0, "vc1");
    F.shade(0, 44, 84, 56, function (px, py) { return 0.05 + 0.04 * noise(px * 0.2, py * 1.6); }, 0, 0, "vc2");
    F.line(0, 44, 84, 44, 0.2, 0);
    /* la finestra: la notte, un lampione lontano, la pioggia */
    F.shade(36, 8, 50, 25, function (px, py) { return 0.05 + 0.07 * fbm(px * 0.1 + t * 0.02, py * 0.15); }, 4, 0, "vc3");
    F.glow(46.4, 13, 4.4, 2.6, 0.4, 1);
    rainIn(F, t, 36.6, 8.6, 49.4, 24.4, 22, 21);
    ring(F, [[36, 8], [50, 8], [50, 25], [36, 25]], 0.5, 0);
    F.line(43, 8, 43, 25, 0.36, 0, { st: 2, mode: 0 }); F.line(36, 16.4, 50, 16.4, 0.36, 0, { mode: 0 });
    F.rect(35, 25.6, 51, 26.2, 0.34, 0, { st: 6 });
    /* il telefono a gettoni, a muro */
    F.rect(8, 8.6, 20, 11.4, 0.1, 0); F.text(10, 10, "TELEFONO", 0.9, 3);
    F.rect(7, 13, 21, 33, 0.07, 0); ring(F, [[7, 13], [21, 13], [21, 33], [7, 33]], 0.46, 0);
    F.ell(14, 20, 3.6, 2.2, 0.34, 0); F.ell(14, 20, 1.3, 0.8, 0.05, 0);
    F.rect(15.6, 14.6, 18.4, 15, 0.6, 1);                       /* la fessura dei gettoni */
    F.rect(11, 26, 17, 30, 0.04, 0); ring(F, [[11, 26], [17, 26], [17, 30], [11, 30]], 0.3, 0);
    F.line(5.4, 16, 5.4, 22, 0.4, 0, { st: 2 }); F.line(5.4, 22, 7, 22, 0.4, 0);      /* la forcella, vuota */
    /* Kessel, al tavolo: il cappello sopra il giornale */
    F.poly([[57, 40], [58.4, 31], [62, 29], [70, 29], [73.6, 31], [75, 40]], 0.05, 0);
    F.path([[57, 40], [58.4, 31], [62, 29], [70, 29], [73.6, 31], [75, 40]], 0.4, 0);
    F.ell(66, 26, 3, 2.4, 0.2, 3);
    pt(F, 64.8, 26, 0.95, 3, 0, 111); pt(F, 67.2, 26, 0.95, 3, 0, 111);         /* gli occhi: si vedono solo quando abbassa il foglio */
    F.rect(63, 20, 69, 23, 0.03, 0); F.path([[63, 23], [63, 20], [69, 20], [69, 23]], 0.62, 0);
    F.line(59.6, 23.4, 72.4, 23.4, 0.75, 0, { st: 6, mode: 0 });
    /* il giornale */
    F.rect(55, top, 77, 39.4, 0.1, 3); ring(F, [[55, top], [77, top], [77, 39.4], [55, 39.4]], 0.62, 3);
    F.line(66, top + 1, 66, 39, 0.3, 3, { st: 2, mode: 0 });
    F.text(57.6, top + 2, "BORSA", 0.85, 3); F.text(68.4, top + 2, "VALUTE", 0.85, 3);
    for (y = Math.round(top) + 4; y < 39; y += 2) { F.line(57, y, 64.4, y, 0.26, 0, { st: 4, mode: 0 }); F.line(67.6, y, 75.4, y, 0.26, 0, { st: 4, mode: 0 }); }
    F.ell(55, 34 + peek, 1.3, 1.5, 0.5, 3); F.ell(77, 34 + peek, 1.3, 1.5, 0.5, 3);
    /* il tavolo, il bicchiere */
    F.rect(51, 40, 82, 40.8, 0.42, 1, { st: 6 }); F.line(54, 41, 54, 56, 0.24, 1, { st: 2 }); F.line(79.6, 41, 79.6, 56, 0.24, 1, { st: 2 });
    F.rect(79, 37.6, 80.4, 39.4, 0.36, 0, { st: 2 });
    /* la lampada sopra il tavolo */
    F.line(66, 0, 66, 7, 0.3, 0, { st: 2 });
    F.poly([[62.6, 9.6], [69.4, 9.6], [67.6, 7.4], [64.4, 7.4]], 0.2, 0); F.rect(64.6, 9.8, 67.4, 10.2, 1.1, 1);
    F.cone(66, 10.6, 50, 82, 40, 0.15 * lamp, 1, t);
    F.glow(66, 10.4, 5, 2.4, 0.7 * lamp, 1);
    /* Ada, di spalle, la cornetta all'orecchio */
    K.ada(F, 28, 58, 1.25, 1, 0.85);
    F.line(23.6, 38.4, 23.2, 42, 0.75, 0, { st: 2 }); F.ell(23.6, 38.2, 1, 0.8, 0.7, 0);
    /* il filo, che dondola */
    for (i = 0; i <= 26; i++) { j = i / 26; pt(F, mix(23, 15, j) + Math.sin(j * PI) * sw, mix(42.4, 33, j) + Math.sin(j * PI) * 6.4, 0.5, 0, 2, i % 2 ? 40 : 41); }
  }

  /* ================= LA CONFESSIONE: LE CHIAVI DI ELIA ================= */
  function confessione(F, t) {
    var i, x, top, hx = 57.4 + 6 * smooth(-0.2, 0.9, Math.sin(t * 0.5)), g = Math.floor(t * 2.6) % 4, GL = [[40, 41.6], [49, 33.2], [46.4, 44.6], [53.4, 42.8]];
    F.shade(0, 0, 84, 20, function (px, py) { return 0.03 + 0.03 * noise(px * 0.2, py * 0.3); }, 0, 0, "vc4");
    /* lo scaffale delle bottiglie */
    for (i = 0; i < 11; i++) {
      x = 3 + i * 7.4; top = 11 - (i % 3);
      F.rect(x, top, x + 3.4, 17, 0.07, i % 4 === 1 ? 5 : 0); F.path([[x, 17], [x, top], [x + 3.4, top], [x + 3.4, 17]], 0.42, i % 4 === 1 ? 5 : 0);
      F.rect(x + 1.2, top - 2.6, x + 2.2, top - 0.6, 0.3, i % 4 === 1 ? 5 : 0, { st: 2 });
      F.rect(x + 0.8, 13.4, x + 2.6, 14.6, 0.3, 3);
      if (hash(i + Math.floor(t * 0.8)) > 0.7) { pt(F, x + 0.6, top + 1, 0.8, 1, 0, 39); }
    }
    F.rect(0, 17.6, 84, 18.4, 0.45, 0, { st: 6 });
    /* il banco di zinco, visto da sopra */
    F.shade(0, 20, 84, 56, function (px, py) { return 0.07 + 0.06 * noise(px * 0.05 + 3, py * 1.3); }, 0, 0, "vc5");
    F.line(0, 20.4, 84, 20.4, 0.5, 0, { st: 6 });
    oval(F, 70, 45.4, 4.4, 1.5, 0.2, 0);                        /* l'alone di un bicchiere */
    /* la fotografia, dalla parte della matita */
    F.poly([[10, 27.6], [39, 26], [40.6, 44.4], [11.6, 46]], 0.02, 0);
    F.poly([[9, 26.6], [38, 25], [39.6, 43.4], [10.6, 45]], 0.1, 3);
    ring(F, [[9, 26.6], [38, 25], [39.6, 43.4], [10.6, 45]], 0.62, 3);
    F.text(13, 29, "N. -", 0.85, 0); F.text(13, 33, "SE SUCCEDE", 0.85, 0); F.text(13, 37, "LA LUCE", 0.85, 0); F.text(13, 41, "E TUA", 0.85, 0);
    /* la lampada del banco, riflessa nello zinco */
    F.glow(44 + 2 * Math.sin(t * 0.6), 34, 26, 10, 0.08, 1);
    /* il mazzo di chiavi */
    oval(F, 49, 35, 3.2, 1.9, 0.85, 1);
    F.line(46.6, 36.4, 40.6, 40.6, 0.85, 1); F.rect(39.6, 41, 40.6, 42.4, 0.8, 1); F.rect(42, 40.4, 42.6, 41.4, 0.7, 1);
    F.line(48.4, 37, 45.4, 44, 0.75, 1); F.rect(45.4, 44.4, 47.4, 44.8, 0.75, 1);
    F.line(50.6, 37, 52.4, 43, 0.85, 1); F.rect(52.6, 42.6, 54, 43, 0.75, 1);
    F.glow(47, 39.6, 10, 5.4, 0.16, 1);
    pt(F, GL[g][0], GL[g][1], 1.2, 3, 0, 42); F.glow(GL[g][0], GL[g][1], 4, 2.2, 0.45, 1);
    /* la mano di Nives, che le ha appena posate */
    F.poly([[84, 26], [84, 41], [hx + 11, 39.4], [hx + 9, 32.4]], 0.13, 0);
    F.path([[84, 26], [hx + 9, 32.4], [hx + 11, 39.4], [84, 41]], 0.5, 0);
    F.line(hx + 9, 32.4, hx + 11, 39.4, 0.8, 3, { st: 2 });
    F.ell(hx + 5.4, 35.8, 3.8, 2.3, 0.5, 3);
    for (i = 0; i < 4; i++) { F.line(hx + 2, 34 + i * 1.2, hx - 3.6 + (i === 3 ? 1.6 : 0) + (i === 0 ? 1 : 0), 34.2 + i * 1.3, 0.56, 3, { st: 4 }); }
    F.line(hx + 4, 33.2, hx + 0.6, 32.2, 0.5, 3, { st: 4 });
  }

  /* ================= LO SPORTELLO APERTO ================= */
  function quaderno(F, t) {
    var i, bx = -26 + ((t * 0.2) % 1) * 136, sw = Math.sin(t * 1.7) * 0.8, spill = Math.max(0, 1 - Math.abs(bx - 49) / 44);
    /* la lente, da sotto: i prismi, e la luce che passa e ripassa */
    F.shade(0, 0, 84, 17, function (px, py) { return 0.03 + 0.03 * noise(px * 0.2, py * 0.5); }, 0, 0, "vc6");
    for (i = 0; i < 6; i++) { F.line(0, 5 + i * 2, 84, 5 + i * 2, 0.2 + 0.05 * (i % 2), 0, { st: i % 2 ? 6 : 4 }); }
    F.glow(bx, 11, 32, 10, 0.85, 1); F.glow(bx, 11, 12, 5, 0.55, 1);
    for (i = 0; i < 5; i++) { F.line(bx, 11, bx - 30 + i * 15, 0, 0.5, 1); }
    F.rect(0, 17, 84, 18.4, 0.3, 0, { st: 6 });
    for (i = 0; i < 14; i++) { pt(F, 3 + i * 6, 17.6, 0.6, 0, 0, 111); }
    /* il basamento di ghisa */
    F.shade(0, 19, 84, 56, function (px, py) { return 0.05 + 0.04 * noise(px * 0.3, py * 0.4); }, 0, 0, "vc7");
    ring(F, [[8, 21], [76, 21], [76, 53], [8, 53]], 0.28, 0);
    for (i = 0; i < 12; i++) { pt(F, 11 + i * 5.6, 22.4, 0.36, 0, 0, 46); }
    /* l'apertura: buio, e dentro il quaderno nella tela cerata */
    F.rect(34, 24, 64, 48, 0.015, 0);
    F.poly([[34, 24], [64, 24], [64, 25.6], [34, 28]], 0.06, 0);
    F.glow(50, 40, 15, 8, 0.07 + 0.2 * spill, 1);
    F.poly([[40, 35], [58, 33.4], [59.6, 44], [41.6, 45.6]], 0.13, 0);
    ring(F, [[40, 35], [58, 33.4], [59.6, 44], [41.6, 45.6]], 0.7, 3);
    F.line(44, 34.8, 45.4, 45.2, 0.3, 0, { mode: 0 }); F.line(40.6, 35.4, 49, 39.4, 0.3, 0, { mode: 0 }); F.line(59, 43.6, 52, 40, 0.3, 0, { mode: 0 });
    F.line(54, 33.8, 55.4, 44.4, 0.6, 3, { st: 2, mode: 0 });                          /* lo spago */
    F.poly([[44, 45.6], [49.4, 45.2], [49, 46.6], [43.6, 46.8]], 0.6, 3);            /* un angolo di carta che esce */
    ring(F, [[34, 24], [64, 24], [64, 48], [34, 48]], 0.55, 0);
    /* lo sportello, spalancato */
    F.poly([[34, 24], [21, 21.6], [21, 50.4], [34, 48]], 0.11, 0);
    ring(F, [[34, 24], [21, 21.6], [21, 50.4], [34, 48]], 0.5, 0);
    F.path([[32, 26.4], [23, 24.6], [23, 47.6], [32, 45.8]], 0.22, 0);
    F.rect(26.6, 34, 28.6, 36.4, 0.4, 0);
    /* la chiavetta d'ottone nella toppa, e il mazzo che dondola */
    F.ell(25.6, 35.2, 1, 0.7, 0.9, 1); F.glow(25.6, 35.2, 4, 2.4, 0.3 + 0.2 * spill, 1);
    oval(F, 25.2 + sw, 38.6, 1.9, 1.2, 0.7, 1);
    F.line(24.4 + sw, 40, 23 + sw * 2, 46, 0.8, 1); F.line(26.2 + sw, 40, 27.6 + sw * 2, 45, 0.6, 1);
    if (Math.floor(t * 2) % 3 === 0) { pt(F, 23 + sw * 2, 46, 1.15, 3, 0, 42); }
    /* la polvere, nella luce */
    F.snow(t, 14, 0.6, 0.3, 31, { x0: 0, x1: 84, y0: Math.max(0, Math.round(F.Y(4))), y1: Math.max(1, Math.round(F.Y(17))), sway: 2 });
  }

  /* ================= BRANDI E IL FOGLIO DEL '44 ================= */
  function foglio(F, t) {
    var i, fl = 0.72 + 0.28 * noise(t * 5, 2), wob = 0.6 * (noise(t * 4, 7) - 0.5), fw = 0.3 * Math.sin(t * 2.1), y;
    F.shade(0, 0, 84, 17, function (px, py) { return 0.035 + 0.05 * fbm(px * 0.05 + t * 0.01, py * 0.12); }, 4, 0, "vc8");
    stars(F, t, 26, 0, 8, 84, 16, 3);
    sea(F, 0, 17, 84, 22, t, "vc9", 0.06, 0.12);
    F.line(0, 17, 84, 17, 0.24, 4);
    F.shade(0, 22, 84, 56, function (px, py) { return 0.04 + 0.05 * noise(px * 0.4, py * 0.9); }, 0, 0, "vc10");
    for (i = 0; i < 84; i += 2) { pt(F, i + 0.5, 22.2 + 0.6 * Math.sin(i * 0.3 + t * 0.8), 0.26, 4, 2, 126); }
    /* l'automobile nera, dietro */
    F.poly([[54, 22], [54.6, 18], [59, 17.4], [62, 14], [73, 14], [76.4, 17.4], [82.4, 18.4], [83, 22]], 0.025, 0);
    F.path([[54, 22], [54.6, 18], [59, 17.4], [62, 14], [73, 14], [76.4, 17.4], [82.4, 18.4], [83, 22]], 0.44, 0);
    F.rect(63, 15, 67, 16.8, 0.09, 4); F.rect(69, 15, 73, 16.8, 0.09, 4); F.line(68, 14.4, 68, 21.6, 0.2, 0, { st: 2 });
    F.ell(60, 22.2, 2.4, 1.4, 0.02, 0); oval(F, 60, 22.2, 2.4, 1.4, 0.36, 0); F.ell(77.4, 22.2, 2.4, 1.4, 0.02, 0); oval(F, 77.4, 22.2, 2.4, 1.4, 0.36, 0);
    pt(F, 54.6, 19.4, 0.55, 0, 0, 111);
    /* Brandi: cappotto chiaro, cappello, sciarpa */
    F.poly([[2, 56], [4, 36], [10, 30.6], [30, 30.6], [36, 36], [38, 56]], 0.06, 3);
    F.path([[2, 56], [4, 36], [10, 30.6], [30, 30.6], [36, 36], [38, 56]], 0.72, 3);
    F.path([[15, 31], [20, 43], [25, 31]], 0.5, 3); F.line(20, 43, 20, 56, 0.4, 3, { st: 2 });
    pt(F, 22, 45.6, 0.7, 3, 0, 111); pt(F, 22, 48.6, 0.7, 3, 0, 111);
    F.line(8, 40, 8.6, 56, 0.3, 3, { st: 2 }); F.line(32, 40, 31.4, 56, 0.3, 3, { st: 2 });
    F.ell(20, 25.4, 4.2, 3.2, 0.42, 3);
    F.rect(16.4, 23, 23.6, 23.6, 0.08, 0);                       /* l'ombra della tesa sugli occhi */
    F.line(19.6, 27.4, 22.2, 27, 0.1, 0, { mode: 0 });           /* il mezzo sorriso */
    F.path([[24, 24], [24.4, 25.6], [23.4, 27.6]], 0.6 + 0.3 * fl, 1);
    F.poly([[14, 28.8], [26, 28.8], [27, 31.6], [20, 33.4], [13, 31.6]], 0.03, 0);
    F.path([[14, 28.8], [26, 28.8], [27, 31.6], [20, 33.4], [13, 31.6], [14, 28.8]], 0.46, 0);
    F.poly([[14, 31.6], [17.4, 32.4], [16.6, 40], [13.4, 40]], 0.03, 0); F.path([[14, 31.6], [13.4, 40], [16.6, 40], [17.4, 32.4]], 0.46, 0);
    F.poly([[14.6, 22], [15.6, 16.4], [24.4, 16.4], [25.4, 22]], 0.04, 0); F.path([[14.6, 22], [15.6, 16.4], [24.4, 16.4], [25.4, 22]], 0.66, 3);
    F.line(15, 20.6, 25, 20.6, 0.4, 0, { mode: 0 });
    F.line(10.6, 22.4, 29.4, 22.4, 0.8, 3, { st: 6, mode: 0 });
    /* il braccio, il guanto */
    F.poly([[30, 31.6], [36, 31], [47, 33.6], [46, 38.6], [34, 39]], 0.06, 3);
    F.path([[32, 31], [36, 31], [47, 33.6]], 0.7, 3); F.path([[46, 38.6], [35, 39]], 0.6, 3);
    /* il foglio, piegato in quattro */
    F.poly([[46, 24.6 + fw], [72, 23.4 - fw], [73.4, 40], [47.4, 41.2]], 0.1, 3);
    ring(F, [[46, 24.6 + fw], [72, 23.4 - fw], [73.4, 40], [47.4, 41.2]], 0.72, 3);
    F.line(46.8, 32.9, 72.7, 31.7, 0.3, 3, { mode: 0 }); F.line(59, 24.4, 60.4, 40.4, 0.3, 3, { st: 2, mode: 0 });
    F.text(49, 28, "MARZO 1944", 0.9, 3);
    F.text(49, 30, "-- --- - -- ---", 0.3, 0);
    F.text(50, 36, "VIA LIBERA", 1, 3);
    F.path([[62, 38.6], [64, 37.6], [65.4, 38.8], [67.4, 37.4], [70, 38.4]], 0.5, 0);
    F.ell(46.6, 36, 2.4, 2, 0.04, 0); oval(F, 46.6, 36, 2.4, 2, 0.5, 0);
    /* il fiammifero, in mano ad Ada */
    F.ell(55, 49.6, 3, 1.8, 0.4, 3);
    F.line(55.4, 48, 56, 45, 0.6, 3, { st: 2 });
    y = 43.8;
    F.glow(56 + wob, y - 2, 26, 14, 0.28 * fl, 1);
    F.glow(56 + wob, y, 7, 3.6, 0.4 * fl, 1);
    F.ell(56 + wob * 0.5, y, 0.7, 0.9, 1.2, 1); pt(F, 56 + wob, y - 1.4, 0.95 * fl, 1, 0, 39);
    F.glow(22, 26, 9, 6, 0.1 * fl, 1);
    smoke(F, 56.4, y - 2, t, 4, { v: 2, life: 5, spread: 1.2, l: 0.22 });
  }

  /* ================= FINALE: IL LAVORO ================= */
  function finLavoro(F, t) {
    var i, px = 46 - 14 * ((t % 60) / 60), fl = 0.7 + 0.3 * noise(t * 4, 5), x, h;
    /* l'alba: il cielo si schiarisce dal basso */
    F.shade(0, 0, 84, 26, function (qx, qy) { return 0.05 + 0.09 * fbm(qx * 0.045 + t * 0.012, qy * 0.1) + 0.2 * smooth(9, 26, qy) * (1 - 0.5 * smooth(20, 80, qx)); }, 0, 0, "vc11");
    F.glow(16, 26, 30, 7, 0.34, 3);
    sea(F, 0, 26, 84, 38, t, "vc12", 0.08, 0.14, 0);
    F.line(0, 26, 84, 26, 0.3, 0);
    for (i = 0; i < 10; i++) { pt(F, 16 + (hash(i + Math.floor(t * 2)) - 0.5) * (4 + i * 1.6), 27 + i, 0.6, 3, 2, 0, 4); }
    /* il faro, in fondo: spento */
    F.poly([[66, 26], [72, 23.4], [84, 21.6], [84, 26]], 0.03, 0); F.path([[66, 26], [72, 23.4], [84, 21.6]], 0.4, 0);
    F.rect(76.6, 12, 79.4, 22, 0.04, 0); F.line(76.6, 12, 76.6, 22, 0.46, 0, { st: 2 }); F.line(79.4, 12, 79.4, 22, 0.46, 0, { st: 2 });
    F.rect(76, 9.6, 80, 11.6, 0.05, 0); ring(F, [[76, 9.6], [80, 9.6], [80, 11.6], [76, 11.6]], 0.42, 0); F.path([[75.6, 9.4], [78, 7.8], [80.4, 9.4]], 0.42, 0);
    /* il piroscafo che arriva */
    F.poly([[px, 24], [px + 26, 24], [px + 24, 26.6], [px + 2, 26.6]], 0.03, 0); F.line(px, 23.8, px + 26, 23.8, 0.6, 0, { st: 6 });
    F.rect(px + 7, 21.6, px + 19, 23.4, 0.04, 0); F.path([[px + 7, 23.4], [px + 7, 21.4], [px + 19, 21.4], [px + 19, 23.4]], 0.5, 0);
    F.rect(px + 12, 17.6, px + 14.4, 21, 0.05, 0); F.line(px + 11.8, 17.6, px + 11.8, 21, 0.5, 0, { st: 2 }); F.line(px + 14.6, 17.6, px + 14.6, 21, 0.5, 0, { st: 2 });
    F.line(px + 3.6, 19, px + 3.6, 23.6, 0.4, 0, { st: 2 });
    pt(F, px + 9.4, 22.6, 0.75, 1); pt(F, px + 13, 22.6, 0.75, 1); pt(F, px + 16.6, 22.6, 0.75, 1);
    smoke(F, px + 13.2, 16.6, t, 14, { v: 0.9, life: 8, spread: 1.4, drift: 1.6, l: 0.4 });
    /* il molo */
    F.poly([[0, 38], [84, 36.4], [84, 56], [0, 56]], function (qx, qy) { return 0.09 + 0.05 * noise(qx * 0.5, qy * 0.8); }, 0);
    for (i = 0; i < 5; i++) { F.line(0, 41 + i * 3.4, 84, 39.4 + i * 3.8, 0.2, 0, { st: 4 }); }
    F.line(0, 38, 84, 36.4, 0.48, 0);
    F.rect(68.6, 32.6, 71.4, 37, 0.06, 0); F.path([[68.6, 37], [68.6, 32.6], [71.4, 32.6], [71.4, 37]], 0.45, 0); F.line(67.8, 32.4, 72.2, 32.4, 0.5, 0, { st: 6 });
    /* il foglio che brucia, per terra */
    F.glow(54, 44.4, 18, 7, 0.3 * fl, 1);
    F.poly([[48, 45.4], [58, 44.4], [59.4, 46.6], [49.4, 47.6]], 0.5, 3);
    F.poly([[48, 45.4], [52.4, 45], [53.6, 47.2], [49.4, 47.6]], 0.03, 0);
    for (i = 0; i < 5; i++) {
      x = 50.4 + i * 1.7; h = 1.2 + 3 * noise(t * 4.4 + i * 1.7, i + 2);
      F.poly([[x - 1, 45.6], [x + 0.6 * Math.sin(t * 6 + i * 2), 45.6 - h], [x + 1, 45.6]], 0.75 + 0.3 * noise(t * 7, i), 1);
    }
    F.glow(54, 44, 6, 3.4, 0.2 * fl, 1);
    smoke(F, 54, 41, t, 11, { v: 2.2, life: 12, spread: 2.4, drift: 0.25, l: 0.4 });
    for (i = 0; i < 3; i++) { pt(F, 53 + 4 * Math.sin(t * 1.3 + i * 2.1), 43 - ((t * 3 + i * 2.3) % 7), 0.9, 1, 2, 46); }     /* faville */
    /* Ada, di spalle */
    K.ada(F, 26, 58, 1.2, 1, 0.5 + 0.3 * fl);
  }

  /* ================= FINALE: IL PASSAPORTO ================= */
  function finPassaporto(F, t) {
    var i, k = (t % 50) / 50, sc = 1 - 0.4 * k, cx = 30 + 3 * k, x, y, j;
    F.shade(0, 0, 84, 22, function (px, py) { return 0.07 + 0.1 * fbm(px * 0.045 + t * 0.012, py * 0.1 + 2); }, 0, 0, "vc13");
    /* il fumo del fumaiolo, che resta indietro */
    F.shade(34, 0, 84, 19, function (px, py) {
      var d = Math.abs(py - (5 + (84 - px) * 0.24)), w = 1.6 + (px - 34) * 0.1, l = 0.42 * Math.max(0, 1 - d / w) * (0.35 + 0.9 * fbm(px * 0.16 + t * 0.6, py * 0.4 - t * 0.1));
      return l < 0.05 ? null : l;
    }, 0, 2, "vc14", 2);
    /* la costa, col faro, che si allontana */
    F.poly([[cx - 16 * sc, 22], [cx - 8 * sc, 22 - 2.4 * sc], [cx + 4 * sc, 22 - 3.2 * sc], [cx + 14 * sc, 22 - 1.6 * sc], [cx + 20 * sc, 22]], 0.03, 0);
    F.path([[cx - 16 * sc, 22], [cx - 8 * sc, 22 - 2.4 * sc], [cx + 4 * sc, 22 - 3.2 * sc], [cx + 14 * sc, 22 - 1.6 * sc], [cx + 20 * sc, 22]], 0.42, 0);
    F.line(cx + 6 * sc, 22 - 3 * sc, cx + 6 * sc, 22 - 8.4 * sc, 0.55, 0, { st: 2 });
    pt(F, cx + 6 * sc, 22 - 9 * sc, 0.6, 0, 2, 94);
    /* il mare, e la scia */
    sea(F, 0, 22, 84, 50, t, "vc15", 0.07, 0.12);
    F.line(0, 22, 84, 22, 0.3, 4);
    for (i = 0; i < 18; i++) {
      j = i / 17; y = 23.4 + j * 16;
      if (hash(i + Math.floor(t * 3)) > 0.3) { pt(F, mix(cx + 1, 14, j), y, 0.26 + 0.3 * j, 0, 2, 126); pt(F, mix(cx + 3, 56, j), y, 0.26 + 0.3 * j, 0, 2, 126); }
      if (hash(i * 3 + Math.floor(t * 2)) > 0.6) { pt(F, mix(cx + 2, 35, j) + (hash(i + Math.floor(t * 2)) - 0.5) * 20 * j, y, 0.3, 0, 2, 45); }
    }
    /* due gabbiani */
    for (i = 0; i < 2; i++) { x = (20 + i * 37 + t * (2.2 + i)) % 84; y = 11 + i * 4 + Math.sin(t * 0.7 + i * 2) * 1.2; pt(F, x, y, 0.6, 0, 2, Math.floor(t * 2 + i) % 2 ? 118 : 94); }
    /* la ringhiera di poppa, il ponte */
    F.rect(0, 50, 84, 56, 0.08, 0); F.line(0, 50, 84, 50, 0.4, 0, { st: 6 }); F.line(0, 53, 84, 53, 0.16, 0);
    for (x = 5; x < 84; x += 13) { F.line(x, 40, x, 50, 0.4, 0, { st: 2 }); }
    F.rect(0, 39.6, 84, 40.4, 0.52, 0, { st: 6 }); F.line(0, 45, 84, 45, 0.34, 0);
    /* il passaporto aperto, in primo piano */
    F.poly([[41, 33.6], [58, 32.6], [58, 45.4], [42, 46.4]], 0.08, 3); F.poly([[58, 32.6], [75, 33.6], [74, 46.4], [58, 45.4]], 0.08, 3);
    ring(F, [[41, 33.6], [58, 32.6], [75, 33.6], [74, 46.4], [58, 45.4], [42, 46.4]], 0.72, 3);
    F.line(58, 32.6, 58, 45.4, 0.5, 3, { st: 2, mode: 0 });
    F.text(45, 35, "PASSEPORT", 0.85, 3);
    F.rect(45, 37.4, 49.6, 43, 0.2, 0); ring(F, [[45, 37.4], [49.6, 37.4], [49.6, 43], [45, 43]], 0.45, 0); F.ell(47.3, 39.4, 1, 0.8, 0.5, 0);
    F.text(52, 38, "-----", 0.36, 0); F.text(52, 40, "---", 0.36, 0); F.text(52, 42, "----", 0.36, 0);
    F.text(61, 35, "VISA", 0.5, 0);
    /* il timbro: l'unico rosso */
    oval(F, 67, 40, 5.6, 3.2, 0.85, 2);
    F.text(63, 39, "MARSEILLE", 0.95, 2); F.text(64, 41, "NOV 53", 0.8, 2);
    F.ell(46.4, 46.8, 2.4, 1.3, 0.45, 3);                        /* il pollice */
  }

  /* ================= FINALE: MARE VUOTO ================= */
  function finMare(F, t) {
    var i, k = (t % 26) / 26, s = 1 - 0.72 * k, bx = 48 + 27 * k, by = 33 - 7.4 * k + 1.6 * Math.sin(k * PI), fade = smooth(0, 0.06, k) * (1 - smooth(0.9, 1, k)), fl = 0.85 + 0.15 * noise(t * 2.2, 6);
    F.shade(26, 0, 84, 24, function (px, py) { return 0.035 + 0.05 * fbm(px * 0.05 + t * 0.01, py * 0.12); }, 4, 0, "vc16");
    stars(F, t, 30, 28, 8, 84, 23, 5);
    sea(F, 26, 24, 84, 56, t, "vc17", 0.05, 0.1);
    F.line(26, 24, 84, 24, 0.22, 4);
    /* la barca che vira e se ne va: una lanterna, nient'altro */
    for (i = 1; i < 7; i++) { pt(F, bx - i * 2.4 * s - i * 0.6, by + 0.4 + i * 0.5 * s, 0.3 * fade * (1 - i / 8), 4, 2, i % 2 ? 126 : 45); }
    F.line(bx - 2.6 * s, by, bx + 2.6 * s, by, 0.4 * fade, 0, { st: 5 });
    F.glow(bx, by - 1, 3 + 4 * s, 1.4 + 1.8 * s, 0.55 * fade, 1);
    pt(F, bx, by - 1, 1.15 * fade, 1, 0, 42);
    for (i = 1; i < 4; i++) { if (hash(i + Math.floor(t * 3)) > 0.4) { pt(F, bx + (hash(i * 5 + Math.floor(t * 3)) - 0.5) * 2, by + i, 0.5 * fade * s, 1, 2, 45); } }
    /* la locanda: il muro, l'insegna, la porta accesa */
    F.shade(0, 0, 26, 42, function (px, py) { return 0.045 + 0.05 * noise(px * 0.5, py * 0.8); }, 0, 0, "vc18");
    F.line(26, 0, 26, 42, 0.42, 0, { st: 2 });
    F.rect(5, 9, 10, 15, 0.025, 0); ring(F, [[5, 9], [10, 9], [10, 15], [5, 15]], 0.26, 0);       /* una finestra buia */
    F.rect(7, 16.6, 20, 19.4, 0.08, 0); ring(F, [[7, 16.6], [20, 16.6], [20, 19.4], [7, 19.4]], 0.45, 0);
    F.text(11, 18, "FANALE", 0.9, 3);
    F.glow(13.5, 31, 13, 14, 0.2 * fl, 1);
    F.rect(8, 22, 19, 42, 0.78 * fl, 1);
    F.path([[8, 42], [8, 22], [19, 22], [19, 42]], 0.5, 0);
    /* Nives, sulla soglia, che guarda */
    F.poly([[10, 42], [11.2, 35], [11.2, 31.4], [12.4, 29.6], [15, 29.6], [16.2, 31.4], [16.2, 35], [17.6, 42]], 0.03, 0);
    F.ell(13.8, 27.6, 1.9, 1.5, 0.03, 0); F.ell(12.6, 26.6, 1.2, 0.8, 0.03, 0);
    F.line(16.2, 31.6, 18.4, 30.6, 0.03, 0, { mode: 0 }); F.line(18.4, 30.6, 18.6, 28.4, 0.03, 0, { mode: 0 });   /* la mano sullo stipite */
    /* la soglia, e la luce che esce sul selciato */
    F.poly([[0, 42], [30, 42], [42, 56], [0, 56]], function (px, py) { return 0.06 + 0.04 * noise(px * 0.5, py * 0.9); }, 0);
    F.line(0, 42, 30, 42, 0.36, 0); F.line(30, 42, 42, 56, 0.36, 0);
    F.cone(13.5, 42.4, 3, 34, 56, 0.5 * fl, 1, t);
    F.glow(13.5, 43.4, 9, 2.6, 0.4 * fl, 1);
    F.poly([[11.4, 42.6], [15.8, 42.6], [20, 49], [12, 49]], 0.05, 0);                 /* la sua ombra */
  }

  /* ================= FINALE: NESSUNA DECISIONE ================= */
  function finAttesa(F, t) {
    var i, x, mx = 60 - 9 * ((t % 40) / 40), on = 0.82 + 0.18 * noise(t * 3, 8), up;
    /* le cinque e quaranta: luce livida */
    F.shade(0, 0, 84, 26, function (px, py) { return 0.05 + 0.07 * fbm(px * 0.045 + t * 0.012, py * 0.1) + 0.1 * smooth(14, 26, py); }, 0, 0, "vc19");
    sea(F, 0, 26, 84, 56, t, "vc20", 0.045, 0.085, 0);
    F.line(0, 26, 84, 26, 0.42, 0);
    /* la barca ferma al largo, sei persone con le mani alzate */
    F.poly([[9, 33.4], [31, 33.4], [29, 35.6], [11, 35.6]], 0.04, 0); F.path([[9, 33.4], [11, 35.6], [29, 35.6], [31, 33.4]], 0.5, 0); F.line(9, 33.4, 31, 33.4, 0.5, 0, { st: 6 });
    for (i = 0; i < 6; i++) {
      x = 12.4 + i * 3; up = (i + Math.floor(t * 1.2 + i * 0.4)) % 5 === 0;
      pt(F, x, 32, 0.4, 0, 0, up ? 86 : 89); pt(F, x, 31, 0.4, 0, 0, 111);
    }
    /* la motovedetta */
    F.poly([[mx, 33.6], [mx + 30, 31.4], [mx + 30, 38], [mx + 4.4, 38]], 0.05, 0);
    F.path([[mx + 30, 31.4], [mx, 33.6], [mx + 4.4, 38], [mx + 30, 38]], 0.62, 0);
    F.rect(mx + 11, 27, mx + 23, 31.6, 0.06, 0); F.path([[mx + 11, 31.6], [mx + 11, 27], [mx + 23, 27], [mx + 23, 31.6]], 0.46, 0);
    for (i = 0; i < 3; i++) { F.rect(mx + 13 + i * 3.4, 28.4, mx + 14.4 + i * 3.4, 29.4, 0.6, 1); }
    F.line(mx + 19, 18, mx + 19, 27, 0.44, 0, { st: 2 }); F.line(mx + 16.6, 20.6, mx + 21.4, 20.6, 0.4, 0);
    pt(F, mx + 20.4 + (Math.floor(t * 3) % 2), 18.6, 0.5, 0, 2, 126);
    F.text(mx + 12, 35, "AMM 7", 0.6, 0);
    pt(F, mx + 3, 34.4, 1, 2, 0, 111); F.glow(mx + 3, 34.4, 3.4, 1.8, 0.4, 2);           /* il fanale di via: rosso */
    for (i = 0; i < 5; i++) { pt(F, mx - 1 - i * 1.4 + Math.sin(t * 3 + i), 38 + (i % 2) * 0.8, 0.5 - i * 0.07, 0, 2, 126); }
    /* il riflettore, che inquadra la barca */
    beam(F, mx + 10, 26.2, 20, 32.2, 0.5, 5, 0.62 * on, 1, t);
    F.glow(20, 34, 17, 4, 0.3 * on, 1);
    F.ell(mx + 10.6, 26, 1.2, 0.9, 1.2, 1); F.glow(mx + 10.6, 26, 5, 2.6, 0.7 * on, 1);
    /* la cala, vuota */
    F.poly([[0, 42.6], [28, 41.4], [52, 43.6], [72, 48], [84, 53], [84, 56], [0, 56]], 0.025, 0);
    F.path([[0, 42.6], [28, 41.4], [52, 43.6], [72, 48], [84, 53]], 0.6, 0);
    for (i = 0; i < 28; i += 2) { pt(F, 2 + i * 2.6, 41.4 + 0.5 * Math.sin(i * 0.5 + t * 0.9) + (i > 10 ? (i - 10) * 0.16 : 0), 0.34, 0, 2, 126); }
    for (i = 0; i < 9; i++) { pt(F, 4 + hash(i + 3) * 60, 44.6 + hash(i + 11) * 3, 0.03, 0, 0); pt(F, 5 + hash(i + 3) * 60, 44.6 + hash(i + 11) * 3, 0.4, 0, 0, i % 2 ? 111 : 46); }
  }

  /* ================= FINALE: LA GUARDIANA ================= */
  function finGuardiana(F, t) {
    var i, a = t * 0.85, c = Math.cos(a), s = Math.sin(a), ac = Math.abs(c), face = Math.max(0, s), puff = Math.pow(Math.max(0, Math.sin(t * 1.1)), 8), sg, x;
    F.shade(0, 0, 84, 42, function (px, py) { return 0.03 + 0.05 * fbm(px * 0.05 + t * 0.01, py * 0.1); }, 4, 0, "vc21");
    stars(F, t, 46, 0, 7, 84, 40, 9);
    sea(F, 0, 42, 84, 56, t, "vc22", 0.05, 0.1);
    F.line(0, 42, 84, 42, 0.22, 4);
    /* il fascio che gira, sul mare e sulle stelle */
    for (i = 0; i < 2; i++) {
      sg = i ? -1 : 1;
      beam(F, 42 + sg * 4, 22, 42 + sg * c * 64, 22 + sg * s * 4.5 - 2 * ac, 1.3, 3 + 8 * (1 - ac), 0.6 * (0.25 + 0.75 * ac), 1, t);
      F.glow(42 + sg * c * 30, 46.4, 16, 3, 0.26 * ac, 1);
    }
    /* la torre */
    F.poly([[34.6, 36], [49.4, 36], [53, 56], [31, 56]], function (px, py) { return Math.floor((py - 36) / 4) % 2 ? 0.05 : 0.11; }, 0);
    F.line(34.6, 36, 31, 56, 0.46, 0, { st: 2 }); F.line(49.4, 36, 53, 56, 0.46, 0, { st: 2 });
    /* la lanterna: i vetri, la lente accesa, il tetto */
    F.rect(34, 15, 50, 29, 0.05, 0);
    F.ell(42, 22, 4.6, 4.6, 0.75 + 0.45 * face, 1);
    for (i = 0; i < 4; i++) { F.line(38, 19.2 + i * 2, 46, 19.2 + i * 2, 0.5 + 0.3 * face, 1, { st: 6, mode: 0 }); }
    for (x = 34; x <= 50; x += 4) { F.line(x, 15, x, 29, 0.46, 0, { st: 2, mode: 0 }); }
    F.glow(42, 22, 15, 9, 0.45 + 0.4 * face, 1);
    F.poly([[32, 15], [42, 8.6], [52, 15]], 0.07, 0); F.path([[32, 15], [42, 8.6], [52, 15]], 0.55, 0); F.line(32, 15, 52, 15, 0.4, 0, { st: 6 });
    F.line(42, 6.6, 42, 8.6, 0.5, 0, { st: 2 });
    F.rect(33, 29.4, 51, 30.4, 0.24, 0, { st: 6 });
    /* Ada, piccola, sul ballatoio: fuma */
    K.ada(F, 58, 34.8, 0.56, -1, 0.5 + 0.3 * face);
    pt(F, 62.4, 27.4, 0.75 + 0.5 * puff, 2, 0, 42); F.glow(62.4, 27.4, 2.4 + 2 * puff, 1.4 + puff, 0.25 + 0.4 * puff, 2);
    smoke(F, 63, 26.4, t, 7, { v: 1.3, life: 9, spread: 1.6, drift: 0.5, l: 0.36 });
    /* il ballatoio, con la ringhiera */
    for (x = 21; x <= 66; x += 3) { F.line(x, 31, x, 34.4, 0.3, 0, { st: 2 }); }
    F.line(20, 30.6, 67, 30.6, 0.55, 0);
    F.rect(20, 34.8, 67, 35.8, 0.4, 0, { st: 6 });
    F.line(24, 36.4, 34.4, 39.4, 0.3, 0); F.line(63, 36.4, 49.6, 39.4, 0.3, 0);
  }

  /* ================= LA MAPPA DI PORTO SCURO ================= */
  /* Uno schema, non una tavola. st = { visited: { stanza: 1 }, room: "stanza", cala: 0|1 } */
  var PLACE = { molo: [36, 46, "MOLO"], piazza: [36, 38, "PIAZZA"], locanda: [54, 38, "LOCANDA"], caserma: [17, 38, "POLIZIA"], strada: [36, 28, "SENTIERO"], casa: [50, 26, "CASA"], faro: [70, 12, "FARO"], cala: [63, 33, "CALA"] };
  var LINK = [["molo", "piazza"], ["piazza", "locanda"], ["piazza", "caserma"], ["piazza", "strada"], ["strada", "casa"], ["strada", "faro"], ["strada", "cala"]];
  var ALIAS = { camera: "locanda", lanterna: "faro" };
  /* la costa a est: [riga, colonna]. Il promontorio del faro in alto, l'insenatura della cala a metà */
  var EAST = [[-2, 73], [5, 79], [9, 82], [14, 81], [18, 75], [22, 69], [27, 67], [31, 69], [33, 65.4], [35.6, 69], [40, 66], [43, 61], [60, 61]];
  function eastX(y) {
    var i;
    if (y <= EAST[0][0]) { return EAST[0][1]; }
    for (i = 1; i < EAST.length; i++) { if (y <= EAST[i][0]) { return mix(EAST[i - 1][1], EAST[i][1], (y - EAST[i - 1][0]) / (EAST[i][0] - EAST[i - 1][0])); } }
    return 61;
  }
  function southY(x) { return 42.6 + 0.7 * Math.sin(x * 0.33); }
  function land(x, y) { return y < southY(x) && x < eastX(y); }
  function mappaVL(F, t, st) {
    var vis = {}, seen = {}, here = ALIAS[st.room] || st.room, v = st.visited || {}, id, i, a, b, p, w, name, on, q;
    for (id in v) { if (v.hasOwnProperty(id) && v[id]) { vis[ALIAS[id] || id] = 1; } }
    if (!st.cala) { delete vis.cala; }
    for (id in vis) { if (vis.hasOwnProperty(id) && PLACE[id]) { seen[id] = 1; } }
    for (i = 0; i < LINK.length; i++) {
      if (LINK[i][1] === "cala" && !st.cala) { continue; }
      if (vis[LINK[i][0]]) { seen[LINK[i][1]] = 1; }
      if (vis[LINK[i][1]]) { seen[LINK[i][0]] = 1; }
    }
    /* la terra: curve di livello appena accennate. Il mare: righe che scorrono */
    F.shade(0, 0, 84, 56, function (px, py) { var k; if (!land(px, py)) { return null; } k = fbm(px * 0.045 + 2, py * 0.07) * 7; return k - Math.floor(k) < 0.1 ? 0.1 : 0; }, 0, 0, "vc23");
    F.shade(0, 0, 84, 56, function (px, py) { return land(px, py) ? null : 0.07 + 0.12 * noise(px * 0.3 + t * 0.3, py * 1.6); }, 4, 0, "vc24", 2);
    /* la linea di costa */
    q = [];
    for (i = 0; i < EAST.length - 1; i++) { q.push([EAST[i][1], EAST[i][0]]); }
    for (i = 58; i >= 0; i -= 2) { q.push([i, southY(i)]); }
    F.path(q, 0.42, 0);
    /* il molo, che esce in mare */
    F.line(34, 43, 34, 49, 0.3, 0, { st: 2 }); F.line(38, 43, 38, 49, 0.3, 0, { st: 2 });
    /* qualche tetto del paese */
    for (i = 0; i < 7; i++) { p = [[24, 34], [27, 41], [45, 34], [44, 41], [10, 34], [47, 30], [8, 41]][i]; F.rect(p[0], p[1], p[0] + 1.6, p[1], 0.16, 0, { st: 6 }); }
    /* scritte: cartiglio, nord, golfo, scandagli */
    F.rect(2, 10, 19, 16, 0.02, 0); ring(F, [[2, 10], [19, 10], [19, 16], [2, 16]], 0.3, 0);
    F.text(4, 12, "PORTO SCURO", 0.9, 3); F.text(4, 14, "NOVEMBRE 1953", 0.4, 0);
    F.text(5, 27, "N", 0.6, 0); F.line(5.4, 25.6, 5.4, 22.6, 0.5, 0, { st: 2 }); F.text(5, 22, "^", 0.6, 0);
    F.text(71, 44, "GOLFO", 0.6, 4);
    F.text(76, 27, "14", 0.3, 4); F.text(73, 37, "22", 0.3, 4); F.text(12, 46, "9", 0.3, 4); F.text(52, 46, "6", 0.3, 4);
    /* i sentieri */
    for (i = 0; i < LINK.length; i++) {
      a = PLACE[LINK[i][0]]; b = PLACE[LINK[i][1]];
      if (seen[LINK[i][0]] && seen[LINK[i][1]]) { F.line(a[0], a[1], b[0], b[1], 0.3, 0); }
    }
    /* il faro: un lampo, sopra la casella */
    if (seen.faro) { on = Math.pow(Math.max(0, Math.sin(t * 1.4)), 6); pt(F, 70, 9, 0.35 + 0.75 * on, 1, 0, 42); F.glow(70, 9, 5, 2.4, 0.35 * on, 1); }
    /* i luoghi */
    for (id in PLACE) {
      if (!PLACE.hasOwnProperty(id) || !seen[id]) { continue; }
      p = PLACE[id]; name = vis[id] ? p[2] : "?"; w = name.length / 2 + 2; on = id === here;
      F.rect(p[0] - w, p[1] - 1.6, p[0] + w, p[1] + 1.6, 0.02, 0);
      ring(F, [[p[0] - w, p[1] - 1.6], [p[0] + w, p[1] - 1.6], [p[0] + w, p[1] + 1.6], [p[0] - w, p[1] + 1.6]], on ? 0.9 : 0.4, on ? 1 : 0);
      F.text(p[0] - name.length / 2, p[1], name, on ? 1 : 0.6, on ? 3 : 0);
      if (on) { F.glow(p[0], p[1], w * 1.8, 4, 0.22 + 0.12 * Math.sin(t * 3), 1); }
    }
  }

  A.add({
    m_telefono: scene(telefono), m_confessione: scene(confessione), m_quaderno: scene(quaderno), m_foglio: scene(foglio),
    f_lavoro: scene(finLavoro), f_passaporto: scene(finPassaporto), f_mare: scene(finMare), f_attesa: scene(finAttesa), f_guardiana: scene(finGuardiana),
    mappaVL: scene(mappaVL)
  });
})();
