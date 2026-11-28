# Le storie di Ada Corvi — note per chi ci lavora

Avventure testuali noir in italiano, da giocare nel browser di un e-reader (Kindle, Kobo), oltre che da telefono e computer. Per ora due: «Via Libera» e «Acqua Cheta». Il repository si chiama `ereader-adventure` perché i titoli possono cambiare.

## Comandi

```sh
python3 scripts/build.py      # ricompone index.html, via-libera.html e acqua-cheta.html da src/ (serve anche node, per le copertine)
node scripts/play.js src      # Via Libera: gioca tutta la storia e i cinque finali, prova i codici, disegna ogni tavola
node scripts/play-acqua.js    # Acqua Cheta: lo stesso, più 300 partite a caso guidate dagli indizi (nessuna deve bloccarsi)
node scripts/play.js src -v   # come sopra, stampando tutto il testo (anche play-acqua.js -v)
node scripts/tavola.js acqua-cheta /tmp/foglio.png lagoGiorno o_occhiali m_colpo:3   # esporta tavole in PNG, per guardarle
```

Dopo ogni modifica a `src/`: build, poi i due play. L'ultima riga di ognuno deve essere `tutto a posto`.

## Struttura

Due storie con la stessa protagonista, Ada Corvi. Ogni storia è una pagina a sé, per non far pesare sul Kindle anche l'altra; `index.html` è l'elenco.

- `index.html`, `via-libera.html`, `acqua-cheta.html` sono generati da `scripts/build.py`. Non si modificano a mano. Sono anche le pagine pubblicate: ogni push su `main` aggiorna https://nordlysdesign.github.io/ereader-adventure/ (GitHub Pages).
- `index.html`: l'elenco delle storie. Copertine in PNG a un bit (rese da `scripts/bits.js` al momento del build), e per ogni storia lo stato letto da `localStorage`: capitolo in corso (sta nei primi caratteri del codice salvato), finali trovati, `Continua` e `Da capo` (due tocchi; apre la storia con `#nuova`). Per aggiungere una storia: una voce in `STORIES` di `build.py`.
- `src/gfx.js`: la libreria di disegno, comune (`Pix`). `Gfx` (rettangoli, poligoni, ellissi, linee, sagome con filo, testo a pixel), i mattoni (`man`, `woman`, `bust`, `rain`, `waves`, `smoke`, `stars`, `sky`), `plate()` per le tavolette, la fototessera di Ada (`ritratto`), il passaggio al canvas. I mattoni si prendono da `Pix.kit`; le scene si registrano con `Pix.add({...})`, `Pix.addObjects(OBJ, OBJN)`, `Pix.setMap(drawMap, PLACE)`.
  - La tela si scrive punto per punto con `putImageData`, già ingrandita: niente `drawImage` scalato, che il browser del Kindle sbaglia.
- `src/ui.js`: l'interfaccia, comune. Pagine, pannello dei comandi, animazione delle tavole. Parla col motore solo attraverso `PC` (`start`, `exec`, `prologue`, `inventory`, `look`, `exits`, `status`, `isDir`): ogni storia definisce il suo `PC`. In basso resta solo la riga di comando col pulsante COMANDI, che apre il cassetto (rotta, azioni, oggetti, SCHEDA/MAPPA/SALVA/?/Aa) e si richiude dopo ogni comando. `Aa` apre le impostazioni: Rullo o Pagina (predefinito Rullo), movimento sì o no (predefinito sì), dimensione del testo (A, A+, A++; classi `t1`–`t3` su `.screen`), i due pulsanti Ricomincia (capitolo, da capo), che chiedono un secondo tocco, e `Cambia storia`. Il comando `STORIE` (blocco `{t: "home"}`) torna all'elenco. Le preferenze (`vialibera.prefs`) valgono per tutte le storie.
- `src/via-libera/engine.js` e `pix.js`: la prima storia. Porto Scuro, 1953. Chiavi in `localStorage`: `vialibera.v1`, `vialibera.capitolo`, `vialibera.finali`. I codici cominciano con 1.
- `src/acqua-cheta/engine.js`, `pix-luoghi.js`, `pix-momenti.js` (momenti, finali, mappa), `pix-oggetti.js`: la seconda. Val Sorda, 1957. Chiavi `acquacheta.*`. I codici cominciano con 2: ogni storia riconosce e rifiuta i codici dell'altra.
- I due motori hanno la stessa forma ma non condividono codice: parser, salvataggio e indizi sono copiati. Una correzione a una parte comune va fatta in tutti e due.
- In ogni storia:
  - Storia, parser, dialoghi, capitoli, finali, salvataggio a codice stanno in `engine.js`, che non tocca il DOM e gira anche in Node: è così che viene provato.
  - Tavole dei luoghi, 240×150, animate: ogni luogo ne ha una (molte in versione notte e giorno: notte nei capitoli 1 e 4). Le mostra `describe(true)`: alla prima visita e con `GUARDA`.
  - Momenti, 240×150, animati (`m_…`): i passaggi chiave, e una tavola di chiusura per ogni finale (`f_…`), che compare dopo il testo del finale. Le tavole dei finali sono abbinate ai titoli in `END_PIC`; i play controllano che ogni finale ne mostri una.
  - Tavolette degli oggetti, 120×75, ferme, con cartellino da reperto («N.04 GETTONE TELEFONICO»): tra oggetti, indizi e ritratti, 40 in Via Libera e 51 in Acqua Cheta. Si chiamano `o_<nome>`, si definiscono in `OBJ` con `plate()` e vanno elencate in `OBJN`. Il motore le aggancia in `withPic()`: la didascalia sta in `PIC`, le varianti per stato in `picFor()`. Si vedono ogni volta che si esamina una cosa. Il font a pixel non ha accenti, apostrofi né virgole.
