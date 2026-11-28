// Gioca "Acqua Cheta" senza browser: percorso completo, ogni finale da un codice salvato, le conseguenze,
// e poi molte partite a caso guidate solo dagli indizi, per controllare che non ci si possa bloccare.
// Uso: node scripts/play-acqua.js        (aggiungi -v per leggere tutto il testo)
var fs = require('fs'), vm = require('vm'), path = require('path');
var verbose = process.argv[2] === '-v';
var src = path.join(__dirname, '..', 'src'), dir = path.join(src, 'acqua-cheta');
var ctx = { console: console };
vm.createContext(ctx);
var code = fs.readFileSync(path.join(src, 'gfx.js'), 'utf8') + '\n' + fs.readFileSync(path.join(dir, 'engine.js'), 'utf8');
fs.readdirSync(dir).sort().forEach(function (f) { if (/^pix.*\.js$/.test(f)) { code += '\n' + fs.readFileSync(path.join(dir, f), 'utf8'); } });
vm.runInContext(code + '\nthis.PC = PC; this.Pix = Pix;', ctx);
var PC = ctx.PC, fails = 0;
function bad(msg) { fails++; console.log('PROBLEMA: ' + msg); }

function show(blocks) {
  return blocks.map(function (b) {
    if (b.t === 'img') return '[TAVOLA ' + b.id + ' | ' + b.cap + ']';
    if (b.t === 'map') return '[MAPPA visti=' + Object.keys(b.visited).join(',') + ' qui=' + b.room + ']';
    if (b.t === 'sheet') return '[SCHEDA ' + b.name + ']\n' + b.rows.map(function (r) { return '  ' + r[0] + ': ' + r[1]; }).join('\n') +
      b.lists.map(function (L) { return '\n  ' + L[0].toUpperCase() + ':\n' + L[1].map(function (x) { return '    - ' + (x.join ? x.join(': ') : x); }).join('\n'); }).join('');
    if (b.t === 'front') return '=== ' + b.s + ' / ' + b.sub + ' ===';
    if (b.t === 'chapter') return '######## ' + b.n + ' — ' + b.s + ' ########';
    if (b.t === 'end') return '*** ' + b.s + ' ***';
    if (b.t === 'code') return 'CODICE ' + b.s;
    if (b.t === 'restart' || b.t === 'prologue' || b.t === 'home') return '[' + b.t + ']';
    return (b.t === 'room' ? '## ' : '') + b.s;
  }).join('\n');
}
function run(cmds, quiet) {
  var last;
  cmds.forEach(function (c) { last = PC.exec(c); if (!quiet) console.log('\n> ' + c + '\n' + show(last)); });
  return last;
}
function codeNow() { return PC.exec('salva').filter(function (b) { return b.t === 'code'; })[0].s; }
var NO = /Di questo non mi passa|non ho nemmeno una voce|Non so più molte cose|Il resto non è roba mia|Non è materia della sua perizia/;

var st = PC.start(true);
if (verbose) { PC.prologue().forEach(function (p, i) { console.log('--- prologo ' + (i + 1) + '\n' + show(p)); }); console.log(show(st.blocks)); }

