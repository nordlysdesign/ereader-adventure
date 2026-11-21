"""Assembla index.html da src/ (motore, tavole, interfaccia). Lo stile di base arriva dalla seconda prova.
Uso: python3 scripts/build.py"""
import os, re
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
"""
html = r"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Via Libera</title>
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
out = html % dict(css=css, extra=extra, engine=open(d + 'engine.js', encoding='utf-8').read(), pix=open(d + 'pix.js', encoding='utf-8').read(), ui=open(d + 'ui.js', encoding='utf-8').read())
open(base + 'index.html', 'w', encoding='utf-8').write(out)
print('index.html', len(out) // 1024, 'KiB')