- L'inizio del capitolo è un codice salvato da `setChapter()` in `localStorage` (`<storia>.capitolo`); se la partita è stata caricata da un codice a metà capitolo, si riparte da lì.
- Lo stile CSS di base viene estratto da `prove/nero-di-seppia/index.html`; le aggiunte sono in `scripts/build.py`, che sostituisce anche ogni `var(--x)` col suo valore, perché il browser del Kindle non conosce le variabili CSS. Portarlo in un file suo dentro `src/` è un lavoro ancora da fare.
- `prove/`: le due prove precedenti, tenute per confronto. Non si toccano.
- `diagnosi.html`: pagina a sé che dice cosa sa fare il browser che la apre (variabili CSS, flex, canvas, localStorage, misure). Serve per gli e-reader.

## Acqua Cheta, in breve

- Ada è perito delle Assicurazioni «La Vigile». Il geologo Malan è caduto dal coronamento della diga del Gorgo; Ferrante, da Milano, vuole un suicidio. Capitoli: 1 «Neve vecchia» (camera, telefonata prenotata, la notte il colpo della montagna), 2 «Le mani pulite» (le mani del morto → la vedova dà la chiavetta → la baracca → gli occhiali → Bepi), 3 «Dove la montagna scrive» (cunicolo, pendolo, tubo, relazione; all'uscita l'offerta di Morandin: ACCETTA o RIFIUTA), 4 «Quota 715» (al centralino: cuffia, poi una sola chiamata).
- Il finale si sceglie con `CHIAMA MILANO | GIORNALE | DIGA | CANONICA`. Cinque titoli: «La pratica» e «Il posto» (Milano, senza o con il patto), «Notizie false», «Acqua bassa», «Al lupo». Il patto con Morandin e l'aver parlato degli scarichi con Bepi cambiano il testo anche negli altri.
- Conseguenze: `morandinSa` (gli hai detto delle mani, o mostrato gli occhiali), `olgaSa` (le hai detto che ascolta le telefonate: serve aver letto il biglietto), `vescoviSa` (gli hai dato la notizia: la detta al giornale), `scarichi` (Bepi ti ha detto che li aprirebbe). `play-acqua.js` gioca una partita per ognuna.
- Il terzo grado di `INDIZIO` vale da qualunque stanza: ogni voce di `hintFor()` dice in che stanza si fa la mossa, e da un'altra stanza `hint()` aggiunge la direzione da prendere (`toward()`). È questo che permette alle partite a caso di `play-acqua.js` di arrivare sempre in fondo. Via Libera non ce l'ha ancora.

## Vincoli tecnici

- **JavaScript ES5**, niente librerie, niente passaggi di compilazione: i browser degli e-reader sono vecchi. Niente `let`, `const`, funzioni freccia, template string, `forEach` su NodeList.
- **Una pagina per storia, nessun server.** Ogni pagina è completa da sola: nessun file esterno a parte i caratteri. Lo stato si salva in `localStorage` (sempre dentro try/catch) e in un codice (22 caratteri in Via Libera, 23 in Acqua Cheta: `SALVA` / `CARICA`).
- **Solo bianco e nero.** Le tavole sono 240×150 punti (gli oggetti 120×75), ingrandite a multipli interi. Niente grigi, niente sfumature casuali.
- **Un ridisegno per turno.** Niente animazioni dell'interfaccia, niente effetto macchina da scrivere: su e-ink sfarfallano. L'unico movimento è nelle tavole, pochi fotogrammi a circa due al secondo, e si può spegnere.
- Se si aggiungono oggetti o stanze, vanno aggiunti **in fondo** agli elenchi `ITEMS`, `ROOMS` nell'`engine.js` della storia: l'ordine determina i codici di salvataggio. I flag nuovi vanno in fondo a `FLAGS_B`, che sta in coda al codice: così i codici vecchi restano validi (i bit mancanti valgono 0). `FLAGS` non si tocca più (in Acqua Cheta `FLAGS_B` è ancora vuoto). Se l'ordine cambia, va alzato il numero di versione in `encode`/`decode`.

