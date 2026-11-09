# Fase 1 · Prototipo interactivo en Figma

> **Enlace público del prototipo (solo lectura):** <https://www.figma.com/proto/RTPtyK3HE15my6DMKe9wKy/NimbusOps---Prototipo?node-id=1-6&starting-point-node-id=1%3A6&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1>
>
> ## Estado del prototipo publicado
>
> El archivo **NimbusOps - Prototipo** tiene 4 frames de 1440 × 900 hechos con las capturas de [capturas/](capturas/): `01 Resumen`, `02 Servidores`, `03 Drawer Configurar` y `04 Modal Eliminar`. Acceso: *Cualquier persona, puede ver*. Se recorrió el flujo en modo Presentar:
>
> | Origen | Disparador | Destino | Animación |
> |---|---|---|---|
> | Sidebar → *Servidores* | Clic | `02 Servidores` | Disolver · 250 ms |
> | Icono papelera | Clic | `04 Modal Eliminar` | Disolver · 250 ms |
> | Icono configurar | Clic | `03 Drawer Configurar` | Disolver · 250 ms |
> | Botón *Eliminar instancia* | Clic | `02 Servidores` | Disolver · 250 ms |
> | Drawer y modal | Tecla `Esc` | Atrás | — |
>
> **Alcance y limitaciones:** solo versión de escritorio; no incluye los estados *Cargando* y *Éxito* ni componentes con variantes (Default/Hover/Focus/Disabled/Loading). Esos estados están implementados y documentados en la vista *Guía de estados* del código. El resto de este documento es el guion completo para ampliar el prototipo.

## 1. Preparación

1. Crear un archivo **NimbusOps – Prototipo** con tres páginas: `Wireframes`, `UI Kit`, `Prototipo`.
2. Importar a `Wireframes` los tres SVG de [wireframes/](wireframes/).
3. En `UI Kit` crear estilos de color y tipografía con los tokens de [variables.css](../css/variables.css):

| Estilo | Claro | Oscuro |
|---|---|---|
| Fondo | `#F3F5FA` | `#0B1020` |
| Superficie | `#FFFFFF` | `#141B2E` |
| Texto | `#121A2E` | `#E9EDF9` |
| Primario | `#3454D1` | `#8FA8FF` |
| Peligro | `#C62828` | `#FF7B7B` |
| Éxito | `#0A7A44` | `#4CD68B` |

Tipografía: Inter (o la del sistema) 13/14/16/18/22/28 px. Radio de esquina: 8 px (controles) y 14 px (tarjetas).

4. Crear componentes con variantes (`State = Default | Hover | Focus | Disabled | Loading`) para **Button** (Primary, Secondary, Danger, Ghost), **Input**, **Select** y **Switch**.

## 2. Frames (cada uno en 1440 × 900 y 390 × 844)

| Frame | Contenido |
|---|---|
| `01 Resumen` | Header, sidebar con *Resumen* activo, Bento Grid. |
| `02 Servidores` | Búsqueda, filtros, tabla/tarjetas, paginación. |
| `03 Drawer · Configurar` | Panel lateral con el formulario. |
| `04 Modal · Eliminar` | Diálogo con campo "Escribe el nombre". |
| `05 Modal · Cargando` | Botón en estado *Loading*, *Cancelar* deshabilitado. |
| `06 Servidores · Éxito` | Fila eliminada + toast "se eliminó correctamente". |
| `07 Menú móvil` | Sidebar abierto con velo (solo 390 px). |

## 3. Flujo principal a validar

```
Resumen ──(sidebar: Servidores)──► Servidores ──(icono papelera)──► Modal Eliminar
        ◄─────(breadcrumb / Volver)────┘                                   │
                                                  (escribir nombre) ──► Botón activo
                                                                           │
                                         (Eliminar) ──► Cargando 1.5 s ──► Servidores + Toast
```

Conexiones en la pestaña *Prototype*:

| Origen | Disparador | Destino | Animación |
|---|---|---|---|
| Sidebar → *Servidores* | On click | `02 Servidores` | Smart animate · 250 ms · ease-out |
| Icono papelera | On click | `04 Modal · Eliminar` (overlay) | Move in · 250 ms |
| Campo nombre (rellenado) | On click | Botón habilitado | Instant |
| Botón *Eliminar instancia* | On click | `05 Modal · Cargando` | Instant |
| `05 Modal · Cargando` | After delay 1500 ms | `06 Servidores · Éxito` | Dissolve · 250 ms |
| Fondo / *Cancelar* / tecla `Esc` | Key/Gamepad = Esc | Cerrar overlay | Move out · 250 ms |
| Logo o *Volver a Resumen* | On click | `01 Resumen` | Smart animate · 250 ms |

## 4. Publicación

1. `Share → Share prototype → Anyone with the link can view`.
2. Activar *Show hotspot hints* y fijar el punto de inicio en `01 Resumen`.
3. Copiar el enlace en este archivo y en el [README](../README.md).

El código en [index.html](../index.html) ya implementa exactamente este flujo, por lo que sirve como referencia visual de cada frame.
