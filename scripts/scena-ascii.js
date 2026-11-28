// Guarda una o più scene a caratteri: nel terminale (senza colori) oppure in un PNG a colori, fatto con Chrome.
// Uso: node scripts/scena-ascii.js <id[:t[:statoJSON]]> ...            stampa nel terminale
//      node scripts/scena-ascii.js --png /tmp/foglio.png <id[:t[:statoJSON]]> ...   una colonna di scene, 390 punti di larghezza
// Carica src/ascii/render.js, kit.js e tutti i file src/ascii/scene-*.js.
var fs = require('fs'), vm = require('vm'), path = require('path'), cp = require('child_process'), os = require('os');
var dir = path.join(__dirname, '..', 'src', 'ascii'), args = process.argv.slice(2), png = null;
if (args[0] === '--png') { png = args[1]; args = args.slice(2); }
var files = ['render.js', 'kit.js'].concat(fs.readdirSync(dir).filter(function (f) { return /^scene-.*\.js$/.test(f); }).sort());
var code = files.map(function (f) { return fs.readFileSync(path.join(dir, f), 'utf8'); }).join('\n');
function parse(s) { var p = s.split(':'); return { id: p[0], t: +(p[1] || 3), st: p.length > 2 ? JSON.parse(p.slice(2).join(':')) : {} }; }
if (!png) {
  var ctx = { console: console }; vm.createContext(ctx); vm.runInContext(code + '\nthis.A = Ascii;', ctx);
  args.forEach(function (a) {
    var q = parse(a), F = new ctx.A.Field();
    if (!ctx.A.scenes[q.id]) { console.log('scena sconosciuta: ' + q.id + '. Ci sono: ' + Object.keys(ctx.A.scenes).join(', ')); return; }
    F.clear(); F.cam(); ctx.A.scenes[q.id](F, q.t, q.st); console.log('==== ' + a + '\n' + ctx.A.dump(F, q.t));
  });
} else {
  var tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scena-')), html = path.join(tmp, 'p.html');
  fs.writeFileSync(html, '<!doctype html><meta charset=utf-8><body style="margin:0;background:#0a0c11"><script>' + code + '\nvar L=' + JSON.stringify(args.map(parse)) +
    ';L.forEach(function(q){var c=document.createElement("canvas");c.style.cssText="display:block;width:390px;margin:0 0 6px";document.body.appendChild(c);var r=new Ascii.Renderer(c);r.resize(390);var F=new Ascii.Field();F.clear();F.cam();Ascii.scenes[q.id](F,q.t,q.st);r.draw(F,q.t);});</script>');
  cp.execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', '--user-data-dir=' + path.join(tmp, 'prof'),
    '--window-size=500,' + (args.length * 441 + 10), '--screenshot=' + png, 'file://' + html], { stdio: 'ignore' });
  console.log(png + ': ' + args.length + ' scene');
}
