// Stampa una tavola come righe di 0 e 1: serve a build.py per le copertine dell'elenco delle storie.
// Uso: node scripts/bits.js <storia> <id> [fotogramma]
var fs = require('fs'), vm = require('vm'), path = require('path');
var src = path.join(__dirname, '..', 'src'), dir = path.join(src, process.argv[2]), ctx = {};
vm.createContext(ctx);
var code = fs.readFileSync(path.join(src, 'gfx.js'), 'utf8');
fs.readdirSync(dir).sort().forEach(function (f) { if (/^pix.*\.js$/.test(f)) { code += '\n' + fs.readFileSync(path.join(dir, f), 'utf8'); } });
vm.runInContext(code + '\nthis.Pix = Pix;', ctx);
var g = ctx.Pix.render(process.argv[3], +(process.argv[4] || 0)), y, out = [];
for (y = 0; y < g.h; y++) { out.push(g.d.slice(y * g.w, (y + 1) * g.w).join('')); }
console.log(out.join('\n'));