var path1 = [
  // capitolo 1
  'xyzzy', 'esamina palina', 'n', 'n', 'o', 'esamina avviso', 'e', 'su', 'parla donna', 'usa telefono', 'usa telefono', 'parla giovanotto', 'prendi minestra', 'telefona a milano', 'dormi',
  'su', 'esamina valigia', 'esamina finestra', 'dormi',
  // capitolo 2
  'giu', 'esamina biglietto', 'parla olga', 'parla vescovi', 'o', 'o', 'parla vedova', 'parla marta', 'esamina malan', 'esamina mani', 'chiedi a marta di mani',
  'e', 'n', 'e', 'parla morandin', 'parla morandin', 'leggi fascicolo', 'esamina plastico', 'esamina fotografia', 'o', 'esamina lucchetto', 'su',
  'esamina sismografo', 'esamina lavagna', 'esamina cassetto', 'esamina calendario', 'esamina carte', 'esamina occhiali', 'prendi occhiali', 'giu',
  'n', 'parla bepi', 'parla bepi', 'esamina parapetto', 'esamina orologio', 'esamina asta', 'esamina scarichi', 'giu', 'mostra occhiali a bepi',
  // capitolo 3
  'parla bepi', 'scheda', 'giu', 'apri portello', 'giu', 'esamina spie', 'esamina pendolo', 'apri tubo', 'prendi relazione', 'mappa', 'su', 'n', 'parla morandin'
];
// prima di ogni mossa del percorso chiede un indizio: deve esserci sempre, e i tre gradi devono essere diversi
var hintSteps = {}, asked = {};
path1.forEach(function (c) {
  var h1 = show(PC.exec('indizio')), h2, h3;
  if (h1.indexOf('Indizio 1 di 3') >= 0) {
    h2 = show(PC.exec('indizio')); h3 = show(PC.exec('indizio'));
    if (h3.indexOf('Indizio 3 di 3') < 0 || h1 === h2 || h2 === h3) { bad('indizio sbagliato prima di «' + c + '»:\n' + h1 + '\n' + h3); }
    hintSteps[h3.split('\n')[1]] = 1;
  } else if (h1.indexOf('Indizio 3 di 3') < 0) { bad('indizio senza grado prima di «' + c + '»: ' + h1); }
  // a ogni passo: ogni argomento proposto da PARLA deve avere una risposta vera, poi si torna indietro
  var snap = codeNow();
  ['parla olga', 'parla vescovi', 'parla marta', 'parla bepi', 'parla morandin'].forEach(function (pc) {
    var r = show(PC.exec(pc)), m2, re2 = /\[\[[^|\]]+\|(chiedi a \w+ di \w+)\]\]/g;
    while ((m2 = re2.exec(r))) {
      var ans = show(PC.exec(m2[1]));
      asked[m2[1] + ' @' + PC.status().ch] = 1;
      if (!ans || /undefined|null/.test(ans) || NO.test(ans)) { bad('argomento senza risposta: ' + m2[1] + ' -> ' + ans); }
      if (verbose) { console.log('  > ' + m2[1] + '\n  ' + ans.split('\n')[0]); }
    }
    PC.exec('carica ' + snap);
  });
  var out = show(run([c], !verbose));
  if (/undefined|\bnull\b|NaN/.test(out)) { bad('testo rotto dopo «' + c + '»: ' + out); }
});
console.log('domande provate lungo il percorso: ' + Object.keys(asked).length);
console.log('indizi diversi lungo il percorso: ' + Object.keys(hintSteps).length);
if (PC.status().ch !== 3 || PC.status().room !== 'Coronamento della diga') { bad('il percorso non arriva alla scelta di Morandin: ' + JSON.stringify(PC.status())); }
var code3 = codeNow();
console.log('\nCODICE prima della scelta di Morandin:', code3, '| stato', JSON.stringify(PC.status()));

function ending(label, offerCmd, extra, dest, expect, must) {
  PC.exec('carica ' + code3.toLowerCase());
  var cmds = [offerCmd].concat(extra).concat(['s', 's', 'e', 'chiama ' + dest, 'est', 'est', 'chiama ' + dest, 'usa cuffia', 'chiama nessuno', 'chiama ' + dest]);
  var txt = '', last;
  cmds.forEach(function (c) { last = PC.exec(c); txt += show(last) + '\n'; if (verbose) console.log('\n> ' + c + '\n' + show(last)); });
  var end = last.filter(function (b) { return b.t === 'end'; })[0];
  var pic = last.filter(function (b) { return b.t === 'img' && /^f_/.test(b.id) && ctx.Pix.scenes[b.id]; }).length;
  var tx = last.filter(function (b) { return b.t === 'img' && /^tx_/.test(b.id) && ctx.Pix.scenes[b.id]; }).length;
  var ok = end && end.s.indexOf(expect) >= 0 && pic === 1 && tx === 1 && (must || []).every(function (m) { return txt.indexOf(m) >= 0; });
  if (!ok) { fails++; console.log(txt.slice(-2500)); }
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + label + ' -> ' + (end ? end.s : '(nessun finale)') + ' | uscite dopo: [' + PC.exits().join(',') + '] | ' + show(PC.exec('nord')));
}
ending('rifiuta + Milano', 'rifiuta', ['parla morandin', 'parla morandin', 'parla morandin', 'parla bepi'], 'milano', 'La pratica', ['Morte volontaria', 'Capisce perché devo avere ragione io']);
ending('accetta + Milano', 'accetta', [], 'ferrante', 'Il posto', ['Infortunio sul lavoro']);
ending('rifiuta + giornale', 'sud', ['n'], 'giornale', 'Notizie false', ['È firmata da un morto']);
ending('accetta + giornale', 'dai relazione a morandin', [], 'giornale', 'Notizie false', ['una lettrice']);
ending('rifiuta + diga, con Bepi', 'rifiuta', ['chiedi a bepi di scarichi'], 'diga', 'Acqua bassa', ['undici metri']);
ending('rifiuta + diga, senza Bepi', 'rifiuta', [], 'bepi', 'Acqua bassa', ['sceso di due metri']);
ending('accetta + diga', 'accetta', ['chiedi a bepi di scarichi'], 'diga', 'Acqua bassa', ['Con che faccia mi chiama']);
ending('rifiuta + canonica', 'rifiuta', ['s', 's', 'o', 'parla marta', 'chiedi a marta di relazione', 'e', 'n', 'n'], 'canonica', 'Al lupo', ['campana a martello']);
ending('accetta + canonica', 'accetta', [], 'campane', 'Al lupo', ['hai la voce']);

