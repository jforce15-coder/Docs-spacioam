/* ══════════════════════════════════════════════════════════════
   Spacio AM — Registro de documentos enviados a firma.
   El servidor manda: la hoja DOCUMENTOS es el registro. Aquí los
   documentos completos viven SOLO en memoria mientras la página está
   abierta. En el teléfono queda, como mucho:
   · la «foto» de la lista (sa_foto:docs:1:<correo>): id, folio,
     título, estado, fechas y nombre del firmante. Nada de DPI ni del
     contrato. Vence a las 24 h y se borra al cerrar sesión;
   · las firmas que todavía no suben (bandeja de salida, sheets-sync.js);
   · la firma guardada de cada persona para reusar (sa_firma:1:<correo>).
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var LEGADO = "spacio_docs_v1";     /* copia vieja con contratos completos: se migra y se borra */
  var SEQ = "spacio_docs_seq_v1";
  var FOTO_V = "sa_foto:docs:1:";
  var FOTO_MS = 864e5;               /* 24 h */

  var ESTADOS = {
    borrador:  { label: "Borrador",           cls: "borrador" },
    programado:{ label: "Envío programado",   cls: "programado" },
    enviado:   { label: "Enviado a firma",    cls: "enviado" },
    visto:     { label: "Visto por firmante", cls: "visto" },
    parcial:   { label: "Firmado por 1 parte", cls: "parcial" },
    firmado:   { label: "Firmado",            cls: "firmado" },
    cancelado: { label: "Cancelado",          cls: "cancelado" },
    anulado:   { label: "Anulado",            cls: "anulado" },
  };

  var TIPO_LABEL = {
    limpieza: "Contrato de limpieza",
    mantenimiento: "Contrato de mantenimiento",
    personalizado: "Contrato personalizado",
    cohosting_individual: "Contrato de co-hosting · individual",
    cohosting_individual_lt: "Contrato de co-hosting · individual, largo plazo",
    cohosting_juridica: "Contrato de co-hosting · jurídica",
    cohosting_juridica_lt: "Contrato de co-hosting · jurídica, largo plazo",
    emp_promocion: "Carta de promoción",
    emp_contratacion: "Contrato laboral",
    emp_aumento: "Carta de aumento de salario",
    emp_goce: "Constancia de vacaciones",
    emp_bono_estrella: "Bono Estrella",
    emp_adelanto: "Solicitud y recibo de adelanto de pago",
    carta: "Carta",
  };

  var CATEGORIA = function (tipo) {
    if (!tipo) return "—";
    if (tipo.indexOf("cohosting") === 0) return "Co-hosting";
    if (tipo.indexOf("emp_") === 0) return "Empleados";
    if (tipo === "carta") return "Cartas";
    return "Servicios";
  };

  /* ── Memoria y foto ─────────────────────────────────────── */
  var mem = [];          /* documentos completos (o de la foto, con _foto) */
  var usuario = "";      /* correo de quien tiene sesión: la foto es por persona */
  var copia = false;     /* true mientras la lista sale de la foto («actualizando…») */

  function clonar(d) { return d ? JSON.parse(JSON.stringify(d)) : d; }
  function read() { return mem.slice(); }
  function write(list) { mem = list.slice(); fotoGuardar(); return mem; }

  /* Lo único que la foto guarda de cada documento. */
  function resumen(d) {
    return {
      id: d.id, folio: d.folio, tipo: d.tipo, tipoLabel: d.tipoLabel, nombre: d.nombre || "",
      categoria: d.categoria, estado: d.estado, creado: d.creado, enviado: d.enviado,
      firmanteNombre: d.firmanteNombre || "",
      firmantes: (d.firmantes || []).map(function (f) { return { id: f.id, nombre: f.nombre, firma: f.firma ? { ts: f.firma.ts } : null }; }),
      firmaSpacio: d.firmaSpacio ? { ts: d.firmaSpacio.ts } : null,
      soloFirmante: d.soloFirmante, soloSpacio: d.soloSpacio,
      programado: d.programado && d.programado.sendAt ? { sendAt: d.programado.sendAt } : null,
      _foto: true,
    };
  }
  function fotoClave() { return usuario ? FOTO_V + usuario : ""; }
  function fotoGuardar() {
    var k = fotoClave();
    if (!k || copia) return;
    try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), datos: mem.filter(function (d) { return d && !d.demo; }).map(resumen) })); } catch (e) {}
  }
  function claves(pref) {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(pref) === 0) out.push(k); } } catch (e) {}
    return out;
  }
  /* Fotos vencidas (de cualquier persona) se borran al abrir. */
  function fotoBorrarVencidas() {
    claves("sa_foto:docs:").forEach(function (k) {
      var f = null;
      try { f = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
      if (k.indexOf(FOTO_V) !== 0 || !f || !f.t || Date.now() - f.t >= FOTO_MS) { try { localStorage.removeItem(k); } catch (e) {} }
    });
  }
  function setUsuario(email) {
    var u = String(email || "").trim().toLowerCase();
    if (u === usuario) return;
    usuario = u;
    fotoBorrarVencidas();
    if (!u || mem.length) return;
    var f = null;
    try { f = JSON.parse(localStorage.getItem(fotoClave()) || "null"); } catch (e) {}
    if (f && f.t && Date.now() - f.t < FOTO_MS && Array.isArray(f.datos) && f.datos.length) {
      mem = f.datos.map(function (d) { d._foto = true; return d; });
      copia = true;
      emit();
    }
  }
  function esCopia() { return copia; }

  /* La copia vieja (antes de este cambio el teléfono guardaba los contratos
     completos). sheets-sync.js la migra y llama a borrarLegado() solo cuando
     confirma que no queda nada sin subir. */
  function legado() {
    try { var l = JSON.parse(localStorage.getItem(LEGADO) || "null"); return Array.isArray(l) ? l : null; } catch (e) { return null; }
  }
  function borrarLegado() { try { localStorage.removeItem(LEGADO); } catch (e) {} }

  /* Al cerrar sesión: fuera la foto, las firmas guardadas y los borradores
     del generador (llevan DPI). La bandeja de salida NO se toca. */
  function limpiarAlSalir(opts) {
    mem = []; copia = false; usuario = "";
    claves("sa_foto:docs:").concat(claves(FIRMA_PREF)).forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    ["spacio_am_contracts_v1", "spacio_custom_v1", FKEY].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    if (!(opts && opts.conservarLegado)) borrarLegado();
    emit();
  }
  function nextFolio() {
    var n = 0;
    try { n = parseInt(localStorage.getItem(SEQ) || "127", 10) + 1; localStorage.setItem(SEQ, String(n)); } catch (e) { n = Date.now() % 1000; }
    return "SAM-" + String(n).padStart(6, "0");
  }
  function hash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h.toString(16).toUpperCase().padStart(8, "0");
  }
  function nowISO() { return new Date().toISOString(); }

  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function fmtDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    return d.getDate() + " " + MESES[d.getMonth()] + " " + d.getFullYear();
  }
  function fmtDateTime(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    var hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0");
    return fmtDate(iso) + ", " + hh + ":" + mm;
  }
  function relative(iso) {
    if (!iso) return "—";
    var diff = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (diff < 1) return "hoy";
    if (diff < 2) return "ayer";
    return "hace " + Math.round(diff) + " días";
  }

  function all() {
    return read().sort(function (a, b) { return (b.creado || "").localeCompare(a.creado || ""); });
  }
  function get(id) { return read().filter(function (d) { return d.id === id; })[0] || null; }
  /* El documento completo, o null si solo está en la foto. */
  function getCompleto(id) { var d = get(id); return d && !d._foto ? d : null; }

  function log(doc, texto) {
    doc.historial = (doc.historial || []).concat([{ texto: texto, ts: nowISO() }]);
    return doc;
  }

  /* Arma el documento nuevo ("enviado a firma") SIN guardarlo: quien lo
     llama lo crea en el servidor (SpacioSync.crear) y solo entonces existe.
     payload.firmantes = [{nombre, email}] — 1 o 2 por la otra parte. */
  function nuevo(payload) {
    var folio = nextFolio();
    var fs = (payload.firmantes && payload.firmantes.length
      ? payload.firmantes
      : [{ nombre: payload.firmanteNombre, email: payload.firmanteEmail }]
    ).filter(function (f) { return f && f.nombre && f.email; })
      .map(function (f, i) { return { id: "f" + (i + 1), nombre: f.nombre, email: String(f.email).toLowerCase(), firma: null }; });
    var doc = {
      soloFirmante: !!SOLO_FIRMANTE[payload.tipo],
      soloSpacio: !!SOLO_SPACIO[payload.tipo],
      id: "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      folio: folio,
      tipo: payload.tipo,
      tipoLabel: TIPO_LABEL[payload.tipo] || "Documento",
      categoria: CATEGORIA(payload.tipo),
      firmantes: fs,
      firmanteNombre: fs[0] ? fs[0].nombre : (payload.firmanteNombre || ""),
      firmanteEmail: fs[0] ? fs[0].email : (payload.firmanteEmail || ""),
      proyectoId: payload.proyectoId || "",
      proyectoNombre: payload.proyectoNombre || "",
      propiedad: payload.propiedad || "",
      propiedadId: payload.propiedadId || "",
      /* Nombre libre del documento; si está vacío se usa el del tipo. */
      nombre: String(payload.nombre || "").trim() === (TIPO_LABEL[payload.tipo] || "") ? "" : String(payload.nombre || "").trim(),
      programado: payload.programado || null,
      origen: payload.origen || (window.SPACIO_DOCS_ORIGEN || "docs"),
      contraparteNombre: payload.contraparteNombre || "Juan Francisco Ovalle Lanuza",
      contraparteEmail: payload.contraparteEmail || "jovalle@spacioam.com",
      mensaje: payload.mensaje || "",
      data: payload.data || {},
      custom: payload.custom || null,
      edits: payload.edits || {},
      creado: nowISO(),
      enviado: payload.programado ? payload.programado.sendAt : nowISO(),
      visto: null,
      firmaSpacio: null,
      estado: payload.programado ? "programado" : "enviado",
      certificado: null,
      historial: [],
    };
    log(doc, "Documento generado por Administración");
    if (SOLO_SPACIO[payload.tipo]) { /* sin firmantes externos: no hay solicitud de firma */ }
    else if (payload.programado) log(doc, "Envío programado para el " + payload.programado.etiqueta + " a " + fs.map(function (f) { return f.email; }).join(" y "));
    else log(doc, "Solicitud de firma enviada a " + fs.map(function (f) { return f.email; }).join(" y "));
    return doc;
  }

  /* Cambio SOLO en memoria (p. ej. «visto» en el teléfono del firmante). */
  function update(id, fn) {
    var list = read();
    var out = null;
    list = list.map(function (d) {
      if (d.id !== id) return d;
      out = fn(Object.assign({}, d)) || d;
      return out;
    });
    write(list);
    emit();
    return out;
  }

  /* Nombre visible del documento (lista, correos, PDF). */
  function titulo(d) { return (d && (d.nombre || d.tipoLabel)) || "Documento"; }

  /* ── Acciones: el servidor manda ───────────────────────────
     Cada acción parte del documento completo (si solo está en la foto,
     primero se pide al servidor), calcula el cambio y lo manda con
     SpacioSync.cambiar: el servidor aplica SOLO esos campos sobre su fila.
     Devuelve una promesa { ok, doc } con el documento como quedó en la hoja. */
  function cambiar(id, fn) {
    var S = window.SpacioSync;
    if (!S) return Promise.resolve({ ok: false, error: "sin_sync" });
    var base = getCompleto(id);
    var traer = base ? Promise.resolve({ ok: true, doc: base }) : S.getDoc(id);
    return traer.then(function (r) {
      if (!r || !r.ok || !r.doc) return { ok: false, error: (r && r.error) || "no_encontrado" };
      var antes = r.doc;
      var despues = fn(clonar(antes)) || clonar(antes);
      return S.cambiar(antes, despues);
    });
  }
  function tRename(d, nombre) {
    var n = String(nombre || "").trim();
    var antes = titulo(d);
    d.nombre = n === d.tipoLabel ? "" : n;
    if (titulo(d) === antes) return d;
    return log(d, "Documento renombrado: “" + antes + "” → “" + titulo(d) + "”");
  }
  function rename(id, nombre) { return cambiar(id, function (d) { return tRename(d, nombre); }); }
  /* Vínculo con una propiedad de EPI (co-hosting). p = { id, name } o null. */
  function setPropiedad(id, p) {
    return cambiar(id, function (d) {
      var antes = d.propiedad || "";
      d.propiedadId = p ? String(p.id || "") : "";
      d.propiedad = p ? String(p.name || "") : "";
      if (antes === d.propiedad) return d;
      return log(d, d.propiedad ? "Vinculado a la propiedad " + d.propiedad : "Se quitó el vínculo con " + antes);
    });
  }

  /* Solo en memoria: el servidor anota «visto» al recibir la firma. */
  function markVisto(id) {
    return update(id, function (d) {
      if (d.estado !== "enviado") return d;
      d.visto = nowISO(); d.estado = "visto";
      return log(d, "El firmante abrió el documento");
    });
  }

  /* Documentos que se cierran con la firma del colaborador únicamente:
     no son un contrato entre dos partes, son una declaración suya que la
     empresa recibe. Sin esto quedaban atorados en "firmado por 1 parte"
     esperando una contrafirma que el documento no tiene. */
  var SOLO_FIRMANTE = { emp_adelanto: 1 };
  /* Documentos que firma ÚNICAMENTE Spacio AM (cartas): no llevan
     firmantes externos; se cierran con la firma de Spacio AM. */
  var SOLO_SPACIO = { carta: 1 };
  function soloSpacio(d) {
    if (!d) return false;
    if (d.soloSpacio != null) return !!d.soloSpacio;
    return !!SOLO_SPACIO[d.tipo];
  }
  function soloFirmante(d) {
    if (!d) return false;
    if (d.soloFirmante != null) return !!d.soloFirmante;
    return !!SOLO_FIRMANTE[d.tipo];
  }

  function faltanFirmas(d) {
    return (d.firmantes || []).filter(function (f) { return !f.firma; }).length;
  }

  /* Cierre: certificado + acuse, una sola vez y venga de donde venga.
     Las mismas reglas están en el servidor (aplicarFirma_ en Código.js). */
  function cerrar(d, ts) {
    d.estado = "firmado";
    d.certificado = "SAM-FE-" + d.folio.replace("SAM-", "") + "-" +
      hash(d.folio + d.firmanteEmail + ((d.firmantes || [])[0] && (d.firmantes || [])[0].firma ? d.firmantes[0].firma.ts : "")).slice(0, 4);
    d.historial = (d.historial || []).concat([{ texto: soloSpacio(d) ? "Carta firmada por Spacio AM" : soloFirmante(d) ? "Copia firmada enviada al firmante" : "Copia firmada enviada a ambas partes", ts: ts || nowISO() }]);
    return d;
  }

  /* Aplica una firma a una copia del documento (no guarda nada).
     f = { parte: "spacio" } o { firmanteId }, con f.firma = { img, metodo, ts }.
     Si esa firma ya estaba, devuelve el documento igual. Lo usan la bandeja
     de salida (para mostrar la firma pendiente) y el servidor hace lo mismo. */
  function aplicarFirma(doc, f) {
    var d = clonar(doc);
    var fi = f.firma || {};
    var ts = fi.ts || nowISO();
    if (f.parte === "spacio") {
      if (d.firmaSpacio) return d;
      d.firmaSpacio = { nombre: d.contraparteNombre, correo: d.contraparteEmail, img: fi.img || null, metodo: fi.metodo || "typed", ts: ts, ip: "registrada al firmar" };
      d.historial = (d.historial || []).concat([{ texto: "Firmado por " + d.contraparteNombre + " (Spacio AM)", ts: ts }]);
      if (faltanFirmas(d) > 0) { d.estado = "parcial"; return d; }
      return cerrar(d, ts);
    }
    var nombre = "", ya = false, hay = false;
    d.firmantes = (d.firmantes || []).map(function (x) {
      if (x.id !== f.firmanteId) return x;
      hay = true;
      if (x.firma) { ya = true; return x; }
      nombre = x.nombre;
      return Object.assign({}, x, { firma: { img: fi.img, metodo: fi.metodo, ts: ts, ip: fi.ip || "registrada al firmar" } });
    });
    if (!hay || ya) return d;
    d.firmaFirmante = d.firmantes[0] && d.firmantes[0].firma
      ? Object.assign({ nombre: d.firmantes[0].nombre, correo: d.firmantes[0].email }, d.firmantes[0].firma)
      : null;
    if (!d.visto) d.visto = ts;
    d.historial = (d.historial || []).concat([{ texto: "Firmado por " + (nombre || d.firmanteNombre), ts: ts }]);
    /* Queda cerrado cuando ya firmaron todos, sin importar el orden. */
    if (faltanFirmas(d) === 0 && (soloFirmante(d) || d.firmaSpacio)) return cerrar(d, ts);
    d.estado = "parcial";
    return d;
  }

  function cancel(id, motivo) {
    return cambiar(id, function (d) {
      d.estado = "cancelado"; d.motivo = motivo || "";
      return log(d, "Envío cancelado" + (motivo ? " · " + motivo : ""));
    });
  }
  function voidDoc(id, motivo) {
    return cambiar(id, function (d) {
      d.estado = "anulado"; d.motivo = motivo || "";
      return log(d, "Documento anulado" + (motivo ? " · " + motivo : ""));
    });
  }
  /* Quita el documento de la memoria (después de borrarlo en el servidor). */
  function remove(id) {
    mem = mem.filter(function (d) { return d.id !== id; });
    fotoGuardar(); emit();
  }
  function resend(id) {
    return cambiar(id, function (d) {
      d.enviado = nowISO();
      if (d.estado === "cancelado") d.estado = "enviado";
      return log(d, "Solicitud reenviada a " + d.firmanteEmail);
    });
  }

  /* ── Firmas guardadas por persona ─────────────────────────
     Al firmar se pregunta si desea guardar la firma; si acepta,
     el siguiente contrato solo requiere presionar "Firmar".
     Una llave por persona (sa_firma:1:<correo>), solo la imagen de la
     firma; se borran al cerrar sesión. La llave vieja con todas juntas
     (spacio_firmas_v1) se reparte una vez y se borra.               */
  var FKEY = "spacio_firmas_v1";
  var FIRMA_PREF = "sa_firma:1:";
  function fClave(email) { return FIRMA_PREF + String(email || "").trim().toLowerCase(); }
  (function migrarFirmas() {
    try {
      var vieja = localStorage.getItem(FKEY);
      if (!vieja) return;
      var o = JSON.parse(vieja) || {};
      Object.keys(o).forEach(function (e) { if (e && o[e] && !localStorage.getItem(fClave(e))) localStorage.setItem(fClave(e), JSON.stringify(o[e])); });
      localStorage.removeItem(FKEY);
    } catch (e) {}
  })();
  var Firmas = {
    get: function (email) { try { return JSON.parse(localStorage.getItem(fClave(email)) || "null"); } catch (e) { return null; } },
    save: function (email, firma) {
      var v = { img: firma.img, metodo: firma.metodo, ts: nowISO() };
      try { localStorage.setItem(fClave(email), JSON.stringify(v)); } catch (e) {}
      return v;
    },
    remove: function (email) { try { localStorage.removeItem(fClave(email)); } catch (e) {} },
    all: function () {
      var out = {};
      claves(FIRMA_PREF).forEach(function (k) { try { out[k.slice(FIRMA_PREF.length)] = JSON.parse(localStorage.getItem(k)); } catch (e) {} });
      return out;
    },
  };
  window.Firmas = Firmas;

  var subs = [];
  function emit() { (subs || []).slice().forEach(function (f) { try { f(); } catch (e) {} }); }
  function onChange(fn) { subs = (subs || []).concat([fn]); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; }

  /* Reemplaza la memoria con lo que trae la hoja compartida (ya con las
     firmas pendientes de la bandeja encima). Deja de ser la foto. */
  function replaceAll(remotos) {
    mem = (remotos || []).filter(Boolean);
    copia = false;
    fotoGuardar(); emit();
    return read();
  }
  function upsert(doc) {
    if (!doc || !doc.id) return null;
    var i = -1;
    mem.forEach(function (d, j) { if (d.id === doc.id) i = j; });
    if (i < 0) mem = mem.concat([doc]); else { mem = mem.slice(); mem[i] = doc; }
    fotoGuardar(); emit();
    return doc;
  }

  window.Docs = {
    onChange: onChange, emit: emit, replaceAll: replaceAll, upsert: upsert,
    ESTADOS: ESTADOS, TIPO_LABEL: TIPO_LABEL, CATEGORIA: CATEGORIA,
    all: all, get: get, getCompleto: getCompleto, nuevo: nuevo, update: update, cambiar: cambiar, remove: remove, resend: resend,
    soloFirmante: soloFirmante, SOLO_FIRMANTE: SOLO_FIRMANTE, soloSpacio: soloSpacio, SOLO_SPACIO: SOLO_SPACIO,
    titulo: titulo, rename: rename, setPropiedad: setPropiedad, log: log,
    markVisto: markVisto, aplicarFirma: aplicarFirma, faltanFirmas: faltanFirmas,
    cancel: cancel, voidDoc: voidDoc,
    setUsuario: setUsuario, esCopia: esCopia, legado: legado, borrarLegado: borrarLegado, limpiarAlSalir: limpiarAlSalir,
    fmtDate: fmtDate, fmtDateTime: fmtDateTime, relative: relative, hash: hash,
  };
})();
