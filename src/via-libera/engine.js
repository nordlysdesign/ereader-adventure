/* ==================================================================
   MOTORE DI GIOCO. Non tocca il DOM: riceve una stringa e restituisce
   una lista di blocchi (testo, titoli, tavole, mappa, scheda, codice).
   ================================================================== */
var PC = (function () {
  var SAVE_KEY = "vialibera.v1";
  var S;

  var ROOMS = ["molo", "piazza", "locanda", "camera", "caserma", "strada", "casa", "faro", "lanterna", "cala"];
  var ROOM_NAME = { molo: "Molo dei piroscafi", piazza: "Piazza della Dogana", locanda: "Locanda «Al Fanale»", camera: "Camera 7", caserma: "Polizia portuale",
    strada: "Sentiero del faro", casa: "Casa del guardiano", faro: "Ai piedi del faro", lanterna: "Sala della lanterna", cala: "Cala del Morto" };
  var EXITS = {
    molo: { nord: "piazza" },
    piazza: { nord: "strada", sud: "molo", est: "locanda", ovest: "caserma" },
    locanda: { ovest: "piazza", su: "camera" },
    camera: { giu: "locanda" },
    caserma: { est: "piazza" },
    strada: { nord: "faro", sud: "piazza", est: "casa", giu: "cala" },
    casa: { ovest: "strada" },
    faro: { sud: "strada", su: "lanterna" },
    lanterna: { giu: "faro" },
    cala: { su: "strada" }
  };
  var DIR_ORDER = ["nord", "sud", "est", "ovest", "su", "giu"];
  var ITEMS = ["tesserino", "sigarette", "chiave", "gettone", "pistola", "foto", "mazzo", "quaderno"];
  var FLAGS = ["nivesKey", "grappa", "telefonato", "valigia", "retro", "finestra", "fascicolo", "polsi", "registro", "stufa", "tabellina", "nives",
    "porta", "sportello", "quaderno", "offerta", "patto", "datoBrandi", "manuale", "k1", "lodi1", "foglio", "nives4", "notte", "lodiCala"];
  /* flag aggiunti dopo: stanno in fondo al codice di salvataggio, così i codici vecchi restano validi */
  var FLAGS_B = ["nivesSa", "nivesTradita", "lodiPolsi", "kesselSa"];
  var CH_NAME = ["", "Capitolo primo", "Capitolo secondo", "Capitolo terzo", "Capitolo quarto"];
  var CH_TITLE = ["", "L'ultima corsa", "Il morto di Punta Cieca", "Il codice della luce", "Mezzanotte"];
  var CODES = { "13": 1, "21": 1, "22": 1, "31": 1 };

  function fresh() {
    return { ch: 1, room: "molo", moves: 0, visited: { molo: 1 }, end: 0, f: {}, t: { n: 0, k: 0, l: 0, b: 0 }, h: { k: "", n: 0 },
      loc: { tesserino: "inv", sigarette: "inv", chiave: "none", gettone: "none", pistola: "camera", foto: "casa", mazzo: "none", quaderno: "none" } };
  }

  /* ---------- parser ---------- */
  var STOP = " il lo la i gli le l un uno una del dello della dei degli delle dell al allo alla ai agli alle all nel nello nella nell sul sullo sulla sull con col di da dal dalla per verso a ad in mio mia ";
  var DIRS = { nord: "nord", n: "nord", sud: "sud", s: "sud", est: "est", e: "est", ovest: "ovest", o: "ovest", w: "ovest",
    su: "su", sali: "su", salgo: "su", alto: "su", giu: "giu", scendi: "giu", scendo: "giu", basso: "giu" };
  var VERBS = {
    guarda: "guarda", g: "guarda", l: "guarda", osserva: "guarda",
    esamina: "esamina", x: "esamina", ispeziona: "esamina", controlla: "esamina", studia: "esamina", cerca: "esamina", fruga: "esamina",
    leggi: "leggi", sfoglia: "leggi",
    prendi: "prendi", raccogli: "prendi", piglia: "prendi", afferra: "prendi", ordina: "prendi", bevi: "prendi",
    lascia: "lascia", posa: "lascia",
    inventario: "inventario", inv: "inventario", i: "inventario", borsa: "inventario", tasche: "inventario",
    apri: "apri", forza: "apri", scavalca: "apri", chiudi: "chiudi",
    usa: "usa", utilizza: "usa", infila: "usa", gira: "usa", sposta: "usa", tira: "usa", premi: "usa", accendi: "usa", fuma: "usa", telefona: "usa", chiama: "usa",
    dai: "dai", mostra: "dai", offri: "dai", porgi: "dai", consegna: "dai",
    parla: "parla", saluta: "parla", interroga: "parla", rispondi: "parla", chiedi: "chiedi", domanda: "chiedi", chiedile: "chiedi", chiedigli: "chiedi",
    dormi: "dormi", riposa: "dormi",
    segnala: "segnala", trasmetti: "segnala", batti: "segnala", lampeggia: "segnala",
    accetta: "accetta", si: "accetta", rifiuta: "rifiuta", no: "rifiuta",
    vai: "vai", va: "vai", vado: "vai", cammina: "vai", torna: "vai", entra: "entra", esci: "esci",
    mappa: "mappa", m: "mappa", cartina: "mappa",
    scheda: "scheda", dossier: "scheda", personaggio: "scheda", io: "scheda",
    aiuto: "aiuto", help: "aiuto", comandi: "aiuto",
    indizio: "indizio", indizi: "indizio", suggerimento: "indizio", suggerisci: "indizio", aiutami: "indizio", hint: "indizio", bloccata: "indizio", bloccato: "indizio",
    finali: "finali", storie: "storie", home: "storie",
    prologo: "prologo", ricomincia: "ricomincia", restart: "ricomincia", salva: "salva", carica: "carica", aspetta: "aspetta", z: "aspetta"
  };
  var NOUNS = {
    tesserino: "tesserino", documenti: "tesserino", documento: "tesserino", tessera: "tesserino",
    sigarette: "sigarette", sigaretta: "sigarette", nazionali: "sigarette", accendino: "sigarette",
    chiave: "chiave", gettone: "gettone", gettoni: "gettone", pistola: "pistola", beretta: "pistola",
    fotografia: "foto", foto: "foto", cornice: "foto", fotografie: "polsi", polsi: "polsi", corpo: "polsi", morto: "polsi", cadavere: "polsi",
    mazzo: "mazzo", chiavi: "mazzo", chiavetta: "mazzo", quaderno: "quaderno",
    nives: "nives", donna: "nives", padrona: "nives", ostessa: "nives",
    kessel: "kessel", uomo: "kessel", straniero: "kessel", commerciante: "kessel",
    lodi: "lodi", brigadiere: "lodi", brandi: "brandi", capitano: "brandi", uomini: "uomini",
    telefono: "telefono", banco: "banco", grappa: "grappa", bicchiere: "grappa", caffe: "grappa", giornale: "giornale", licenza: "banco",
    stufa: "stufa", cenere: "stufa", valigia: "valigia", finestra: "finestra", letto: "letto", materasso: "letto", armadio: "letto",
    lampione: "lampione", faro: "faro", torre: "faro", luce: "faro", acqua: "acqua", mare: "acqua", assi: "acqua", golfo: "acqua",
    manifesto: "manifesto", bandiere: "bandiere", municipio: "bandiere", locanda: "locandaext", polizia: "poliziaext", portici: "bandiere",
    fascicolo: "fascicolo", rapporto: "fascicolo", verbale: "fascicolo", armadietto: "armadietto",
    sigilli: "sigilli", sigillo: "sigilli", porta: "porta", casa: "casaext", muretto: "muretto", traccia: "muretto", strapiombo: "muretto",
    scrivania: "scrivania", cassetti: "scrivania", tabellina: "scrivania", registro: "registro",
    lente: "lente", quadro: "leva", leva: "leva", tasto: "leva", sportello: "sportello", basamento: "sportello",
    macchina: "macchina", auto: "macchina", barca: "barca", lanterna: "barca", foglio: "brandi",
    mappa: "mappa", scheda: "scheda"
  };

  function norm(s) {
    s = String(s).toLowerCase();
    s = s.replace(/[àá]/g, "a").replace(/[èé]/g, "e").replace(/[ìí]/g, "i").replace(/[òó]/g, "o").replace(/[ùú]/g, "u");
    s = s.replace(/\?/g, " aiuto ").replace(/['’`«»]/g, " ").replace(/[^a-z0-9 ]/g, " ");
    return s.replace(/\s+/g, " ").replace(/^ | $/g, "");
  }
  function tokens(s) {
    var raw = s.split(" "), out = [], i;
    if (raw.length === 1) { return raw; }
    for (i = 0; i < raw.length; i++) { if (raw[i] && STOP.indexOf(" " + raw[i] + " ") < 0) { out.push(raw[i]); } }
    return out.length ? out : raw;
  }

  /* ---------- stato del mondo ---------- */
  function has(id) { return S.loc[id] === "inv"; }
  function isItem(id) { for (var i = 0; i < ITEMS.length; i++) { if (ITEMS[i] === id) { return true; } } return false; }
  function night() { return S.ch === 1 || S.ch === 4; }
  function npcHere(who) {
    var r = S.room, c = S.ch;
    if (who === "nives") { return r === "locanda"; }
    if (who === "kessel") { return (r === "locanda" && c <= 2) || (r === "faro" && S.f.offerta && c === 3); }
    if (who === "lodi") { return (r === "caserma" && (c === 2 || c === 3)) || (r === "cala" && c === 4); }
    if (who === "brandi" || who === "uomini") { return r === "cala" && c === 4; }
    return false;
  }
  function isNpc(id) { return id === "nives" || id === "kessel" || id === "lodi" || id === "brandi" || id === "uomini"; }
  var SCENERY = { telefono: ["locanda"], banco: ["locanda"], grappa: ["locanda"], giornale: ["locanda"], stufa: ["locanda", "casa"],
    valigia: ["camera"], finestra: ["camera", "strada", "casa"], letto: ["camera", "casa"], lampione: ["molo"],
    faro: ["molo", "piazza", "strada", "faro", "camera", "cala", "lanterna"], acqua: ["molo", "cala", "lanterna", "camera"],
    manifesto: ["piazza"], bandiere: ["piazza"], locandaext: ["piazza"], poliziaext: ["piazza"],
    fascicolo: ["caserma"], polsi: ["caserma"], armadietto: ["caserma"],
    sigilli: ["strada"], casaext: ["strada"], muretto: ["strada"], porta: ["faro", "strada"],
    scrivania: ["casa"], registro: ["casa"], lente: ["lanterna"], leva: ["lanterna"], sportello: ["lanterna"],
    macchina: ["cala"], barca: ["cala", "lanterna"] };
  function present(id) {
    if (isNpc(id)) { return npcHere(id); }
    if (isItem(id)) {
      if (has(id) || S.loc[id] === S.room) { return true; }
      if (id === "quaderno") { return S.room === "lanterna" && S.f.sportello && S.loc.quaderno === "sportello"; }
      return false;
    }
    var sc = SCENERY[id], i;
    if (!sc) { return false; }
    for (i = 0; i < sc.length; i++) { if (sc[i] === S.room) { return true; } }
    return false;
  }

  /* ---------- blocchi ---------- */
  function P(s) { return { t: "p", s: s }; }
  function NOTE(s) { return { t: "note", s: s }; }
  function IMG(id, cap) { return { t: "img", id: id, cap: cap }; }
  function CHAP(n) { return { t: "chapter", n: CH_NAME[n], s: CH_TITLE[n] }; }

  function setChapter(n) { S.ch = n; S.t = { n: 0, k: 0, l: 0, b: 0 }; markChapter(); }
  /* inizio del capitolo: un codice tenuto da parte, per RICOMINCIA CAPITOLO */
  var CHAP_KEY = "vialibera.capitolo", chapMem = "";
  function markChapter() { chapMem = encode(); try { localStorage.setItem(CHAP_KEY, chapMem); } catch (e) { /* resta in memoria */ } }
  function chapterStart() { var c = chapMem; try { c = localStorage.getItem(CHAP_KEY) || chapMem; } catch (e) { c = chapMem; } return decode(c || ""); }
  function restartChapter() {
    var o = chapterStart();
    if (!o || o.ch !== S.ch) { o = S.ch === 1 ? fresh() : null; }
    if (!o) { return [P("Non so dove comincia questo capitolo: la partita è stata ripresa da un codice. Puoi ricominciare da capo, oppure CARICA un codice salvato prima.")]; }
    S = o; save();
    return [NOTE("Si ricomincia dall'inizio del capitolo."), CHAP(S.ch)].concat(describe(true));
  }

  function describe(withImage) {
    var b = [{ t: "room", s: ROOM_NAME[S.room] }], r = S.room, c = S.ch, d = "";
    if (r === "molo") {
      if (c === 1) {
        if (withImage) { b.push(IMG("faro", "Il faro di Punta Cieca: un lampo ogni cinque secondi")); }
        d = "Il piroscafo riparte senza fischiare, come chi lascia un debito. Assi bagnate, bitte, un [[lampione]] che illumina solo la propria pioggia. In fondo al golfo il [[faro]] fa il suo lavoro: un lampo, buio, un lampo.\nLa piazza è a [[nord]].";
      } else if (c === 4) {
        if (withImage) { b.push(IMG("faro", "Il faro, in automatico")); }
        d = "Vuoto. L'orario dice che il primo piroscafo parte alle sei e dieci. Mancano sei ore e una decisione.\nLa piazza è a [[nord]].";
      } else {
        if (withImage) { b.push(IMG("moloGiorno", "Il molo, di giorno")); }
        d = "Di giorno il molo è reti stese e uomini che smettono di parlare quando passi. Sotto queste [[assi]] hanno ripescato Zanon.\nLa piazza è a [[nord]].";
      }
    } else if (r === "piazza") {
      if (withImage) { b.push(IMG(night() ? "piazza" : "piazzaGiorno", "Piazza del Municipio: tre bandiere")); }
      d = "Tre [[bandiere]] fradice sul municipio, i portici vuoti, un [[manifesto]] che si scolla. ";
      if (c === 1) { d += "A [[est]] le finestre accese di una [[locanda]]; a [[ovest]] il posto di [[polizia]] portuale, buio. A [[nord]] parte il sentiero del faro."; }
      else if (c === 4) { d += "A [[est]] la [[locanda]] ha le imposte chiuse e una riga di luce sotto la porta. A [[ovest]] la [[polizia]] è spenta. A [[nord]] il sentiero del faro."; }
      else { d += "A [[est]] la [[locanda]]; a [[ovest]] il posto di [[polizia]] portuale; a [[nord]] il sentiero del faro."; }
      d += " Il molo è a [[sud]].";
    } else if (r === "locanda") {
      if (withImage) { b.push(c <= 2 ? IMG("bar", "«Al Fanale»") : IMG("barVuoto", c === 3 ? "«Al Fanale», a sedie capovolte" : "«Al Fanale», a imposte chiuse")); }
      if (c === 1) {
        d = "Un [[banco]] di zinco, sei tavoli, una [[stufa]] che fa più fumo che caldo. Dietro il banco una [[donna]] asciuga lo stesso bicchiere da un po'. A un tavolo d'angolo un [[uomo]] col cappotto buono legge un [[giornale]] di un altro paese. Vicino alla scala c'è un [[telefono]] a gettoni. Sul banco, una bottiglia di [[grappa]] senza etichetta.";
      } else if (c === 2) {
        d = "Di mattina sa di cicoria e di cenere. [[Nives]] è dietro il [[banco]], come se non si fosse mai mossa. [[Kessel]] ha lo stesso tavolo e lo stesso [[giornale]].";
      } else if (c === 3) {
        d = "Nives ha messo le sedie sui tavoli. Il tavolo d'angolo è vuoto: Kessel ha pagato ed è uscito. [[Nives]] guarda l'orologio sopra il [[banco]].";
      } else {
        d = "Imposte chiuse, una sola lampada. [[Nives]] ha il cappotto addosso e in mano le chiavi di un furgone.";
      }
      d += "\nLa piazza è a [[ovest]]" + (c < 4 ? ", le camere [[su]]." : ".");
    } else if (r === "camera") {
      if (withImage) { b.push(IMG(night() ? "camera" : "cameraGiorno", "Camera 7")); }
      d = "Un [[letto]] di ferro, un catino, un armadio che non chiude. La tua [[valigia]] è sul letto. ";
      d += c === 1 ? "Dalla [[finestra]] si vede il golfo, e nel golfo la luce." : "Dalla [[finestra]], di giorno, il golfo è color peltro.";
      if (c === 1) { d += S.f.telefonato ? " Roma è avvisata. Non resta che [[dormire|dormi]]." : " Prima di [[dormire|dormi]], Roma vuole una telefonata."; }
      d += "\nLa scala scende: [[giù]].";
    } else if (r === "caserma") {
      if (withImage) { b.push(IMG("caserma", "Polizia portuale, ufficio unico")); }
      d = "Una stanza, due scrivanie, una sola occupata. Il brigadiere [[Lodi]] ha la faccia di chi ha firmato troppe cose. Sul tavolo c'è un [[fascicolo]] sottile; in un angolo, un [[armadietto]] di ferro.\nLa piazza è a [[est]].";
    } else if (r === "strada") {
      if (withImage) { b.push(IMG(night() ? "strada" : "stradaGiorno", "Il sentiero di Punta Cieca")); }
      d = "Il sentiero sale tra le tamerici, con lo strapiombo da una parte e il vento da tutte. A [[est]] una [[casa]] bassa di pietra, con i [[sigilli]] della polizia sulla porta. A [[nord]] il faro. La piazza è a [[sud]].";
      if (S.f.retro && !S.f.finestra) { d += " Sul retro della casa, una [[finestra]] accostata."; }
      if (S.f.quaderno) { d += "\nDove il [[muretto]] è crollato, una traccia scende alla cala: [[giù]]."; }
    } else if (r === "casa") {
      if (withImage) { b.push(IMG("casa", "Qualcuno è passato prima")); }
      d = "Hanno cercato con metodo e senza garbo: cassetti rovesciati, il materasso aperto come un pesce. Sulla [[scrivania]] è rimasto il [[registro]] dell'Amministrazione. Nella [[stufa]] c'è cenere fresca.";
      if (S.loc.foto === "casa") { d += " Alla parete, storta, una [[fotografia]] in cornice."; }
      d += "\nSi esce da dove sei entrata: [[ovest]].";
    } else if (r === "faro") {
      if (withImage) { b.push(IMG(night() ? "torre" : "torreGiorno", "Trentadue metri, visti da sotto")); }
      d = "Trentadue metri di muratura a fasce, e in cima la luce che gira per conto suo. La [[porta]] è di ferro" + (S.f.porta ? ", aperta sulla scala: [[su]]." : ", chiusa.");
      d += "\nIl sentiero torna a [[sud]].";
    } else if (r === "lanterna") {
      if (withImage) { b.push(IMG(c === 4 ? "lente4" : "lente", "La lente di Punta Cieca")); }
      d = "Centoquarantasei gradini. Una gabbia di vetro intorno alla [[lente]], che " + (S.f.manuale ? "adesso è ferma." : "gira piano, con un rumore d'orologio.");
      d += " Sul [[quadro]] elettrico una leva a due posizioni, AUTOMATICO e MANUALE, e un tasto di ottone lucidato dall'uso. Nel basamento della lente c'è uno [[sportello]]" + (S.f.sportello ? ", aperto." : ".");
      if (c === 4) { d += " Al largo, piccola, una [[lanterna]] che non dovrebbe esserci."; }
      d += "\nLa scala scende: [[giù]].";
    } else if (r === "cala") {
      if (withImage) { b.push(IMG("cala", "Cala del Morto, le undici e mezza")); }
      d = "Venti metri di ghiaia tra due pareti di roccia. Una [[macchina]] nera a fari spenti, due [[uomini]] che fumano col bavero alzato, il brigadiere [[Lodi]] che si guarda le scarpe. E [[Brandi]], venuto di persona da Roma, col cappotto di cammello: non si fidava.\nAl largo, una [[barca]] ferma. Il sentiero risale: [[su]].";
      S.f.lodiCala = 1;
    }
    b.push(P(d));
    return b;
  }

  function prologue() {
    return [
      [{ t: "front", s: "Via Libera", sub: "Un noir in quattro capitoli" },
        IMG("faro", "Porto Scuro, novembre 1953"),
        { t: "prosa", s: "Porto Scuro, zona di confine, amministrazione provvisoria: tre bandiere sul municipio e nessuna che comandi davvero.\n\nArrivi con l'ultima corsa, sotto una pioggia che non cade: insiste. Ti chiami Ada Corvi, hai quarantun anni e un tesserino del Servizio Fari che dice «ispettrice». È quasi vero." }],
      [IMG("cala44", "Una spiaggia come un'altra, marzo 1944"),
        { t: "prosa", s: "Tre giorni fa il guardiano di Punta Cieca è stato ripescato sotto il molo. Annegamento, dice il rapporto. Il capitano Brandi, da Roma, dice altro: «Zanon teneva un quaderno. Non quello dell'Amministrazione. Trovalo prima degli altri.»\n\nNon hai chiesto chi sono gli altri. Con Brandi non si chiede. Tiene in un cassetto un foglio del marzo '44 con la tua firma in fondo, e ogni tanto lo nomina, come si nomina un parente." }]
    ];
  }

  /* ---------- scheda ---------- */
  function sheet() {
    var c = S.ch, f = S.f, who = [], facts = [], sig = [], job, time;
    time = ["", "Notte, pioggia", "Mattina, cielo basso", "Sera, ha smesso di piovere", "Verso mezzanotte"][c];
    if (S.end) { job = "Nessuno."; }
    else if (c === 1) { job = f.telefonato ? "Dormire. Domani cercare il quaderno di Zanon." : "Prendere una camera e telefonare a Roma."; }
    else if (c === 2) { job = has("foto") ? "Chiedere a Nives della fotografia." : "Capire com'è morto Zanon e dove teneva il quaderno."; }
    else if (c === 3) { job = f.quaderno ? "Uscire dal faro con il quaderno." : "Salire al faro. Il quaderno è sotto la lente."; }
    else { job = "A mezzanotte, dalla lanterna, fare un segnale. Uno solo."; }

    who.push(["Brandi", "Capitano di corvetta, Roma. Il tuo superiore, per modo di dire. Ha il tuo foglio del '44." + (f.quaderno ? " È la «B.» del quaderno: sceglie chi arriva e rivende gli altri." : "")]);
    who.push(["Zanon", "Guardiano del faro, morto da tre giorni. " + (f.polsi ? "Aveva i polsi segnati: non è caduto, l'hanno messo in acqua." : "Annegato, dicono.") + (f.nives ? " Portava gente di qua con la luce, e ha scritto tutto." : "")]);
    if (S.visited.locanda) { who.push(["Nives", "Padrona della locanda." + (f.nives ? " La donna di Zanon. Ha un fratello sulla barca di stanotte: vuole il 3-1." : "")]); }
    if (f.k1) { who.push(["Kessel", "Dice spugne e corallo. Sapeva il tuo nome." + (f.stufa || f.quaderno ? " È la «K.»: comprava nomi da Zanon." : "") + (f.offerta ? " Lavora per la terza bandiera. " + (f.patto ? "Ha il quaderno. Ti deve un passaporto." : "Offriva un passaporto.") : "")]); }
    if (f.lodi1) { who.push(["Lodi", "Brigadiere. Ha chiuso il caso prima di aprirlo." + (f.lodiCala ? " Stanotte è alla cala, con Brandi." : "")]); }

    if (f.quaderno) {
      sig.push("1-3  via libera, cala del Morto"); sig.push("2-1  aspettate"); sig.push("2-2  pericolo, tornate"); sig.push("3-1  scalo vecchio, «solo per i nostri»");
    } else {
      if (f.notte) { sig.push("Stanotte, alle tre, qualcuno ha battuto due lampi e uno."); }
      if (f.tabellina) { sig.push("1-3, 2-1, 2-2, 3-1: quattro segnali incisi sotto una scrivania. Nessuna spiegazione."); }
    }

    if (f.valigia) { facts.push("Qualcuno ha aperto la tua valigia. Non mancava niente: era un saluto."); }
    if (f.fascicolo) { facts.push("Sul verbale manca il mazzo di chiavi. Un guardiano senza chiavi."); }
    if (f.registro) { facts.push("Dal registro ufficiale mancano tre notti. Tutte senza luna."); }
    if (f.stufa) { facts.push("Nella stufa, cifre bruciate e due iniziali: «B.» e «K.»."); }
    if (f.quaderno) { facts.push("Stanotte a mezzanotte arriva una barca: sei persone. Una è l'archivista, con le ricevute di Brandi."); }
    if (f.foglio) { facts.push("Marzo '44: hai trasmesso «via libera» con una pistola alla nuca. Nove persone. Brandi ha il foglio."); }
    if (f.lodiPolsi) { facts.push("Lodi ha visto i polsi. Alle cime del molo non ci crede più nemmeno lui."); }
    if (f.nivesSa) { facts.push("Nives sa dei polsi. Adesso sa che Elia non è caduto."); }
    if (f.nivesTradita) { facts.push("Hai mostrato la fotografia di Nives ad altri, prima che a lei. Lei lo sa."); }
    if (f.kesselSa) { facts.push("Kessel sa che hai letto le iniziali nella stufa."); }
    if (f.nives4) { facts.push("Allo scalo vecchio non c'è nessuno. Nives ha un furgone."); }
    if (f.patto) { facts.push("Kessel sarà alla cala con più uomini di Brandi. Dice."); }

    return [{ t: "sheet", name: "Ada Corvi", cap: "Fototessera, Servizio Fari, 1951",
      rows: [["Età", "41 anni"],
        ["Copertura", "Ispettrice, Servizio Fari e Segnalamenti"],
        ["Mestiere", "Marconista, 1943–45. Dopo, quello che dice Brandi"],
        ["Vizi", "Nazionali senza filtro. Dormire vestita"],
        ["Ora", CH_NAME[c] + ". " + time],
        ["Incarico", job]],
      lists: [["Chi è chi", who, true], ["I segnali", sig, false], ["Cosa sai", facts, false]] }];
  }

  function mapBlock() {
    var v = {}, id;
    for (id in S.visited) { if (S.visited.hasOwnProperty(id)) { v[id] = 1; } }
    return [{ t: "map", visited: v, room: S.room, cala: S.f.quaderno ? 1 : 0, cap: "Porto Scuro e Punta Cieca" }];
  }

  /* ---------- capitoli ---------- */
  function sleep() {
    if (S.room !== "camera") { return [P("Non qui.")]; }
    if (S.ch !== 1) { return [P("Non è ora di dormire.")]; }
    if (!S.f.telefonato) { return [P("Non prima di aver chiamato Roma. Brandi non ama aspettare, e tu non ami dargli ragioni.")]; }
    S.moves++; S.f.notte = 1; setChapter(2);
    return [IMG("finestra21", "Le tre di notte, dalla camera 7"),
      P("Dormi vestita. Alle tre ti sveglia la luce.\nNon il solito lampo. Due, vicini. Buio. Poi uno. Buio lungo. E di nuovo: due, uno.\nIl guardiano è morto da tre giorni e il faro, dicono, va da solo. Qualcuno, lassù, non è d'accordo.\nQuando apri la finestra è tornato regolare. Non riprendi sonno."),
      CHAP(2)].concat(describe(false));
  }

  function confess() {
    S.f.nives = 1; S.loc.mazzo = "inv"; S.moves++; setChapter(3);
    return [IMG("m_confessione", "Le chiavi di Elia"), P(S.f.nivesTradita ? "Posi la fotografia sul banco. Nives non la tocca.\n«L'ha già fatta vedere in giro, mi dicono. Qui le voci arrivano prima dei piroscafi.» Poi, perché non ha scelta: «Stanotte sono salita io. Due e uno: aspettate. Non sapevo che altro dire, a quelli in mare.»" : "Posi la fotografia sul banco, dalla parte della matita. Nives smette di asciugare.\n«Stanotte sono salita io. Due e uno: aspettate. Non sapevo che altro dire, a quelli in mare.»"),
      P("Elia portava gente di qua, di notte, con la luce. Chi poteva pagare e chi no. Da un anno qualcuno, a Roma, decideva quali barche arrivavano davvero. Elia l'ha capito leggendo un nome su un giornale dell'altra parte, nell'elenco dei fucilati. Era un uomo che aveva fatto sbarcare lui."),
      P("«Ha scritto tutto. Nomi, somme, notti. Il quaderno è nel faro, sotto la lente, dove la luce non guarda.» Ti mette in mano un [[mazzo]] di chiavi ancora tiepido di tasca. «La barca viene stanotte. Sopra c'è mio fratello.»"),
      CHAP(3),
      P("Fuori ha smesso di piovere, che qui è un brutto segno. Il pomeriggio finisce in fretta.")].concat(describe(false));
  }

  function kesselScene() {
    S.room = "faro"; S.f.offerta = 1; S.f.k1 = 1; S.moves++;
    return [{ t: "room", s: ROOM_NAME.faro }, IMG("kessel", "In fondo alla scala"),
      P("La porta è aperta sulla notte, e nella porta c'è [[Kessel]]. Non ha l'ombrello. Ha una sigaretta.\n«L'ha trovato. Si vede da come tiene la borsa.»" + (S.f.kesselSa ? " Sorride. «E sa già della K. Bene: posso smettere di vendere spugne.»" : "") + " Non si avvicina. «Io lavoro per la terza bandiera, signora. Zanon mi vendeva dei nomi. Il suo capitano Brandi vendeva le persone. Stanotte sarà alla cala, con due uomini e il brigadiere.»"),
      P("Tira fuori una busta. «Mi dia il quaderno e faccia il segnale che vuole lui. Alla cala ci sarò anch'io, con più uomini dei suoi. Lei avrà un passaporto con un altro nome.»\nAspetta. [[ACCETTA|accetta]], oppure [[RIFIUTA|rifiuta]].")];
  }

  function resolveKessel(accept) {
    var b;
    S.f.offerta = 0; S.moves++;
    if (accept) {
      if (!has("quaderno")) { S.f.offerta = 1; return [P("«Il quaderno, signora. Le parole le ho già.»")]; }
      S.f.patto = 1; S.loc.quaderno = "none";
      b = [P("Gli dai il quaderno. Lo soppesa, non lo apre. «Uno-tre, a mezzanotte. Non un minuto dopo.» Sulla soglia si volta. «Ha fatto la scelta ragionevole. Di solito è quella che si rimpiange.»")];
    } else {
      b = [P("Gli passi accanto. Ha un buon odore di tabacco straniero.\n«Come vuole», dice alle tue spalle. «Ma un segnale lo farà comunque. Lo ha già fatto una volta, mi risulta.»\nQuando ti volti, la porta è vuota.")];
    }
    setChapter(4);
    return b.concat([CHAP(4), P("Le undici e venti. Quaranta minuti, quattro segnali, e tre persone che ne vogliono tre diversi.")]).concat(describe(false));
  }

  var ENDINGS = {
    "13": function () {
      if (S.f.patto) {
        return ["Il passaporto", "Uno. Buio. Tre. In mare una lanterna risponde, e la barca viene avanti.\nAlla cala si accendono i fari di Brandi, e subito dopo altri, più in alto, sulla strada. Quattro colpi. Poi un megafono, in una lingua da vincitori. Brandi sale su una jeep col cappotto di cammello sporco di ghiaia.\n" + (S.f.kesselSa ? "Sul molo Kessel ti stringe la mano. «Lei sapeva della K. e ha trattato lo stesso. Ormai siamo colleghi.»\n" : "") + "Kessel mantiene: un passaporto, un nome nuovo, un biglietto per Marsiglia. Dei sei della barca dice: «In un campo, per accertamenti. Qualche mese.» Dice mese come Brandi diceva promessa.\nNives non ti saluta."];
      }
      return ["Il lavoro", "Uno. Buio. Tre. In mare una lanterna risponde, e la barca viene avanti, fiduciosa.\nDalla lanterna vedi tutto piccolo: i fari della macchina che si accendono, sei figure con le mani alzate, una che viene fatta salire davanti. Le altre cinque, sul camion del brigadiere." + (S.f.lodiPolsi ? " Lodi guida piano. Al bivio sbaglia strada, e quando arriva in caserma sul camion ne restano tre. Le altre due, dice, sono saltate giù. Nessuno gli chiede come abbia fatto a non vederle." : "") + (S.f.nivesSa ? "\nNives sapeva chi aveva legato i polsi a Elia. Adesso sa anche chi ha acceso la luce." : "") + "\nAll'alba Brandi ti dà il foglio del '44. Lo bruci sul molo, aspettando il piroscafo. Brucia in fretta, come le cose che in fondo non pesavano.\nL'hai rifatto. Stavolta senza la pistola alla nuca."];
    },
    "22": function () {
      return ["Mare vuoto", "Due. Buio. Due. La lanterna in mare resta ferma un momento, come chi non vuole capire. Poi vira.\nNessuno sbarca, nessuno viene preso. Sei persone tornano verso la costa da cui scappavano, con le ricevute di Brandi in tasca e una motovedetta che dall'altra parte esce alle quattro.\nBrandi sale al faro di persona. Non alza la voce. Dice soltanto che il foglio del '44 parte domani per tre giornali." + (S.f.patto ? "\nKessel se ne va col quaderno e senza un grazie." : (S.f.kesselSa ? "\nKessel, al tavolo d'angolo, alza il bicchiere verso di te. Sa della K., e sa che lo sai: per stavolta basta a tutti e due." : "")) + "\nNives sta sulla porta della locanda e guarda il mare vuoto. Non sai se ti stia ringraziando."];
    },
    "21": function () {
      return ["Nessuna decisione", "Due. Buio. Uno. Aspettate. È il segnale di chi non sa decidere, e lo sai mentre lo batti.\nLa barca aspetta. Aspetta Brandi alla cala, aspetta Nives col furgone, aspetta Kessel dovunque sia. Alle cinque e quaranta arriva la motovedetta dell'Amministrazione, che non aspettava nessuno, e li prende tutti e sei alla luce del giorno.\nSul verbale ci sarà scritto «sbarco clandestino sventato». Non ci sarà scritto da chi." + (S.f.lodiPolsi ? "\nIn fondo al verbale, Lodi aggiunge una riga sui polsi di Zanon. Non la leggerà nessuno. Ma c'è." : "") + "\nRiparti col primo piroscafo. Nessuno ti ferma. È questo il peggio."];
    },
    "31": function () {
      var s = "Tre. Buio. Uno. La lanterna in mare risponde due volte, sorpresa, e la barca piega a ponente, verso lo scalo vecchio.\nBrandi lo capisce tardi. Quando la macchina arriva dietro il macello ci sono solo impronte di gomme e una cima tagliata. L'archivista e le sue ricevute sono da qualche parte nell'entroterra, con un ragazzo di ventidue anni e una donna che guida a fari spenti.";
      if (S.f.patto) { s += "\nKessel riparte la mattina, col quaderno e senza l'archivista. Mezza verità: gli basterà per fare carriera."; }
      else if (S.f.datoBrandi) { s += "\nIl quaderno l'ha bruciato Brandi. Le ricevute no."; }
      if (S.f.lodiPolsi) { s += "\nLodi arriva allo scalo vecchio con mezz'ora di ritardo. Non aveva fretta, stanotte."; }
    if (S.f.nivesTradita) { s += "\nNives non ti saluta. La fotografia l'hai mostrata prima agli altri: ti ha usata, come tu hai usato lei, ed è pari."; }
    else if (S.f.nivesSa) { s += "\nPrima di salire sul furgone, Nives ti stringe la mano, forte, come si fa con chi ha portato una brutta notizia ed era vera."; }
    s += "\nIl tuo foglio del '44 uscirà sui giornali, prima o poi. Non a Porto Scuro: qui i giornali arrivano tardi e nessuno li legge.\nA Punta Cieca serve un guardiano. Hai le chiavi, conosci il mestiere, e la luce, di notte, bisogna pure che qualcuno la tenga.";
      return ["La guardiana", s];
    }
  };

  /* ---------- finali trovati: restano anche dopo RICOMINCIA ---------- */
  var END_TITLES = ["Il lavoro", "Il passaporto", "Mare vuoto", "Nessuna decisione", "La guardiana"], foundMem = {};
  function foundEnds() {
    var o = foundMem;
    try { o = JSON.parse(localStorage.getItem("vialibera.finali") || "null") || foundMem; } catch (e) { o = foundMem; }
    return o;
  }
  function markEnd(title) {
    var o = foundEnds(); o[title] = 1; foundMem = o;
    try { localStorage.setItem("vialibera.finali", JSON.stringify(o)); } catch (e) { /* resta in memoria */ }
  }
  function endsNote() {
    var o = foundEnds(), got = [], i;
    for (i = 0; i < END_TITLES.length; i++) { if (o[END_TITLES[i]]) { got.push(END_TITLES[i]); } }
    if (!got.length) { return "Finali trovati: nessuno su " + END_TITLES.length + "."; }
    return "Finali trovati: " + got.length + " su " + END_TITLES.length + " (" + got.join(", ") + ")." + (got.length < END_TITLES.length ? " Gli altri restano da scoprire." : " Li hai visti tutti.");
  }

  var END_PIC = { "Il lavoro": ["f_lavoro", "All'alba, sul molo"], "Il passaporto": ["f_passaporto", "Verso Marsiglia"], "Mare vuoto": ["f_mare", "Il mare, vuoto"],
    "Nessuna decisione": ["f_attesa", "Le cinque e quaranta"], "La guardiana": ["f_guardiana", "Punta Cieca, la notte dopo"] };
  function signal(code) {
    if (S.room !== "lanterna") { return [P("Da qui puoi segnalare solo con le braccia.")]; }
    if (S.ch !== 4) { return [P("Non ancora. Se tocchi quella luce, qualcuno in mare capisce qualcosa. Prima devi sapere cosa.")]; }
    if (!S.f.manuale) { return [P("La lampada è in AUTOMATICO: il tasto è morto. C'è una leva.")]; }
    if (!CODES[code]) { return [P("Quale segnale? [[1-3|segnala 1-3]], [[2-1|segnala 2-1]], [[2-2|segnala 2-2]] oppure [[3-1|segnala 3-1]].")]; }
    var e = ENDINGS[code]();
    S.moves++; S.end = { "13": 1, "21": 2, "22": 3, "31": 4 }[code]; markEnd(e[0]);
    var fin = END_PIC[e[0]];
    return [IMG("tx" + code, "Mezzanotte: " + code.charAt(0) + "-" + code.charAt(1)), P(e[1]), IMG(fin[0], fin[1]),
      { t: "end", s: "Fine — " + e[0] },
      NOTE("Hai chiuso la storia in " + S.moves + " mosse. " + endsNote() + " [[RICOMINCIA CAPITOLO|ricomincia capitolo]] per rifare la notte e cercare un altro finale, [[RICOMINCIA|ricomincia]] per ripartire da capo, [[STORIE|storie]] per tornare all'elenco delle storie.")];
  }

  /* ---------- movimento ---------- */
  function go(dir) {
    var r = S.room, c = S.ch, to = EXITS[r][dir], first;
    if (S.f.offerta) {
      if (dir === "sud") { return resolveKessel(false); }
      return [P("Kessel è tra te e la notte. Di sopra non c'è un'altra uscita.")];
    }
    if (!to) { return [P("Da quella parte non si va.")]; }
    if (r === "piazza" && dir === "nord" && c === 1) { return [P("Di notte, con questa pioggia, il sentiero del faro è un modo lento di ammazzarsi. Domani.")]; }
    if (r === "piazza" && dir === "ovest" && c === 1) { return [P("Buio. Un cartello: «Si riapre alle 8». La legge, a Porto Scuro, fa orario d'ufficio.")]; }
    if (r === "piazza" && dir === "ovest" && c === 4) { return [P("Spento e chiuso. Il brigadiere ha altri impegni, stanotte.")]; }
    if (r === "locanda" && dir === "su") {
      if (c === 4) { return [P("Non è notte da dormire.")]; }
      if (!has("chiave")) { return [P("Le camere sono di sopra. Senza chiave resti un'avventrice.")]; }
    }
    if (r === "strada" && dir === "est" && !S.f.finestra) {
      if (!S.f.retro) { S.f.retro = 1; return [P("La porta è sotto sigillo. Giri intorno alla casa: sul retro una [[finestra]] è accostata, col fermo saltato. Qualcuno è già entrato di lì.")]; }
      S.f.finestra = 1;
      return [P("Scavalchi il davanzale. Non è la prima volta che entri in una casa così.")].concat(move(to));
    }
    if (r === "strada" && dir === "giu" && !S.f.quaderno) { return [P("Sotto c'è scogliera e basta. Se c'è un modo per scendere, non lo conosci.")]; }
    if (r === "strada" && dir === "giu" && c < 4) { return [P("La cala, adesso, è vuota. Si riempirà a mezzanotte.")]; }
    if (r === "faro" && dir === "su" && !S.f.porta) { return [P("La porta di ferro è chiusa.")]; }
    if (r === "lanterna" && dir === "giu" && c === 3 && S.f.quaderno) { return kesselScene(); }
    return move(to);
  }
  function move(to) {
    var first = !S.visited[to];
    S.room = to; S.moves++; S.visited[to] = 1;
    return describe(first);
  }

  /* ---------- dialoghi ---------- */
  function line(arr, key) { var i = Math.min(S.t[key], arr.length - 1); if (S.t[key] < 3) { S.t[key]++; } return [P(arr[i])]; }

  function talk(who) { return talkLine(who).concat(who ? topicList(who) : []); }
  function talkLine(who) {
    var c = S.ch, f = S.f;
    S.moves++;
    if (who === "nives") {
      if (c === 1) {
        if (!f.nivesKey) { return [P("«Camera?» chiede, senza smettere di asciugare. «[[Documenti|mostra tesserino]].»")]; }
        return line(["«La cucina è chiusa. C'è [[grappa]].»", "«Elia Zanon veniva qui tutte le sere alle nove. Da tre sere no.» Posa il bicchiere. «Altro non so.» È una frase che ha già detto, a qualcun altro.", "«Buonanotte, signora dei fari.»"], "n");
      }
      if (c === 2) {
        return line(["«Caffè di cicoria. Altro non c'è.» Te lo versa lo stesso.", "«Stanotte la luce…» cominci. «Di notte io dormo», dice Nives. Ha le mani screpolate di chi ha tirato una leva fredda.", "«Elia beveva poco, parlava meno e sapeva nuotare. Lo scriva, nel suo rapporto.»"], "n");
      }
      if (c === 3) { return line(["«Sotto la lente. La chiavetta d'ottone.» Guarda l'orologio. «Vada.»", "«Non mi chieda se mi fido. Non ho scelta, che è un'altra cosa.»"], "n"); }
      f.nives4 = 1;
      return line(["«Tre e uno», dice subito. «Lo scalo vecchio, dietro il macello. Elia l'ha usato una volta sola, per i miei. Lì non c'è nessuno, e io ho un furgone.»",
        "«Lo so cosa le costa. A Elia è costato i polmoni pieni d'acqua.» Ti guarda. «Mio fratello ha ventidue anni.»",
        "«Qualunque cosa faccia, la faccia a mezzanotte in punto. Guardano la luce per un minuto solo.»"], "n");
    }
    if (who === "kessel") {
      if (f.offerta) { return [P("«Non ho fretta», dice Kessel. «Ne ha lei.» [[ACCETTA|accetta]] o [[RIFIUTA|rifiuta]].")]; }
      f.k1 = 1;
      if (c === 1) {
        return line(["Abbassa il giornale. «Kessel. Spugne, corallo, quel che il mare lascia.» Ha un accento che cambia a metà frase. «Lei invece ispeziona fari, signora Corvi. Di notte. Con questo tempo.»\nNon gli hai detto il tuo nome.",
          "«Un consiglio da commerciante: in questo porto tutti vendono qualcosa. Si chieda cosa sta vendendo lei.» Rialza il giornale."], "k");
      }
      return line(["«Dormito bene? No? Nemmeno io. Certe luci tengono svegli.»", "«Quando troverà quello che cerca, si ricordi che Roma paga in promesse. Io pago in passaporti.»"], "k");
    }
    if (who === "lodi") {
      f.lodi1 = 1;
      if (c === 4) { return [P("«Diciannove anni di servizio», dice piano, senza che tu abbia chiesto niente.")]; }
      if (c === 3) { return [P("Sta chiudendo. «Ha firmato? No? Domani.» Ha fretta di essere altrove, e non ne ha voglia.")]; }
      return line(["«Zanon Elia, anni cinquantadue, guardiano. Scivolato dal molo in stato di ebbrezza. Caso chiuso.» Guarda il tuo tesserino senza toccarlo. «Voi dei Fari volete la lampada, no? La lampada sta bene. Va da sola.»",
        "«Il corpo è alla ghiacciaia del mercato fino a domani. La casa è sotto sigillo. Le chiavi sono agli atti.» Tre porte chiuse in una frase sola.",
        "«Signora. Io ho moglie, due figli e diciannove anni di servizio. Legga il fascicolo, firmi che la lampada funziona, e riparta.»"], "l");
    }
    if (who === "brandi") {
      var shown = S.t.b === 1 ? [IMG("m_foglio", "Marzo 1944")] : [];
      if (S.t.b === 1) { f.foglio = 1; }
      return shown.concat(line(["«Ada.» Come si chiama un cane che è tornato. «Il quaderno.»" + (has("quaderno") ? " Te lo guarda in mano e non lo prende: gli basta sapere dov'è." : (f.patto ? "\n«Non ce l'ho.»\n«Allora ce l'ha Kessel. Peccato. Per te.»" : "")),
        "Tira fuori un foglio piegato in quattro. Lo riconosci dalla piega. «Marzo del '44. Via libera, hai trasmesso. Nove persone su una spiaggia come questa. Io lo so, che avevi una pistola alla nuca. I giornali no.» Lo rimette in tasca. «Uno-tre, a mezzanotte. Poi il foglio è tuo.»",
        "«E gli altri cinque?» chiedi.\n«Quali altri?» dice Brandi."], "b"));
    }
    if (who === "uomini") { return [P("Non parlano. Li pagano per questo.")]; }
    return [P("Parli da sola. Ti capita, ultimamente.")];
  }

  /* ---------- argomenti: CHIEDI A <chi> DI <cosa> ----------
     Ogni voce: [chiave, etichetta, parola da comando, funzione(c, f, fai)].
     La funzione restituisce la battuta, oppure null se l'argomento ora non c'è.
     Con fai = false si limita a dire se c'è; con fai = true può anche cambiare lo stato. */
  var TOPIC = { zanon: "zanon", elia: "zanon", guardiano: "zanon", kessel: "kessel", straniero: "kessel", commerciante: "kessel",
    brandi: "brandi", capitano: "brandi", roma: "brandi", lodi: "lodi", brigadiere: "lodi", nives: "nives", ostessa: "nives",
    luce: "luce", lampi: "luce", lampo: "luce", notte: "luce", stanotte: "luce", faro: "luce",
    polsi: "polsi", fotografie: "polsi", corpo: "polsi", cadavere: "polsi", morto: "polsi",
    fotografia: "foto", foto: "foto", chiavi: "chiavi", mazzo: "chiavi", quaderno: "quaderno",
    iniziali: "bk", stufa: "bk", cifre: "bk", fratello: "fratello", barca: "barca", passaporto: "passaporto",
    foglio: "foglio", marzo: "foglio", altri: "altri", cinque: "altri", persone: "altri", nome: "nome", segnali: "segnali", segnale: "segnali" };
  var DLG = {
    nives: [
      ["zanon", "Zanon", "zanon", function (c, f) {
        if (c === 1) { return "«Elia? Veniva alle nove, beveva un bicchiere, pagava. Da tre sere no.» Gira il bicchiere. «Anche questo l'ho già detto. A quello della polizia.»"; }
        if (c === 2) { return "«Gli ho cucinato per sei anni. Mai una volta che lasciasse qualcosa nel piatto.» Lo straccio si ferma. «Uno così non scivola da un molo.»"; }
        if (c === 3) { return "«Diceva che la luce non ha padroni. Aveva torto, ma era bello sentirglielo dire.»"; }
        return f.nivesSa ? "«L'hanno messo in acqua coi polsi legati. Me l'ha detto lei.» Ti guarda. «Adesso tocca a lei dire il resto. Con la luce.»" : "«Elia avrebbe saputo cosa fare. Per questo è morto.»";
      }],
      ["kessel", "Kessel", "kessel", function (c) {
        if (c === 1) { return "Abbassa la voce, non gli occhi. «Paga in valuta e non chiede il conto. Qui si chiama un buon cliente.»"; }
        if (c === 2) { return "«Stamattina ha chiesto di lei. Se dormiva bene. Gli ho detto di sì.» Una pausa. «Ho mentito per lei, signora. Non si abitui.»"; }
        if (c === 3) { return "«Ha pagato ed è uscito. Senza aspettare il resto. Quando uno non aspetta il resto, vuol dire che torna.»"; }
        return null;
      }],
      ["luce", "la luce", "luce", function (c, f) {
        if (c === 1) { return "«Va da sola, dicono. Da tre giorni.» Guarda la finestra come si guarda un orologio fermo."; }
        if (c === 2 && f.notte) { return "«Lampi? Sarà stato il vento sui vetri.»\nStanotte il vento non c'era. Lo sapete tutte e due."; }
        return null;
      }],
      ["polsi", "i polsi", "polsi", function (c, f, fai) {
        if (!f.polsi || c > 2) { return null; }
        if (fai) { f.nivesSa = 1; }
        return "Le dici dei polsi. Nives posa il bicchiere piano, come se fosse pieno.\n«Lo sapevo», dice. «Non sapevo di saperlo.»\nPer un momento ti guarda come si guarda una persona, non una cliente.";
      }],
      ["lodi", "Lodi", "lodi", function (c) { return c === 2 || c === 3 ? "«Lodi è un uomo per bene che ha paura. Qui è quasi la stessa cosa.»" : null; }],
      ["foto", "la fotografia", "fotografia", function (c) { return c === 2 && has("foto") ? "FOTO" : null; }],
      ["quaderno", "il quaderno", "quaderno", function (c) { return c === 3 ? "«Non l'ho mai letto. Elia diceva che era meglio, per me. Aveva ragione su tutto, tranne che su sé stesso.»" : null; }],
      ["fratello", "suo fratello", "fratello", function (c) {
        if (c === 3) { return "«Ventidue anni. Faceva il tornitore, di là. Adesso fa il passeggero.»"; }
        if (c === 4) { return "«Lo vedrà da lassù. Una lanterna, più piccola delle altre.»"; }
        return null;
      }],
      ["segnali", "i segnali", "segnali", function (c) { return c === 4 ? "«Tre e uno. Lo scalo vecchio.» Lo ripete, come si ripete un indirizzo a un tassista. «Tre e uno.»" : null; }],
      ["brandi", "Brandi", "brandi", function (c) { return c === 4 ? "«Quello della cala? Elia diceva che aveva le mani pulite perché le faceva lavare agli altri.»" : null; }]
    ],
    kessel: [
      ["nome", "il tuo nome", "nome", function (c) { return c === 1 ? "«Ho letto la lista dei passeggeri. Lei era l'unica che non vendeva niente.» Sorride appena. «Mi ha incuriosito.»" : null; }],
      ["zanon", "Zanon", "zanon", function (c) {
        if (c === 1) { return "«Il guardiano? Lo conoscevo di vista. Qui tutti si conoscono di vista: è il modo locale di non conoscersi.»"; }
        if (c === 2) { return "«Mi vendeva il meteo, diciamo. Bel tempo, brutto tempo, chi arriva.» Gira una pagina. «Era un buon fornitore.»"; }
        return null;
      }],
      ["luce", "la luce", "luce", function (c, f) { return c === 2 && f.notte ? "«Due e uno», dice senza alzare gli occhi. «Anch'io soffro d'insonnia.»" : null; }],
      ["bk", "le iniziali", "iniziali", function (c, f, fai) {
        if (c !== 2 || !f.stufa) { return null; }
        if (fai) { f.kesselSa = 1; }
        return "Gli dici delle iniziali nella stufa. Kessel piega il giornale, per la prima volta.\n«K. è una lettera molto comune, nella mia lingua.» Poi, più piano: «Lei sa più di quanto le convenga, signora Corvi. Me lo ricorderò.»";
      }],
      ["nives", "Nives", "nives", function (c) { return c <= 2 ? "«Una donna che asciuga lo stesso bicchiere per un'ora sta aspettando qualcuno. Il guardiano, immagino. Anche lei, adesso, sta aspettando lui.»" : null; }],
      ["brandi", "Brandi", "brandi", function (c) {
        if (c === 2) { return "«Il suo capitano? Lo conosco dalle ricevute. Ha una bella firma. Firma molto.»"; }
        if (c === 3) { return "«Stanotte sarà alla cala. Crede di avere più uomini di me. È il suo unico difetto: sa contare solo i suoi.»"; }
        return null;
      }],
      ["quaderno", "il quaderno", "quaderno", function (c) { return c === 3 ? "«Per lei è un peso. Per me è un capitale. Per Brandi è una condanna.» Fa cadere la cenere. «Scelga lei a chi farlo pesare.»" : null; }],
      ["passaporto", "il passaporto", "passaporto", function (c) { return c === 3 ? "«Nome nuovo, città nuova. Marsiglia, le consiglio. Ci si perde bene.»" : null; }]
    ],
    lodi: [
      ["zanon", "Zanon", "zanon", function (c) {
        if (c === 2) { return "«Anni cinquantadue, celibe, nessun precedente. Beveva.» Batte il dito sul fascicolo. «Scritto così, è un uomo che cade da un molo.»"; }
        if (c === 3) { return "«Caso chiuso. Lo dica alla lampada.»"; }
        return null;
      }],
      ["polsi", "i polsi", "polsi", function (c, f, fai) {
        if (!f.polsi) { return null; }
        if (c === 4) { return f.lodiPolsi ? "«Diciannove anni di servizio», dice piano, «e stanotte me li gioco tutti.» Non ti dice come." : "«Non è il momento, signora.» Non lo è mai stato."; }
        if (f.lodiPolsi) { return "«Ci ho pensato tutta la mattina», dice senza alzare gli occhi. «Non mi è servito.»"; }
        if (fai) { f.lodiPolsi = 1; }
        return "Gli metti davanti la seconda fotografia. Lodi la guarda a lungo, poi la gira a faccia in giù.\n«Le cime del molo», dice.\nNon ci crede nemmeno lui, e adesso sa che lo sai.";
      }],
      ["chiavi", "le chiavi", "chiavi", function (c, f) { return c === 2 && f.fascicolo ? "«Agli atti.»\nQuali atti?\n«Quelli che non ci sono.» Si pente di averlo detto prima ancora di finire la frase." : null; }],
      ["kessel", "Kessel", "kessel", function (c) { return c <= 3 ? "«Il commerciante? Ha i documenti in regola. Troppo, in regola.»" : null; }],
      ["brandi", "Brandi", "brandi", function (c) {
        if (c === 4) { return "«Il capitano dà gli ordini. Io guido il camion.» Guarda il camion come si guarda una cosa che non si è scelta."; }
        return "«Roma telefona, io rispondo. Non chiedo chi c'è dall'altra parte.»";
      }],
      ["altri", "le persone", "persone", function (c, f) {
        if (c !== 4) { return null; }
        return f.lodiPolsi ? "«Cinque posti sul camion.» Una pausa. «La strada per la caserma è lunga, e piena di curve.»" : "«Il camion ha cinque posti. Non mi chieda a cosa servono.»";
      }]
    ],
    brandi: [
      ["quaderno", "il quaderno", "quaderno", function (c, f) { return f.patto ? "«Ce l'ha Kessel. Lo so, Ada. Le cose le so sempre un'ora dopo, ma le so.»" : "«Mi basta sapere dov'è. Le cose che so dove sono, sono già mie.»"; }],
      ["foglio", "il foglio", "foglio", function () { return "«È in tasca. Dopo mezzanotte sarà tuo.» Si batte il petto, piano. «È l'unica promessa che mantengo: costa poco.»"; }],
      ["zanon", "Zanon", "zanon", function () { return "«Un brav'uomo che sapeva leggere. Nel nostro mestiere sono due difetti.»"; }],
      ["altri", "gli altri", "altri", function () { return "«Ci sono sempre altri, Ada. Il trucco è non contarli.»"; }],
      ["kessel", "Kessel", "kessel", function () { return "«La terza bandiera. Si crede furbo. Domani avrà un foglio di via e tre giorni per usarlo.»"; }],
      ["lodi", "Lodi", "lodi", function (c, f) { return f.lodiPolsi ? "Brandi guarda il brigadiere un momento più del solito. «Lodi fa quello che gli si dice», dice. Lo dice a Lodi." : "«Lodi fa quello che gli si dice. È la sua dote migliore.»"; }]
    ]
  };
  var DLG_NO = { nives: "«Di questo non so niente.» E non lo dice per cortesia.", kessel: "«Non è merce che tratto.»", lodi: "«Non è di mia competenza.»", brandi: "«Non sei qui per fare domande, Ada.»" };
  var DLG_ALIAS = { nives: { barca: "fratello" }, lodi: { barca: "altri" }, brandi: { barca: "altri", polsi: "zanon" }, kessel: { barca: "quaderno" } };

  function topicList(who) {
    var L = DLG[who], out = [], i;
    if (!L || (who === "nives" && S.ch === 1 && !S.f.nivesKey)) { return []; }
    for (i = 0; i < L.length; i++) {
      if (L[i][3](S.ch, S.f, false) !== null) { out.push("[[" + L[i][1] + "|chiedi a " + who + " di " + L[i][2] + "]]"); }
    }
    if (!out.length) { return []; }
    return [NOTE("Puoi " + (who === "nives" ? "chiederle" : "chiedergli") + " di: " + out.join(" · "))];
  }
  function ask(who, key) {
    var L = DLG[who], i, s, f = S.f;
    S.moves++;
    if (!L) { return [P("Non parlano. Li pagano per questo.")]; }
    if (who === "nives" && S.ch === 1 && !f.nivesKey) { return [P("«Prima i [[documenti|mostra tesserino]].»")]; }
    if (who === "kessel" && f.offerta && key !== "quaderno" && key !== "passaporto" && key !== "brandi") { return [P("«Non ho fretta», dice Kessel. «Ne ha lei.» [[ACCETTA|accetta]] o [[RIFIUTA|rifiuta]].")]; }
    if (DLG_ALIAS[who] && DLG_ALIAS[who][key]) { key = DLG_ALIAS[who][key]; }
    if (who === "nives" && f.nivesTradita && S.ch >= 3 && key !== "fratello" && key !== "segnali") { return [P("«Chieda ai suoi amici in caserma.» Non alza gli occhi dal banco.")].concat(topicList(who)); }
    for (i = 0; i < L.length; i++) {
      if (L[i][0] !== key) { continue; }
      s = L[i][3](S.ch, f, true);
      if (s === "FOTO") { S.moves--; return give("foto", "nives"); }
      if (s !== null) { return [P(s)].concat(topicList(who)); }
    }
    return [P(DLG_NO[who])].concat(topicList(who));
  }
  function askParse(t) {
    var who = null, key = null, odd = false, i, n, list;
    n = NOUNS[t[1]];
    /* «chiedi a lodi di …» quando Lodi non c'è */
    if (t.length > 2 && n && isNpc(n) && !npcHere(n) && !(n === "kessel" && S.room === "cala" && t[1] !== "kessel")) { return { absent: true }; }
    for (i = 1; i < t.length; i++) {
      n = NOUNS[t[i]];
      /* una parola vale come persona se nomina lei, non un argomento («foglio» è un argomento) */
      if (!who && n && isNpc(n) && npcHere(n) && (!TOPIC[t[i]] || TOPIC[t[i]] === n)) { who = n; continue; }
      if (!key && TOPIC[t[i]]) { key = TOPIC[t[i]]; continue; }
      if (!TOPIC[t[i]] && !(n && isNpc(n))) { odd = true; }
    }
    if (!key && odd) { key = "?"; }
    if (who === "kessel" && S.room === "cala") { who = "uomini"; }
    if (!who) {
      list = ["nives", "kessel", "lodi", "brandi"];
      for (i = 0; i < list.length; i++) { if (npcHere(list[i]) && !(list[i] === "lodi" && npcHere("brandi"))) { who = list[i]; break; } }
      if (S.f.offerta) { who = "kessel"; }
    }
    return { who: who, key: key };
  }

  function give(item, who) {
    var c = S.ch;
    if (!has(item)) { return [P("Non ce l'hai.")]; }
    if (!who || !npcHere(who)) { return [P("A chi?")]; }
    S.moves++;
    if (item === "tesserino") {
      if (who === "nives" && c === 1 && !S.f.nivesKey) {
        S.f.nivesKey = 1; S.loc.chiave = "inv";
        return [P("Legge il tesserino più a lungo del necessario. «Servizio Fari. Allora è qui per Elia.» Posa una [[chiave]] sul banco: la sette. «Dà sul golfo. Si vede la sua luce.»\nDice «sua» come si dice di un marito.")];
      }
      if (who === "kessel") { return [P("«Bello. Li stampano bene, a Roma.»")]; }
      if (who === "lodi") { return [P("Lo guarda come si guarda una cambiale.")]; }
      return [P("L'ha già visto.")];
    }
    if (item === "foto") {
      if (who === "nives" && c === 2) { return confess(); }
      if ((who === "lodi" || who === "kessel") && c === 2) { S.f.nivesTradita = 1; }
      if (who === "lodi") { return [P("«Quella è roba sotto sigillo.» Poi capisce cosa ha appena ammesso che hai fatto, e decide di non aver visto.")]; }
      if (who === "kessel") { return [P("«La vedova senza anello. Lo sanno tutti. Lei lo scopre adesso?»")]; }
      return [P("Non la guarda nemmeno.")];
    }
    if (item === "quaderno") {
      if (who === "kessel" && S.f.offerta) { S.moves--; return resolveKessel(true); }
      if (who === "brandi") {
        S.f.datoBrandi = 1; S.loc.quaderno = "none";
        return [P("Lo sfoglia alla luce di un fiammifero, strappa l'ultima pagina e la brucia. «Brava. Adesso sali e fai il tuo mestiere.»")];
      }
      if (who === "nives") { return [P("«Lo tenga lei. A me serve la luce, non i conti.»")]; }
      return [P("Non a lui.")];
    }
    if (item === "sigarette") {
      if (who === "nives") { return [P("«Ho smesso quando è morto.» Tre giorni fa.")]; }
      if (who === "kessel") { return [P("«Nazionali. Coraggiosa.» Ne prende una lo stesso.")]; }
      if (who === "lodi") { return [P("La accetta con due dita. È la prima cosa che ti deve.")]; }
      if (who === "brandi") { return [P("«Ho smesso», dice Brandi. Non ha mai cominciato niente che potesse fargli male.")]; }
    }
    if (item === "pistola") { return [P("Meglio che resti dov'è.")]; }
    return [P("Non gli interessa.")];
  }

  /* ---------- immagini degli oggetti: si vedono ogni volta che li esamini ---------- */
  var PIC = { tesserino: "Tesserino", sigarette: "Nazionali e accendino", chiave: "La chiave della 7", gettone: "Un gettone", pistola: "Beretta 34",
    foto: "Fotografia in cornice", mazzo: "Le chiavi di Zanon", quaderno: "Il quaderno nero", telefono: "Il telefono a gettoni", banco: "La licenza",
    grappa: "Senza etichetta", giornale: "Listini di borsa", stufa: "Ghisa e lignite", stufaCenere: "Quello che non è bruciato", valigia: "La tua valigia",
    finestraRetro: "Il retro della casa", letto: "Il letto della 7", lampione: "Il lampione", acqua: "Sotto le assi", manifesto: "VOTATE",
    fascicolo: "Il fascicolo Zanon", polsi: "La seconda fotografia", armadietto: "L'armadietto", sigilli: "I sigilli", muretto: "Il muretto",
    porta: "La porta del faro", scrivania: "Sotto il piano", registro: "Il registro dei fari", leva: "Il quadro", levaM: "Il quadro, su MANUALE",
    sportello: "Lo sportello", sportelloAperto: "Lo sportello, aperto", sportelloVuoto: "Lo sportello, vuoto", macchina: "L'Aprilia di Brandi", barca: "Una lanterna al largo",
    nives: "Nives Bressan", kessel: "Kessel", lodi: "Il brigadiere Lodi", brandi: "Il capitano Brandi", uomini: "Gli uomini di Brandi" };
  function picFor(id) {
    var r = S.room, f = S.f;
    if (id === "stufa") { return r === "casa" ? "stufaCenere" : "stufa"; }
    if (id === "finestra") { return r === "strada" && f.retro ? "finestraRetro" : null; }
    if (id === "letto") { return r === "camera" ? "letto" : null; }
    if (id === "acqua") { return r === "molo" ? "acqua" : null; }
    if (id === "porta") { return r === "faro" ? "porta" : "sigilli"; }
    if (id === "polsi") { return f.fascicolo ? "polsi" : null; }
    if (id === "leva") { return f.manuale ? "levaM" : "leva"; }
    if (id === "sportello") { return !f.sportello ? "sportello" : (S.loc.quaderno === "sportello" ? "sportelloAperto" : "sportelloVuoto"); }
    if (id === "faro" || id === "lente") { return null; }
    return PIC[id] ? id : null;
  }
  function withPic(id, blocks) {
    var k = picFor(id);
    if (!k || (blocks.length && blocks[0].t === "img")) { return blocks; }
    return [IMG("o_" + k, PIC[k])].concat(blocks);
  }

  /* ---------- esame ---------- */
  function examine(id) {
    var r = S.room, c = S.ch, f = S.f;
    switch (id) {
      case "tesserino": return [P("«Servizio Fari e Segnalamenti. Corvi Ada, ispettrice.» La fotografia è del '51. Il timbro è autentico: è il resto che è discutibile.")];
      case "sigarette": return [P("Nazionali senza filtro, mezzo pacchetto. E un accendino a benzina che ha fatto la guerra meglio di te.")];
      case "chiave": return [P("Ottone, con un 7 punzonato male.")];
      case "gettone": return [P("Un gettone telefonico. Tre scanalature, una chiamata.")];
      case "pistola": return [P("Una Beretta 34. Sette colpi nel caricatore. Ne hai sparato uno solo in vita tua, nel '44, e non a chi lo meritava.")];
      case "foto": return [P("Un uomo magro e una donna davanti al faro, d'estate. Lui è Zanon. Lei ha dieci anni di meno e sorride: è la donna della locanda. Sul retro, a matita: «N. — se succede, la luce è tua.»" + (S.ch === 2 && has("foto") ? "\nN. come Nives. Potresti [[mostrargliela|mostra fotografia a nives]]." : ""))];
      case "mazzo": return [P("Quattro chiavi: una grossa, di ferro, per la porta della torre. Una chiavetta d'ottone. Due che non sai.")];
      case "quaderno": return readBook();
      case "nives": return [P("Quarant'anni scarsi, mani screpolate, occhi che hanno già fatto il tuo inventario. Ha pianto di recente e non lo rifarà davanti a te.")];
      case "kessel": return [P(f.offerta ? "Fermo sulla soglia, la busta in mano, la brace che si accende e si spegne. Sa aspettare. È il suo mestiere." : "Cappotto buono, scarpe sbagliate per questo fango, mani che non hanno mai tirato su una spugna. Legge lo stesso articolo da quando sei entrata.")];
      case "lodi": return [P("Baffi ingialliti, colletto liso, una fede troppo stretta. Non è cattivo. È peggio: è stanco.")];
      case "brandi": return [P("Cappotto di cammello, guanti, la stessa acqua di colonia del '45. Ha l'aria di chi non si è mai bagnato i piedi e non comincerà stanotte.")];
      case "uomini": return [P("Due. Giovani, larghi, annoiati. Uno ha una corda arrotolata alla cintura.")];
      case "telefono": return [P("Bachelite nera, un elenco senza copertina. Vuole un gettone." + (has("gettone") && !f.telefonato ? " Ce l'hai: [[CHIAMA ROMA|usa telefono]]." : ""))];
      case "banco": return [P("Zinco ammaccato. Sopra, la licenza: «Bressan Nives, mescita e alloggio».")];
      case "grappa": return [P(c <= 2 ? "Una bottiglia senza etichetta. Di solito è buon segno." : "Non è il momento.")];
      case "giornale": return [P("Lo tiene aperto sempre alla stessa pagina. Listini di borsa, in una lingua con troppe consonanti.")];
      case "stufa":
        if (r === "casa") { f.stufa = 1; return [P("Carta bruciata da poco. Un angolo si è salvato: una colonna di cifre e due iniziali che tornano, «B.» e «K.». Chi ha bruciato il resto aveva fretta. O voleva che questo restasse.")]; }
        return [P("Ghisa, lignite, più fumo che caldo.")];
      case "valigia":
        if (c === 1) { return [P("Due cambi, un impermeabile di scorta e, sotto la fodera," + (S.loc.pistola === "camera" ? " una [[pistola]] che un'ispettrice dei fari non dovrebbe avere." : " un vuoto a forma di pistola."))]; }
        f.valigia = 1;
        return [P("Qualcuno l'ha aperta mentre eri di sotto, ieri sera, e l'ha richiusa meglio di come la chiudi tu. Non manca niente. Era quello, il messaggio." + (S.loc.pistola === "camera" ? " La [[pistola]] è ancora sotto la fodera." : ""))];
      case "finestra":
        if (r === "camera") { return c === 1 ? [IMG("finestra", "Il golfo dalla camera 7"), P("Un lampo ogni cinque secondi, puntuale come un debito.")] : [P("Il faro, di giorno, è solo una torre. Sembra innocente.")]; }
        if (r === "strada") { return [P(f.retro ? "Accostata, col fermo saltato da fuori. Lavoro pulito, di mestiere. Basta [[scavalcare|apri finestra]]." : "Dalla strada si vedono solo imposte chiuse.")]; }
        return [P("Quella da cui sei entrata. La tenda si muove ancora.")];
      case "letto": return [P(r === "casa" ? "Aperto col coltello, da cima a fondo. Chi ha cercato qui sapeva cercare. Se non ha trovato, è perché non c'era." : "Il materasso ha conosciuto viaggiatori di commercio migliori di te.")];
      case "lampione": return [P("Illumina un metro di pioggia. Il resto del molo se lo deve immaginare.")];
      case "faro":
        if (r === "molo" && night()) { return [IMG("faro", "Punta Cieca"), P("Un lampo ogni cinque secondi. Così dice il portolano.")]; }
        return [P(night() ? "Un lampo, buio, un lampo. Da qui sembra una cosa semplice." : "Bianco e nero, a fasce. Di giorno sembra innocente.")];
      case "acqua":
        if (r === "molo") { return [P(c === 1 ? "Nera. Batte sui pali senza convinzione." : "Due metri d'acqua ferma come olio. Per annegarci bisogna impegnarsi. O essere aiutati.")]; }
        return [P("Nero su nero. Da qualche parte, lì in mezzo, sei persone guardano questa costa.")];
      case "manifesto": return [P("«VOTATE», e poi niente: il resto se l'è preso la pioggia. Sotto, un avviso sul coprifuoco, in tre lingue. In nessuna delle tre qualcuno lo rispetta.")];
      case "bandiere": return [P("Tre. Fradice tutte allo stesso modo.")];
      case "locandaext": return [P("«Al Fanale. Mescita e alloggio.» L'insegna ha perso una lettera e nessuno l'ha cercata.")];
      case "poliziaext": return [P(c === 1 || c === 4 ? "Buio." : "Una porta a vetri smerigliati e una bicicletta legata a un'inferriata.")];
      case "fascicolo":
        f.fascicolo = 1;
        return [P("Quattro fogli. Il verbale: «ebbrezza, caduta accidentale». L'inventario: portafogli, orologio fermo alle 2.10, nessun mazzo di chiavi. Un guardiano senza chiavi.\nE tre [[fotografie]] del corpo.")];
      case "polsi":
        if (!f.fascicolo) { return [P("Qui non vedi niente del genere.")]; }
        f.polsi = 1;
        return [P("Nella seconda si vedono i polsi: due solchi netti, paralleli. Lodi dirà «le cime del molo». Tu hai visto polsi così nel '44, e le cime non c'entravano.")];
      case "armadietto": return [P("Chiuso. Lodi lo copre con lo sguardo prima ancora che tu lo guardi.")];
      case "sigilli": return [P("Carta gommata e un timbro. Intatti. Chi è entrato prima di te non è passato dalla porta.")];
      case "casaext": return [P("Pietra, tegole, un orto che nessuno bagna da tre giorni.")];
      case "muretto": return [P(f.quaderno ? "Dove è crollato, la terra è battuta da molti piedi. Scende alla cala." : "Un muretto a secco, e oltre il muretto il vuoto.")];
      case "porta":
        if (r === "strada") { return examine("sigilli"); }
        return [P(f.porta ? "Aperta. Dentro, la scala a chiocciola." : "Ferro, ruggine e una serratura grande come una moneta." + (has("mazzo") ? " Nel mazzo di Zanon c'è una chiave grossa, di ferro: [[APRI|apri porta]]." : ""))];
      case "scrivania": f.tabellina = 1; return [P("Cassetti vuoti. Sotto il piano, incisa col temperino, una tabellina: 1-3, 2-1, 2-2, 3-1. Nessuna spiegazione.")];
      case "registro": f.registro = 1; return [P("Il registro ufficiale: accensione, spegnimento, vento. Calligrafia da maestro elementare. Mancano tre pagine, tagliate col rasoio: le notti del 3 ottobre, del 17 ottobre, del 2 novembre. Tutte senza luna.")];
      case "lente": return [IMG(c === 4 ? "lente4" : "lente", "La lente di Punta Cieca"), P("Anelli di vetro uno dentro l'altro, alti quanto te. Fa di una lampadina un lampo che si vede a diciotto miglia. Chi comanda questa luce comanda chi arriva.")];
      case "leva": return [P("AUTOMATICO: la lente gira e fa il suo lampo ogni cinque secondi. MANUALE: la lente si ferma, e la luce obbedisce al tasto. " + (f.manuale ? "Adesso è su MANUALE." : "Adesso è su AUTOMATICO." + (c === 4 ? " Per fare un segnale va spostata: [[MANUALE|usa leva]]." : "")))];
      case "sportello":
        if (!f.sportello) { return [P("Lamiera verniciata, una serratura piccola, da chiavetta." + (has("mazzo") ? " Come la chiavetta d'ottone del mazzo: [[APRI|apri sportello]]." : ""))]; }
        return [P(S.loc.quaderno === "sportello" ? "Dentro, avvolto in tela cerata, un [[quaderno]] nero." : "Vuoto.")];
      case "macchina": return [P("Una Aprilia nera, targa di Roma. Sul sedile dietro, una coperta. Non per il freddo.")];
      case "barca": return [P("Una lanterna, al largo, ferma. Aspetta mezzanotte come te.")];
    }
    return [P("Niente che ti serva.")];
  }

  function readBook() {
    if (!has("quaderno")) { return [P("Dovresti averlo in mano.")]; }
    S.f.quaderno = 1;
    return [P("Calligrafia da maestro elementare, anche qui.\nIn prima pagina, la chiave: «1-3 via libera, cala del Morto. 2-1 aspettate. 2-2 pericolo, tornate. 3-1 scalo vecchio: solo per i nostri.»"),
      P("Poi le notti. Accanto a ogni barca, i nomi di chi era a bordo e due colonne di cifre: «B.» paga perché arrivino, «K.» paga per sapere chi. In fondo a una pagina, sottolineato tre volte: «B. sceglie chi arriva. Gli altri li rivende.»"),
      P("L'ultima riga è per stanotte: «Mezzanotte. Sei persone. Uno è l'archivista: ha le ricevute di B.»")];
  }

  function act(verb, id, id2) {
    var r = S.room, c = S.ch, f = S.f;
    if (isNpc(id) && (verb === "esamina" || verb === "parla")) { return verb === "parla" ? talk(id) : (S.moves++, withPic(id, examine(id))); }
    switch (verb) {
      case "esamina": S.moves++; return withPic(id, examine(id));
      case "leggi":
        if (id === "quaderno") { S.moves++; return readBook(); }
        if (id === "registro" || id === "fascicolo" || id === "manifesto" || id === "giornale" || id === "polsi" || id === "tesserino" || id === "foto") { S.moves++; return withPic(id, examine(id)); }
        return [P("Non c'è niente da leggere.")];
      case "prendi":
        if (id === "grappa") {
          if (c > 2) { return [P("Non è il momento.")]; }
          S.moves++;
          if (f.grappa) { return [P(c === 1 ? "Un'altra. Scende meglio della prima, che è il problema delle seconde." : "Cicoria. Ti tiene sveglia per sfinimento.")]; }
          f.grappa = 1; S.loc.gettone = "inv";
          return [P((c === 1 ? "Una grappa che sa di ferro e di prugna." : "Un caffè di cicoria, corretto senza che tu lo chieda.") + " Paghi con un biglietto grosso. Nives ti rende il resto contandolo due volte, e tra le monete c'è un [[gettone]].")];
        }
        if (isItem(id)) {
          if (has(id)) { return [P("Ce l'hai già.")]; }
          S.loc[id] = "inv"; S.moves++;
          if (id === "pistola") { return [P("La infili nella tasca dell'impermeabile. Pesa come pesano le cose di cui speri di non aver bisogno.")]; }
          if (id === "foto") { return [P("La sfili dalla cornice. Dietro il vetro, la parete è più chiara: stava lì da anni.")]; }
          if (id === "quaderno") { return [P("Nero, con l'elastico. Più leggero di quello che contiene. Lo apri lì, in piedi, sotto la lente.")].concat(readBook()); }
          return [P("Preso.")];
        }
        if (id === "fascicolo" || id === "polsi") { return [P("«Quello resta sul tavolo», dice Lodi.")]; }
        if (id === "registro") { return [P("Pesa, è timbrato, e non dice niente. Resta qui.")]; }
        return [P("Non è roba da portarsi via.")];
      case "lascia": return [P("Meglio tenerselo.")];
      case "apri":
        if (id === "porta" && r === "faro") {
          if (f.porta) { return [P("È già aperta.")]; }
          if (!has("mazzo")) { return [P("Chiusa. Le chiavi sono «agli atti», dice Lodi.")]; }
          f.porta = 1; S.moves++;
          return [P("La chiave grossa gira al secondo tentativo. Dentro, odore di olio e di ferro, e una scala a chiocciola: [[su]].")];
        }
        if (id === "sportello") {
          if (f.sportello) { return [P("È già aperto.")]; }
          if (!has("mazzo")) { return [P("Chiuso. Vuole una chiavetta.")]; }
          f.sportello = 1; S.loc.quaderno = "sportello"; S.moves++;
          return [IMG("m_quaderno", "Dove la luce non guarda"), P("La chiavetta d'ottone entra al primo colpo. Dentro, avvolto in tela cerata, un [[quaderno]] nero.")];
        }
        if (id === "finestra" && r === "strada" && f.retro && !f.finestra) { return go("est"); }
        if (id === "valigia") { S.moves++; return examine("valigia"); }
        if (id === "armadietto") { return [P("«Signora», dice Lodi. Una parola sola.")]; }
        if (id === "porta" || id === "sigilli") { return [P("Rompere un sigillo è un reato, e soprattutto si vede. Meglio guardare sul retro.")]; }
        if (id === "quaderno") { S.moves++; return readBook(); }
        return [P("Non si apre.")];
      case "chiudi": return [P("Non serve.")];
      case "usa":
        if (isItem(id) && !has(id)) { return [P("Dovresti averlo in mano.")]; }
        if (id === "telefono" || id === "gettone") {
          if (r !== "locanda") { return [P("Qui non c'è nessun telefono.")]; }
          if (c !== 1) { return [P(c === 4 ? "A quest'ora Roma dorme. Quello che decide è qui." : "Brandi ha detto di non richiamare. Chiama lui.")]; }
          if (f.telefonato) { return [P("Hai già chiamato. Brandi non è uomo da due telefonate.")]; }
          if (!has("gettone")) { return [P("Il telefono vuole un gettone. Tu hai biglietti di banca e nessuna moneta. Al banco, con una [[grappa]], qualche moneta salta fuori.")]; }
          f.telefonato = 1; S.loc.gettone = "none"; S.moves++;
          return [IMG("m_telefono", "Tre squilli a Roma"), P("Il gettone scende. Tre squilli a Roma, poi la voce di Brandi, sveglia come sempre.\n«Sei arrivata. Bene. Zanon segnalava a qualcuno, di notte, cambiando il ritmo della lampada. Teneva i conti in un quaderno. Lo voglio io. Non una copia.»\n«E chi l'ha ammazzato?»\n«È annegato, Ada. Leggi i rapporti.» Una pausa. «Fai la brava. Ho riletto il tuo foglio del '44, ieri. Scrivevi bene.»\nRiattacca lui."),
            NOTE("Kessel non ha girato pagina per tutta la telefonata.")];
        }
        if (id === "mazzo") { return r === "faro" ? act("apri", "porta") : (r === "lanterna" ? act("apri", "sportello") : [P("Qui non c'è niente che queste chiavi aprano.")]); }
        if (id === "chiave") { return r === "locanda" ? go("su") : [P("È la chiave della sette. Serve alla sette.")]; }
        if (id === "sigarette") { return [P(["Ne accendi una e la fumi a metà. È il tuo modo di pensare.", "Un'altra. Il fumo va dritto verso l'alto: non c'è più vento. Brutto segno.", "L'ultima buona. Le altre sono per dopo, qualunque cosa sia dopo."][S.moves % 3])]; }
        if (id === "pistola") {
          if (npcHere("brandi")) { return [P("Brandi guarda la pistola, poi te. «L'ultima volta ti è costata nove persone.» Ha ragione, ed è la cosa peggiore di lui. La rimetti in tasca.")]; }
          if (f.offerta) { return [P("Kessel sorride appena. «Poi dovrebbe spiegarlo a troppa gente.»")]; }
          return [P("Non è quel tipo di serata. Non ancora.")];
        }
        if (id === "tesserino") { return give("tesserino", npcHere("nives") ? "nives" : (npcHere("lodi") ? "lodi" : null)); }
        if (id === "foto") { return give("foto", npcHere("nives") ? "nives" : (npcHere("lodi") ? "lodi" : null)); }
        if (id === "quaderno") { S.moves++; return readBook(); }
        if (id === "leva") {
          if (c !== 4) { return [P("Non ancora. Se tocchi quella leva, qualcuno in mare capisce qualcosa. Prima devi sapere cosa.")]; }
          if (f.manuale) { return [P("È già su MANUALE. Adesso serve un segnale: [[1-3|segnala 1-3]], [[2-1|segnala 2-1]], [[2-2|segnala 2-2]], [[3-1|segnala 3-1]].")]; }
          f.manuale = 1; S.moves++;
          return [P("Sposti la leva su MANUALE. La lente si ferma con un sospiro. Adesso la luce è il tasto, e il tasto sei tu.\nMancano due minuti. [[1-3|segnala 1-3]] via libera. [[2-1|segnala 2-1]] aspettate. [[2-2|segnala 2-2]] tornate. [[3-1|segnala 3-1]] scalo vecchio.")];
        }
        if (id === "sportello" || id === "porta" || id === "finestra" || id === "valigia") { return act("apri", id); }
        if (id === "grappa") { return act("prendi", "grappa"); }
        if (id === "letto") { return sleep(); }
        return [P("Non sai bene come.")];
      case "dai":
        if ((id === "polsi" && id2 === "lodi") || (id === "lodi" && id2 === "polsi")) { return ask("lodi", "polsi"); }
        if (isNpc(id) && id2 && isItem(id2)) { return give(id2, id); }
        if (isItem(id)) {
          if (id2 && isNpc(id2)) { return give(id, id2); }
          if (id === "quaderno") { return give(id, npcHere("kessel") ? "kessel" : (npcHere("brandi") ? "brandi" : (npcHere("nives") ? "nives" : null))); }
          return give(id, npcHere("nives") ? "nives" : (npcHere("lodi") && !npcHere("brandi") ? "lodi" : (npcHere("brandi") ? "brandi" : (npcHere("kessel") ? "kessel" : null))));
        }
        return [P("Cosa, e a chi?")];
      case "parla": return [P("Non risponde. Le cose, qui, sono più discrete delle persone.")];
    }
    return [P("Non succede niente.")];
  }

  /* ---------- indizi: tre gradi, dal vago alla soluzione ---------- */
  function hintFor() {
    var c = S.ch, f = S.f, r = S.room;
    if (S.end) { return ["fine", "La storia è finita. Ce ne sono altre quattro, almeno.", "Prima della mezzanotte, alla lanterna, i segnali erano quattro. E Kessel si poteva ascoltare oppure no.", "[[RICOMINCIA|ricomincia]], oppure CARICA un codice salvato prima della scelta."]; }
    if (c === 1) {
      if (!f.nivesKey) {
        if (!S.visited.locanda) { return ["c1a", "Piove, è notte, e ti serve un letto.", "In piazza, a est, c'è una locanda con le finestre accese.", r === "piazza" ? "Dalla piazza: [[EST|est]]." : "Dal molo vai a [[NORD|nord]], poi a [[EST|est]]."]; }
        return ["c1b", "Una camera non si ottiene con un sorriso.", "La donna al banco vuole sapere chi sei. Hai un tesserino.", "Alla locanda: [[MOSTRA TESSERINO|mostra tesserino a nives]]."];
      }
      if (!f.telefonato && !has("gettone")) { return ["c1c", "Roma aspetta tue notizie, stasera.", "Il telefono della locanda vuole un gettone, e i gettoni stanno nel resto.", "Al banco: [[PRENDI GRAPPA|prendi grappa]]. Nel resto c'è un gettone."]; }
      if (!f.telefonato) { return ["c1d", "Hai un gettone, e Brandi non ama aspettare.", "Il telefono è alla locanda, vicino alla scala.", "Alla locanda: [[USA TELEFONO|usa telefono]]."]; }
      return ["c1e", "Per stasera hai fatto abbastanza.", "La camera 7 è di sopra, e hai la chiave.", "Alla locanda vai [[SU|su]], poi [[DORMI|dormi]]."];
    }
    if (c === 2) {
      if (has("foto")) { return ["c2c", "Quella fotografia ha una dedica. «N.»", "In paese c'è una sola donna che comincia per N.", "Alla locanda: [[MOSTRA FOTOGRAFIA A NIVES|mostra fotografia a nives]]."]; }
      if (!S.visited.casa) {
        if (f.retro) { return ["c2b", "Chi è entrato prima di te non è passato dalla porta.", "Sul retro della casa c'è una finestra col fermo saltato.", "Sul sentiero: [[APRI FINESTRA|apri finestra]], oppure [[EST|est]]."]; }
        return ["c2a", "Zanon abitava da qualche parte. Le case dei morti parlano.", "La casa del guardiano è sul sentiero del faro, a nord della piazza. La porta ha i sigilli.", r === "strada" ? "Dal sentiero: [[EST|est]]. Giri intorno alla casa." : "Dalla piazza [[NORD|nord]], poi [[EST|est]]: giri intorno alla casa."];
      }
      return ["c2d", "Nella casa di Zanon hanno cercato, ma non hanno preso tutto.", "Alla parete, storta, c'è una fotografia in cornice.", "Nella casa: [[PRENDI FOTOGRAFIA|prendi fotografia]]."];
    }
    if (c === 3) {
      if (f.offerta) { return ["c3e", "Kessel aspetta una risposta.", "Puoi dargli il quaderno in cambio di un passaporto, oppure tenerlo.", "[[ACCETTA|accetta]] oppure [[RIFIUTA|rifiuta]]. Tutte e due le strade vanno avanti."]; }
      if (!f.porta) { return ["c3a", "Nives ti ha dato le chiavi di Zanon.", "La chiave grossa, di ferro, è per la porta della torre.", "Dal sentiero [[NORD|nord]], poi [[APRI PORTA|apri porta]]."]; }
      if (!f.sportello) { return ["c3b", "Il quaderno è sotto la lente, «dove la luce non guarda».", "Nel basamento della lente, in cima al faro, c'è uno sportello. Hai una chiavetta d'ottone.", "Alla lanterna: [[APRI SPORTELLO|apri sportello]]."]; }
      if (!has("quaderno")) { return ["c3c", "Lo sportello è aperto.", "Dentro c'è il quaderno, avvolto nella tela cerata.", "[[PRENDI QUADERNO|prendi quaderno]]."]; }
      return ["c3d", "Hai quello che cercavano tutti. Adesso bisogna uscire.", "Si esce da dove si è entrati: giù per la scala.", "Dalla lanterna: [[GIÙ|giu]]."];
    }
    if (!f.manuale) {
      if (r !== "lanterna") { return ["c4a", "A mezzanotte si decide con la luce.", "Il segnale si fa dalla sala della lanterna, in cima al faro. Prima, se vuoi, alla cala c'è Brandi e alla locanda c'è Nives.", "Sentiero, [[NORD|nord]] fino al faro, poi [[SU|su]]."]; }
      return ["c4b", "La lente gira da sola, e da sola non dice niente.", "Sul quadro c'è una leva: AUTOMATICO o MANUALE.", "[[USA LEVA|usa leva]]."];
    }
    return ["c4c", "Adesso la luce sei tu. Ma cosa vuoi dire?", "Il quaderno di Zanon dà il significato dei quattro segnali: lo trovi anche nella SCHEDA.", "[[1-3|segnala 1-3]], [[2-1|segnala 2-1]], [[2-2|segnala 2-2]] o [[3-1|segnala 3-1]]. Ognuno è un finale diverso."];
  }
  function hint() {
    var h = hintFor();
    if (S.h.k !== h[0]) { S.h.k = h[0]; S.h.n = 0; }
    var n = S.h.n;
    if (S.h.n < 2) { S.h.n++; }
    return [NOTE("Indizio " + (n + 1) + " di 3"), P(h[n + 1])].concat(n < 2 ? [NOTE("Se non basta: [[ANCORA|indizio]].")] : []);
  }

  var HELP = "COMANDI\nMuoversi: NORD, SUD, EST, OVEST, SU, GIÙ (anche N, S, E, O)\nGuardare: GUARDA, ESAMINA cosa, LEGGI cosa\nAgire: PRENDI, APRI, USA cosa. PARLA con chi. DAI o MOSTRA cosa a chi. CHIEDI A chi DI cosa\nNel momento giusto: DORMI, ACCETTA, RIFIUTA, SEGNALA 1-3\nLibro: SCHEDA, MAPPA, INVENTARIO, PROLOGO\nBloccata? [[INDIZIO|indizio]], anche più volte. FINALI dice quali hai trovato\nPartita: SALVA ti dà un codice, CARICA codice lo riprende, RICOMINCIA CAPITOLO, RICOMINCIA. STORIE torna all'elenco delle storie";

  function exec(input) {
    var m = /^\s*carica\b\s*(.*)$/i.exec(String(input));
    if (m) { return loadCode(m[1]); }
    var s = norm(input);
    if (!s) { return [P("Come?")]; }
    var t = tokens(s), w = t[0], verb, ids = [], id, i, n, digits = "";

    verb = VERBS[w];
    if (S.end && !(verb === "aiuto" || verb === "indizio" || verb === "finali" || verb === "mappa" || verb === "scheda" || verb === "prologo" || verb === "ricomincia" || verb === "salva" || verb === "storie")) {
      return [P("La storia è finita. RICOMINCIA, oppure CARICA un codice.")];
    }
    if (DIRS[w] && t.length === 1) { return done(go(DIRS[w])); }
    if (!verb) {
      if (NOUNS[w]) { verb = isNpc(NOUNS[w]) ? "parla" : "esamina"; t.unshift(verb); }
      else { return [P("Non conosco il verbo «" + w + "». Scrivi AIUTO per l'elenco dei comandi.")]; }
    }

    if (verb === "aiuto") { return [P(HELP)]; }
    if (verb === "indizio") { return hint(); }
    if (verb === "finali") { return [P(endsNote())]; }
    if (verb === "storie") { save(); return [{ t: "home" }]; }
    if (verb === "mappa") { return mapBlock(); }
    if (verb === "scheda") { return sheet(); }
    if (verb === "prologo") { return [{ t: "prologue" }]; }
    if (verb === "salva") { save(); return [P("Il codice di questa partita:"), { t: "code", s: encode() }, NOTE("Scrivilo da qualche parte. Per riprendere, anche su un altro dispositivo: CARICA e il codice. Su questo dispositivo la partita si salva comunque da sola a ogni mossa.")]; }
    if (verb === "ricomincia" && t[1] === "capitolo") { return restartChapter(); }
    if (verb === "ricomincia") { S = fresh(); save(); markChapter(); return [{ t: "restart" }]; }
    if (verb === "aspetta") { S.moves++; return done([P(night() ? "Aspetti. La luce passa, e ripassa. Non è lei che deve decidere." : "Aspetti. Il porto fa finta di non guardarti.")]); }
    if (verb === "inventario") {
      var inv = inventory(), names = [];
      for (i = 0; i < inv.length; i++) { names.push(inv[i].label); }
      return [P(names.length ? "Hai con te: " + names.join(", ") + "." : "Non hai niente con te.")];
    }
    if (verb === "dormi") { return done(sleep()); }
    if (verb === "accetta" || verb === "rifiuta") {
      if (!S.f.offerta) { return [P("Nessuno ti ha chiesto niente. Per ora.")]; }
      return done(resolveKessel(verb === "accetta"));
    }
    if (verb === "segnala") {
      for (i = 1; i < t.length; i++) { digits += t[i].replace(/[^0-9]/g, ""); }
      return done(signal(digits));
    }
    if (verb === "vai" || verb === "entra" || verb === "esci") {
      for (i = 1; i < t.length; i++) { if (DIRS[t[i]]) { return done(go(DIRS[t[i]])); } }
      if (verb === "entra" && S.room === "strada") { return done(go("est")); }
      if (verb === "entra" && S.room === "faro") { return done(go("su")); }
      if (verb === "entra" && S.room === "piazza") { return done(go("est")); }
      if (verb === "esci") {
        n = { locanda: "ovest", camera: "giu", caserma: "est", casa: "ovest", lanterna: "giu", faro: "sud", cala: "su" }[S.room];
        if (n) { return done(go(n)); }
      }
      return [P("In che direzione? NORD, SUD, EST, OVEST, SU o GIÙ.")];
    }
    if (verb === "chiedi" || verb === "parla") {
      var q = askParse(t);
      if (verb === "chiedi" || (q.who && q.key)) {
        if (q.absent) { return [P("Non è qui.")]; }
        if (!q.who) { return [P("Non c'è nessuno a cui chiederlo.")]; }
        if (!q.key || q.who === "uomini") { return done(talk(q.who)); }
        return done(ask(q.who, q.key));
      }
    }
    if (verb === "guarda" && t.length === 1) { S.moves++; return done(describe(true)); }
    if (verb === "guarda") { verb = "esamina"; }

    for (i = 1; i < t.length; i++) { n = NOUNS[t[i]]; if (n && ids.length < 2 && n !== ids[0]) { ids.push(n); } }
    if (!ids.length && t.length > 1 && DIRS[t[1]]) { return done(go(DIRS[t[1]])); }
    if (!ids.length) {
      if (verb === "parla") {
        n = ["nives", "kessel", "lodi", "brandi"];
        if (S.f.offerta) { return done(talk("kessel")); }
        for (i = 0; i < n.length; i++) { if (npcHere(n[i]) && !(n[i] === "lodi" && npcHere("brandi"))) { return done(talk(n[i])); } }
        return done(talk(null));
      }
      return [P(t.length > 1 ? "Non so cosa sia «" + t[1] + "»." : "Cosa, di preciso?")];
    }
    id = ids[0];
    if (id === "foto" && S.room === "caserma" && !has("foto")) { id = "polsi"; }
    if (id === "kessel" && S.room === "cala") { id = "uomini"; }
    if (id === "mappa") { return mapBlock(); }
    if (id === "scheda") { return sheet(); }
    if (!present(id)) { return [P(isNpc(id) ? "Non è qui." : "Qui non vedi niente del genere.")]; }
    if (ids[1] && !present(ids[1])) { ids[1] = null; }
    if (verb === "apri" && ids[1] === "mazzo") { verb = "apri"; }
    return done(act(verb, id, ids[1]));
  }

  function inventory() {
    var out = [], i, id, lab = { tesserino: "tesserino", sigarette: "sigarette", chiave: "chiave della 7", gettone: "gettone", pistola: "pistola", foto: "fotografia", mazzo: "mazzo di chiavi", quaderno: "quaderno" };
    for (i = 0; i < ITEMS.length; i++) { id = ITEMS[i]; if (has(id)) { out.push({ word: id === "foto" ? "fotografia" : id, label: lab[id] }); } }
    return out;
  }

  /* ---------- salvataggio: automatico nel browser, e a codice ---------- */
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var LOCS = ["none", "inv", "sportello"].concat(ROOMS);
  function idx(arr, v) { for (var i = 0; i < arr.length; i++) { if (arr[i] === v) { return i; } } return 0; }
  function encode() {
    var bits = [], i, out = "", sum = 0, v;
    function put(val, n) { for (var k = n - 1; k >= 0; k--) { bits.push((val >> k) & 1); } }
    put(1, 3); put(S.ch, 3); put(idx(ROOMS, S.room), 4); put(Math.min(S.moves, 1023), 10); put(S.end, 3);
    for (i = 0; i < ROOMS.length; i++) { put(S.visited[ROOMS[i]] ? 1 : 0, 1); }
    for (i = 0; i < FLAGS.length; i++) { put(S.f[FLAGS[i]] ? 1 : 0, 1); }
    for (i = 0; i < ITEMS.length; i++) { put(idx(LOCS, S.loc[ITEMS[i]]), 4); }
    put(S.t.n, 2); put(S.t.k, 2); put(S.t.l, 2); put(S.t.b, 2);
    for (i = 0; i < FLAGS_B.length; i++) { put(S.f[FLAGS_B[i]] ? 1 : 0, 1); }
    while (bits.length % 5) { bits.push(0); }
    for (i = 0; i < bits.length; i += 5) {
      v = bits[i] * 16 + bits[i + 1] * 8 + bits[i + 2] * 4 + bits[i + 3] * 2 + bits[i + 4];
      sum = (sum * 7 + v + 3) % 32; out += ALPHA.charAt(v);
    }
    out += ALPHA.charAt(sum);
    return out.replace(/(.{4})(?=.)/g, "$1-");
  }
  function decode(code) {
    var s = String(code).toUpperCase().replace(/[^A-Z0-9]/g, ""), bits = [], i, v, sum = 0, p = 0, o;
    function get(n) { var val = 0; for (var k = 0; k < n; k++) { val = val * 2 + (bits[p++] || 0); } return val; }
    if (s.length < 10) { return null; }
    for (i = 0; i < s.length - 1; i++) {
      v = ALPHA.indexOf(s.charAt(i)); if (v < 0) { return null; }
      sum = (sum * 7 + v + 3) % 32;
      bits.push((v >> 4) & 1, (v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1);
    }
    if (ALPHA.charAt(sum) !== s.charAt(s.length - 1)) { return null; }
    if (get(3) !== 1) { return null; }
    o = fresh(); o.visited = {};
    o.ch = get(3); o.room = ROOMS[get(4)]; o.moves = get(10); o.end = get(3);
    if (o.ch < 1 || o.ch > 4 || !o.room || o.end > 4) { return null; }
    for (i = 0; i < ROOMS.length; i++) { if (get(1)) { o.visited[ROOMS[i]] = 1; } }
    for (i = 0; i < FLAGS.length; i++) { if (get(1)) { o.f[FLAGS[i]] = 1; } }
    for (i = 0; i < ITEMS.length; i++) { v = LOCS[get(4)]; if (!v) { return null; } o.loc[ITEMS[i]] = v; }
    o.t.n = get(2); o.t.k = get(2); o.t.l = get(2); o.t.b = get(2);
    for (i = 0; i < FLAGS_B.length; i++) { if (get(1)) { o.f[FLAGS_B[i]] = 1; } }
    o.visited[o.room] = 1;
    return o;
  }
  function loadCode(code) {
    if (!code || !/\S/.test(code)) { return [P("CARICA e poi il codice, per esempio: CARICA ABCD-EFGH-…")]; }
    var o = decode(code);
    if (!o) { return [P("Quel codice non torna. Controlla le lettere: non ci sono O, I, 0 né 1.")]; }
    S = o; save();
    if (!chapterStart() || chapterStart().ch !== S.ch) { markChapter(); }
    return [NOTE("Partita ripresa dal codice. " + CH_NAME[S.ch] + ": «" + CH_TITLE[S.ch] + "».")].concat(S.end ? [P("Questa storia è già finita. RICOMINCIA per ripartire.")] : describe(true));
  }

  function done(blocks) { save(); return blocks; }
  function save() { try { localStorage.setItem(SAVE_KEY, encode()); } catch (e) { /* senza memoria locale resta il codice */ } }
  function start(forceNew) {
    var saved = null;
    if (!forceNew) { try { saved = decode(localStorage.getItem(SAVE_KEY) || ""); } catch (e) { saved = null; } }
    if (saved && saved.moves > 0) {
      S = saved;
      return { resumed: true, blocks: [NOTE("Partita ripresa: " + CH_NAME[S.ch] + ", «" + CH_TITLE[S.ch] + "». PROLOGO per rileggere l'inizio, RICOMINCIA per ripartire da capo.")].concat(S.end ? [P("Questa storia è già finita. RICOMINCIA per ripartire.")] : describe(true)) };
    }
    S = fresh(); markChapter(); if (forceNew) { save(); }
    return { resumed: false, blocks: [CHAP(1)].concat(describe(true)).concat([NOTE("Scrivi un comando, oppure tocca un'azione e poi una parola sottolineata. SCHEDA ti dice chi sei e cosa sai; SALVA ti dà un codice.")]) };
  }

  return {
    title: "Via Libera",
    start: start, exec: exec, prologue: prologue, inventory: inventory,
    look: function () { return describe(false); },
    exits: function () {
      var out = [], i, d;
      if (S.end) { return out; }
      for (i = 0; i < DIR_ORDER.length; i++) {
        d = DIR_ORDER[i];
        if (!EXITS[S.room][d]) { continue; }
        if (S.room === "strada" && d === "giu" && !S.f.quaderno) { continue; }
        if (S.room === "locanda" && d === "su" && S.ch === 4) { continue; }
        out.push(d);
      }
      return out;
    },
    status: function () { return { room: ROOM_NAME[S.room], moves: S.moves, ch: S.ch, end: S.end }; },
    isDir: function (w) { return !!DIRS[norm(w)]; }
  };
})();
