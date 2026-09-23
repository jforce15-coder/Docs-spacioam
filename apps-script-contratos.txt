/**
 * ════════════════════════════════════════════════════════════════
 * SPACIO AM · CONTRATOS — Backend (Code.gs)
 * Cuenta: jforce15@gmail.com  ·  envía como hola@spacioam.com
 * Nada sensible está escrito aquí: todo vive en las Propiedades
 * del script. Ejecuta instalar() una vez y quedan sembradas.
 * ════════════════════════════════════════════════════════════════
 */

/* ─── Propiedades del script ─────────────────────────────────────
   Se leen de PropertiesService. Para verlas o cambiarlas:
   Configuración del proyecto (⚙) → Propiedades del script.
   Claves usadas:
     TOKEN       clave compartida con el web app
     SHEET_ID    id de la hoja de cálculo
     FOLDER_ID   id de la carpeta de Drive
     FROM_EMAIL  alias desde el que se envía
     FROM_NAME   nombre visible del remitente
     OWNER       administrador principal
─────────────────────────────────────────────────────────────────── */

var PROPS_DEFAULT = {
  TOKEN:      'Spacio2026!',
  SHEET_ID:   '1r__zfIAFLr6mxcuAN6HwQF1OmLTG-lce-jv_naGRDVU',
  FOLDER_ID:  '1GzxF5El3YaT0UVZLMBeRIfwXgzZxyqSa',
  FROM_EMAIL: 'hola@spacioam.com',
  FROM_NAME:  'Spacio AM',
  OWNER:      'jovalle@spacioam.com',
  /* Hoja de la EPI App (Config → props): de ahí sale la lista de propiedades. */
  EPI_SHEET_ID: '1-SfKC-evkK24qfOrrvIrcDs6ckGAmRzSLS_IYB8cYZg'
};

function P_(clave) {
  var v = PropertiesService.getScriptProperties().getProperty(clave);
  return v == null || v === '' ? PROPS_DEFAULT[clave] : v;
}

var HOJAS = {
  CONTRATOS:  ['Folio','Fecha de envío','Categoría','Documento','Firmantes','Correos',
               'Por Spacio AM','Estado','Firmas completas','Fecha de firma','Certificado',
               'Archivo en Drive','Carpeta','Notas'],
  FIRMAS:     ['Folio','Parte','Nombre','Correo','Estado','Fecha y hora','Método',
               'Origen','Huella del documento','Firma guardada'],
  DOCUMENTOS: ['id','folio','actualizado','estado','json'],
  PERMISOS:   ['Correo','Generar','Firmar','Administrar','Actualizado'],
  FIRMAS_GUARDADAS: ['Correo','Nombre','Actualizado','Imagen (dataURL)'],
  PROGRAMADOS: ['id','docId','Folio','Para','Sale (Guatemala)','Sale UTC','Estado','Enviado','Error','payload']
};

/* ─── Instalación ─────────────────────────────────────────────── */

/**
 * Ejecuta esto UNA VEZ desde el editor (botón ▷ con instalar seleccionado).
 * Siembra las propiedades, crea las hojas y pide los permisos.
 */
function instalar() {
  var sp = PropertiesService.getScriptProperties();
  Object.keys(PROPS_DEFAULT).forEach(function (k) {
    if (!sp.getProperty(k)) sp.setProperty(k, PROPS_DEFAULT[k]);
  });

  Object.keys(HOJAS).forEach(function (n) { hoja_(n); });
  DriveApp.getFolderById(P_('FOLDER_ID'));           // fuerza el permiso de Drive

  asegurarActivador_();

  var hp = hoja_('PERMISOS');
  if (!buscarFila_(hp, 1, P_('OWNER'))) {
    hp.appendRow([P_('OWNER'), 'Sí', 'Sí', 'Sí', new Date()]);
  }

  var alias = GmailApp.getAliases();
  var msg = 'Listo. Hojas creadas y propiedades sembradas.\n' +
            'Alias disponibles: ' + (alias.length ? alias.join(', ') : '(ninguno)') + '\n';
  msg += alias.indexOf(P_('FROM_EMAIL')) >= 0
    ? 'El alias ' + P_('FROM_EMAIL') + ' está listo: los correos saldrán desde ahí.'
    : 'OJO: ' + P_('FROM_EMAIL') + ' no aparece como alias de esta cuenta. ' +
      'Agrégalo en Gmail → Configuración → Cuentas → "Enviar como" y vuelve a ejecutar instalar().';
  Logger.log(msg);
  return msg;
}

