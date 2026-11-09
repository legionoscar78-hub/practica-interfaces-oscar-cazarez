/* ==========================================================================
   charts.js — Gráficas SVG propias (sin librerías): líneas y dona.
   Se redibujan al cambiar el tamaño del contenedor (diseño responsivo).
   ========================================================================== */
(function (w, d) {
  'use strict';
  var N = w.Nimbus;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  /* ---------------- Gráfica de líneas ----------------
     getSeries() -> [{ cls: '1', values: [0..100, ...] }, ...]                */
  function lineChart(el, getSeries) {
    var id = 'lc' + (++uid);

    function draw() {
      var W = el.clientWidth, H = el.clientHeight;
      if (!W || !H) return;
      var series = getSeries();
      var n = series[0].values.length;
      var m = { l: 38, r: 14, t: 10, b: 24 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var x = function (i) { return m.l + (iw * i) / (n - 1); };
      var y = function (v) { return m.t + ih * (1 - v / 100); };

      var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">';
      out += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" class="stop-1" stop-opacity="0.30"/><stop offset="1" class="stop-1" stop-opacity="0"/></linearGradient></defs>';

      [0, 25, 50, 75, 100].forEach(function (t) {
        out += '<line class="chart__grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(t) + '" y2="' + y(t) + '"/>';
        out += '<text x="' + (m.l - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + t + '%</text>';
      });
      out += '<text x="' + m.l + '" y="' + (H - 6) + '" text-anchor="start">hace 2 min</text>';
      out += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">hace 1 min</text>';
      out += '<text x="' + (W - m.r) + '" y="' + (H - 6) + '" text-anchor="end">ahora</text>';

      series.forEach(function (s, k) {
        var dPath = '';
        s.values.forEach(function (v, i) {
          if (i === 0) { dPath += 'M' + x(i) + ' ' + y(v); return; }
          var px = x(i - 1), py = y(s.values[i - 1]), cx = (px + x(i)) / 2;
          dPath += ' C' + cx + ' ' + py + ',' + cx + ' ' + y(v) + ',' + x(i) + ' ' + y(v);
        });
        if (k === 0) {
          out += '<path d="' + dPath + ' L' + x(n - 1) + ' ' + (m.t + ih) + ' L' + x(0) + ' ' + (m.t + ih) + ' Z" fill="url(#' + id + ')"/>';
        }
        out += '<path class="chart__line chart__line--' + s.cls + '" d="' + dPath + '"/>';
        out += '<circle class="chart__dot--' + s.cls + '" cx="' + x(n - 1) + '" cy="' + y(s.values[n - 1]) + '" r="5"/>';
      });

      out += '</svg>';
      el.innerHTML = out;
    }

    if ('ResizeObserver' in w) new ResizeObserver(draw).observe(el);
    else w.addEventListener('resize', draw);
    draw();
    return { draw: draw };
  }

  /* ---------------- Gráfica de dona ----------------
     parts: [{ cls: 'ok', value: 5, label: 'Activo' }, ...]                 */
  function donut(svg, parts, centerLabel) {
    var R = 46, C = 2 * Math.PI * R;
    var total = parts.reduce(function (s, p) { return s + p.value; }, 0) || 1;
    var offset = 0;
    var out = '<circle class="donut__track" cx="60" cy="60" r="' + R + '"/>';

    parts.forEach(function (p) {
      if (!p.value) return;
      var len = (p.value / total) * C;
      var gap = parts.filter(function (q) { return q.value; }).length > 1 ? 2.5 : 0;
      out += '<circle class="donut__seg--' + p.cls + '" cx="60" cy="60" r="' + R + '"' +
        ' stroke-dasharray="' + Math.max(len - gap, 0.1) + ' ' + (C - Math.max(len - gap, 0.1)) + '"' +
        ' stroke-dashoffset="' + -offset + '" transform="rotate(-90 60 60)"/>';
      offset += len;
    });

    out += '<text x="60" y="63" text-anchor="middle">' + total + '</text>' +
      '<text class="donut__sub" x="60" y="80" text-anchor="middle">' + centerLabel + '</text>';
    svg.innerHTML = out;
  }

  N.charts = { lineChart: lineChart, donut: donut };
})(window, document);
