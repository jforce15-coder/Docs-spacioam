/* Prueba con dobles de los enlaces cortos de Docs (Hub #488 · T4): apps-script/enlaces.js, pasando por doPost de
   Código.js y la sesión de sesion.js, sin Sheets, Gmail ni red.
   1. «acortar» dos veces el mismo enlace da el mismo código (también sin la caché); 5 caracteres del alfabeto sin 0/o ni
      1/l/i, la celda va como texto y la hoja ENLACES se crea sola. Si el código sorteado ya existe, se sortea otro.
   2. «enlace» (pública, sin sesión ni TOKEN) con un código válido devuelve solo el enlace y suma un clic; uno raro o que no
      existe da error y nada más, y nunca crea la hoja.
   3. «acortar» sin sesión se rechaza (con SESION_EXIGIR apagado y encendido); con sesión o con la llave del robot (el Hub)
      pasa. Un enlace de otro dominio (también de otra app de Spacio AM) no se acorta.
   4. Lo que Docs manda sale corto con docs.spacioam.com: el correo para firmar (botón y texto; las imágenes no), también el
      programado, y «Copiar enlace» del panel. Si la hoja falla, sale el largo.
   5. 404.html pregunta al Apps Script de Docs y solo abre docs.spacioam.com o Google Drive / Docs; ningún archivo del sitio
      tiene forma de código sin estar reservado.
   node .github/enlaces.js [carpeta apps-script] */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const DIR = process.argv[2] || path.join(__dirname, '..', 'apps-script');
const RAIZ = path.join(DIR, '..');
let fallo = 0; const ok = (c, m) => { if (c) console.log('✓ ' + m); else { console.log('::error::' + m); fallo = 1; } };
const ABC = '23456789abcdefghjkmnpqrstuvwxyz', CODIGO = /^[23456789abcdefghjkmnpqrstuvwxyz]{5}$/;
const CORTO = /^https:\/\/docs\.spacioam\.com\/([23456789abcdefghjkmnpqrstuvwxyz]{5})$/;
const CAB = ['codigo', 'url', 'app', 'creado', 'por', 'clics', 'ultimo'];
const FIRMAR = 'https://docs.spacioam.com/index.html?firmar=dk7q2m9x4';
const LLAVE = 'llave-del-robot-de-prueba', TOKEN = 'Spacio2026!';

/* Una hoja de cálculo de mentira: filas en memoria, con lo que usa enlaces.js. */
function hojaFalsa(filas) {
  const sh = { filas, formatos: [],
    getDataRange: () => ({ getValues: () => sh.filas.map(f => f.slice()) }),
    getLastRow: () => sh.filas.length,
    setFrozenRows() {},
    getRange(r, c, nr, nc) {
      nr = nr || 1; nc = nc || 1;
      const rango = {
        setValues(vals) { vals.forEach((fila, i) => { while (sh.filas.length < r + i) sh.filas.push([]); fila.forEach((v, j) => { sh.filas[r + i - 1][c + j - 1] = v; }); }); return rango; },
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => ((sh.filas[r + i - 1] || [])[c + j - 1]) ?? '')),
        setNumberFormat(f) { sh.formatos.push([r, c, f]); return rango; }, setFontWeight() { return rango; }
      };
      return rango;
    } };
  return sh;
}