/** Comprueba que todo esté en su lugar. Ejecútalo cuando algo falle. */
function diagnostico() {
  var out = [];
  try { out.push('Hoja: ' + ss_().getName()); }
  catch (e) { out.push('Hoja: ERROR — ' + e); }
  try { out.push('Carpeta: ' + DriveApp.getFolderById(P_('FOLDER_ID')).getName()); }
  catch (e) { out.push('Carpeta: ERROR — ' + e); }
  out.push('Alias: ' + GmailApp.getAliases().join(', '));
  out.push('Remitente configurado: ' + P_('FROM_NAME') + ' <' + P_('FROM_EMAIL') + '>');
  out.push('Cuota de correos hoy: ' + MailApp.getRemainingDailyQuota());
  out.push('Token cargado: ' + (P_('TOKEN') ? 'sí' : 'NO'));
  var r = out.join('\n');
  Logger.log(r);
  return r;
}

/** Manda un correo de prueba a la dirección que le pases. */
function pruebaCorreo() {
  var destino = P_('OWNER');
  enviarCorreo_({
    to: destino,
    asunto: 'Prueba · Contratos Spacio AM',
    html: '<div style="font-family:Helvetica,Arial,sans-serif;padding:24px;color:#3E3F3F">' +
          '<p>El backend de Contratos está conectado.</p></div>',
    texto: 'El backend de Contratos está conectado.'
  });
  return 'Correo de prueba enviado a ' + destino;
}

/* ─── Utilidades ─────────────────────────────────────────────── */

function ss_() { return SpreadsheetApp.openById(P_('SHEET_ID')); }

function hoja_(nombre) {
  var libro = ss_();
  var h = libro.getSheetByName(nombre);
  if (!h) {
    h = libro.insertSheet(nombre);
    h.appendRow(HOJAS[nombre]);
    h.setFrozenRows(1);
    h.getRange(1, 1, 1, HOJAS[nombre].length).setFontWeight('bold');
    formatoHoja_(h, nombre);
  }
  return h;
}