var fin = show(PC.exec('finali'));
console.log(fin);
if (fin.indexOf('5 su 5') < 0) { bad('i finali trovati non sono cinque'); }

// conseguenze: le stesse partite, con scelte diverse nei dialoghi, devono cambiare i capitoli dopo e i finali
function variant(label, edits, tail, expect) {
  PC.start(true);
  var p2 = [];
  path1.forEach(function (c) { if (edits[c]) { p2 = p2.concat(edits[c]); } p2.push(c); });
  var txt = p2.concat(tail).map(function (c) { return show(PC.exec(c)); }).join('\n'), ok = expect.every(function (e) { return txt.indexOf(e) >= 0; });
  if (!ok) { fails++; console.log(txt.slice(-3500)); }
  console.log((ok ? 'OK  ' : 'FAIL') + ' conseguenze: ' + label);
}
var TOCALL = ['s', 's', 'e', 'est', 'est', 'usa cuffia'];
variant('Morandin sa delle mani', { 'leggi fascicolo': ['chiedi a morandin di mani'] }, ['rifiuta', 'chiedi a bepi di scarichi'].concat(TOCALL, ['chiama diga']),
  ['Non ho chiesto come', 'Per questo sono venuto io', 'a costruire un acquedotto']);
variant('Olga smascherata', { 'parla olga': ['chiedi a olga di cuffia'] }, ['rifiuta'].concat(TOCALL, ['chiama giornale']), ['avrò mal di testa', 'le tolgono il posto telefonico']);
variant('Vescovi sa delle mani', { 'esamina plastico': ['o', 's', 'e', 'chiedi a vescovi di mani', 'o', 'n', 'e'] }, ['rifiuta', 's', 's', 'o', 'chiedi a marta di giornale', 'e', 'e', 'est', 'est', 'usa cuffia', 'chiama milano'],
  ['Questo lo detto oggi', 'cosa ha dettato il giornalista', 'sta per diventare un titolo', 'la perizia è tua']);
variant('gli occhiali mostrati a Morandin e a Marta', { 'mostra occhiali a bepi': ['s', 'e', 'mostra occhiali a morandin', 'o', 's', 'o', 'mostra occhiali a marta', 'e', 'n', 'n'] }, ['rifiuta'],
  ['non ha chiesto di chi sono', 'Li faccia vedere a chi', 'Per questo sono venuto io']);
variant('la chiave si apre anche con APRI LUCCHETTO', { 'su': ['apri lucchetto'] }, ['scheda'], ['Capitolo terzo']);

// ricomincia capitolo: dopo un finale si torna all'inizio del capitolo 4, con le stesse scelte
(function () {
  PC.exec('carica ' + code3); run(['rifiuta'].concat(TOCALL, ['chiama canonica']), true);
  var r = show(PC.exec('ricomincia capitolo')), s4 = PC.status();
  var ok = s4.ch === 4 && !s4.end && s4.room === 'Coronamento della diga' && r.indexOf('Quota 715') >= 0;
  PC.start(true); run(['n', 'e'], true); PC.exec('ricomincia capitolo'); ok = ok && PC.status().room === 'Fermata della corriera' && PC.status().moves === 0;
  if (!ok) { fails++; console.log(r); }
  console.log((ok ? 'OK  ' : 'FAIL') + ' ricomincia capitolo');
})();
// codice sbagliato, codice alterato, codice dell'altra storia
console.log('\ncodice vuoto:', show(PC.exec('carica')));
console.log('codice alterato:', show(PC.exec('carica ' + code3.replace(/.$/, code3.slice(-1) === 'A' ? 'B' : 'A'))));
(function () {
  var c2 = {}; vm.createContext(c2);
  vm.runInContext(fs.readFileSync(path.join(src, 'via-libera', 'engine.js'), 'utf8') + '\nthis.PC = PC;', c2);
  c2.PC.start(true); c2.PC.exec('n');
  var other = c2.PC.exec('salva').filter(function (b) { return b.t === 'code'; })[0].s, r = show(PC.exec('carica ' + other));
  console.log('codice di Via Libera:', r);
  if (r.indexOf('Via Libera') < 0) { bad('il codice dell\'altra storia non viene riconosciuto'); }
  if (show(c2.PC.exec('carica ' + code3)).indexOf('non torna') < 0) { bad('Via Libera accetta un codice di Acqua Cheta'); }
})();
var again = PC.exec('carica ' + code3);
console.log('ricarica:', show(again).split('\n')[0], '|', JSON.stringify(PC.status()));
if (codeNow() !== code3) { bad('il codice ricaricato non è lo stesso'); }
console.log('scheda alla fine del capitolo 3:\n' + show(PC.exec('scheda')));
if (show(PC.exec('storie')) !== '[home]') { bad('STORIE non torna all\'elenco'); }

