/* ==========================================================================
   overlays.js — ZONA 3: Drawer de configuración y Modal de confirmación.
   Basados en <dialog> nativo (foco atrapado, ::backdrop, role de diálogo).
   · Escape cierra · clic en el fondo cierra · el foco vuelve al elemento que abrió
   · Animación de apertura y cierre (250–350 ms)
   ========================================================================== */
(function (w, d) {
  'use strict';
  var N = w.Nimbus, ui = N.ui;

  var drawer, modal, form;
  var openers = new WeakMap();
  var busy = new WeakMap();      // diálogos con una operación en curso: no se pueden cerrar

  /* ----------------------------- Núcleo común ----------------------------- */
  function show(dlg, opener) {
    openers.set(dlg, opener || d.activeElement);
    dlg.classList.remove('is-closing');
    dlg.showModal();
  }

  function hide(dlg) {
    if (!dlg.open || dlg.classList.contains('is-closing') || busy.get(dlg)) return;
    dlg.classList.add('is-closing');
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      dlg.removeEventListener('animationend', onEnd);
      dlg.classList.remove('is-closing');
      dlg.close();
      var op = openers.get(dlg);
      if (op && op.isConnected && !op.disabled) op.focus();
      else {
        var h = ui.$('[data-view]:not([hidden]) h1');
        if (h) h.focus({ preventScroll: true });
      }
    }
    function onEnd(e) { if (e.target === dlg && !e.pseudoElement) finish(); }
    dlg.addEventListener('animationend', onEnd);
    setTimeout(finish, 450);                       // red de seguridad
  }

  function wire(dlg) {
    // Escape (evento "cancel" nativo): usamos el cierre animado
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); hide(dlg); });
    // Clic sobre el fondo (::backdrop reporta el <dialog> como destino)
    var downOnBackdrop = false;
    dlg.addEventListener('pointerdown', function (e) { downOnBackdrop = e.target === dlg; });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg && downOnBackdrop) hide(dlg);
      var closer = e.target.closest('[data-close]');
      if (closer && dlg.contains(closer)) hide(dlg);
    });
  }

  /* ------------------------------- Drawer -------------------------------- */
  var cfg = { id: null, original: null, token: 0, nameOk: true, checking: false };

  function fields() {
    return {
      name: ui.$('#cfg-name'), desc: ui.$('#cfg-desc'), type: ui.$('#cfg-type'), region: ui.$('#cfg-region'),
      date: ui.$('#cfg-date'), restart: ui.$('#cfg-restart'), autoscale: ui.$('#cfg-autoscale'), mail: ui.$('#cfg-mail')
    };
  }

  function snapshot() {
    var f = fields();
    return JSON.stringify([f.name.value.trim(), f.desc.value, f.type.value, f.date.value, f.restart.value, f.autoscale.checked, f.mail.checked]);
  }

  function todayIso() {
    var t = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
  }

  function setError(fieldId, inputId, errorId, msg) {
    var field = ui.$(fieldId), input = ui.$(inputId), err = ui.$(errorId + ' span');
    field.classList.toggle('has-error', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    err.textContent = msg || '';
  }

  function nameProblem(v) {
    v = v.trim();
    if (!v) return 'Escribe un nombre para la instancia.';
    if (/[^a-z0-9-]/.test(v)) return 'Usa solo minúsculas, números y guiones.';
    if (v.length < 3 || v.length > 32) return 'El nombre debe tener entre 3 y 32 caracteres.';
    return '';
  }
  function dateProblem(v) {
    if (v && v < todayIso()) return 'Elige una fecha de hoy en adelante.';
    return '';
  }

  function refreshSave() {
    var dirty = snapshot() !== cfg.original;
    var save = ui.$('#cfg-save');
    var ok = dirty && cfg.nameOk && !cfg.checking && !dateProblem(fields().date.value);
    save.disabled = !ok;
  }

  function checkName() {
    var f = fields(), v = f.name.value.trim();
    var problem = nameProblem(v);
    var control = ui.$('#cfg-name-control'), hint = ui.$('#cfg-name-hint'), field = ui.$('#f-name');
    var token = ++cfg.token;
    field.classList.remove('has-ok');
    hint.textContent = 'Usa minúsculas, números y guiones (3 a 32 caracteres).';

    if (problem) {
      control.classList.remove('is-loading'); f.name.removeAttribute('aria-busy');
      cfg.checking = false; cfg.nameOk = false;
      setError('#f-name', '#cfg-name', '#cfg-name-error', problem);
      return refreshSave();
    }
    setError('#f-name', '#cfg-name', '#cfg-name-error', '');
    var original = N.domain.byId(cfg.id).name;
    if (v === original) {
      control.classList.remove('is-loading'); f.name.removeAttribute('aria-busy');
      cfg.checking = false; cfg.nameOk = true;
      return refreshSave();
    }
    // Validación asíncrona simulada: estado Loading del campo
    cfg.checking = true; cfg.nameOk = false;
    control.classList.add('is-loading'); f.name.setAttribute('aria-busy', 'true');
    hint.textContent = 'Verificando disponibilidad…';
    refreshSave();
    setTimeout(function () {
      if (token !== cfg.token) return;
      var taken = N.data.servers.some(function (s) { return s.id !== cfg.id && s.name === v; });
      control.classList.remove('is-loading'); f.name.removeAttribute('aria-busy');
      cfg.checking = false; cfg.nameOk = !taken;
      if (taken) setError('#f-name', '#cfg-name', '#cfg-name-error', 'Ya existe una instancia con ese nombre. Prueba con otro.');
      else { field.classList.add('has-ok'); hint.textContent = 'Nombre disponible.'; }
      refreshSave();
    }, 650);
  }

  function openConfig(id, opener) {
    var s = N.domain.byId(id);
    if (!s) return;
    var f = fields();
    cfg.id = id; cfg.token++; cfg.nameOk = true; cfg.checking = false;

    ui.$('#drawer-title').textContent = s.name;
    f.name.value = s.name;
    f.desc.value = s.desc;
    f.type.innerHTML = Object.keys(N.data.TYPES).map(function (t) {
      return '<option value="' + t + '"' + (t === s.type ? ' selected' : '') + '>' + t + ' · $' + N.data.TYPES[t] + '/mes</option>';
    }).join('');
    f.region.innerHTML = '<option>' + ui.esc(N.data.REGIONS[s.region]) + '</option>';
    f.date.min = todayIso();
    f.date.value = s.maintenance;
    f.restart.value = s.restart;
    f.autoscale.checked = s.autoscale;
    f.mail.checked = s.mail;

    ui.$('#cfg-desc-count').textContent = f.desc.value.length + ' / 200';
    ui.$('#cfg-name-control').classList.remove('is-loading');
    ui.$('#f-name').classList.remove('has-ok');
    ui.$('#cfg-name-hint').textContent = 'Usa minúsculas, números y guiones (3 a 32 caracteres).';
    setError('#f-name', '#cfg-name', '#cfg-name-error', '');
    setError('#f-date', '#cfg-date', '#cfg-date-error', '');
    ui.setLoading(ui.$('#cfg-save'), false);

    cfg.original = snapshot();
    ui.$('#cfg-save').disabled = true;
    show(drawer, opener);
    f.name.focus();
    f.name.select();
  }

  function initDrawer() {
    drawer = ui.$('#drawer');
    form = ui.$('#config-form');
    wire(drawer);
    var f = fields();

    f.name.addEventListener('input', ui.debounce(checkName, 350));
    f.name.addEventListener('input', function () { ui.$('#cfg-save').disabled = true; });
    f.desc.addEventListener('input', function () {
      ui.$('#cfg-desc-count').textContent = f.desc.value.length + ' / 200';
      refreshSave();
    });
    [f.type, f.restart, f.mail].forEach(function (el) { el.addEventListener('change', refreshSave); });
    f.date.addEventListener('change', function () {
      setError('#f-date', '#cfg-date', '#cfg-date-error', dateProblem(f.date.value));
      refreshSave();
    });

    // Switch con estado Loading (verificación de cuota simulada)
    f.autoscale.addEventListener('change', function () {
      var wrap = ui.$('#sw-autoscale-wrap');
      wrap.classList.add('is-loading');
      f.autoscale.setAttribute('aria-busy', 'true');
      ui.wait(650).then(function () {
        wrap.classList.remove('is-loading');
        f.autoscale.removeAttribute('aria-busy');
        refreshSave();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var save = ui.$('#cfg-save');
      if (save.classList.contains('is-loading') || save.disabled) return;

      var np = nameProblem(f.name.value), dp = dateProblem(f.date.value);
      setError('#f-name', '#cfg-name', '#cfg-name-error', np || (cfg.nameOk ? '' : ui.$('#cfg-name-error span').textContent));
      setError('#f-date', '#cfg-date', '#cfg-date-error', dp);
      if (np || dp || !cfg.nameOk) { (np || !cfg.nameOk ? f.name : f.date).focus(); return; }

      ui.setLoading(save, true, 'Guardando…');
      busy.set(drawer, true);
      ui.wait(1200).then(function () {
        var s = N.domain.byId(cfg.id);
        s.name = f.name.value.trim();
        s.desc = f.desc.value.trim();
        s.type = f.type.value;
        s.maintenance = f.date.value;
        s.restart = f.restart.value;
        s.autoscale = f.autoscale.checked;
        s.mail = f.mail.checked;
        busy.set(drawer, false);
        ui.setLoading(save, false);
        hide(drawer);
        N.bus.emit('servers-changed');
        ui.toast('Cambios guardados en ' + s.name + '.', 'success');
      });
    });
  }

  /* -------------------------------- Modal -------------------------------- */
  var pending = { id: null, action: null };

  var COPY = {
    restart: function (s) {
      var starting = s.status === 'stopped';
      return {
        tone: 'warning', icon: 'i-restart',
        title: starting ? '¿Iniciar ' + s.name + '?' : '¿Reiniciar ' + s.name + '?',
        text: starting
          ? 'La instancia se encenderá y empezará a recibir tráfico en unos segundos.'
          : 'La instancia dejará de responder unos 30 segundos y se perderán las conexiones activas.',
        confirm: starting ? 'Iniciar instancia' : 'Reiniciar instancia',
        loading: starting ? 'Iniciando…' : 'Reiniciando…',
        needsName: false
      };
    },
    delete: function (s) {
      return {
        tone: 'danger', icon: 'i-trash',
        title: '¿Eliminar ' + s.name + '?',
        text: 'Se borrarán la instancia y sus datos locales. Esta acción no se puede deshacer.',
        confirm: 'Eliminar instancia',
        loading: 'Eliminando…',
        needsName: true
      };
    }
  };

  function openConfirm(id, action, opener) {
    var s = N.domain.byId(id);
    if (!s || !COPY[action]) return;
    var c = COPY[action](s);
    pending.id = id; pending.action = action;

    ui.$('#modal-title').textContent = c.title;
    ui.$('#modal-desc').textContent = c.text;
    var icon = ui.$('#modal-icon');
    icon.dataset.tone = c.tone;
    icon.querySelector('use').setAttribute('href', '#' + c.icon);

    var field = ui.$('#modal-confirm-field'), input = ui.$('#modal-confirm-input');
    field.hidden = !c.needsName;
    ui.$('#modal-confirm-name').textContent = s.name;
    input.value = '';

    var btn = ui.$('#modal-confirm-btn');
    ui.setLoading(btn, false);
    btn.querySelector('.btn__label').textContent = c.confirm;
    btn.dataset.label = c.confirm;
    btn.dataset.loading = c.loading;
    btn.disabled = c.needsName;                    // Disabled hasta escribir el nombre
    ui.$('#modal-cancel').disabled = false;

    show(modal, opener);
    // Foco seguro: en acciones simples, en "Cancelar"; si hay que escribir, en el campo
    (c.needsName ? input : ui.$('#modal-cancel')).focus();
  }

  function initModal() {
    modal = ui.$('#confirm-modal');
    wire(modal);
    var input = ui.$('#modal-confirm-input'), btn = ui.$('#modal-confirm-btn');

    input.addEventListener('input', function () {
      var s = N.domain.byId(pending.id);
      btn.disabled = !s || input.value.trim() !== s.name;
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (!btn.disabled) btn.click(); }
    });

    btn.addEventListener('click', function () {
      var s = N.domain.byId(pending.id);
      if (!s || btn.disabled) return;
      ui.setLoading(btn, true, btn.dataset.loading);
      ui.$('#modal-cancel').disabled = true;
      busy.set(modal, true);
      ui.wait(1500).then(function () {
        busy.set(modal, false);
        ui.setLoading(btn, false);
        hide(modal);
        if (pending.action === 'delete') {
          N.servers.remove(s.id);
          ui.toast(s.name + ' se eliminó correctamente.', 'success');
        } else {
          N.servers.restart(s.id);
          ui.toast('Reiniciando ' + s.name + '. Te avisaremos cuando termine.');
        }
      });
    });
  }

  function init() { initDrawer(); initModal(); }

  N.overlays = {
    init: init,
    openConfig: openConfig,
    openConfirm: openConfirm,
    anyOpen: function () { return drawer.open || modal.open; }
  };
})(window, document);
