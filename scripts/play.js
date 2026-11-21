// Gioca "Via Libera" senza browser: percorso completo, poi ogni finale da un codice salvato.
// Uso: node scripts/play.js src        (aggiungi -v per leggere tutto il testo)
var fs = require('fs'), vm = require('vm');
var dir = process.argv[2], verbose = process.argv[3] === '-v';
var ctx = { console: console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dir + '/engine.js', 'utf8') + '\n' + fs.readFileSync(dir + '/pix.js', 'utf8') + '\nthis.PC = PC; this.Pix = Pix;', ctx);
var PC = ctx.PC;

function show(blocks) {
  return blocks.map(function (b) {
    if (b.t === 'img') return '[TAVOLA ' + b.id + ' | ' + b.cap + ']';
    if (b.t === 'map') return '[MAPPA visti=' + Object.keys(b.visited).join(',') + ' qui=' + b.room + ' cala=' + b.cala + ']';
    if (b.t === 'sheet') return '[SCHEDA ' + b.name + ']\n' + b.rows.map(function (r) { return '  ' + r[0] + ': ' + r[1]; }).join('\n') +
      b.lists.map(function (L) { return '\n  ' + L[0].toUpperCase() + ':\n' + L[1].map(function (x) { return '    - ' + (x.join ? x.join(': ') : x); }).join('\n'); }).join('');
    if (b.t === 'front') return '=== ' + b.s + ' / ' + b.sub + ' ===';
    if (b.t === 'chapter') return '######## ' + b.n + ' — ' + b.s + ' ########';
    if (b.t === 'end') return '*** ' + b.s + ' ***';
    if (b.t === 'code') return 'CODICE ' + b.s;
    if (b.t === 'restart' || b.t === 'prologue') return '[' + b.t + ']';
    return (b.t === 'room' ? '## ' : '') + b.s;
  }).join('\n');
}
function run(cmds, quiet) {
  var last;
  cmds.forEach(function (c) { last = PC.exec(c); if (!quiet) console.log('\n> ' + c + '\n' + show(last)); });
  return last;
}
var st = PC.start(true);
if (verbose) { PC.prologue().forEach(function (p, i) { console.log('--- prologo ' + (i + 1) + '\n' + show(p)); }); console.log(show(st.blocks)); }

var path = [
  // capitolo 1
  'xyzzy', 'n', 'n', 'o', 'e', 'su', 'parla donna', 'mostra tesserino', 'telefono', 'prendi grappa', 'parla uomo', 'parla uomo', 'usa telefono', 'dormi',
  'su', 'esamina valigia', 'prendi pistola', 'esamina finestra', 'dormi',
  // capitolo 2
  'esamina valigia', 'giu', 'parla nives', 'parla nives', 'parla kessel', 'o', 'o', 'parla lodi', 'parla lodi', 'parla lodi', 'leggi fascicolo', 'esamina fotografie',
  'e', 'n', 'n', 'apri porta', 's', 'e', 'e', 'esamina registro', 'esamina stufa', 'esamina scrivania', 'esamina fotografia', 'prendi fotografia',
  'o', 'giu', 's', 'e', 'mostra la fotografia a nives',
  // capitolo 3
  'parla nives', 'scheda', 'o', 'n', 'n', 'su', 'apri porta', 'su', 'usa leva', 'apri sportello', 'prendi quaderno', 'mappa', 'giu', 'su', 'parla kessel'
];
// prima di ogni mossa del percorso chiede un indizio: deve esserci sempre, e i tre gradi devono essere diversi
var hintSteps = {}, fails = 0, asked = {};
path.forEach(function (c) {
  var h1 = show(PC.exec('indizio')), h2, h3;
  if (h1.indexOf('Indizio 1 di 3') >= 0) {
    h2 = show(PC.exec('indizio')); h3 = show(PC.exec('indizio'));
    if (h3.indexOf('Indizio 3 di 3') < 0 || h1 === h2 || h2 === h3) { fails++; console.log('indizio sbagliato prima di «' + c + '»:\n' + h1 + '\n' + h3); }
    hintSteps[h3.split('\n')[1]] = 1;
  } else if (h1.indexOf('Indizio 3 di 3') < 0) { fails++; console.log('indizio senza grado prima di «' + c + '»: ' + h1); }
  // a ogni passo: ogni argomento proposto da PARLA deve avere una risposta vera, poi si torna indietro
  var snap = PC.exec('salva').filter(function (b) { return b.t === 'code'; })[0].s;
  ['parla nives', 'parla kessel', 'parla lodi', 'parla brandi'].forEach(function (pc) {
    var r = show(PC.exec(pc)), m2, re2 = /\[\[[^|\]]+\|(chiedi a \w+ di \w+)\]\]/g;
    while ((m2 = re2.exec(r))) {
      var ans = show(PC.exec(m2[1]));
      asked[m2[1]] = 1;
      if (!ans || /undefined|null/.test(ans) || /Di questo non so|Non è merce|Non è di mia|Non sei qui per fare/.test(ans)) { fails++; console.log('argomento senza risposta: ' + m2[1] + ' -> ' + ans); }
      if (verbose) { console.log('  > ' + m2[1] + '\n  ' + ans.split('\n')[0]); }
    }
    PC.exec('carica ' + snap);
  });
  run([c], !verbose);
});
console.log('domande provate lungo il percorso: ' + Object.keys(asked).length);
console.log('indizi diversi lungo il percorso: ' + Object.keys(hintSteps).length);
var before = PC.exec('salva');
var code = before.filter(function (b) { return b.t === 'code'; })[0].s;
console.log('\nCODICE prima della scelta di Kessel:', code, '| stato', JSON.stringify(PC.status()));

