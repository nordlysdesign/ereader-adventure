/* ==================================================================
   PER TELEFONO: «Acqua Cheta» (per ora il solo capitolo 1).
   Quello che l'interfaccia a tocchi deve sapere di una storia: quale
   scena sta in quale stanza, i filmati, i suoni. Il motore resta
   quello di sempre.
   Un filmato è una fila di inquadrature: scena, stato e camera che
   cambiano col tempo, e una didascalia che si scrive da sola.
   u = secondi dall'inizio dell'inquadratura, tt = dall'inizio del
   filmato. I suoni (cues) partono a un tempo del filmato.
   ================================================================== */
var AsciiStory = (function () {
  "use strict";
  var mix = Ascii.mix, smooth = Ascii.smooth;
  function ease(u, d) { return smooth(0, d, u); }

  /* il prologo: la corriera che sale, Ada che resta, poi il coronamento della notte dell'8 */
  function prologo(pages) {
    var a = pages[0].split("\n\n"), b = pages[1].split("\n\n");
    return { name: "prologo", cues: [{ t: 0.2, snd: "corriera" }], steps: [
      { scene: "fermata", text: a[0], st: function (u) { return { bus: Math.max(0.02, 1 - u / 10), noAda: true }; }, cam: function (u) { var k = ease(u, 11); return [42, mix(27, 28, k), mix(1.7, 1, k)]; } },
      { scene: "fermata", text: a[1], st: function (u) { return { bus: u / 15 }; }, cam: function () { return [42, 28, 1]; }, snd: "riparte" },
      { scene: "digaMorto", text: b[0], st: function () { return {}; }, cam: function (u) { var k = ease(u, 14); return [mix(42, 50, k), mix(28, 36, k), mix(1, 1.35, k)]; } },
      { scene: "digaMorto", text: b[1], st: function () { return {}; }, cam: function (u) { var k = ease(u, 14); return [mix(50, 56, k), mix(36, 42, k), mix(1.35, 1.7, k)]; } }
    ] };
  }
  /* la telefonata: una battuta per inquadratura; alla fine la camera va su chi ascolta */
  function chiamata(text, note) {
    var lines = text.split("\n"), steps = [], i;
    for (i = 0; i < lines.length; i++) {
      (function (i) {
        var last = i === lines.length - 1;
        steps.push({ scene: "m_chiamata", text: lines[i], st: function () { return {}; },
          cam: function (u) { var k = ease(u, 3); return last ? [mix(30, 64, k), mix(30, 32, k), mix(1.15, 1.7, k)] : (i === 0 ? [mix(42, 28, k), mix(28, 32, k), mix(1, 1.2, k)] : [28 + (i % 2) * 2, 32, 1.2]); } });
      })(i);
    }
    if (note) { steps.push({ scene: "m_chiamata", text: note, st: function () { return {}; }, cam: function () { return [64, 32, 1.7]; } }); }
    return { name: "chiamata", loop: "linea", cues: [], steps: steps };
  }
  /* il colpo: comincia tre secondi dopo l'inizio, qualunque cosa si stia leggendo */
  function colpo(text) {
    var lines = text.split("\n");
    function st(u, tt) { return { buio: true, colpo: tt > 3 ? tt - 3 : undefined }; }
    return { name: "colpo", cues: [{ t: 4.2, snd: "colpo" }], steps: [
      { scene: "camera3", text: lines[0], st: st, cam: function (u) { var k = ease(u, 5); return [mix(42, 47, k), mix(28, 22, k), mix(1, 1.2, k)]; }, min: 7 },
      { scene: "camera3", text: lines[1] || "", st: st, cam: function (u) { var k = ease(u, 6); return [mix(47, 50, k), mix(22, 22, k), mix(1.2, 1.5, k)]; } },
      { scene: "camera3", text: lines.slice(2).join(" "), st: st, cam: function (u) { var k = ease(u, 6); return [mix(50, 52, k), mix(22, 27, k), mix(1.5, 1.8, k)]; } }
    ].filter(function (s) { return s.text; }) };
  }
  var ROOM = { "Fermata della corriera": "fermata", "Piazza della Pieve": "pieve", "Albergo «Alla Posta»": "osteria", "Camera 3": "camera3" };

  return {
    /* fin dove si gioca in questo stile: dopo, la prova si chiude col filmato del colpo */
    trial: 1,
    scene: function (room) { return ROOM[room] || "fermata"; },
    map: "mappa",
    prologo: prologo,
    /* un filmato comincia da una tavola del motore: riceve i blocchi del turno e l'indice della tavola,
       e dice quali blocchi si è preso (take) e cosa dire dopo */
    films: {
      m_chiamata: function (blocks, i) {
        var note = blocks[i + 2] && blocks[i + 2].t === "note" ? blocks[i + 2].s : "";
        return { def: chiamata(blocks[i + 1].s, note), take: note ? 3 : 2, after: "Esci dalla cabina. Olga sta già guardando altrove." };
      },
      m_colpo: function (blocks, i) { return { def: colpo(blocks[i + 1].s), take: 2 }; }
    },
    /* l'ambiente: quanto vento, quanta sala, quanta pioggia, da 0 a 1 */
    ambience: function (room) {
      if (/Albergo/.test(room)) { return { vento: 0.12, sala: 1, pioggia: 0 }; }
      if (/Camera/.test(room)) { return { vento: 0.35, sala: 0, pioggia: 0 }; }
      return { vento: 1, sala: 0, pioggia: 0 };
    },
    /* i rumori che capitano ogni tanto, stanza per stanza */
    random: function (room) { return /Albergo/.test(room) ? ["macchina", "legna"] : []; },
    /* parole del testo che fanno partire un suono */
    cues: [[/Milano in cabina/, "squillo"]]
  };
})();
