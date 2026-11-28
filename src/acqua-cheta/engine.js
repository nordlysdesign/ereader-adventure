/* ==================================================================
   ACQUA CHETA: motore di gioco. Seconda storia di Ada Corvi.
   Stessa forma di via-libera/engine.js: non tocca il DOM, riceve una
   stringa e restituisce una lista di blocchi.
   ================================================================== */
var PC = (function () {
  var SAVE_KEY = "acquacheta.v1";
  var S;

  var ROOMS = ["corriera", "piazza", "albergo", "camera", "chiesa", "strada", "direzione", "baracca", "diga", "cunicolo", "centralino"];
  var ROOM_NAME = { corriera: "Fermata della corriera", piazza: "Piazza della Pieve", albergo: "Albergo «Alla Posta»", camera: "Camera 3", chiesa: "La Pieve, cappella laterale",
    strada: "Strada del lago", direzione: "Direzione lavori S.I.M.A.", baracca: "Baracca del geologo", diga: "Coronamento della diga", cunicolo: "Cunicolo d'ispezione n. 2", centralino: "Il centralino" };
  var EXITS = {
    corriera: { nord: "piazza" },
    piazza: { nord: "strada", sud: "corriera", est: "albergo", ovest: "chiesa" },
    albergo: { ovest: "piazza", su: "camera", est: "centralino" },
    camera: { giu: "albergo" },
    chiesa: { est: "piazza" },
    strada: { nord: "diga", sud: "piazza", est: "direzione", su: "baracca" },
    direzione: { ovest: "strada" },
    baracca: { giu: "strada" },
    diga: { sud: "strada", giu: "cunicolo" },
    cunicolo: { su: "diga" },
    centralino: { ovest: "albergo" }
  };
  var DIR_ORDER = ["nord", "sud", "est", "ovest", "su", "giu"];
  var ITEMS = ["lettera", "sigarette", "chiave", "chiavetta", "occhiali", "chiavi", "lampada", "relazione"];
  var FLAGS = ["olgaKey", "prenotata", "cena", "telefonato", "notte", "biglietto", "mani", "fascicolo", "martaKey", "lucchetto", "sismo", "lavagna", "cassetto",
    "bepi", "portello", "pendolo", "tubo", "relazione", "offerta", "patto", "cuffia", "olga4", "scarichi", "quota", "parapetto", "v1", "b1", "mo1",
    "morandinSa", "olgaSa", "vescoviSa"];
  /* i flag nuovi vanno qui in fondo: stanno in coda al codice di salvataggio, così i codici vecchi restano validi */
  var FLAGS_B = [];
  var CH_NAME = ["", "Capitolo primo", "Capitolo secondo", "Capitolo terzo", "Capitolo quarto"];
  var CH_TITLE = ["", "Neve vecchia", "Le mani pulite", "Dove la montagna scrive", "Quota 715"];

  function fresh() {
    return { ch: 1, room: "corriera", moves: 0, visited: { corriera: 1 }, end: 0, f: {}, t: { o: 0, v: 0, m: 0, b: 0, g: 0 }, h: { k: "", n: 0 },
      loc: { lettera: "inv", sigarette: "inv", chiave: "none", chiavetta: "none", occhiali: "baracca", chiavi: "none", lampada: "none", relazione: "none" } };
  }

  /* ---------- parser ---------- */
  var STOP = " il lo la i gli le l un uno una del dello della dei degli delle dell al allo alla ai agli alle all nel nello nella nell sul sullo sulla sull con col di da dal dalla per verso a ad in mio mia ";
  var DIRS = { nord: "nord", n: "nord", sud: "sud", s: "sud", est: "est", e: "est", ovest: "ovest", o: "ovest", w: "ovest",
    su: "su", sali: "su", salgo: "su", alto: "su", giu: "giu", scendi: "giu", scendo: "giu", basso: "giu" };
  var VERBS = {
    guarda: "guarda", g: "guarda", l: "guarda", osserva: "guarda",
    esamina: "esamina", x: "esamina", ispeziona: "esamina", controlla: "esamina", studia: "esamina", cerca: "esamina", fruga: "esamina",
    leggi: "leggi", sfoglia: "leggi",
    prendi: "prendi", raccogli: "prendi", piglia: "prendi", afferra: "prendi", ordina: "prendi", bevi: "prendi", mangia: "prendi",
    lascia: "lascia", posa: "lascia",
    inventario: "inventario", inv: "inventario", i: "inventario", borsa: "inventario", tasche: "inventario",
    apri: "apri", forza: "apri", stappa: "apri", chiudi: "chiudi",
    usa: "usa", utilizza: "usa", gira: "usa", sposta: "usa", tira: "usa", premi: "usa", accendi: "usa", fuma: "usa", metti: "usa", indossa: "usa", siediti: "usa", siedi: "usa",
    dai: "dai", mostra: "dai", offri: "dai", porgi: "dai", consegna: "dai",
    parla: "parla", saluta: "parla", interroga: "parla", rispondi: "parla", chiedi: "chiedi", domanda: "chiedi", chiedile: "chiedi", chiedigli: "chiedi",
    dormi: "dormi", riposa: "dormi",
    chiama: "chiama", telefona: "chiama", collega: "chiama", infila: "chiama",
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
    lettera: "lettera", incarico: "lettera", documenti: "lettera", documento: "lettera",
    sigarette: "sigarette", sigaretta: "sigarette", nazionali: "sigarette", accendino: "sigarette",
    chiave: "chiave", chiavetta: "chiavetta", busta: "chiavetta", occhiali: "occhiali", custodia: "occhiali",
    chiavi: "chiavi", anello: "chiavi", mazzo: "chiavi", lampada: "lampada", carburo: "lampada",
    relazione: "relazione", fogli: "relazione", rapporto: "relazione",
    olga: "olga", padrona: "olga", ostessa: "olga", centralinista: "olga", telefonista: "olga",
    vescovi: "vescovi", giovanotto: "vescovi", giornalista: "vescovi", cronista: "vescovi", gino: "vescovi",
    marta: "marta", vedova: "marta",
    bepi: "bepi", guardiano: "bepi", tormen: "bepi", vecchio: "bepi",
    morandin: "morandin", ingegnere: "morandin", direttore: "morandin", ingegner: "morandin",
    commissione: "commissione", signori: "commissione", collaudatori: "commissione", avvocato: "avvocato",
    telefono: "telefono", cabina: "telefono", banco: "banco", licenza: "banco", minestra: "minestra", pentola: "minestra", orzo: "minestra", caffe: "minestra",
    macchina: "macchina", olivetti: "macchina", stufa: "stufa", biglietto: "biglietto",
    valigia: "valigia", finestra: "finestra", letto: "letto", piumino: "letto",
    orario: "orario", palina: "orario", tabella: "orario", fontana: "fontana", ghiaccio: "fontana", avviso: "avviso", manifesto: "avviso",
    campanile: "campanile", campana: "campanile", campane: "campanile", chiesa: "chiesaext", pieve: "chiesaext", albergo: "albergoext", insegna: "albergoext",
    corpo: "corpo", malan: "corpo", morto: "corpo", cadavere: "corpo", feretro: "corpo", lenzuolo: "corpo", ettore: "corpo", mani: "mani", palme: "mani", unghie: "mani", ceri: "ceri", candele: "ceri",
    fascicolo: "fascicolo", verbale: "fascicolo", plastico: "plastico", modello: "plastico", fotografia: "fotografia", foto: "fotografia",
    lago: "lago", acqua: "lago", invaso: "lago", marcia: "marcia", montagna: "marcia", versante: "marcia", crepa: "marcia",
    villetta: "villa", villa: "villa", direzione: "villa", baracca: "baraccaext", sentiero: "baraccaext", lucchetto: "lucchetto", catenaccio: "lucchetto",
    cassetto: "scrivania", scrivania: "scrivania", tavolo: "scrivania", sismografo: "sismografo", rullo: "sismografo", tracciato: "sismografo", tamburo: "sismografo",
    lavagna: "lavagna", numeri: "lavagna", calendario: "calendario", carte: "carte",
    parapetto: "parapetto", coronamento: "parapetto", gola: "parapetto", casello: "casello", ronda: "orologio",
    asta: "idrometro", idrometro: "idrometro", quota: "idrometro", segno: "idrometro", scarichi: "scarichi", volantini: "scarichi", volantino: "scarichi",
    portello: "portello", automobile: "auto", auto: "auto",
    pendolo: "pendolo", cassetta: "pendolo", filo: "pendolo", spie: "spie", vetrini: "spie", vetrino: "spie", crepe: "spie", tubo: "tubo",
    quadro: "quadro", spine: "quadro", spina: "quadro", centralino: "quadro", targhette: "quadro", cuffia: "cuffia", pendola: "pendola",
    diga: "digaext", neve: "neve", corriera: "bus",
    mappa: "mappa", scheda: "scheda"
  };
  /* parole che cambiano significato da una stanza all'altra */
  function noun(w) {
    var r = S.room;
    if (w === "donna" || w === "signora") { return r === "chiesa" ? "marta" : "olga"; }
    if (w === "uomo") { return r === "albergo" ? "vescovi" : (r === "direzione" || S.f.offerta ? "morandin" : "bepi"); }
    if (w === "orologio") { return r === "centralino" ? "pendola" : "orologio"; }
    if (w === "porta") { return r === "diga" ? "portello" : (r === "strada" ? "lucchetto" : (r === "albergo" ? "telefono" : null)); }
    if (w === "telefono" && r === "centralino") { return "quadro"; }
    if (w === "chiave" && !has("chiave") && has("chiavetta")) { return "chiavetta"; }
    if (w === "scrivania" && r === "direzione") { return "fascicolo"; }
    if (w === "diga" && r === "diga") { return "parapetto"; }
    return NOUNS[w];
  }

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
    var r = S.room, c = S.ch, f = S.f;
    if (who === "olga") { return r === "albergo" || r === "centralino"; }
    if (who === "vescovi") { return r === "albergo"; }
    if (who === "marta") { return r === "chiesa" && c >= 2; }
    if (who === "bepi") { return r === "diga" && c >= 2 && !f.offerta; }
    if (who === "morandin") { return (r === "direzione" && (c === 2 || c === 3)) || (r === "diga" && (f.offerta || c === 4)); }
    if (who === "commissione") { return r === "diga" && c === 4; }
    return false;
  }
  var NPCS = ["olga", "marta", "bepi", "morandin", "vescovi"];
  function isNpc(id) { return id === "olga" || id === "vescovi" || id === "marta" || id === "bepi" || id === "morandin" || id === "commissione"; }
  function firstNpc() {
    if (S.f.offerta) { return "morandin"; }
    for (var i = 0; i < NPCS.length; i++) { if (npcHere(NPCS[i])) { return NPCS[i]; } }
    return null;
  }
  var SCENERY = { telefono: ["albergo"], banco: ["albergo"], minestra: ["albergo"], macchina: ["albergo"], stufa: ["albergo", "baracca"], biglietto: ["albergo"],
    valigia: ["camera"], finestra: ["camera"], letto: ["camera"],
    orario: ["corriera"], bus: ["corriera"], fontana: ["piazza"], avviso: ["piazza"], campanile: ["piazza"], chiesaext: ["piazza"], albergoext: ["piazza"],
    corpo: ["chiesa"], mani: ["chiesa"], ceri: ["chiesa"],
    fascicolo: ["direzione"], plastico: ["direzione"], fotografia: ["direzione"],
    lago: ["strada", "diga", "camera"], marcia: ["strada", "diga", "camera", "piazza"], digaext: ["strada", "corriera"], villa: ["strada"], baraccaext: ["strada"], lucchetto: ["strada"],
    scrivania: ["baracca"], sismografo: ["baracca"], lavagna: ["baracca"], calendario: ["baracca"], carte: ["baracca"],
    parapetto: ["diga"], casello: ["diga"], orologio: ["diga"], idrometro: ["diga"], scarichi: ["diga"], portello: ["diga"], auto: ["diga"], avvocato: ["diga"],
    pendolo: ["cunicolo"], spie: ["cunicolo"], tubo: ["cunicolo"],
    quadro: ["centralino"], cuffia: ["centralino"], pendola: ["centralino"],
    neve: ["corriera", "piazza", "strada", "diga"] };
  function present(id) {
    if (isNpc(id)) { return npcHere(id); }
    if (isItem(id)) {
      if (has(id) || S.loc[id] === S.room) { return true; }
      if (id === "relazione") { return S.room === "cunicolo" && S.f.tubo && S.loc.relazione === "tubo"; }
      return false;
    }
    if (id === "biglietto" && S.ch < 2) { return false; }
    if (id === "auto" && S.ch !== 4 && !S.f.offerta) { return false; }
    if (id === "avvocato" && !S.f.offerta) { return false; }
    if (id === "tubo" && !S.f.pendolo) { return false; }
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

  function setChapter(n) { S.ch = n; S.t = { o: 0, v: 0, m: 0, b: 0, g: 0 }; markChapter(); }
  /* inizio del capitolo: un codice tenuto da parte, per RICOMINCIA CAPITOLO */
  var CHAP_KEY = "acquacheta.capitolo", chapMem = "";
  function markChapter() { chapMem = encode(); try { localStorage.setItem(CHAP_KEY, chapMem); } catch (e) { /* resta in memoria */ } }
  function chapterStart() { var c = chapMem; try { c = localStorage.getItem(CHAP_KEY) || chapMem; } catch (e) { c = chapMem; } return decode(c || ""); }
  function restartChapter() {
    var o = chapterStart();
    if (!o || o.ch !== S.ch) { o = S.ch === 1 ? fresh() : null; }
    if (!o) { return [P("Non so dove comincia questo capitolo: la partita è stata ripresa da un codice. Puoi ricominciare da capo, oppure CARICA un codice salvato prima.")]; }
    S = o; save();
    return [NOTE("Si ricomincia dall'inizio del capitolo."), CHAP(S.ch)].concat(describe(true));
  }

  var SPINE = "[[MILANO|chiama milano]], [[GIORNALE|chiama giornale]], [[DIGA|chiama diga]], [[CANONICA|chiama canonica]]";

  function describe(withImage) {
    var b = [{ t: "room", s: ROOM_NAME[S.room] }], r = S.room, c = S.ch, f = S.f, d = "";
    if (r === "corriera") {
      if (c === 1) {
        if (withImage) { b.push(IMG("fermata", "Pieve Sorda, capolinea")); }
        d = "La corriera fa manovra e riparte in discesa, coi fanali che frugano la neve. Ti lascia una [[palina]] con l'orario, un lampione, e il silenzio che c'è solo dove nevica da tre giorni. In fondo alla valle, dove dovrebbe esserci il buio, c'è un muro più chiaro del cielo: la [[diga]].\nIl paese è a [[nord]].";
      } else if (c === 4) {
        if (withImage) { b.push(IMG("fermata", "Il capolinea, di notte")); }
        d = "Vuota. L'[[orario]] dice 7.10. Mancano otto ore e una telefonata.\nIl paese è a [[nord]].";
      } else {
        if (withImage) { b.push(IMG("fermataGiorno", "Il capolinea, di giorno")); }
        d = "Di giorno la fermata è una palina, un [[orario]] e un mucchio di neve sporca. La prossima corriera è alle 18.40. In fondo alla valle la [[diga]] chiude il cielo come un coperchio.\nIl paese è a [[nord]].";
      }
    } else if (r === "piazza") {
      if (withImage) { b.push(IMG(night() ? "pieve" : "pieveGiorno", "Piazza della Pieve")); }
      d = "Una [[fontana]] presa nel ghiaccio, un [[campanile]] troppo alto per un paese così, e sul muro del forno un [[avviso]] fresco di colla. Di là dai tetti, oltre il lago, una montagna scura senza una luce: in paese la chiamano la [[Marcia]]. ";
      if (c === 1) { d += "A [[est]] le finestre accese di un [[albergo]]; a [[ovest]] la [[chiesa]], con un lume solo. A [[nord]] parte la strada del lago."; }
      else if (c === 4) { d += "A [[est]] l'[[albergo]] ha una finestra sola accesa: quella del centralino. A [[ovest]] la [[chiesa]] è aperta. A [[nord]] la strada del lago."; }
      else { d += "A [[est]] l'[[albergo]]; a [[ovest]] la [[chiesa]]; a [[nord]] la strada del lago."; }
      d += " La corriera ferma a [[sud]].";
    } else if (r === "albergo") {
      if (withImage) { b.push(c <= 3 ? IMG("osteria", "«Alla Posta»: mescita, alloggio, telefono") : IMG("osteriaNotte", "«Alla Posta», a sedie capovolte")); }
      if (c === 1) {
        d = "Una sala bassa, calda di [[stufa]]. Un [[banco]] di larice, e dietro il banco una [[donna]] con una cuffia da telefonista al collo, come un'altra porterebbe una collana. Alle sue spalle, in una nicchia, un quadro pieno di spine e cordoni; accanto alla porta, la cabina del [[telefono]]. A un tavolo un [[giovanotto]] batte a [[macchina]] con due dita e molta convinzione. Sul fuoco, una pentola di [[minestra]].";
      } else if (c === 2) {
        d = "Di mattina sa di orzo tostato e di legna umida. [[Olga]] è al [[banco]], la cuffia al collo. [[Vescovi]] ha lo stesso tavolo e la stessa [[macchina]] da scrivere." + (f.biglietto ? "" : " Sul banco c'è un [[biglietto]] col tuo nome.");
      } else if (c === 3) {
        d = "Hanno acceso la luce presto: col favonio viene buio prima. [[Olga]] guarda il quadro, [[Vescovi]] guarda Olga. La [[stufa]] è l'unica, qui dentro, che non aspetta niente.";
      } else {
        d = "Le sedie sui tavoli, una lampada sola. [[Olga]] ha il cappotto sulle spalle e non si è tolta la cuffia. [[Vescovi]] è seduto accanto alla cabina, col cappello in mano, come si aspetta un treno.";
      }
      d += "\nLa piazza è a [[ovest]]" + (c < 4 ? ", le camere [[su]]." : "; il centralino è dietro il banco, a [[est]].");
    } else if (r === "camera") {
      if (withImage) { b.push(IMG(night() ? "camera3" : "camera3Giorno", "Camera 3")); }
      d = "Un [[letto]] col piumino alto, un catino, un crocifisso. La tua [[valigia]] è sulla sedia. ";
      d += c === 1 ? "Dalla [[finestra]] si vede il lago, nero, e di là dal lago una montagna più nera." : "Dalla [[finestra]], di giorno, il lago è color peltro, e la [[Marcia]] ha una riga chiara di traverso, come una cicatrice.";
      if (c === 1) { d += f.telefonato ? " Milano è servita. Non resta che [[dormire|dormi]]." : " Prima di [[dormire|dormi]], Milano aspetta una telefonata."; }
      d += "\nLa scala scende: [[giù]].";
    } else if (r === "chiesa") {
      if (withImage) { b.push(IMG("chiesa", c === 4 ? "La cappella, a ceri bassi" : "La stanza più fredda del paese")); }
      if (c === 4) { d = "Hanno chiuso il feretro. I [[ceri]] sono a metà. [[Marta]] è ancora sulla sedia: non aspetta la corriera, aspetta le due.\nLa piazza è a [[est]]."; }
      else { d = "La cappella di sinistra è la stanza più fredda del paese: per questo l'hanno messo qui. Un feretro su due cavalletti, quattro [[ceri]], e sotto un lenzuolo Ettore [[Malan]], geologo. Su una sedia impagliata, col cappotto abbottonato fino al mento, una [[vedova]] che non prega: fa la guardia.\nLa piazza è a [[est]]."; }
    } else if (r === "strada") {
      if (withImage) { b.push(IMG(night() ? "lago" : "lagoGiorno", "La strada del lago")); }
      d = "La strada corre sul bordo dell'acqua, tra i paracarri e niente. Il [[lago]] è ";
      d += c === 2 ? "grigio, fermo, più alto di ieri: si vede dal colore dei sassi." : (c === 3 ? "salito ancora: i paracarri più bassi hanno i piedi bagnati." : "nero, e così alto che sembra di poterlo toccare dalla strada.");
      d += " Di fronte, la [[Marcia]]" + (c === 4 ? ", senza una luce." : ", con la sua crepa lunga un chilometro.");
      d += " A [[nord]] la [[diga]]. A [[est]] una [[villetta]] con le persiane verdi e la targa della Società" + (c === 4 ? ", buia" : "") + ". Un sentiero sale ([[su]]) a una [[baracca]] di legno" + (f.lucchetto ? ", aperta." : ", chiusa con un [[lucchetto]].") + " Il paese è a [[sud]].";
    } else if (r === "direzione") {
      if (withImage) { b.push(IMG("direzione", "Direzione lavori")); }
      d = "Parquet, termosifoni, odore di cera: la Società scalda meglio del paese. Sotto una campana di vetro c'è il [[plastico]] della diga; alla parete una [[fotografia]] con molte autorità. ";
      d += c === 3 ? "L'ingegner [[Morandin]] è alla finestra e guarda il lago salire come altri guardano crescere un figlio. Sulla scrivania, sempre lo stesso [[fascicolo]]." : "L'ingegner [[Morandin]] ha una scrivania sgombra, un [[fascicolo]] solo, e i modi di chi non ha mai dovuto alzare la voce.";
      d += "\nLa strada è a [[ovest]].";
    } else if (r === "baracca") {
      if (withImage) { b.push(IMG("baracca", "Dove lavorava Malan")); }
      d = "Quattro pareti di abete e una [[stufa]] fredda. Qualcuno ha cercato in fretta: un [[cassetto]] ha la serratura scheggiata. Alla parete, [[carte]] del versante e una [[lavagna]] con due colonne di numeri; un [[calendario]]; in un angolo un [[sismografo]] che continua a girare per conto suo.";
      if (S.loc.occhiali === "baracca") { d += " Sul tavolo, una custodia da [[occhiali]]."; }
      d += "\nIl sentiero scende: [[giù]].";
    } else if (r === "diga") {
      if (withImage) { b.push(c === 4 ? IMG("digaNotte", "La notte del collaudo") : IMG("diga", "Centosessanta metri, visti da sopra")); }
      if (f.offerta) {
        d = "Il coronamento, al tramonto. [[Morandin]] è fermo in mezzo, tra te e la strada; due passi indietro l'[[avvocato]], e più in là un'[[automobile]] nera. Bepi ha chiuso la porta del casello. Il [[lago]] da una parte, il vuoto dall'altra.\n[[ACCETTA|accetta]], [[RIFIUTA|rifiuta]], oppure passa oltre: [[sud]].";
        b.push(P(d)); return b;
      }
      if (c === 4) {
        d = "I riflettori del collaudo fanno del coronamento un palcoscenico. Tre [[signori]] in cappotto controllano l'[[asta]] idrometrica ogni dieci minuti; l'ingegner [[Morandin]] non la guarda mai: sa già cosa dice. Un'[[automobile]] nera, col motore acceso per il riscaldamento. [[Bepi]] è nel casello, accanto ai volantini degli [[scarichi]], con la luce spenta. Il [[lago]] è a due spanne dal segno.";
      } else {
        d = "Duecento metri di coronamento, larghi come una strada. Da una parte il [[lago]], a un braccio; dall'altra il vuoto: centosessanta metri di calcestruzzo, e poi la gola. Un [[parapetto]] da tutte e due le parti. Sulla spalla della diga, il casello del guardiano: [[Bepi]] Tormen è sulla porta, con le mani in tasca. Dentro si vedono un [[orologio]] di ronda e i volantini degli [[scarichi]]. Sul paramento, dalla parte del lago, l'[[asta]] idrometrica.";
      }
      d += " In fondo, nella roccia, un [[portello]] di ferro" + (f.portello ? ", aperto su una scala: [[giù]]." : ".");
      d += "\nLa strada torna a [[sud]].";
    } else if (r === "cunicolo") {
      if (withImage) { b.push(IMG("cunicolo", "Dentro la spalla sinistra")); }
      d = "Sessanta gradini di ferro, poi una galleria alta quanto te, che entra nella montagna. La lampada fa un cerchio bianco, e basta. L'acqua cola dalla volta con la pazienza dei creditori. Lungo le crepe, una fila di [[spie]] di vetro. In fondo, nella sua cassetta, il [[pendolo]].";
      if (f.pendolo) { d += !f.tubo ? " Dietro la cassetta, tra l'asse e la roccia, il [[tubo]] di cartone." : (S.loc.relazione === "tubo" ? " Il [[tubo]] è aperto: dentro, la [[relazione]]." : " Il [[tubo]] è vuoto."); }
      d += "\nLa scala risale: [[su]].";
    } else if (r === "centralino") {
      if (withImage) { b.push(IMG("centralino", "Il quadro di Pieve Sorda")); }
      d = "Uno stanzino senza finestra, una sedia girevole, un [[quadro]] di noce con venti prese e quattro targhette che contano. Sopra il quadro una [[pendola]] che fa più rumore del necessario: mancano pochi minuti a mezzanotte. Olga è rimasta sulla porta, di spalle. ";
      d += f.cuffia ? "Hai la cuffia in testa. Le spine sono quattro: " + SPINE + "." : "La [[cuffia]] è appesa al suo gancio.";
      d += "\nLa sala è a [[ovest]].";
    }
    b.push(P(d));
    return b;
  }

  function prologue() {
    return [
      [{ t: "front", s: "Acqua Cheta", sub: "Un noir in quattro capitoli" },
        IMG("fermata", "Val Sorda, febbraio 1957"),
        { t: "prosa", s: "Val Sorda, Prealpi venete. In cima alla valle c'è una diga nuova, la più alta d'Europa, dicono i manifesti; sotto la diga un lago che sale; sopra il lago un paese che ha imparato a non fare domande.\n\nArrivi con l'ultima corriera, sotto una neve vecchia di tre giorni. Ti chiami Ada Corvi, hai quarantaquattro anni e una lettera d'incarico delle Assicurazioni «La Vigile» che dice «perito liquidatore». Stavolta è vero. Di Porto Scuro non parli: com'è finita, lo sai tu." }],
      [IMG("digaMorto", "Il coronamento, la notte dell'8 febbraio"),
        { t: "prosa", s: "Quattro giorni fa il geologo della Società, Ettore Malan, è caduto dal coronamento della diga. Disgrazia, dice la Società. Il dottor Ferrante, da Milano, preferisce un'altra parola: «Malan aveva una polizza sulla vita, quattro milioni, e dei debiti. Se si è buttato, clausola undici: non paghiamo. Mi porti un suicidio, signora Corvi.»\n\nNon ti ha minacciata. Ti ha promesso una scrivania in sede, un termosifone, la tredicesima. A quarantaquattro anni è un'offerta che non passa due volte, e Ferrante lo sa: l'ha letto nella tua pratica, alla voce «precedenti impieghi»." }]
    ];
  }

  /* ---------- scheda ---------- */
  function sheet() {
    var c = S.ch, f = S.f, who = [], facts = [], mt = [], job, time;
    time = ["", "Sera, nevica", "Mattina, cielo di latta", "Pomeriggio, vento caldo", "Notte, sereno"][c];
    if (S.end) { job = "Nessuno."; }
    else if (c === 1) { job = f.telefonato ? "Dormire. Domani guardare il morto, e chi lo piange." : "Prendere la camera e telefonare a Milano."; }
    else if (c === 2) { job = has("occhiali") ? "Mostrare gli occhiali a chi ha trovato il corpo." : (f.martaKey ? "Entrare nella baracca di Malan." : (f.mani ? "Dire alla vedova quello che hai visto." : "Capire com'è morto Malan. Cominciando da lui.")); }
    else if (c === 3) { job = f.relazione ? "Uscire dal cunicolo con la relazione." : "Scendere nel cunicolo. Le carte di Malan sono dietro il pendolo."; }
    else { job = "Prima di mezzanotte, dal centralino, fare una telefonata. Una sola."; }

    who.push(["Ferrante", "La Vigile, Milano. Il tuo capo. Vuole un suicidio: clausola undici, e i quattro milioni restano in cassa. In cambio, una scrivania in sede."]);
    who.push(["Malan", "Geologo della Società, morto da quattro giorni. " + (f.mani ? "Mani intatte: non si è aggrappato a niente." : "Caduto dal coronamento, dicono.") + (f.bepi ? " Ce l'hanno portato: Nardin e un altro, dopo le nove di sera." : "") + (f.relazione ? " Aveva scritto tutto, e l'aveva consegnato." : "")]);
    if (S.visited.albergo) { who.push(["Olga", "Padrona dell'albergo e centralinista. Tutte le telefonate del paese le passano per le mani." + (f.biglietto ? " Compresa la tua: la Società la paga per ascoltare." : "") + (f.olgaSa ? " Gliel'hai detto in faccia. Per te, dice, avrà mal di testa." : "")]); }
    if (f.v1) { who.push(["Vescovi", "Cronista della «Voce delle Valli». Querelato una volta dalla Società. Vuole carte, non voci." + (f.vescoviSa ? " Gli hai dato una voce: l'ha già dettata." : "")]); }
    if (S.visited.chiesa) { who.push(["Marta", "La vedova. Veglia il marito in chiesa. Ha un figlio in collegio e una polizza che la tua firma può annullare." + (f.martaKey ? " Ti ha dato la chiave della baracca." : "")]); }
    if (f.mo1) { who.push(["Morandin", "Direttore dei lavori. Crede nella diga come altri credono in Dio: senza cattiveria." + (f.morandinSa ? " Sa che hai guardato le mani. «Non ho chiesto come.»" : "") + (f.patto ? " Ha la relazione. Ti deve un ufficio e una rilettura." : (c === 4 ? " Gli hai detto di no." : ""))]); }
    if (f.b1) { who.push(["Bepi", "Guardiano della diga. Ha trovato il corpo." + (f.bepi ? " Ha firmato il falso, e te l'ha detto." : "") + (f.scarichi ? " Può aprire gli scarichi, se qualcuno poi firma. Il casello è il due-due." : "")]); }

    if (f.relazione) {
      mt.push("Quota 680: tre millimetri al giorno"); mt.push("Quota 700: dodici"); mt.push("Quota 710: trentacinque");
      mt.push("Quota 715: «Non frana: scivola. Tutta insieme. L'onda passa sopra la diga.»"); mt.push("Collaudo: stanotte. Quota 715 alle due.");
    } else {
      if (f.notte) { mt.push("Stanotte, alle quattro, la montagna di là dal lago ha fatto un colpo."); }
      if (f.lavagna) { mt.push("Sulla lavagna di Malan: 680: 3. 700: 12. 710: 35. 715: un punto di domanda."); }
      if (f.sismo) { mt.push("Il rullo del sismografo ha un picco alle quattro di stanotte. Non è il primo."); }
    }

    if (f.biglietto) { facts.push("Morandin sapeva del tuo incarico prima di colazione. Ieri sera, al telefono, eravate in tre."); }
    if (f.fascicolo) { facts.push("Nel verbale mancano gli occhiali e il libretto di campagna. Un miope senza occhiali, un geologo senza libretto."); }
    if (f.parapetto) { facts.push("Il parapetto è alto un metro e venti. Non ci si scivola sopra: ci si viene sollevati."); }
    if (f.cassetto) { facts.push("Nella baracca qualcuno ha forzato un cassetto. Cercava carte."); }
    if (f.martaKey) { facts.push("Malan ha scritto alla moglie: «Cerca dove la montagna scrive.»"); }
    if (f.bepi) { facts.push("La montagna scrive in due posti: sul rullo della baracca e sul pendolo del cunicolo."); }
    if (f.relazione) { facts.push("La relazione è stata consegnata a Morandin il 2 febbraio. Sei giorni dopo Malan era morto."); }
    if (f.morandinSa) { facts.push("Morandin sa che non credi alla caduta."); }
    if (f.olgaSa) { facts.push("Olga ha smesso di ascoltare le tue telefonate. Dice."); }
    if (f.vescoviSa) { facts.push("Vescovi ha dettato un pezzo sulla morte di Malan. La fonte sei tu, e in valle si sa."); }
    if (f.patto) { facts.push("Hai un accordo con la Società: «infortunio», la vedova pagata, un ufficio in Direzione."); }
    if (f.quota) { facts.push("Morandin non mente: ci crede. È peggio."); }
    if (f.olga4) { facts.push("Una linea sola, fino a mezzanotte. Quattro spine: Milano, il giornale, la diga, la canonica."); }

    return [{ t: "sheet", name: "Ada Corvi", cap: "Fototessera, 1951",
      rows: [["Età", "44 anni"],
        ["Copertura", "Nessuna. Perito liquidatore, La Vigile Assicurazioni: stavolta è vero"],
        ["Mestiere", "Marconista, 1943–45. Poi i fari. Poi questo"],
        ["Vizi", "Nazionali senza filtro. Dormire vestita. La pistola non la porta più"],
        ["Ora", CH_NAME[c] + ". " + time],
        ["Incarico", job]],
      lists: [["Chi è chi", who, true], ["La montagna", mt, false], ["Cosa sai", facts, false]] }];
  }

  function mapBlock() {
    var v = {}, id;
    for (id in S.visited) { if (S.visited.hasOwnProperty(id)) { v[id] = 1; } }
    return [{ t: "map", visited: v, room: S.room, cap: "Val Sorda e la diga del Gorgo" }];
  }

  /* ---------- capitoli ---------- */
  function sleep() {
    if (S.room !== "camera") { return [P("Non qui.")]; }
    if (S.ch !== 1) { return [P("Non è ora di dormire.")]; }
    if (!S.f.telefonato) { return [P("Non prima di aver chiamato Milano. Ferrante non dorme finché non ha una riga da mettere in pratica.")]; }
    S.moves++; S.f.notte = 1; setChapter(2);
    return [IMG("m_colpo", "Le quattro di notte, dalla camera 3"),
      P("Dormi vestita, per abitudine. Alle quattro ti sveglia un colpo.\nNon è un tuono: d'inverno non tuona. È un colpo sordo, lungo, dalla parte del lago, come un armadio spostato al piano di sopra da qualcuno molto grande. I vetri tremano nel telaio. I cani del paese abbaiano tutti insieme; poi tacciono, tutti insieme.\nQuando apri la finestra il lago ha dei cerchi che si allargano, e sull'altra riva non si è accesa una luce. Non riprendi sonno."),
      CHAP(2)].concat(describe(false));
  }

  function confess() {
    S.f.bepi = 1; S.f.b1 = 1; S.loc.chiavi = "inv"; S.loc.lampada = "inv"; S.moves++; setChapter(3);
    return [IMG("m_occhiali", "Il tavolo del casello"),
      P("Posi la custodia sul tavolo del casello e la apri. Bepi si toglie il berretto, che per lui è molto.\n«Dov'erano?»\n«Sul tavolo della baracca. Piegati.»\n«Allora è come pensavo.» Si siede. «Alle nove ho visto la luce alla baracca, e due che salivano: Nardin, il capocantiere, e uno col cappotto lungo. Alle dieci la luce era spenta. Alle undici l'ho trovato io, sotto il coronamento. Senza occhiali. Uno che senza non vedeva la forchetta.»"),
      P("«Non ha camminato fin lì. Ce l'hanno portato. E io ho firmato che era scivolato, perché ho sessantun anni e questo casello è l'unica casa che ho.»"),
      P("Stacca dal chiodo un anello di [[chiavi]] e una [[lampada]] a carburo. «La montagna scrive in due posti. Sul rullo della baracca, e quello l'hanno già guardato. E sul pendolo del cunicolo, sotto i nostri piedi, dove gli ingegneri non scendono perché ci si sporca. Le sue carte vere, il dottore le teneva lì.»"),
      CHAP(3),
      P("Verso le quattro gira il vento. Viene da sud, tiepido, e la neve comincia a gocciolare dai tetti. Bepi lo chiama favonio e si fa il segno della croce.")].concat(describe(false));
  }

  function morandinScene() {
    var f = S.f;
    S.room = "diga"; f.offerta = 1; f.mo1 = 1; S.moves++;
    return [{ t: "room", s: ROOM_NAME.diga }, IMG("m_offerta", "In fondo al coronamento"),
      P("Quando riemergi dal portello è quasi buio, e sul coronamento c'è [[Morandin]]. Cappotto chiaro, sciarpa bianca, le mani dietro la schiena. Due passi indietro, un [[avvocato]]: si capisce dalla cartella.\n«L'ha trovata. Bepi non sa mentire, e lei non sa nascondere un tubo sotto un impermeabile.»" + (f.morandinSa ? " Una pausa. «So che non crede alla caduta. Per questo sono venuto io, e non Nardin.»" : "") + (f.vescoviSa ? " «So anche cosa ha dettato il giornalista, oggi. In questa valle le linee passano tutte da una stanza.»" : "")),
      P("«Le dico io cosa c'è scritto: che a quota 715 il versante cede. Malan me l'ha letta in faccia. Io gli ho risposto che la diga tiene. E la diga tiene.» Guarda il lago. «Mi dia quei fogli. La Società riconosce l'infortunio, la signora Malan è pagata entro il mese, e per lei c'è un ufficio in Direzione, al doppio di Milano. La relazione la rileggo io. Dopo il collaudo.»\nL'avvocato apre la cartella. [[ACCETTA|accetta]], oppure [[RIFIUTA|rifiuta]].")];
  }

  function resolveOffer(accept) {
    var b;
    S.f.offerta = 0; S.moves++;
    if (accept) {
      if (!has("relazione")) { S.f.offerta = 1; S.moves--; return [P("«I fogli, signora. Le parole le ho già sentite.»")]; }
      S.f.patto = 1; S.loc.relazione = "none";
      b = [P("Gli dai il tubo. Lo passa all'avvocato senza guardarlo, come un cappello a un guardarobiere. «Stanotte detti alla sua Compagnia: infortunio. Per il resto ha la mia parola.» Dalla portiera si volta. «Non è una resa, signora. È un'assunzione.»")];
    } else {
      b = [P("Gli passi accanto, dalla parte del lago. L'avvocato fa per muoversi; Morandin alza due dita.\n«Come crede. Stanotte alle due l'acqua tocca il segno, e la montagna resta dov'è. Domani quei fogli saranno l'ossessione di un morto, e lei una donna senza posto.»\nQuando ti volti stanno salendo in macchina. Non hanno fretta. Hanno un calendario.")];
    }
    setChapter(4);
    return b.concat([CHAP(4), P("Le dieci e quaranta. Il vento caldo ha pulito il cielo, e sul coronamento sono tornati tutti, coi riflettori. Alle due l'acqua tocca quota 715. A mezzanotte la Direzione si prende l'unica linea del paese. Hai una telefonata, e quattro persone che ne vogliono quattro diverse.")]).concat(describe(false));
  }

  /* ---------- i finali ---------- */
  var DEST = { milano: "milano", ferrante: "milano", compagnia: "milano", vigile: "milano", sede: "milano",
    giornale: "giornale", vescovi: "giornale", redazione: "giornale", voce: "giornale", bortolo: "giornale", stenografo: "giornale",
    diga: "diga", bepi: "diga", casello: "diga", scarichi: "diga", guardiano: "diga",
    canonica: "paese", paese: "paese", campane: "paese", campana: "paese", parroco: "paese", prete: "paese", pieve: "paese" };
  var ENDINGS = {
    milano: function () {
      var f = S.f, s;
      if (f.patto) {
        s = "Milano risponde al terzo squillo: Ferrante non dorme, aspetta.\n«Mi dica.»\nDetti. «Infortunio sul lavoro. Caduta accidentale, ghiaccio sul coronamento.»\nSilenzio sul filo. «Non è quello che le avevo chiesto.»\n«No. È quello che ha chiesto qualcun altro. Paghi la vedova, dottore: quattro milioni. Le dimissioni gliele mando per posta.»";
        s += "\nAlle due l'acqua tocca quota 715. La commissione firma sul cofano dell'automobile, con la stilografica dell'ingegnere. Brindano.";
        s += "\nMarta Malan avrà i suoi soldi, e le condoglianze della Società in carta bollata. È l'unica cosa giusta della notte, e l'hai comprata con una relazione che adesso sta in una cassaforte, a Venezia.";
        s += "\nA marzo hai un ufficio in Direzione, con la targhetta sulla porta. Morandin ha promesso di rileggere la relazione dopo il collaudo. Glielo ricordi ogni lunedì. Ogni lunedì dice: la settimana prossima.";
        if (f.morandinSa) { s += "\nUna sera, sulla porta, ti dice: «Lei sapeva delle mani, e ha preso il posto lo stesso. Siamo più simili di quanto le piaccia.» Non rispondi. È una risposta."; }
        if (f.vescoviSa) { s += "\nVescovi scrive ancora, ogni tanto. Adesso le smentite le firmi tu."; }
        s += "\nDalla finestra dell'ufficio si vede la Marcia. Hai girato la scrivania dall'altra parte.";
        return ["Il posto", s];
      }
      s = "Milano risponde al terzo squillo: Ferrante non dorme, aspetta.\n«Mi dica.»\nDetti. Malan Ettore, anni quarantasette. Debiti, un coronamento, una notte senza luna. «Morte volontaria.» Ti esce pulita, come una cosa già detta in un'altra vita.\n«Brava», dice Ferrante. «Clausola undici. Lunedì in sede.»";
      s += "\nAlle due l'acqua tocca quota 715. La commissione firma sul cofano dell'automobile, con la stilografica dell'ingegnere. Brindano.";
      s += "\nMarta Malan riparte dietro un camion della Società, che è l'ultima cortesia, e senza una lira. Dal finestrino non guarda te: guarda la montagna.";
      if (f.morandinSa) { s += "\nMorandin ti stringe la mano davanti all'albergo. «Lei ha visto quelle mani e ha scritto suicidio. Non so chi dei due dorma peggio.»"; }
      if (f.vescoviSa) { s += "\nVescovi il suo pezzo l'aveva già dettato. Lo smentiscono in due righe: c'è una perizia, adesso, e la perizia è tua."; }
      if (f.olgaSa) { s += "\nOlga ti prepara il conto senza guardarti. Stavolta ha ascoltato: l'hai capito da come ha posato la cuffia."; }
      s += "\nA Milano hai una scrivania, un termosifone, la tredicesima. La relazione è in fondo a un cassetto, sotto le pratiche chiuse. La Marcia, di là dal lago, continua a fare i suoi millimetri: non c'è clausola che la riguardi.";
      s += "\nOgni tanto, in ufficio, il termosifone fa un colpo. Tu alzi la testa. Gli altri no.";
      return ["La pratica", s];
    },
    giornale: function () {
      var f = S.f, s;
      if (f.patto) {
        s = "La redazione risponde subito: di notte i giornali sono svegli.\nDetti quello che ricordi. Le quote, più o meno. I millimetri, a memoria. Le carte non le hai più: le hai date a chi doveva temerle.\n«Senza documento è una lettera al direttore», dice lo stenografo. Non è cattivo: è sordo da un orecchio, e pratico da tutti e due.";
        s += "\nEsce dopo quattro giorni, in sesta pagina, tra le lettere, firmata «una lettrice». La Società non querela nemmeno. Non ce n'è bisogno: nessuno la chiama falsa. Nessuno la chiama.";
        s += "\nAlle due di quella notte, intanto, l'acqua ha toccato quota 715, e il collaudo è riuscito.";
        s += "\nMorandin ti manda un biglietto: «Avevamo un accordo.» L'indennità di Marta Malan viene «riesaminata». L'ufficio in Direzione non c'è più; la scrivania a Milano nemmeno.";
        if (f.vescoviSa) { s += "\nVescovi ti saluta con due dita, dal suo tavolo. Una voce gliel'avevi data; le carte le hai date agli altri. Non te lo dice. Lo scrive, forse, da qualche parte."; }
        s += "\nHai detto la verità a tutti e due, a turno. È il modo più sicuro per non essere creduta da nessuno.";
        return ["Notizie false", s];
      }
      s = "La redazione risponde subito: di notte i giornali sono svegli. Chiedi di Bortolo.\nDetti per quaranta minuti. Quote, millimetri, date. L'ultima riga la detti due volte: «Non è la diga che cade.»\n«Ce l'ho», dice lo stenografo. «È vera?»\n«È firmata da un morto.»";
      s += "\nEsce dopodomani, in terza pagina: «La montagna si muove». Alle due di stanotte, intanto, l'acqua ha toccato quota 715, e il collaudo è riuscito.";
      s += "\nLa Società querela: diffusione di notizie false e tendenziose, atte a turbare l'ordine pubblico. Vescovi va a processo a giugno. Tu sei citata come teste, e come licenziata: la Vigile non tiene periti che telefonano ai giornali.";
      if (f.vescoviSa) { s += "\nÈ la seconda volta in una settimana che il suo giornale scrive della diga. Il giudice lo nota. Non è un'attenuante."; }
      if (f.olgaSa) { s += "\nOlga testimonia che la telefonata è partita dal suo quadro, chi l'ha fatta, e che nessuno l'ha obbligata a passarla. A settembre le tolgono il posto telefonico."; }
      if (f.morandinSa) { s += "\nIn aula Morandin dice che la relazione era nota, protocollata, e superata. Non ti guarda. Guarda le proprie mani, a lungo, come se fossero di un altro."; }
      s += "\nMarta Malan ritaglia l'articolo e lo tiene nel portafogli, dove gli altri tengono le fotografie. La polizza resta sospesa, «in attesa di giudizio».";
      s += "\nL'invaso viene abbassato di dieci metri, «per accertamenti». A primavera lo riempiono di nuovo. Ma adesso è scritto, con la data. Quando verrà il giorno, nessuno potrà dire che non si sapeva. Non sai se sia una consolazione o un'aggravante.";
      return ["Notizie false", s];
    },
    diga: function () {
      var f = S.f, s;
      if (f.scarichi && !f.patto) {
        s = "Il casello risponde al primo squillo. Bepi non dormiva.\n«Adesso», dici.\n«Chi firma?»\n«Io.»\nUn silenzio lungo quanto il coronamento. Poi il rumore di una cornetta posata sul legno, senza riattaccare, e passi, e una chiave in un lucchetto.\nDal filo aperto senti arrivare l'acqua: prima un fischio, poi un tuono che non finisce. Gli scarichi di fondo della diga del Gorgo, aperti tutti e due, a mezzanotte meno sei.";
        s += "\nAll'alba il lago è sceso di undici metri e ha lasciato sulle rive una fascia di fango a righe, come gli anelli di una vasca. Il collaudo è fallito. La Marcia, quella notte, non si muove di un millimetro: lo scrive il rullo della baracca, che nessuno guarda.";
        s += "\nBepi lo portano via alle sette: sabotaggio, danneggiamento, ventisei anni di servizio. Non fa il tuo nome. Lo fai tu, in caserma, e non ti credono: una donna, di un'assicurazione.";
        s += f.morandinSa ? "\nPoi Morandin dichiara che l'ordine è partito dalla Direzione. Bepi esce dopo tre giorni. L'ingegnere lo trasferiscono in Sardegna, a costruire un acquedotto. È il suo modo di dire che la relazione l'aveva letta." : "\nMorandin dichiara che nessuno, in Direzione, ha dato quell'ordine. È vero.";
        if (f.vescoviSa) { s += "\nVescovi ha la sua colonna e mezza: «Il guardiano che svuotò il lago». Di Malan, due righe in fondo."; }
        s += "\nLa Società scrive al Ministero che il versante non è caduto: dunque non sarebbe caduto. È un argomento a cui non c'è risposta. A giugno riempiono di nuovo, con un altro guardiano.";
        s += "\nMarta Malan seppellisce il marito a Pieve Sorda, vista lago. La polizza gliela pagano in tribunale, quattro anni dopo.";
        s += "\nTu riparti con la corriera delle sette e dieci, senza posto. Dal finestrino conti le righe sul fango. Undici metri. Per ora.";
        return ["Acqua bassa", s];
      }
      s = "Il casello risponde al primo squillo. Bepi non dormiva.\n«Apra gli scarichi», dici.\n" + (f.patto ? "«Mi hanno detto che le carte le ha date a loro.» Lo dice senza rabbia. «Con che faccia mi chiama?»" : "«Chi me lo ordina? Io gli ordini li prendo dall'ingegnere. Lei non so nemmeno cosa vuole da me.»");
      s += "\nStai per sfilare la spina. «Resti lì», dice. Posa la cornetta senza riattaccare.\nApre uno scarico solo. Per venti minuti senti l'acqua, sul filo; poi delle voci, Nardin, una porta. La linea cade.";
      s += "\nAll'alba il lago è sceso di due metri. Il collaudo è rinviato di una settimana. La Marcia rallenta. Non si ferma.";
      s += "\nBepi lo licenziano prima che faccia giorno. Esce dal casello con una valigia di cartone e l'orologio di ronda sotto il braccio: quello, dice, è suo." + (f.morandinSa ? " Morandin non lo denuncia. Non è bontà: è che in tribunale, poi, bisognerebbe spiegare perché." : "");
      s += "\nDue metri. È quello che vale, a mezzanotte, la parola di una " + (f.patto ? "che le carte le ha già vendute." : "con cui non si è mai parlato davvero.");
      s += "\nLa settimana dopo riempiono. Tu sei già a Milano, senza posto, a rifare lo stesso conto: due metri, sette giorni. Non sai a quante persone bastino.";
      return ["Acqua bassa", s];
    },
    paese: function () {
      var f = S.f, s;
      s = "La canonica risponde dopo un pezzo. Il parroco ha settant'anni e il sonno dei giusti. Gli dici chi sei, cosa ha scritto Malan, a che ora l'acqua tocca il segno." + (f.patto ? " Le carte non le hai più: hai la voce. Basta quella." : "") + "\nNon ti chiede se sei sicura. Chiede: «Quanto tempo?»\n«Due ore.»\nLa campana a martello comincia a mezzanotte e dieci.";
      s += "\nEscono tutti. Trecentoquaranta persone in fila sulla neve, verso il pascolo alto: i vecchi sulle slitte, i bambini nelle coperte. Le bestie no: non c'è tempo. Dal coronamento Morandin vede salire le lanterne, e non ferma il collaudo.";
      s += "\nAlle due l'acqua tocca quota 715. La Marcia fa un rumore. Uno solo, lungo. Poi niente.";
      s += "\nAll'alba la gente scende. Il vecchio Fiorin no: lo trovano seduto contro un larice, con la coperta sulle ginocchia. Il cuore, dice il medico. Il freddo, dice il paese. Lei, dicono tutti e due.";
      s += "\nProcurato allarme: ti denuncia la Società, e il sindaco firma.";
      if (f.olgaSa) { s += " Olga dichiara che la linea l'ha data lei, e che lo rifarebbe. In paese non la salutano più volentieri. Il pane glielo vendono ancora."; }
      if (f.morandinSa) { s += "\nMorandin ti manda due righe, a mano: «Ha visto? È rimasta dov'era.» Sotto, più piccolo, di un'altra penna: «Stavolta.»"; }
      if (f.vescoviSa) { s += "\nVescovi scrive: «Una notte di paura per niente». Il titolo non è suo. L'articolo sì."; }
      s += "\nMarta Malan ti aspetta alla corriera. «Lui avrebbe fatto lo stesso», dice. Non è un'assoluzione. È un'informazione.";
      s += "\nLa montagna non è caduta. Per il paese è la prova: quelli di città gridano, e poi non succede niente. La prossima volta che suonerà quella campana, a Pieve Sorda si gireranno dall'altra parte. Lo sai. È questo che ti porti a valle.";
      s += "\nUna cosa sola ti tieni: quella notte, comunque, sotto la Marcia non c'era nessuno.";
      return ["Al lupo", s];
    }
  };

  /* ---------- finali trovati: restano anche dopo RICOMINCIA ---------- */
  var END_TITLES = ["La pratica", "Il posto", "Notizie false", "Acqua bassa", "Al lupo"], foundMem = {};
  function foundEnds() {
    var o = foundMem;
    try { o = JSON.parse(localStorage.getItem("acquacheta.finali") || "null") || foundMem; } catch (e) { o = foundMem; }
    return o;
  }
  function markEnd(title) {
    var o = foundEnds(); o[title] = 1; foundMem = o;
    try { localStorage.setItem("acquacheta.finali", JSON.stringify(o)); } catch (e) { /* resta in memoria */ }
  }
  function endsNote() {
    var o = foundEnds(), got = [], i;
    for (i = 0; i < END_TITLES.length; i++) { if (o[END_TITLES[i]]) { got.push(END_TITLES[i]); } }
    if (!got.length) { return "Finali trovati: nessuno su " + END_TITLES.length + "."; }
    return "Finali trovati: " + got.length + " su " + END_TITLES.length + " (" + got.join(", ") + ")." + (got.length < END_TITLES.length ? " Gli altri restano da scoprire." : " Li hai visti tutti.");
  }

  var END_PIC = { "La pratica": ["f_pratica", "Milano, sede"], "Il posto": ["f_posto", "Direzione lavori, marzo"], "Notizie false": ["f_notizie", "Terza pagina"],
    "Acqua bassa": ["f_acqua", "Il lago, all'alba"], "Al lupo": ["f_lupo", "Pieve Sorda, all'alba"] };
  var DEST_NAME = { milano: "Milano", giornale: "il giornale", diga: "la diga", paese: "la canonica" };
  function call(word) {
    var dest = DEST[word], e, fin;
    if (S.room === "albergo" && S.ch === 1) { return act("usa", "telefono"); }
    if (S.room !== "centralino") { return [P(S.room === "albergo" ? "La cabina passa dal centralino, e il centralino è di Olga." : "Da qui puoi chiamare solo a voce. Il telefono del paese è all'albergo.")]; }
    if (!S.f.cuffia) { return [P("Il quadro è muto finché non ti metti la [[cuffia]].")]; }
    if (!dest) { return [P("Quale spina? " + SPINE + ".")]; }
    e = ENDINGS[dest]();
    S.moves++; S.end = { "La pratica": 1, "Il posto": 2, "Notizie false": 3, "Acqua bassa": 4, "Al lupo": 5 }[e[0]]; markEnd(e[0]);
    fin = END_PIC[e[0]];
    return [IMG("tx_" + dest, "Mezzanotte meno dieci: " + DEST_NAME[dest]), P(e[1]), IMG(fin[0], fin[1]),
      { t: "end", s: "Fine — " + e[0] },
      NOTE("Hai chiuso la storia in " + S.moves + " mosse. " + endsNote() + " [[RICOMINCIA CAPITOLO|ricomincia capitolo]] per rifare la notte e cercare un altro finale, [[RICOMINCIA|ricomincia]] per ripartire da capo, [[STORIE|storie]] per tornare all'elenco delle storie.")];
  }

  /* ---------- movimento ---------- */
  function go(dir) {
    var r = S.room, c = S.ch, f = S.f, to = EXITS[r][dir];
    if (f.offerta) {
      if (dir === "sud") { return resolveOffer(false); }
      return [P("Morandin è tra te e la strada. Dietro hai il portello, e sotto il portello non c'è un'altra uscita.")];
    }
    if (!to) { return [P("Da quella parte non si va.")]; }
    if (r === "piazza" && dir === "nord" && c === 1) { return [P("Di notte, con questa neve, la strada del lago è per chi ha fretta di morire. Domani.")]; }
    if (r === "piazza" && dir === "ovest" && c === 1) { return [P("Chiusa. Dentro c'è un lume acceso, e qualcuno che stanotte non ha bisogno di compagnia.")]; }
    if (r === "albergo" && dir === "su") {
      if (c === 4) { return [P("Non è notte da dormire.")]; }
      if (!has("chiave")) { return [P("Le camere sono di sopra. Senza chiave resti un'avventrice.")]; }
    }
    if (r === "albergo" && dir === "est") {
      if (c !== 4) { return [P("Dietro il banco c'è il centralino, e davanti al centralino c'è Olga. Di lì non si passa.")]; }
      if (!f.olga4) { S.t.o = 0; return talkLine("olga").concat([P("Si sposta di un passo. Dietro il banco, a [[est]], la porta dello stanzino è aperta.")]); }
    }
    if (r === "strada" && dir === "su" && !f.lucchetto) {
      if (!has("chiavetta")) { return [P("Sali fino alla baracca: una porta di abete e un [[lucchetto]] nuovo, marchiato S.I.M.A. Dalla finestra si vede un tavolo, e poco altro. Ridiscendi.")]; }
      f.lucchetto = 1;
      return [P("La chiavetta di Marta entra nel lucchetto della Società come se non avesse mai fatto altro. Lo sfili e lo appendi al chiodo.")].concat(move(to));
    }
    if (r === "strada" && dir === "est" && c === 4) { return [P("Buia. Stanotte la Società è tutta sul coronamento.")]; }
    if (r === "diga" && dir === "giu" && !f.portello) { return [P("Il portello del cunicolo è chiuso col catenaccio." + (has("chiavi") ? " Nell'anello di Bepi c'è la sua chiave: [[APRI|apri portello]]." : ""))]; }
    if (r === "cunicolo" && dir === "su" && c === 3 && has("relazione")) { return morandinScene(); }
    return move(to);
  }
  function move(to) {
    var first = !S.visited[to];
    S.room = to; S.moves++; S.visited[to] = 1;
    return describe(first);
  }

  /* ---------- dialoghi ---------- */
  function line(arr, key) { var i = Math.min(S.t[key], arr.length - 1); if (S.t[key] < 3) { S.t[key]++; } return [P(arr[i])]; }

  function talk(who) { return talkLine(who).concat(who && who !== "commissione" ? topicList(who) : []); }
  function talkLine(who) {
    var c = S.ch, f = S.f, shown;
    S.moves++;
    if (who === "olga") {
      if (S.room === "centralino") { return [P("«Io non ci sono», dice Olga dalla porta, senza voltarsi. «Ho mal di testa.»")]; }
      if (c === 1) {
        if (!f.olgaKey) {
          f.olgaKey = 1; S.loc.chiave = "inv";
          return [P("«La signora di Milano.» Non è una domanda. «La camera è la tre. Pagata dalla Società, tre notti.» Ti mette in mano una [[chiave]] con la targhetta di legno. «Io non ho chiesto niente a nessuno. Lo dico adesso, perché poi lo chiedono a me.»\nNon hai ancora detto come ti chiami.")];
        }
        return line(["«A quest'ora la cucina è una pentola sola. [[Minestra]] d'orzo.»", "«Il dottor Malan mangiava a quel tavolo.» Indica il più vicino alla stufa. Stasera non ci si è seduto nessuno.", "«Buonanotte. Se di notte sente dei rumori, è la montagna. Ci si abitua.»"], "o");
      }
      if (c === 2) {
        return line(["«Caffè d'orzo e pane di ieri. Quello di oggi lo porta la corriera, se sale.»", "«Dormito?» Non aspetta la risposta. «Alle quattro hanno abbaiato tutti i cani. Poi hanno smesso tutti insieme. È quello che non mi piace: quando smettono.»", "«La vedova è in chiesa. La Direzione è sulla strada del lago. È venuta per tutti e due, no?»"], "o");
      }
      if (c === 3) { return line(["«Il favonio», dice, guardando la gronda che gocciola. «Mia madre col favonio non faceva il pane. Diceva che non lievita niente di buono.»", "«L'ingegnere ha fatto tre telefonate in un'ora. Non le dico a chi.» Una pausa. «A Venezia.»"], "o"); }
      f.olga4 = 1;
      return line(["«Ho un filo solo sul passo, e a mezzanotte la Direzione mi prende il quadro per il collaudo.» Si sfila la cuffia e te la porge dal verso giusto, come si porge un coltello. «Lei in guerra faceva questo mestiere. Me l'ha detto Milano, senza volere. Una chiamata, signora. Scelga bene la spina.»",
        "«Milano, il giornale, il casello della diga, la canonica. Le targhette le ho scritte io.» Guarda la pendola. «Io sto sulla porta. Stanotte ho mal di testa.»",
        "«Vada. Dietro il banco, a [[est]].»"], "o");
    }
    if (who === "vescovi") {
      f.v1 = 1;
      if (c === 1) {
        return line(["Smette di battere. «Gino Vescovi, della “Voce delle Valli”. Lei è l'assicurazione.» Non è una domanda nemmeno la sua. «Qui le notizie salgono con la corriera. Lei è salita con la notizia.»",
          "«Un consiglio: non chieda a nessuno se Malan era triste. Le diranno tutti di sì. È la risposta che costa meno.»"], "v");
      }
      if (c === 2) { return line(["«Ha sentito, stanotte? Ecco. Io sono qui per quello, da tre settimane. In redazione dicono che faccio la villeggiatura.»", "«La Società dice: disgrazia. La sua Compagnia dirà: suicidio. Ci sarebbe una terza parola, ma nessuno paga per sentirla.»"], "v"); }
      if (c === 3) { return line(["«Stanotte collaudano. Ho il pezzo pronto in due versioni: “Trionfo della tecnica”, e l'altra. L'altra non ha ancora un titolo.»", "«Se trova qualcosa di scritto, signora Corvi, io sono a questo tavolo.»"], "v"); }
      return line(["«Bortolo, lo stenografo di notte. La spina dice GIORNALE.» Si rigira il cappello tra le mani. «Non le chiedo di farlo. Le dico solo: c'è.»", "«Se chiama loro, domani lei è senza lavoro e io sotto processo. Lo dico perché si sappia che lo so.»"], "v");
    }
    if (who === "marta") {
      if (c === 2) {
        return line(["Non si alza. «Lei è quella di Milano. Mi hanno detto che avrebbero mandato una donna. Pensavano fosse una gentilezza.»",
          "«Guardi pure. L'hanno già guardato in tanti: il medico, i carabinieri, l'ingegnere. Tutti di fretta.» Indica il lenzuolo. «Lei, almeno, gli guardi le [[mani]].»",
          "«Io resto qui finché non lo chiudono. Poi non so.»"], "m");
      }
      if (c === 3) { return line(["«Sta trovando qualcosa. Si vede da come cammina: stamattina camminava come una che deve firmare.»", "«Non mi dica niente finché non è sicura. Di cose probabili ne ho già avute abbastanza.»"], "m"); }
      return line(["«Alle due», dice. «Me l'ha detto il sagrestano: alle due l'acqua arriva in cima. Ettore diceva: a quella quota, mai.»", "«Qualunque cosa decida, non la faccia per me. Io ho già perso. La faccia per quelli che dormono.»"], "m");
    }
    if (who === "bepi") {
      f.b1 = 1;
      if (c === 2) {
        return line(["«Tormen Giuseppe, guardiano. Lei è quella delle assicurazioni.» Sputa di lato, con educazione. «Le dico subito quello che ho detto ai carabinieri: l'ho trovato io, era morto, nevicava.»",
          "«Il coronamento d'inverno è una lastra, sì. Ma lui ci passava dieci volte al giorno, da quattro anni. Con le scarpe coi chiodi.» Guarda il [[parapetto]]. «E quel coso è alto così.»",
          "«Io ho un [[orologio]] che dice dov'ero. Gli altri non ce l'hanno.»"], "b");
      }
      if (c === 3) { return line(["«Sessanta gradini, poi dritto. Non tocchi il filo del pendolo: la sente anche se respira.»", "«Faccia presto. Col favonio, la sera, l'ingegnere viene a guardare il lago.»"], "b"); }
      return line(["È seduto al buio, accanto ai volantini. «Li sente? Ridono. Hanno portato lo spumante, per le due.»", "«Io sono qui. Il telefono è lì.» Indica l'apparecchio a muro. «Due-due.»"], "b");
    }
    if (who === "morandin") {
      if (f.offerta) { return [P("«Non ho fretta, signora. Ce l'ha l'acqua.» [[ACCETTA|accetta]] o [[RIFIUTA|rifiuta]].")]; }
      f.mo1 = 1;
      if (c === 2) {
        return line(["Si alza, ti porge la mano, ti indica la sedia: tre gesti in uno. «Signora Corvi. Sapevo che sarebbe venuta: mi sono permesso di farle trovare la camera calda.» Sorride. «Mi dica cosa le serve per chiudere.»",
          "«Malan è scivolato. C'è un [[fascicolo]]: verbale, inventario, fotografie. Lo legga con comodo. Siamo una società per azioni, signora: non abbiamo segreti, abbiamo protocolli.»",
          "«Posso dirle una cosa da ingegnere? Le dighe non cadono per i dubbi. Cadono per i ritardi.»"], "g");
      }
      if (c === 3) { return line(["«Ha girato molto, oggi. La chiesa, la baracca, il coronamento.» Non chiede cosa hai trovato. «Qui si vede tutto da tutte le finestre. È il bello delle valli strette.»", "«Stanotte, signora. Dopo stanotte parleremo con più calma.»"], "g"); }
      shown = S.t.g === 1 ? [IMG("m_quota", "L'asta, a due spanne dal segno")] : [];
      if (S.t.g === 1) { f.quota = 1; }
      return shown.concat(line(["«È venuta a vedere.» Sembra contento, sul serio. «Faccia come me: non guardi l'asta. Guardi il calcestruzzo. Non fa una piega.»" + (f.patto ? " Abbassa la voce. «Ha già chiamato Milano? No? Ha tempo fino a mezzanotte.»" : ""),
        "«Io questa valle l'ho vista al buio. Lampade a petrolio, la pellagra, i giovani in Belgio a morire in miniera. Adesso ha la strada, la luce, trecento stipendi.» Indica l'acqua. «Malan vedeva un versante. Io vedo questo. Se ha ragione lui, sono un assassino. Se ho ragione io, lui è morto per niente.» Si volta. «Capisce perché devo avere ragione io.»",
        "«Buonanotte, signora. Alle due brindiamo. È invitata, comunque vada la sua telefonata.»"], "g"));
    }
    if (who === "commissione") { return [P("Parlano tra loro di chilowattora e di una trattoria a Belluno. Tu sei una signora col cappello: non sei un dato.")]; }
    return [P("Parli da sola. Ti capita, ultimamente.")];
  }

  /* ---------- argomenti: CHIEDI A <chi> DI <cosa> ----------
     Ogni voce: [chiave, etichetta, parola da comando, funzione(c, f, fai)].
     La funzione restituisce la battuta, oppure null se l'argomento ora non c'è.
     Con fai = false si limita a dire se c'è; con fai = true può anche cambiare lo stato. */
  var TOPIC = { malan: "malan", ettore: "malan", geologo: "malan", marito: "malan", dottore: "malan",
    mani: "mani", corpo: "mani", morto: "mani", palme: "mani", occhiali: "occhiali",
    relazione: "relazione", carte: "relazione", rapporto: "relazione", fogli: "relazione",
    marcia: "marcia", montagna: "marcia", versante: "marcia", frana: "marcia", colpo: "marcia", crepa: "marcia",
    collaudo: "collaudo", quota: "collaudo", invaso: "collaudo", stanotte: "collaudo",
    societa: "societa", sima: "societa",
    morandin: "morandin", ingegnere: "morandin", direttore: "morandin",
    olga: "olga", padrona: "olga", centralinista: "olga",
    vescovi: "vescovi", giornalista: "vescovi", cronista: "vescovi", giornale: "giornale", redazione: "giornale", bortolo: "giornale",
    marta: "marta", vedova: "marta", moglie: "marta",
    bepi: "bepi", guardiano: "bepi", tormen: "bepi",
    polizza: "polizza", soldi: "polizza", suicidio: "polizza", clausola: "polizza", milano: "polizza", ferrante: "polizza", assicurazione: "polizza",
    cuffia: "cuffia", telefonata: "cuffia", telefonate: "cuffia", ascoltare: "cuffia", biglietto: "cuffia",
    scarichi: "scarichi", volantini: "scarichi", debiti: "debiti",
    sera: "sera", nardin: "sera", notte: "sera", linea: "linea", centralino: "linea", quadro: "linea", spine: "linea",
    paese: "paese", canonica: "paese", campane: "paese", campana: "paese", parroco: "paese",
    offerta: "offerta", posto: "offerta", ufficio: "offerta" };
  var DLG = {
    olga: [
      ["malan", "Malan", "malan", function (c) {
        if (c === 1) { return "«Il dottore? Mangiava qui, la sera. Minestra, mezzo di rosso, e una telefonata a casa: tre minuti, mai quattro.» Passa lo straccio sul banco. «L'ultima telefonata non era a casa.»"; }
        if (c === 2) { return "«L'ultima sera ha chiamato Roma. Il Ministero. Ha aspettato la linea quaranta minuti e ha parlato due.» Si accorge di aver detto quanto è durata, e con chi."; }
        if (c === 3) { return "«Lasciava la mancia sotto il piatto, come chi si vergogna di darla in mano. Era l'unico.»"; }
        return "«Quello che aveva da dire l'ha scritto. Adesso c'è solo da decidere a chi leggerlo.»";
      }],
      ["marcia", "la Marcia", "marcia", function (c, f) {
        if (c === 1) { return "«La montagna di là dal lago. Sulle carte ha un altro nome. Noi la chiamiamo così da prima della diga: i pali delle staccionate, lì, non duravano un inverno.»"; }
        if (c === 2 && f.notte) { return "«Il colpo di stanotte? La Marcia che si gira nel letto.» Lo dice come si dice di un parente difficile. «Da quando c'è l'acqua si gira più spesso.»"; }
        if (c === 3) { return "«Mio nonno diceva: lasciatela stare, la Marcia, che lei lascia stare voi. Poi sono arrivate le ruspe.»"; }
        return null;
      }],
      ["societa", "la Società", "societa", function (c) { return c <= 3 ? "«La Società ha portato la luce, la strada, e lo stipendio a mio fratello. Qui se ne parla bene.» Una pausa. «Ad alta voce.»" : null; }],
      ["vescovi", "Vescovi", "vescovi", function (c) { return c <= 3 ? "«Quello del giornale? Paga un caffè e sta seduto sei ore. La Società l'ha già querelato una volta. Dice che è una medaglia. Le medaglie, qui, non si mangiano.»" : null; }],
      ["morandin", "l'ingegnere", "morandin", function (c) { return c === 2 || c === 3 ? "«L'ingegnere è un signore. Saluta per primo, paga subito.» Abbassa la voce. «E telefona tutte le sere a Venezia, alla sede. Dice sempre le stesse due parole: tutto regolare.»" : null; }],
      ["marta", "la vedova", "vedova", function (c) { return c === 2 || c === 3 ? "«È arrivata con la corriera delle sette. Non ha voluto la camera: sta in chiesa, con lui. Le ho portato il caffè. Non l'ha toccato.»" : null; }],
      ["bepi", "Bepi", "bepi", function (c) { return c === 2 || c === 3 ? "«Il Bepi Tormen fa il guardiano da quando c'è qualcosa da guardare. Prima portava il sale dal passo, di notte, senza dazio. Conosce la montagna come io conosco le voci.»" : null; }],
      ["cuffia", "la cuffia", "cuffia", function (c, f, fai) {
        if (!f.biglietto || c < 2 || c > 3) { return null; }
        if (f.olgaSa) { return "«Mal di testa, le ho detto.» Quasi sorride."; }
        if (fai) { f.olgaSa = 1; }
        return "Le dici che ieri sera, al telefono con Milano, eravate in tre. Olga non arrossisce: non è il tipo.\n«Mio fratello fa il gruista al cantiere. Il posto telefonico me l'ha dato la Società, e la Società vuole sapere chi chiama chi.» Si toglie la cuffia dal collo e la posa sul banco, tra voi due. «D'ora in poi, quando telefona lei, avrò mal di testa.»";
      }],
      ["linea", "la linea", "linea", function (c) { return c === 4 ? "«Un filo solo, sul passo, e balla. Una chiamata: la seconda non gliela garantisco. E a mezzanotte la Direzione si prende il quadro.»" : null; }],
      ["paese", "la canonica", "canonica", function (c) { return c === 4 ? "«Il parroco ha il telefono in canonica e la corda della campana in sacrestia. Se suona a martello, qui escono tutti. È successo nel '44. Non per una bella cosa.»" : null; }]
    ],
    vescovi: [
      ["malan", "Malan", "malan", function (c) {
        if (c === 1) { return "«L'ho cercato tre volte. Due non c'era. La terza mi ha detto: scriva che la diga è un capolavoro. E poi: è vero, sa. È questo il guaio.»"; }
        if (c === 2) { return "«Un geologo che cade dalla diga che studia da quattro anni. In redazione direbbero: bel titolo. E la prova?»"; }
        if (c === 3) { return "«Ho chiesto in giro se aveva nemici. Mi hanno risposto tutti la stessa cosa: aveva ragione. Qui è peggio.»"; }
        return null;
      }],
      ["societa", "la Società", "societa", function (c) { return c <= 3 ? "«Mi hanno querelato l'anno scorso, per un pezzo sugli espropri. Assolto. Mi è costato due stipendi e la fidanzata.» Batte una lettera. «La prossima volta voglio carte, non voci.»" : null; }],
      ["marcia", "la Marcia", "marcia", function (c, f) {
        if (c === 1) { return "«Gli ingegneri dicono: assestamento. I vecchi dicono: la Marcia. Io scrivo “il versante sinistro”, e me lo tagliano.»"; }
        if (c === 2 && f.notte) { return "«L'ha sentito anche lei, alle quattro? Ho guardato l'ora e ho scritto: ore quattro, la montagna. Non è un articolo. È un appunto.»"; }
        return null;
      }],
      ["mani", "le mani", "mani", function (c, f, fai) {
        if (!f.mani || c < 2 || c > 3) { return null; }
        if (f.vescoviSa) { return "«È già dettato. Le parole, una volta partite, non le richiama nemmeno la signora Olga.»"; }
        if (fai) { f.vescoviSa = 1; }
        return "Gli dici delle mani. Vescovi smette di battere.\n«Palme pulite. Uno che non si è aggrappato.» Sfila il foglio dalla macchina e ne mette uno bianco. «Questo lo detto oggi. Corto, senza nomi: “Dubbi sulla morte del geologo”.»\nÈ troppo tardi per chiedergli di aspettare. Forse non volevi.";
      }],
      ["collaudo", "il collaudo", "collaudo", function (c) {
        if (c === 2 || c === 3) { return "«Stanotte. Di notte, capisce? Dicono che è per il carico della rete. Io dico che di notte non guarda nessuno.»"; }
        if (c === 4) { return "«Alle due l'acqua tocca il segno, la commissione firma, e da domani è una diga come le altre. A norma.»"; }
        return null;
      }],
      ["olga", "Olga", "olga", function (c) { return c <= 3 ? "«La signora Olga sente tutto e non dice niente. In un paese è una carica pubblica.»" : null; }],
      ["morandin", "Morandin", "morandin", function (c) { return c >= 2 ? "«Morandin è il migliore che hanno. Per questo fa paura: non mente. Ci crede.»" : null; }],
      ["giornale", "il giornale", "giornale", function (c) { return c === 4 ? "«La stenografia di notte risponde fino all'una. Chieda di Bortolo, dica che chiama per me. Detti piano: è sordo da un orecchio, e non dice quale.»" : null; }],
      ["relazione", "la relazione", "relazione", function (c, f) {
        if (c === 3) { return "«Se esiste, e se lei la trova, io ho una colonna e mezza. Di più non mi danno, per un morto solo.»"; }
        if (c === 4) { return f.patto ? "«L'ha data a loro.» Non è una domanda. «Allora mi resta la sua parola. Vale una lettera al direttore.»" : "«Me la detti stanotte, per telefono. Il passo è chiuso: in tipografia non arrivo prima di domani sera.» Poi: «Lo sa, cosa le costa?»\nLo sai."; }
        return null;
      }]
    ],
    marta: [
      ["malan", "suo marito", "malan", function (c) {
        if (c === 2) { return "«Ettore contava i passi. Dalla baracca alla diga, quattrocentododici. Uno che conta i passi non scivola.»"; }
        if (c === 3) { return "«Mi scriveva che la montagna gli parlava, e che lassù era l'unica a dirgli la verità.»"; }
        return "«Stanotte fanno quello che lui ha scritto di non fare. Lo so senza averlo letto.»";
      }],
      ["mani", "le mani", "mani", function (c, f, fai) {
        if (!f.mani) { return null; }
        if (f.martaKey) { return c === 2 ? "«Le ho dato la chiave. Non mi faccia pentire.»" : "«Le sue mani. Sì. Ci penso ogni volta che guardo le mie.»"; }
        if (fai) { f.martaKey = 1; S.loc.chiavetta = "inv"; }
        return "Le dici delle mani: le palme intatte, le unghie pulite. Uno che cade si aggrappa.\nMarta guarda le mani del marito come se le vedesse adesso. «Allora non è caduto», dice piano. «E non si è buttato.»\nApre la borsetta. Una busta strappata, e dentro una [[chiavetta]] piatta. «Me l'ha spedita una settimana fa, senza una riga. È della baracca, sopra la strada del lago. Un'altra volta mi aveva scritto: se mi succede qualcosa, non cercare in casa. Cerca dove la montagna scrive.»";
      }],
      ["polizza", "la polizza", "polizza", function (c) {
        if (c === 2) { return "«Quattro milioni. So cos'è venuta a fare: a dire che si è ammazzato, così non pagate.» Ti guarda senza odio, che è peggio. «Ho un figlio in collegio e l'affitto di marzo. Faccia il suo mestiere.»"; }
        return "«I soldi mi servono. Non mi vergogno. Ma prima voglio che qualcuno dica ad alta voce com'è morto.»";
      }],
      ["debiti", "i debiti", "debiti", function () { return "«Debiti, sì. Ha pagato di tasca sua due sondaggi che la Società non voleva fare. Li scriva pure, i debiti. Scriva anche per cosa.»"; }],
      ["morandin", "Morandin", "morandin", function () { return "«È venuto a farmi le condoglianze. Ha detto: suo marito era un uomo scrupoloso. L'ha detto come si dice un difetto.»"; }],
      ["relazione", "la relazione", "relazione", function (c, f) {
        if (c === 2) { return f.martaKey ? "«Scriveva tutto due volte. Una copia per la Società, una per sé. Quella per sé non so dov'è. Dove la montagna scrive: non so altro.»" : null; }
        if (c === 3) { return "«Dove la montagna scrive. Glielo ripeto perché non ho altro da darle.»"; }
        return f.patto ? "«Me l'hanno detto: avrò i miei soldi.» Si aggiusta la veletta. «Li prenderò. Non la ringrazio.»" : "«L'ha trovata.» Non chiede di leggerla. «Ne faccia quello che avrebbe fatto lui. Non quello che conviene a me.»";
      }],
      ["giornale", "il giornale", "giornale", function (c, f) { return f.vescoviSa && c >= 3 ? "«Me l'hanno detto: mio marito sta per diventare un titolo. Non me l'ha chiesto nessuno. Nemmeno lei.»" : null; }]
    ],
    bepi: [
      ["malan", "Malan", "malan", function (c) {
        if (c === 2) { return "«L'ho trovato al secondo giro, alle undici. Sotto il coronamento, dalla parte della gola, su un terrazzino del getto: trenta metri di volo. Faccia in su.» Si tocca il berretto. «Nevicava da un'ora. Sopra di lui, neve. Sotto, asciutto.»"; }
        if (c === 3) { return "«Veniva al casello a scaldarsi. Non parlava di sassi. Parlava di sua moglie.»"; }
        return "«Stanotte lo ammazzano un'altra volta. Con l'acqua.»";
      }],
      ["marcia", "la Marcia", "marcia", function (c, f) {
        if (c === 2) { return "«Io la guardo da quarant'anni. Prima stava ferma. Adesso, quando il lago sale, lei scende. Non ci vuole la laurea: ci vuole una finestra.»" + (f.notte ? " Indica l'altra riva. «Stanotte alle quattro ha buttato giù un pezzo grande come la chiesa. Stamattina il lago era color caffellatte.»" : ""); }
        if (c === 3) { return "«Col vento caldo beve neve e si fa pesante. Il dottore diceva: è un mazzo di carte bagnato, su un tavolo storto.»"; }
        return "«Senta.» Alza un dito. Non senti niente. «Appunto. Gli uccelli se ne sono andati alle sei.»";
      }],
      ["sera", "quella sera", "sera", function (c) {
        if (c === 2) { return "«Ho fatto il giro delle nove e quello delle undici. In mezzo ero al casello. Non ho visto niente.» Guarda l'orologio di ronda, che non mente e non parla."; }
        return "«Nardin, il capocantiere, e uno col cappotto lungo. Gliel'ho detto una volta. Non me lo faccia ridire.»";
      }],
      ["morandin", "l'ingegnere", "ingegnere", function (c) {
        if (c === 2) { return "«L'ingegnere mi dà del lei, e la mancia a Natale. È una brava persona. È questo che mi fa paura.»"; }
        return "«Lui dice: la diga tiene. E tiene, sacramento, tiene. Nessuno gli ha chiesto cosa fa l'acqua, quando la diga tiene.»";
      }],
      ["collaudo", "il collaudo", "collaudo", function (c) { return c === 2 ? "«Stanotte. Alle due l'acqua tocca il segno alto, il 715. Non c'è mai arrivata. Il dottore diceva che non ci doveva arrivare.»" : null; }],
      ["scarichi", "gli scarichi", "scarichi", function (c, f, fai) {
        if (c < 3) { return null; }
        if (fai) { f.scarichi = 1; }
        return "«Gli scarichi di fondo? Due volantini, due lucchetti. Le chiavi le abbiamo io e l'ingegnere.» Ci pensa. «Aperti tutti e due, il lago cala un metro l'ora. In una notte, dieci metri. E la Marcia si ferma: l'ha scritto il dottore, me l'ha fatto vedere col dito.»\n«E lei li aprirebbe?»\n«Se me lo ordina uno che poi firma.» Ti guarda le mani. «Il telefono del casello è il due-due. Io stanotte non dormo.»";
      }],
      ["relazione", "le carte", "carte", function (c, f) {
        if (c === 3) { return "«Dietro la cassetta del pendolo. Io non le ho mai aperte: so cosa c'è scritto, me lo diceva.»"; }
        if (c === 4) { return f.patto ? "«Le ha date a loro.» Guarda il coronamento, i riflettori. «L'ho vista da qui. Non dico niente. Ma l'ho vista.»" : "«Le ha lei. Bene. Sono le uniche carte, in questa valle, che non ha firmato un ingegnere.»"; }
        return null;
      }]
    ],
    morandin: [
      ["malan", "Malan", "malan", function (c) {
        if (c === 2) { return "«Il nostro geologo migliore. Scrupoloso fino all'ansia. Negli ultimi mesi vedeva frane dappertutto.» Si aggiusta i polsini. «Una disgrazia. Il coronamento, d'inverno, è una lastra.»"; }
        if (c === 3) { return "«Gli volevo bene, signora. Non ci crederà. Litigavamo come litigano due che guardano la stessa montagna.»"; }
        return "«Avrebbe dovuto essere qui, stanotte. Avrebbe visto che avevo ragione.»";
      }],
      ["mani", "le mani", "mani", function (c, f, fai) {
        if (!f.mani || c > 3) { return null; }
        if (f.offerta) { return "«Ne abbiamo già parlato, o ne parleremo. Non qui.»"; }
        if (f.morandinSa) { return "«Quello che dovevo dire l'ho detto. Una volta.»"; }
        if (fai) { f.morandinSa = 1; }
        return "Gli dici delle mani. Morandin non cambia faccia: cambia posto. Si siede.\n«Lei non è un medico.»\n«No. Ma ho visto cadere della gente.»\nGuarda il plastico della diga, a lungo. «Io ho chiesto che gli si parlasse. Che lo si convincesse ad aspettare il collaudo.» Più piano: «Non ho chiesto come.»";
      }],
      ["marcia", "la Marcia", "marcia", function (c, f) {
        if (c === 2) { return "«Il versante sinistro ha un movimento superficiale: noto, misurato, previsto. Si assesterà.»" + (f.notte ? " Sorride. «Il colpo di stanotte? Neve. Una slavina di fondo.»" : "") + " Indica il plastico. «Questa è la diga ad arco più alta d'Europa. Non la ferma un po' di ghiaia.»"; }
        return "«Se anche scendesse, scenderà a pezzi, in anni. È la previsione della Società.» Non dice: la mia.";
      }],
      ["collaudo", "il collaudo", "collaudo", function (c) {
        if (c === 2) { return "«Stanotte portiamo l'invaso a quota 715, il massimo. Alle due la commissione firma, e la valle ha la sua diga.» Ti guarda. «Mi serve che per allora non ci siano pratiche aperte. Non è una minaccia, signora. È un calendario.»"; }
        if (c === 3) { return "«Quota 715 alle due. L'acqua è puntuale: è l'unica, in Italia.»"; }
        return "«Ancora tre metri. Li vede? No. Appunto: l'acqua sale senza far rumore. È una virtù che ammiro.»";
      }],
      ["polizza", "la polizza", "polizza", function (c) { return c === 2 || c === 3 ? "«La sua Compagnia vuole un suicidio, immagino. A noi basta una disgrazia: l'indennità la paghiamo noi, la signora Malan non resta in mezzo a una strada, e nessuno deve scrivere parole brutte.» Sorride. «Vede che su una cosa siamo più generosi di voi.»" : null; }],
      ["vescovi", "Vescovi", "vescovi", function (c) { return c === 2 || c === 3 ? "«Il giornalista? Fa il suo mestiere, male. L'abbiamo querelato una volta: ci è costato più l'avvocato della soddisfazione.»" : null; }],
      ["bepi", "Bepi", "bepi", function () { return "«Tormen? Un buon guardiano. Vede molto, parla poco. È la combinazione che preferisco.»"; }],
      ["relazione", "la relazione", "relazione", function (c, f) {
        if (c === 2) { return "«Malan ha consegnato molte relazioni. Sono in archivio, a Venezia. Tutte lette, tutte protocollate.»"; }
        if (c === 3) { return f.offerta ? "«La leggerò di nuovo. Dopo il collaudo. Ha la mia parola.»" : "«Relazioni, relazioni. In questo paese si scrive troppo e si costruisce poco. Io costruisco.»"; }
        return f.patto ? "«È in buone mani. Dove non fa paura a nessuno.»" : "«La tenga pure. Stanotte l'acqua arriva al segno, la montagna resta dov'è, e domani quei fogli sono carta.»";
      }],
      ["offerta", "l'offerta", "offerta", function (c, f) { return f.offerta ? "«Un ufficio in Direzione, il doppio di quello che le dà Milano. E la vedova pagata entro il mese. Non sono parole: l'avvocato ha i fogli.»" : null; }]
    ]
  };
  var DLG_NO = { olga: "«Di questo non mi passa niente per le spine.»", vescovi: "«Su questo non ho nemmeno una voce.»", marta: "«Non lo so. Non so più molte cose.»", bepi: "«Io guardo l'acqua. Il resto non è roba mia.»", morandin: "«Non è materia della sua perizia, signora.»" };
  var DLG_ALIAS = { olga: { giornale: "vescovi", polizza: "cuffia" }, vescovi: { paese: "collaudo" }, marta: { occhiali: "mani", vescovi: "giornale" }, bepi: { occhiali: "sera", mani: "malan" }, morandin: { occhiali: "mani", giornale: "vescovi", societa: "collaudo" } };
  var PRON = { olga: "chiederle", marta: "chiederle" };

  function topicList(who) {
    var L = DLG[who], out = [], i;
    if (!L || (who === "olga" && (S.room === "centralino" || (S.ch === 1 && !S.f.olgaKey)))) { return []; }
    for (i = 0; i < L.length; i++) {
      if (L[i][3](S.ch, S.f, false) !== null) { out.push("[[" + L[i][1] + "|chiedi a " + who + " di " + L[i][2] + "]]"); }
    }
    if (!out.length) { return []; }
    return [NOTE("Puoi " + (PRON[who] || "chiedergli") + " di: " + out.join(" · "))];
  }
  function ask(who, key) {
    var L = DLG[who], i, s, f = S.f;
    S.moves++;
    if (!L) { S.moves--; return talkLine(who); }
    if (who === "olga" && S.room === "centralino") { S.moves--; return talkLine("olga"); }
    if (who === "morandin" && f.offerta && key !== "relazione" && key !== "offerta" && key !== "mani") { return [P("«Non ho fretta, signora. Ce l'ha l'acqua.» [[ACCETTA|accetta]] o [[RIFIUTA|rifiuta]].")]; }
    for (i = 0; i < L.length; i++) { if (L[i][0] === key && L[i][3](S.ch, f, false) !== null) { break; } }
    if (i === L.length && DLG_ALIAS[who] && DLG_ALIAS[who][key]) { key = DLG_ALIAS[who][key]; }
    for (i = 0; i < L.length; i++) {
      if (L[i][0] !== key) { continue; }
      s = L[i][3](S.ch, f, true);
      if (s !== null) { return [P(s)].concat(topicList(who)); }
    }
    return [P(DLG_NO[who])].concat(topicList(who));
  }
  function askParse(t) {
    var who = null, key = null, odd = false, i, n;
    n = noun(t[1]);
    /* «chiedi a bepi di …» quando Bepi non c'è */
    if (t.length > 2 && n && isNpc(n) && !npcHere(n)) { return { absent: true }; }
    for (i = 1; i < t.length; i++) {
      n = noun(t[i]);
      /* una parola vale come persona se nomina lei, non un argomento */
      if (!who && n && isNpc(n) && npcHere(n) && (!TOPIC[t[i]] || TOPIC[t[i]] === n)) { who = n; continue; }
      if (!key && TOPIC[t[i]]) { key = TOPIC[t[i]]; continue; }
      if (!TOPIC[t[i]] && !(n && isNpc(n))) { odd = true; }
    }
    if (!key && odd) { key = "?"; }
    if (!who) { who = firstNpc(); }
    return { who: who, key: key };
  }

  function give(item, who) {
    var c = S.ch, f = S.f;
    if (!has(item)) { return [P("Non ce l'hai.")]; }
    if (!who || !npcHere(who)) { return [P("A chi?")]; }
    if (who === "commissione") { return [P("Uno dei tre ti guarda il cappello, poi l'orologio. Non sei in programma.")]; }
    S.moves++;
    if (item === "lettera") {
      if (who === "olga") {
        if (c === 1 && !f.olgaKey) { S.moves--; return talkLine("olga"); }
        return [P("«L'ho già vista. Me l'avevano già letta, anzi.»")];
      }
      if (who === "vescovi") { return [P("«Perito liquidatore. Bel mestiere: arrivate sempre dopo.»")]; }
      if (who === "marta") { return [P("Non la prende. «So chi la manda.»")]; }
      if (who === "bepi") { return [P("«Io le intestazioni non le so leggere. So leggere le facce.» Legge la tua. Non dice cosa c'è scritto.")]; }
      return [P("La legge tutta, firma compresa. «La Vigile. Li conosco: pagano tardi.»")];
    }
    if (item === "occhiali") {
      if (who === "bepi") { return c === 2 ? confess() : [P("«Li tenga lei. Servono a far vedere, adesso.»")]; }
      if (who === "marta") { return [P("Li riconosce prima che tu apra la custodia. «Senza questi non trovava la porta di casa.» Li tiene un momento contro il cappotto, poi te li rende. «Li faccia vedere a chi l'ha trovato.»")]; }
      if (who === "morandin") {
        if (f.offerta) { return [P("«Lo so, signora. Lo so da prima di lei.»")]; }
        f.morandinSa = 1;
        return [P("«Dove li ha presi?»\n«Dov'erano.»\n«La baracca è proprietà della Società, signora.» Sugli occhiali non dice altro. È già una risposta: non ha chiesto di chi sono.")];
      }
      if (who === "vescovi") {
        if (c <= 3) { f.vescoviSa = 1; }
        return [P(c <= 3 ? "«Gli occhiali sul tavolo, e lui sotto il coronamento.» Scrive due righe a mano, in fretta. «Questo lo detto oggi.»\nNon gli avevi chiesto di scriverlo. Nemmeno di non scriverlo." : "«Li ho già messi in un pezzo. Stanotte serve altro.»")];
      }
      return [P("«Li puliva col tovagliolo, prima di mangiare. Tutte le sere.» Olga non li tocca.")];
    }
    if (item === "relazione") {
      if (who === "morandin") {
        if (f.offerta) { S.moves--; return resolveOffer(true); }
        return [P("«Troppo tardi per regalarmela, signora. Adesso mi serve che lei non l'abbia mai trovata.»")];
      }
      if (who === "vescovi") { return [P("La sfoglia in piedi, fino alla ricevuta. Fischia piano. «Di persona non arrivo in tipografia prima di domani sera: il passo è chiuso. Me la detti stanotte. La spina dice GIORNALE.»")]; }
      if (who === "marta") { return [P("Riconosce la calligrafia. La tiene un momento, senza leggere, poi te la rende. «Serve più a lei.»")]; }
      if (who === "bepi") { return [P("«Io i grafici non li so leggere. So leggere la montagna, e dice lo stesso.»")]; }
      return [P("«Non la voglio vedere», dice Olga. «Quello che non vedo non me lo possono chiedere.»")];
    }
    if (item === "sigarette") {
      if (who === "olga") { return [P("«Dietro il banco non si fuma. Lo dice la licenza.» Ne prende una e se la mette dietro l'orecchio, per dopo.")]; }
      if (who === "vescovi") { return [P("«Nazionali. Mi piace una donna che non fa finta.» La accende con un fiammifero di legno.")]; }
      if (who === "marta") { return [P("«In chiesa no.» Poi: «Lui fumava la pipa. La spegneva col pollice.»")]; }
      if (who === "bepi") { return [P("La prende, la spezza in due, ne mette metà nella pipa. «Grazie. L'altra metà è per le due.»")]; }
      return [P("«Non fumo, grazie. È l'unico vizio che mi manca.»")];
    }
    if (item === "chiavetta") { return [P(who === "marta" ? "«È sua, adesso. La usi.»" : "Meglio non farla vedere in giro.")]; }
    if (item === "chiavi" || item === "lampada") { return [P(who === "bepi" ? "«Dopo. Me le riporta dopo.»" : "Sono di Bepi. Meglio che non si sappia chi te le ha date.")]; }
    if (item === "chiave") { return [P("È la chiave della tua camera. Non interessa a nessuno.")]; }
    return [P("Non gli interessa.")];
  }

  /* ---------- immagini degli oggetti: si vedono ogni volta che li esamini ---------- */
  var PIC = { lettera: "Lettera d'incarico", sigarette: "Nazionali, quasi finite", chiave: "La chiave della 3", chiavetta: "Una busta, senza una riga", occhiali: "Gli occhiali di Malan",
    chiavi: "Le chiavi di Bepi", lampada: "Lampada a carburo", relazione: "La relazione Malan", telefono: "La cabina", banco: "La licenza", minestra: "Orzo e fagioli",
    macchina: "La macchina di Vescovi", stufa: "Maiolica", valigia: "La tua valigia", letto: "Il letto della 3", biglietto: "Carta intestata", orario: "Due corse al giorno",
    fontana: "La fontana", avviso: "Avviso di collaudo", campanile: "Il campanile", corpo: "Ettore Malan", mani: "Le mani", fascicolo: "Il verbale", plastico: "Il plastico",
    fotografia: "La prima pietra", lucchetto: "Il lucchetto della Società", lucchettoAperto: "Il lucchetto, aperto", scrivania: "Il cassetto", sismografo: "Il tracciato",
    lavagna: "Quota e millimetri", calendario: "Il 14, cerchiato", parapetto: "Un metro e venti", orologio: "Orologio di ronda", idrometro: "L'asta idrometrica", idrometro4: "Quota 712",
    scarichi: "Gli scarichi di fondo", portello: "Il portello del cunicolo", pendolo: "Il pendolo", spie: "Le spie di vetro", tubo: "Dietro la cassetta", tuboAperto: "Il tubo, aperto",
    tuboVuoto: "Il tubo, vuoto", quadro: "Il quadro", cuffia: "La cuffia di Olga", marcia: "La Marcia",
    olga: "Olga Dal Molin", vescovi: "Gino Vescovi", marta: "Marta Malan", bepi: "Bepi Tormen", morandin: "L'ingegner Morandin", commissione: "La commissione di collaudo" };
  function picFor(id) {
    var r = S.room, f = S.f;
    if (id === "stufa") { return r === "albergo" ? "stufa" : null; }
    if (id === "lucchetto" || id === "baraccaext") { return f.lucchetto ? "lucchettoAperto" : "lucchetto"; }
    if (id === "idrometro") { return S.ch === 4 ? "idrometro4" : "idrometro"; }
    if (id === "tubo") { return !f.tubo ? "tubo" : (S.loc.relazione === "tubo" ? "tuboAperto" : "tuboVuoto"); }
    if (id === "corpo" || id === "mani") { return S.ch === 4 ? null : id; }
    if (id === "lago") { return null; }
    if (id === "chiesaext") { return "campanile"; }
    if (id === "casello") { return "orologio"; }
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
      case "lettera": return [P("«La Vigile Assicurazioni, Milano. Si incarica la sig.ra Corvi Ada, perito liquidatore, di accertare le circostanze del decesso dell'assicurato Malan Ettore.» Il timbro è autentico. Anche tu, stavolta. È una sensazione nuova, e non del tutto piacevole.")];
      case "sigarette": return [P("Nazionali senza filtro: ne restano sei. E l'accendino a benzina, che ha fatto la guerra e Porto Scuro e funziona ancora. Tra voi due, è quello che è invecchiato meglio.")];
      case "chiave": return [P("Ferro, con una targhetta di legno e un 3 inciso a fuoco.")];
      case "chiavetta": return [P("Piatta, d'ottone, da lucchetto. Nella busta non c'era altro: né un saluto, né una riga. Uno che spedisce una chiave così ha paura delle parole." + (f.lucchetto ? "" : " Apre la baracca, sopra la strada del lago."))];
      case "occhiali":
        if (!has("occhiali")) { return [P("Una custodia di cartone pressato, aperta. Dentro, occhiali tondi da miope con le lenti spesse come fondi di bottiglia. Piegati con cura, le stanghette una sull'altra.\nNel verbale non ci sono. Sul morto nemmeno. Un uomo che vede a un metro non esce di notte sul ghiaccio lasciandoli qui: li lascia qui chi glieli toglie." + (S.loc.occhiali === "baracca" ? "\nConviene [[prenderli|prendi occhiali]]." : ""))]; }
        return [P("Gli occhiali di Malan, nella custodia. Lenti spesse, da miope forte. Erano piegati sul tavolo della baracca, e lui era trenta metri sotto il coronamento." + (c === 2 ? "\nL'ha trovato Bepi, il guardiano. Potresti [[mostrarglieli|mostra occhiali a bepi]]." : ""))];
      case "chiavi": return [P("Un anello di ferro, tre chiavi grosse e una targhetta di latta: CUNICOLO 2." + (f.portello ? "" : " Il portello è in fondo al coronamento."))];
      case "lampada": return [P("Una lampada da minatore, ad acetilene. Fa una luce bianca, cattiva, e un odore d'aglio. Nel cunicolo è l'unica cosa viva.")];
      case "relazione": return readReport();
      case "olga": return [P("Cinquant'anni portati dritti, i capelli raccolti, un grembiule con due tasche: in una le monete, nell'altra le spine di ricambio. La cuffia al collo non la toglie nemmeno per servire. Ti ha già pesata, e non ha detto il peso.")];
      case "vescovi": return [P("Trent'anni, magro, gli occhiali aggiustati col fil di ferro, una sciarpa che ha conosciuto giorni migliori e una fidanzata. Batte a macchina con due dita, in fretta, come uno che teme di essere interrotto.")];
      case "marta": return [P(c === 4 ? "Non si è mossa. Ha in grembo la borsetta e, sopra, le mani: le guarda, ogni tanto, come si guarda una prova." : "Quarant'anni, un cappotto nero che non è nuovo, una veletta. Siede dritta, come in una sala d'aspetto. Non ha gli occhi rossi: ha passato quel punto.")];
      case "bepi": return [P("Sessant'anni di freddo in faccia, baffi gialli di toscano, un berretto di lana calcato fino alle sopracciglia. Ha mani da uno che ha portato pesi di notte. Guarda il lago anche mentre guarda te.")];
      case "morandin": return [P(f.offerta ? "Fermo in mezzo al coronamento, le mani dietro la schiena. Il vento gli muove la sciarpa, e nient'altro. Sa aspettare: ha aspettato sei anni una diga." : "Cinquantacinque anni, un cappotto chiaro, una sciarpa bianca, mani curate. Ha l'aria di un chirurgo dopo un'operazione riuscita. Non è un cattivo: è un uomo che ha fatto i conti, e gli tornano.")];
      case "commissione": return [P("Tre signori del Genio Civile, cappotto, cappello, cartella. Guardano l'asta, l'orologio, l'asta. Uno ha già in mano la stilografica.")];
      case "avvocato": return [P("Giovane, pulito, una cartella di cuoio che costa quanto il casello di Bepi. Non ti guarda in faccia: guarda il tubo.")];
      case "telefono": return [P("Una cabina di abete con la porta a vetri e la scritta TELEFONO. Dentro, un apparecchio a muro senza disco: i numeri li fa Olga, di là dal banco. " + (c === 1 ? (f.telefonato ? "Milano è servita." : (f.cena && f.prenotata ? "Olga ti fa segno: Milano è in linea. [[ENTRA IN CABINA|usa telefono]]." : (f.prenotata ? "La linea è prenotata. Ci vuole pazienza, e c'è [[minestra]]." : "Per Milano bisogna [[chiedere la linea|usa telefono]]."))) : "Qualunque cosa tu dica lì dentro, la dici in tre."))];
      case "banco": return [P("Larice lucidato dai gomiti. Sopra, incorniciata, la licenza: «Dal Molin Olga. Mescita, alloggio, posto telefonico pubblico.» Tre mestieri, e in tutti e tre si ascolta.")];
      case "minestra": return [P(c === 1 ? "Orzo e fagioli, in una pentola che sta sul fuoco da stamattina. Ha un buon odore: [[PRENDI MINESTRA|prendi minestra]]." : "La pentola è vuota e capovolta. Di giorno c'è caffè d'orzo.")];
      case "macchina": return [P("Una portatile, con la E che salta. Nel rullo, un foglio: «LA DIGA», e sotto due righe cancellate con le X. Vescovi ci mette una mano sopra, senza fretta, come su un piatto.")];
      case "stufa": return [P(r === "baracca" ? "Una stufetta di ghisa, fredda da quattro giorni. Nella cenere, niente: Malan non era tipo da bruciare carte. Le nascondeva." : "Una stufa di maiolica verde, con la panca intorno. È il centro del paese più della piazza.")];
      case "biglietto":
        f.biglietto = 1;
        return [P("Carta intestata: «S.I.M.A. — Direzione lavori». Due righe a mano: «L'ing. Morandin sarà lieto di riceverla in Direzione. Per la sua pratica troverà tutto pronto.»\nLa tua pratica. Ieri sera ne hai parlato con una persona sola, in una cabina con la porta chiusa. Eravate in tre.")];
      case "valigia": return [P("Due cambi, le calze di lana e, sotto la fodera, lo spazio dove stava la pistola. L'hai lasciata a casa. Dopo Porto Scuro certe cose non le porti più; le altre vengono lo stesso." + (c >= 2 && f.biglietto ? "\nStavolta nessuno ci ha frugato. Non ne avevano bisogno: avevano il telefono." : ""))];
      case "finestra": return c === 1 ? [P("Il lago è una lastra nera. Di là, la montagna che in paese chiamano la Marcia: non una luce, non una casa. Solo neve, e sotto la neve qualcosa che aspetta.")] : [P("Di giorno la Marcia è un versante come un altro: abeti, ghiaioni, una malga abbandonata. Poi vedi che gli abeti sono tutti storti dalla stessa parte.")];
      case "letto": return [P("Un piumino alto mezzo metro e lenzuola che sanno di sapone. È il letto migliore che hai avuto in dieci anni, e l'ha pagato la Società.")];
      case "orario": return [P("Due corse: discesa alle 7.10, salita alle 18.40. «Il servizio è sospeso in caso di neve, frane, o per disposizione della Società.»")];
      case "bus": return [P(c === 1 ? "Due fanalini rossi che scendono i tornanti. Poi uno. Poi nessuno." : "Non c'è. Qui le cose arrivano due volte al giorno, quando arrivano.")];
      case "fontana": return [P("Una vasca di pietra con la data: 1811. Dalla cannella pende un ghiacciolo lungo un braccio. L'acqua, qui, d'inverno si ferma. Quella del lago no.")];
      case "avviso": return [P("«S.I.M.A. Si avvisa la popolazione che nella notte del 14 febbraio avrà luogo il collaudo dell'invaso alla quota massima di m 715. Nessun pericolo. La cittadinanza è invitata a non allarmarsi per eventuali rumori.»\nQualcuno, a matita, ha aggiunto: «e a non respirare».")];
      case "campanile": return [P(c === 4 ? "Una cuspide nera contro le stelle. La campana grossa, dice Olga, si sente fino alla diga." : "Più alto del paese che lo paga. La campana grossa suona a morto da quattro giorni, a mezzogiorno.")];
      case "chiesaext": return [P(c === 1 ? "Chiusa. Da una finestra bassa filtra un lume." : "Pietra grigia, una porta laterale accostata. Il freddo, lì dentro, è un'istituzione.")];
      case "albergoext": return [P("«Alla Posta. Mescita, alloggio, telefono pubblico.» L'unica insegna illuminata della valle, a parte quelle della Società.")];
      case "corpo":
        if (c === 4) { return [P("Hanno avvitato il coperchio. Sopra, un mazzo di rami d'abete: fiori, a febbraio, non ce ne sono.")]; }
        return [P("Quarantasette anni, il viso di uno che ha dormito poco per mesi e adesso recupera. L'hanno vestito col completo buono. Sul naso, due segni rossi: gli occhiali, che non ha.\nMarta non ti ferma. Ti guarda fare, come si guarda un idraulico. Sul lenzuolo, composte, le [[mani]].")];
      case "mani":
        if (c === 4) { return [P("Il feretro è chiuso. Le hai già viste. Bastava una volta.")]; }
        f.mani = 1;
        return [P("Gliele giri piano. Le palme sono intatte. Le unghie pulite, intere, tagliate corte.\nHai visto gente caduta, nel '44 e dopo. Chi cade da sveglio si aggrappa: al parapetto, al ghiaccio, all'aria. Si spella, si spezza le unghie. Queste sono le mani di uno che, quando è andato giù, non stava già più decidendo niente." + (f.martaKey ? "" : "\nMarta ti guarda. Aspetta che qualcuno glielo [[dica|chiedi a marta di mani]]."))];
      case "ceri": return [P("Quattro, di cera gialla. Li paga la Società: c'è il cartellino del fornitore.")];
      case "fascicolo":
        f.fascicolo = 1;
        return [P("Carpetta azzurra, intestata. Il verbale dei carabinieri: «caduta accidentale dal coronamento, fondo ghiacciato, ore 22 circa». La firma del guardiano, in stampatello.\nL'inventario: orologio, portafogli con lire 3.200, un fazzoletto, una pipa. Niente occhiali. Niente libretto di campagna: un geologo senza libretto è un prete senza breviario.\nMorandin ti guarda leggere. Non ha fretta: sa cosa c'è scritto, e cosa no.")];
      case "plastico": return [P("La diga del Gorgo in gesso e balsa, scala uno a cinquecento. Bella, bisogna dirlo: una vela di calcestruzzo tra due montagne. Sul versante sinistro il gesso è più nuovo: qualcuno ha rifatto un pezzo, di recente, liscio.")];
      case "fotografia": return [P("«Posa della prima pietra, 1951.» Un ministro con la cazzuola, un vescovo con l'aspersorio, Morandin più giovane con lo stesso cappotto. In seconda fila, mezzo coperto da un cappello altrui, un uomo magro con gli occhiali tondi che guarda da un'altra parte: verso la montagna.")];
      case "lago": return [P(c === 4 ? "Nero, liscio, senza un rumore. Sale di un dito ogni dieci minuti. L'acqua cheta, diceva tua madre. Non finiva mai il proverbio." : "Sei chilometri d'acqua ferma, dove sei anni fa c'erano prati, due mulini e un cimitero. Il cimitero l'hanno spostato. I mulini no.")];
      case "marcia": return [P(night() ? "Una massa nera, più nera del cielo. Non una luce. Ogni tanto, da quella parte, un rumore di sassi che rotolano e non arrivano mai in fondo." : "Vista da qui ha una riga chiara di traverso, a forma di M, lunga più di un chilometro: sopra la riga gli alberi stanno dritti, sotto sono tutti inclinati verso il lago, come gente che ascolta.")];
      case "digaext": return [P("Una parete bianca, curva, incastrata tra due montagne. Da qui sembra piccola. È l'effetto che fanno le cose molto grandi quando non c'è niente di umano vicino per misurarle.")];
      case "villa": return [P(c === 4 ? "Persiane chiuse, nessuna luce. La targa di ottone riflette la luna." : "Una villetta con le persiane verdi, i gerani finti e una targa di ottone: «S.I.M.A. — Direzione lavori». Il camino fuma da tutte e due le canne.")];
      case "baraccaext": return [P(f.lucchetto ? "Una baracca di assi d'abete, con una finestra sola. La porta è aperta: [[su]]." : "Una baracca di assi d'abete, con una finestra sola, sopra la strada. Sulla porta un [[lucchetto]] che luccica: è l'unica cosa nuova di tutto il versante.")];
      case "lucchetto": return [P(f.lucchetto ? "Aperto, appeso al chiodo. Marchiato S.I.M.A." : "Nuovo, grosso, marchiato S.I.M.A. L'hanno messo dopo: i cardini della porta sono vecchi di anni, lui di giorni." + (has("chiavetta") ? " La chiavetta di Marta è della sua misura: [[APRI|apri lucchetto]]." : " Ci vuole la sua chiave."))];
      case "scrivania": f.cassetto = 1; return [P("Un tavolo da disegno e un cassetto solo. La serratura è stata forzata con un cacciavite, da qualcuno che non aveva tempo per le buone maniere. Dentro: matite, un regolo, niente carte. Chi ha cercato qui cercava fogli, non oggetti: gli occhiali sul tavolo non li ha nemmeno spostati.")];
      case "sismografo": f.sismo = 1; return [P("Un tamburo che gira piano, un pennino, una striscia di carta. Per giorni la linea è piatta come un lago. Poi un dente, alto: alle quattro di stanotte. Più indietro ce ne sono altri, più bassi, uno ogni volta che il lago è salito di un gradino.\nNessuno lo guarda più da quattro giorni. Lui continua a scrivere.")];
      case "lavagna": f.lavagna = 1; return [P("Due colonne, in gesso. A sinistra «QUOTA», a destra «mm/giorno».\n680: 3. 700: 12. 710: 35.\nL'ultima riga dice 715, e nella colonna dei millimetri c'è un punto di domanda, ripassato tante volte che il gesso ha fatto il solco.")];
      case "calendario": return [P("Un calendario a blocchetto, omaggio di una fabbrica di esplosivi. È fermo all'8 febbraio. Più avanti, il 14 è cerchiato due volte, e sotto, in piccolo: «ore 2 — q. 715».")];
      case "carte": return [P("Sezioni del versante, a matita colorata. Strati inclinati tutti verso il lago, come tegole. In mezzo, una linea rossa che li taglia, liscia, continua. In margine: «piano di scivolamento?» Il punto di domanda è cancellato.")];
      case "parapetto": f.parapetto = 1; return [P("Calcestruzzo, largo due spanne, alto fino al tuo petto: un metro e venti. Su una lastra di ghiaccio si scivola, si cade seduti, ci si rompe un polso. Non si vola oltre un muro così. Oltre un muro così, qualcuno ti ci mette.\nDi là, la parete scende curva per centosessanta metri. A trenta, un terrazzino del getto.")];
      case "casello": return [P("Una stanza sola: una branda, una stufa, l'orologio di ronda al chiodo, un telefono a muro, e i due volantini degli scarichi, verniciati di rosso.")];
      case "orologio": return [P("Un orologio marcatempo, di quelli che il guardiano porta a tracolla: a ogni stazione del giro c'è una chiave, e la chiave buca un disco di carta. La notte dell'8: un buco alle 21.02, uno alle 23.05. In mezzo, due ore in cui Bepi non era sul coronamento, e la carta lo dimostra.\nÈ un alibi. Per lui.")];
      case "idrometro": return [P(c === 4 ? "L'acqua è a 712. Ogni dieci minuti uno dei signori si china col lapis. Tre metri, due ore." : "Un'asta smaltata, bianca e nera, avvitata al paramento. L'acqua è a 706. In cima, sopra l'ultima tacca, qualcuno ha dipinto in rosso: 715 MAX.")];
      case "scarichi": return [P("Due volantini di ghisa, grandi come ruote di carro, chiusi coi lucchetti. Sulla targa: SCARICO DI FONDO. Aprirli è un lavoro da guardiano, e una decisione da ingegnere." + (c >= 3 ? " Bepi li guarda come si guarda un cane che si conosce." : ""))];
      case "portello": return [P(f.portello ? "Aperto. Dentro, una scala di ferro che scende: [[giù]]." : "Lamiera chiodata, un catenaccio, la scritta CUNICOLO 2 a vernice. Entra nella spalla sinistra della diga: nella montagna, cioè." + (has("chiavi") ? " L'anello di Bepi ha la sua chiave: [[APRI|apri portello]]." : " Le chiavi le ha il guardiano."))];
      case "auto": return [P("Una 1100 nera, targa di Venezia, col motore acceso. Sul sedile dietro, una cassetta di spumante.")];
      case "pendolo":
        f.pendolo = 1;
        return [P("Un filo d'acciaio che scende dalla volta, con un peso in fondo, dentro una vaschetta d'olio: se la montagna si sposta, il filo no, e la differenza si legge su una scala. La punta è fuori dallo zero di undici millimetri. Sull'asse, a matita, le date: l'ultima è dell'8 febbraio.\nLa cassetta non tocca la roccia. Dietro, nello spazio di una mano, c'è un [[tubo]] di cartone.")];
      case "spie": return [P("Vetrini da microscopio, incollati col gesso di traverso alle crepe: se la crepa si allarga, il vetro si spezza. Accanto a ognuno, una data a matita. Sono spezzati tutti. Gli ultimi tre in una settimana.")];
      case "tubo":
        if (!f.tubo) { return [P("Un tubo portadisegni di cartone, col tappo di latta, cerato contro l'umido. Chi l'ha messo qui sapeva che nella baracca avrebbero cercato. [[APRI TUBO|apri tubo]].")]; }
        return [P(S.loc.relazione === "tubo" ? "Stappato. Dentro, arrotolata, la [[relazione]]." : "Vuoto.")];
      case "quadro": return [P("Venti prese, venti lampadine, una manovella. Sedici sono case del paese. Quattro hanno la targhetta scritta a mano da Olga: MILANO, GIORNALE, DIGA, CANONICA.\nL'ultima volta che ti sei seduta davanti a una cosa così avevi una pistola alla nuca. Stanotte no. Stanotte è peggio: sei libera." + (f.cuffia ? "" : "\nPer cominciare, la [[cuffia]]."))];
      case "cuffia": return [P(f.cuffia ? "Ce l'hai in testa. Pesa come pesavano le altre." : "Bachelite e panno, un microfono a cornetto. È ancora tiepida del collo di Olga. [[METTI LA CUFFIA|usa cuffia]].")];
      case "pendola": return [P("Mezzanotte meno un quarto. A mezzanotte, ha detto Olga, il quadro è della Direzione.")];
      case "neve": return [P(c >= 3 ? "Gocciola, cede, si stacca dai tetti a lastre. Sotto è marrone." : "Vecchia di tre giorni, con la crosta. Fa quel rumore sotto le scarpe.")];
    }
    return [P("Niente che ti serva.")];
  }

  function readReport() {
    if (!has("relazione")) { return [P("Dovresti averla in mano.")]; }
    S.f.relazione = 1;
    return [P("Carta millimetrata, e una calligrafia da farmacista.\nPrima pagina: «Versante sinistro, località la Marcia. Massa instabile: duecento milioni di metri cubi. Piano di scivolamento unico, continuo, inclinato verso l'invaso.»"),
      P("Poi la tabella della lavagna, completa. A quota 680 il versante fa tre millimetri al giorno. A 700, dodici. A 710, trentacinque. A 715 non c'è un numero: c'è una frase. «Non frana: scivola. Tutta insieme, in meno di un minuto. L'onda passa sopra il coronamento. La diga tiene.» E sotto, sottolineato due volte: «Non è la diga che cade.»"),
      P("L'ultimo foglio è una ricevuta: «Copia consegnata a mano all'ing. Morandin, 2 febbraio.» Più giù, a matita: «Dice che la rileggerà dopo il collaudo. Collaudo: notte del 14, quota 715 alle ore due.»\nL'ha scritto sei giorni prima di morire.")];
  }

  function act(verb, id, id2) {
    var r = S.room, c = S.ch, f = S.f;
    if (isNpc(id) && (verb === "esamina" || verb === "parla")) { return verb === "parla" ? talk(id) : (S.moves++, withPic(id, examine(id))); }
    switch (verb) {
      case "esamina": S.moves++; return withPic(id, examine(id));
      case "leggi":
        if (id === "relazione") { S.moves++; return readReport(); }
        if (id === "lettera" || id === "biglietto" || id === "fascicolo" || id === "avviso" || id === "orario" || id === "lavagna" || id === "calendario" || id === "sismografo" || id === "carte" || id === "banco" || id === "macchina" || id === "orologio") { S.moves++; return withPic(id, examine(id)); }
        return [P("Non c'è niente da leggere.")];
      case "prendi":
        if (id === "minestra") {
          if (c !== 1) { S.moves++; return [P(c === 4 ? "Olga ti versa un grappino senza che tu lo chieda. «Offre la casa. Stanotte non si fanno conti.»" : "Caffè d'orzo e pane di ieri. Scalda le mani, che è già qualcosa.")]; }
          S.moves++;
          if (f.cena) { return [P("Un'altra scodella. Olga te la riempie senza commenti: è il suo modo di farne.")]; }
          f.cena = 1;
          return [P("Orzo, fagioli, una crosta di formaggio in fondo. È la prima cosa calda da Milano. Mentre mangi, il giovanotto smette di battere e ti guarda mangiare, come uno che prende appunti." + (f.prenotata && !f.telefonato ? "\nAlla seconda cucchiaiata il quadro fa due squilli. «Milano in cabina», dice Olga. [[VAI AL TELEFONO|usa telefono]]." : ""))];
        }
        if (isItem(id)) {
          if (has(id)) { return [P("Ce l'hai già.")]; }
          S.loc[id] = "inv"; S.moves++;
          if (id === "occhiali") { return [P("Chiudi la custodia e la metti in tasca. È leggera. Pesa quello che pesa una prova." + (c === 2 ? "\nChi ha trovato il corpo dovrebbe [[vederli|mostra occhiali a bepi]]: è Bepi, il guardiano della diga." : ""))]; }
          if (id === "relazione") { return [P("Venti fogli arrotolati stretti, legati con uno spago. Li apri lì, alla luce della lampada, col filo del pendolo che ti trema sopra la testa.")].concat(readReport()); }
          return [P("Preso.")];
        }
        if (id === "fascicolo") { return [P("«Quello resta in Direzione», dice Morandin, senza alzare la voce. Non ne ha bisogno.")]; }
        if (id === "biglietto") { return [P("Lo lasci sul banco. Chi doveva leggerlo l'ha letto.")]; }
        if (id === "tubo") { return [P(f.tubo ? "Il tubo resti pure. Conta quello che c'era dentro." : "Prima va aperto: [[APRI TUBO|apri tubo]].")]; }
        if (id === "corpo" || id === "mani") { return [P("No.")]; }
        if (id === "cuffia") { return act("usa", "cuffia"); }
        return [P("Non è roba da portarsi via.")];
      case "lascia": return [P("Meglio tenerselo.")];
      case "apri":
        if (id === "lucchetto" || id === "baraccaext") {
          if (r !== "strada") { return [P("Non qui.")]; }
          if (f.lucchetto) { return [P("È già aperto.")]; }
          if (!has("chiavetta")) { return [P("Chiuso. È un lucchetto della Società: ci vuole la sua chiave, o una ragione migliore della tua.")]; }
          f.lucchetto = 1; S.moves++;
          return [IMG("o_lucchettoAperto", PIC.lucchettoAperto), P("La chiavetta di Marta entra nel lucchetto della Società come se non avesse mai fatto altro. Lo appendi al chiodo. La baracca è aperta: [[su]].")];
        }
        if (id === "portello") {
          if (f.portello) { return [P("È già aperto.")]; }
          if (!has("chiavi")) { return [P("Chiuso col catenaccio. Le chiavi le ha il guardiano.")]; }
          f.portello = 1; S.moves++;
          return [P("La chiave grossa gira con un lamento. Dal portello esce un fiato freddo, che sa di calce e di cantina. Accendi la lampada. Una scala di ferro scende nel buio: [[giù]].")];
        }
        if (id === "tubo") {
          if (f.tubo) { return [P("È già aperto.")]; }
          f.tubo = 1; S.loc.relazione = "tubo"; S.moves++;
          return [IMG("m_relazione", "Dove la montagna scrive"), P("Il tappo di latta viene via con uno schiocco. Dentro, arrotolati stretti, venti fogli di carta millimetrata: la [[relazione]].")];
        }
        if (id === "pendolo") { S.moves++; return withPic("pendolo", examine("pendolo")); }
        if (id === "valigia" || id === "scrivania" || id === "fascicolo") { S.moves++; return withPic(id, examine(id)); }
        if (id === "finestra") { return [P("Entra il freddo, e il rumore del lago: nessuno.")]; }
        if (id === "scarichi") { return act("usa", "scarichi"); }
        if (id === "relazione") { S.moves++; return readReport(); }
        if (id === "corpo") { return [P(c === 4 ? "È avvitato. Lascialo stare." : "È già aperto. Guardalo, piuttosto.")]; }
        if (id === "telefono") { return act("usa", "telefono"); }
        return [P("Non si apre.")];
      case "chiudi": return [P("Non serve.")];
      case "usa":
        if (isItem(id) && !has(id)) { return [P("Dovresti averlo in mano.")]; }
        if (id === "telefono") {
          if (c !== 1) { return [P(c === 4 ? "La cabina è spenta. Stanotte c'è una linea sola, e passa dal quadro, dietro il banco." : "Qualunque cosa tu dica in quella cabina, la dici in tre. E Ferrante ha detto di richiamare solo a pratica chiusa.")]; }
          if (f.telefonato) { return [P("Hai già chiamato. Ferrante non è uomo da due telefonate: la seconda la considera un'incertezza.")]; }
          if (!f.prenotata) {
            f.prenotata = 1; S.moves++;
            return [P("«Milano?» Olga infila una spina, gira la manovella, ascolta. «Mezz'ora, se il passo tiene. La chiamo io.»" + (f.cena ? "\nNon è mezz'ora. Sono cinque minuti: due squilli, e Olga alza un dito. «Milano in cabina.» [[VAI AL TELEFONO|usa telefono]]." : " Indica la pentola. «Intanto c'è [[minestra]].»"))];
          }
          if (!f.cena) { return [P("«Non è ancora Milano», dice Olga senza voltarsi. «È ancora [[minestra]].»")]; }
          f.telefonato = 1; S.moves++;
          return [IMG("m_chiamata", "Milano in cabina"), P("Chiudi la porta a vetri. Sul filo, un fruscio di neve, poi la voce di Ferrante, asciutta come un estratto conto.\n«Signora Corvi. Com'è il tempo?»\n«Nevica.»\n«Bene. La neve tiene la gente in casa. Senta: Malan Ettore, polizza vita, quattro milioni. Clausola undici: in caso di suicidio la Compagnia non deve niente. Aveva debiti, e una diga sulle spalle. Un uomo così, di notte, su un coronamento…»\n«Lei c'era?»\n«Io leggo le pratiche. Lei me ne porti una che si chiuda. E il posto in sede è suo.» Una pausa. «Non mi deluda. Non ha più l'età per essere una promessa.»\nRiattacca lui."),
            NOTE("Per tutta la telefonata Olga non si è tolta la cuffia.")];
        }
        if (id === "chiavetta") { return r === "strada" ? act("apri", "lucchetto") : [P("Apre un lucchetto solo: quello della baracca, sopra la strada del lago.")]; }
        if (id === "chiavi") { return r === "diga" ? act("apri", "portello") : [P("Qui non c'è niente che queste chiavi aprano.")]; }
        if (id === "chiave") { return r === "albergo" ? go("su") : [P("È la chiave della tre. Serve alla tre.")]; }
        if (id === "lampada") { return [P(r === "cunicolo" ? "È già accesa. Senza, qui sotto, saresti un rumore." : "Qui c'è luce abbastanza. La tieni per dove non ce n'è.")]; }
        if (id === "sigarette") { return [P(["Ne accendi una e la fumi a metà. È il tuo modo di pensare.", "Un'altra. Il fumo sale dritto, poi piega tutto dalla parte del lago. C'è un'aria che scende.", "Ne restano poche. Le conti. È un conto che torna sempre, almeno quello."][S.moves % 3])]; }
        if (id === "lettera") { return give("lettera", firstNpc()); }
        if (id === "occhiali") { return give("occhiali", firstNpc()); }
        if (id === "relazione") { S.moves++; return readReport(); }
        if (id === "cuffia" || id === "quadro") {
          if (f.cuffia) { return [P("Hai già la cuffia. Adesso serve una spina: " + SPINE + ".")]; }
          f.cuffia = 1; S.moves++;
          return [P("Ti siedi. La sedia gira, cigola, si ferma. Metti la cuffia, e il mondo diventa un fruscio: è un rumore che conosci, non l'hai mai dimenticato.\nQuattro spine, una linea.\n[[MILANO|chiama milano]]: Ferrante, e la pratica.\n[[GIORNALE|chiama giornale]]: lo stenografo di notte.\n[[DIGA|chiama diga]]: il casello di Bepi, e gli scarichi.\n[[CANONICA|chiama canonica]]: il parroco, e la campana.")];
        }
        if (id === "scarichi") { return [P("I volantini hanno due lucchetti, e le chiavi non sono tue. E poi: aprire gli scarichi è una cosa che fa un guardiano, non una passante." + (c >= 3 ? " Semmai è una cosa che un guardiano si fa [[chiedere|chiedi a bepi di scarichi]]." : ""))]; }
        if (id === "portello" || id === "lucchetto" || id === "tubo" || id === "valigia") { return act("apri", id); }
        if (id === "minestra") { return act("prendi", "minestra"); }
        if (id === "letto") { return sleep(); }
        if (id === "macchina") { return [P("Vescovi sposta la macchina di una spanna. «Ognuno la sua.»")]; }
        if (id === "pendolo") { return [P("Bepi ha detto di non toccarlo. Il filo sente anche il respiro.")]; }
        if (id === "campanile") { return [P("La corda è in sacrestia, e la sacrestia è del parroco.")]; }
        return [P("Non sai bene come.")];
      case "dai":
        if (id === "mani" && id2 && isNpc(id2)) { return ask(id2, "mani"); }
        if (isNpc(id) && id2 === "mani") { return ask(id, "mani"); }
        if (isNpc(id) && id2 && isItem(id2)) { return give(id2, id); }
        if (isItem(id)) {
          if (id2 && isNpc(id2)) { return give(id, id2); }
          return give(id, firstNpc());
        }
        return [P("Cosa, e a chi?")];
      case "parla": return [P("Non risponde. Le cose, qui, sono più discrete delle persone.")];
    }
    return [P("Non succede niente.")];
  }

  /* ---------- indizi: tre gradi, dal vago alla soluzione ----------
     Ogni voce: [chiave, vago, preciso, soluzione, stanza]. La soluzione vale nella stanza indicata:
     da un'altra stanza il terzo grado dice da che parte andare, un passo alla volta. */
  function toward(target) {
    var seen = {}, q = [[S.room, null]], cur, i, d, to;
    seen[S.room] = 1;
    while (q.length) {
      cur = q.shift();
      if (cur[0] === target) { return cur[1]; }
      for (i = 0; i < DIR_ORDER.length; i++) {
        d = DIR_ORDER[i]; to = EXITS[cur[0]][d];
        if (to && !seen[to]) { seen[to] = 1; q.push([to, cur[1] || d]); }
      }
    }
    return null;
  }
  var DIR_LABEL = { nord: "NORD", sud: "SUD", est: "EST", ovest: "OVEST", su: "SU", giu: "GIÙ" };
  function hintFor() {
    var c = S.ch, f = S.f;
    if (S.end) { return ["fine", "La storia è finita. Ce ne sono altre quattro, almeno.", "Al centralino le spine erano quattro. E a Morandin si poteva dire di sì oppure di no.", "[[RICOMINCIA CAPITOLO|ricomincia capitolo]], oppure CARICA un codice salvato prima della scelta."]; }
    if (c === 1) {
      if (!f.olgaKey) { return ["c1b", S.visited.albergo ? "Qui ti aspettavano. Più di quanto vorresti." : "Nevica, è notte, e la corriera è già ripartita.", S.visited.albergo ? "La donna al banco ha già la tua chiave: basta parlarle." : "In piazza, a est, c'è un albergo con le finestre accese. Lì qualcuno ti aspetta.", "[[PARLA CON OLGA|parla olga]].", "albergo"]; }
      if (!f.telefonato) {
        if (!f.prenotata) { return ["c1c", "Milano aspetta tue notizie, stasera.", "Il telefono dell'albergo passa dal centralino: la linea va chiesta.", "[[USA TELEFONO|usa telefono]].", "albergo"]; }
        if (!f.cena) { return ["c1d", "Mezz'ora di attesa, e una pentola sul fuoco.", "Olga ti ha indicato la minestra. La linea arriva mentre mangi.", "[[PRENDI MINESTRA|prendi minestra]].", "albergo"]; }
        return ["c1e", "Milano è in linea.", "La cabina è accanto alla porta dell'albergo.", "[[USA TELEFONO|usa telefono]].", "albergo"];
      }
      return ["c1f", "Per stasera hai fatto abbastanza.", "La camera 3 è sopra la sala dell'albergo, e hai la chiave.", "[[DORMI|dormi]].", "camera"];
    }
    if (c === 2) {
      if (has("occhiali")) { return ["c2e", "Occhiali piegati su un tavolo, e il loro padrone trenta metri sotto un coronamento.", "C'è un uomo che l'ha trovato, quella notte. Sta alla diga, a nord della strada del lago.", "[[MOSTRA OCCHIALI A BEPI|mostra occhiali a bepi]].", "diga"]; }
      if (f.lucchetto) { return ["c2d", "Nella baracca hanno cercato carte. Il tavolo non l'hanno guardato.", "Sul tavolo della baracca c'è una custodia da occhiali.", "[[PRENDI OCCHIALI|prendi occhiali]].", "baracca"]; }
      if (f.martaKey) { return ["c2c", "Hai la chiave di un lucchetto.", "La baracca del geologo è sopra la strada del lago, a nord della piazza.", "Sali alla baracca: la chiavetta apre il lucchetto.", "baracca"]; }
      if (f.mani) { return ["c2b", "Quello che hai visto, c'è una persona che ha diritto di saperlo.", "La vedova è in chiesa. Dille delle mani.", "[[CHIEDI A MARTA DELLE MANI|chiedi a marta di mani]].", "chiesa"]; }
      return ["c2a", "Prima di credere a una caduta, bisogna guardare chi è caduto.", "Il corpo di Malan è nella cappella della chiesa, a ovest della piazza. La vedova dice di guardargli le mani.", "[[ESAMINA MANI|esamina mani]].", "chiesa"];
    }
    if (c === 3) {
      if (f.offerta) { return ["c3f", "Morandin aspetta una risposta.", "Puoi dargli la relazione in cambio di un posto e dei soldi per la vedova, oppure tenerla.", "[[ACCETTA|accetta]] oppure [[RIFIUTA|rifiuta]]. Tutte e due le strade vanno avanti."]; }
      if (!f.portello) { return ["c3a", "Bepi ti ha dato le chiavi e una lampada.", "Il cunicolo si apre dal portello di ferro, in fondo al coronamento.", "[[APRI PORTELLO|apri portello]].", "diga"]; }
      if (!f.pendolo) { return ["c3b", "La montagna scrive sul pendolo.", "In fondo al cunicolo, sotto la diga, c'è la cassetta del pendolo. Guardala bene.", "[[ESAMINA PENDOLO|esamina pendolo]].", "cunicolo"]; }
      if (!f.tubo) { return ["c3c", "Dietro la cassetta del pendolo c'è qualcosa.", "Un tubo portadisegni, col tappo.", "[[APRI TUBO|apri tubo]].", "cunicolo"]; }
      if (!has("relazione")) { return ["c3d", "Il tubo è aperto.", "Dentro ci sono i fogli di Malan.", "[[PRENDI RELAZIONE|prendi relazione]].", "cunicolo"]; }
      return ["c3e", "Hai quello che cercavano tutti. Adesso bisogna tornare alla luce.", "Si esce da dove si è entrati: su per la scala.", "[[SU|su]].", "cunicolo"];
    }
    if (!f.cuffia) { return ["c4a", "Stanotte si decide con una telefonata. Una sola.", "Il centralino è all'albergo, dietro il banco: lì c'è una cuffia. Prima, se vuoi: Bepi e Morandin sono alla diga, Marta in chiesa, Vescovi e Olga all'albergo.", "[[USA CUFFIA|usa cuffia]].", "centralino"]; }
    return ["c4c", "Una linea, quattro spine. Chi deve sapere, stanotte?", "Milano vuole la pratica. Il giornale vuole le carte. Bepi può aprire gli scarichi. Il parroco può svegliare il paese. Nessuna è gratis.", "[[MILANO|chiama milano]], [[GIORNALE|chiama giornale]], [[DIGA|chiama diga]] o [[CANONICA|chiama canonica]]. Ognuna è un finale diverso.", "centralino"];
  }
  function hint() {
    var h = hintFor(), n, d, s;
    if (S.h.k !== h[0]) { S.h.k = h[0]; S.h.n = 0; }
    n = S.h.n;
    if (S.h.n < 2) { S.h.n++; }
    s = h[n + 1];
    if (n === 2 && h[4]) {
      d = S.room === h[4] ? null : toward(h[4]);
      s = d ? "Il posto giusto è: " + ROOM_NAME[h[4]] + ". Da qui, intanto: [[" + DIR_LABEL[d] + "|" + d + "]]. Lì: " + h[3] : "Qui: " + h[3];
    }
    return [NOTE("Indizio " + (n + 1) + " di 3"), P(s)].concat(n < 2 ? [NOTE("Se non basta: [[ANCORA|indizio]].")] : []);
  }

  var HELP = "COMANDI\nMuoversi: NORD, SUD, EST, OVEST, SU, GIÙ (anche N, S, E, O)\nGuardare: GUARDA, ESAMINA cosa, LEGGI cosa\nAgire: PRENDI, APRI, USA cosa. PARLA con chi. DAI o MOSTRA cosa a chi. CHIEDI A chi DI cosa\nNel momento giusto: DORMI, ACCETTA, RIFIUTA, CHIAMA chi\nLibro: SCHEDA, MAPPA, INVENTARIO, PROLOGO\nBloccata? [[INDIZIO|indizio]], anche più volte. FINALI dice quali hai trovato\nPartita: SALVA ti dà un codice, CARICA codice lo riprende, RICOMINCIA CAPITOLO, RICOMINCIA. STORIE torna all'elenco delle storie";

  function exec(input) {
    var m = /^\s*carica\b\s*(.*)$/i.exec(String(input));
    if (m) { return loadCode(m[1]); }
    var s = norm(input);
    if (!s) { return [P("Come?")]; }
    var t = tokens(s), w = t[0], verb, ids = [], id, i, n, q;

    verb = VERBS[w];
    if (S.end && !(verb === "aiuto" || verb === "indizio" || verb === "finali" || verb === "mappa" || verb === "scheda" || verb === "prologo" || verb === "ricomincia" || verb === "salva" || verb === "storie")) {
      return [P("La storia è finita. RICOMINCIA, oppure CARICA un codice.")];
    }
    if (DIRS[w] && t.length === 1) { return done(go(DIRS[w])); }
    if (!verb) {
      n = noun(w);
      if (n) { verb = isNpc(n) ? "parla" : "esamina"; t.unshift(verb); }
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
    if (verb === "aspetta") { S.moves++; return done([P(S.ch === 4 ? "Aspetti. L'acqua no." : (night() ? "Aspetti. Nevica, e basta." : "Aspetti. La valle fa finta di non guardarti."))]); }
    if (verb === "inventario") {
      var inv = inventory(), names = [];
      for (i = 0; i < inv.length; i++) { names.push(inv[i].label); }
      return [P(names.length ? "Hai con te: " + names.join(", ") + "." : "Non hai niente con te.")];
    }
    if (verb === "dormi") { return done(sleep()); }
    if (verb === "accetta" || verb === "rifiuta") {
      if (!S.f.offerta) { return [P("Nessuno ti ha chiesto niente. Per ora.")]; }
      return done(resolveOffer(verb === "accetta"));
    }
    if (verb === "chiama") {
      for (i = 1; i < t.length; i++) { if (DEST[t[i]]) { return done(call(t[i])); } }
      return done(call(""));
    }
    if (verb === "vai" || verb === "entra" || verb === "esci") {
      for (i = 1; i < t.length; i++) { if (DIRS[t[i]]) { return done(go(DIRS[t[i]])); } }
      if (verb === "entra" && S.room === "strada") { return done(go("su")); }
      if (verb === "entra" && S.room === "diga") { return done(go("giu")); }
      if (verb === "entra" && S.room === "piazza") { return done(go("est")); }
      if (verb === "entra" && S.room === "albergo" && t[1] === "cabina") { return done(act("usa", "telefono")); }
      if (verb === "esci") {
        n = { albergo: "ovest", camera: "giu", chiesa: "est", direzione: "ovest", baracca: "giu", cunicolo: "su", centralino: "ovest", diga: "sud" }[S.room];
        if (n) { return done(go(n)); }
      }
      return [P("In che direzione? NORD, SUD, EST, OVEST, SU o GIÙ.")];
    }
    if (verb === "chiedi" || verb === "parla") {
      q = askParse(t);
      if (verb === "chiedi" || (q.who && q.key)) {
        if (q.absent) { return [P("Non è qui.")]; }
        if (!q.who) { return [P("Non c'è nessuno a cui chiederlo.")]; }
        if (!q.key || q.who === "commissione") { return done(talk(q.who)); }
        return done(ask(q.who, q.key));
      }
    }
    if (verb === "guarda" && t.length === 1) { S.moves++; return done(describe(true)); }
    if (verb === "guarda") { verb = "esamina"; }

    for (i = 1; i < t.length; i++) { n = noun(t[i]); if (n && ids.length < 2 && n !== ids[0]) { ids.push(n); } }
    if (!ids.length && t.length > 1 && DIRS[t[1]]) { return done(go(DIRS[t[1]])); }
    if (!ids.length) {
      if (verb === "parla") { return done(talk(firstNpc())); }
      return [P(t.length > 1 ? "Non so cosa sia «" + t[1] + "»." : "Cosa, di preciso?")];
    }
    id = ids[0];
    if (id === "mappa") { return mapBlock(); }
    if (id === "scheda") { return sheet(); }
    if (id === "digaext" && S.room === "piazza") { return [P("Da qui non si vede: c'è di mezzo il paese. Si vede dalla fermata, e dalla strada del lago.")]; }
    if (!present(id)) { return [P(isNpc(id) ? "Non è qui." : "Qui non vedi niente del genere.")]; }
    if (ids[1] && !present(ids[1])) { ids[1] = null; }
    return done(act(verb, id, ids[1]));
  }

  function inventory() {
    var out = [], i, id, lab = { lettera: "lettera d'incarico", sigarette: "sigarette", chiave: "chiave della 3", chiavetta: "chiavetta", occhiali: "occhiali di Malan", chiavi: "chiavi di Bepi", lampada: "lampada", relazione: "relazione" };
    for (i = 0; i < ITEMS.length; i++) { id = ITEMS[i]; if (has(id)) { out.push({ word: id, label: lab[id] }); } }
    return out;
  }

  /* ---------- salvataggio: automatico nel browser, e a codice ---------- */
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var LOCS = ["none", "inv", "tubo"].concat(ROOMS);
  var TALK = ["o", "v", "m", "b", "g"];
  function idx(arr, v) { for (var i = 0; i < arr.length; i++) { if (arr[i] === v) { return i; } } return 0; }
  function encode() {
    var bits = [], i, out = "", sum = 0, v;
    function put(val, n) { for (var k = n - 1; k >= 0; k--) { bits.push((val >> k) & 1); } }
    /* il 2 in testa dice che il codice è di questa storia: quelli di Via Libera cominciano con 1 */
    put(2, 3); put(S.ch, 3); put(idx(ROOMS, S.room), 4); put(Math.min(S.moves, 1023), 10); put(S.end, 3);
    for (i = 0; i < ROOMS.length; i++) { put(S.visited[ROOMS[i]] ? 1 : 0, 1); }
    for (i = 0; i < FLAGS.length; i++) { put(S.f[FLAGS[i]] ? 1 : 0, 1); }
    for (i = 0; i < ITEMS.length; i++) { put(idx(LOCS, S.loc[ITEMS[i]]), 4); }
    for (i = 0; i < TALK.length; i++) { put(S.t[TALK[i]], 2); }
    for (i = 0; i < FLAGS_B.length; i++) { put(S.f[FLAGS_B[i]] ? 1 : 0, 1); }
    while (bits.length % 5) { bits.push(0); }
    for (i = 0; i < bits.length; i += 5) {
      v = bits[i] * 16 + bits[i + 1] * 8 + bits[i + 2] * 4 + bits[i + 3] * 2 + bits[i + 4];
      sum = (sum * 7 + v + 3) % 32; out += ALPHA.charAt(v);
    }
    out += ALPHA.charAt(sum);
    return out.replace(/(.{4})(?=.)/g, "$1-");
  }
  var otherStory = false;
  function decode(code) {
    var s = String(code).toUpperCase().replace(/[^A-Z0-9]/g, ""), bits = [], i, v, sum = 0, p = 0, o;
    function get(n) { var val = 0; for (var k = 0; k < n; k++) { val = val * 2 + (bits[p++] || 0); } return val; }
    otherStory = false;
    if (s.length < 10) { return null; }
    for (i = 0; i < s.length - 1; i++) {
      v = ALPHA.indexOf(s.charAt(i)); if (v < 0) { return null; }
      sum = (sum * 7 + v + 3) % 32;
      bits.push((v >> 4) & 1, (v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1);
    }
    if (ALPHA.charAt(sum) !== s.charAt(s.length - 1)) { return null; }
    v = get(3);
    if (v !== 2) { otherStory = v === 1; return null; }
    o = fresh(); o.visited = {};
    o.ch = get(3); o.room = ROOMS[get(4)]; o.moves = get(10); o.end = get(3);
    if (o.ch < 1 || o.ch > 4 || !o.room || o.end > 5) { return null; }
    for (i = 0; i < ROOMS.length; i++) { if (get(1)) { o.visited[ROOMS[i]] = 1; } }
    for (i = 0; i < FLAGS.length; i++) { if (get(1)) { o.f[FLAGS[i]] = 1; } }
    for (i = 0; i < ITEMS.length; i++) { v = LOCS[get(4)]; if (!v) { return null; } o.loc[ITEMS[i]] = v; }
    for (i = 0; i < TALK.length; i++) { o.t[TALK[i]] = get(2); }
    for (i = 0; i < FLAGS_B.length; i++) { if (get(1)) { o.f[FLAGS_B[i]] = 1; } }
    o.visited[o.room] = 1;
    return o;
  }
  function loadCode(code) {
    if (!code || !/\S/.test(code)) { return [P("CARICA e poi il codice, per esempio: CARICA ABCD-EFGH-…")]; }
    var o = decode(code);
    if (!o) { return [P(otherStory ? "Quel codice è di «Via Libera», l'altra storia. Per usarlo: [[STORIE|storie]]." : "Quel codice non torna. Controlla le lettere: non ci sono O, I, 0 né 1.")]; }
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
    title: "Acqua Cheta",
    start: start, exec: exec, prologue: prologue, inventory: inventory,
    look: function () { return describe(false); },
    exits: function () {
      var out = [], i, d;
      if (S.end) { return out; }
      for (i = 0; i < DIR_ORDER.length; i++) {
        d = DIR_ORDER[i];
        if (!EXITS[S.room][d]) { continue; }
        if (S.f.offerta && d !== "sud") { continue; }
        if (S.room === "diga" && d === "giu" && !S.f.portello) { continue; }
        if (S.room === "albergo" && d === "su" && S.ch === 4) { continue; }
        if (S.room === "albergo" && d === "est" && S.ch !== 4) { continue; }
        out.push(d);
      }
      return out;
    },
    status: function () { return { room: ROOM_NAME[S.room], moves: S.moves, ch: S.ch, end: S.end }; },
    isDir: function (w) { return !!DIRS[norm(w)]; }
  };
})();
