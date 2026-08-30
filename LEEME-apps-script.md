# LEEME — Backend de Contratos Spacio AM

Instrucciones para instalar `apps-script-contratos.txt` como Web App de Google Apps Script.
Cuenta que lo aloja: **jforce15@gmail.com** (con permiso para enviar como `hola@spacioam.com`).

---

## 1 · Crear el proyecto

1. Entra a **https://script.google.com** con `jforce15@gmail.com`.
2. **Nuevo proyecto** → renómbralo `Contratos Spacio AM`.
3. Borra todo el contenido de `Code.gs` y pega el código completo de
   `apps-script-contratos.txt`.
4. Guarda (⌘S / Ctrl+S).

> El código **no** lleva datos sensibles escritos: el token, los ids de la hoja y de la
> carpeta viven en las **Propiedades del script**. El paso siguiente las siembra.

---

## 2 · Sembrar las propiedades y autorizar

1. En la barra de funciones del editor elige **`instalar`** y pulsa **▷ Ejecutar**.
2. Google pedirá autorización: **Revisar permisos → elegir la cuenta →
   Avanzado → Ir a Contratos Spacio AM (no seguro) → Permitir**.
   (Ese aviso es normal: el script es tuyo y no está publicado en el Marketplace.)
3. Al terminar, mira el **Registro de ejecución**. Debe decir que las hojas se crearon
   y que el alias `hola@spacioam.com` está disponible.

Eso crea en la hoja de cálculo cinco pestañas con formato legible:

| Pestaña | Qué guarda |
|---|---|
| `CONTRATOS` | Una fila por documento: folio, fechas, firmantes, estado, certificado, ruta en Drive |
| `FIRMAS` | Una fila por firmante: parte, nombre, correo, método, huella del documento |
| `DOCUMENTOS` | El documento completo en JSON — es lo que hace que el enlace de firma funcione en cualquier dispositivo |
| `PERMISOS` | Quién puede generar, firmar y administrar |
| `FIRMAS_GUARDADAS` | La firma que cada usuario decidió guardar para futuros contratos |

### Ver o cambiar las propiedades

**Configuración del proyecto** (el engranaje ⚙ de la izquierda) → **Propiedades del script**:

| Clave | Valor |
|---|---|
| `TOKEN` | `Spacio2026!` |
| `SHEET_ID` | `1r__zfIAFLr6mxcuAN6HwQF1OmLTG-lce-jv_naGRDVU` |
| `FOLDER_ID` | `1GzxF5El3YaT0UVZLMBeRIfwXgzZxyqSa` |
| `FROM_EMAIL` | `hola@spacioam.com` |
| `FROM_NAME` | `Spacio AM` |
| `OWNER` | `jovalle@spacioam.com` |

Cambiar el token o mover la carpeta se hace **aquí**, no en el código.

---

## 3 · Confirmar el alias del remitente

Para que los correos salgan como **Spacio AM \<hola@spacioam.com\>** y no como
`jforce15@gmail.com`, el alias debe estar verificado en esa cuenta:

Gmail (jforce15@gmail.com) → **Configuración → Ver todos los ajustes → Cuentas e importación
→ "Enviar como"** → debe aparecer `hola@spacioam.com`.

Si no aparece, agrégalo ahí (Google manda un correo de confirmación) y vuelve a ejecutar
`instalar()`. El script detecta el alias solo: si está, lo usa; si no, envía desde la cuenta
base con *responder a* `hola@spacioam.com`, sin fallar.

---

## 4 · Publicar el Web App

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Tipo (engranaje ⚙ junto a "Seleccionar tipo") → **Aplicación web**.
3. Configura:
   - **Descripción:** `v1`
   - **Ejecutar como:** *Yo (jforce15@gmail.com)*
   - **Quién tiene acceso:** **Cualquier persona**
4. **Implementar** → copia la **URL del web app** (termina en `/exec`).

> "Cualquier persona" es indispensable: el firmante abre el enlace del correo sin
> iniciar sesión en Google. La seguridad la da el `TOKEN`, no el login.

### Cada vez que edites el código

