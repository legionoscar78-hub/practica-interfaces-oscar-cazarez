/* ==========================================================================
   dashboard.js — Vista "Resumen": KPIs, gráficas en tiempo real (simuladas),
   dona de estados, volúmenes, alertas y carga por región.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var N = w.Nimbus, ui = N.ui;
  var POINTS = 24;
  var live = true;
  var cpu = [], mem = [];
  var chart;

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function walk(prev, step, lo, hi) { return clamp(prev + (Math.random() - 0.5) * step, lo, hi); }

  function seedSeries() {
    var c = 48, m = 61;
    for (var i = 0; i < POINTS; i++) {
      c = walk(c, 14, 20, 88);
      m = walk(m, 6, 45, 82);
      cpu.push(Math.round(c));
      mem.push(Math.round(m));
    }
  }

  function avg(arr) { return Math.round(arr.reduce(function (a, b) { return a + b; }, 0) / arr.length); }
  function max(arr) { return Math.max.apply(null, arr); }

  function renderKpis() {
    var c = N.domain.countByStatus();
    var total = N.data.servers.length;
    var active = c.running + c.warning;
    ui.$('#kpi-active').textContent = active + ' / ' + total;
    ui.$('#kpi-active-note').textContent = c.stopped + ' detenidas · ' + c.restarting + ' reiniciando';
    ui.$('#kpi-cpu').textContent = cpu[cpu.length - 1] + ' %';
    ui.$('#kpi-alerts').textContent = c.warning;
    ui.$('#kpi-cost').textContent = '$' + N.domain.monthlyCost().toLocaleString('en-US');

    var badge = ui.$('#nav-alert-count');
    badge.textContent = c.warning;
    badge.hidden = c.warning === 0;
    badge.setAttribute('aria-label', c.warning + ' alertas activas');
  }

  function renderChartFoot() {
    ui.$('#cf-cpu').textContent = cpu[cpu.length - 1] + ' %';
    ui.$('#cf-cpumax').textContent = max(cpu) + ' %';
    ui.$('#cf-mem').textContent = mem[mem.length - 1] + ' %';
    ui.$('#cf-memmax').textContent = max(mem) + ' %';
    ui.$('#chart-main').setAttribute('aria-label',
      'Gráfica de líneas. CPU actual ' + cpu[cpu.length - 1] + ' por ciento, promedio ' + avg(cpu) +
      ' por ciento. Memoria actual ' + mem[mem.length - 1] + ' por ciento, promedio ' + avg(mem) + ' por ciento.');
  }

  function renderDonut() {
    var c = N.domain.countByStatus();
    var parts = [
      { cls: 'ok', value: c.running, label: 'Activas' },
      { cls: 'warn', value: c.warning, label: 'Con alerta' },
      { cls: 'busy', value: c.restarting, label: 'Reiniciando' },
      { cls: 'off', value: c.stopped, label: 'Detenidas' }
    ];
    N.charts.donut(ui.$('#donut'), parts, 'instancias');
    var colors = { ok: 'var(--success)', warn: 'var(--chart-3)', busy: 'var(--chart-1)', off: 'var(--border-input)' };
    ui.$('#donut-legend').innerHTML = parts.map(function (p) {
      return '<li><span class="legend__sw" style="--c:' + colors[p.cls] + '"></span>' + p.label + ': <strong>' + p.value + '</strong></li>';
    }).join('');
    ui.$('#donut').setAttribute('aria-label', 'Instancias por estado: ' +
      parts.map(function (p) { return p.value + ' ' + p.label.toLowerCase(); }).join(', '));
  }

  function meterClass(v) { return v >= 90 ? 'is-bad' : v >= 75 ? 'is-warn' : ''; }

  function renderVolumes() {
    ui.$('#vol-list').innerHTML = N.data.volumes.map(function (v) {
      return '<div class="vol"><div class="vol__top"><span>' + ui.esc(v.name) + '</span><strong>' + v.used + ' %</strong></div>' +
        '<div class="meter"><span class="meter__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + v.used +
        '" aria-label="' + ui.esc(v.name) + '"><span class="meter__fill ' + meterClass(v.used) + '" style="--v:' + v.used + '%"></span></span></div>' +
        '<span class="muted" style="font-size:var(--fs-xs)">Capacidad ' + v.size + '</span></div>';
    }).join('');
  }

  function renderAlerts() {
    ui.$('#alert-list').innerHTML = N.data.alerts.map(function (a) {
      return '<li class="alert-item alert-item--' + a.tone + '">' + ui.icon(a.icon) +
        '<div class="alert-item__body">' + ui.esc(a.text) + '<time>' + ui.esc(a.when) + '</time></div></li>';
    }).join('');
  }

  function renderRegions() {
    var regions = N.data.REGIONS, list = N.data.servers;
    ui.$('#region-list').innerHTML = Object.keys(regions).map(function (key) {
      var items = list.filter(function (s) { return s.region === key && s.status !== 'stopped'; });
      var load = items.length ? Math.round(items.reduce(function (a, s) { return a + s.cpu; }, 0) / items.length) : 0;
      return '<div class="vol"><div class="vol__top"><span>' + ui.esc(regions[key]) + ' · ' + items.length + ' activas</span><strong>' + load + ' % CPU</strong></div>' +
        '<div class="meter"><span class="meter__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + load +
        '" aria-label="Carga de ' + ui.esc(regions[key]) + '"><span class="meter__fill ' + meterClass(load) + '" style="--v:' + load + '%"></span></span></div></div>';
    }).join('');
  }

  function refreshAll() {
    renderKpis();
    renderChartFoot();
    renderDonut();
    renderRegions();
    if (chart) chart.draw();
  }

  function tick() {
    if (!live || d.hidden) return;
    if (N.router && ui.$('#view-resumen').hidden) return;       // solo si la vista es visible
    cpu.push(Math.round(walk(cpu[cpu.length - 1], 14, 18, 92))); cpu.shift();
    mem.push(Math.round(walk(mem[mem.length - 1], 5, 45, 85)));  mem.shift();
    renderKpis();
    renderChartFoot();
    chart.draw();
  }

  function setLive(on) {
    live = on;
    var btn = ui.$('#live-toggle'), pill = ui.$('#live-pill');
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('.btn__label').textContent = on ? 'Pausar actualización' : 'Reanudar actualización';
    btn.querySelector('use').setAttribute('href', on ? '#i-pause' : '#i-play');
    pill.dataset.live = on ? 'on' : 'off';
    ui.$('#live-text').textContent = on ? 'En vivo' : 'En pausa';
  }

  function init() {
    seedSeries();
    chart = N.charts.lineChart(ui.$('#chart-main'), function () {
      return [{ cls: '1', values: cpu }, { cls: '2', values: mem }];
    });
    renderVolumes();
    renderAlerts();
    refreshAll();

    ui.$('#live-toggle').addEventListener('click', function () {
      setLive(!live);
      ui.toast(live ? 'Actualización en vivo reanudada.' : 'Actualización en vivo en pausa.');
    });

    setInterval(tick, 2500);
    N.bus.on('servers-changed', refreshAll);
    N.bus.on('route', function (name) { if (name === 'resumen' && chart) chart.draw(); });
  }

  N.dashboard = { init: init };
})(window, document);
