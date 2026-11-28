/* ==================================================================
   PROVA PER TELEFONO: il suono. Tutto sintetizzato, nessun file.
   Parte al primo tocco (i telefoni non lasciano fare altrimenti), si
   spegne dal menu, e la scelta resta in memoria.
   ================================================================== */
var Suono = (function () {
  "use strict";
  var ac = null, master = null, on = true, noiseBuf = null, amb = {}, loops = {}, KEY = "acquacheta-ascii.suono", room = "";
  try { on = localStorage.getItem(KEY) !== "no"; } catch (e) { on = true; }

  function init() {
    var AC = window.AudioContext || window.webkitAudioContext, d, i, last = 0;
    if (ac || !AC) { if (ac && ac.state === "suspended") { ac.resume(); } return; }
    try {
      ac = new AC(); master = ac.createGain(); master.gain.value = on ? 0.9 : 0; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); d = noiseBuf.getChannelData(0);
      for (i = 0; i < d.length; i++) { d[i] = Math.random() * 2 - 1; }
      /* vento: rumore in una banda che si sposta piano */
      amb.vento = band(520, 0.7, 0); lfo(amb.vento.f.frequency, 0.11, 260); lfo(amb.vento.g.gain, 0.07, 0.012);
      /* la sala: un fondo basso, caldo */
      amb.sala = band(140, 0.5, 0);
      setRoom(room);
    } catch (e) { ac = null; }
  }
  function src() { var s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(0, Math.random() * 1.5); return s; }
  function band(freq, q, gain, type) {
    var s = src(), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = type || "bandpass"; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
    s.connect(f); f.connect(g); g.connect(master);
    return { s: s, f: f, g: g };
  }
  function lfo(param, hz, depth) { var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = hz; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); }
  function ramp(param, v, sec) { var n = ac.currentTime; param.cancelScheduledValues(n); param.setValueAtTime(param.value, n); param.linearRampToValueAtTime(v, n + (sec || 0.8)); }
  /* un colpetto di rumore: tasti, legna, vetri */
  function click(freq, dur, gain, when) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), n = ac.currentTime + (when || 0);
    s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 2;
    g.gain.setValueAtTime(gain, n); g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(n, Math.random()); s.stop(n + dur + 0.02);
  }
  function tone(type, f0, f1, dur, gain, when) {
    var o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime + (when || 0);
    o.type = type; o.frequency.setValueAtTime(f0, n); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), n + dur);
    g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(gain, n + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    o.connect(g); g.connect(master); o.start(n); o.stop(n + dur + 0.05);
  }
  /* l'ambiente segue il luogo: fuori il vento, in sala il caldo, in camera il vento dietro i vetri */
  function setRoom(r) {
    room = r || "";
    if (!ac) { return; }
    var fuori = /Fermata|Piazza|Coronamento/.test(room), sala = /Albergo/.test(room), camera = /Camera/.test(room);
    ramp(amb.vento.g.gain, fuori ? 0.085 : (camera ? 0.03 : (sala ? 0.012 : 0.05)), 1.2);
    ramp(amb.sala.g.gain, sala ? 0.16 : 0, 1.2);
  }
  var LOOP = {
    /* il fruscio della linea per Milano */
    linea: function () { var b = band(2600, 0.4, 0.0001); ramp(b.g.gain, 0.03, 0.6); return b; }
  };
  var PLAY = {
    tocco: function () { click(1800, 0.03, 0.05); },
    tasto: function () { click(3200 + Math.random() * 900, 0.012, 0.018); },
    /* la corriera: un motore basso che arriva, o che se ne va */
    corriera: function () { tone("sawtooth", 46, 62, 9, 0.07); tone("square", 31, 41, 9, 0.03); click(180, 9, 0.05); },
    riparte: function () { tone("sawtooth", 70, 34, 11, 0.07); tone("square", 47, 23, 11, 0.03); click(160, 10, 0.05); },
    /* due squilli del quadro: Milano in cabina */
    squillo: function () { var i, k; for (k = 0; k < 2; k++) { for (i = 0; i < 9; i++) { tone("square", 880, 880, 0.035, 0.035, k * 0.75 + i * 0.05); tone("sine", 1320, 1320, 0.035, 0.03, k * 0.75 + i * 0.05); } } },
    macchina: function () { var i, n = 3 + Math.floor(Math.random() * 6); for (i = 0; i < n; i++) { click(2400, 0.018, 0.022, i * (0.09 + Math.random() * 0.05)); } },
    legna: function () { click(700 + Math.random() * 600, 0.05, 0.03); },
    /* il colpo: un tonfo grave e lungo, poi i vetri */
    colpo: function () {
      var i;
      tone("sine", 58, 24, 3.4, 0.9); tone("sine", 38, 19, 4.2, 0.7, 0.15); tone("triangle", 90, 30, 1.2, 0.3);
      click(90, 2.6, 0.5); click(60, 3.6, 0.4, 0.3);
      for (i = 0; i < 14; i++) { click(4200 + Math.random() * 1500, 0.03, 0.03, 0.5 + i * 0.11 + Math.random() * 0.05); }
    }
  };
  function play(name) { if (ac && on && PLAY[name]) { try { PLAY[name](); } catch (e) { /* un suono in meno non ferma il gioco */ } } }
  function loop(name, yes) {
    if (!ac) { return; }
    if (yes && !loops[name] && LOOP[name]) { loops[name] = LOOP[name](); }
    if (!yes && loops[name]) { var b = loops[name]; ramp(b.g.gain, 0.0001, 0.4); setTimeout(function () { try { b.s.stop(); } catch (e) { /* già fermo */ } }, 600); loops[name] = null; }
  }
  /* i rumori di fondo che capitano ogni tanto: la macchina di Vescovi, la stufa */
  setInterval(function () {
    if (!ac || !on) { return; }
    if (/Albergo/.test(room)) { if (Math.random() < 0.35) { play("macchina"); } if (Math.random() < 0.3) { play("legna"); } }
  }, 2300);
  function setOn(v) {
    on = !!v;
    try { localStorage.setItem(KEY, on ? "si" : "no"); } catch (e) { /* non indispensabile */ }
    if (ac) { ramp(master.gain, on ? 0.9 : 0, 0.2); }
  }
  return { init: init, play: play, loop: loop, setRoom: setRoom, setOn: setOn, isOn: function () { return on; } };
})();
