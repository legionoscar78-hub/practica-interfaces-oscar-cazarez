/* ==========================================================================
   servers.js — Vista "Servidores": tabla con búsqueda, filtro, orden
   (dropdown propio), paginación y acciones por fila.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var N = w.Nimbus, ui = N.ui;
  var PAGE_SIZE = 6;
  var state = { q: '', status: 'all', sort: 'name', page: 1 };
  var SORT_LABELS = { name: 'Nombre', cpu: 'Mayor uso de CPU', mem: 'Mayor uso de memoria', status: 'Estado' };
  var STATUS_ORDER = { warning: 0, restarting: 1, running: 2, stopped: 3 };

  function filtered() {
    var q = state.q.trim().toLowerCase();
    var list = N.data.servers.filter(function (s) {
      var okQ = !q || s.name.toLowerCase().indexOf(q) > -1 || s.ip.indexOf(q) > -1;
      var okS = state.status === 'all' || s.status === state.status;
      return okQ && okS;
    });
    list.sort(function (a, b) {
      if (state.sort === 'cpu') return b.cpu - a.cpu;
      if (state.sort === 'mem') return b.mem - a.mem;
      if (state.sort === 'status') return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    return list;
  }

  function meter(v, stopped, label) {
    if (stopped) return '<span class="muted">—</span>';
    var cls = v >= 90 ? 'is-bad' : v >= 75 ? 'is-warn' : '';
    return '<div class="meter"><span class="meter__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + v +
      '" aria-label="' + label + '"><span class="meter__fill ' + cls + '" style="--v:' + v + '%"></span></span>' +
      '<span class="meter__num">' + v + '%</span></div>';
  }

  function row(s) {
    var busy = s.status === 'restarting';
    var stopped = s.status === 'stopped';
    var n = ui.esc(s.name);
    return '<tr data-id="' + s.id + '">' +
      '<td class="cell-name" data-label="Instancia"><strong>' + n + '</strong><small class="mono">' + ui.esc(s.ip) + ' · ' + ui.esc(s.type) + '</small></td>' +
      '<td data-label="Estado"><span class="badge badge--' + s.status + '">' + N.data.STATUS[s.status] + '</span></td>' +
      '<td data-label="Región">' + ui.esc(N.data.REGIONS[s.region]) + '</td>' +
      '<td data-label="CPU">' + meter(s.cpu, stopped, 'CPU de ' + n) + '</td>' +
      '<td data-label="Memoria">' + meter(s.mem, stopped, 'Memoria de ' + n) + '</td>' +
      '<td class="cell-actions">' +
        '<button class="btn btn--ghost btn--icon" type="button" data-action="config" aria-label="Configurar ' + n + '" title="Configurar">' + ui.icon('i-sliders') + '</button>' +
        '<button class="btn btn--ghost btn--icon" type="button" data-action="restart" aria-label="' + (stopped ? 'Iniciar ' : 'Reiniciar ') + n + '" title="' + (stopped ? 'Iniciar' : 'Reiniciar') + '"' + (busy ? ' disabled' : '') + '>' + ui.icon('i-restart') + '</button>' +
        '<button class="btn btn--danger-ghost btn--icon" type="button" data-action="delete" aria-label="Eliminar ' + n + '" title="Eliminar"' + (busy ? ' disabled' : '') + '>' + ui.icon('i-trash') + '</button>' +
      '</td></tr>';
  }

  function render() {
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    var start = (state.page - 1) * PAGE_SIZE;
    var slice = list.slice(start, start + PAGE_SIZE);

    ui.$('#server-body').innerHTML = slice.map(row).join('');
    ui.$('#server-table').hidden = list.length === 0;
    ui.$('#server-empty').hidden = list.length !== 0;
    ui.$('#server-count').textContent = list.length
      ? 'Mostrando ' + (start + 1) + '–' + (start + slice.length) + ' de ' + list.length + ' instancias'
      : '0 instancias';

    // Paginación
    var nav = ui.$('#pager'), html = '';
    if (pages > 1) {
      html += '<button class="btn btn--secondary btn--icon" type="button" data-page="' + (state.page - 1) + '" aria-label="Página anterior"' + (state.page === 1 ? ' disabled' : '') + '>' + ui.icon('i-chevron-left') + '</button>';
      for (var p = 1; p <= pages; p++) {
        html += '<button class="btn btn--secondary btn--icon pager__page" type="button" data-page="' + p + '" aria-label="Página ' + p + '"' + (p === state.page ? ' aria-current="page"' : '') + '>' + p + '</button>';
      }
      html += '<button class="btn btn--secondary btn--icon" type="button" data-page="' + (state.page + 1) + '" aria-label="Página siguiente"' + (state.page === pages ? ' disabled' : '') + '>' + ui.icon('i-chevron-right') + '</button>';
    }
    nav.innerHTML = html;
    nav.hidden = pages <= 1;
  }

  /* ---------- Dropdown "Ordenar" (menú accesible) ---------- */
  function initDropdown() {
    var wrap = ui.$('#sort-dropdown'), btn = ui.$('#sort-btn'), menu = ui.$('#sort-menu');
    var items = ui.$$('.menu__item', menu);

    function open() {
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      var checked = items.filter(function (i) { return i.getAttribute('aria-checked') === 'true'; })[0] || items[0];
      checked.focus();
    }
    function close(focusBtn) {
      if (menu.hidden) return;
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    }
    function choose(item) {
      state.sort = item.dataset.sort;
      items.forEach(function (i) { i.setAttribute('aria-checked', String(i === item)); });
      ui.$('#sort-label').textContent = 'Ordenar: ' + SORT_LABELS[state.sort];
      state.page = 1;
      close(true);
      render();
    }

    btn.addEventListener('click', function () { menu.hidden ? open() : close(true); });
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.menu__item');
      if (item) choose(item);
    });
    wrap.addEventListener('keydown', function (e) {
      if (menu.hidden) {
        if (e.key === 'ArrowDown' && e.target === btn) { e.preventDefault(); open(); }
        return;
      }
      var i = items.indexOf(d.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Tab') { close(false); }
    });
    d.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(false); });
  }

  /* ---------- Acciones de datos (las invoca overlays.js) ---------- */
  function restart(id) {
    var s = N.domain.byId(id);
    if (!s) return;
    s.status = 'restarting';
    N.bus.emit('servers-changed');
    setTimeout(function () {
      s.status = (s.mem > 90 || s.cpu > 90) ? 'warning' : 'running';
      if (s.cpu === 0) { s.cpu = 14; s.mem = 22; s.status = 'running'; }
      N.bus.emit('servers-changed');
      ui.toast(s.name + ' ya está activa de nuevo.', 'success');
    }, 3500);
  }

  function remove(id) {
    var list = N.data.servers, i = list.findIndex(function (s) { return s.id === id; });
    if (i > -1) list.splice(i, 1);
    N.bus.emit('servers-changed');
  }

  function clearFilters() {
    state.q = ''; state.status = 'all'; state.page = 1;
    ui.$('#server-search').value = '';
    ui.$('#server-status').value = 'all';
    render();
  }

  function init() {
    initDropdown();

    ui.$('#server-search').addEventListener('input', ui.debounce(function (e) {
      state.q = e.target.value; state.page = 1; render();
    }, 200));
    ui.$('#server-status').addEventListener('change', function (e) {
      state.status = e.target.value; state.page = 1; render();
    });
    ui.$('#clear-filters').addEventListener('click', clearFilters);

    ui.$('#pager').addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      state.page = Number(b.dataset.page);
      render();
      var again = ui.$('#pager [data-page="' + state.page + '"][aria-current]') || ui.$('#pager [aria-current]');
      if (again) again.focus();
    });

    ui.$('#server-body').addEventListener('click', function (e) {
      var b = e.target.closest('[data-action]');
      if (!b || b.disabled) return;
      var id = b.closest('tr').dataset.id;
      var action = b.dataset.action;
      if (action === 'config') N.overlays.openConfig(id, b);
      else N.overlays.openConfirm(id, action, b);
    });

    N.bus.on('servers-changed', render);
    render();
  }

  N.servers = { init: init, restart: restart, remove: remove, focusSearch: function () { ui.$('#server-search').focus(); } };
})(window, document);
