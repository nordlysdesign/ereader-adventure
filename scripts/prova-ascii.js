// Controlla la prova per telefono senza browser: il motore con le chiavi cambiate, le scene, i filmati.
// Uso: node scripts/prova-ascii.js        (aggiungi una scena per vederla nel terminale: node scripts/prova-ascii.js pieve)
var fs = require('fs'), vm = require('vm'), path = require('path');
var root = path.join(__dirname, '..'), html = fs.readFileSync(path.join(root, 'acqua-cheta-ascii.html'), 'utf8');
var js = /<script>\n([\s\S]*)<\/script>/.exec(html)[1], fails = 0, store = {};
function bad(m) { fails++; console.log('PROBLEMA: ' + m); }
// la pagina com'è pubblicata, meno l'interfaccia (che vuole il DOM): tutto quello che viene prima di ui-touch.js
var cut = js.indexOf('PROVA PER TELEFONO: l\'interfaccia');
if (cut < 0) { bad('non trovo l\'interfaccia nella pagina'); cut = js.length; }
js = js.slice(0, js.lastIndexOf('/*', cut));
var ctx = { console: console, setInterval: function () {}, window: {},
  localStorage: { getItem: function (k) { return store.hasOwnProperty(k) ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); } } };
vm.createContext(ctx);
vm.runInContext(js + '\nthis.PC = PC; this.Pix = Pix; this.Ascii = Ascii; this.S = AsciiScenes; this.Films = AsciiFilms;', ctx);
var PC = ctx.PC, A = ctx.Ascii, S = ctx.S, F = new A.Field();

if (process.argv[2]) { F.clear(); F.cam(); S[process.argv[2]](F, 3, {}); console.log(A.dump(F, 3)); process.exit(0); }

function check(name, f) {
  var i, lit = 0;
  for (i = 0; i < f.lum.length; i++) { if (!(f.lum[i] >= 0 && f.lum[i] < 4)) { bad(name + ': luce fuori scala alla cella ' + i + ' (' + f.lum[i] + ')'); return 0; } if (f.tint[i] > 5 || f.st[i] > 6) { bad(name + ': tinta o tratto sbagliati'); return 0; } if (f.lum[i] > 0.045) { lit++; } }
  if (lit < 200) { bad(name + ': scena quasi vuota (' + lit + ' celle accese)'); }
  return lit;
}
// ogni scena, a più istanti e con gli stati dei filmati; due istanti devono dare due fotogrammi diversi
var states = { fermata: [{}, { bus: 0.5, noAda: true }, { bus: 2 }], camera3: [{}, { buio: true, colpo: 2 }, { buio: true, colpo: 5 }, { sereno: true }], osteria: [{}, { milano: true, cabina: true }], mappa: [{ visited: { corriera: 1 }, room: 'corriera' }, { visited: { corriera: 1, piazza: 1, albergo: 1, camera: 1 }, room: 'camera' }] };
var t0 = Date.now(), frames = 0;
Object.keys(S).forEach(function (id) {
  (states[id] || [{}]).forEach(function (st, k) {
    var a, b;
    try {
      F.clear(); F.cam(); S[id](F, 1.3, st); check(id + '#' + k, F); a = A.dump(F, 1.3);
      F.clear(); F.cam(42, 28, 1.5); S[id](F, 7.9, st); check(id + '#' + k + ' (camera stretta)', F);
      F.clear(); F.cam(); S[id](F, 7.9, st); b = A.dump(F, 7.9); frames += 3;
      if (a === b) { bad(id + '#' + k + ': la scena non si muove'); }
    } catch (e) { bad(id + '#' + k + ': ERRORE ' + e.stack); }
  });
});
console.log('scene: ' + Object.keys(S).length + ', fotogrammi calcolati: ' + frames + ', ' + ((Date.now() - t0) / frames).toFixed(1) + ' ms l\'uno (solo la griglia, senza disegno)');

