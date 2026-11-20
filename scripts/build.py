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
  <header class="demo-bar">
    <div>
      <h1>Via Libera</h1>
      <p>Terza prova · noir in quattro capitoli</p>
    </div>
    <div class="switches">
      <div class="switch"><span id="lbl-mode">Schermo</span>
        <div class="seg" role="group" aria-labelledby="lbl-mode">
          <button type="button" id="mode-pagina" aria-pressed="true">Pagina</button>
          <button type="button" id="mode-rullo" aria-pressed="false">Rullo</button>
        </div>
      </div>
      <div class="switch"><span id="lbl-mot">Movimento</span>
        <div class="seg" role="group" aria-labelledby="lbl-mot">
          <button type="button" id="mot-on" aria-pressed="true">Sì</button>
          <button type="button" id="mot-off" aria-pressed="false">No</button>
        </div>
      </div>
    </div>
  </header>

  <div class="device">
    <div class="screen" id="screen">
      <div class="status"><span id="st-room">Prologo</span><span id="st-moves">Cap. 1 · Mosse 0</span></div>
      <div class="out" id="out" aria-live="polite"></div>

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
          <button type="button" class="chip" id="ref-aiuto" data-cmd="aiuto" aria-label="Aiuto">?</button>
        </div>
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

      <form class="cmd" id="cmd-form" autocomplete="off">
        <label for="cmd-input">&gt;</label>
        <input id="cmd-input" type="text" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="scrivi un comando, poi Invio">
      </form>
    </div>
  </div>

  <p class="foot">Le tavole sono 240×150 punti, solo bianco e nero, disegnate dal codice. Su uno schermo e-ink il movimento lascia aloni: lì conviene spegnerlo.</p>
</main>

<script>
%(engine)s
%(pix)s
%(ui)s
</script>
</body>
</html>
"""
d = base + 'src/'
out = html % dict(css=css, extra=extra, engine=open(d + 'engine.js', encoding='utf-8').read(), pix=open(d + 'pix.js', encoding='utf-8').read(), ui=open(d + 'ui.js', encoding='utf-8').read())
open(base + 'index.html', 'w', encoding='utf-8').write(out)
print('index.html', len(out) // 1024, 'KiB')