**Implementar → Administrar implementaciones → ✏️ (lápiz) → Versión: Nueva versión → Implementar.**
Así la URL **no cambia**. Si en cambio creas una implementación nueva, la URL cambia y hay
que volver a pegarla en el app.

---

## 5 · Conectar el web app

En **docs.spacioam.com** → menú de perfil → **Setup → Base de datos y archivo**:

1. Pega la URL `/exec` en **URL del Web App**.
2. Guarda. El estado debe decir **Conectada**.

*(Ya tienes una URL pegada y en estado "Conectada". Si la vuelves a implementar como
versión nueva, no hace falta tocar nada.)*

---

## 6 · Probar que funciona

En el editor de Apps Script, ejecuta estas funciones y mira el registro:

| Función | Qué comprueba |
|---|---|
| `diagnostico()` | Acceso a la hoja y a la carpeta, alias disponibles, cuota de correos, token cargado |
| `pruebaCorreo()` | Manda un correo real al administrador principal |

Después, desde el web app:

1. Genera un contrato de prueba y envíalo a firma → debe aparecer una fila en `CONTRATOS`.
2. Abre el enlace `?firmar=…` **en otro dispositivo** → el documento debe cargar
   (eso confirma que `DOCUMENTOS` está funcionando).
3. Firma → el PDF con certificado debe llegar a Drive, en
   `Contratos firmados / 2026 / 08 Agosto / <categoría>`.

---

## 7 · Qué hace cada acción

El web app envía `POST` con el cuerpo en JSON. Todas llevan `token`.

| Acción | Para qué |
|---|---|
| `ping` | Comprobar que el endpoint responde |
| `upsertContrato` | Escribe/actualiza la fila del documento en `CONTRATOS` y sus filas en `FIRMAS` (busca por folio: no duplica) |
| `guardarDoc` | Guarda el documento completo en `DOCUMENTOS` |
| `listarDocs` | Devuelve todos los documentos guardados |
| `getDoc` | Devuelve un documento por id — lo usa el enlace `?firmar=` |
| `borrarDoc` | Elimina un documento del registro |
| `enviarCorreo` | Manda el correo HTML (con PDF adjunto opcional) |
| `archivarPDF` | Sube el PDF firmado a Drive, creando año / mes / categoría |
| `permisos` | Lee o guarda los permisos por usuario |
| `firmaGuardada` | Lee, guarda o borra la firma reutilizable de un usuario |

Para leer sin problemas de CORS existe también el `GET` con JSONP:

```
…/exec?action=getDoc&id=doc_123&token=Spacio2026!&callback=cb
```

---

## 8 · Pendiente en el web app

El backend queda completo, pero el app **todavía no lo llama** para todo. Hoy escribe en
`CONTRATOS`/`FIRMAS` y guarda el resto en el navegador. Falta conectar:

- `guardarDoc` al enviar y al firmar cada documento.
- `getDoc` cuando la URL trae `?firmar=` y el documento no está en el navegador local
  — **esto es lo que hace que el enlace del correo funcione para cualquier persona.**
- `enviarCorreo` en lugar de solo previsualizar.
- `archivarPDF` al completarse las firmas.
- `permisos` y `firmaGuardada` en lugar de `localStorage`.

Dime cuando tengas la URL implementada y lo conecto todo.

---

## 9 · Seguridad y límites

- El **token** es lo único que protege la escritura. No lo publiques en un repositorio
  público: vive en las propiedades del script y en Setup (navegador del administrador).
  Para rotarlo: cámbialo en Propiedades del script **y** en Setup.
- *Ejecutar como: yo* hace que los correos salgan de tu cuenta y que el script acceda a la
  hoja y a la carpeta sin que el firmante inicie sesión.
- **Cuota de Gmail:** 500 correos/día en cuentas gratuitas (`@gmail.com`), 1,500 en
  Workspace. `diagnostico()` te dice cuántos quedan hoy.
- Apps Script tolera ~6 min por ejecución; los PDF se suben en base64, así que conviene
  mantenerlos por debajo de ~10 MB.
