# Subir a producción — 23 sep 2026

Solo los 6 archivos que difieren de lo que hay hoy en el repo Docs-spacioam (main).
Súbelos a la raíz (reemplazan los actuales). No requiere cambios en Apps Script.

- index.html           → versiones nuevas (?v=) para que el navegador no use copias viejas
- contracts-cartas.jsx → carta: fecha a la derecha, negritas, saltos y espacios del editor
- paginate.jsx         → saltos de línea y espacios del editor; fecha de carta a la derecha; nombre del firmante en una línea
- styles.css           → estilos de fecha, espacios y nombre en una línea
- esign.jsx            → firma nítida; PDF firmado + certificado a mayor resolución
- docx-export.jsx      → saltos y espacios también en el .docx

Después: recarga con Cmd+Shift+R y vuelve a guardar tu firma una vez (la guardada es de baja calidad).
