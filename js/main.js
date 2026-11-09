/* ==========================================================================
   main.js — Arranque de la aplicación y atajos de teclado globales (5D).
   ========================================================================== */
(function (w, d) {
  'use strict';
  var N = w.Nimbus, ui = N.ui;

  function isTyping(el) {
    return el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
  }

  function initShortcuts() {
    d.addEventListener('keydown', function (e) {
      // Esc: cierra el sidebar móvil (modal, drawer y menús gestionan su propia tecla Escape)
      if (e.key === 'Escape' && N.router.isSidebarOpen()) {
        N.router.closeSidebar(true);
        return;
      }
      // "/" enfoca el buscador (si no se está escribiendo y no hay overlays abiertos)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(d.activeElement) && !N.overlays.anyOpen()) {
        e.preventDefault();
        if (ui.$('#view-servidores').hidden) w.location.hash = '#/servidores';
        setTimeout(N.servers.focusSearch, 0);
      }
    });
  }

  function start() {
    N.theme.init();
    N.dashboard.init();
    N.servers.init();
    N.overlays.init();
    N.guide.init();
    N.router.init();
    initShortcuts();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