// ---------- partite a caso: non ci si deve poter bloccare ----------
// Un giocatore distratto fa cose a caso (parla, mostra, chiede, gira), e ogni tanto segue il terzo indizio.
// Qualunque cosa abbia combinato, seguendo gli indizi deve arrivare a un finale.
var WORDS = ['olga', 'vescovi', 'marta', 'bepi', 'morandin', 'mani', 'occhiali', 'relazione', 'lettera', 'sigarette', 'chiavetta', 'chiavi', 'lampada', 'telefono', 'minestra', 'lucchetto',
  'portello', 'tubo', 'pendolo', 'scarichi', 'cuffia', 'quadro', 'fascicolo', 'biglietto', 'corpo', 'valigia', 'letto', 'asta', 'parapetto', 'marcia', 'lago', 'stufa', 'macchina', 'commissione', 'avvocato', 'malan'];
var VERBI = ['esamina', 'prendi', 'apri', 'usa', 'dai', 'parla', 'leggi', 'chiedi a olga di', 'chiedi a marta di', 'chiedi a bepi di', 'chiedi a morandin di', 'chiedi a vescovi di', 'mostra occhiali a', 'mostra relazione a', 'dai lettera a'];
var seed = 7;
function rnd(n) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) % n; }
var games = 300, finished = 0, endsSeen = {}, longest = 0, g, steps, k, h, links, m3, re3, out3, ex, lastKey, stuck;
for (g = 0; g < games && fails < 5; g++) {
  PC.start(true); steps = 0; lastKey = ''; stuck = 0;
  var chaos = g % 3 === 0 ? 0 : (g % 3 === 1 ? 3 : 8);   // quante mosse a caso tra un indizio e l'altro
  while (!PC.status().end && steps < 5000) {
    try {
      for (k = 0; k < chaos; k++) {
        steps++;
        if (rnd(3) === 0) { ex = PC.exits(); out3 = ex.length ? PC.exec(ex[rnd(ex.length)]) : PC.exec('guarda'); }
        else if (rnd(12) === 0) { out3 = PC.exec(['accetta', 'rifiuta', 'dormi', 'aspetta', 'chiama milano', 'inventario', 'scheda', 'mappa'][rnd(8)]); }
        else { out3 = PC.exec(VERBI[rnd(VERBI.length)] + ' ' + WORDS[rnd(WORDS.length)]); }
        if (/undefined|\bnull\b|NaN/.test(show(out3))) { bad('testo rotto in una partita a caso: ' + show(out3)); }
        if (PC.status().end) { break; }
      }
      if (PC.status().end) { break; }
      PC.exec('indizio'); PC.exec('indizio'); h = show(PC.exec('indizio'));
      links = []; re3 = /\[\[[^|\]]+\|([^\]]+)\]\]/g;
      while ((m3 = re3.exec(h))) { if (m3[1] !== 'indizio') { links.push(m3[1]); } }
      if (!links.length) { bad('indizio senza un comando da toccare: ' + h); break; }
      var before = codeNow();
      // finali e offerta: sceglie a caso tra le alternative; negli altri casi prova i comandi in ordine
      if (/chiama|accetta/.test(links[0])) { PC.exec(links[rnd(links.length)]); steps++; }
      else { PC.exec(links[0]); steps++; }   // il primo comando dell'indizio vale sempre da dove sei: o è la mossa, o è la direzione
      // se l'indizio non ha mosso niente (stanza sbagliata), si gira: gli indizi dicono dove andare, il caso ci arriva
      if (codeNow() === before) { stuck++; ex = PC.exits(); if (ex.length) { PC.exec(ex[rnd(ex.length)]); steps++; } } else { stuck = 0; }
      if (stuck > 3) { bad('bloccata: partita ' + g + ', stato ' + JSON.stringify(PC.status()) + ', indizio: ' + h); break; }
    } catch (e) { bad('errore in una partita a caso: ' + e.stack); break; }
  }
  if (!PC.status().end) { bad('partita ' + g + ' senza finale dopo ' + steps + ' mosse: ' + JSON.stringify(PC.status()) + ' ' + codeNow()); }
  else { finished++; endsSeen[PC.status().end] = (endsSeen[PC.status().end] || 0) + 1; longest = Math.max(longest, steps); }
}
console.log('\npartite a caso: ' + games + ', finite ' + finished + '. Finali: ' + JSON.stringify(endsSeen) + ', la più lunga ' + longest + ' mosse');
if (Object.keys(endsSeen).length < 5) { bad('le partite a caso non hanno toccato tutti i finali'); }

