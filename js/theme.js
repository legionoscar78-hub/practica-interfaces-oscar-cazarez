/* ==========================================================================
   theme.js — Modo oscuro nativo.
   Prioridad: elección manual guardada > preferencia del sistema
   (@media prefers-color-scheme definido en css/variables.css).
   ========================================================================== */
(function (w, d) {
  'use strict';
  var N = w.Nimbus;
  var KEY = 'nimbus-theme';
  var root = d.documentElement;
  var mq = w.matchMedia('(prefers-color-scheme: dark)');

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* sin almacenamiento */ }
  }

  function isDark() {
    var manual = root.getAttribute('data-theme');
    return manual ? manual === 'dark' : mq.matches;
  }

  function paint() {
    var btn = N.ui.$('#theme-btn');
    var dark = isDark();
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
    btn.title = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    N.ui.$('#theme-icon use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
  }

  function set(mode) {
    root.setAttribute('data-theme', mode);
    save(mode);
    paint();
    N.bus.emit('theme', mode);
  }

  function init() {
    // Parámetro de ayuda para capturas y pruebas: ?theme=dark | light
    var q = new URLSearchParams(location.search).get('theme');
    if (q === 'dark' || q === 'light') root.setAttribute('data-theme', q);

    N.ui.$('#theme-btn').addEventListener('click', function () {
      set(isDark() ? 'light' : 'dark');
      N.ui.toast(isDark() ? 'Modo oscuro activado.' : 'Modo claro activado.');
    });

    // Si el usuario no eligió manualmente, seguimos los cambios del sistema
    var onChange = function () { if (!stored()) paint(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);

    paint();
  }

  N.theme = { init: init, isDark: isDark };
})(window, document);