/** Formato legible: encabezado beige, filas con aire, columnas anchas. */
function formatoHoja_(h, nombre) {
  var n = HOJAS[nombre].length;
  h.getRange(1, 1, 1, n)
    .setBackground('#F5F3F0').setFontColor('#3E3F3F')
    .setFontFamily('Montserrat').setFontSize(9)
    .setVerticalAlignment('middle').setWrap(true);
  h.setRowHeight(1, 42);
  h.getRange(1, 1, h.getMaxRows(), n).setFontFamily('Montserrat').setFontSize(10);
  for (var c = 1; c <= n; c++) h.setColumnWidth(c, c === 1 ? 120 : 170);
  if (nombre === 'DOCUMENTOS') h.setColumnWidth(5, 90);   // el JSON no debe dominar
  h.getRange(1, 1, h.getMaxRows(), n).setVerticalAlignment('top');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(cb, obj) {
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function auth_(p) { return String(p && p.token) === String(P_('TOKEN')); }

function buscarFila_(h, col, valor) {
  if (h.getLastRow() < 2) return 0;
  var vals = h.getRange(2, col, h.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(valor)) return i + 2;
  }
  return 0;
}

/* ─── Router ─────────────────────────────────────────────────── */

function doPost(e) {
  var p = {};
  try { p = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  if (!auth_(p)) return json_({ ok: false, error: 'token' });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    switch (p.action) {
      case 'ping':            return json_({ ok: true, alive: true });
      case 'upsertContrato':  return json_(upsertContrato_(p));
      case 'guardarDoc':      return json_(guardarDoc_(p));
      case 'listarDocs':      return json_({ ok: true, docs: listarDocs_() });
      case 'getDoc':          return json_({ ok: true, doc: getDoc_(p.id) });
      case 'borrarDoc':       return json_(borrarDoc_(p.id));
      case 'enviarCorreo':    return json_(enviarCorreo_(p));
      case 'archivarPDF':     return json_(archivarPDF_(p));
      case 'permisos':        return json_(permisos_(p));
      case 'firmaGuardada':   return json_(firmaGuardada_(p));
      case 'programarCorreo': return json_(programarCorreo_(p));
      case 'cancelarProgramado': return json_(cancelarProgramado_(p.docId));
      case 'propiedades':     return json_(propiedades_());
      default:                return json_({ ok: false, error: 'accion_desconocida: ' + p.action });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (err2) {}
  }
}

/** GET con JSONP: lo usa el enlace de firma en un dispositivo nuevo. */
function doGet(e) {
  var q = (e && e.parameter) || {};
  var cb = q.callback;
  var salida;
  try {
    if (!auth_(q))                        salida = { ok: false, error: 'token' };
    else if (q.action === 'getDoc')       salida = { ok: true, doc: getDoc_(q.id) };
    else if (q.action === 'listarDocs')   salida = { ok: true, docs: listarDocs_() };
    else if (q.action === 'permisos')     salida = permisos_({ modo: 'leer' });
    else if (q.action === 'firmaGuardada')salida = firmaGuardada_({ modo: 'leer', correo: q.correo });
    else                                  salida = { ok: true, alive: true };
  } catch (err) {
    salida = { ok: false, error: String(err) };
  }
  return cb ? jsonp_(cb, salida) : json_(salida);
}

/* ─── CONTRATOS + FIRMAS ─────────────────────────────────────── */

function upsertContrato_(p) {
  var fila = p.contrato || [];
  var folio = fila[0];
  if (!folio) return { ok: false, error: 'sin_folio' };

  var hc = hoja_('CONTRATOS');
  var r = buscarFila_(hc, 1, folio);
  if (r) hc.getRange(r, 1, 1, fila.length).setValues([fila]);
  else   hc.appendRow(fila);

  var hf = hoja_('FIRMAS');
  if (hf.getLastRow() > 1) {
    var vals = hf.getRange(2, 1, hf.getLastRow() - 1, 1).getValues();
    for (var i = vals.length - 1; i >= 0; i--) {
      if (String(vals[i][0]) === String(folio)) hf.deleteRow(i + 2);
    }
  }
  (p.firmas || []).forEach(function (f) { hf.appendRow(f); });

  return { ok: true, folio: folio };
}

/* ─── Registro compartido de documentos ──────────────────────── *
 * Una celda de Google Sheets admite 50,000 caracteres. Un contrato
 * con las dos firmas incrustadas (dos PNG en base64) pasa de 78,000,
 * así que el registro NO cabe en una sola celda: setValues lanzaba
 * excepción y la firma nunca se guardaba. Por eso el registro se
 * reparte en trozos de 45,000 caracteres a lo ancho de la fila
 * (columnas 5, 6, 7…) y se vuelve a unir al leer. Las filas viejas
 * escritas en una sola celda se siguen leyendo igual.
 */

var REG_COL = 5;        /* primera columna del registro */
var REG_TROZO = 45000;  /* margen sobre el límite de 50,000 */
var REG_MAX = 12;       /* hasta 12 trozos ≈ 540,000 caracteres */

function trozos_(txt) {
  var out = [];
  for (var i = 0; i < txt.length; i += REG_TROZO) out.push(txt.substring(i, i + REG_TROZO));
  return out.length ? out : [''];
}

function leerRegistro_(h, r) {
  var ancho = h.getMaxColumns() - REG_COL + 1;
  if (ancho < 1) return '';
  return h.getRange(r, REG_COL, 1, ancho).getValues()[0].join('');
}

function guardarDoc_(p) {
  var d = p.doc;
  if (!d || !d.id) return { ok: false, error: 'sin_doc' };

  var txt = JSON.stringify(d);
  var partes = trozos_(txt);
  if (partes.length > REG_MAX) return { ok: false, error: 'registro_demasiado_grande', chars: txt.length };

  var h = hoja_('DOCUMENTOS');
  var necesarias = REG_COL - 1 + partes.length;
  if (h.getMaxColumns() < necesarias) h.insertColumnsAfter(h.getMaxColumns(), necesarias - h.getMaxColumns());

  var r = buscarFila_(h, 1, d.id);
  if (!r) { h.appendRow([d.id]); r = h.getLastRow(); }

  /* La fila se escribe completa y se limpian los trozos que sobran de
     una versión anterior más larga. */
  var ancho = h.getMaxColumns();
  var fila = new Array(ancho);
  fila[0] = d.id; fila[1] = d.folio || ''; fila[2] = new Date(); fila[3] = d.estado || '';
  for (var i = 0; i < ancho - (REG_COL - 1); i++) fila[REG_COL - 1 + i] = partes[i] || '';
  h.getRange(r, 1, 1, ancho).setValues([fila]);
  SpreadsheetApp.flush();

  /* Confirmación real: se relee la fila y se compara. Un ok de este
     endpoint significa que el registro quedó guardado, no que la
     petición llegó. */
  var guardado = leerRegistro_(h, r);
  if (guardado !== txt) return { ok: false, error: 'no_verificado', esperado: txt.length, guardado: guardado.length };
  return { ok: true, id: d.id, chars: txt.length, trozos: partes.length };
}

function listarDocs_() {
  var h = hoja_('DOCUMENTOS');
  if (h.getLastRow() < 2) return [];
  var filas = h.getRange(2, REG_COL, h.getLastRow() - 1, h.getMaxColumns() - REG_COL + 1).getValues();
  return filas
    .map(function (r) { try { return JSON.parse(r.join('')); } catch (e) { return null; } })
    .filter(function (d) { return d; });
}

function getDoc_(id) {
  var h = hoja_('DOCUMENTOS');
  var r = buscarFila_(h, 1, id);
  if (!r) return null;
  try { return JSON.parse(leerRegistro_(h, r)); } catch (e) { return null; }
}

function borrarDoc_(id) {
  var h = hoja_('DOCUMENTOS');
  var r = buscarFila_(h, 1, id);
  if (r) h.deleteRow(r);
  return { ok: true, borrado: !!r };
}

/* ─── Correos ────────────────────────────────────────────────── */

function enviarCorreo_(p) {
  if (!p.to || !p.html) return { ok: false, error: 'faltan_datos' };

  var alias = P_('FROM_EMAIL');
  var opciones = {
    name: P_('FROM_NAME'),
    replyTo: alias,
    htmlBody: p.html
  };
  /* Solo se puede usar "from" si el alias está verificado en la cuenta. */
  if (GmailApp.getAliases().indexOf(alias) >= 0) opciones.from = alias;
  if (p.bcc) opciones.bcc = p.bcc;
  if (p.pdfBase64 && p.pdfNombre) {
    opciones.attachments = [
      Utilities.newBlob(Utilities.base64Decode(p.pdfBase64), 'application/pdf', p.pdfNombre)
    ];
  }

  GmailApp.sendEmail(p.to, p.asunto || 'Spacio AM', p.texto || '', opciones);
  return { ok: true, to: p.to, from: opciones.from || Session.getActiveUser().getEmail() };
}

/* ─── Archivo en Drive ───────────────────────────────────────── */

function carpetaRuta_(rutas) {
  var carpeta = DriveApp.getFolderById(P_('FOLDER_ID'));
  (rutas || []).forEach(function (nombre) {
    if (!nombre) return;
    var it = carpeta.getFoldersByName(nombre);
    carpeta = it.hasNext() ? it.next() : carpeta.createFolder(nombre);
  });
  return carpeta;
}

function archivarPDF_(p) {
  if (!p.pdfBase64 || !p.archivo) return { ok: false, error: 'faltan_datos' };
  /* p.carpeta llega como ['Contratos firmados','2026','08 Agosto','Empleados'];
     el primer nivel ES la carpeta raíz, así que se omite. */
  var ruta = (p.carpeta || []).slice(1);
  var carpeta = carpetaRuta_(ruta);
  var blob = Utilities.newBlob(Utilities.base64Decode(p.pdfBase64), 'application/pdf', p.archivo);
  var previos = carpeta.getFilesByName(p.archivo);
  while (previos.hasNext()) previos.next().setTrashed(true);
  var file = carpeta.createFile(blob);
  return { ok: true, url: file.getUrl(), id: file.getId(), carpeta: carpeta.getName() };
}

/* ─── Permisos ───────────────────────────────────────────────── */

function permisos_(p) {
  var h = hoja_('PERMISOS');
  var owner = String(P_('OWNER')).toLowerCase();

  if (p.modo === 'guardar') {
    var correo = String(p.correo || '').trim().toLowerCase();
    if (!correo) return { ok: false, error: 'sin_correo' };
    if (correo === owner) return { ok: false, error: 'owner_fijo' };
    var r = buscarFila_(h, 1, correo);
    if (!p.generar && !p.firmar && !p.admin) {
      if (r) h.deleteRow(r);
      return { ok: true, quitado: correo };
    }
    var fila = [correo, p.generar ? 'Sí' : 'No', p.firmar ? 'Sí' : 'No', p.admin ? 'Sí' : 'No', new Date()];
    if (r) h.getRange(r, 1, 1, fila.length).setValues([fila]);
    else   h.appendRow(fila);
    return { ok: true, correo: correo };
  }

  var out = {};
  if (h.getLastRow() > 1) {
    h.getRange(2, 1, h.getLastRow() - 1, 4).getValues().forEach(function (r) {
      if (!r[0]) return;
      out[String(r[0]).toLowerCase()] = {
        generar: r[1] === 'Sí' || r[1] === true,
        firmar:  r[2] === 'Sí' || r[2] === true,
        admin:   r[3] === 'Sí' || r[3] === true
      };
    });
  }
  out[owner] = { generar: true, firmar: true, admin: true };
  return { ok: true, permisos: out };
}

/* ─── Firmas guardadas por usuario ───────────────────────────── */

function firmaGuardada_(p) {
  var h = hoja_('FIRMAS_GUARDADAS');
  var correo = String(p.correo || '').trim().toLowerCase();

  if (p.modo === 'guardar') {
    if (!correo || !p.img) return { ok: false, error: 'faltan_datos' };
    var r = buscarFila_(h, 1, correo);
    var fila = [correo, p.nombre || '', new Date(), p.img];
    if (r) h.getRange(r, 1, 1, fila.length).setValues([fila]);
    else   h.appendRow(fila);
    return { ok: true, correo: correo };
  }
  if (p.modo === 'borrar') {
    var rb = buscarFila_(h, 1, correo);
    if (rb) h.deleteRow(rb);
    return { ok: true, borrado: !!rb };
  }
  if (correo) {
    var rl = buscarFila_(h, 1, correo);
    if (!rl) return { ok: true, firma: null };
    var v = h.getRange(rl, 1, 1, 4).getValues()[0];
    return { ok: true, firma: { email: v[0], nombre: v[1], img: v[3] } };
  }
  var todas = {};
  if (h.getLastRow() > 1) {
    h.getRange(2, 1, h.getLastRow() - 1, 4).getValues().forEach(function (v) {
      if (v[0]) todas[String(v[0]).toLowerCase()] = { email: v[0], nombre: v[1], img: v[3] };
    });
  }
  return { ok: true, firmas: todas };
}


/* ─── Envíos programados ─────────────────────────────────────── *
 * El web app arma cada correo (asunto + HTML) y lo deja aquí con su hora
 * en UTC. El activador enviarProgramados corre cada 5 minutos, manda los
 * que ya tocan y actualiza el documento en DOCUMENTOS y CONTRATOS.
 * Guatemala es UTC−6 sin horario de verano: 7:00 GT = 13:00 UTC.
 */

var PROG_COL = 10;   /* primera columna del payload (se reparte en trozos) */

function asegurarActivador_() {
  var existe = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'enviarProgramados'; });
  if (!existe) ScriptApp.newTrigger('enviarProgramados').timeBased().everyMinutes(5).create();
}

