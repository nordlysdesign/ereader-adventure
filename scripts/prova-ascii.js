// Controlla le pagine per telefono senza browser: per ogni storia il motore con le chiavi cambiate, le scene, i filmati,
// e una partita lungo il percorso noto, in cui ogni tavola chiamata deve avere una scena, un filmato o una tavoletta da convertire.
// Uso: node scripts/prova-ascii.js
var fs = require('fs'), vm = require('vm'), path = require('path');
var root = path.join(__dirname, '..'), fails = 0;
function bad(m) { fails++; console.log('PROBLEMA: ' + m); }

var STORIE = [
  { page: 'acqua-cheta-ascii.html', key: 'acquacheta-ascii.', endCh: 2,
    path: ['esamina palina', 'esamina diga', 'esamina lettera', 'esamina sigarette', 'n', 'esamina fontana', 'esamina avviso', 'esamina campanile', 'esamina marcia', 'e', 'esamina banco', 'esamina stufa', 'esamina telefono',
      'esamina macchina', 'esamina minestra', 'parla donna', 'esamina olga', 'esamina vescovi', 'esamina chiave', 'usa telefono', 'prendi minestra', 'mappa', 'scheda', 'indizio', 'usa telefono', 'su', 'esamina valigia',
      'esamina letto', 'esamina finestra', 'dormi'],
    mustFilm: ['m_chiamata', 'm_colpo'], endings: [] },
  { page: 'via-libera-ascii.html', key: 'vialibera-ascii.', endCh: 3,
    path: ['esamina lampione', 'esamina faro', 'n', 'esamina manifesto', 'e', 'parla donna', 'mostra tesserino', 'esamina telefono', 'prendi grappa', 'parla uomo', 'esamina kessel', 'esamina nives', 'usa telefono', 'su',
      'esamina valigia', 'prendi pistola', 'esamina finestra', 'dormi',
      'esamina valigia', 'giu', 'parla nives', 'parla kessel', 'o', 'o', 'parla lodi', 'leggi fascicolo', 'esamina fotografie', 'esamina lodi', 'e', 'n', 'esamina sigilli', 'n', 'esamina porta', 's', 'e', 'e',
      'esamina registro', 'esamina stufa', 'esamina scrivania', 'esamina fotografia', 'prendi fotografia', 'o', 's', 'e', 'mostra la fotografia a nives',
      'parla nives', 'scheda', 'mappa', 'o', 'n', 'n', 'apri porta', 'su', 'esamina lente', 'esamina leva', 'apri sportello', 'prendi quaderno', 'giu'],
    mustFilm: ['m_telefono', 'finestra21'],
    endings: [['rifiuta', 's', 'giu', 'parla brandi', 'parla brandi', 'parla brandi', 'esamina macchina', 'esamina uomini', 'su', 'n', 'su', 'usa leva', 'segnala 1-3'], ['accetta', 'n', 'su', 'usa leva', 'segnala 1-3'],
      ['rifiuta', 'n', 'su', 'usa leva', 'segnala 2-2'], ['rifiuta', 'n', 'su', 'usa leva', 'segnala 2-1'], ['rifiuta', 's', 's', 'e', 'parla nives', 'o', 'n', 'n', 'su', 'usa leva', 'segnala 3-1']] }
];

