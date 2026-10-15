/* Draw2World AI — 슬라이드 동작 (외부 라이브러리 없음) */
(function () {
  "use strict";

  var stage = document.getElementById("stage");
  var slides = Array.prototype.slice.call(stage.querySelectorAll(".slide"));
  var total = slides.length;
  var counter = document.getElementById("counter");
  var bar = document.getElementById("progressBar");
  var controls = document.getElementById("controls");
  var notesPanel = document.getElementById("notesPanel");
  var notesTitle = document.getElementById("notesTitle");
  var notesBody = document.getElementById("notesBody");
  var btnNotes = document.getElementById("btnNotes");
  var btnFull = document.getElementById("btnFull");
  var current = 0;
  var STORE_KEY = "d2w-slide";
  var NOTES_KEY = "d2w-notes";

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---- 1920×1080 스테이지를 뷰포트에 맞춤 ---- */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty("--scale", String(s));
  }

  /* ---- 팀 헤더 ---- */
  var TEAM_NAME = "팀 워커홀릭";
  slides.forEach(function (sl, i) {
    if (sl.classList.contains("s-opening")) return;
    var h = document.createElement("div");
    h.className = "team-bar";
    h.textContent = TEAM_NAME;
    sl.insertBefore(h, sl.firstChild);
  });

  /* ---- 슬라이드 하단 푸터 ---- */
  slides.forEach(function (sl, i) {
    if (sl.classList.contains("s-opening")) return;
    var f = document.createElement("footer");
    f.className = "sf";
    f.setAttribute("aria-hidden", "true");
    f.innerHTML = "<span><b>Draw2World AI</b> · " + (sl.getAttribute("data-title") || "") + "</span><span>" + pad(i + 1) + " / " + pad(total) + "</span>";
    sl.appendChild(f);
  });

  /* ---- 이동 ---- */
  function readHash() {
    var m = /^#\/?(\d+)/.exec(location.hash);
    if (m) return clamp(parseInt(m[1], 10) - 1);
    try { var v = parseInt(localStorage.getItem(STORE_KEY), 10); if (!isNaN(v)) return clamp(v); } catch (e) {}
    return 0;
  }
  function clamp(i) { return Math.max(0, Math.min(total - 1, i)); }

  function show(i, fromHash) {
    i = clamp(i);
    slides.forEach(function (sl, k) {
      var on = k === i;
      sl.classList.toggle("is-active", on);
      sl.setAttribute("aria-hidden", on ? "false" : "true");
      if ("inert" in sl) sl.inert = !on;
    });
    current = i;
    counter.textContent = (i + 1) + " / " + total;
    bar.style.width = ((i + 1) / total * 100) + "%";
    document.title = "Draw2World AI — " + (i + 1) + ". " + (slides[i].getAttribute("data-title") || "");
    if (!fromHash) {
      var h = "#/" + (i + 1);
      if (location.hash !== h) history.replaceState(null, "", h);
    }
    try { localStorage.setItem(STORE_KEY, String(i)); } catch (e) {}
    renderNotes();
  }
  function next() { if (current < total - 1) show(current + 1); }
  function prev() { if (current > 0) show(current - 1); }

  /* ---- 발표자 메모 ---- */
  function renderNotes() {
    var n = slides[current].querySelector(".notes");
    notesTitle.textContent = "발표자 메모 · " + (current + 1) + ". " + (slides[current].getAttribute("data-title") || "");
    notesBody.textContent = n ? n.textContent.replace(/^[ \t]+/gm, "").trim() : "(메모 없음)";
  }
  function toggleNotes(force) {
    var open = typeof force === "boolean" ? force : notesPanel.hidden;
    notesPanel.hidden = !open;
    btnNotes.setAttribute("aria-pressed", open ? "true" : "false");
    try { localStorage.setItem(NOTES_KEY, open ? "1" : "0"); } catch (e) {}
  }

  /* ---- 전체화면 ---- */
  function toggleFull() {
    var d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      var el = d.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d);
    }
  }

  /* ---- 컨트롤 자동 표시 ---- */
  var hideTimer = null;
  function wake() {
    controls.classList.add("show");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { controls.classList.remove("show"); }, 2600);
  }

  /* ---- 이벤트 ---- */
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if (k === "ArrowRight" || k === "PageDown" || (k === " " && !e.shiftKey) || k === "Spacebar") { e.preventDefault(); next(); }
    else if (k === "ArrowLeft" || k === "PageUp" || (k === " " && e.shiftKey)) { e.preventDefault(); prev(); }
    else if (k === "Home") { e.preventDefault(); show(0); }
    else if (k === "End") { e.preventDefault(); show(total - 1); }
    else if (k === "n" || k === "N") { toggleNotes(); }
    else if (k === "f" || k === "F") { toggleFull(); }
  });

  // 화면 클릭: 왼쪽 1/4은 이전, 나머지는 다음
  document.getElementById("deck").addEventListener("click", function (e) {
    if (e.target.closest("a, button, input, textarea, select")) return;
    if (window.getSelection && String(window.getSelection())) return;
    if (e.clientX < window.innerWidth * 0.25) prev(); else next();
  });

  document.getElementById("btnPrev").addEventListener("click", function (e) { e.stopPropagation(); prev(); });
  document.getElementById("btnNext").addEventListener("click", function (e) { e.stopPropagation(); next(); });
  btnNotes.addEventListener("click", function (e) { e.stopPropagation(); toggleNotes(); });
  btnFull.addEventListener("click", function (e) { e.stopPropagation(); toggleFull(); });
  window.addEventListener("hashchange", function () { show(readHash(), true); });
  window.addEventListener("resize", fit);
  document.addEventListener("mousemove", wake);
  document.addEventListener("touchstart", wake, { passive: true });

  // 터치 스와이프
  var tx = null;
  document.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev(); }
  });

  /* ---- 차트 (SVG 직접 생성) ---- */
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var a in attrs) n.setAttribute(a, attrs[a]);
    if (text != null) n.textContent = text;
    return n;
  }
  function fmt(v, d, u) { return v.toFixed(d) + (u || ""); }

  function hbar(box, c) {
    var W = 400, labelW = 128, valW = 76, rowH = 44, gap = 14;
    var H = c.rows.length * (rowH + gap) - gap + 26;
    var plotW = W - labelW - valW;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });
    var sx = function (v) { return labelW + (Math.max(v, c.min) - c.min) / (c.max - c.min) * plotW; };
    // 축 눈금
    [c.min, (c.min + c.max) / 2, c.max].forEach(function (t) {
      svg.appendChild(el("line", { x1: sx(t), x2: sx(t), y1: 0, y2: H - 22, stroke: "#2a2f3b", "stroke-width": 1 }));
      svg.appendChild(el("text", { x: sx(t), y: H - 4, "text-anchor": "middle", fill: "#8d95a6", "font-size": 13 }, fmt(t, 0, c.unit)));
    });
    c.rows.forEach(function (r, i) {
      var y = i * (rowH + gap);
      svg.appendChild(el("text", { x: 0, y: y + rowH / 2 + 6, fill: "#c3c8d3", "font-size": 16 }, r[0]));
      svg.appendChild(el("rect", { x: labelW, y: y + 8, width: plotW, height: rowH - 16, rx: 5, fill: "#20242e" }));
      svg.appendChild(el("rect", { x: labelW, y: y + 8, width: Math.max(2, sx(r[1]) - labelW), height: rowH - 16, rx: 5, fill: "#6f9bff", opacity: c.rows.length === 2 && i === 0 ? 0.55 : 1 }));
      svg.appendChild(el("text", { x: W, y: y + rowH / 2 + 7, "text-anchor": "end", fill: "#eceef3", "font-size": 17, "font-weight": 700 }, fmt(r[1], c.decimals, c.unit)));
    });
    box.appendChild(svg);
  }

  function pair(box, c) {
    var W = 400, labelW = 96, valW = 70, barH = 20, inner = 5, gap = 22;
    var rowH = barH * 2 + inner;
    var H = c.rows.length * (rowH + gap) - gap + 60;
    var plotW = W - labelW - valW;
    var colors = ["#5d6577", "#6f9bff"];
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });
    var sx = function (v) { return labelW + (v - c.min) / (c.max - c.min) * plotW; };
    c.rows.forEach(function (r, i) {
      var y = i * (rowH + gap);
      svg.appendChild(el("text", { x: 0, y: y + rowH / 2 + 6, fill: "#c3c8d3", "font-size": 16 }, r[0]));
      [r[1], r[2]].forEach(function (v, k) {
        var by = y + k * (barH + inner);
        svg.appendChild(el("rect", { x: labelW, y: by, width: Math.max(2, sx(v) - labelW), height: barH, rx: 4, fill: colors[k] }));
        svg.appendChild(el("text", { x: W, y: by + barH - 4, "text-anchor": "end", fill: k ? "#eceef3" : "#a0a8b8", "font-size": 16, "font-weight": k ? 700 : 500 }, fmt(v, c.decimals, c.unit)));
      });
    });
    // 범례
    var ly = H - 18;
    c.series.forEach(function (s, k) {
      var lx = labelW + k * 130;
      svg.appendChild(el("rect", { x: lx, y: ly - 11, width: 14, height: 14, rx: 3, fill: colors[k] }));
      svg.appendChild(el("text", { x: lx + 22, y: ly + 1, fill: "#a0a8b8", "font-size": 14 }, s));
    });
    box.appendChild(svg);
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-chart]"), function (box) {
    try {
      var c = JSON.parse(box.getAttribute("data-chart"));
      if (c.type === "pair") pair(box, c); else hbar(box, c);
    } catch (err) {
      box.textContent = "차트 데이터 오류";
    }
  });

  /* ---- 시작 ---- */
  fit();
  show(readHash(), false);
  try { if (localStorage.getItem(NOTES_KEY) === "1") toggleNotes(true); } catch (e) {}
  wake();
})();
