/* ══════════════════════════════════════════════════════════════
   Spacio AM — Base de datos y archivo de CONTRATOS (compartido)
   Este archivo es idéntico en las dos apps (Grow y Docs): ambas
   escriben en la MISMA hoja y archivan en la MISMA carpeta, así
   que un contrato no tiene diferencia según dónde se generó.

   · Hoja de cálculo  → registro legible (CONTRATOS · FIRMAS)
   · Carpeta de Drive → PDF firmado + certificado
   · Columna Registro → el documento completo en JSON, para que
                        cualquiera de las dos apps lo reconstruya
                        tal cual (firmas, historial, ediciones).

   Endpoint: window.SPACIO_DOCS_ENDPOINT, o el guardado en Setup.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var SHEET_ID = "1r__zfIAFLr6mxcuAN6HwQF1OmLTG-lce-jv_naGRDVU";
  var FOLDER_ID = "1GzxF5El3YaT0UVZLMBeRIfwXgzZxyqSa";
  var EP_KEY = "spacio_sync_endpoint_v1";
  var EP_DEFAULT = "https://script.google.com/macros/s/AKfycbz2_KDtQ5Wm8LRiyEwCXxsHx_DtE4pe2b_aJlLFrN0zu7UvLrnh2PM-6VzbEf00oekW_Q/exec";
  var TK_KEY = "spacio_sync_token_v1";
  function token() {
    var ls = "";
    try { ls = localStorage.getItem(TK_KEY) || ""; } catch (e) {}
    return ls || window.SPACIO_DOCS_TOKEN || "Spacio2026!";
  }
  function setToken(t) { try { localStorage.setItem(TK_KEY, t || ""); } catch (e) {} }

  var MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  function F() { return window.Docs; }
  function endpoint() {
    var ls = "";
    try { ls = localStorage.getItem(EP_KEY) || ""; } catch (e) {}
    return ls || window.SPACIO_DOCS_ENDPOINT || EP_DEFAULT;
  }
  function setEndpoint(url) { try { localStorage.setItem(EP_KEY, url || ""); } catch (e) {} }

  /* Nombre y ruta del archivo en Drive — legible, ordenable por folio */
  function fileName(doc) {
    var nm = (doc.firmanteNombre || "Sin nombre").split(/\s+/).slice(0, 3).join(" ");
    return doc.folio + " — " + (doc.nombre || doc.tipoLabel) + " — " + nm + ".pdf";
  }
  function drivePath(doc) {
    var d = new Date(doc.enviado || doc.creado || Date.now());
    return ["Contratos firmados", String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, "0") + " " + MESES[d.getMonth()], doc.categoria, fileName(doc)];
  }

  function estadoLbl(doc) {
    var e = F().ESTADOS[doc.estado];
    return e ? e.label : doc.estado;
  }
  function metodoLbl(m) { return m === "drawn" ? "Trazada" : m === "uploaded" ? "Imagen" : "Escrita"; }

  /* ── Hoja CONTRATOS ─────────────────────────────────────── */
  var CONTRATOS = {
    nombre: "CONTRATOS",
    nota: "Una fila por documento, sin importar en qué app se generó. Ordenada del más reciente al más antiguo.",
    cols: [
      ["Folio", "SAM-000128", "Identificador legible del documento"],
      ["Fecha de envío", "14 ago 2026, 10:32", "Cuándo se envió a firma"],
      ["Categoría", "Co-hosting", "Servicios · Co-hosting · Empleados"],
      ["Documento", "Contrato de co-hosting · individual", "Tipo de documento generado"],
      ["Firmantes", "Marcel Reiche", "1 o 2 por la otra parte, separados por ·"],
      ["Correos", "marcel@ejemplo.com", "Correo de cada firmante"],
      ["Por Spacio AM", "Juan Francisco Ovalle Lanuza", "Quien contrafirma"],
      ["Estado", "Firmado", "Enviado · Visto · Firmado por 1 parte · Firmado · Cancelado · Anulado"],
      ["Firmas completas", "2 de 2", "Avance de firmas"],
      ["Fecha de firma", "14 ago 2026, 11:08", "Última firma registrada"],
      ["Certificado", "SAM-FE-000128-A1F4", "Código del certificado de firma"],
      ["Archivo en Drive", "SAM-000128 — Contrato de co-hosting — Marcel Reiche.pdf", "PDF firmado + certificado"],
      ["Carpeta", "Contratos firmados / 2026 / 08 Agosto / Co-hosting", "Ruta dentro de la carpeta de contratos"],
      ["Notas", "", "Motivo de cancelación o anulación, si aplica"],
      ["Proyecto", "Brunelo 905", "Proyecto de Grow al que pertenece, si aplica"],
      ["Propiedad", "Brunelo · Apto. 905, nivel 9", "Propiedad que cubre el contrato"],
      ["Generado en", "Grow", "App donde se generó: Grow o Docs"],
    ],
    row: function (doc) {
      var fs = doc.firmantes || [];
      /* Firma única (adelanto): no hay contrafirma que contar ni representante
         que anotar — si no, la hoja dice "Firmado · 1 de 2" y se lee como
         un documento atorado. */
      var solo = !!(F().soloFirmante && F().soloFirmante(doc));
      var ultima = fs.filter(function (f) { return f.firma; }).map(function (f) { return f.firma.ts; })
        .concat(!solo && doc.firmaSpacio ? [doc.firmaSpacio.ts] : []).sort().pop();
      var path = drivePath(doc);
      return [
        doc.folio,
        F().fmtDateTime(doc.enviado),
        doc.categoria,
        (doc.nombre || doc.tipoLabel) + (doc.propiedad ? " · " + doc.propiedad : ""),
        fs.map(function (f) { return f.nombre; }).join(" · "),
        fs.map(function (f) { return f.email; }).join(" · "),
        solo ? "—" : doc.contraparteNombre,
        estadoLbl(doc),
        (fs.filter(function (f) { return f.firma; }).length + (!solo && doc.firmaSpacio ? 1 : 0)) + " de " + (fs.length + (solo ? 0 : 1)),
        ultima ? F().fmtDateTime(ultima) : "—",
        doc.certificado || "—",
        doc.estado === "firmado" ? fileName(doc) : "—",
        path.slice(0, 4).join(" / "),
        doc.motivo || "",
        doc.proyectoNombre || "—",
        doc.propiedad || "—",
        doc.origen === "grow" ? "Grow" : "Docs",
      ];
    },
  };

  /* ── Hoja FIRMAS ────────────────────────────────────────── */
  var FIRMAS = {
    nombre: "FIRMAS",
    nota: "Una fila por firmante y documento — es la evidencia del certificado.",
    cols: [
      ["Folio", "SAM-000128", "Documento al que pertenece la firma"],
      ["Parte", "Firmante 1", "Firmante 1 · Firmante 2 · Spacio AM"],
      ["Nombre", "Marcel Reiche", "Nombre tal como fue firmado"],
      ["Correo", "marcel@ejemplo.com", "Correo del enlace de firma"],
      ["Estado", "Firmado", "Pendiente · Firmado"],
      ["Fecha y hora", "14 ago 2026, 10:32", "Momento exacto de la firma"],
      ["Método", "Trazada", "Trazada · Imagen · Escrita"],
      ["Origen", "registrado al firmar", "Registro de origen de la firma"],
      ["Huella del documento", "A1F4C09B·77D2E410", "Hash del contenido firmado"],
      ["Firma guardada", "Sí", "Si el firmante guardó su firma para futuros contratos"],
    ],
    rows: function (doc) {
      var huella = F().hash(doc.folio + doc.tipo + JSON.stringify(doc.data)).slice(0, 8) + "·" + F().hash(doc.firmanteEmail || "").slice(0, 8);
      var out = (doc.firmantes || []).map(function (f, i) {
        var guardada = window.Firmas && window.Firmas.get(f.email);
        return [
          doc.folio,
          "Firmante " + (i + 1),
          f.nombre,
          f.email,
          f.firma ? "Firmado" : "Pendiente",
          f.firma ? F().fmtDateTime(f.firma.ts) : "—",
          f.firma ? metodoLbl(f.firma.metodo) : "—",
          f.firma ? (f.firma.ip || "registrado al firmar") : "—",
          huella,
          guardada ? "Sí" : "No",
        ];
      });
      if (F().soloFirmante && F().soloFirmante(doc)) return out;
      out.push([
        doc.folio, "Spacio AM", doc.contraparteNombre, doc.contraparteEmail,
        doc.firmaSpacio ? "Firmado" : "Pendiente",
        doc.firmaSpacio ? F().fmtDateTime(doc.firmaSpacio.ts) : "—",
        doc.firmaSpacio ? metodoLbl(doc.firmaSpacio.metodo) : "—",
        doc.firmaSpacio ? (doc.firmaSpacio.ip || "registrado al firmar") : "—",
        huella, "Sí",
      ]);
      return out;
    },
  };

  function tabla(hoja, docs) {
    var body = hoja === CONTRATOS
      ? docs.map(function (d) { return CONTRATOS.row(d); })
      : docs.reduce(function (acc, d) { return acc.concat(FIRMAS.rows(d)); }, []);
    return { head: hoja.cols.map(function (c) { return c[0]; }), body: body };
  }

  function toCSV(hoja, docs) {
    var t = tabla(hoja, docs);
    var esc = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
    return [t.head.map(esc).join(",")].concat(t.body.map(function (r) { return r.map(esc).join(","); })).join("\n");
  }
  function toTSV(hoja, docs) {
    var t = tabla(hoja, docs);
    return [t.head.join("\t")].concat(t.body.map(function (r) { return r.join("\t"); })).join("\n");
  }
  function download(hoja, docs) {
    var blob = new Blob(["\ufeff" + toCSV(hoja, docs)], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Spacio AM — " + hoja.nombre + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 400);
  }

  /* Toda llamada tiene un límite de tiempo. Sin él, una respuesta que no
     llega (red móvil, Apps Script lento) deja la promesa colgada para
     siempre y la pantalla que la espera nunca cambia. */
  function post(body, ms) {
    var url = endpoint();
    if (!url) return Promise.resolve({ ok: false, pending: true, reason: "sin_endpoint" });
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = null;
    var limite = new Promise(function (res) {
      timer = setTimeout(function () { if (ctrl) ctrl.abort(); res({ ok: false, error: "timeout" }); }, ms || 60000);
    });
    var req = fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ token: token() }, body)),
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (r) { return r.json(); }).catch(function (e) { return { ok: false, error: String(e) }; });
    return Promise.race([req, limite]).then(function (r) { clearTimeout(timer); return r; });
  }

  /* Cuántas firmas lleva un documento — la medida para no perder ninguna. */
  function firmasCount(d) {
    if (!d) return -1;
    return (d.firmantes || []).filter(function (f) { return f && f.firma; }).length + (d.firmaSpacio ? 1 : 0);
  }
  function parseDoc(d) {
    if (typeof d === "string") { try { return JSON.parse(d); } catch (e) { return null; } }
    return d || null;
  }

  /* ── Bandeja de salida ───────────────────────────────────────
     Una firma no puede quedarse solo en el teléfono de quien firmó ni
     perderse si la red falla. Antes de mandarla se guarda aquí, y se
     reintenta al abrir la app y al recuperar el foco. Guarda SOLO la firma
     pendiente (id del documento, quién firma y la imagen), nunca el
     contrato ni sus datos (DPI). Nada de aquí se borra hasta que el
     servidor confirma.
     Entradas: { tipo: "firma", id, folio, firmanteId | parte: "spacio", firma }
               { tipo: "legible", id }  → falta la fila de CONTRATOS/FIRMAS */
  var OUT_KEY = "spacio_sync_bandeja_v2";
  var OUT_VIEJA = "spacio_sync_outbox_v1";   /* la de antes: documentos completos; se migra */
  function leer(k) { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
  function escribirLS(k, o) {
    try { if (Object.keys(o).length) localStorage.setItem(k, JSON.stringify(o)); else localStorage.removeItem(k); return true; } catch (e) { return false; }
  }
  function outRead() { return leer(OUT_KEY); }
  function claveFirma(e) { return e.id + ":" + (e.parte === "spacio" ? "spacio" : e.firmanteId); }
  function encolar(e) {
    var o = outRead(), k = e.tipo === "legible" ? e.id + ":legible" : claveFirma(e);
    if (e.tipo === "legible" && o[k]) return true;
    o[k] = Object.assign({ ts: new Date().toISOString() }, e);
    return escribirLS(OUT_KEY, o);
  }
  function quitar(k) { var o = outRead(); if (o[k]) { delete o[k]; escribirLS(OUT_KEY, o); } }
  function cambiarEntrada(k, e) { var o = outRead(); o[k] = e; escribirLS(OUT_KEY, o); }
  /* Firmas sin confirmar (lo que ve la persona). */
  function pendientes() {
    var o = outRead();
    return Object.keys(o).filter(function (k) { return o[k] && o[k].tipo === "firma"; }).length + Object.keys(leer(OUT_VIEJA)).length;
  }
  /* Todo lo que falta subir, incluidas las filas legibles. */
  function pendientesTodo() { return Object.keys(outRead()).length + Object.keys(leer(OUT_VIEJA)).length; }

  /* Las firmas pendientes de este teléfono, encima del documento que llega
     del servidor: así quien firmó sin internet la sigue viendo firmada. */
  function conPendientes(doc) {
    if (!doc || !F() || !F().aplicarFirma) return doc;
    var o = outRead();
    Object.keys(o).forEach(function (k) {
      var e = o[k];
      if (e && e.tipo === "firma" && e.id === doc.id && !e.error) doc = F().aplicarFirma(doc, e);
    });
    return doc;
  }

  /* Enlace de firma: trae SOLO ese documento. Antes el enlace descargaba el
     registro completo (listarDocs) — todos los contratos con sus firmas
     incrustadas, varios MB — y en el teléfono esa respuesta no terminaba de
     llegar: la pantalla se quedaba en "Abriendo tu documento…".
     El documento queda solo en memoria. */
  function getDocCrudo(id, ms) {
    return post({ action: "getDoc", id: id }, ms || 25000).then(function (r) {
      var d = r && r.ok ? parseDoc(r.doc) : null;
      if (!d) return { ok: false, error: (r && r.error) || "no_encontrado", noExiste: !!(r && r.ok) };
      return { ok: true, doc: d };
    });
  }
  function getDoc(id, ms) {
    if (!id) return Promise.resolve({ ok: false, error: "sin_id" });
    return getDocCrudo(id, ms).then(function (r) {
      if (!r.ok) return r;
      var d = conPendientes(r.doc);
      var ld = F() && F().getCompleto ? F().getCompleto(id) : null;
      if (ld && firmasCount(ld) > firmasCount(d)) return { ok: true, doc: ld };
      if (F() && F().upsert) F().upsert(d);
      return { ok: true, doc: d };
    });
  }

  /* Hoja legible (CONTRATOS/FIRMAS) a partir del documento del servidor.
     Si no confirma, queda en la bandeja solo «falta la fila de id». */
  function legible(doc) {
    var body = null;
    try { body = { action: "upsertContrato", contrato: CONTRATOS.row(doc), firmas: FIRMAS.rows(doc) }; } catch (e) { body = null; }
    if (!body) return Promise.resolve({ ok: false, error: "fila_ilegible" });
    return post(body).then(function (r) {
      if (r && r.ok) quitar(doc.id + ":legible"); else encolar({ tipo: "legible", id: doc.id });
      return r || { ok: false };
    });
  }

  /* ── Acciones (el servidor manda) ─────────────────────────── */

  /* Crear: el documento nuevo va al servidor; si no confirma, no existe. */
  function crear(doc) {
    if (!doc || !doc.id) return Promise.resolve({ ok: false, error: "sin_doc" });
    return post({ action: "crearDoc", doc: doc }).then(function (r) {
      var d = r && r.ok ? parseDoc(r.doc) : null;
      if (!d) return { ok: false, error: (r && r.error) || "sin_respuesta" };
      if (F() && F().upsert) F().upsert(d);
      return legible(d).then(function (l) { return { ok: true, doc: d, legible: !!(l && l.ok) }; });
    });
  }

  /* Cambiar: solo los campos que cambiaron y las notas nuevas del historial.
     El servidor los aplica sobre SU fila: nunca reescribe data, firmantes ni
     firmas, así que un DPI no puede borrarse por una copia incompleta. */
  var CAMPOS = ["nombre", "propiedad", "propiedadId", "estado", "motivo", "enviado", "visto",
    "programado", "correoFirma", "mensaje", "archivado", "firmasCompactas"];
  function cambiar(antes, despues) {
    var cambios = {}, n = 0;
    CAMPOS.forEach(function (k) {
      if (JSON.stringify(antes[k]) === JSON.stringify(despues[k])) return;
      cambios[k] = despues[k] === undefined ? null : despues[k]; n++;
    });
    var historial = (despues.historial || []).slice((antes.historial || []).length);
    if (!n && !historial.length) return Promise.resolve({ ok: true, doc: antes, sinCambios: true });
    return post({ action: "cambiarDoc", id: antes.id, cambios: cambios, historial: historial }).then(function (r) {
      var d = r && r.ok ? parseDoc(r.doc) : null;
      if (!d) return { ok: false, error: (r && r.error) || "sin_respuesta" };
      d = conPendientes(d);
      if (F() && F().upsert) F().upsert(d);
      return legible(d).then(function () { return { ok: true, doc: d }; });
    });
  }

  /* Firmar: la firma se guarda PRIMERO en la bandeja (sin el contrato) y se
     muestra en memoria; después se sube con la acción firmar del servidor.
     f = { id, folio, firmanteId | parte: "spacio", firma: { img, metodo, ts } } */
  function firmar(f) {
    var e = { tipo: "firma", id: f.id, folio: f.folio || "", firma: { img: f.firma.img, metodo: f.firma.metodo, ts: f.firma.ts || new Date().toISOString() } };
    if (f.parte === "spacio") e.parte = "spacio"; else e.firmanteId = f.firmanteId;
    encolar(e);
    var local = F() && F().getCompleto ? F().getCompleto(f.id) : null;
    if (local) { local = F().aplicarFirma(local, e); F().upsert(local); }
    return subir(claveFirma(e)).then(function (r) {
      return r && r.ok ? { ok: true, doc: r.doc, pendientes: pendientes() }
        : { ok: false, error: r && r.error, doc: (F() && F().getCompleto(f.id)) || local, pendientes: pendientes() };
    });
  }

  /* Errores con los que reintentar no sirve: la entrada se marca, se queda
     guardada (nunca se borra una firma) y se avisa en el panel. */
  var FIJOS = { cerrado: 1, sin_firmante: 1, no_encontrado: 1, firma_invalida: 1 };
  function subir(k) {
    var e = outRead()[k];
    if (!e) return Promise.resolve({ ok: true, nada: true });
    if (e.tipo === "legible") {
      return getDocCrudo(e.id).then(function (g) {
        if (!g.ok) { if (g.noExiste) quitar(k); return g; }
        return legible(g.doc);
      });
    }
    var body = { action: "firmar", id: e.id, firma: e.firma };
    if (e.parte === "spacio") body.parte = "spacio"; else body.firmanteId = e.firmanteId;
    return post(body).then(function (r) {
      var d = r && r.ok ? parseDoc(r.doc) : null;
      if (!d) {
        if (r && FIJOS[r.error]) { e.error = r.error; cambiarEntrada(k, e); }
        return { ok: false, error: (r && r.error) || "sin_respuesta" };
      }
      /* La firma ya está en la hoja: la imagen sale de la bandeja. */
      quitar(k);
      d = conPendientes(d);
      if (F() && F().upsert) F().upsert(d);
      return legible(d).then(function () { return { ok: true, doc: d }; });
    });
  }

  /* La bandeja de antes guardaba documentos completos (con DPI). Cada uno se
     convierte en sus firmas pendientes y se borra SOLO después de dejarlas en
     la bandeja nueva. Si la hoja no tiene el documento (se creó sin internet),
     se sube completo una vez: es la única copia. */
  function migrarBandejaVieja() {
    var o = leer(OUT_VIEJA), ids = Object.keys(o);
    if (!ids.length) return Promise.resolve(true);
    return ids.reduce(function (p, id) {
      return p.then(function (seguir) {
        if (!seguir) return false;
        var ent = o[id] || {}, doc = parseDoc(ent.doc || ent);
        if (!doc || !doc.id) { delete o[id]; escribirLS(OUT_VIEJA, o); return true; }
        return getDocCrudo(doc.id).then(function (g) {
          if (!g.ok && !g.noExiste) return false;   /* sin red: se queda todo como está */
          if (g.noExiste) {
            return post({ action: "guardarDoc", doc: doc }).then(function (r) {
              if (!(r && r.ok)) return false;
              delete o[id]; escribirLS(OUT_VIEJA, o);
              encolar({ tipo: "legible", id: doc.id });
              return true;
            });
          }
          var srv = g.doc, porId = {};
          (srv.firmantes || []).forEach(function (f) { porId[f.id] = f; });
          var ok = true;
          (doc.firmantes || []).forEach(function (f) {
            if (f.firma && f.firma.img && !(porId[f.id] && porId[f.id].firma)) ok = encolar({ tipo: "firma", id: doc.id, folio: doc.folio, firmanteId: f.id, firma: { img: f.firma.img, metodo: f.firma.metodo, ts: f.firma.ts } }) && ok;
          });
          if (doc.firmaSpacio && !srv.firmaSpacio) ok = encolar({ tipo: "firma", id: doc.id, folio: doc.folio, parte: "spacio", firma: { img: doc.firmaSpacio.img, metodo: doc.firmaSpacio.metodo, ts: doc.firmaSpacio.ts } }) && ok;
          ok = encolar({ tipo: "legible", id: doc.id }) && ok;
          if (!ok) return false;
          delete o[id]; escribirLS(OUT_VIEJA, o);
          return true;
        });
      });
    }, Promise.resolve(true));
  }

  /* La copia vieja de documentos (spacio_docs_v1, contratos completos).
     Se compara con la hoja: cada firma que esté solo aquí pasa a la bandeja
     (sin el contrato). La copia se borra solo cuando la bandeja quedó vacía. */
  function migrarLegado() {
    var L = F() && F().legado ? F().legado() : null;
    if (!L) return Promise.resolve(true);
    var conFirma = L.filter(function (d) { return d && d.id && !d.demo && firmasCount(d) > 0; });
    return conFirma.reduce(function (p, doc) {
      return p.then(function (seguir) {
        if (!seguir) return false;
        var mio = F().getCompleto(doc.id);
        var traer = mio ? Promise.resolve({ ok: true, doc: mio }) : getDocCrudo(doc.id);
        return traer.then(function (g) {
          if (!g.ok) return !!g.noExiste;   /* borrado en la hoja: nada que subir */
          var srv = g.doc, porId = {}, ok = true;
          (srv.firmantes || []).forEach(function (f) { porId[f.id] = f; });
          (doc.firmantes || []).forEach(function (f) {
            if (f.firma && f.firma.img && porId[f.id] && !porId[f.id].firma) ok = encolar({ tipo: "firma", id: doc.id, folio: doc.folio, firmanteId: f.id, firma: { img: f.firma.img, metodo: f.firma.metodo, ts: f.firma.ts } }) && ok;
          });
          if (doc.firmaSpacio && doc.firmaSpacio.img && !srv.firmaSpacio) ok = encolar({ tipo: "firma", id: doc.id, folio: doc.folio, parte: "spacio", firma: { img: doc.firmaSpacio.img, metodo: doc.firmaSpacio.metodo, ts: doc.firmaSpacio.ts } }) && ok;
          return ok;
        });
      });
    }, Promise.resolve(true)).then(function (ok) {
      if (!ok) return false;
      return subirTodo().then(function () {
        if (!pendientesTodo()) { F().borrarLegado(); return true; }
        return false;
      });
    });
  }

  function subirTodo() {
    var ks = Object.keys(outRead());
    return ks.reduce(function (p, k) {
      return p.then(function () { return subir(k).catch(function () {}); });
    }, Promise.resolve());
  }

  /* Reintenta todo lo pendiente, uno por uno. Una sola vuelta a la vez. */
  var enCurso = null;
  function flush() {
    if (enCurso) return enCurso;
    enCurso = migrarBandejaVieja().then(function () { return subirTodo(); })
      .catch(function () {})
      .then(function () { enCurso = null; return { ok: true, pendientes: pendientes() }; });
    return enCurso;
  }

  /* Guardar el documento completo (solo para aligerar firmas viejas): el
     servidor lo fusiona con su fila y conserva lo que no llegue. */
  function push(accion, doc) {
    if (!doc) return Promise.resolve({ ok: false });
    return post({ action: "guardarDoc", doc: doc }).then(function (r) {
      if (!(r && r.ok)) return { ok: false, error: (r && r.error) || "sin_respuesta" };
      return legible(doc).then(function () { return { ok: true }; });
    });
  }

  /* Lectura: trae TODOS los contratos de la hoja (los de las dos apps) a la
     memoria, con las firmas pendientes de este teléfono encima. Después sube
     lo pendiente y migra la copia vieja. */
  function pull() {
    return post({ action: "listarDocs" }, 90000).then(function (r) {
      if (!r || !r.ok) return { ok: false, docs: [] };
      var docs = (r.docs || []).map(parseDoc).filter(Boolean).map(conPendientes);
      if (F() && F().replaceAll) F().replaceAll(docs);
      return flush().then(function () { return migrarLegado(); }).catch(function () {})
        .then(function () { return { ok: true, docs: docs }; });
    });
  }

  /* Cerrar sesión: primero se intenta subir lo pendiente y migrar la copia
     vieja. Después se borra todo lo de la persona MENOS la bandeja de salida
     (si quedó algo, se queda hasta que suba). Devuelve cuántas firmas quedan. */
  function salir() {
    return flush().then(function () { return migrarLegado(); }).catch(function () { return false; })
      .then(function () {
        var legadoQueda = !!(F().legado && F().legado());
        F().limpiarAlSalir({ conservarLegado: legadoQueda });
        return { pendientes: pendientes(), legado: legadoQueda };
      });
  }
  /* Antes de cerrar sesión: ¿hay firmas sin subir? */
  function haySinSubir() { return pendientes() > 0 || !!(F() && F().legado && F().legado()); }

  /* Texto corto para un error del servidor. */
  function motivo(r) {
    var e = String((r && r.error) || "");
    if (!e || e === "timeout" || /fetch|network|Failed|abort/i.test(e)) return "sin conexión";
    if (e === "session") return "tu sesión venció";
    return e;
  }

  /* Archivo: el PDF firmado + certificado va a la carpeta de contratos. */
  function archivar(doc, base64) {
    return post({
      action: "archivarPDF",
      archivo: fileName(doc), carpeta: drivePath(doc).slice(0, 4),
      pdfBase64: base64,
    });
  }

  /* Borra el documento del registro compartido (no solo del navegador). */
  function borrar(doc) {
    return post({ action: "borrarDoc", id: doc && doc.id });
  }

  /* ── Hora de Guatemala ─────────────────────────────────────
     Guatemala es UTC−6 todo el año (no cambia de horario), así que la
     conversión es fija y no depende de la zona del dispositivo: si quien
     programa está de viaje, 7:00 sigue siendo 7:00 en Guatemala. */
  var GT_MS = 6 * 3600 * 1000;
  var GT_MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function p2(n) { return String(n).padStart(2, "0"); }
  function gtPartes(t) {
    var g = new Date((t == null ? Date.now() : new Date(t).getTime()) - GT_MS);
    return { y: g.getUTCFullYear(), m: g.getUTCMonth() + 1, d: g.getUTCDate(), h: g.getUTCHours(), mi: g.getUTCMinutes() };
  }
  function gtFecha(t) { var p = gtPartes(t); return p.y + "-" + p2(p.m) + "-" + p2(p.d); }
  /* "2026-09-24" + "07:00" (Guatemala) → ISO UTC */
  function gtAISO(fecha, hora) {
    var a = String(fecha || "").split("-").map(Number), b = String(hora || "").split(":").map(Number);
    if (a.length !== 3 || !a[0] || isNaN(b[0])) return null;
    return new Date(Date.UTC(a[0], a[1] - 1, a[2], b[0] + 6, b[1] || 0)).toISOString();
  }
  function gtEtiqueta(iso) {
    if (!iso) return "—";
    var p = gtPartes(iso), h12 = p.h % 12 || 12;
    return p.d + " " + GT_MESES[p.m - 1] + " " + p.y + " · " + h12 + ":" + p2(p.mi) + (p.h < 12 ? " a. m." : " p. m.");
  }
  /* Próxima vez que el reloj de Guatemala marque hh:00 (con 5 min de margen). */
  function gtProxima(hh) {
    var hoy = gtFecha(), hora = p2(hh) + ":00";
    var iso = gtAISO(hoy, hora);
    if (new Date(iso).getTime() > Date.now() + 5 * 60000) return { fecha: hoy, hora: hora };
    return { fecha: gtFecha(Date.now() + 86400000), hora: hora };
  }
  var GT = { partes: gtPartes, fecha: gtFecha, aISO: gtAISO, etiqueta: gtEtiqueta, proxima: gtProxima };

  /* Arma el correo (asunto + HTML) sin enviarlo: lo usan el envío inmediato
     y el programado, así los dos salen idénticos. */
  function armarCorreo(id, doc, extra) {
    if (!window.SpacioEmails) return { error: "sin_plantillas" };
    var F = window.Docs;
    var d = Object.assign({
      nombre: doc.firmanteNombre, correo: doc.firmanteEmail,
      documento: doc.nombre || doc.tipoLabel, folio: doc.folio,
      contraparte: doc.contraparteNombre, certificado: doc.certificado || "",
      fechaFirmante: doc.firmaFirmante ? F.fmtDateTime(doc.firmaFirmante.ts) : "pendiente",
      fechaSpacio: doc.firmaSpacio ? F.fmtDateTime(doc.firmaSpacio.ts) : "pendiente",
      enviado: F.relative(doc.enviado), fecha: F.fmtDateTime(doc.enviado),
      url: (window.SPACIO_FIRMA_BASE || "https://docs.spacioam.com/index.html") + "?firmar=" + doc.id,
    }, extra || {});
    var ASUNTOS = {
      solicitudFirma: doc.nombre ? doc.nombre + " · listo para firmar" : "Tu " + (doc.tipoLabel || "documento").toLowerCase() + " está listo para firmar",
      recordatorioFirma: "Recordatorio: tu " + (doc.tipoLabel || "documento").toLowerCase() + " sigue pendiente de firma",
      copiaFirmada: "Tu copia firmada · " + doc.folio,
      envioCancelado: "Cancelamos el envío de tu " + (doc.tipoLabel || "documento").toLowerCase(),
      solicitudDatos: "Necesitamos unos datos para tu " + (doc.tipoLabel || "documento").toLowerCase(),
    };
    var m = window.SpacioEmails.build(id, d, {});
    var destinos = (extra && extra.to) ||
      (doc.firmantes || []).map(function (f) { return f.email; }).join(",");
    if (!destinos) return { error: "sin_destino" };
    return {
      to: destinos,
      nota: (extra && extra.mensaje) || doc.mensaje || "",
      asunto: (extra && extra.asunto) || ASUNTOS[id] || ("Spacio AM · " + (doc.nombre || doc.tipoLabel)),
      html: m.html, texto: m.text || "",
      bcc: (extra && extra.bcc) || doc.contraparteEmail || "",
      pdfBase64: (extra && extra.pdfBase64) || "", pdfNombre: (extra && extra.pdfNombre) || "",
    };
  }
  /* Correo: sale del mismo remitente y con la misma plantilla en las dos apps.
     id = solicitudFirma · recordatorio · copiaFirmada · cancelado · solicitudDatos */
  function correo(id, doc, extra) {
    var c = armarCorreo(id, doc, extra);
    if (c.error) return Promise.resolve({ ok: false, error: c.error });
    return post(Object.assign({ action: "enviarCorreo" }, c));
  }

  /* Envío programado: el servidor guarda un correo ya armado por firmante y
     un activador de Apps Script lo manda a la hora indicada — aunque este
     navegador esté cerrado. Al salir, el servidor actualiza el documento. */
  function programar(doc, sendAt) {
    var envios = [];
    for (var i = 0; i < (doc.firmantes || []).length; i++) {
      var f = doc.firmantes[i];
      var c = armarCorreo("solicitudFirma", doc, { to: f.email, nombre: f.nombre, mensaje: doc.mensaje || "" });
      if (c.error) return Promise.resolve({ ok: false, error: c.error });
      envios.push(c);
    }
    return post({ action: "programarCorreo", docId: doc.id, folio: doc.folio, sendAt: sendAt, etiqueta: gtEtiqueta(sendAt) + " (Guatemala)", envios: envios });
  }
  function cancelarProgramado(docId) { return post({ action: "cancelarProgramado", docId: docId }, 25000); }

  /* Propiedades de EPI: el backend de Contratos las lee de la hoja de EPI
     (Config → props). Se guardan aquí para que el selector abra al instante
     y se refrescan en segundo plano. */
  var PROPS_KEY = "spacio_props_epi_v1";
  function propiedadesCache() {
    try { var c = JSON.parse(localStorage.getItem(PROPS_KEY) || "null"); return (c && c.list) || []; } catch (e) { return []; }
  }
  function propiedades() {
    return post({ action: "propiedades" }, 30000).then(function (r) {
      if (!r || !r.ok || !Array.isArray(r.propiedades)) return { ok: false, error: (r && r.error) || "sin_respuesta", list: propiedadesCache() };
      try { localStorage.setItem(PROPS_KEY, JSON.stringify({ ts: Date.now(), list: r.propiedades })); } catch (e) {}
      return { ok: true, list: r.propiedades };
    });
  }

  /* Permisos y firmas guardadas viven también en la hoja, para que valgan
     en cualquier dispositivo y en las dos apps. */
  function permisosRemotos() {
    return post({ action: "permisos", modo: "leer" }).then(function (r) {
      if (r && r.ok && r.permisos) window.SPACIO_PERMS_REMOTOS = r.permisos;
      return r;
    });
  }
  function guardarPermiso(correoUsr, perms) {
    return post({ action: "permisos", modo: "guardar", correo: correoUsr,
      generar: !!perms.generar, firmar: !!perms.firmar, admin: !!perms.admin });
  }
  function firmaRemota(correoUsr) {
    return post({ action: "firmaGuardada", modo: "leer", correo: correoUsr });
  }
  function guardarFirmaRemota(correoUsr, nombre, img) {
    return post({ action: "firmaGuardada", modo: "guardar", correo: correoUsr, nombre: nombre, img: img });
  }

  window.SpacioSync = {
    SHEET_ID: SHEET_ID, FOLDER_ID: FOLDER_ID,
    SHEET_URL: "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit",
    FOLDER_URL: "https://drive.google.com/drive/folders/" + FOLDER_ID,
    HOJAS: [CONTRATOS, FIRMAS], CONTRATOS: CONTRATOS, FIRMAS: FIRMAS,
    tabla: tabla, toCSV: toCSV, toTSV: toTSV, download: download,
    push: push, pull: pull, getDoc: getDoc, GT: GT, armarCorreo: armarCorreo, programar: programar,
    crear: crear, cambiar: cambiar, firmar: firmar, salir: salir, haySinSubir: haySinSubir, motivo: motivo,
    pendientesTodo: pendientesTodo, migrarLegado: migrarLegado,
    cancelarProgramado: cancelarProgramado, propiedades: propiedades, propiedadesCache: propiedadesCache, archivar: archivar, borrar: borrar, correo: correo, post: post,
    flush: flush, pendientes: pendientes, firmasCount: firmasCount, outbox: outRead,
    permisosRemotos: permisosRemotos, guardarPermiso: guardarPermiso,
    firmaRemota: firmaRemota, guardarFirmaRemota: guardarFirmaRemota,
    token: token, setToken: setToken,
    fileName: fileName, drivePath: drivePath,
    endpoint: endpoint, setEndpoint: setEndpoint,
  };
})();
