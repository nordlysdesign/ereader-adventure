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
    # Una prova di stile, non una storia: il capitolo 1 di Acqua Cheta per telefono, a caratteri colorati. Ha il suo modello di pagina (più sotto).
    dict(slug='acqua-cheta-ascii', src='acqua-cheta', title='Acqua Cheta, in caratteri', key='acquacheta-ascii', code=2, cover='fermata', ascii=True,
         where='Prova per telefono · solo il capitolo 1',
         blurb='La stessa storia in un altro stile: scene fatte di caratteri, a colori, con filmati e suono. Si gioca solo a tocchi. Non è per l\'e-reader.'),
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
    if st.get('ascii'): continue
    sd = d + st['slug'] + '/'
    pix = '\n'.join(read(p) for p in sorted(glob.glob(sd + 'pix*.js')))
    out = html % dict(css=css, extra=extra, title=st['title'], gfx=gfx, engine=read(sd + 'engine.js'), pix=pix, ui=ui)
    open(base + st['slug'] + '.html', 'w', encoding='utf-8').write(out)
    print(st['slug'] + '.html', len(out) // 1024, 'KiB')


# ---------- la prova per telefono ----------
# Stesso motore di Acqua Cheta, ma con una partita sua: le chiavi in localStorage cambiano prefisso, così la partita vera non viene toccata.
ASCII_CSS = r"""
html, body { margin: 0; height: 100%; background: #0a0c11; color: #c9d3de; font-family: 'IBM Plex Mono', Menlo, Consolas, monospace; font-size: 15px; line-height: 1.5; -webkit-text-size-adjust: 100%; overscroll-behavior: none; }
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
button { font: inherit; }
.app { position: relative; display: flex; flex-direction: column; height: 100vh; height: 100dvh; max-width: 560px; margin: 0 auto; overflow: hidden; background: #0a0c11; }
#stage { position: relative; flex: 0 0 auto; height: 44vh; overflow: hidden; border-bottom: 1px solid #232b37; }
#cv { position: absolute; left: 0; top: 50%; width: 100%; height: auto; transform: translateY(-50%); display: block; }
#room { position: absolute; left: 12px; top: 10px; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #f5a742; text-shadow: 0 0 6px #000, 0 0 12px #000; }
#caption, #skip { display: none; }
.film #stage { flex: 1 1 auto; height: auto; border-bottom: 0; }
.film #cv { top: 0; transform: none; }
.film #room, .film #log, .film #bar { display: none; }
.film #skip { display: block; position: absolute; right: 10px; top: 10px; background: rgba(10, 12, 17, 0.7); }
.film #caption { display: block; position: absolute; left: 0; right: 0; bottom: 0; min-height: 36%; padding: 34px 20px calc(20px + env(safe-area-inset-bottom)); background: linear-gradient(rgba(10, 12, 17, 0), #0a0c11 26%); }
#caption p { margin: 0; font-family: 'Old Standard TT', Georgia, serif; font-size: 19px; line-height: 1.42; color: #efe8d6; }
#caption .more { display: block; margin-top: 12px; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #5f6b7a; }
#log { flex: 1 1 0; min-height: 0; overflow-y: auto; padding: 4px 16px 34vh; -webkit-overflow-scrolling: touch; }
.turn { padding: 12px 0 2px; border-top: 1px dashed #232b37; }
.turn:first-child { border-top: 0; }
.turn.old { opacity: 0.4; }
.turn p { margin: 0 0 10px; }
.turn ul { margin: 0 0 10px; padding-left: 18px; }
.echo { color: #6388bd; font-weight: 600; }
.note { color: #7f8c9b; font-size: 13px; }
.tag { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #f5a742; }
.code { font-size: 17px; font-weight: 600; letter-spacing: 2px; color: #fff3dc; }
.kw { color: #f5a742; border-bottom: 1px solid rgba(245, 167, 66, 0.55); cursor: pointer; text-shadow: 0 0 10px rgba(245, 167, 66, 0.4); }
.chapter { text-align: center; margin: 4px 0 14px; padding: 10px 0 12px; border-top: 1px solid #f5a742; border-bottom: 1px solid #f5a742; }
.chapter span { display: block; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #f5a742; }
.chapter h2 { font: italic 400 27px/1.15 'Old Standard TT', Georgia, serif; margin: 2px 0 0; color: #fff3dc; }
dl.rows { margin: 0 0 10px; font-size: 13.5px; }
dl.rows dt { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #7f8c9b; margin-top: 6px; }
dl.rows dd { margin: 0; }
#bar { flex: 0 0 auto; border-top: 1px solid #232b37; background: #0d1016; padding: 6px 10px calc(8px + env(safe-area-inset-bottom)); }
.row { display: flex; gap: 6px; overflow-x: auto; align-items: center; padding: 3px 0; scrollbar-width: none; }
.row::-webkit-scrollbar { display: none; }
#bag { flex: 1 1 auto; min-width: 0; }
.chip { flex: 0 0 auto; font: 600 12.5px/1 'IBM Plex Mono', Menlo, monospace; color: #c9d3de; background: transparent; border: 1px solid #3a4656; border-radius: 3px; padding: 0 11px; min-height: 40px; white-space: nowrap; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
.chip.dir { border-color: #6388bd; color: #b9c9db; }
.chip.item { border-style: dashed; font-weight: 400; }
.chip.big { min-height: 52px; font-size: 13.5px; border-color: #f5a742; color: #f5a742; white-space: normal; text-align: center; }
.chip.main { background: #f5a742; border-color: #f5a742; color: #0a0c11; min-height: 52px; font-size: 14px; padding: 0 22px; }
.sheet { position: absolute; left: 0; right: 0; top: 0; bottom: 0; z-index: 5; display: flex; flex-direction: column; justify-content: flex-end; background: rgba(5, 6, 9, 0.62); }
.sheet.off, .veil.off { display: none; }
.pane { background: #10141b; border-top: 1px solid #f5a742; padding: 14px 14px calc(16px + env(safe-area-inset-bottom)); }
.pane h3 { margin: 0 0 10px; font: italic 400 23px 'Old Standard TT', Georgia, serif; color: #fff3dc; }
.grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.veil { position: absolute; left: 0; right: 0; top: 0; bottom: 0; z-index: 9; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding: 0 26px calc(9vh + env(safe-area-inset-bottom)); text-align: center; background: linear-gradient(rgba(10, 12, 17, 0.05), rgba(10, 12, 17, 0.96) 52%); }
.veil.full { background: rgba(10, 12, 17, 0.94); justify-content: center; padding-bottom: 0; }
.veil h1 { font: 400 34px/1.1 'Old Standard TT', Georgia, serif; letter-spacing: 6px; text-transform: uppercase; color: #fff3dc; margin: 0; }
.veil .sub { font: italic 400 16px 'Old Standard TT', Georgia, serif; color: #f5a742; margin: 6px 0 16px; }
.veil p { margin: 0 0 16px; max-width: 34ch; color: #a3b6ca; font-size: 13.5px; }
.veil .chip { margin: 5px 0; min-width: 240px; }
"""
ASCII_HTML = r"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0a0c11">
<title>Acqua Cheta, in caratteri</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&amp;family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&amp;display=swap" rel="stylesheet">
<style>%(css)s</style>
</head>
<body>
<div class="app" id="app">
  <div id="stage"><canvas id="cv" role="img" aria-label="La scena, disegnata a caratteri"></canvas><div id="room"></div><button type="button" class="chip" id="skip">SALTA ›</button><div id="caption" aria-live="polite"></div></div>
  <div id="log" aria-live="polite"></div>
  <div id="bar">
    <div class="row" id="dirs"></div>
    <div class="row"><div class="row" id="bag"></div><button type="button" class="chip" id="menu-btn" aria-label="Menu">≡ MENU</button></div>
  </div>
  <div class="sheet off" id="sheet"><div class="pane"><h3 id="sheet-word"></h3><div class="grid" id="sheet-grid"></div></div></div>
  <div class="sheet off" id="menu"><div class="pane"><div class="grid">
    <button type="button" class="chip big" data-cmd="scheda">SCHEDA</button>
    <button type="button" class="chip big" data-cmd="mappa">MAPPA</button>
    <button type="button" class="chip big" data-cmd="indizio">INDIZIO</button>
    <button type="button" class="chip big" data-cmd="prologo">PROLOGO</button>
    <button type="button" class="chip big" id="m-suono">SUONO: SÌ</button>
    <button type="button" class="chip big" data-cmd="storie">STORIE</button>
    <button type="button" class="chip big" id="m-capo" style="grid-column: 1 / 4">RICOMINCIA</button>
  </div></div></div>
  <div class="veil" id="title">
    <h1>Acqua Cheta</h1>
    <div class="sub">in caratteri · prova per telefono</div>
    <p>Il capitolo primo, in un altro stile. Si gioca a tocchi; con il suono è meglio.</p>
    <button type="button" class="chip main" id="start-btn">COMINCIA</button>
    <a class="chip" href="index.html">TORNA ALLE STORIE</a>
  </div>
  <div class="veil full off" id="end">
    <h1>Fine della prova</h1>
    <div class="sub">Capitolo primo: «Neve vecchia»</div>
    <p>La storia continua per altri tre capitoli, fino a una telefonata. Per ora, in questo stile, c'è solo il primo.</p>
    <button type="button" class="chip main" id="end-again">RIGIOCA LA PROVA</button>
    <a class="chip" href="acqua-cheta.html">LA STORIA COMPLETA, PER E-READER</a>
    <a class="chip" href="index.html">TORNA ALLE STORIE</a>
  </div>
</div>
<script>
%(js)s
</script>
</body>
</html>
"""
for st in STORIES:
    if not st.get('ascii'): continue
    sd = d + st['src'] + '/'
    eng = read(sd + 'engine.js')
    old, new = '"' + st['src'].replace('-', '') + '.', '"' + st['key'] + '.'
    assert eng.count(old) >= 3, 'le chiavi di salvataggio del motore non sono dove me le aspetto'
    eng = eng.replace(old, new)
    js = '\n'.join([gfx, eng, read(sd + 'pix-oggetti.js'), read(sd + 'pix-momenti.js')] + [read(d + 'ascii/' + f) for f in ('render.js', 'scene-acqua.js', 'filmati.js', 'suono.js', 'ui-touch.js')])
    out = ASCII_HTML % dict(css=ASCII_CSS, js=js)
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
      </div>""" % dict(st, img=png(st.get('src', st['slug']), st['cover']))
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