function programarCorreo_(p) {
  if (!p.docId || !p.sendAt || !(p.envios || []).length) return { ok: false, error: 'faltan_datos' };
  var cuando = new Date(p.sendAt);
  if (isNaN(cuando.getTime())) return { ok: false, error: 'fecha_invalida' };
  try { asegurarActivador_(); } catch (e) { return { ok: false, error: 'sin_activador: ' + e }; }

  cancelarProgramado_(p.docId);   /* reprogramar reemplaza, no duplica */
  var h = hoja_('PROGRAMADOS');
  var ids = [];
  p.envios.forEach(function (env, i) {
    var partes = trozos_(JSON.stringify(env));
    var necesarias = PROG_COL - 1 + partes.length;
    if (h.getMaxColumns() < necesarias) h.insertColumnsAfter(h.getMaxColumns(), necesarias - h.getMaxColumns());
    var id = p.docId + '_' + Date.now() + '_' + i;
    h.appendRow([id, p.docId, p.folio || '', env.to, p.etiqueta || '', cuando.toISOString(), 'pendiente', '', ''].concat(partes));
    ids.push(id);
  });
  SpreadsheetApp.flush();
  return { ok: true, ids: ids, sale: cuando.toISOString() };
}

function cancelarProgramado_(docId) {
  var h = hoja_('PROGRAMADOS');
  if (h.getLastRow() < 2) return { ok: true, cancelados: 0 };
  var vals = h.getRange(2, 1, h.getLastRow() - 1, 7).getValues();
  var n = 0;
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][1]) === String(docId) && vals[i][6] === 'pendiente') {
      h.getRange(i + 2, 7).setValue('cancelado'); n++;
    }
  }
  return { ok: true, cancelados: n };
}

