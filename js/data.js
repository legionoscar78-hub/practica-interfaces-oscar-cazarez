/* ==========================================================================
   data.js — Datos simulados (no hay backend) y estado compartido de la app.
   Todos los módulos cuelgan de un único espacio de nombres: window.Nimbus
   ========================================================================== */
(function (w) {
  'use strict';
  var N = (w.Nimbus = w.Nimbus || {});

  var REGIONS = {
    'us-east': 'Virginia (us-east)',
    'eu-west': 'Irlanda (eu-west)',
    'sa-east': 'São Paulo (sa-east)',
    'ap-south': 'Mumbai (ap-south)'
  };

  // Costo mensual aproximado por tipo de instancia (USD)
  var TYPES = {
    't3.small': 15,
    't3.medium': 30,
    'm5.large': 70,
    'c5.xlarge': 124,
    'r5.large': 91
  };

  var STATUS = {
    running: 'Activo',
    warning: 'Con alerta',
    stopped: 'Detenido',
    restarting: 'Reiniciando'
  };

  // [nombre, región, tipo, estado, cpu, memoria, autoescalado]
  var SEED = [
    ['api-gateway-01', 'us-east', 'c5.xlarge', 'running', 46, 58, true],
    ['api-gateway-02', 'us-east', 'c5.xlarge', 'running', 52, 61, true],
    ['web-prod-01', 'us-east', 'm5.large', 'running', 38, 49, true],
    ['web-prod-02', 'eu-west', 'm5.large', 'warning', 91, 84, false],
    ['web-prod-03', 'eu-west', 'm5.large', 'running', 44, 52, true],
    ['auth-service-01', 'us-east', 't3.medium', 'running', 27, 40, false],
    ['auth-service-02', 'sa-east', 't3.medium', 'running', 31, 43, false],
    ['db-primary', 'us-east', 'r5.large', 'warning', 78, 93, false],
    ['db-replica-01', 'eu-west', 'r5.large', 'running', 41, 72, false],
    ['db-replica-02', 'sa-east', 'r5.large', 'running', 36, 69, false],
    ['cache-redis-01', 'us-east', 't3.medium', 'running', 22, 64, false],
    ['cache-redis-02', 'eu-west', 't3.medium', 'running', 25, 66, false],
    ['worker-queue-01', 'sa-east', 't3.small', 'running', 63, 47, true],
    ['worker-queue-02', 'sa-east', 't3.small', 'stopped', 0, 0, true],
    ['batch-etl-01', 'ap-south', 'c5.xlarge', 'running', 68, 55, false],
    ['batch-etl-02', 'ap-south', 'c5.xlarge', 'stopped', 0, 0, false],
    ['search-index-01', 'eu-west', 'r5.large', 'running', 57, 78, false],
    ['search-index-02', 'eu-west', 'r5.large', 'running', 54, 76, false],
    ['mail-relay-01', 'us-east', 't3.small', 'running', 12, 28, false],
    ['cdn-origin-01', 'ap-south', 'm5.large', 'running', 49, 45, true],
    ['cdn-origin-02', 'ap-south', 'm5.large', 'warning', 87, 71, true],
    ['monitor-agent-01', 'us-east', 't3.small', 'running', 18, 33, false],
    ['staging-web-01', 'sa-east', 't3.small', 'stopped', 0, 0, false],
    ['staging-api-01', 'sa-east', 't3.medium', 'running', 21, 37, false]
  ];

  function pad(n) { return String(n).padStart(2, '0'); }
  function isoInDays(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  var servers = SEED.map(function (s, i) {
    return {
      id: 'srv-' + pad(i + 1),
      name: s[0],
      region: s[1],
      type: s[2],
      status: s[3],
      cpu: s[4],
      mem: s[5],
      autoscale: s[6],
      mail: i % 3 !== 0,
      restart: i % 4 === 0 ? 'on-failure' : 'never',
      desc: '',
      maintenance: isoInDays(7 + ((i * 5) % 40)),
      ip: '10.' + (10 + (i % 4)) + '.' + (20 + i) + '.' + (11 + ((i * 7) % 200))
    };
  });

  var alerts = [
    { tone: 'bad', icon: 'i-alert', text: 'db-primary: memoria al 93 %, cerca del límite.', when: 'Hace 3 min' },
    { tone: 'bad', icon: 'i-alert', text: 'web-prod-02: CPU sostenida sobre el 90 % durante 10 min.', when: 'Hace 12 min' },
    { tone: 'warn', icon: 'i-activity', text: 'cdn-origin-02: latencia 40 % por encima de lo normal.', when: 'Hace 27 min' },
    { tone: 'info', icon: 'i-info', text: 'Mantenimiento programado en eu-west el próximo martes.', when: 'Hace 1 h' }
  ];

  var volumes = [
    { name: 'Volumen de datos (db-primary)', used: 82, size: '1 TB' },
    { name: 'Volumen de logs', used: 54, size: '500 GB' },
    { name: 'Volumen de respaldos', used: 31, size: '2 TB' }
  ];

  N.data = {
    REGIONS: REGIONS,
    TYPES: TYPES,
    STATUS: STATUS,
    servers: servers,
    alerts: alerts,
    volumes: volumes
  };

  // Utilidades de dominio compartidas
  N.domain = {
    byId: function (id) { return servers.filter(function (s) { return s.id === id; })[0]; },
    countByStatus: function () {
      var c = { running: 0, warning: 0, stopped: 0, restarting: 0 };
      servers.forEach(function (s) { c[s.status] += 1; });
      return c;
    },
    alertCount: function () { return servers.filter(function (s) { return s.status === 'warning'; }).length; },
    monthlyCost: function () {
      return servers.reduce(function (sum, s) { return s.status === 'stopped' ? sum : sum + TYPES[s.type]; }, 0);
    }
  };

  // Eventos mínimos entre módulos (publicar / suscribirse)
  var listeners = {};
  N.bus = {
    on: function (evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    emit: function (evt, payload) { (listeners[evt] || []).forEach(function (fn) { fn(payload); }); }
  };
})(window);