// ogni scena deve disegnarsi senza errori su tutti i fotogrammi, e muoversi davvero
var SC = ctx.Pix.scenes, nsc = 0;
Object.keys(SC).forEach(function (id) {
  var sc = SC[id], g0, gg, black = 0, diff = 0, wrong = 0, f, i;
  nsc++;
  try {
    for (f = 0; f < sc.n; f++) {
      gg = ctx.Pix.render(id, f);
      for (i = 0; i < gg.d.length; i++) { if (gg.d[i] !== 0 && gg.d[i] !== 1) wrong++; }
      if (f === 0) { g0 = gg; for (i = 0; i < gg.d.length; i++) black += gg.d[i]; }
      if (f === 1) { for (i = 0; i < gg.d.length; i++) if (gg.d[i] !== g0.d[i]) diff++; }
    }
    if (verbose) console.log('scena ' + id + ': fotogrammi=' + sc.n + ' nero=' + Math.round(100 * black / g0.d.length) + '% cambiano tra f0 e f1=' + diff);
    if (wrong || (sc.n > 1 && !diff)) { bad('scena ' + id + ': punti non validi=' + wrong + ', movimento=' + diff); }
  } catch (e) { bad('scena ' + id + ': ERRORE ' + e.message); }
});
console.log('scene disegnate: ' + nsc);
// ogni tavola chiamata dalla storia deve esistere
var eng = fs.readFileSync(path.join(dir, 'engine.js'), 'utf8'), re = /IMG\(([^,]+),/g, m, ids = {};
while ((m = re.exec(eng))) { (m[1].match(/"([^"]+)"/g) || []).forEach(function (q) { ids[q.slice(1, -1)] = 1; }); }
var pk0 = /var END_PIC = \{([\s\S]*?)\};/.exec(eng)[1]; (pk0.match(/"(f_\w+)"/g) || []).forEach(function (q) { ids[q.slice(1, -1)] = 1; });
var pic = /var PIC = \{([\s\S]*?)\};/.exec(eng)[1], pk = /(\w+):/g;
while ((m = pk.exec(pic))) { ids['o_' + m[1]] = 1; }
delete ids['o_']; delete ids['tx_'];
['milano', 'giornale', 'diga', 'paese'].forEach(function (d) { ids['tx_' + d] = 1; });
Object.keys(ids).forEach(function (id) { if (!SC[id]) { bad('tavola mancante: ' + id); } });
console.log('tavole chiamate dalla storia: ' + Object.keys(ids).length);
[{ visited: { corriera: 1 }, room: 'corriera' }, { visited: { corriera: 1, piazza: 1, albergo: 1, camera: 1 }, room: 'camera' },
  { visited: { corriera: 1, piazza: 1, albergo: 1, camera: 1, chiesa: 1, strada: 1, direzione: 1, baracca: 1, diga: 1, cunicolo: 1, centralino: 1 }, room: 'cunicolo' }].forEach(function (ms) {
  var gm = new ctx.Pix.Gfx(240, 150), here = ctx.Pix.drawMap(gm, ms);
  if (!here) { bad('la mappa non dice dove sei: ' + ms.room); }
});
console.log('mappa ok');
console.log(fails ? 'PROBLEMI: ' + fails : 'tutto a posto');