function caja(o) {
  o = o || {};
  const hojas = {}, cache = {}, props = { SESION_EXIGIR: o.exigir ? '1' : null }, correos = [];
  if (o.filas) hojas.ENLACES = hojaFalsa(o.filas);
  const azar = (o.azar || []).slice();
  const M = Object.create(Math); M.random = () => (azar.length ? azar.shift() : Math.random());
  const ctx = {
    console: { log() {}, warn() {}, error() {} }, JSON, Date, Math: M, String, Number, Object, Array, RegExp, Error, Buffer, isNaN,
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = String(v); } }) },
    CacheService: { getScriptCache: () => ({ get: k => cache[k] ?? null, put: (k, v) => { cache[k] = String(v); }, remove: k => { delete cache[k]; } }) },
    LockService: { getUserLock: () => ({ hasLock: () => false, tryLock: () => !o.sinCandado, waitLock() {}, releaseLock() {} }),
                   getScriptLock: () => ({ hasLock: () => false, tryLock: () => true, waitLock() { if (o.scriptOcupado) throw new Error('ocupado'); }, releaseLock() {} }) },
    ContentService: { createTextOutput: s => ({ getContent: () => s, setMimeType() { return this; } }), MimeType: { JSON: 'json', JAVASCRIPT: 'js' } },
    Utilities: { DigestAlgorithm: { MD5: 'md5', SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, sleep() {},
      computeDigest: (alg, t) => Array.from(crypto.createHash(alg).update(String(t)).digest()).map(b => (b > 127 ? b - 256 : b)),
      base64EncodeWebSafe: b => Buffer.from(b.map(x => x & 255)).toString('base64url'), formatDate: d => new Date(d).toISOString() },
    SpreadsheetApp: { openById: () => { if (o.hojaRota) throw new Error('Sheets no responde');
      return { getSheetByName: n => hojas[n] || null, insertSheet: n => (hojas[n] = hojaFalsa([])) }; } },
    GmailApp: { getAliases: () => [], sendEmail: (para, asunto, texto, op) => correos.push({ para, asunto, texto, html: (op || {}).htmlBody || '' }) },
    Session: { getActiveUser: () => ({ getEmail: () => 'cuenta@ejemplo.com' }) },
    UrlFetchApp: { fetch() { throw new Error('la prueba no sale a internet'); } }
  };
  vm.createContext(ctx);
  ['Código.js', 'sesion.js', 'cupo.js', 'enlaces.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctx, { filename: f }));
  // La llave del robot de esta prueba (la de verdad solo vive en las Propiedades del Hub) y una sesión de mentira.
  vm.runInContext("SES_ROBOT_HASH_ = '" + crypto.createHash('sha256').update(LLAVE).digest('hex') + "';", ctx);
  ctx.sesionDe_ = b => (b && b.session === 'firmada' ? { email: 'equipo@ejemplo.com', nombre: 'Equipo' } : null);
  const api = body => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) } }).getContent());
  return { ctx, hojas, cache, correos, props, api, filas: () => (hojas.ENLACES ? hojas.ENLACES.filas : null) };
}
const SES = 'firmada';

/* ── 1 ── mismo código, formato, hoja que se crea sola, choque */
{ const c = caja();
  const r1 = c.api({ action: 'acortar', url: FIRMAR, session: SES }), r2 = c.api({ action: 'acortar', url: FIRMAR, session: SES });
  ok(r1.ok && r2.ok && r1.codigo === r2.codigo && CODIGO.test(r1.codigo), '«acortar» dos veces el mismo enlace da el mismo código (' + r1.codigo + ')');
  ok(r1.corto === 'https://docs.spacioam.com/' + r1.codigo, 'el corto lleva la dirección de Docs: ' + r1.corto);
  Object.keys(c.cache).forEach(k => delete c.cache[k]);
  ok(c.api({ action: 'acortar', url: FIRMAR, session: SES }).codigo === r1.codigo, '…también sin la caché: lo busca en la hoja');
  ok(c.filas() && c.filas().length === 2 && JSON.stringify(c.filas()[0]) === JSON.stringify(CAB), 'la hoja ENLACES se crea sola: encabezado (codigo · url · app · creado · por · clics · ultimo) y una sola fila');
  const f = c.filas()[1];
  ok(f[0] === r1.codigo && f[1] === FIRMAR && f[2] === 'docs' && f[4] === 'equipo@ejemplo.com' && f[5] === 0, 'la fila guarda el código, el enlace, la app, quién y 0 clics');
  ok(c.hojas.ENLACES.formatos.some(x => x[0] === 2 && x[1] === 1 && x[2] === '@'), 'la celda del código va como texto (no se vuelve número)');
  const vistos = new Set([r1.codigo]); let bien = true;
  for (let i = 0; i < 200; i++) { const r = c.api({ action: 'acortar', url: FIRMAR + i, session: SES }); if (!r.ok || !CODIGO.test(r.codigo) || vistos.has(r.codigo)) bien = false; vistos.add(r.codigo); }
  ok(bien, '200 enlaces más: todos con el formato y sin repetir código'); }

