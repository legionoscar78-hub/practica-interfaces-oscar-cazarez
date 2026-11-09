# Fase 1 · Ficha de User Persona

> Arquetipo usado para tomar todas las decisiones de diseño de **NimbusOps**.

| | |
|---|---|
| **Nombre** | Valeria Ortiz |
| **Rol** | Ingeniera Cloud / DevOps (guardia de infraestructura) |
| **Edad** | 31 años |
| **Empresa** | Proveedora de infraestructura tecnológica (~400 instancias en 4 regiones) |
| **Nivel técnico** | Alto en infraestructura y terminal; medio en diseño. Prefiere interfaces densas pero claras. |
| **Dispositivos** | Laptop 15" con monitor externo (jornada) · Smartphone Android (guardias nocturnas y fines de semana) |
| **Entorno** | Trabaja con varias pestañas abiertas, a menudo en modo oscuro; en guardia usa el móvil con una sola mano. |

> *"Si algo se cae a las 3 a. m., necesito ver qué pasa en cinco segundos y poder reiniciarlo sin miedo a tocar la instancia equivocada."*

## Metas

1. Ver de un vistazo el estado de toda la flota (instancias activas, CPU, memoria, alertas).
2. Localizar rápido una instancia concreta (búsqueda, filtros, orden) y ajustar sus parámetros.
3. Ejecutar acciones críticas (reiniciar, eliminar) **con seguridad**: saber qué va a pasar y poder arrepentirse.
4. Resolver incidencias desde el móvil sin pelearse con una interfaz de escritorio encogida.

## Frustraciones

- Paneles que mezclan decenas de métricas sin jerarquía: no distingue lo urgente de lo normal.
- Botones diminutos en el móvil que provocan toques equivocados sobre acciones destructivas.
- Confirmaciones genéricas ("¿Seguro?") que no dicen qué instancia se verá afectada.
- No saber en qué sección está ni cómo volver; perder el filtro al cambiar de vista.
- Interfaces claras que deslumbran en una guardia nocturna; temas oscuros con bajo contraste.
- Acciones que "parecen no hacer nada": sin indicador de carga repite el clic y duplica la operación.

## Escenarios de uso cotidiano

| # | Escenario | Dispositivo | Qué necesita de la interfaz |
|---|---|---|---|
| 1 | **Revisión matutina.** Abre el resumen para comprobar que la noche fue tranquila. | Escritorio | KPIs y gráficas legibles; alertas ordenadas por prioridad. |
| 2 | **Alerta de CPU.** Recibe un aviso; busca `web-prod-02`, revisa su carga y la reinicia. | Móvil | Buscador rápido, tarjetas táctiles, modal de confirmación que nombre la instancia. |
| 3 | **Ajuste de capacidad.** Activa el autoescalado y programa mantenimiento para la semana siguiente. | Escritorio | Panel lateral con formulario (texto, fecha, switches) sin abandonar la tabla. |
| 4 | **Limpieza de entornos.** Elimina instancias de pruebas obsoletas. | Escritorio | Confirmación que exige escribir el nombre; estado de carga y aviso al terminar. |

## Mapa de decisiones de diseño derivadas

| Necesidad de Valeria | Decisión en NimbusOps |
|---|---|
| Ver lo urgente primero | Bento Grid con KPIs arriba y badge rojo de alertas en el sidebar. |
| Móvil en guardia | Zonas táctiles ≥ 44 px; la tabla se convierte en tarjetas; sidebar retráctil. |
| Evitar errores destructivos | Modal con nombre de la instancia, foco inicial en *Cancelar*, botón *Eliminar* bloqueado hasta escribir el nombre. |
| Trabajar de noche | Modo oscuro automático (`prefers-color-scheme`) + toggle manual, contraste ≥ 4.5:1. |
| Orientación | Elemento activo resaltado, migas de pan y enlace "Volver a…". |
| Confianza en el sistema | Estados `Loading` con spinner y reenvío bloqueado; toasts de confirmación. |
