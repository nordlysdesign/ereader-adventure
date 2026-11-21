# Via Libera — note per chi ci lavora

Avventura testuale noir in italiano, da giocare nel browser di un e-reader (Kindle, Kobo), oltre che da telefono e computer. Il nome del gioco può cambiare: per questo il repository si chiama `ereader-adventure`.

## Comandi

```sh
python3 scripts/build.py     # ricompone index.html da src/
node scripts/play.js src     # gioca tutta la storia e i cinque finali, prova i codici, disegna ogni tavola, controlla che ogni tavola chiamata esista
node scripts/play.js src -v  # come sopra, stampando tutto il testo
```

Dopo ogni modifica a `src/`: build, poi play. L'ultima riga di play deve essere `tutto a posto`.

## Struttura

- `index.html` è generato da `scripts/build.py`. Non si modifica a mano. È anche la pagina pubblicata: ogni push su `main` aggiorna https://nordlysdesign.github.io/ereader-adventure/ (GitHub Pages).
- `src/engine.js`: storia, parser, dialoghi, capitoli, finali, salvataggio a codice. Non tocca il DOM e gira anche in Node: è così che viene provato.
- `src/pix.js`: le tavole. Una piccola libreria di disegno (`Gfx`: rettangoli, poligoni, ellissi, linee, sagome con filo, testo a pixel) e una funzione per scena. Ogni scena riceve la tela e il numero di fotogramma.
  - Tavole dei luoghi, 240×150, animate: ogni luogo ne ha una (molte in versione notte e giorno: notte nei capitoli 1 e 4). Le mostra `describe(true)`: alla prima visita e con `GUARDA`.
  - Tavolette degli oggetti, 120×75, ferme, con cartellino da reperto («N.04 GETTONE TELEFONICO»): 40 in tutto, tra oggetti, indizi e ritratti. Si chiamano `o_<nome>`, si definiscono in `OBJ` con `plate()` e vanno elencate in `OBJN`. Il motore le aggancia in `withPic()`: la didascalia sta in `PIC`, le varianti per stato (quadro, sportello, stufa) in `picFor()`. Si vedono ogni volta che si esamina una cosa.
  - La tela si scrive punto per punto con `putImageData`, già ingrandita: niente `drawImage` scalato, che il browser del Kindle sbaglia.
- `src/ui.js`: pagine, pannello dei comandi, animazione delle tavole. In basso resta solo la riga di comando col pulsante COMANDI, che apre il cassetto (rotta, azioni, oggetti, SCHEDA/MAPPA/SALVA/?/Aa) e si richiude dopo ogni comando. `Aa` apre le impostazioni: Rullo o Pagina (predefinito Rullo), movimento sì o no (predefinito sì), dimensione del testo (A, A+, A++; classi `t1`–`t3` su `.screen`).
- Lo stile CSS di base viene estratto da `prove/nero-di-seppia/index.html`; le aggiunte sono in `scripts/build.py`, che sostituisce anche ogni `var(--x)` col suo valore, perché il browser del Kindle non conosce le variabili CSS. Portarlo in un file suo dentro `src/` è un lavoro ancora da fare.
- `prove/`: le due prove precedenti, tenute per confronto. Non si toccano.
- `diagnosi.html`: pagina a sé che dice cosa sa fare il browser che la apre (variabili CSS, flex, canvas, localStorage, misure). Serve per gli e-reader.

## Vincoli tecnici

- **JavaScript ES5**, niente librerie, niente passaggi di compilazione: i browser degli e-reader sono vecchi. Niente `let`, `const`, funzioni freccia, template string, `forEach` su NodeList.
- **Una sola pagina, nessun server.** Lo stato si salva in `localStorage` (sempre dentro try/catch) e in un codice di 21 caratteri (`SALVA` / `CARICA`).
- **Solo bianco e nero.** Le tavole sono 240×150 punti (gli oggetti 120×75), ingrandite a multipli interi. Niente grigi, niente sfumature casuali.
- **Un ridisegno per turno.** Niente animazioni dell'interfaccia, niente effetto macchina da scrivere: su e-ink sfarfallano. L'unico movimento è nelle tavole, pochi fotogrammi a circa due al secondo, e si può spegnere.
- Se si aggiungono flag, oggetti o stanze, vanno aggiunti **in fondo** agli elenchi `FLAGS`, `ITEMS`, `ROOMS` in `engine.js`: l'ordine determina i codici di salvataggio. Se l'ordine cambia, va alzato il numero di versione in `encode`/`decode`.

## Scelte di scrittura

- Seconda persona, al femminile (la protagonista è Ada Corvi). Frasi brevi, tono asciutto e noir, ironia amara. Niente spiegazioni: i fatti si scoprono esaminando e parlando.
- Storia adulta nei temi (ricatto, complicità, un omicidio archiviato, persone rivendute), non nell'esplicito.
- Nessun finale pulito: ognuno costa qualcosa a qualcuno.
- Si gioca scrivendo oppure toccando un'azione e poi una parola sottolineata. Nel testo `[[parola]]` rende toccabile una parola, `[[ETICHETTA|comando]]` esegue un comando intero.
- `INDIZIO` (in `hintFor()` di `engine.js`): per ogni passo della storia una chiave e tre frasi, dalla più vaga alla soluzione toccabile. Se si aggiunge un passaggio obbligato, va aggiunto anche lì; `play.js` chiede un indizio prima di ogni mossa del percorso. Il grado raggiunto sta in `S.h` e non entra nel codice di salvataggio.
- I finali trovati stanno in `localStorage` (`vialibera.finali`), per titolo: se si aggiunge un finale va messo in `END_TITLES`.
- Ogni passaggio obbligato deve avere un indizio nel testo, meglio se toccabile (`[[dormire|dormi]]`, `[[APRI|apri porta]]`): DORMI, LEGGI, SEGNALA, ACCETTA e RIFIUTA non sono tra i pulsanti delle azioni.
- Due modi di schermo, tutti e due da mantenere: Pagina (una pagina per turno, con sfogliatore) e Rullo.

## Cose aperte

- Provato una volta su un Kindle di settima generazione (Browser sperimentale): il gioco gira, ma stile e tavole non si vedevano bene. Corretti variabili CSS e ingrandimento delle tavole; manca la prova dopo la correzione e la foto di `diagnosi.html`. Mai provato su Kobo.
- Le figure umane nelle tavole sono rigide, i ritratti degli oggetti sono quasi da figurina; la sala della lanterna è la tavola meno riuscita, seguita dalla tamerice del sentiero. Le illustrazioni andrebbero sostituite con tavole disegnate a mano a 240×150, 1 bit.
- I dialoghi sono a battute fisse: `PARLA` fa avanzare la conversazione, non si sceglie l'argomento.
- `index.html` pesa circa 185 KB: da tenere d'occhio sul Kindle.
- In modo Pagina, ◀ ▶ fuori dal prologo stanno dentro il cassetto COMANDI.
