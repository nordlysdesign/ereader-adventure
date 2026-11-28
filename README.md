# Le storie di Ada Corvi

Due avventure testuali noir in italiano, pensate per essere giocate nel browser di un e-reader (Kindle, Kobo) oltre che da telefono e computer. La protagonista è la stessa; le storie si giocano in qualunque ordine.

- **Via Libera.** Porto Scuro, novembre 1953. Sei Ada Corvi, ispettrice dei fari per modo di dire. Il guardiano di Punta Cieca è stato ripescato sotto il molo, e qualcuno vuole il quaderno che teneva. A mezzanotte, dalla lanterna, un segnale solo.
- **Acqua Cheta.** Val Sorda, febbraio 1957. Adesso sei perito di un'assicurazione. Il geologo di una diga nuova è caduto dal coronamento, e la Compagnia vuole che sia un suicidio. Il lago sale, la montagna di fronte si muove, e prima di mezzanotte c'è una linea per una telefonata sola.

Ognuna ha quattro capitoli e cinque finali. Nessuno è pulito.

C'è anche una **prova per telefono**: il primo capitolo di Acqua Cheta in un altro stile, con scene fatte di caratteri colorati, filmati e suono, da giocare solo a tocchi (`acqua-cheta-ascii.html`). Non è per l'e-reader, e ha una partita separata.

**Si gioca qui:** https://nordlysdesign.github.io/ereader-adventure/ (l'elenco delle storie; ogni storia ha la sua pagina, `via-libera.html` e `acqua-cheta.html`).

## Come si gioca

- Scrivendo comandi (`nord`, `esamina fascicolo`, `mostra gli occhiali a bepi`), oppure toccando un'azione e poi una parola sottolineata.
- In basso c'è solo la riga di comando: il pulsante **COMANDI** apre direzioni, azioni, oggetti e i pulsanti `SCHEDA`, `MAPPA`, `SALVA`, `INDIZIO`, `?` e `Aa`, e si richiude dopo ogni comando.
- Ogni luogo ha la sua tavola animata, di notte o di giorno a seconda del capitolo: si vede entrando la prima volta e con `GUARDA`. Quando esamini qualcosa (un oggetto, un indizio, una persona) compare la sua immagine, con un cartellino da reperto. I passaggi chiave hanno una tavola animata loro, e ogni finale si chiude con la sua.
- `SCHEDA` dice chi sei e cosa hai scoperto, `MAPPA` mostra i posti dove sei stata.
- `PARLA` fa dire al personaggio la sua battuta e propone gli argomenti («Puoi chiederle di: Malan · la Marcia · la Società»): si toccano, oppure si scrive `CHIEDI A OLGA DI MALAN`. Alcuni argomenti compaiono solo dopo aver scoperto qualcosa, e certe risposte cambiano il seguito: quello che gli altri sanno di te si sente nei capitoli dopo e nei finali.
- `SALVA` dà un codice; `CARICA` e il codice riprendono la partita, anche su un altro dispositivo. Su ogni dispositivo la partita si salva comunque da sola. I codici di una storia non valgono per l'altra, e il gioco lo dice.
- Il pulsante `Aa` apre le impostazioni: schermo a *Rullo* (predefinito) o a *Pagina*, *Movimento* delle tavole sì o no (su e-ink lascia aloni: lì conviene spegnerlo), dimensione del *Testo* (A, A+, A++), *Ricomincia* (dall'inizio del capitolo oppure da capo: si tocca due volte, per non perdere la partita per sbaglio) e *Cambia storia*, che torna all'elenco. Dopo un finale, `RICOMINCIA CAPITOLO` rifà l'ultima notte con le stesse scelte: è il modo più rapido per cercare gli altri finali.
- `INDIZIO` aiuta chi è bloccato in tre gradi: il primo è vago, il secondo più preciso, il terzo dice cosa fare (in Acqua Cheta, anche da che parte andare se sei nel posto sbagliato). Il grado riparte quando si supera il passaggio.
- A fine partita il gioco dice quanti dei cinque finali hai trovato (anche con `FINALI`). Il conto resta nel browser anche dopo `RICOMINCIA`, e si vede nell'elenco delle storie.

## Com'è fatto

Pagine HTML complete, senza librerie e senza server: una per storia, più l'elenco. Il codice è JavaScript ES5 perché i browser degli e-reader sono vecchi.

| Percorso | Cosa contiene |
| --- | --- |
| `index.html` | L'elenco delle storie. Generato: non modificarlo a mano. |
| `via-libera.html`, `acqua-cheta.html` | Le due storie, pronte da servire. Generate. |
| `src/gfx.js` | La libreria di disegno comune: tavole 240×150 e tavolette 120×75, bianco e nero, disegnate dal codice. |
| `src/ui.js` | L'interfaccia comune: pagine, cassetto dei comandi, impostazioni, animazione delle tavole. |
| `src/via-libera/` | Motore (`engine.js`) e tavole (`pix.js`) della prima storia. |
| `src/acqua-cheta/` | Motore e tavole (`pix-luoghi.js`, `pix-momenti.js`, `pix-oggetti.js`) della seconda. |
| `src/ascii/` | La prova per telefono: griglia a caratteri, scene, filmati, interfaccia a tocchi, suono. |
| `scripts/build.py` | Ricompone le pagine da `src/`. |
| `scripts/play.js`, `scripts/play-acqua.js` | Giocano ogni storia e tutti i finali senza browser, e controllano indizi, argomenti dei dialoghi, codici e tavole. Il secondo gioca anche trecento partite a caso: nessuna deve bloccarsi. |
| `scripts/tavola.js` | Esporta una o più tavole in PNG, per guardarle. |
| `diagnosi.html` | Dice cosa sa fare il browser che la apre: serve per provare gli e-reader. |
| `prove/` | Le due prove precedenti, tenute per confronto. |

```sh
python3 scripts/build.py      # rigenera le pagine
node scripts/play.js src      # verifica Via Libera
node scripts/play-acqua.js    # verifica Acqua Cheta
node scripts/prova-ascii.js   # verifica la prova per telefono
```

## Prove precedenti

- [Punta Cieca](https://nordlysdesign.github.io/ereader-adventure/prove/punta-cieca/): prima prova, parser e mappa ASCII.
- [Nero di Seppia](https://nordlysdesign.github.io/ereader-adventure/prove/nero-di-seppia/): seconda prova, tavole a incisione e scheda del personaggio.

## Stato

È un prototipo. Sul Kindle di settima generazione (Browser sperimentale) Via Libera gira, ma va riprovata dopo le correzioni per lo stile e le tavole; Acqua Cheta su e-reader non è ancora stata provata. Per vedere cosa supporta un e-reader si apre https://nordlysdesign.github.io/ereader-adventure/diagnosi.html. Le illustrazioni, 156 in tutto, sono generate dal codice e andrebbero sostituite con tavole disegnate a mano.
