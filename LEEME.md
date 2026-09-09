# Subir a Docs-spacioam@main

## 1 · Apps Script (PRIMERO, y es lo que de verdad arregla la falla)

`apps-script-contratos.txt` **no va al repo**: es el código del Apps Script.
Ábrelo, copia todo, pégalo sobre el proyecto actual y **vuelve a publicar la
implementación** (Implementar → Administrar implementaciones → editar → Nueva versión).
La URL del Web App no cambia y no hay que tocar las 6 propiedades.

**Por qué:** una celda de Google Sheets admite 50,000 caracteres. El contrato
SAM-000128 con las dos firmas incrustadas pesa **78,735**. La escritura fallaba
*en el servidor* — no era la red del firmante ni la pestaña cerrada. El registro
ahora se reparte en trozos de 45,000 caracteres a lo ancho de la fila y se vuelve
a unir al leer, y `guardarDoc` **relee la fila y compara** antes de responder
`ok`: un ok ahora significa "quedó guardado", no "la petición llegó".
Las filas viejas de una sola celda se siguen leyendo igual.

## 2 · Cinco archivos a la raíz del repo

| Archivo | Qué cambia |
|---|---|
| `sheets-sync.js` | Bandeja de salida + escritura verificada. `push` espera confirmación de las dos hojas (`DOCUMENTOS` y `CONTRATOS`/`FIRMAS`) y las trata como una sola tarea; si una falla, el documento queda en cola marcando cuál faltó y `flush()` reintenta solo esa. `pull()` fusiona en vez de sobreescribir: si un navegador tiene una firma que la hoja no conoce, gana la local y se vuelve a subir. |
| `esign.jsx` | La firma se registra en la hoja **antes** de dar el paso por terminado. Si no confirma, el firmante ve el aviso (no un "listo" falso) y se reintenta cada 15 s. La copia firmada ya sale también cuando es el firmante quien cierra el documento — antes solo salía si Spacio AM firmaba de último. |
| `admin.jsx` | `flush()` antes de cada `pull()` (al abrir y al recuperar el foco) y aviso con botón *Reintentar* en Documentos cuando hay firmas sin confirmar. |
| `admin.css` | Estilo de ese aviso. |
| `docs-store.js` | Sin cambios de comportamiento (se retiró la conciliación manual, que ya no hace falta). |

## 3 · Después de publicar

1. Refresca docs.spacioam.com sin caché.
2. Avísame: yo registro la firma de Roberto en SAM-000128 y el contrato queda finalizado.

## Ojo

La carpeta `deploy/` del proyecto es una copia vieja y no incluye `sheets-sync.js`.
Si algo se sirve desde ahí, hay que actualizarla o eliminarla.
