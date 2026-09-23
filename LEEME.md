# Archivos modificados

## ⚠️ Esta vez SÍ hay que actualizar Apps Script
1. Copia **apps-script-contratos.txt** completo en Code.gs del proyecto de Contratos.
2. Ejecuta **instalar()** una vez (▷). Pedirá un permiso nuevo (activadores y
   leer la hoja de EPI): acéptalo. Crea el activador enviarProgramados (cada 5 min)
   y la hoja PROGRAMADOS.
3. Implementar → Administrar implementaciones → editar → **Nueva versión**.
La cuenta que corre el script necesita acceso de lectura a la hoja de EPI
(1-SfKC-evkK24qfOrrvIrcDs6ckGAmRzSLS_IYB8cYZg).

## Sube también index.html
Trae las versiones nuevas (?v=) de cada archivo. Sin eso el navegador —sobre todo
en el teléfono— puede seguir usando las copias viejas guardadas.

## Nuevo · Envío programado (hora de Guatemala)
- Al enviar para firma: "Enviar ahora" o "Programar" con fecha y hora de
  Guatemala (atajos Hoy/Mañana 7:00 y 9:00). Guatemala es UTC−6 fijo: vale
  aunque programes desde otro país.
- El servidor guarda los correos ya armados y los manda solo a la hora — con
  el navegador cerrado. Al salir, el documento pasa a "Enviado a firma".
- En el detalle: "Enviar ahora" o "Cancelar envío".

## Nuevo · Renombrar documento
- Campo "Nombre del documento" al enviar; "Renombrar" en el detalle de
  cualquier documento ya creado. Cambia lista, hoja, PDF y próximos correos;
  el contenido del contrato no cambia.

## Nuevo · Propiedad vinculada (co-hosting)
- Selector de propiedades de EPI en el generador (co-hosting) y en el detalle
  del documento, antes o después de enviarlo. La lista sale de EPI → Config → props.

## Archivos nuevos
- envios.jsx → selector de propiedad, programación, renombrar, aviso de programado.


## Nuevo · Usar un documento existente como base
- app.jsx    → "Punto de partida" en el generador: Desde cero / Usar uno
               existente (buscador por folio, tipo o nombre). Carga tipo,
               datos, cláusulas editadas y contrato personalizado; la fecha
               pasa a hoy. El original no cambia: al enviar sale folio nuevo.
- admin.jsx  → botón Duplicar en cada fila de Documentos y en el detalle:
               abre el generador con esos datos precargados.
- admin.css  → columna de acción de la tabla.
 — 23 sep 2026

## 0 · El enlace de firma se quedaba en "Abriendo tu documento…"
El enlace descargaba el registro COMPLETO (todos los contratos con sus firmas
incrustadas, varios MB) y sin límite de tiempo. En el teléfono la respuesta no
terminaba de llegar y la pantalla nunca cambiaba.

- sheets-sync.js → nuevo getDoc(id): trae solo ese documento. Toda llamada
                   tiene límite de tiempo.
- admin.jsx      → el enlace usa getDoc; a los 8 s avisa "está tardando";
                   si no hay respuesta, pantalla con "Intentar de nuevo".
                   Ya no descarga el registro completo en el teléfono.

Los enlaces que ya enviaste siguen funcionando: no hay que reenviar nada.

## 0b · Contratos más livianos
El peso venía de las firmas: el pad guardaba el lienzo completo al doble de
resolución (≈60,000 caracteres por firma). Ahora cada firma se recorta al
trazo y se guarda a máx. 480×160 px (≈6–10 K caracteres) — en el PDF se ve
igual de nítida porque impresa ocupa menos que eso.

- esign.jsx → compactSignature(): toda firma (dibujada, subida o escrita)
              pasa por ahí antes de guardarse.
- admin.jsx → al abrir el panel, los contratos ya firmados con firmas
              pesadas se aligeran una sola vez en segundo plano, se marcan y se reescriben.

El certificado y su sello no dependen de la imagen: no cambian.

Súbelos a la raíz del repo (reemplazan los actuales). No requiere cambios en Apps Script.

## 1 · El correo de firma que no salía (SAM-000129 y SAM-000130)
El modal "Enviar para firma" creaba el documento y lo daba por enviado, pero
nunca llamaba a la plantilla del correo — solo el botón Reenviar lo hacía.

- esign.jsx      → SendModal manda un correo por firmante, espera la
                   confirmación del servidor y guarda el resultado en el
                   documento. Si falla, lo dice.
- app.jsx        → el aviso refleja el resultado real del envío
- admin.jsx      → toast honesto al generar; marca "Correo no entregado" en la
                   lista; aviso con acción en el detalle; Reenviar actualiza el estado
- admin.css      → estilos del aviso (peach de atención, no rojo)
- sheets-sync.js → la nota del modal viaja con el correo
- emails.js      → esa nota aparece como párrafo en la solicitud de firma

**Para los dos contratos de ayer:** ábrelos en Documentos y usa **Reenviar**
— sale el correo con el mismo enlace.

## 2 · Nuevo tipo: Adelanto de pago
Campos: nombre, DPI, monto total, fecha de depósito, número de cuotas,
periodicidad y monto por cuota (se calcula solo si lo dejas vacío).
El monto se escribe en letras automáticamente.

- contracts-empleados.jsx → builder buildAdelanto + monto en letras
- app.jsx                 → tipo "Adelanto de pago", campos y defaults
- docs-store.js           → etiqueta emp_adelanto

## 3 · Firma única (solo el adelanto)
El adelanto lo firma únicamente el colaborador, así que cierra como
**Firmado** con esa firma: no pide contrafirma de Spacio AM, cuenta "1 de 1",
y ni el certificado ni la hoja de FIRMAS/CONTRATOS agregan una parte que el
documento no tiene. Los demás tipos siguen requiriendo las dos firmas.

- docs-store.js   → SOLO_FIRMANTE + cierre sin contrafirma
- admin.jsx       → conteo y botones sin contrafirma
- esign.jsx       → certificado y resumen sin la parte de Spacio AM
- sheets-sync.js  → filas de CONTRATOS y FIRMAS coherentes
