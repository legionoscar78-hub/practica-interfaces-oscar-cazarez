# NimbusOps · Dashboard SPA responsivo

Panel de monitoreo de servidores e instancias cloud para ingenieros DevOps. Práctica integral de **Diseño de Interfaces Web**: UX, las 5 dimensiones del Diseño de Interacción (IxD), maquetación moderna con CSS Grid y Flexbox, y arquitectura de interfaz en tres zonas.

> **Restricción técnica cumplida:** HTML5 semántico + CSS nativo + JavaScript vanilla. Sin Bootstrap, Tailwind ni librerías de componentes o gráficas.

| Entregable | Dónde está |
|---|---|
| Prototipo UX (persona, wireframes, Figma) | [docs/01-user-persona.md](docs/01-user-persona.md) · [docs/02-wireframes.md](docs/02-wireframes.md) · [docs/03-prototipo-figma.md](docs/03-prototipo-figma.md) |
| Código | Este repositorio |
| Reporte técnico de validación | [docs/reporte-validacion.md](docs/reporte-validacion.md) |

Enlace público de Figma (solo lectura): <https://www.figma.com/proto/RTPtyK3HE15my6DMKe9wKy/NimbusOps---Prototipo?node-id=1-6&starting-point-node-id=1%3A6&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1>

## Cómo ejecutarlo

No requiere instalación ni compilación. Los scripts son clásicos (no módulos ES), así que basta con abrir `index.html` con doble clic.

Si prefieres un servidor local:

```bash
python -m http.server 5173
```

Luego abre <http://localhost:5173>.

## Estructura

```
index.html              Marcado semántico, sprite de iconos, drawer y modal
css/
  variables.css         Tokens, tema claro/oscuro (:root + prefers-color-scheme)
  base.css              Reset, tipografía, foco accesible, utilidades
  layout.css            Grid macro, Bento Grid, header, sidebar (mobile-first)
  components.css        Botones, campos, switch, tabla, dropdown, gráficas, toasts
  overlays.css          Drawer y modal (<dialog>) con animaciones
js/
  data.js               Datos simulados y bus de eventos
  ui.js                 Utilidades: toasts, estado Loading, debounce
  theme.js              Modo oscuro (sistema + toggle manual)
  charts.js             Gráficas SVG propias (líneas y dona)
  router.js             Rutas por hash, breadcrumbs, "volver", sidebar
  dashboard.js          Vista Resumen (KPIs, tiempo real simulado)
  servers.js            Vista Servidores (búsqueda, filtro, orden, paginación)
  overlays.js           Drawer de configuración y modal de confirmación
  guide.js              Matriz de los 5 estados por control
  main.js               Arranque y atajos de teclado
docs/                   Persona, wireframes, prototipo, reporte y capturas
tools/capture.mjs       Genera las capturas y las auditorías automáticas
```

## Qué incluye (por fase)

1. **UX y prototipado** — User Persona, wireframes SVG móvil/escritorio, guion del prototipo.
2. **Layout mobile-first** — reglas base para móvil y `@media (min-width)` progresivas; `grid-template-areas` para el macro-layout; Bento Grid de 1 → 2 → 4 columnas; Flexbox en barra superior, grupos de botones, tarjetas e iconos.
3. **Tres zonas** — Zona 1: header fijo, sidebar persistente/retráctil, migas de pan y "Volver a…". Zona 2: KPIs, gráficas en tiempo real, dona, tabla con filtros y paginación. Zona 3: drawer de configuración y modal de confirmación.
4. **Controles y estados** — texto, textarea, select, datepicker, switches y dropdown propio; cada uno con Default · Hover · Focus · Disabled · Loading (ver la vista *Guía de estados*). Modo oscuro nativo y microinteracciones.
5. **Dimensiones de IxD** — tabla checklist con evidencias en el [reporte](docs/reporte-validacion.md).

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `Esc` | Cierra modal, drawer, menú desplegable o sidebar móvil |
| `/` | Enfoca el buscador de servidores |
| `↑` `↓` `Inicio` `Fin` | Navegan las opciones del menú *Ordenar* |
| `Tab` | Recorre los controles (el foco queda atrapado dentro de modal y drawer) |

## Accesibilidad

`<dialog>` modal con foco atrapado y `role="alertdialog"` en confirmaciones · `aria-current`, `aria-expanded`, `aria-pressed`, `aria-busy`, `aria-live` · enlace "Saltar al contenido" · foco movido al título al cambiar de vista · contraste ≥ 4.5:1 en ambos temas · zonas táctiles ≥ 44 px · `prefers-reduced-motion` respetado · color nunca como único indicador.

## Regenerar capturas y auditoría

Con el servidor local activo y Chrome o Edge instalado:

```bash
node tools/capture.mjs
```

Escribe las imágenes y `auditoria.json` en `docs/capturas/` (desbordamiento horizontal, zonas táctiles < 44 px y errores de consola).

## Publicar en GitHub / GitLab

```bash
git init
git add .
git commit -m "feat: estructura base del dashboard"
git remote add origin <URL-del-repositorio>
git push -u origin main
```

Se recomienda un commit por fase (UX, layout, zonas, estados/tema, documentación).