## Scelte di scrittura

- Valgono per tutte le storie; gli esempi sono di Via Libera. Seconda persona, al femminile (la protagonista è Ada Corvi). Frasi brevi, tono asciutto e noir, ironia amara. Niente spiegazioni: i fatti si scoprono esaminando e parlando.
- Storia adulta nei temi (ricatto, complicità, un omicidio archiviato, persone rivendute), non nell'esplicito.
- Nessun finale pulito: ognuno costa qualcosa a qualcuno.
- Si gioca scrivendo oppure toccando un'azione e poi una parola sottolineata. Nel testo `[[parola]]` rende toccabile una parola, `[[ETICHETTA|comando]]` esegue un comando intero.
- `INDIZIO` (in `hintFor()` di `engine.js`): per ogni passo della storia una chiave e tre frasi, dalla più vaga alla soluzione toccabile. Se si aggiunge un passaggio obbligato, va aggiunto anche lì; `play.js` chiede un indizio prima di ogni mossa del percorso. Il grado raggiunto sta in `S.h` e non entra nel codice di salvataggio.
- I finali trovati stanno in `localStorage` (`vialibera.finali`), per titolo: se si aggiunge un finale va messo in `END_TITLES`.
- Dialoghi: `PARLA` fa avanzare le battute fisse di `talkLine()` e aggiunge l'elenco degli argomenti (`topicList()`). Gli argomenti stanno in `DLG`: per personaggio, voci `[chiave, etichetta, parola, funzione(c, f, fai)]`; la funzione restituisce la battuta o `null` se ora l'argomento non c'è, e solo con `fai` cambia lo stato. Le parole che portano a un argomento sono in `TOPIC`. `play.js` prova ogni argomento proposto lungo il percorso: nessuno deve finire nella risposta di ripiego (`DLG_NO`).
- Conseguenze (flag in `FLAGS_B`): `nivesSa` (le hai detto dei polsi), `nivesTradita` (hai mostrato la sua fotografia a Lodi o Kessel prima che a lei: dal capitolo 3 risponde a monosillabi), `lodiPolsi` (Lodi ha visto che sai), `kesselSa` (gli hai detto delle iniziali). Cambiano battute, SCHEDA e una frase nei finali; `play.js` gioca una partita per ognuna.
- Ogni passaggio obbligato deve avere un indizio nel testo, meglio se toccabile (`[[dormire|dormi]]`, `[[APRI|apri porta]]`): DORMI, LEGGI, SEGNALA, ACCETTA e RIFIUTA non sono tra i pulsanti delle azioni.
- Due modi di schermo, tutti e due da mantenere: Pagina (una pagina per turno, con sfogliatore) e Rullo.

## Cose aperte

- Provato una volta su un Kindle di settima generazione (Browser sperimentale): il gioco gira, ma stile e tavole non si vedevano bene. Corretti variabili CSS e ingrandimento delle tavole; manca la prova dopo la correzione e la foto di `diagnosi.html`. Mai provato su Kobo.
- Le figure umane nelle tavole sono rigide, i ritratti degli oggetti sono quasi da figurina; la sala della lanterna è la tavola meno riuscita, seguita dalla tamerice del sentiero. Le illustrazioni andrebbero sostituite con tavole disegnate a mano a 240×150, 1 bit.
- `via-libera.html` pesa circa 230 KB, `acqua-cheta.html` circa 310: da tenere d'occhio sul Kindle. Acqua Cheta non è mai stata provata su un e-reader.
- Le tavole di Acqua Cheta meno riuscite: `digaNotte` (affollata), `osteriaNotte` (Vescovi seduto), i ritratti a mezzo busto. In `direzione` Morandin ha il cappello scuro, non il fedora chiaro della tavoletta.
- La pubblicazione su Vercel si fa a mano (vedi README): non è agganciata al repository.
- In modo Pagina, ◀ ▶ fuori dal prologo stanno dentro il cassetto COMANDI.
