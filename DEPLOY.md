# Deploy — Spacio AM · Contratos

App estática (HTML + JSX en el navegador). No hay build: se sube tal cual y funciona.

## 1 · Qué subir

Todo el proyecto **menos** estas carpetas, que son de trabajo:

```
uploads/        capturas y PDFs que subiste durante el diseño
screenshots/    capturas de revisión
github.md       registro de sincronización (opcional en producción)
DEPLOY.md       este archivo
```

Estructura mínima que debe quedar en el servidor:

```
index.html
styles.css  admin.css  spacio-tokens.css
app.jsx  admin.jsx  account.jsx  esign.jsx  contracts*.jsx  paginate.jsx
brand.jsx  panel-ui.jsx  noti-center.jsx
emails.js  docs-store.js  perms.js  i18n.js  noti-data.js  sync.js  docx-export.jsx
sa-auth-client.js
assets/      (brand, email, letterhead, glifos)
fonts/       (Valky)
letterhead/  (membretes)
_ds/         (design system Spacio AM)
```

## 2 · Hosting

Cualquier hosting estático sirve. Con GitHub:

```bash
git init
git add .
git commit -m "Contratos Spacio AM"
git branch -M main
git remote add origin https://github.com/jforce15-coder/Contratos-spacioam.git
git push -u origin main
```

Luego **Settings → Pages → Deploy from a branch → main / root**, o conectar el repo a Vercel/Netlify
(sin comando de build, output = raíz).

Dominio sugerido: `contratos.spacioam.com`.

> Requiere servirse por HTTP(S), no `file://` (los `.jsx` se cargan con fetch).

## 3 · Tres cosas por configurar en producción

**a. Imágenes de los correos.** Un correo necesita URLs absolutas. En `emails.js`:

```js
var IMG  = "assets/email/";                 // ← vista previa local
var LOGO = "assets/email/logo-wordmark.png";
```

cambiar a:

```js
var IMG  = "https://contratos.spacioam.com/assets/email/";
var LOGO = "https://contratos.spacioam.com/assets/email/logo-wordmark.png";
```

**b. Envío real de correos y escritura en la hoja.** Hoy el app arma el correo y muestra la vista previa;
el envío y la escritura salen por el Web App de Apps Script, igual que en las otras apps.
Se configura en **Setup → Base de datos y archivo → URL del Web App**. El script necesita permiso sobre:

- Hoja `CONTRATOS` y `FIRMAS` (una fila por documento y una por firmante).
- Carpeta de Drive `Contratos firmados` (PDF + certificado).
- Envío desde `hola@spacioam.com` (remitente `Spacio AM`).

**c. Control de usuarios.** `sa-auth-client.js` es el mismo cliente unificado de las otras apps
(mismo endpoint y token; solo cambia la clave de app: `contratos`). El administrador principal está fijo
en `perms.js`:

```js
var OWNER = "jovalle@spacioam.com";
```

Los permisos que él otorga (*generar*, *firmar*, *administrar el registro*) se guardan hoy en el navegador
(`localStorage: spacio_perms_v1`). Cuando el Web App esté conectado conviene moverlos a la hoja de usuarios
para que valgan en cualquier dispositivo.

## 4 · Enlace de firma

El correo lleva a:

```
https://contratos.spacioam.com/index.html?firmar=<id>
```

Esa vista funciona **sin usuario**. Si la persona ya tiene sesión de otra app de Spacio AM, al terminar
aparece "Ver mis documentos" y entra al panel viendo solo los documentos asociados a su correo.

## 5 · Prueba de humo después del deploy

1. Entrar con `jovalle@spacioam.com` → se ven las 4 pestañas.
2. Generar un contrato de limpieza, editar una cláusula, enviarlo a firma.
3. Abrir el enlace `?firmar=…` en el teléfono: la hoja debe caber completa y el flotante "Firmar ahora" debe ser solo la píldora.
4. Firmar → descargar la copia con certificado.
5. Setup → agregar un correo y darle solo *generar*; entrar con él y confirmar que no puede cancelar ni eliminar.
6. Documentos → cancelar el documento de prueba y eliminarlo.

## 6 · Datos de prueba

El registro vive en `localStorage` (`spacio_docs_v1`). Para dejar el ambiente limpio: eliminar los
documentos de prueba desde su detalle, o borrar esa clave en el navegador.