STORIE.forEach(function (st) {
  var html, js, cut, store = {}, ctx, PC, A, S, SC, F, seen = {}, films = {}, rooms = {}, t0, frames = 0, keys, ext, n0 = fails;
  console.log('\n=== ' + st.page);
  try { html = fs.readFileSync(path.join(root, st.page), 'utf8'); } catch (e) { bad('manca la pagina ' + st.page); return; }
  js = /<script>\n([\s\S]*)<\/script>/.exec(html)[1];
  // la pagina com'è pubblicata, meno l'interfaccia (che vuole il DOM)
  cut = js.indexOf('PER TELEFONO: l\'interfaccia');
  if (cut < 0) { bad('non trovo l\'interfaccia nella pagina'); return; }
  js = js.slice(0, js.lastIndexOf('/*', cut));
  ctx = { console: console, setInterval: function () {}, setTimeout: function () {}, window: {},
    localStorage: { getItem: function (k) { return store.hasOwnProperty(k) ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); } } };
  vm.createContext(ctx);
  vm.runInContext(js + '\nthis.PC = PC; this.Pix = Pix; this.Ascii = Ascii; this.Story = AsciiStory;', ctx);
  PC = ctx.PC; A = ctx.Ascii; S = ctx.Story; SC = A.scenes; F = new A.Field();

  function check(name, f) {
    var i, lit = 0;
    for (i = 0; i < f.lum.length; i++) {
      if (!(f.lum[i] >= 0 && f.lum[i] < 4)) { bad(name + ': luce fuori scala alla cella ' + i + ' (' + f.lum[i] + ')'); return; }
      if (f.tint[i] > 5 || f.st[i] > 6) { bad(name + ': tinta o tratto sbagliati'); return; }
      if (f.lum[i] > 0.045) { lit++; }
    }
    if (lit < 150) { bad(name + ': scena quasi vuota (' + lit + ' celle accese)'); }
  }
  // ogni scena: due istanti, due fotogrammi diversi; e deve reggere una camera stretta
  var mapSt = [{ visited: {}, room: '', cala: 0 }];
  t0 = Date.now();
  Object.keys(SC).forEach(function (id) {
    var a, b, s0 = id === S.map ? null : {};
    try {
      if (id === S.map) { return; }
      F.clear(); F.cam(); SC[id](F, 1.3, s0); check(id, F); a = A.dump(F, 1.3);
      F.clear(); F.cam(42, 28, 1.5); SC[id](F, 7.9, s0); check(id + ' (camera stretta)', F);
      F.clear(); F.cam(); SC[id](F, 7.9, s0); b = A.dump(F, 7.9); frames += 3;
      if (a === b) { bad(id + ': la scena non si muove'); }
    } catch (e) { bad(id + ': ERRORE ' + e.stack); }
  });
  console.log('scene: ' + Object.keys(SC).length + ', ' + ((Date.now() - t0) / Math.max(1, frames)).toFixed(1) + ' ms a fotogramma (solo la griglia)');
  if (!SC[S.map]) { bad('manca la scena della mappa: ' + S.map); }

  // una partita: ogni tavola deve avere una casa, ogni stanza la sua scena, ogni filmato le sue inquadrature
  function filmCheck(f, id) {
    f.def.steps.forEach(function (s, i) {
      if (!SC[s.scene] || !s.text) { bad('filmato ' + id + ', inquadratura ' + i + ': scena o testo mancanti (' + s.scene + ')'); return; }
      [0, 2.5, 12].forEach(function (u) {
        try { var c = s.cam(u); F.clear(); F.cam(c[0], c[1], c[2]); SC[s.scene](F, 4 + u, s.st(u, u + i * 6)); check(id + '/' + i + '@' + u, F); }
        catch (e) { bad('filmato ' + id + ', inquadratura ' + i + ': ' + e.message); }
      });
    });
    if (!(f.take >= 2)) { bad('filmato ' + id + ': non dice quanti blocchi prende'); }
  }
  function look(blocks, cmd) {
    var s = PC.status(), sc = S.scene(s.room, s.ch);
    rooms[s.room + ' / cap. ' + s.ch] = sc;
    if (!SC[sc]) { bad('stanza senza scena: ' + s.room + ', capitolo ' + s.ch + ' -> ' + sc); }
    blocks.forEach(function (b, i) {
      if (b.t === 'map') { try { F.clear(); F.cam(); SC[S.map](F, 2, b); check('mappa dopo «' + cmd + '»', F); } catch (e) { bad('mappa: ' + e.message); } return; }
      if (b.t !== 'img') { return; }
      seen[b.id] = 1;
      if (S.films[b.id] && blocks[i + 1] && blocks[i + 1].t === 'p') { films[b.id] = 1; filmCheck(S.films[b.id](blocks, i), b.id); return; }
      if (SC[b.id]) { return; }
      if (/^o_/.test(b.id) && ctx.Pix.scenes[b.id]) { try { F.clear(); F.bits(ctx.Pix.render(b.id, 0), 2, 12, 81, 40, 0); check(b.id, F); } catch (e) { bad(b.id + ': non si converte: ' + e.message); } return; }
      bad('tavola senza scena né ripiego: ' + b.id + ' (dopo «' + cmd + '»)');
    });
  }
  var start = PC.start(true), code, pro;
  look(start.blocks, 'inizio');
  st.path.forEach(function (c) { look(PC.exec(c), c); });
  if (PC.status().ch !== st.endCh) { bad('il percorso non arriva dove deve: ' + JSON.stringify(PC.status())); }
  code = PC.exec('salva').filter(function (b) { return b.t === 'code'; })[0].s;
  st.endings.forEach(function (cmds) {
    PC.exec('carica ' + code);
    cmds.forEach(function (c) { look(PC.exec(c), c); });
    if (!PC.status().end) { bad('finale non raggiunto con: ' + cmds.join(', ')); }
  });
  st.mustFilm.forEach(function (id) { if (!films[id]) { bad('il filmato ' + id + ' non è partito'); } });
  pro = PC.prologue().map(function (pg) { return pg.filter(function (b) { return b.t === 'prosa'; })[0].s; });
  filmCheck({ def: S.prologo(pro), take: 2 }, 'prologo');
  console.log('tavole incontrate: ' + Object.keys(seen).length + ', filmati: ' + Object.keys(films).join(', ') + ', stanze e capitoli: ' + Object.keys(rooms).length + (st.endings.length ? ', finali: ' + st.endings.length : ''));

  // la partita per telefono non deve toccare quella per e-reader
  keys = Object.keys(store);
  if (!keys.length || keys.some(function (k) { return k.indexOf(st.key) !== 0; })) { bad('chiavi di salvataggio inattese: ' + keys.join(', ')); }
  ext = (html.match(/(src|href)="https?:[^"]+/g) || []).filter(function (u) { return u.indexOf('fonts.googleapis.com') < 0; });
  if (ext.length) { bad('la pagina carica cose esterne: ' + ext.join(', ')); }
  console.log(fails === n0 ? 'a posto' : 'problemi: ' + (fails - n0));
});
console.log(fails ? '\nPROBLEMI: ' + fails : '\ntutto a posto');
