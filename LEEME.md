# Nuevo · Cartas (firma solo Spacio AM) — 24 sep 2026

Sube estos 11 archivos a la raíz del repo (reemplazan los actuales). No requiere cambios en Apps Script.

## Qué hace
- Nuevo tipo **Carta** en el generador (categoría "Cartas").
- Misma estructura que la carta de promoción: título en Valky arriba, texto y firma al final.
- Machote: título (va arriba y es el nombre en Documentos y del PDF), fecha, "A la atención de", saludo, cuerpo, despedida y firma.
- Viene precargada con la carta de recomendación de Juan Pablo Cortés Soto para Condominio Serena de Arrazola.
- El cuerpo también se edita directo sobre la hoja (lápiz).
- **Firmar carta**: firma solo Spacio AM (firma guardada, dibujada, subida o escrita). Queda registrada en Documentos como Firmada y se descarga el PDF en membrete, sin hoja de certificado.
- PDF y .docx también disponibles sin firmar.

## Archivos
- contracts-cartas.jsx (nuevo) → machote, textos por defecto y firma de la carta
- app.jsx            → tipo Carta, campos, botón Firmar carta
- docs-store.js      → tipo "carta", categoría Cartas, cierre con la firma de Spacio AM solamente
- esign.jsx          → PDF de la carta sin certificado y con su título como nombre
- paginate.jsx       → teléfono y correo bajo la firma; hoja sin título grande
- contract-render.jsx, docx-export.jsx, admin.jsx, i18n.js, styles.css, index.html