/** Lo corre el activador cada 5 minutos. */
function enviarProgramados() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try {
    var h = hoja_('PROGRAMADOS');
    if (h.getLastRow() < 2) return;
    var ancho = h.getMaxColumns();
    var filas = h.getRange(2, 1, h.getLastRow() - 1, ancho).getValues();
    var ahora = new Date();
    var porDoc = {};
    filas.forEach(function (f, i) {
      if (f[6] !== 'pendiente' || new Date(f[5]) > ahora) return;
      var r = i + 2, docId = String(f[1]);
      var doc = getDoc_(docId);
      if (doc && (doc.estado === 'cancelado' || doc.estado === 'anulado')) { h.getRange(r, 7).setValue('cancelado'); return; }
      var res;
      try { res = enviarCorreo_(JSON.parse(f.slice(PROG_COL - 1).join(''))); }
      catch (e) { res = { ok: false, error: String(e) }; }
      h.getRange(r, 7, 1, 3).setValues([[res.ok ? 'enviado' : 'error', res.ok ? new Date() : '', res.ok ? '' : res.error]]);
      (porDoc[docId] = porDoc[docId] || { ok: [], mal: [], err: '' });
      if (res.ok) porDoc[docId].ok.push(f[3]); else { porDoc[docId].mal.push(f[3]); porDoc[docId].err = res.error; }
    });
    Object.keys(porDoc).forEach(function (docId) { marcarEnviado_(docId, porDoc[docId]); });
  } finally { lock.releaseLock(); }
}

