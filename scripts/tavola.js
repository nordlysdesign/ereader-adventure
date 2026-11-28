// Disegna una o più tavole in un PNG, per guardarle senza browser.
// Uso: node scripts/tavola.js <storia> <uscita.png> <id[:fotogramma]> [altri id...]
//      node scripts/tavola.js acqua-cheta /tmp/prova.png lagoGiorno lagoGiorno:3 o_occhiali
// Senza id disegna tutte le tavole della storia. Più tavole vengono affiancate in un foglio.
var fs = require('fs'), vm = require('vm'), zlib = require('zlib'), path = require('path');
var story = process.argv[2], out = process.argv[3], ids = process.argv.slice(4);
var src = path.join(__dirname, '..', 'src'), dir = path.join(src, story), ctx = {};
vm.createContext(ctx);
var code = fs.readFileSync(path.join(src, 'gfx.js'), 'utf8');
fs.readdirSync(dir).sort().forEach(function (f) { if (/^pix.*\.js$/.test(f)) { code += '\n' + fs.readFileSync(path.join(dir, f), 'utf8'); } });
vm.runInContext(code + '\nthis.Pix = Pix;', ctx);
var Pix = ctx.Pix, K = 2, GAP = 6;
if (!ids.length) { ids = Object.keys(Pix.scenes); }
var cells = ids.map(function (s) {
  var p = s.split(':'), g;
  if (!Pix.scenes[p[0]]) { console.log('tavola sconosciuta: ' + p[0]); process.exit(1); }
  g = Pix.render(p[0], +(p[1] || 0));
  return g;
});
var cols = cells.length > 6 ? 4 : (cells.length > 1 ? 2 : 1), cw = 0, x, y, i;
cells.forEach(function (g) { cw = Math.max(cw, g.w); });
var rows = [], r;
for (i = 0; i < cells.length; i += cols) { rows.push(cells.slice(i, i + cols)); }
var Wp = (cols * cw + (cols + 1) * GAP) * K, Hp = GAP * K;
rows.forEach(function (row) { var h = 0; row.forEach(function (g) { h = Math.max(h, g.h); }); row.h = h; Hp += (h + GAP) * K; });
var px = Buffer.alloc(Wp * Hp, 150), oy = GAP;
rows.forEach(function (row) {
  row.forEach(function (g, c) {
    var ox = GAP + c * (cw + GAP), a, b;
    for (y = 0; y < g.h; y++) { for (x = 0; x < g.w; x++) { for (a = 0; a < K; a++) { for (b = 0; b < K; b++) { px[((oy + y) * K + a) * Wp + (ox + x) * K + b] = g.d[y * g.w + x] ? 17 : 240; } } } }
  });
  oy += row.h + GAP;
});
function crc(buf) { var c, n, k, t = crc.t; if (!t) { t = crc.t = []; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) { c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; } t[n] = c >>> 0; } } c = 0xffffffff; for (n = 0; n < buf.length; n++) { c = t[(c ^ buf[n]) & 255] ^ (c >>> 8); } return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) { var len = Buffer.alloc(4), td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); len.writeUInt32BE(data.length); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); }
var raw = Buffer.alloc((Wp + 1) * Hp);
for (y = 0; y < Hp; y++) { raw[y * (Wp + 1)] = 0; px.copy(raw, y * (Wp + 1) + 1, y * Wp, (y + 1) * Wp); }
var ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(Wp, 0); ihdr.writeUInt32BE(Hp, 4); ihdr[8] = 8; ihdr[9] = 0;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(out + ': ' + ids.length + ' tavole, ' + Wp + 'x' + Hp);
