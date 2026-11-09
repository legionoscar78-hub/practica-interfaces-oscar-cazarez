/* ==========================================================================
   router.js — Navegación SPA por hash + ZONA 1:
     ¿Dónde estoy?      -> elemento activo (aria-current) + migas de pan
     ¿De dónde vengo?   -> enlace "Volver a …" con la vista anterior
     ¿A dónde puedo ir? -> sidebar con todas las secciones
   Incluye el comportamiento del sidebar (retráctil en móvil, contraíble en escritorio).
   ========================================================================== */
(function (w, d) {
  'use strict';
  var N = w.Nimbus, ui = N.ui;

  var ROUTES = {
    resumen:    { title: 'Resumen',          group: 'Monitoreo' },
    servidores: { title: 'Servidores',       group: 'Monitoreo' },
    guia:       { title: 'Guía de estados',  group: 'Sistema' }
  };
  var DEFAULT_ROUTE = 'resumen';
  var history = [];
  var current = null;
  var firstRender = true;
  var desktop = w.matchMedia('(min-width: 768px)');

  function parse() {
    var name = location.hash.replace(/^#\/?/, '').split('?')[0];
    return ROUTES[name] ? name : DEFAULT_ROUTE;
  }

  function renderBreadcrumbs(name) {
    var r = ROUTES[name];
    ui.$('#breadcrumbs').innerHTML =
      '<li><a href="#/resumen">Inicio</a></li>' +
      '<li><span>' + ui.esc(r.group) + '</span></li>' +
      '<li><span aria-current="page">' + ui.esc(r.title) + '</span></li>';
  }

  function renderBack() {
    var link = ui.$('#back-link');
    var prev = history.length > 1 ? history[history.length - 2] : null;
    if (prev && prev !== current) {
      link.hidden = false;
      link.setAttribute('href', '#/' + prev);
      ui.$('#back-text').textContent = 'Volver a ' + ROUTES[prev].title;
    } else {
      link.hidden = true;
    }
  }

  function render() {
    var name = parse();
    if (name === current) return;
    current = name;

    // Pila de navegación sin repetidos consecutivos
    var idx = history.lastIndexOf(name);
    if (idx > -1 && idx === history.length - 2) history.pop();   // se volvió atrás
    else if (history[history.length - 1] !== name) history.push(name);
    if (history.length > 20) history.shift();

    ui.$$('[data-view]').forEach(function (v) {
      var active = v.dataset.view === name;
      v.hidden = !active;
      v.classList.remove('is-entering');
      if (active) { void v.offsetWidth; v.classList.add('is-entering'); }
    });
    ui.$$('.nav-link[data-route]').forEach(function (a) {
      if (a.dataset.route === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    renderBreadcrumbs(name);
    renderBack();
    d.title = ROUTES[name].title + ' · NimbusOps';
    closeSidebar();

    // Accesibilidad: mover el foco al título de la nueva vista (no en la carga inicial)
    if (!firstRender) {
      var h = ui.$('[data-view="' + name + '"] h1');
      if (h) h.focus({ preventScroll: true });
      w.scrollTo({ top: 0 });
    }
    firstRender = false;
    N.bus.emit('route', name);
  }

  /* ---------- Sidebar ---------- */
  function openSidebar() {
    var sb = ui.$('#sidebar');
    sb.classList.add('is-open');
    ui.$('#scrim').classList.add('is-visible');
    var btn = ui.$('#menu-btn');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Cerrar menú de navegación');
    var first = sb.querySelector('.nav-link');
    if (first) first.focus();
  }
  function closeSidebar(restoreFocus) {
    var sb = ui.$('#sidebar');
    if (!sb.classList.contains('is-open')) return;
    sb.classList.remove('is-open');
    ui.$('#scrim').classList.remove('is-visible');
    var btn = ui.$('#menu-btn');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú de navegación');
    if (restoreFocus) btn.focus();
  }
  function isSidebarOpen() { return ui.$('#sidebar').classList.contains('is-open'); }

  function setCollapsed(on, persist) {
    var app = ui.$('#app'), btn = ui.$('#collapse-btn');
    app.classList.toggle('is-collapsed', on);
    btn.setAttribute('aria-expanded', String(!on));
    var label = on ? 'Expandir menú' : 'Contraer menú';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.querySelector('.nav-link__text').textContent = label;
    if (persist) { try { localStorage.setItem('nimbus-sidebar', on ? 'collapsed' : 'expanded'); } catch (e) { /* */ } }
  }

  function initSidebar() {
    var pref = null;
    try { pref = localStorage.getItem('nimbus-sidebar'); } catch (e) { /* */ }
    // Tablet (768-1023): por defecto contraído (solo iconos). Escritorio: expandido.
    var def = w.innerWidth < 1024;
    setCollapsed(pref ? pref === 'collapsed' : def, false);

    ui.$('#menu-btn').addEventListener('click', function () {
      if (isSidebarOpen()) closeSidebar(true); else openSidebar();
    });
    ui.$('#scrim').addEventListener('click', function () { closeSidebar(true); });
    ui.$('#collapse-btn').addEventListener('click', function () {
      setCollapsed(!ui.$('#app').classList.contains('is-collapsed'), true);
    });
    desktop.addEventListener
      ? desktop.addEventListener('change', function () { closeSidebar(); })
      : desktop.addListener(function () { closeSidebar(); });
  }

  function init() {
    initSidebar();
    w.addEventListener('hashchange', render);
    if (!location.hash) history.push(DEFAULT_ROUTE);
    render();
  }

  N.router = { init: init, closeSidebar: closeSidebar, isSidebarOpen: isSidebarOpen };
})(window, document);
