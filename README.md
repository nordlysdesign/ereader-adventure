# Via Libera

Un'avventura testuale noir in italiano, pensata per essere giocata nel browser di un e-reader (Kindle, Kobo) oltre che da telefono e computer.

Porto Scuro, novembre 1953. Sei Ada Corvi, ispettrice dei fari per modo di dire. Il guardiano di Punta Cieca è stato ripescato sotto il molo, e qualcuno vuole il quaderno che teneva. Quattro capitoli, cinque finali.

**Si gioca qui:** https://nordlysdesign.github.io/ereader-adventure/

## Come si gioca

- Scrivendo comandi (`nord`, `esamina fascicolo`, `mostra la fotografia a nives`), oppure toccando un'azione e poi una parola sottolineata.
- `SCHEDA` dice chi sei e cosa hai scoperto, `MAPPA` mostra i posti dove sei stata.
- `SALVA` dà un codice di 21 caratteri; `CARICA` e il codice riprendono la partita, anche su un altro dispositivo. Su ogni dispositivo la partita si salva comunque da sola.
- In alto si sceglie tra schermo a *Pagina* o a *Rullo*, e si può fermare il *Movimento* delle tavole (su e-ink lascia aloni).

## Com'è fatto

Una sola pagina HTML, senza librerie e senza server. Il codice è JavaScript ES5 perché i browser degli e-reader sono vecchi.

| Percorso | Cosa contiene |
| --- | --- |
| `index.html` | Il gioco, pronto da servire. È generato: non modificarlo a mano. |
| `src/engine.js` | Storia, parser, dialoghi, capitoli, finali, salvataggio a codice. Non tocca il DOM. |
| `src/pix.js` | Le tavole: 240×150 punti, bianco e nero, disegnate dal codice a ogni fotogramma. |
| `src/ui.js` | Interfaccia: pagine, pannello dei comandi, animazione delle tavole. |
| `scripts/build.py` | Ricompone `index.html` da `src/`. |
| `scripts/play.js` | Gioca tutta la storia e tutti i finali senza browser, e controlla che ogni tavola si disegni. |
| `prove/` | Le due prove precedenti, tenute per confronto. |

```sh
python3 scripts/build.py     # rigenera index.html
node scripts/play.js src     # verifica storia, finali, codici e tavole
```

## Prove precedenti

- [Punta Cieca](https://nordlysdesign.github.io/ereader-adventure/prove/punta-cieca/): prima prova, parser e mappa ASCII.
- [Nero di Seppia](https://nordlysdesign.github.io/ereader-adventure/prove/nero-di-seppia/): seconda prova, tavole a incisione e scheda del personaggio.

## Stato

È un prototipo. Non è ancora stato provato su un e-reader vero; le illustrazioni sono generate dal codice e andrebbero sostituite con tavole disegnate a mano.
