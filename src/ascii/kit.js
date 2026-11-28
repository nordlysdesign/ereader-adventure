/* ==================================================================
   PER TELEFONO: i mattoni comuni delle scene a caratteri, e il
   registro delle scene. Ogni file di scene aggiunge le sue con
   Ascii.add({ id: funzione(F, t, st) }), e le ritrova in Ascii.scenes.
   Le celle sono alte quasi il doppio di quanto sono larghe: un cerchio
   si scrive con rx circa 1,7 volte ry.
   Tinte: 0 grigio-azzurro, 1 ambra (le luci accese), 2 rosso (una volta
   sola per scena), 3 bianco caldo, 4 blu notte, 5 verde spento.
   ================================================================== */
(function () {
  "use strict";
  var A = Ascii, noise = A.noise, fbm = A.fbm, hash = A.hash, clamp = A.clamp, mix = A.mix, smooth = A.smooth;
  A.scenes = {};
  A.add = function (o) { for (var k in o) { if (o.hasOwnProperty(k)) { A.scenes[k] = o[k]; } } };

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

  /* pioggia: tratti obliqui che cadono in fretta. Dentro una luce si accendono */
  function rainfall(F, t, k) {
    k = k === undefined ? 1 : k;
    F.snow(t, Math.round(60 * k), 16, 0.22, 11, { sway: 0.2, wind: -5, ch: "/" });
    F.snow(t, Math.round(40 * k), 22, 0.4, 12, { sway: 0.2, wind: -7, ch: "/" });
    F.snow(t, Math.round(16 * k), 28, 0.6, 13, { sway: 0.2, wind: -9, ch: "/'" });
  }
  A.kit = { sky: sky, mountain: mountain, snowfall: snowfall, rainfall: rainfall, ada: ada, litWindow: litWindow };
})();
