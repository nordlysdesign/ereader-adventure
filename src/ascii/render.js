/* ==================================================================
   PROVA PER TELEFONO: motore grafico a caratteri.
   Una scena non è un'immagine: è una griglia di celle, e ogni cella ha
   una luce (0..1), una tinta e, se serve, un tratto (/ | \ -) o una
   lettera. La luce sceglie il carattere: dai punti del buio fino a
   8 B $ Q @ dove batte la lampada. Le scene disegnano sulla griglia
   con forme piene, linee, luci che si sommano e neve.
   Qui non valgono i vincoli da e-reader (ES6, colore, 30 fotogrammi
   al secondo), ma la griglia non tocca il DOM e si prova anche in Node.
   ================================================================== */
var Ascii = (function () {
  "use strict";
  var W = 84, H = 56, N = W * H;
  var RAMP = " .·:;-=+ox0O8B$Q@";
  var STROKE = ["", "/", "|", "\\", "-", "_", "="];
  /* tinte: 0 grigio-azzurro, 1 ambra (le luci accese), 2 rosso (una volta sola), 3 bianco caldo, 4 blu notte, 5 verde spento */
  var TINT = ["#a3b6ca", "#f5a742", "#e0523f", "#fff3dc", "#6388bd", "#86b39a"];
  var BG = "#0a0c11";
  var GAMMA = 0.62;

  function hash(n) { var v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
  /* rumore a interi: molto più svelto del seno, e i telefoni ringraziano */
  function hash2(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) { return 0.55 * noise(x, y) + 0.3 * noise(x * 2.1 + 5, y * 2.1 + 3) + 0.15 * noise(x * 4.3 + 9, y * 4.3 + 7); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function mix(a, b, k) { return a + (b - a) * k; }
  function smooth(a, b, v) { var k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); }

  /* ---------- la griglia ---------- */
  function Field() {
    this.lum = new Float32Array(N); this.tint = new Uint8Array(N); this.st = new Uint8Array(N); this.ch = new Uint16Array(N);
    this.cx = W / 2; this.cy = H / 2; this.s = 1; this.clip = null;
  }
  var F = Field.prototype;
  F.W = W; F.H = H;
  F.clear = function () { this.lum.fill(0); this.tint.fill(0); this.st.fill(0); this.ch.fill(0); this.clip = null; };
  /* la camera: centro e ingrandimento. Tutte le forme passano di qui */
  F.cam = function (cx, cy, s) { this.cx = cx === undefined ? W / 2 : cx; this.cy = cy === undefined ? H / 2 : cy; this.s = s || 1; };
  F.X = function (x) { return (x - this.cx) * this.s + W / 2; };
  F.Y = function (y) { return (y - this.cy) * this.s + H / 2; };
  F.inside = function (x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) { return false; }
    var c = this.clip;
    return !c || (x >= c[0] && x <= c[2] && y >= c[1] && y <= c[3]);
  };
  /* ritaglio, in coordinate di scena */
  F.setClip = function (x0, y0, x1, y1) { this.clip = x0 === undefined ? null : [Math.ceil(this.X(x0)), Math.ceil(this.Y(y0)), Math.floor(this.X(x1)), Math.floor(this.Y(y1))]; };
  /* modi: 0 scrive, 1 somma (luci), 2 tiene il più chiaro (linee, neve) */
  F.put = function (x, y, l, tint, mode, st, ch) {
    if (!this.inside(x, y)) { return; }
    var i = y * W + x;
    if (mode === 1) {
      if (l > this.lum[i] * 0.6 && l > 0.05) { this.tint[i] = tint; }
      this.lum[i] += l;
    } else if (mode === 2) {
      if (l < this.lum[i]) { return; }
      this.lum[i] = l; this.tint[i] = tint; this.st[i] = st || 0; this.ch[i] = ch || 0;
    } else { this.lum[i] = l; this.tint[i] = tint; this.st[i] = st || 0; this.ch[i] = ch || 0; }
  };
  /* una funzione per cella: cieli, nebbia, acqua. fn riceve coordinate di scena.
     È l'operazione più cara. Con una chiave (key) il risultato si tiene da parte e si ricalcola solo ogni `every` fotogrammi,
     o quando la camera si muove: un cielo che scorre piano non ha bisogno di essere rifatto trenta volte al secondo. */
  F.shade = function (x0, y0, x1, y1, fn, tint, mode, key, every) {
    var ax = Math.max(0, Math.floor(this.X(x0))), bx = Math.min(W - 1, Math.ceil(this.X(x1))), ay = Math.max(0, Math.floor(this.Y(y0))), by = Math.min(H - 1, Math.ceil(this.Y(y1))), x, y, l, c, sig, n = 0, w = bx - ax + 1;
    if (bx < ax || by < ay) { return; }
    if (key) {
      this.cache = this.cache || {};
      sig = this.cx + "," + this.cy + "," + this.s + "," + ax + "," + ay + "," + bx + "," + by;
      c = this.cache[key];
      if (c && c.sig === sig && c.age < (every || 8)) {
        c.age++;
        for (y = ay; y <= by; y++) { for (x = ax; x <= bx; x++) { l = c.v[n++]; if (l === l) { this.put(x, y, l, tint, mode || 0); } } }
        return;
      }
      c = this.cache[key] = { sig: sig, age: 0, v: new Float32Array(w * (by - ay + 1)) };
    }
    for (y = ay; y <= by; y++) {
      for (x = ax; x <= bx; x++) {
        l = fn((x - W / 2) / this.s + this.cx, (y - H / 2) / this.s + this.cy);
        if (c) { c.v[n++] = l === null ? NaN : l; }
        if (l !== null) { this.put(x, y, l, tint, mode || 0); }
      }
    }
  };
  F.rect = function (x0, y0, x1, y1, l, tint, o) {
    o = o || {};
    var ax = Math.round(this.X(x0)), bx = Math.round(this.X(x1)), ay = Math.round(this.Y(y0)), by = Math.round(this.Y(y1)), x, y;
    for (y = ay; y <= by; y++) { for (x = ax; x <= bx; x++) { this.put(x, y, l, tint, o.mode || 0, o.st); } }
  };
  F.poly = function (p, l, tint, o) {
    o = o || {};
    var q = [], i, j, y, xs, a, b, x, minY = 1e9, maxY = -1e9;
    for (i = 0; i < p.length; i++) { q.push([this.X(p[i][0]), this.Y(p[i][1])]); minY = Math.min(minY, q[i][1]); maxY = Math.max(maxY, q[i][1]); }
    for (y = Math.max(0, Math.floor(minY)); y <= Math.min(H - 1, Math.ceil(maxY)); y++) {
      xs = [];
      for (i = 0, j = q.length - 1; i < q.length; j = i++) {
        a = q[i]; b = q[j];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) { xs.push(a[0] + (y + 0.5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      }
      xs.sort(function (m, n) { return m - n; });
      for (i = 0; i + 1 < xs.length; i += 2) { for (x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) { this.put(x, y, typeof l === "function" ? l(x, y) : l, tint, o.mode || 0, o.st); } }
    }
  };
  F.ell = function (cx, cy, rx, ry, l, tint, o) {
    o = o || {};
    var X = this.X(cx), Y = this.Y(cy), RX = rx * this.s, RY = ry * this.s, y, hw, x;
    for (y = Math.ceil(Y - RY); y <= Math.floor(Y + RY); y++) {
      hw = RX * Math.sqrt(Math.max(0, 1 - ((y - Y) * (y - Y)) / (RY * RY || 1)));
      for (x = Math.round(X - hw); x <= Math.round(X + hw); x++) { this.put(x, y, l, tint, o.mode || 0, o.st); }
    }
  };
  /* linea: il tratto segue la pendenza, come un tratteggio a penna */
  F.line = function (x0, y0, x1, y1, l, tint, o) {
    o = o || {};
    var ax = this.X(x0), ay = this.Y(y0), bx = this.X(x1), by = this.Y(y1), dx = bx - ax, dy = by - ay, n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))), i, st = o.st;
    if (st === undefined) { st = Math.abs(dx) > 2.4 * Math.abs(dy) ? 4 : (Math.abs(dy) > 1.5 * Math.abs(dx) ? 2 : (dx * dy < 0 ? 1 : 3)); }
    for (i = 0; i <= n; i++) { this.put(Math.round(ax + dx * i / (n || 1)), Math.round(ay + dy * i / (n || 1)), l, tint, o.mode === undefined ? 2 : o.mode, st); }
  };
  F.path = function (p, l, tint, o) { for (var i = 0; i < p.length - 1; i++) { this.line(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], l, tint, o); } };
  /* luce tonda che si somma a quello che c'è */
  F.glow = function (cx, cy, rx, ry, p, tint) {
    var X = this.X(cx), Y = this.Y(cy), RX = rx * this.s, RY = ry * this.s, x, y, d;
    for (y = Math.floor(Y - RY); y <= Math.ceil(Y + RY); y++) {
      for (x = Math.floor(X - RX); x <= Math.ceil(X + RX); x++) {
        d = Math.sqrt(((x - X) * (x - X)) / (RX * RX) + ((y - Y) * (y - Y)) / (RY * RY));
        if (d < 1) { this.put(x, y, p * (1 - d) * (1 - d), tint, 1); }
      }
    }
  };
  /* fascio: dal punto (ax, ay) fino alla base [bx0, bx1] alla quota by. La polvere nel fascio si muove col tempo */
  F.cone = function (ax, ay, bx0, bx1, by, p, tint, t) {
    var y0 = this.Y(ay), y1 = this.Y(by), y, k, c, hw, x, d, n;
    for (y = Math.round(y0); y <= Math.round(y1); y++) {
      k = (y - y0) / ((y1 - y0) || 1);
      c = this.X(mix(ax, (bx0 + bx1) / 2, k)); hw = Math.max(0.6, (bx1 - bx0) / 2 * k * this.s);
      for (x = Math.floor(c - hw); x <= Math.ceil(c + hw); x++) {
        d = Math.abs(x - c) / hw; if (d > 1) { continue; }
        n = 0.72 + 0.28 * noise(x * 0.35 + (t || 0) * 0.25, y * 0.3 - (t || 0) * 0.5);
        this.put(x, y, p * (1 - d * d * d) * (1 - 0.5 * k) * n, tint, 1);
      }
    }
  };
  /* scritte: lettere vere al posto della rampa */
  F.text = function (x, y, s, l, tint) {
    if (this.s < 0.85 || this.s > 1.25) { return; }
    var X = Math.round(this.X(x)), Y = Math.round(this.Y(y)), i;
    for (i = 0; i < s.length; i++) { if (s.charAt(i) !== " ") { this.put(X + i, Y, l, tint, 0, 0, s.charCodeAt(i)); } }
  };
  F.dim = function (x0, y0, x1, y1, k) {
    var ax = Math.max(0, Math.round(this.X(x0))), bx = Math.min(W - 1, Math.round(this.X(x1))), ay = Math.max(0, Math.round(this.Y(y0))), by = Math.min(H - 1, Math.round(this.Y(y1))), x, y;
    for (y = ay; y <= by; y++) { for (x = ax; x <= bx; x++) { this.lum[y * W + x] *= k; } }
  };
  /* neve: n fiocchi che scendono e ondeggiano, in coordinate di schermo. Dentro una luce si accendono */
  F.snow = function (t, n, speed, l, seed, o) {
    o = o || {};
    var x0 = o.x0 === undefined ? 0 : o.x0, x1 = o.x1 === undefined ? W : o.x1, y0 = o.y0 === undefined ? 0 : o.y0, y1 = o.y1 === undefined ? H : o.y1, w = x1 - x0, h = y1 - y0, i, x, y, j, k, ch;
    for (i = 0; i < n; i++) {
      k = seed * 131 + i;
      x = x0 + ((hash(k) * w + Math.sin(t * 0.5 + i * 1.7) * (o.sway || 1.5) + t * (o.wind || 0)) % w + w) % w;
      y = y0 + (hash(k + 0.5) * h + t * speed * (0.7 + 0.6 * hash(k + 0.25))) % h;
      x = Math.floor(x); y = Math.floor(y);
      if (!this.inside(x, y)) { continue; }
      j = y * W + x;
      ch = o.ch ? o.ch.charCodeAt(i % o.ch.length) : 46;
      if (this.tint[j] === 1 && this.lum[j] > 0.18) { this.lum[j] = Math.min(1.1, this.lum[j] + l * 1.6); this.ch[j] = ch === 46 ? 42 : ch; }
      else if (l > this.lum[j]) { this.lum[j] = l; this.tint[j] = o.tint || 0; this.st[j] = 0; this.ch[j] = ch; }
    }
  };
  /* una tavola a un bit (quelle dell'e-reader) tradotta in luce: l'inchiostro diventa chiaro, come gesso su una lavagna */
  F.bits = function (g, x0, y0, x1, y1, tint) {
    var cw = x1 - x0 + 1, chh = y1 - y0 + 1, bx = g.w / cw, by = g.h / chh, x, y, a, b, n, k, l, gx0, gy0, gx1, gy1, left, right, up, down;
    function ink(px0, py0, px1, py1) {
      var s = 0, m = 0, u, v;
      for (v = Math.max(0, Math.floor(py0)); v < Math.min(g.h, Math.ceil(py1)); v++) { for (u = Math.max(0, Math.floor(px0)); u < Math.min(g.w, Math.ceil(px1)); u++) { s += g.d[v * g.w + u]; m++; } }
      return m ? s / m : 0;
    }
    for (y = 0; y < chh; y++) {
      for (x = 0; x < cw; x++) {
        gx0 = x * bx; gy0 = y * by; gx1 = gx0 + bx; gy1 = gy0 + by;
        k = ink(gx0, gy0, gx1, gy1);
        /* i retini di fondo delle tavolette restano un pulviscolo; si accende solo l'inchiostro pieno */
        l = k < 0.3 ? 0 : (k < 0.6 ? 0.06 : 0.34 + 1.6 * (k - 0.6));
        n = 0;
        if (k > 0.6 && k < 0.86) {
          left = ink(gx0 - bx, gy0, gx0, gy1); right = ink(gx1, gy0, gx1 + bx, gy1); up = ink(gx0, gy0 - by, gx1, gy0); down = ink(gx0, gy1, gx1, gy1 + by);
          a = right - left; b = down - up;
          if (Math.abs(a) + Math.abs(b) > 0.5) { n = Math.abs(a) > 2 * Math.abs(b) ? 2 : (Math.abs(b) > 2 * Math.abs(a) ? 4 : (a * b > 0 ? 1 : 3)); }
        }
        this.put(x0 + x, y0 + y, l, tint || 0, 0, n);
      }
    }
  };

  /* i caratteri della griglia, come testo: serve alle prove, e a guardare una scena nel terminale */
  function charAt(f, i, t) {
    var l = f.lum[i], k;
    if (l < 0.045) { return " "; }
    l = Math.pow(Math.min(l, 1.2), GAMMA);   /* la curva che tira su i mezzi toni: il buio resta pieno di segni */
    if (f.ch[i]) { return String.fromCharCode(f.ch[i]); }
    if (f.st[i] && l > 0.1 && l < 0.82) { return STROKE[f.st[i]]; }
    /* i caratteri respirano: ogni tanto una cella sale o scende di un grado */
    k = hash(i * 0.731 + Math.floor((t || 0) * 3) * 17.3);
    if (k < 0.12) { l += (k - 0.06) * 1.4; }
    return RAMP.charAt(clamp(Math.floor(l * 16.99), 1, 16));
  }
  function dump(f, t) {
    var out = [], y, x, s;
    for (y = 0; y < H; y++) { s = ""; for (x = 0; x < W; x++) { s += charAt(f, y * W + x, t); } out.push(s); }
    return out.join("\n");
  }

  /* ---------- dalla griglia allo schermo ---------- */
  function Renderer(canvas) {
    this.c = canvas; this.ctx = canvas.getContext("2d"); this.cw = 0; this.chh = 0; this.atlas = null; this.map = {};
    this.small = document.createElement("canvas"); this.small.width = W; this.small.height = H; this.sctx = this.small.getContext("2d"); this.img = this.sctx.createImageData(W, H);
    this.rgb = TINT.map(function (h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; });
  }
  var R = Renderer.prototype;
  R.resize = function (cssW) {
    var dpr = Math.min(window.devicePixelRatio || 1, 3), cw = Math.max(4, Math.floor(cssW * dpr / W)), chh = Math.round(cw * 1.66);
    if (cw === this.cw) { return; }
    this.cw = cw; this.chh = chh;
    this.c.width = cw * W; this.c.height = chh * H;
    this.build();
  };
  /* l'atlante: ogni carattere, in ogni tinta, disegnato una volta sola */
  R.build = function () {
    var chars = "", i, t, a = document.createElement("canvas"), x, cw = this.cw, chh = this.chh, g;
    for (i = 33; i < 127; i++) { chars += String.fromCharCode(i); }
    chars += "·";
    a.width = cw * chars.length; a.height = chh * TINT.length;
    g = a.getContext("2d");
    g.font = "600 " + Math.round(chh * 0.92) + "px 'IBM Plex Mono', Menlo, Consolas, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    for (t = 0; t < TINT.length; t++) {
      g.fillStyle = TINT[t];
      for (x = 0; x < chars.length; x++) { g.fillText(chars.charAt(x), x * cw + cw / 2, t * chh + chh / 2 + 1); }
    }
    this.map = {};
    for (x = 0; x < chars.length; x++) { this.map[chars.charAt(x)] = x; }
    this.atlas = a;
  };
  R.draw = function (f, t) {
    var ctx = this.ctx, cw = this.cw, chh = this.chh, d = this.img.data, i, l, x, y, c, tint, rgb, k, sx;
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.fillStyle = BG; ctx.fillRect(0, 0, this.c.width, this.c.height);
    /* l'alone: le celle più chiare lasciano una luce larga e morbida sotto i caratteri */
    for (i = 0; i < N; i++) {
      l = f.lum[i]; tint = f.tint[i]; rgb = this.rgb[tint];
      k = l > 0.3 ? Math.min(1, (l - 0.3) * 1.15) : 0; k = k * k * (tint === 1 || tint === 2 ? 1 : 0.5);
      d[i * 4] = rgb[0] * k; d[i * 4 + 1] = rgb[1] * k; d[i * 4 + 2] = rgb[2] * k; d[i * 4 + 3] = 255;
    }
    this.sctx.putImageData(this.img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.55;
    ctx.drawImage(this.small, 0, 0, this.c.width, this.c.height);
    ctx.globalAlpha = 0.3; ctx.drawImage(this.small, -cw * 1.5, -chh, this.c.width + cw * 3, this.c.height + chh * 2);
    ctx.globalCompositeOperation = "source-over";
    for (y = 0; y < H; y++) {
      for (x = 0; x < W; x++) {
        i = y * W + x; l = f.lum[i];
        if (l < 0.045) { continue; }
        c = charAt(f, i, t); sx = this.map[c];
        if (sx === undefined) { continue; }
        tint = f.tint[i]; if (tint === 1 && l > 0.94) { tint = 3; }
        ctx.globalAlpha = Math.min(1, 0.26 + 0.8 * Math.pow(l, GAMMA));
        ctx.drawImage(this.atlas, sx * cw, tint * chh, cw, chh, x * cw, y * chh, cw, chh);
      }
    }
    ctx.globalAlpha = 1;
  };

  return { W: W, H: H, Field: Field, Renderer: Renderer, dump: dump, hash: hash, hash2: hash2, noise: noise, fbm: fbm, clamp: clamp, mix: mix, smooth: smooth, TINT: TINT, BG: BG };
})();
