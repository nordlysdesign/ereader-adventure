# Via Libera — note per chi ci lavora

Avventura testuale noir in italiano, da giocare nel browser di un e-reader (Kindle, Kobo), oltre che da telefono e computer. Il nome del gioco può cambiare: per questo il repository si chiama `ereader-adventure`.

## Comandi

```sh
python3 scripts/build.py     # ricompone index.html da src/
node scripts/play.js src     # gioca tutta la storia e i cinque finali, prova i codici, disegna ogni tavola
node scripts/play.js src -v  # come sopra, stampando tutto il testo
```

Dopo ogni modifica a `src/`: build, poi play. L'ultima riga di play deve essere `tutto a posto`.

## Struttura

- `index.html` è generato da `scripts/build.py`. Non si modifica a mano.
- `src/engine.js`: storia, parser, dialoghi, capitoli, finali, salvataggio a codice. Non tocca il DOM e gira anche in Node: è così che viene provato.
- `src/pix.js`: le tavole. Una piccola libreria di disegno (`Gfx`: rettangoli, poligoni, ellissi, linee, sagome con filo, testo a pixel) e una funzione per scena. Ogni scena riceve la tela e il numero di fotogramma.
- `src/ui.js`: pagine, pannello dei comandi, animazione delle tavole.
- Lo stile CSS di base viene estratto da `prove/nero-di-seppia/index.html`; le aggiunte sono in `scripts/build.py`. Portarlo in un file suo dentro `src/` è un lavoro ancora da fare.
- `prove/`: le due prove precedenti, tenute per confronto. Non si toccano.

## Vincoli tecnici

- **JavaScript ES5**, niente librerie, niente passaggi di compilazione: i browser degli e-reader sono vecchi. Niente `let`, `const`, funzioni freccia, template string, `forEach` su NodeList.
- **Una sola pagina, nessun server.** Lo stato si salva in `localStorage` (sempre dentro try/catch) e in un codice di 21 caratteri (`SALVA` / `CARICA`).
- **Solo bianco e nero.** Le tavole sono 240×150 punti, ingrandite a multipli interi. Niente grigi, niente sfumature casuali.
- **Un ridisegno per turno.** Niente animazioni dell'interfaccia, niente effetto macchina da scrivere: su e-ink sfarfallano. L'unico movimento è nelle tavole, pochi fotogrammi a circa due al secondo, e si può spegnere.
- Se si aggiungono flag, oggetti o stanze, vanno aggiunti **in fondo** agli elenchi `FLAGS`, `ITEMS`, `ROOMS` in `engine.js`: l'ordine determina i codici di salvataggio. Se l'ordine cambia, va alzato il numero di versione in `encode`/`decode`.

## Scelte di scrittura

- Seconda persona, al femminile (la protagonista è Ada Corvi). Frasi brevi, tono asciutto e noir, ironia amara. Niente spiegazioni: i fatti si scoprono esaminando e parlando.
- Storia adulta nei temi (ricatto, complicità, un omicidio archiviato, persone rivendute), non nell'esplicito.
- Nessun finale pulito: ognuno costa qualcosa a qualcuno.
- Si gioca scrivendo oppure toccando un'azione e poi una parola sottolineata. Nel testo `[[parola]]` rende toccabile una parola, `[[ETICHETTA|comando]]` esegue un comando intero.
- Due modi di schermo, tutti e due da mantenere: Pagina (una pagina per turno, con sfogliatore) e Rullo.

## Cose aperte

- Non è mai stato provato su un e-reader vero.
- Le figure umane nelle tavole sono rigide; la sala della lanterna è la tavola meno riuscita. Le illustrazioni andrebbero sostituite con tavole disegnate a mano a 240×150, 1 bit.
- I dialoghi sono a battute fisse: `PARLA` fa avanzare la conversazione, non si sceglie l'argomento.
- Il repository non è ancora su GitHub e Pages non è attivo.
