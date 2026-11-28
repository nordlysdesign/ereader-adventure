/* ==================================================================
   INTERFACCIA. Un ridisegno per turno. L'unica cosa che si muove sono
   le tavole: pochi fotogrammi, cambiati un paio di volte al secondo,
   e si possono fermare.
   ================================================================== */
if (typeof document !== "undefined") {
  (function () {
    var screen = document.getElementById("screen"), out = document.getElementById("out"), input = document.getElementById("cmd-input");
    var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var prefs = { mode: "rullo", motion: !reduce, size: 1 }, turns = [], pos = 0, pending = null, atTop = true;
    var canCanvas = !!document.createElement("canvas").getContext;
    var DIR_LABEL = { nord: "NORD", sud: "SUD", est: "EST", ovest: "OVEST", su: "SU", giu: "GIÙ" };
    var anim = [], tick = 0, timer = null;

    try { var p = JSON.parse(localStorage.getItem("vialibera.prefs") || "null"); if (p && p.mode) { prefs.mode = p.mode; prefs.motion = !!p.motion; prefs.size = p.size === 2 || p.size === 3 ? p.size : 1; } } catch (e) { /* preferenze predefinite */ }

    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text) { e.appendChild(document.createTextNode(text)); } return e; }
    function kw(label, word, cmd) {
      var k = el("span", "kw", label);
      if (cmd) { k.setAttribute("data-run", cmd); } else { k.setAttribute("data-kw", word); }
      k.setAttribute("role", "button"); k.setAttribute("tabindex", "0");
      return k;
    }
    function addText(parent, s) {
      var lines = s.split("\n"), i, re = /\[\[([^\]]+)\]\]/g, m, last, parts;
      for (i = 0; i < lines.length; i++) {
        if (i) { parent.appendChild(document.createElement("br")); }
        last = 0; re.lastIndex = 0;
        while ((m = re.exec(lines[i]))) {
          if (m.index > last) { parent.appendChild(document.createTextNode(lines[i].substring(last, m.index))); }
          parts = m[1].split("|");
          parent.appendChild(kw(parts[0], parts[0], parts[1]));
          last = m.index + m[0].length;
        }
        if (last < lines[i].length) { parent.appendChild(document.createTextNode(lines[i].substring(last))); }
      }
    }
    function avail() { return Math.max(160, out.clientWidth - 36); }
    function figure(canvas, cap) {
      var f = el("figure");
      if (canvas) { canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", cap || "Tavola"); f.appendChild(canvas); if (canvas._paint) { anim.push(canvas); } }
      if (cap) { f.appendChild(el("figcaption", "", cap)); }
      return f;
    }

    function renderTurn(turn) {
      var box = el("div", "turn"), i, j, q, b, e, c, parts, dl, ul, who, L;
      if (turn.cmd) { box.appendChild(el("p", "echo", "> " + turn.cmd)); }
      for (i = 0; i < turn.blocks.length; i++) {
        b = turn.blocks[i];
        if (b.t === "p" || b.t === "note" || b.t === "room") {
          e = el("p", b.t === "p" ? "" : b.t); addText(e, b.s); box.appendChild(e);
        } else if (b.t === "front") {
          e = el("div", "front"); e.appendChild(el("h2", "", b.s)); e.appendChild(el("span", "", b.sub)); box.appendChild(e);
        } else if (b.t === "chapter") {
          e = el("div", "chapter"); e.appendChild(el("span", "", b.n)); e.appendChild(el("h2", "", b.s)); box.appendChild(e);
        } else if (b.t === "prosa") {
          e = el("div", "prosa"); parts = b.s.split("\n\n");
          for (j = 0; j < parts.length; j++) { e.appendChild(el("p", "", parts[j])); }
          box.appendChild(e);
        } else if (b.t === "img") {
          box.appendChild(figure(canCanvas ? Pix.make(b.id, Math.min(avail(), Pix.scenes[b.id].w > 120 ? 480 : 240)) : null, b.cap));
        } else if (b.t === "map") {
          box.appendChild(figure(canCanvas ? Pix.makeMap(b, Math.min(avail(), 480)) : null, b.cap));
        } else if (b.t === "code") {
          box.appendChild(el("p", "code", b.s));
        } else if (b.t === "sheet") {
          e = el("div", "sheet");
          e.appendChild(figure(canCanvas ? Pix.make("ritratto", 128) : null, b.cap));
          who = el("div", "who"); who.appendChild(el("h2", "", b.name)); dl = el("dl");
          for (j = 0; j < b.rows.length; j++) { dl.appendChild(el("dt", "", b.rows[j][0])); dl.appendChild(el("dd", "", b.rows[j][1])); }
          who.appendChild(dl); e.appendChild(who); box.appendChild(e);
          for (j = 0; j < b.lists.length; j++) {
            L = b.lists[j];
            if (!L[1].length) { continue; }
            box.appendChild(el("p", "facts-title", L[0]));
            if (L[2]) {
              dl = el("dl", "people");
              for (q = 0; q < L[1].length; q++) { dl.appendChild(el("dt", "", L[1][q][0])); dl.appendChild(el("dd", "", L[1][q][1])); }
              box.appendChild(dl);
            } else {
              ul = el("ul", "facts"); for (q = 0; q < L[1].length; q++) { ul.appendChild(el("li", "", L[1][q])); }
              box.appendChild(ul);
            }
          }
        } else if (b.t === "end") {
          box.appendChild(el("p", "end", b.s));
        }
      }
      return box;
    }

    function renderPanel() {
      var st = PC.status(), ex = PC.exits(), inv = PC.inventory(), dir = document.getElementById("chips-dir"), bag = document.getElementById("bag"), i, b;
      var reading = prefs.mode === "pagina" && turns[pos].kind === "tavola";
      document.getElementById("st-room").textContent = reading ? "Prologo" : st.room;
      document.getElementById("st-moves").textContent = "Cap. " + st.ch + " · Mosse " + st.moves;
      screen.className = "screen " + prefs.mode + " t" + prefs.size + (reading ? " reading" : "");
      document.getElementById("pg-label").textContent = "Pag. " + (pos + 1) + " di " + turns.length;
      document.getElementById("pg-prev").disabled = pos === 0;
      document.getElementById("pg-next").disabled = pos === turns.length - 1;

      while (dir.firstChild) { dir.removeChild(dir.firstChild); }
      for (i = 0; i < ex.length; i++) { b = el("button", "chip", DIR_LABEL[ex[i]]); b.type = "button"; b.setAttribute("data-cmd", ex[i]); dir.appendChild(b); }
      dir.appendChild(el("span", "spacer"));
      b = el("button", "chip", "GUARDA"); b.type = "button"; b.setAttribute("data-cmd", "guarda"); dir.appendChild(b);

      while (bag.firstChild) { bag.removeChild(bag.firstChild); }
      for (i = 0; i < inv.length; i++) { if (i) { bag.appendChild(el("span", "sep", "·")); } bag.appendChild(kw(inv[i].label, inv[i].word)); }
      if (!inv.length) { bag.appendChild(document.createTextNode("niente")); }
    }

    function render() {
      var i, from, b;
      anim = [];
      while (out.firstChild) { out.removeChild(out.firstChild); }
      if (prefs.mode === "pagina") {
        out.appendChild(renderTurn(turns[pos]));
        if (pos < turns.length - 1) {
          b = el("button", "chip go turn-next", "Volta pagina ▶"); b.type = "button"; b.id = "turn-next";
          b.onclick = function () { goPage(pos + 1); };
          out.appendChild(b);
        }
        out.scrollTop = 0;
      } else {
        from = Math.max(0, turns.length - 24);
        for (i = from; i < turns.length; i++) { out.appendChild(renderTurn(turns[i])); }
        out.scrollTop = atTop ? 0 : out.scrollHeight;
      }
      renderPanel();
      runMotion();
    }

    function runMotion() {
      var i;
      if (timer) { clearInterval(timer); timer = null; }
      if (!prefs.motion || !anim.length) { for (i = 0; i < anim.length; i++) { anim[i]._paint(0); } return; }
      timer = setInterval(function () {
        tick++;
        for (var j = 0; j < anim.length; j++) { anim[j]._paint(tick); }
      }, 480);
    }

    var drawer = document.getElementById("drawer"), drawerBtn = document.getElementById("drawer-btn");
    function setDrawer(open) {
      drawer.className = open ? "drawer" : "drawer off";
      drawerBtn.textContent = open ? "CHIUDI" : "COMANDI";
      drawerBtn.className = open ? "chip on" : "chip";
      drawerBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    drawerBtn.onclick = function () { setDrawer(drawer.className.indexOf("off") >= 0); };

    function goPage(n) { pos = Math.max(0, Math.min(turns.length - 1, n)); render(); }
    function pushPrologue() {
      var pages = PC.prologue(), i, first = turns.length;
      for (i = 0; i < pages.length; i++) { turns.push({ cmd: null, blocks: pages[i], kind: "tavola" }); }
      return first;
    }
    function begin(forceNew) {
      var st = PC.start(forceNew);
      turns = []; pos = 0; atTop = true;
      if (!st.resumed) { pushPrologue(); }
      turns.push({ cmd: null, blocks: st.blocks, kind: "turno" });
      if (st.resumed) { pos = turns.length - 1; atTop = false; }
      render();
    }

    function goHome() { window.location.href = "index.html"; }
    function setPending(verb) {
      var chips = document.getElementById("chips-verb").getElementsByTagName("button"), i;
      pending = verb;
      for (i = 0; i < chips.length; i++) { chips[i].className = chips[i].getAttribute("data-verb") === verb ? "chip on" : "chip"; }
      input.value = verb ? verb + " " : "";
      input.placeholder = verb ? "tocca una parola sottolineata" : "scrivi un comando";
    }

    function run(cmd) {
      var blocks, first, cut, i;
      cmd = String(cmd).replace(/^\s+|\s+$/g, "");
      if (!cmd) { return; }
      blocks = PC.exec(cmd);
      setPending(null);
      setDrawer(false);
      if (blocks.length && blocks[0].t === "restart") { begin(true); return; }
      if (blocks.length && blocks[0].t === "home") { goHome(); return; }
      atTop = false;
      if (blocks.length && blocks[0].t === "prologue") {
        first = pushPrologue();
        turns.push({ cmd: null, blocks: PC.look(), kind: "turno" });
        pos = prefs.mode === "pagina" ? first : turns.length - 1;
      } else {
        /* un cambio di capitolo apre una pagina nuova: prima si legge come finisce il vecchio */
        cut = -1;
        for (i = 1; i < blocks.length; i++) { if (blocks[i].t === "chapter") { cut = i; break; } }
        if (cut < 0) { turns.push({ cmd: cmd, blocks: blocks, kind: "turno" }); pos = turns.length - 1; }
        else {
          turns.push({ cmd: cmd, blocks: blocks.slice(0, cut), kind: "turno" });
          turns.push({ cmd: null, blocks: blocks.slice(cut), kind: "turno" });
          pos = prefs.mode === "pagina" ? turns.length - 2 : turns.length - 1;
        }
      }
      while (turns.length > 60) { turns.shift(); pos--; }
      render();
    }

    function tapWord(w) {
      if (PC.isDir(w)) { run(w); }
      else if (pending) { run(pending + " " + w); }
      else { run("esamina " + w); }
    }

    screen.onclick = function (ev) {
      var t = ev.target, cmd, verb;
      if (!t || !t.getAttribute) { return; }
      if (t.className === "kw") { if (t.getAttribute("data-run")) { run(t.getAttribute("data-run")); } else { tapWord(t.getAttribute("data-kw")); } return; }
      cmd = t.getAttribute("data-cmd"); verb = t.getAttribute("data-verb");
      if (cmd) { run(cmd); }
      else if (verb) { setPending(pending === verb ? null : verb); }
    };
    screen.onkeydown = function (ev) {
      var t = ev.target;
      if (t && t.className === "kw" && (ev.keyCode === 13 || ev.keyCode === 32)) { ev.preventDefault(); t.click(); }
    };
    document.getElementById("pg-prev").onclick = function () { goPage(pos - 1); };
    document.getElementById("pg-next").onclick = function () { goPage(pos + 1); };
    document.getElementById("cmd-form").onsubmit = function (ev) { ev.preventDefault(); run(input.value); };

    function setPref(key, val) {
      prefs[key] = val;
      try { localStorage.setItem("vialibera.prefs", JSON.stringify(prefs)); } catch (e) { /* non indispensabile */ }
      syncSwitch(); render();
    }
    function syncSwitch() {
      var pairs = [["mode-pagina", prefs.mode === "pagina"], ["mode-rullo", prefs.mode === "rullo"], ["mot-on", prefs.motion], ["mot-off", !prefs.motion], ["size-1", prefs.size === 1], ["size-2", prefs.size === 2], ["size-3", prefs.size === 3]], i;
      for (i = 0; i < pairs.length; i++) { document.getElementById(pairs[i][0]).setAttribute("aria-pressed", pairs[i][1] ? "true" : "false"); }
    }
    document.getElementById("mode-pagina").onclick = function () { setPref("mode", "pagina"); };
    document.getElementById("mode-rullo").onclick = function () { setPref("mode", "rullo"); };
    document.getElementById("mot-on").onclick = function () { setPref("motion", true); };
    document.getElementById("mot-off").onclick = function () { setPref("motion", false); };
    document.getElementById("size-1").onclick = function () { setPref("size", 1); };
    document.getElementById("size-2").onclick = function () { setPref("size", 2); };
    document.getElementById("size-3").onclick = function () { setPref("size", 3); };
    /* ricominciare: due tocchi, perché si perde la partita */
    var RE = [["re-cap", "Capitolo", "ricomincia capitolo"], ["re-all", "Da capo", "ricomincia"]];
    function disarm() {
      for (var i = 0; i < RE.length; i++) { var b = document.getElementById(RE[i][0]); b.removeAttribute("data-armed"); b.textContent = RE[i][1]; b.className = "chip"; }
    }
    function closePrefs() { var p = document.getElementById("ref-prefs"); document.getElementById("prefs").className = "prefs off"; p.className = "chip"; p.setAttribute("aria-expanded", "false"); }
    function armButton(r) {
      var b = document.getElementById(r[0]);
      b.onclick = function () {
        if (b.getAttribute("data-armed")) { disarm(); closePrefs(); run(r[2]); return; }
        disarm(); b.setAttribute("data-armed", "1"); b.textContent = "Sicuro? Tocca ancora"; b.className = "chip on";
      };
    }
    armButton(RE[0]); armButton(RE[1]);
    document.getElementById("go-home").onclick = goHome;
    document.getElementById("ref-prefs").onclick = function () {
      var box = document.getElementById("prefs"), open = box.className.indexOf("off") >= 0;
      disarm();
      box.className = open ? "prefs" : "prefs off";
      this.className = open ? "chip on" : "chip";
      this.setAttribute("aria-expanded", open ? "true" : "false");
    };

    var resizeTimer = null, lastW = 0;
    window.onresize = function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (out.clientWidth !== lastW) { lastW = out.clientWidth; render(); } }, 250);
    };

    syncSwitch();
    /* dall'elenco delle storie si può arrivare con #nuova: partita da capo. Il segno si toglie subito, così ricaricare la pagina non la azzera di nuovo */
    var fromNew = window.location.hash === "#nuova";
    if (fromNew) { try { window.location.hash = ""; } catch (e) { /* resta */ } }
    begin(fromNew);
    lastW = out.clientWidth;
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) { document.fonts.ready.then(function () { render(); }); }
  })();
}
