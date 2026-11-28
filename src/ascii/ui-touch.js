/* ==================================================================
   PER TELEFONO: l'interfaccia. Si gioca solo a tocchi.
   La scena sta in alto e non si ferma mai; il testo si scrive sotto;
   una parola accesa, toccata, apre il foglio delle azioni. I comandi
   che partono sono gli stessi di sempre: il motore non sa di essere
   su un telefono. Quello che cambia da una storia all'altra (scene,
   filmati, suoni) sta in AsciiStory.
   ================================================================== */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  var app = $("app"), cv = $("cv"), log = $("log"), cap = $("caption"), roomEl = $("room"), sheet = $("sheet"), menu = $("menu");
  var R = new Ascii.Renderer(cv), F = new Ascii.Field(), ov = new Ascii.Field(), S = AsciiStory, SC = Ascii.scenes;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var DIR_LABEL = { nord: "NORD", sud: "SUD", est: "EST", ovest: "OVEST", su: "SU", giu: "GIÙ" };
  var scene = "", sceneAt = 0, overlay = null, film = null, typing = null, over = false;

  function now() { return performance.now() / 1000; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text) { e.appendChild(document.createTextNode(text)); } return e; }

  /* ---------- la scena ---------- */
  function roomScene() { var s = PC.status(); return S.scene(s.room, s.ch); }
  function setScene(id) { if (id !== scene && SC[id]) { scene = id; sceneAt = now(); } }
  function plain(str) { return String(str).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[«»]/g, '"').replace(/[^\x20-\x7e]/g, "").toUpperCase(); }
  /* sopra la scena: la mappa, un momento (un'altra scena, per un turno), oppure un reperto,
     cioè la tavoletta dell'e-reader tradotta in caratteri */
  function setOverlay(id, map, capText) {
    var g, lab;
    if (map) { overlay = { at: now(), map: map }; return; }
    if (SC[id]) { overlay = { at: now(), scene: id }; return; }
    try {
      g = Pix.render(id, 0);
      /* della tavoletta si prende il disegno; il cartellino si riscrive a lettere vere */
      ov.clear(); ov.bits({ w: g.w, h: 66, d: g.d }, 2, 12, 81, 40, 0);
      ov.path([[0, 10], [83, 10], [83, 46], [0, 46], [0, 10]], 0.5, 1);
      ov.rect(1, 42, 82, 45, 0.02, 0); ov.line(1, 41.6, 82, 41.6, 0.4, 1, { st: 4 });
      lab = "REPERTO  " + plain(capText || "").split("").join(" ");
      if (lab.length > 78) { lab = "REPERTO  " + plain(capText || ""); }
      ov.text(Math.max(2, 42 - lab.length / 2), 44, lab.substring(0, 80), 0.95, 3);
      overlay = { at: now() };
    } catch (e) { overlay = null; }
  }
  function scramble(k, t) {
    /* cambio di scena: i caratteri si rimescolano e si ricompongono */
    var i, n = F.lum.length, f = Math.floor(t * 20);
    for (i = 0; i < n; i++) { if (Ascii.hash(i * 1.37) < k) { F.lum[i] = 0.12 + 0.4 * Ascii.hash(i + f * 3.1) * k; F.tint[i] = 0; F.st[i] = 0; F.ch[i] = 33 + Math.floor(Ascii.hash(i * 2.1 + f) * 90); } }
  }
  function paint(id, t, st) { if (SC[id]) { SC[id](F, t, st || {}); } }
  /* trenta fotogrammi al secondo; se il telefono non ce la fa si scende a venti, poi a quindici */
  var lastDraw = 0, cost = 0, step = 1 / 31;
  function frame() {
    var t = now(), i, s, u, c, k;
    requestAnimationFrame(frame);
    if (t - lastDraw < (reduce ? 0.5 : step)) { return; }
    lastDraw = t;
    F.clear(); F.cam();
    if (film) {
      s = film.def.steps[film.i]; u = t - film.stepAt;
      c = s.cam ? s.cam(u) : [42, 28, 1]; F.cam(c[0], c[1], c[2]);
      paint(s.scene, t, s.st ? s.st(u, t - film.at) : {});
      k = 1 - (t - film.sceneAt) / 0.6; if (k > 0) { scramble(k, t); }
      for (i = 0; i < film.def.cues.length; i++) { if (!film.cued[i] && t - film.at >= film.def.cues[i].t) { film.cued[i] = 1; Suono.play(film.def.cues[i].snd); } }
      if (film.typed && !reduce && t - film.typedAt > 2.6 + s.text.length * 0.035 && t - film.stepAt > (s.min || 0)) { nextStep(); }
    } else if (overlay && overlay.map) {
      paint(S.map, t, overlay.map);
      k = 1 - (t - overlay.at) / 0.5; if (k > 0) { scramble(k, t); }
    } else if (overlay && overlay.scene) {
      paint(overlay.scene, reduce ? 3 : t, {});
      k = 1 - (t - overlay.at) / 0.5; if (k > 0) { scramble(k, t); }
    } else {
      paint(scene, reduce ? 3 : t, {});
      k = 1 - (t - sceneAt) / 0.5; if (k > 0) { scramble(k, t); }
      if (overlay) {
        F.dim(0, 0, 84, 56, 0.35);
        k = Math.min(1, (t - overlay.at) / 0.35);
        for (i = 10 * 84; i < 47 * 84; i++) { if (Ascii.hash(i * 0.77) < k) { F.lum[i] = ov.lum[i]; F.tint[i] = ov.tint[i]; F.st[i] = ov.st[i]; F.ch[i] = ov.ch[i]; } }
      }
    }
    R.draw(F, t);
    cost = cost * 0.9 + (now() - t) * 0.1;
    step = cost > 0.045 ? 1 / 15.5 : (cost > 0.026 ? 1 / 20.5 : 1 / 31);
  }
  function fit() { R.resize(Math.min(app.clientWidth, 560)); }
  window.addEventListener("resize", fit);

  /* ---------- il testo che si scrive ---------- */
  function addText(parent, s) {
    var lines = s.split("\n"), i, re = /\[\[([^\]]+)\]\]/g, m, last, parts, k;
    for (i = 0; i < lines.length; i++) {
      if (i) { parent.appendChild(document.createElement("br")); }
      last = 0; re.lastIndex = 0;
      while ((m = re.exec(lines[i]))) {
        if (m.index > last) { parent.appendChild(document.createTextNode(lines[i].substring(last, m.index))); }
        parts = m[1].split("|");
        k = el("span", "kw", parts[0]);
        if (parts[1]) { k.setAttribute("data-run", parts[1]); } else { k.setAttribute("data-kw", parts[0]); }
        parent.appendChild(k);
        last = m.index + m[0].length;
      }
      if (last < lines[i].length) { parent.appendChild(document.createTextNode(lines[i].substring(last))); }
    }
  }
  function finishTyping() {
    if (!typing) { return; }
    var i, T = typing;
    typing = null;
    for (i = 0; i < T.nodes.length; i++) { T.nodes[i].n.nodeValue = T.nodes[i].s; }
    for (i = 0; i < T.hidden.length; i++) { T.hidden[i].style.visibility = ""; }
    clearInterval(T.timer);
    if (T.done) { T.done(); }
  }
  /* scrive un elemento un po' alla volta: i nodi di testo si riempiono in ordine */
  function type(root, done, speed) {
    finishTyping();
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, nodes = [], hidden = [], total = 0, i, kids;
    while ((n = w.nextNode())) { nodes.push({ n: n, s: n.nodeValue }); total += n.nodeValue.length; }
    if (reduce || !total) { if (done) { done(); } return; }
    kids = root.querySelectorAll(".kw, .tag, .end");
    for (i = 0; i < kids.length; i++) { kids[i].style.visibility = "hidden"; hidden.push(kids[i]); }
    for (i = 0; i < nodes.length; i++) { nodes[i].n.nodeValue = ""; }
    typing = { nodes: nodes, hidden: hidden, pos: 0, done: done, timer: null };
    typing.timer = setInterval(function () {
      var T = typing, left, j, q;
      if (!T) { return; }
      T.pos += speed || 5;
      left = T.pos;
      for (j = 0; j < T.nodes.length; j++) {
        q = T.nodes[j];
        if (left <= 0) { break; }
        q.n.nodeValue = q.s.substring(0, left);
        if (q.n.parentNode.style && q.n.parentNode.style.visibility === "hidden") { q.n.parentNode.style.visibility = ""; }
        left -= q.s.length;
      }
      if (T.pos % 3 === 0) { Suono.play("tasto"); }
      if (T.pos >= total) { finishTyping(); }
    }, 24);
  }

  /* ---------- i filmati ---------- */
  function playFilm(def, done) {
    finishTyping(); closeSheet();
    film = { def: def, i: -1, at: now(), stepAt: now(), sceneAt: now(), cued: [], done: done, typed: false };
    app.className = "app film";
    if (def.loop) { Suono.loop(def.loop, true); }
    nextStep();
  }
  function nextStep() {
    var s, prev = film.i >= 0 ? film.def.steps[film.i].scene : null;
    film.i++;
    if (film.i >= film.def.steps.length) { endFilm(); return; }
    s = film.def.steps[film.i];
    film.stepAt = now(); film.typed = false;
    if (s.scene !== prev) { film.sceneAt = now(); }
    if (s.snd) { Suono.play(s.snd); }
    while (cap.firstChild) { cap.removeChild(cap.firstChild); }
    cap.appendChild(el("p", "", s.text));
    cap.appendChild(el("span", "more", film.i < film.def.steps.length - 1 ? "tocca per continuare" : "tocca"));
    type(cap.firstChild, function () { if (film) { film.typed = true; film.typedAt = now(); } }, 3);
    if (reduce) { film.typed = true; film.typedAt = now(); }
  }
  function endFilm() {
    var d = film.done;
    if (film.def.loop) { Suono.loop(film.def.loop, false); }
    film.done = null; finishTyping(); film = null; sceneAt = now();
    app.className = "app";
    while (cap.firstChild) { cap.removeChild(cap.firstChild); }
    if (d) { d(); }
  }
  $("stage").addEventListener("click", function () {
    Suono.init();
    if (film) { if (typing) { finishTyping(); } else { nextStep(); } return; }
    if (overlay) { overlay = null; }
  });
  $("skip").addEventListener("click", function (ev) { ev.stopPropagation(); if (film) { endFilm(); } });

  /* ---------- i turni ---------- */
  function renderBlocks(blocks, cmd) {
    var box = el("div", "turn"), i, j, q, b, e, dl, ul, L, shown = false, home = roomScene();
    overlay = null;
    if (cmd) { box.appendChild(el("p", "echo", "> " + cmd)); }
    for (i = 0; i < blocks.length; i++) {
      b = blocks[i];
      if (b.t === "p" || b.t === "note") { e = el("p", b.t === "note" ? "note" : ""); addText(e, b.s); box.appendChild(e); }
      else if (b.t === "room") { roomEl.textContent = b.s; }
      else if (b.t === "chapter") { e = el("div", "chapter"); e.appendChild(el("span", "", b.n)); e.appendChild(el("h2", "", b.s)); box.appendChild(e); }
      else if (b.t === "end") { box.appendChild(el("p", "end", b.s)); }
      else if (b.t === "img") {
        if (b.id === home || shown) { continue; }
        if (SC[b.id]) { setOverlay(b.id); shown = true; box.appendChild(el("p", "tag", b.cap)); }
        else if (/^o_/.test(b.id)) { setOverlay(b.id, null, b.cap); shown = true; box.appendChild(el("p", "tag", "Reperto · " + b.cap)); }
      }
      else if (b.t === "map") { setOverlay(null, b); shown = true; box.appendChild(el("p", "tag", b.cap)); }
      else if (b.t === "code") { box.appendChild(el("p", "code", b.s)); }
      else if (b.t === "sheet") {
        box.appendChild(el("p", "tag", b.name + " · " + b.cap));
        dl = el("dl", "rows"); for (j = 0; j < b.rows.length; j++) { dl.appendChild(el("dt", "", b.rows[j][0])); dl.appendChild(el("dd", "", b.rows[j][1])); } box.appendChild(dl);
        for (j = 0; j < b.lists.length; j++) {
          L = b.lists[j]; if (!L[1].length) { continue; }
          box.appendChild(el("p", "tag", L[0]));
          if (L[2]) { dl = el("dl", "rows"); for (q = 0; q < L[1].length; q++) { dl.appendChild(el("dt", "", L[1][q][0])); dl.appendChild(el("dd", "", L[1][q][1])); } box.appendChild(dl); }
          else { ul = el("ul", ""); for (q = 0; q < L[1].length; q++) { ul.appendChild(el("li", "", L[1][q])); } box.appendChild(ul); }
        }
      }
    }
    setScene(home);
    var old = log.querySelectorAll(".turn"); for (i = 0; i < old.length; i++) { old[i].className = "turn old"; }
    while (log.children.length > 12) { log.removeChild(log.firstChild); }
    log.appendChild(box);
    log.scrollTop = Math.max(0, box.offsetTop - log.offsetTop - 4);
    type(box, null, 6);
    renderBar();
  }
  function renderBar() {
    var ex = PC.exits(), inv = PC.inventory(), dir = $("dirs"), bag = $("bag"), i, b, st = PC.status();
    while (dir.firstChild) { dir.removeChild(dir.firstChild); }
    for (i = 0; i < ex.length; i++) { b = el("button", "chip dir", DIR_LABEL[ex[i]]); b.setAttribute("data-cmd", ex[i]); dir.appendChild(b); }
    b = el("button", "chip", "GUARDA"); b.setAttribute("data-cmd", "guarda"); dir.appendChild(b);
    while (bag.firstChild) { bag.removeChild(bag.firstChild); }
    for (i = 0; i < inv.length; i++) { b = el("button", "chip item", inv[i].label); b.setAttribute("data-kw", inv[i].word); bag.appendChild(b); }
    Suono.amb(S.ambience(st.room, st.ch), S.random(st.room, st.ch));
  }

  /* dove la storia, in questo stile, si ferma prima della fine: la prova si chiude */
  function endTrial() { over = true; closeSheet(); $("end").className = "veil full"; }
  /* la prima tavola del turno che ha un suo filmato */
  function findFilm(blocks) {
    var i, f;
    for (i = 0; i < blocks.length - 1; i++) {
      if (blocks[i].t === "img" && S.films[blocks[i].id] && blocks[i + 1].t === "p") { f = S.films[blocks[i].id](blocks, i); f.at = i; return f; }
    }
    return null;
  }
  function run(cmd) {
    var blocks, i, j, f, rest;
    if (over || film) { return; }
    Suono.init(); Suono.play("tocco");
    finishTyping(); closeSheet(); closeMenu();
    blocks = PC.exec(cmd);
    if (!blocks.length) { return; }
    if (blocks[0].t === "restart") { begin(true); return; }
    if (blocks[0].t === "home") { window.location.href = "index.html"; return; }
    if (blocks[0].t === "prologue") { playFilm(S.prologo(prologueTexts()), function () { renderBlocks(PC.look(), null); }); return; }
    f = findFilm(blocks);
    if (S.trial && PC.status().ch > S.trial) {
      if (f) { playFilm(f.def, endTrial); } else { endTrial(); }
      return;
    }
    for (i = 0; i < blocks.length; i++) { for (j = 0; j < S.cues.length; j++) { if (blocks[i].s && S.cues[j][0].test(blocks[i].s)) { Suono.play(S.cues[j][1]); } } }
    if (f) {
      rest = blocks.slice(0, f.at).concat(f.after ? [{ t: "note", s: f.after }] : []).concat(blocks.slice(f.at + f.take));
      playFilm(f.def, function () { renderBlocks(rest, cmd); });
      return;
    }
    renderBlocks(blocks, cmd);
  }

  /* ---------- il foglio delle azioni ---------- */
  var VERBI = [["ESAMINA", "esamina"], ["PRENDI", "prendi"], ["APRI", "apri"], ["USA", "usa"], ["PARLA", "parla"], ["MOSTRA", "mostra"]];
  function openSheet(word) {
    var grid = $("sheet-grid"), i, b;
    $("sheet-word").textContent = word;
    while (grid.firstChild) { grid.removeChild(grid.firstChild); }
    for (i = 0; i < VERBI.length; i++) { b = el("button", "chip big", VERBI[i][0]); b.setAttribute("data-cmd", VERBI[i][1] + " " + word); grid.appendChild(b); }
    sheet.className = "sheet";
    Suono.play("tocco");
  }
  function closeSheet() { sheet.className = "sheet off"; }
  function closeMenu() { menu.className = "sheet off"; }
  app.addEventListener("click", function (ev) {
    var t = ev.target, cmd, kw;
    if (!t || !t.getAttribute) { return; }
    cmd = t.getAttribute("data-run") || t.getAttribute("data-cmd"); kw = t.getAttribute("data-kw");
    if (cmd) { run(cmd); }
    else if (kw) { finishTyping(); if (PC.isDir(kw)) { run(kw); } else { openSheet(kw); } }
    else if (t === sheet || t === menu) { closeSheet(); closeMenu(); }
    else if (t.id === "log" || (t.parentNode && t.parentNode.className && String(t.parentNode.className).indexOf("turn") === 0)) { finishTyping(); }
  });
  $("menu-btn").addEventListener("click", function (ev) { ev.stopPropagation(); Suono.init(); closeSheet(); menu.className = menu.className === "sheet" ? "sheet off" : "sheet"; syncSound(); });
  function syncSound() { $("m-suono").textContent = Suono.isOn() ? "SUONO: SÌ" : "SUONO: NO"; }
  $("m-suono").addEventListener("click", function (ev) { ev.stopPropagation(); Suono.init(); Suono.setOn(!Suono.isOn()); syncSound(); });
  /* ricominciare: due tocchi */
  function arm(id, label, cmd) {
    $(id).addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (this.getAttribute("data-armed")) { this.removeAttribute("data-armed"); this.textContent = label; closeMenu(); run(cmd); return; }
      this.setAttribute("data-armed", "1"); this.textContent = "SICURO? TOCCA ANCORA";
    });
  }
  arm("m-capo", "DA CAPO", "ricomincia"); arm("m-cap", "RIFAI IL CAPITOLO", "ricomincia capitolo");
  $("end-again").addEventListener("click", function () { $("end").className = "veil full off"; begin(true); });

  /* ---------- si comincia ---------- */
  function prologueTexts() {
    var pages = PC.prologue(), out = [], i, j;
    for (i = 0; i < pages.length; i++) { for (j = 0; j < pages[i].length; j++) { if (pages[i][j].t === "prosa") { out.push(pages[i][j].s); } } }
    return out;
  }
  function begin(forceNew) {
    var st = PC.start(forceNew);
    over = false; overlay = null;
    while (log.firstChild) { log.removeChild(log.firstChild); }
    if (S.trial && PC.status().ch > S.trial) { st = PC.start(true); }
    setScene(roomScene());
    if (st.resumed) { renderBlocks(st.blocks, null); return; }
    roomEl.textContent = "";
    Suono.amb(S.ambience(PC.status().room, 1), []);
    playFilm(S.prologo(prologueTexts()), function () { renderBlocks(st.blocks.filter(function (b) { return b.t !== "note"; }).concat([{ t: "note", s: "Tocca una parola accesa per scegliere cosa farne. In basso: dove puoi andare, cosa hai con te, e il menu." }]), null); });
  }
  var fromNew = window.location.hash === "#nuova";
  if (fromNew) { try { window.location.hash = ""; } catch (e) { /* resta */ } }
  /* dietro il titolo: la scena dove la partita è rimasta, o la prima */
  try { PC.start(false); scene = roomScene(); } catch (e) { scene = ""; }
  fit();
  requestAnimationFrame(frame);
  $("start-btn").addEventListener("click", function () {
    Suono.init();
    $("title").className = "veil off";
    fit(); begin(fromNew);
  });
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) { document.fonts.ready.then(function () { R.build(); }); }
  /* per le prove automatiche */
  window.__prova = { run: run, film: function () { return film; }, next: function () { if (film) { finishTyping(); if (film) { nextStep(); } } }, skip: function () { if (film) { endFilm(); } } };
})();
