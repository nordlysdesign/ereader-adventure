# Via Libera

Un'avventura testuale noir in italiano, pensata per essere giocata nel browser di un e-reader (Kindle, Kobo) oltre che da telefono e computer.

Porto Scuro, novembre 1953. Sei Ada Corvi, ispettrice dei fari per modo di dire. Il guardiano di Punta Cieca è stato ripescato sotto il molo, e qualcuno vuole il quaderno che teneva. Quattro capitoli, cinque finali.

**Si gioca qui:** https://nordlysdesign.github.io/ereader-adventure/

## Come si gioca

- Scrivendo comandi (`nord`, `esamina fascicolo`, `mostra la fotografia a nives`), oppure toccando un'azione e poi una parola sottolineata.
- In basso c'è solo la riga di comando: il pulsante **COMANDI** apre direzioni, azioni, oggetti e i pulsanti `SCHEDA`, `MAPPA`, `SALVA`, `INDIZIO`, `?` e `Aa`, e si richiude dopo ogni comando.
- Ogni luogo ha la sua tavola animata, di notte o di giorno a seconda del capitolo: si vede entrando la prima volta e con `GUARDA`. Quando esamini qualcosa (un oggetto, un indizio, una persona) compare la sua immagine, con un cartellino da reperto.
- `SCHEDA` dice chi sei e cosa hai scoperto, `MAPPA` mostra i posti dove sei stata.
- `PARLA` fa dire al personaggio la sua battuta e propone gli argomenti («Puoi chiederle di: Zanon · Kessel · la luce»): si toccano, oppure si scrive `CHIEDI A NIVES DI KESSEL`. Alcuni argomenti compaiono solo dopo aver scoperto qualcosa, e certe risposte cambiano il seguito: quello che Nives, Lodi e Kessel sanno di te si sente nei capitoli dopo e nei finali.
- `SALVA` dà un codice di 22 caratteri; `CARICA` e il codice riprendono la partita, anche su un altro dispositivo. Su ogni dispositivo la partita si salva comunque da sola.
- Il pulsante `Aa` apre le impostazioni: schermo a *Rullo* (predefinito) o a *Pagina*, *Movimento* delle tavole sì o no (su e-ink lascia aloni: lì conviene spegnerlo) e dimensione del *Testo* (A, A+, A++).
- `INDIZIO` aiuta chi è bloccato in tre gradi: il primo è vago, il secondo più preciso, il terzo dice cosa fare. Il grado riparte quando si supera il passaggio.
- A fine partita il gioco dice quanti dei cinque finali hai trovato (anche con `FINALI`). Il conto resta nel browser anche dopo `RICOMINCIA`.

## Com'è fatto

Una sola pagina HTML, senza librerie e senza server. Il codice è JavaScript ES5 perché i browser degli e-reader sono vecchi.

| Percorso | Cosa contiene |
| --- | --- |
| `index.html` | Il gioco, pronto da servire. È generato: non modificarlo a mano. |
| `src/engine.js` | Storia, parser, dialoghi, capitoli, finali, salvataggio a codice. Non tocca il DOM. |
| `src/pix.js` | Le tavole dei luoghi (240×150, animate) e degli oggetti (120×75, ferme), bianco e nero, disegnate dal codice. |
| `src/ui.js` | Interfaccia: pagine, cassetto dei comandi, impostazioni, animazione delle tavole. |
| `scripts/build.py` | Ricompone `index.html` da `src/`. |
| `scripts/play.js` | Gioca tutta la storia e tutti i finali senza browser, e controlla che ci sia un indizio a ogni passo, che ogni tavola si disegni e che ogni tavola chiamata dalla storia esista. |
| `diagnosi.html` | Dice cosa sa fare il browser che la apre: serve per provare gli e-reader. |
| `prove/` | Le due prove precedenti, tenute per confronto. |

```sh
python3 scripts/build.py     # rigenera index.html
node scripts/play.js src     # verifica storia, finali, codici e tavole
```

## Prove precedenti

- [Punta Cieca](https://nordlysdesign.github.io/ereader-adventure/prove/punta-cieca/): prima prova, parser e mappa ASCII.
- [Nero di Seppia](https://nordlysdesign.github.io/ereader-adventure/prove/nero-di-seppia/): seconda prova, tavole a incisione e scheda del personaggio.

## Stato

È un prototipo. Sul Kindle di settima generazione (Browser sperimentale) il gioco gira, ma va riprovato dopo le correzioni per lo stile e le tavole; per vedere cosa supporta un e-reader si apre https://nordlysdesign.github.io/ereader-adventure/diagnosi.html. Su Kobo non è ancora stato provato. Le illustrazioni, 62 in tutto, sono generate dal codice e andrebbero sostituite con tavole disegnate a mano.