{ // El azar da primero «22222» (ya existe) y después «33333».
  const i2 = ABC.indexOf('2') / 31 + 0.001, i3 = ABC.indexOf('3') / 31 + 0.001;
  const c = caja({ filas: [CAB, ['22222', 'https://docs.spacioam.com/index.html?firmar=dotrodoc1', 'docs', '', '', 0, '']], azar: [i2, i2, i2, i2, i2, i3, i3, i3, i3, i3] });
  const r = c.api({ action: 'acortar', url: FIRMAR, session: SES });
  ok(r.ok && r.codigo === '33333' && c.filas().length === 3, 'si el código choca con uno que ya existe, se sortea otro'); }

/* ── 2 ── «enlace» pública */
{ const c = caja({ scriptOcupado: true, filas: [CAB, ['k7q2m', FIRMAR, 'docs', '2026-11-12', 'equipo', 3, ''], ['zzzzz', 'https://evil.example.com/robo', 'docs', '', '', 0, ''], [22222, FIRMAR + 'b', 'docs', '', '', 0, '']] });
  const r = c.api({ action: 'enlace', codigo: 'k7q2m' });
  ok(r.ok && r.data.url === FIRMAR && Object.keys(r.data).join() === 'url' && Object.keys(r).sort().join() === 'data,ok', '«enlace» sin sesión ni TOKEN devuelve solo el enlace (y no espera el candado de las escrituras)');
  ok(c.filas()[1][5] === 4 && c.filas()[1][6], 'y suma un clic y apunta la hora (ultimo)');
  ok(c.api({ action: 'enlace', codigo: 'K7Q2M' }).data.url === FIRMAR && c.filas()[1][5] === 5, 'el código sirve en mayúsculas también');
  ok(c.api({ action: 'enlace', codigo: '22222' }).data.url === FIRMAR + 'b', 'un código que la hoja guardó como número igual se abre');
  const malos = ['k7q2', 'k7q2m1', 'k7q0m', 'k7qlm', 'k7q m', "' or 1", '', null, 'k7q2m/../x'].map(x => c.api({ action: 'enlace', codigo: x }));
  ok(malos.every(x => x.ok === false && !x.data), 'un código con forma rara da error y ningún dato');
  const no = c.api({ action: 'enlace', codigo: 'abcde' });
  ok(no.ok === false && !no.data && /no existe/.test(no.error), 'un código que no existe da «Este enlace no existe.» y ningún dato');
  const fuera = c.api({ action: 'enlace', codigo: 'zzzzz' });
  ok(fuera.ok === false && !fuera.data && c.filas()[2][5] === 0, 'si alguien escribe a mano otro dominio en la hoja, no se redirige allá ni cuenta clic');
  const sin = caja();
  ok(sin.api({ action: 'enlace', codigo: 'k7q2m' }).ok === false && !sin.hojas.ENLACES, 'sin la hoja: «enlace» da error y no crea la hoja'); }

/* ── 3 ── quién puede acortar y qué */
[false, true].forEach(exigir => {
  const c = caja({ exigir, filas: [CAB, ['k7q2m', FIRMAR, 'docs', '', '', 0, '']] }), tag = exigir ? ' (SESION_EXIGIR = 1)' : ' (SESION_EXIGIR apagado)';
  const sin = c.api({ action: 'acortar', url: FIRMAR + 'nuevo', token: TOKEN });
  ok(sin.ok === false && c.filas().length === 2, '«acortar» sin sesión (aunque traiga el TOKEN de la página) se rechaza y no escribe nada' + tag);
  const llaveMala = c.api({ action: 'acortar', url: FIRMAR + 'nuevo', robot: 'otra' });
  ok(llaveMala.ok === false && c.filas().length === 2, '«acortar» con otra llave se rechaza' + tag);
  ok(c.api({ action: 'enlace', codigo: 'k7q2m' }).data.url === FIRMAR, '«enlace» sin sesión pasa' + tag);
  const con = c.api({ action: 'acortar', url: FIRMAR + 'nuevo', session: SES });
  ok(con.ok && CORTO.test(con.corto), '«acortar» con sesión pasa' + tag);
  const robot = c.api({ action: 'acortar', url: FIRMAR + 'robot', robot: LLAVE, por: 'Juan' });
  ok(robot.ok && CORTO.test(robot.corto) && c.filas()[c.filas().length - 1][4] === 'Alma · Juan', '«acortar» con la llave del robot (el Hub) pasa y la fila dice que lo pidió Alma' + tag);
});