function ending(label, kesselCmd, extra, sig, expect) {
  var r = PC.exec('carica ' + code.toLowerCase());
  var pre = [kesselCmd].concat(extra).concat(['n', 'su', 'segnala ' + sig, 'usa leva', 'segnala 9-9', 'segnala ' + sig]);
  var last = run(pre, !verbose);
  var end = last.filter(function (b) { return b.t === 'end'; })[0];
  var ok = end && end.s.indexOf(expect) >= 0;
  if (!ok) fails++;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + label + ' -> ' + (end ? end.s : show(last)) + ' | uscite dopo: [' + PC.exits().join(',') + '] | ' + show(PC.exec('nord')));
}
ending('rifiuta + 1-3', 'rifiuta', ['s', 'giu', 'parla brandi', 'parla brandi', 'parla brandi', 'usa pistola', 'dai quaderno a brandi', 'su'], '1-3', 'Il lavoro');
ending('accetta + 1-3', 'accetta', [], '1-3', 'Il passaporto');
ending('rifiuta + 2-2', 'sud', ['n'].slice(0, 0), '2-2', 'Mare vuoto');
ending('rifiuta + 2-1', 'rifiuta', [], '2-1', 'Nessuna decisione');
ending('rifiuta + 3-1', 'rifiuta', ['s', 's', 'e', 'parla nives', 'parla nives', 'parla nives', 'su', 'o', 'o', 'n'], '3-1', 'La guardiana');
ending('accetta + 3-1', 'dai quaderno a kessel', [], '3-1', 'La guardiana');

var fin = show(PC.exec('finali'));
console.log(fin);
if (fin.indexOf('5 su 5') < 0) { fails++; }
// conseguenze: le stesse partite, con scelte diverse nei dialoghi, devono cambiare i finali
function variant(label, edits, tail, expect) {
  PC.start(true);
  var p2 = [];
  path.forEach(function (c) { if (edits[c]) { p2 = p2.concat(edits[c]); } p2.push(c); });
  var txt = p2.concat(tail).map(function (c) { return show(PC.exec(c)); }).join('\n'), ok = expect.every(function (e) { return txt.indexOf(e) >= 0; });
  if (!ok) { fails++; console.log(txt.slice(-3000)); }
  console.log((ok ? 'OK  ' : 'FAIL') + ' conseguenze: ' + label);
}
variant('Lodi vede i polsi, Nives sa', { 'e': ['chiedi a lodi di polsi'], 'mostra la fotografia a nives': ['chiedi a nives di polsi'] },
  ['rifiuta', 'n', 'su', 'usa leva', 'segnala 1-3'], ['Le altre due, dice, sono saltate giù', 'Adesso sa anche chi ha acceso la luce']);
