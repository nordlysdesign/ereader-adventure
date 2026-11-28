"""Assembla le pagine da src/: index.html (l'elenco delle storie) e una pagina per storia (motore, tavole, interfaccia).
Lo stile di base arriva dalla seconda prova. Uso: python3 scripts/build.py"""
import os, re, glob, zlib, struct, base64, subprocess
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + os.sep
v2 = open(base + 'prove/nero-di-seppia/index.html', encoding='utf-8').read()
css = re.search(r'<style>(.*?)</style>', v2, re.S).group(1)
css = css.replace("il prologo e' impaginato come un romanzo illustrato di fine Ottocento, il gioco come un terminale.",
                  "prologo e titoli dei capitoli sono impaginati come un romanzo, il gioco come un terminale.")
extra = r"""
/* ---------- terza prova ---------- */
.switches { display: flex; flex-wrap: wrap; gap: 8px 16px; }
figure canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
.sheet figure canvas { border: 2px solid var(--ink); }
.chapter { text-align: center; border-top: 2px solid var(--ink); border-bottom: 2px solid var(--ink); padding: 10px 0 12px; margin: 4px 0 14px; }
.chapter span { display: block; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; }
.chapter h2 { font-family: var(--serif); font-size: 27px; font-style: italic; font-weight: 400; margin: 2px 0 0; line-height: 1.15; text-wrap: balance; }
.out .code { font-size: 19px; font-weight: 600; letter-spacing: 2px; border: 2px solid var(--ink); padding: 10px 12px; text-align: center; word-break: break-all; max-width: none; }
.people { margin: 0 0 8px; padding-top: 6px; border-top: 1px solid var(--ink); font-size: 13px; line-height: 1.4; }
.people dt { font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; margin-top: 6px; }
.people dd { margin: 0; }
.facts { list-style: square; }
/* impostazioni: un pannello dentro lo schermo, aperto dal pulsante Aa */
.book { flex-wrap: wrap; }
.screen.rullo .pager { display: none; }
.screen.rullo .book { justify-content: flex-end; }
.prefs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 18px; padding: 8px 16px 10px; border-top: 2px solid var(--ink); }
.prefs.off { display: none; }
.prefs .switch { color: var(--ink); }
.prefs .seg button { color: var(--ink); border-color: var(--ink); background: var(--paper); }
.prefs .seg button[aria-pressed="true"] { background: var(--ink); color: var(--paper); }
.prefs .seg button:focus-visible { outline-color: var(--ink); }
.prefs .restart .chip { margin-left: 6px; }
.prefs-note { width: 100%; margin: 0; font-size: 12px; color: var(--ink-soft); }
/* cassetto: di base resta solo la riga di comando, il resto si apre con COMANDI */
.drawer.off { display: none; }
.drawer { border-top: 2px solid #111111; padding-bottom: 8px; }
.drawer .book { border-top: 0; }
.cmd { border-top: 2px solid #111111; padding-top: 8px; }
.screen.reading .drawer.off { display: block; }
.screen.reading .drawer .rows, .screen.reading .drawer .refs { display: none; }
/* dimensione del testo, scelta in Aa */
.screen.t2 .out { font-size: 17px; } .screen.t2 .out .note { font-size: 15px; } .screen.t2 .prosa p { font-size: 20px; }
.screen.t3 .out { font-size: 20px; } .screen.t3 .out .note { font-size: 17px; } .screen.t3 .prosa p { font-size: 23px; }
@media (max-width: 640px) { .stage { min-height: 100%; } .device { min-height: 100%; } }
/* elenco delle storie */
.home .out { padding-bottom: 20px; }
.story { border-top: 2px solid var(--ink); padding: 14px 0 6px; }
.story img { display: block; margin: 0 auto 8px; border: 2px solid var(--ink); width: 100%; max-width: 480px; height: auto; image-rendering: pixelated; image-rendering: crisp-edges; }
.story h3 { font-family: var(--serif); font-size: 26px; font-style: italic; font-weight: 400; margin: 0; line-height: 1.15; }
.story .where { display: block; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 2px; }
.story p { margin: 6px 0 8px; }
.story .state { font-size: 13px; color: var(--ink-soft); }
.story .go a, .story .go button { display: inline-block; text-decoration: none; line-height: 38px; min-height: 42px; margin: 0 8px 8px 0; padding: 0 14px; font-size: 14px; }
.story .go a.main { background: var(--ink); color: var(--paper); }
"""
html = r"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&amp;family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&amp;display=swap" rel="stylesheet">
<style>%(css)s%(extra)s</style>
</head>
<body>
<main class="stage">
  <div class="device">
    <div class="screen" id="screen">
      <div class="status"><span id="st-room">Prologo</span><span id="st-moves">Cap. 1 · Mosse 0</span></div>
      <div class="out" id="out" aria-live="polite"></div>

      <div class="drawer off" id="drawer">
      <div class="book">
        <div class="pager">
          <button type="button" class="chip" id="pg-prev" aria-label="Pagina precedente">◀</button>
          <span id="pg-label">Pag. 1 di 1</span>
          <button type="button" class="chip" id="pg-next" aria-label="Pagina successiva">▶</button>
        </div>
        <div class="refs">
          <button type="button" class="chip" id="ref-scheda" data-cmd="scheda">SCHEDA</button>
          <button type="button" class="chip" id="ref-mappa" data-cmd="mappa">MAPPA</button>
          <button type="button" class="chip" id="ref-salva" data-cmd="salva">SALVA</button>
          <button type="button" class="chip" id="ref-indizio" data-cmd="indizio">INDIZIO</button>
          <button type="button" class="chip" id="ref-aiuto" data-cmd="aiuto" aria-label="Aiuto">?</button>
          <button type="button" class="chip" id="ref-prefs" aria-label="Impostazioni" aria-expanded="false" aria-controls="prefs">Aa</button>
        </div>
      </div>

      <div class="prefs off" id="prefs">
        <div class="switch"><span id="lbl-mode">Schermo</span>
          <div class="seg" role="group" aria-labelledby="lbl-mode">
            <button type="button" id="mode-rullo" aria-pressed="true">Rullo</button>
            <button type="button" id="mode-pagina" aria-pressed="false">Pagina</button>
          </div>
        </div>
        <div class="switch"><span id="lbl-mot">Movimento</span>
          <div class="seg" role="group" aria-labelledby="lbl-mot">
            <button type="button" id="mot-on" aria-pressed="true">Sì</button>
            <button type="button" id="mot-off" aria-pressed="false">No</button>
          </div>
        </div>
        <div class="switch"><span id="lbl-size">Testo</span>
          <div class="seg" role="group" aria-labelledby="lbl-size">
            <button type="button" id="size-1" aria-pressed="true" aria-label="Testo normale">A</button>
            <button type="button" id="size-2" aria-pressed="false" aria-label="Testo grande">A+</button>
            <button type="button" id="size-3" aria-pressed="false" aria-label="Testo molto grande">A++</button>
          </div>
        </div>
        <div class="switch restart"><span>Ricomincia</span>
          <button type="button" class="chip" id="re-cap">Capitolo</button>
          <button type="button" class="chip" id="re-all">Da capo</button>
        </div>
        <div class="switch restart"><span>Storie</span>
          <button type="button" class="chip" id="go-home">Cambia storia</button>
        </div>
        <p class="prefs-note">Su e-ink il movimento lascia aloni: lì conviene spegnerlo.</p>
      </div>

      <div class="rows" id="rows">
        <span class="lab">Rotta</span>
        <div class="chips" id="chips-dir"></div>
        <span class="lab">Azioni</span>
        <div class="chips" id="chips-verb">
          <button type="button" class="chip" id="v-esamina" data-verb="esamina">ESAMINA</button>
          <button type="button" class="chip" id="v-prendi" data-verb="prendi">PRENDI</button>
          <button type="button" class="chip" id="v-apri" data-verb="apri">APRI</button>
          <button type="button" class="chip" id="v-usa" data-verb="usa">USA</button>
          <button type="button" class="chip" id="v-dai" data-verb="dai">DAI</button>
          <button type="button" class="chip" id="v-parla" data-verb="parla">PARLA</button>
        </div>
        <span class="lab">Con te</span>
        <div class="bag" id="bag"></div>
      </div>

      </div>

      <form class="cmd" id="cmd-form" autocomplete="off">
        <label for="cmd-input">&gt;</label>
        <input id="cmd-input" type="text" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="scrivi un comando">
        <button type="button" class="chip" id="drawer-btn" aria-expanded="false" aria-controls="drawer">COMANDI</button>
      </form>
    </div>
  </div>