/* El documento pasa de "programado" a "enviado" en las dos hojas. */
function marcarEnviado_(docId, r) {
  var d = getDoc_(docId);
  if (!d) return;
  var ts = new Date().toISOString();
  if (d.estado === 'programado') d.estado = 'enviado';
  d.enviado = ts;
  d.programado = d.programado || {};
  d.programado.salio = ts;
  d.correoFirma = { ts: ts, enviados: r.ok, fallidos: r.mal, error: r.err || '' };
  d.historial = (d.historial || []).concat([{ ts: ts, texto: r.mal.length
    ? 'Envío programado: el correo NO salió para ' + r.mal.join(', ') + '. Usa Reenviar.'
    : 'Envío programado: correo de firma enviado a ' + r.ok.join(', ') + '.' }]);
  guardarDoc_({ doc: d });

  var hc = hoja_('CONTRATOS');
  var fila = buscarFila_(hc, 1, d.folio);
  if (fila) {
    hc.getRange(fila, 2).setValue(Utilities.formatDate(new Date(), 'America/Guatemala', 'd MMM yyyy, HH:mm'));
    hc.getRange(fila, 8).setValue('Enviado a firma');
  }
}

/* ─── Propiedades de EPI ─────────────────────────────────────── *
 * Se leen de la hoja de la EPI App (Config → fila "props"), la misma lista
 * que EPI sincroniza con Hospitable. Caché de 6 horas.
 */
function propiedades_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('props_epi');
  if (hit) return { ok: true, propiedades: JSON.parse(hit), cache: true };
  var h = SpreadsheetApp.openById(P_('EPI_SHEET_ID')).getSheetByName('Config');
  if (!h) return { ok: false, error: 'sin_config_epi' };
  var vals = h.getDataRange().getValues(), props = [];
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) !== 'props') continue;
    try { props = JSON.parse(String(vals[i][1] || '[]')); } catch (e) { props = []; }
    break;
  }
  var out = (props || []).filter(function (p) { return p && p.name; }).map(function (p) {
    return { id: String(p.id || p.hospId || p.name), name: String(p.name), address: String(p.address || '') };
  }).sort(function (a, b) { return a.name.localeCompare(b.name, 'es'); });
  try { cache.put('props_epi', JSON.stringify(out), 21600); } catch (e) {}
  return { ok: true, propiedades: out };
}
