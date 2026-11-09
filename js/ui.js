/* ==========================================================================
   ui.js — Utilidades de interfaz: selectores, iconos, toasts y estado Loading.
   ========================================================================== */
(function (w, d) {
  'use strict';
  var N = w.Nimbus;

  var $ = function (sel, root) { return (root || d).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); };

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function icon(id, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
  }

  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  /* ---- Estado Loading de un botón: indicador + bloqueo de reenvío ---- */
  function setLoading(btn, on, text) {
    var label = btn.querySelector('.btn__label');
    if (on) {
      if (btn.classList.contains('is-loading')) return;
      btn.dataset.label = label ? label.textContent : '';
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      btn.setAttribute('aria-disabled', 'true'); // sigue enfocable, pero ignora clics
      if (label && text) label.textContent = text;
    } else {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('aria-disabled');
      if (label && btn.dataset.label) label.textContent = btn.dataset.label;
    }
  }

  // Seguro adicional: un botón con aria-disabled="true" nunca ejecuta su acción
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[aria-disabled="true"]');
    if (b) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  /* ---- Toasts (retroalimentación inmediata) ---- */
  function toast(message, tone) {
    var host = $('#toasts');
    var el = d.createElement('div');
    var iconId = tone === 'error' ? 'i-alert' : tone === 'success' ? 'i-check-circle' : 'i-info';
    el.className = 'toast' + (tone ? ' toast--' + tone : '');
    el.innerHTML = icon(iconId, 'toast__icon') +
      '<p class="toast__text">' + esc(message) + '</p>' +
      '<button class="btn btn--ghost btn--icon" type="button" aria-label="Cerrar notificación">' + icon('i-close') + '</button>';
    host.appendChild(el);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 260);
    }
    el.querySelector('button').addEventListener('click', close);
    setTimeout(close, 5000);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  N.ui = { $: $, $$: $$, esc: esc, icon: icon, wait: wait, setLoading: setLoading, toast: toast, debounce: debounce };
})(window, document);