// il capitolo 1 lungo il percorso noto: ogni tavola chiamata deve avere una scena nuova, oppure una tavoletta da convertire
var st = PC.start(true), seen = {}, films = {};
function look(blocks) {
  blocks.forEach(function (b, i) {
    if (b.t !== 'img') { return; }
    seen[b.id] = 1;
    if (ctx.Films[b.id]) { films[b.id] = blocks[i + 1] && blocks[i + 1].t === 'p' ? blocks[i + 1].s : null; return; }
    if (S[b.id]) { return; }
    if (/^o_/.test(b.id) && ctx.Pix.scenes[b.id]) { try { F.clear(); F.bits(ctx.Pix.render(b.id, 0), 2, 12, 81, 40, 0); check(b.id, F); } catch (e) { bad(b.id + ': non si converte: ' + e.message); } return; }
    bad('tavola senza scena né ripiego: ' + b.id);
  });
}
look(st.blocks);
['esamina palina', 'esamina diga', 'esamina lettera', 'esamina sigarette', 'n', 'esamina fontana', 'esamina avviso', 'esamina campanile', 'esamina marcia', 'e', 'esamina banco', 'esamina stufa', 'esamina telefono', 'esamina macchina',
  'esamina minestra', 'parla donna', 'esamina olga', 'esamina vescovi', 'esamina chiave', 'usa telefono', 'prendi minestra', 'mappa', 'scheda', 'indizio', 'usa telefono', 'su', 'esamina valigia', 'esamina letto', 'esamina finestra', 'dormi'].forEach(function (c) { look(PC.exec(c)); });
if (PC.status().ch !== 2) { bad('il percorso non chiude il capitolo 1: ' + JSON.stringify(PC.status())); }
['m_chiamata', 'm_colpo'].forEach(function (id) { if (!films[id]) { bad('il filmato ' + id + ' non trova il suo testo'); } });
console.log('tavole incontrate nel capitolo 1: ' + Object.keys(seen).length);

// i filmati: ogni inquadratura ha una scena che esiste, un testo, e camera e stato che reggono nel tempo
var pro = PC.prologue().map(function (pg) { return pg.filter(function (b) { return b.t === 'prosa'; })[0].s; });
[ctx.Films.prologo(pro), ctx.Films.m_chiamata(films.m_chiamata || 'a\nb', 'nota'), ctx.Films.m_colpo(films.m_colpo || 'a\nb\nc')].forEach(function (f) {
  f.steps.forEach(function (s, i) {
    if (!S[s.scene] || !s.text) { bad('filmato ' + f.name + ', inquadratura ' + i + ': scena o testo mancanti'); return; }
    [0, 2.5, 12].forEach(function (u) {
      try { var c = s.cam(u); F.clear(); F.cam(c[0], c[1], c[2]); S[s.scene](F, 4 + u, s.st(u, u + i * 6)); check(f.name + '/' + i + '@' + u, F); }
      catch (e) { bad('filmato ' + f.name + ', inquadratura ' + i + ': ' + e.message); }
    });
  });
  console.log('filmato ' + f.name + ': ' + f.steps.length + ' inquadrature');
});

// la partita di prova non deve toccare quella vera
var keys = Object.keys(store);
if (!keys.length || keys.some(function (k) { return k.indexOf('acquacheta-ascii.') !== 0; })) { bad('chiavi di salvataggio inattese: ' + keys.join(', ')); }
console.log('chiavi scritte: ' + keys.join(', '));
// la prova è per telefoni, ma non deve chiedere niente a nessuno: nessuna libreria esterna, a parte i caratteri
var ext = (html.match(/(src|href)="https?:[^"]+/g) || []).filter(function (u) { return u.indexOf('fonts.googleapis.com') < 0; });
if (ext.length) { bad('la pagina carica cose esterne: ' + ext.join(', ')); }
console.log(fails ? 'PROBLEMI: ' + fails : 'tutto a posto');