</main>

<script>
%(gfx)s
%(engine)s
%(pix)s
%(ui)s
</script>
</body>
</html>
"""
# I browser vecchi (Kindle) non conoscono le variabili CSS: qui si sostituiscono con i valori.
allcss = css + extra
vars_ = dict(re.findall(r'(--[\w-]+)\s*:\s*([^;]+);', re.search(r':root\s*\{(.*?)\}', allcss, re.S).group(1)))
flat = lambda t: re.sub(r'var\((--[\w-]+)\)', lambda m: vars_[m.group(1)].strip(), t)
css, extra = flat(css), flat(extra)
d = base + 'src/'
read = lambda p: open(p, encoding='utf-8').read()

# Le storie. chiave: prefisso in localStorage; codice: il numero in testa al codice di salvataggio.
STORIES = [
    dict(slug='via-libera', title='Via Libera', key='vialibera', code=1, cover='faro', where='Porto Scuro, novembre 1953',
         blurb='Il guardiano di Punta Cieca è stato ripescato sotto il molo, e qualcuno vuole il quaderno che teneva. Un faro, quattro segnali, una mezzanotte.'),
    dict(slug='acqua-cheta', title='Acqua Cheta', key='acquacheta', code=2, cover='lagoGiorno', where='Val Sorda, febbraio 1957',
         blurb='Il geologo della diga è caduto dal coronamento, e la Compagnia vuole che sia un suicidio. Un lago che sale, una montagna che si muove, una telefonata sola.'),
]

def png(story, scene, k=2):
    """La tavola di copertina, ingrandita k volte, come PNG a un bit in una data: URI."""
    rows = subprocess.check_output(['node', base + 'scripts/bits.js', story, scene], universal_newlines=True).split()
    w, h = len(rows[0]) * k, len(rows) * k
    raw = b''
    for r in rows:
        bits = ''.join(('0' if c == '1' else '1') * k for c in r)
        bits += '0' * (-len(bits) % 8)
        line = b'\x00' + bytes(int(bits[i:i + 8], 2) for i in range(0, len(bits), 8))
        raw += line * k
    def chunk(t, data): return struct.pack('>I', len(data)) + t + data + struct.pack('>I', zlib.crc32(t + data) & 0xffffffff)
    # tavolozza: nero d'inchiostro e bianco di carta, gli stessi delle tavole in gioco
    body = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 1, 3, 0, 0, 0)) + chunk(b'PLTE', bytes([17, 17, 17, 241, 240, 234])) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    return 'data:image/png;base64,' + base64.b64encode(body).decode('ascii')

ui = read(d + 'ui.js')
gfx = read(d + 'gfx.js')
for st in STORIES:
    sd = d + st['slug'] + '/'
    pix = '\n'.join(read(p) for p in sorted(glob.glob(sd + 'pix*.js')))
    out = html % dict(css=css, extra=extra, title=st['title'], gfx=gfx, engine=read(sd + 'engine.js'), pix=pix, ui=ui)
    open(base + st['slug'] + '.html', 'w', encoding='utf-8').write(out)
    print(st['slug'] + '.html', len(out) // 1024, 'KiB')

cards = ''
for st in STORIES:
    cards += """
      <div class="story" id="s-%(slug)s" data-key="%(key)s" data-code="%(code)d" data-href="%(slug)s.html">
        <img src="%(img)s" alt="" width="480" height="300">
        <span class="where">%(where)s</span>
        <h3>%(title)s</h3>
        <p>%(blurb)s</p>
        <p class="state"></p>
        <p class="go"><a class="chip main" href="%(slug)s.html">Comincia</a></p>
      </div>""" % dict(st, img=png(st['slug'], st['cover']))
home = r"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Le storie di Ada Corvi</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&amp;family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&amp;display=swap" rel="stylesheet">
<style>%(css)s%(extra)s</style>
</head>
<body>
<main class="stage">
  <div class="device">
    <div class="screen home">
      <div class="status"><span>Ada Corvi</span><span>Le storie</span></div>
      <div class="out">
        <div class="front"><h2>Ada Corvi</h2><span>Due noir da leggere e da giocare, quattro capitoli l'uno</span></div>%(cards)s
        <p class="note">Si gioca scrivendo, oppure toccando un'azione e poi una parola sottolineata. Ogni storia tiene la sua partita e i suoi finali; da dentro una storia si torna qui con STORIE, o da Aa.</p>
      </div>
    </div>
  </div>
</main>
<script>
/* Legge dal browser a che punto è ogni storia: il capitolo sta nei primi caratteri del codice salvato. */
(function () {
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", CAP = ["", "primo", "secondo", "terzo", "quarto"];
  function head(code) {
    var s = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), bits = [], i, v, p = 0;
    function get(n) { var x = 0; for (var k = 0; k < n; k++) { x = x * 2 + (bits[p++] || 0); } return x; }
    if (s.length < 10) { return null; }
    for (i = 0; i < 6; i++) { v = ALPHA.indexOf(s.charAt(i)); if (v < 0) { return null; } bits.push((v >> 4) & 1, (v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1); }
    return { story: get(3), ch: get(3), room: get(4), moves: get(10), end: get(3) };
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } e.appendChild(document.createTextNode(text)); return e; }
  var cards = document.getElementsByTagName("div"), i;
  for (i = 0; i < cards.length; i++) { if (cards[i].className === "story") { fill(cards[i]); } }
  function fill(card) {
    var key = card.getAttribute("data-key"), href = card.getAttribute("data-href"), h = null, ends = 0, k, o = null, ps = card.getElementsByTagName("p"), state, go, a, b, txt = "";
    for (k = 0; k < ps.length; k++) { if (ps[k].className === "state") { state = ps[k]; } if (ps[k].className === "go") { go = ps[k]; } }
    try { h = head(localStorage.getItem(key + ".v1")); o = JSON.parse(localStorage.getItem(key + ".finali") || "null"); } catch (e) { h = null; }
    if (h && h.story !== +card.getAttribute("data-code")) { h = null; }
    if (o) { for (k in o) { if (o.hasOwnProperty(k)) { ends++; } } }
    if (h && h.moves > 0) { txt = h.end ? "Partita finita. " : "Partita in corso: capitolo " + CAP[h.ch] + ", " + h.moves + " mosse. "; }
    if (ends) { txt += "Finali trovati: " + ends + " su 5."; }
    state.appendChild(document.createTextNode(txt));
    if (!(h && h.moves > 0)) { return; }
    while (go.firstChild) { go.removeChild(go.firstChild); }
    a = el("a", "chip main", h.end ? "Riapri" : "Continua"); a.href = href; go.appendChild(a);
    /* da capo: due tocchi, perché si perde la partita */
    b = el("button", "chip", "Da capo"); b.type = "button";
    b.onclick = function () {
      if (b.getAttribute("data-armed")) { window.location.href = href + "#nuova"; return; }
      b.setAttribute("data-armed", "1"); b.className = "chip on"; b.firstChild.nodeValue = "Sicuro? Tocca ancora";
    };
    go.appendChild(b);
  }
})();
</script>
</body>
</html>
""" % dict(css=css, extra=extra, cards=cards)
open(base + 'index.html', 'w', encoding='utf-8').write(home)
print('index.html', len(home) // 1024, 'KiB')