variant('Nives tradita', { 'mostra la fotografia a nives': ['o', 'o', 'mostra fotografia a lodi', 'e', 'e'] },
  ['rifiuta', 's', 's', 'e', 'chiedi a nives di zanon', 'o', 'n', 'n', 'su', 'usa leva', 'segnala 3-1'], ['Chieda ai suoi amici', 'Nives non ti saluta. La fotografia']);
variant('Kessel sa della K.', { 'mostra la fotografia a nives': ['chiedi a kessel di iniziali'] }, ['accetta', 'n', 'su', 'usa leva', 'segnala 1-3'], ['Ormai siamo colleghi']);
variant('la fotografia chiesta a Nives fa avanzare', { 'mostra la fotografia a nives': ['chiedi a nives di fotografia'] }, ['scheda'], ['Capitolo terzo']);

// codice sbagliato, codice alterato
console.log('\ncodice vuoto:', show(PC.exec('carica')));
console.log('codice alterato:', show(PC.exec('carica ' + code.replace(/.$/, code.slice(-1) === 'A' ? 'B' : 'A'))));
var again = PC.exec('carica ' + code);
console.log('ricarica:', show(again).split('\n')[0], '|', JSON.stringify(PC.status()));
console.log('scheda finale di capitolo 3:\n' + show(PC.exec('scheda')));

// ogni scena deve disegnarsi senza errori su tutti i fotogrammi, e muoversi davvero
var SC = ctx.Pix.scenes;
Object.keys(SC).forEach(function (id) {
  var sc = SC[id], g0, g, black = 0, diff = 0, bad = 0, f, i;
  try {
    for (f = 0; f < sc.n; f++) {
      g = ctx.Pix.render(id, f);
      for (i = 0; i < g.d.length; i++) { if (g.d[i] !== 0 && g.d[i] !== 1) bad++; }
      if (f === 0) { g0 = g; for (i = 0; i < g.d.length; i++) black += g.d[i]; }
      if (f === 1) { for (i = 0; i < g.d.length; i++) if (g.d[i] !== g0.d[i]) diff++; }
    }
    console.log('scena ' + id + ': fotogrammi=' + sc.n + ' punti non validi=' + bad + ' nero=' + Math.round(100 * black / g0.d.length) + '% cambiano tra f0 e f1=' + diff);
    if (bad || (sc.n > 1 && !diff)) fails++;
  } catch (e) { fails++; console.log('scena ' + id + ': ERRORE ' + e.message); }
});
// ogni tavola chiamata dalla storia deve esistere
var eng = fs.readFileSync(dir + '/engine.js', 'utf8'), re = /IMG\(([^,]+),/g, m, ids = {};
while ((m = re.exec(eng))) { (m[1].match(/"([^"]+)"/g) || []).forEach(function (q) { ids[q.slice(1, -1)] = 1; }); }
var pic = /var PIC = \{([\s\S]*?)\};/.exec(eng)[1], pk = /(\w+):/g;
while ((m = pk.exec(pic))) { ids['o_' + m[1]] = 1; }
delete ids['o_'];
Object.keys(ids).forEach(function (id) { if (!SC[id] && !/^tx$/.test(id)) { fails++; console.log('tavola mancante: ' + id); } });
console.log('tavole chiamate dalla storia: ' + Object.keys(ids).length);
var gm = new ctx.Pix.Gfx(240, 150); ctx.Pix.drawMap(gm, { visited: { molo: 1, piazza: 1 }, room: 'piazza', cala: 0 });
console.log('mappa ok');
console.log(fails ? 'PROBLEMI: ' + fails : 'tutto a posto');