{ const c = caja();
  const malos = ['https://evil.example.com/?firmar=' + 'x'.repeat(40), 'http://docs.spacioam.com/index.html?firmar=' + 'x'.repeat(20), 'https://docs.spacioam.com.evil.com/' + 'x'.repeat(40),
    'https://evil.com@docs.spacioam.com/' + 'x'.repeat(40), 'https://docs.spacioam.com:8443/' + 'x'.repeat(40), 'javascript:alert(1)', 'https://docs.spacioam.com/ x', '',
    'https://hub.spacioam.com/?conv=' + 'x'.repeat(40), 'https://grow.spacioam.com/?datos=' + 'x'.repeat(40), 'https://hola.spacioam.com/?lt=' + 'x'.repeat(40),
    'https://docs.spacioam.com/' + 'a'.repeat(2100)];
  const rs = malos.map(u => c.api({ action: 'acortar', url: u, session: SES }));
  ok(rs.every(r => r.ok === false) && !c.hojas.ENLACES, 'un enlace de otro dominio (también de otra app: Hub, Grow, Hola), sin https, con @ o puerto no se acorta');
  ok(malos.every(u => c.ctx.acortar_(u, 'x') === u), 'acortar_ los devuelve tal cual');
  const drive = c.api({ action: 'acortar', url: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view', session: SES });
  ok(drive.ok && CORTO.test(drive.corto), 'los de Google Drive sí se acortan (con la dirección de Docs)');
  ok(c.ctx.acortar_('https://docs.spacioam.com/', 'x') === 'https://docs.spacioam.com/', 'la dirección sola (se escribe a mano) no se acorta');
  const rota = caja({ hojaRota: true }), sc = caja({ sinCandado: true });
  ok(rota.ctx.acortar_(FIRMAR, 'x') === FIRMAR && sc.ctx.acortar_(FIRMAR, 'x') === FIRMAR && !sc.hojas.ENLACES, 'si la hoja o el candado fallan, sale el enlace largo (nunca frena un envío)'); }

/* ── 4 ── lo que Docs manda sale corto */
{ // El correo de verdad: la plantilla de emails.js (la misma del navegador), mandada por la acción enviarCorreo.
  const win = {}; vm.runInNewContext(fs.readFileSync(path.join(RAIZ, 'emails.js'), 'utf8'), { window: win });
  const m = win.SpacioEmails.build('solicitudFirma', { nombre: 'Ana Prueba', correo: 'firmante@ejemplo.com', documento: 'Contrato de prueba', folio: 'SAM-000001', url: FIRMAR }, {});
  ok(m.html.indexOf('href="' + FIRMAR + '"') >= 0, '(la plantilla de verdad lleva hoy el enlace largo en el botón)');
  const c = caja();
  const r = c.api({ action: 'enviarCorreo', token: TOKEN, session: SES, to: 'firmante@ejemplo.com', asunto: 'Listo para firmar', html: m.html, texto: m.text || ('Revisar y firmar: ' + FIRMAR) });
  const e = c.correos[0] || {};
  const hrefs = (e.html.match(/href="https:\/\/docs\.spacioam\.com[^"]*"/g) || []);
  ok(r.ok && hrefs.length >= 1 && hrefs.every(h => CORTO.test(h.slice(6, -1))) && e.html.indexOf('?firmar=') < 0, 'el botón «Revisar y firmar» del correo sale corto: ' + hrefs.join(' '));
  ok(e.texto.indexOf('?firmar=') < 0 && (e.texto.match(/https:\/\/docs\.spacioam\.com\/\w{5}/) || [])[0] === hrefs[0].slice(6, -1), 'el texto del correo lleva el mismo corto');
  ok((m.html.match(/src="[^"]+"/g) || []).every(s => e.html.indexOf(s) >= 0), 'las imágenes del correo no se tocan');
  ok(c.ctx.abrirEnlace_(CORTO.exec(hrefs[0].slice(6, -1))[1]).data.url === FIRMAR, 'el corto abre el enlace de firma de siempre');
  // Los programados salen por enviarCorreo_ (el mismo punto final).
  const src = fs.readFileSync(path.join(DIR, 'Código.js'), 'utf8');
  const cuerpo = n => (new RegExp('\\nfunction ' + n + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}').exec(src) || [''])[0];
  ok(/enviarCorreo_\(/.test(cuerpo('enviarProgramados')), 'los correos programados también pasan por enviarCorreo_ (salen cortos)');
  const envios = src.split(/\n(?=function )/).filter(f => /GmailApp\.sendEmail\(|MailApp\.sendEmail\(/.test(f)).map(f => /^function ([\w$]+)/.exec(f)).filter(Boolean).map(x => x[1]);
  ok(envios.length && envios.every(n => n === 'enviarCorreo_' || n === 'pruebaCorreo'), 'todo correo de Docs sale por enviarCorreo_ (' + envios.join(', ') + ')');
  ok(/acortarEnHtml_\(p\.html/.test(cuerpo('enviarCorreo_')) && /acortarEnTexto_\(p\.texto/.test(cuerpo('enviarCorreo_')), 'enviarCorreo_ acorta el botón y el texto antes de enviar');
  // «Copiar enlace» del panel copia el corto que pidió al abrir el documento.
  const adm = fs.readFileSync(path.join(RAIZ, 'admin.jsx'), 'utf8');
  ok(/action: "acortar", url: signLink\(doc\)/.test(adm) && /writeText\(corto\.id === doc\.id && corto\.url \? corto\.url : signLink\(doc\)\)/.test(adm), '«Copiar enlace» del panel copia docs.spacioam.com/<código> (y el largo si el corto no llegó)');
  const idx = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  ok(/admin\.jsx\?v=\d+/.test(idx), 'index.html carga admin.jsx con su ?v='); }

/* ── 5 ── 404.html y rutas del sitio */
{ const h = fs.readFileSync(path.join(RAIZ, '404.html'), 'utf8'), sync = fs.readFileSync(path.join(RAIZ, 'sheets-sync.js'), 'utf8');
  const api = (/var API_URL = "([^"]+)"/.exec(h) || [])[1], back = (/var EP_DEFAULT = "([^"]+)"/.exec(sync) || [])[1];
  ok(api && api === back, '404.html pregunta al mismo Apps Script que la app (EP_DEFAULT de sheets-sync.js)');
  ok(/action: "enlace", codigo: codigo/.test(h) && /\[23456789abcdefghjkmnpqrstuvwxyz\]\{5\}/.test(h), '404.html pide la acción pública «enlace» con el código de 5 de la dirección');
  const seguro = (/var seguro = (\/.*\/i);/.exec(h) || [])[1];
  const rx = seguro && vm.runInNewContext(seguro);
  ok(rx && rx.test(FIRMAR) && rx.test('https://drive.google.com/file/d/x/view') && !rx.test('https://evil.example.com/') && !rx.test('https://hub.spacioam.com/x') && !rx.test('https://docs.spacioam.com.evil.com/'), '404.html solo abre docs.spacioam.com o Google Drive / Docs');
  ok(h.indexOf('Abriendo tu enlace…') >= 0 && h.indexOf('Este enlace ya no está disponible. Escríbenos a <a href="mailto:hola@spacioam.com">hola@spacioam.com</a>.') >= 0, '404.html: «Abriendo tu enlace…» y «Este enlace ya no está disponible…»');
  const c = caja(), rsv = c.ctx.ENLACES_RESERVADOS_;
  const conForma = fs.readdirSync(RAIZ).map(n => n.toLowerCase()).filter(n => CODIGO.test(n));
  ok(conForma.every(n => rsv.indexOf(n) >= 0), 'los archivos del sitio con forma de código están reservados (' + (conForma.join(', ') || 'ninguno') + ')'); }

process.exit(fallo);
