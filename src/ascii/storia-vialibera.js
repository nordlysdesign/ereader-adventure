/* ==================================================================
   PER TELEFONO: «Via Libera», tutta. Stanze, filmati, suoni.
   Stessa forma di storia-acqua.js.
   ================================================================== */
var AsciiStory = (function () {
  "use strict";
  var mix = Ascii.mix, smooth = Ascii.smooth;
  function ease(u, d) { return smooth(0, d, u); }
  function none() { return {}; }
  function still() { return [42, 28, 1]; }

  /* il prologo: il golfo sotto la pioggia, poi la spiaggia del '44 */
  function prologo(pages) {
    var a = pages[0].split("\n\n"), b = pages[1].split("\n\n");
    return { name: "prologo", cues: [{ t: 0.3, snd: "sirena" }], steps: [
      { scene: "faro", text: a[0], st: none, cam: function (u) { var k = ease(u, 12); return [mix(60, 42, k), mix(20, 28, k), mix(1.8, 1, k)]; } },
      { scene: "faro", text: a[1], st: none, cam: still },
      { scene: "cala44", text: b[0], st: none, cam: function (u) { var k = ease(u, 14); return [42, mix(28, 32, k), mix(1, 1.3, k)]; } },
      { scene: "cala44", text: b[1], st: none, cam: function (u) { var k = ease(u, 14); return [mix(42, 46, k), mix(32, 34, k), mix(1.3, 1.6, k)]; } }
    ] };
  }
  /* una battuta per inquadratura, con la camera che si stringe piano */
  function battute(name, scene, text, o) {
    o = o || {};
    var lines = text.split("\n").filter(function (s) { return s; }), steps = [], i;
    for (i = 0; i < lines.length; i++) {
      (function (i) {
        steps.push({ scene: scene, text: lines[i], st: o.st || none, min: o.min,
          cam: function (u) { var k = ease(u, 5), z = 1 + 0.12 * Math.min(i, 4); return [mix(42, o.cx || 42, k * (i ? 1 : 0.6)), mix(28, o.cy || 28, k * (i ? 1 : 0.6)), mix(z, z + 0.1, k)]; } });
      })(i);
    }
    if (o.note) { steps.push({ scene: scene, text: o.note, st: o.st || none, cam: function () { return [o.nx || 42, o.ny || 28, 1.6]; } }); }
    return { name: name, loop: o.loop, cues: o.cues || [], steps: steps };
  }
  /* un finale: prima il segnale dal faro, poi quello che ne viene */
  function finale(tx, fin, text) {
    var lines = text.split("\n").filter(function (s) { return s; }), steps = [], i;
    for (i = 0; i < lines.length; i++) {
      (function (i) {
        steps.push(i === 0 ?
          { scene: tx, text: lines[0], st: none, min: 9, cam: function (u) { var k = ease(u, 8); return [mix(42, 58, k), mix(28, 22, k), mix(1, 1.5, k)]; } } :
          { scene: fin, text: lines[i], st: none, cam: function (u) { var k = ease(u, 10), z = 1 + 0.1 * Math.min(i - 1, 4); return [42, 28, mix(z, z + 0.12, k)]; } });
      })(i);
    }
    return { name: "finale", cues: [], steps: steps };
  }
  function night(ch) { return ch === 1 || ch === 4; }
  var ROOM = {
    "Molo dei piroscafi": function (ch) { return night(ch) ? "faro" : "moloGiorno"; },
    "Piazza della Dogana": function (ch) { return night(ch) ? "piazza" : "piazzaGiorno"; },
    "Locanda «Al Fanale»": function (ch) { return ch <= 2 ? "bar" : "barVuoto"; },
    "Camera 7": function (ch) { return night(ch) ? "camera" : "cameraGiorno"; },
    "Polizia portuale": function () { return "caserma"; },
    "Sentiero del faro": function (ch) { return night(ch) ? "strada" : "stradaGiorno"; },
    "Casa del guardiano": function () { return "casa"; },
    "Ai piedi del faro": function (ch) { return night(ch) ? "torre" : "torreGiorno"; },
    "Sala della lanterna": function (ch) { return ch === 4 ? "lente4" : "lente"; },
    "Cala del Morto": function () { return "cala"; }
  };

  return {
    trial: 0,
    scene: function (room, ch) { return ROOM[room] ? ROOM[room](ch) : "faro"; },
    map: "mappaVL",
    prologo: prologo,
    films: {
      m_telefono: function (blocks, i) {
        var note = blocks[i + 2] && blocks[i + 2].t === "note" ? blocks[i + 2].s : "";
        return { def: battute("telefonata", "m_telefono", blocks[i + 1].s, { loop: "linea", note: note, cx: 36, cy: 30, nx: 62, ny: 30, cues: [{ t: 0.1, snd: "gettone" }] }), take: note ? 3 : 2, after: "Riappendi. Il gettone non torna indietro." };
      },
      /* la notte tra il capitolo 1 e il 2: due lampi, e uno */
      finestra21: function (blocks, i) { return { def: battute("notte", "finestra21", blocks[i + 1].s, { cx: 50, cy: 24, min: 6 }), take: 2 }; },
      tx13: function (b, i) { return fin(b, i); }, tx21: function (b, i) { return fin(b, i); }, tx22: function (b, i) { return fin(b, i); }, tx31: function (b, i) { return fin(b, i); }
    },
    ambience: function (room, ch) {
      var piove = ch === 1 || ch === 2 ? 1 : (ch === 3 ? 0 : 0);
      if (/Locanda/.test(room)) { return { vento: 0.08, sala: 1, pioggia: piove * 0.25 }; }
      if (/Camera|Polizia|Casa/.test(room)) { return { vento: 0.2, sala: 0.25, pioggia: piove * 0.45 }; }
      if (/Sala della lanterna/.test(room)) { return { vento: 0.7, sala: 0.3, pioggia: piove * 0.3 }; }
      return { vento: /faro|Sentiero|Cala/.test(room) ? 1 : 0.6, sala: 0, pioggia: piove };
    },
    random: function (room, ch) {
      if (/Locanda/.test(room)) { return ["legna", "bicchiere"]; }
      if (/Molo|Cala/.test(room)) { return ["sirena", "onda"]; }
      if (/Sala della lanterna/.test(room) && ch !== 4) { return ["scatto"]; }
      if (/Polizia/.test(room)) { return ["macchina"]; }
      return [];
    },
    cues: [[/Paghi con un biglietto grosso/, "gettone"], [/La chiave grossa gira/, "ferro"], [/La chiavetta d'ottone entra/, "ferro"], [/Sposti la leva su MANUALE/, "scatto"]]
  };
  function fin(blocks, i) {
    var f = blocks[i + 2] && blocks[i + 2].t === "img" ? blocks[i + 2].id : blocks[i].id;
    return { def: finale(blocks[i].id, f, blocks[i + 1].s), take: f === blocks[i].id ? 2 : 3 };
  }
})();
