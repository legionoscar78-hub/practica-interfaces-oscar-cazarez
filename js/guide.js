/* ==========================================================================
   guide.js — Vista "Guía de estados": muestra, en una matriz, los 5 estados
   (Default, Hover, Focus, Disabled, Loading) de cada botón y campo.
   Hover y Focus se fuerzan con las clases .is-hover / .is-focus.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var N = w.Nimbus, ui = N.ui;
  var STATES = ['Default', 'Hover', 'Focus', 'Disabled', 'Loading'];

  function header(firstCol) {
    return '<span class="matrix__h">' + firstCol + '</span>' +
      STATES.map(function (s) { return '<span class="matrix__h">' + s + '</span>'; }).join('');
  }

  /* ---- Botones ---- */
  function buttonCell(variant, state, label) {
    var cls = 'btn btn--' + variant + (state === 'Hover' ? ' is-hover' : '') + (state === 'Focus' ? ' is-focus' : '') + (state === 'Loading' ? ' is-loading' : '');
    var attrs = ' type="button"';
    if (state === 'Disabled') attrs += ' disabled';
    if (state === 'Loading') attrs += ' aria-disabled="true" aria-busy="true"';
    var text = state === 'Loading' ? 'Cargando…' : label;
    return '<div class="matrix__cell"><button class="' + cls + '"' + attrs + '><span class="btn__spinner" aria-hidden="true"></span><span class="btn__label">' + text + '</span></button></div>';
  }

  function buildButtons() {
    var rows = [
      ['primary', 'Primario', 'Guardar'],
      ['secondary', 'Secundario', 'Cancelar'],
      ['danger', 'Destructivo', 'Eliminar'],
      ['ghost', 'Fantasma', 'Ver más']
    ];
    var html = header('Variante');
    rows.forEach(function (r, i) {
      if (i) html += '<hr>';
      html += '<span class="matrix__row">' + r[1] + '</span>' +
        STATES.map(function (s) { return buttonCell(r[0], s, r[2]); }).join('');
    });
    ui.$('#matrix-buttons').innerHTML = html;
  }

  /* ---- Campos ---- */
  var uid = 0;
  function fieldCell(kind, state) {
    var id = 'demo' + (++uid);
    var hov = state === 'Hover' ? ' is-hover' : '';
    var foc = state === 'Focus' ? ' is-focus' : '';
    var dis = state === 'Disabled' ? ' disabled' : '';
    var load = state === 'Loading';
    var label = '<label class="sr-only" for="' + id + '">' + kind.label + ' (' + state + ')</label>';

    if (kind.type === 'switch') {
      return '<div class="matrix__cell"><label class="switch' + hov.replace(' is-hover', ' is-hover') + foc.replace('is-focus', 'is-focus') + (load ? ' is-loading' : '') + '">' +
        '<input type="checkbox" role="switch"' + dis + (state === 'Default' || state === 'Disabled' ? '' : ' checked') + (load ? ' aria-busy="true"' : '') + ' aria-label="' + kind.label + ' (' + state + ')">' +
        '<span class="switch__track" aria-hidden="true"></span><span class="switch__text">' + (load ? 'Aplicando…' : 'Autoescalado') + '</span></label></div>';
    }
    var control;
    if (kind.type === 'textarea') {
      control = '<textarea class="textarea' + hov + foc + '" id="' + id + '" rows="2"' + dis + (load ? ' readonly aria-busy="true"' : '') + ' placeholder="Descripción"></textarea>';
    } else if (kind.type === 'select') {
      return '<div class="matrix__cell"><div class="control select' + (load ? ' is-loading' : '') + '">' + label +
        '<select class="input' + hov + foc + '" id="' + id + '"' + dis + (load ? ' aria-busy="true"' : '') + '><option>Elegir región</option></select>' +
        ui.icon('i-chevron-down', 'select__icon') + '</div></div>';
    } else {
      control = '<input class="input' + hov + foc + '" id="' + id + '" type="' + kind.type + '"' + dis + (load ? ' readonly aria-busy="true"' : '') +
        (kind.type === 'text' ? ' placeholder="nombre-instancia"' : '') + '>';
    }
    return '<div class="matrix__cell"><div class="control' + (load ? ' is-loading' : '') + '">' + label + control + '</div></div>';
  }

  function buildFields() {
    var kinds = [
      { type: 'text', label: 'Campo de texto', row: 'Campo de texto' },
      { type: 'textarea', label: 'Área de texto', row: 'Área de texto' },
      { type: 'select', label: 'Selector desplegable', row: 'Dropdown (select)' },
      { type: 'date', label: 'Selector de fecha', row: 'Datepicker' },
      { type: 'switch', label: 'Interruptor', row: 'Switch / toggle' }
    ];
    var html = header('Control');
    kinds.forEach(function (k, i) {
      if (i) html += '<hr>';
      html += '<span class="matrix__row">' + k.row + '</span>' +
        STATES.map(function (s) { return fieldCell(k, s); }).join('');
    });
    ui.$('#matrix-fields').innerHTML = html;
  }

  function init() {
    buildButtons();
    buildFields();
  }

  N.guide = { init: init };
})(window, document);
