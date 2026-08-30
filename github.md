repo: jforce15-coder/Grow-spacioam
branch: main

## Last sync
date: 2026-08-30T15:40:00Z
### Updated in this project
- Entrega para deploy: `DEPLOY.md` con qué subir, hosting, las tres configuraciones de producción (URLs absolutas de imágenes de correo, Web App de Apps Script, control de usuarios) y prueba de humo.
- Todos los correos con la shell de `mi-spacioam/Correos a socios.html` e imágenes editoriales por contexto en `assets/email/`.
- Permisos por usuario (`perms.js`), enlace público de firma, tooltips en las acciones del registro y responsive completo (hoja del firmante ajustada al contenedor).

## Screen map
| Pantalla | Archivos de este proyecto | Fuente en GitHub |
|---|---|---|
| Login del panel | admin.jsx · admin.css | mi-spacioam/login.jsx |
| Header + navegación + filtros + tabla | admin.jsx · admin.css | mi-spacioam/index.html, dashboard.jsx |
| Correos de firma | emails.js · assets/email/ | mi-spacioam/Correos a socios.html (shell con banner) |
| Proceso de firma + certificado | esign.jsx · docs-store.js | Grow-spacioam/Esquema Google Sheets.dc.html (hojas CONTRATOS/FIRMAS) |
| Auth unificado | sa-auth-client.js | Grow-spacioam/sa-auth-client.js |
| Base de datos y archivo | sheets-sync.js | Grow-spacioam/Esquema Google Sheets.dc.html (hojas 13 CONTRATOS y 14 FIRMAS) |
| Controles del panel (select, segmented) | panel-ui.jsx | mi-spacioam/ui.jsx (Select, Segmented) |
| Notificaciones | noti-center.jsx · noti-data.js | mi-spacioam/noti-center.jsx (portado de Grow) |
| Mi cuenta · Setup | account.jsx | mi-spacioam/sections.jsx (AccountSection) |

## Sync history
- 2026-08-30T15:12:00Z — Correos con la shell de mi-spacioam + imágenes por contexto; panel con PanelSelect/PanelSeg.
- 2026-08-30T14:36:11Z — NotiBell/push de mi-spacioam, enlace público de firma, editor de secciones centrado + lista en el panel, botones pill.
- 2026-08-30T14:20:00Z — Header con divider + NotiBell, menú de perfil, Mi cuenta/Setup, co-hosting corto/largo plazo, pedir datos al propietario, remitente hola@spacioam.com.
- 2026-08-30T13:35:00Z — Firma guiada tipo eSign, certificado con el esquema CONTRATOS/FIRMAS, base de datos en hoja + archivo en Drive.
- 2026-08-21T00:58:55Z — Grow leído como referencia de patrón: edición por cláusula (`contrato.js`) y reglas de membrete/paginación (`prompt-contrato.txt`).

## Notes
Otros repos leídos como referencia visual: `jforce15-coder/mi-spacioam` (panel de administración) y `jforce15-coder/Epi-spacioam` (correos).
