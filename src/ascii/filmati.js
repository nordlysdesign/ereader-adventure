/* ==================================================================
   PROVA PER TELEFONO: i filmati.
   Un filmato è una fila di inquadrature. Ogni inquadratura ha una
   scena, uno stato e una camera che cambiano col tempo, e una
   didascalia che si scrive da sola. Si va avanti da soli, o con un
   tocco. u = secondi dall'inizio dell'inquadratura, tt = dall'inizio
   del filmato. I suoni (cue) partono a un tempo del filmato.
   ================================================================== */
var AsciiFilms = (function () {
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
      { scene: "camera3", text: lines[1], st: st, cam: function (u) { var k = ease(u, 6); return [mix(47, 50, k), mix(22, 22, k), mix(1.2, 1.5, k)]; } },
      { scene: "camera3", text: lines.slice(2).join(" "), st: st, cam: function (u) { var k = ease(u, 6); return [mix(50, 52, k), mix(22, 27, k), mix(1.5, 1.8, k)]; } }
    ] };
  }
  return { prologo: prologo, m_chiamata: chiamata, m_colpo: colpo };
})();
