/* ══════════════════════════════════════════════════════════════
   Spacio AM — Base de datos y archivo
   · Hoja de cálculo: registro legible de CONTRATOS y FIRMAS
   · Drive: carpeta donde se archiva el PDF firmado + certificado
   Estructura tomada del esquema de Grow (hojas CONTRATOS/FIRMAS).
   Si se configura el endpoint de Apps Script, cada cambio se
   escribe solo; sin endpoint, las filas se exportan a CSV/TSV.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var SHEET_ID = "1r__zfIAFLr6mxcuAN6HwQF1OmLTG-lce-jv_naGRDVU";
  var FOLDER_ID = "1GzxF5El3YaT0UVZLMBeRIfwXgzZxyqSa";
  var EP_KEY = "spacio_sync_endpoint_v1";

  var MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  function F() { return window.Docs; }
  function endpoint() { try { return localStorage.getItem(EP_KEY) || ""; } catch (e) { return ""; } }
  function setEndpoint(url) { try { localStorage.setItem(EP_KEY, url || ""); } catch (e) {} }

  /* Nombre y ruta del archivo en Drive — legible, ordenable por folio */
  function fileName(doc) {
    var nm = (doc.firmanteNombre || "Sin nombre").split(/\s+/).slice(0, 3).join(" ");
    return doc.folio + " — " + doc.tipoLabel + " — " + nm + ".pdf";
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
    nota: "Una fila por documento. Ordenada del más reciente al más antiguo.",
    cols: [
      ["Folio", "SAM-000128", "Identificador legible del documento"],
      ["Fecha de envío", "14 ago 2026, 10:32", "Cuándo se envió a firma"],
      ["Categoría", "Empleados", "Servicios · Co-hosting · Empleados"],
      ["Documento", "Contrato laboral", "Tipo de documento generado"],
      ["Firmantes", "Gabriel Asturias Moreira", "1 o 2 por la otra parte, separados por ·"],
      ["Correos", "gabriel@ejemplo.com", "Correo de cada firmante"],
      ["Por Spacio AM", "Juan Francisco Ovalle Lanuza", "Quien contrafirma"],
      ["Estado", "Firmado", "Enviado · Visto · Firmado por 1 parte · Firmado · Cancelado · Anulado"],
      ["Firmas completas", "2 de 2", "Avance de firmas"],
      ["Fecha de firma", "14 ago 2026, 11:08", "Última firma registrada"],
      ["Certificado", "SAM-FE-000128-A1F4", "Código del certificado de firma"],
      ["Archivo en Drive", "SAM-000128 — Contrato laboral — Gabriel Asturias.pdf", "PDF firmado + certificado"],
      ["Carpeta", "Contratos firmados / 2026 / 08 Agosto / Empleados", "Ruta dentro de la carpeta de contratos"],
      ["Notas", "", "Motivo de cancelación o anulación, si aplica"],
    ],
    row: function (doc) {
      var fs = doc.firmantes || [];
      var ultima = fs.filter(function (f) { return f.firma; }).map(function (f) { return f.firma.ts; })
        .concat(doc.firmaSpacio ? [doc.firmaSpacio.ts] : []).sort().pop();
      var path = drivePath(doc);
      return [
        doc.folio,
        F().fmtDateTime(doc.enviado),
        doc.categoria,
        doc.tipoLabel,
        fs.map(function (f) { return f.nombre; }).join(" · "),
        fs.map(function (f) { return f.email; }).join(" · "),
        doc.contraparteNombre,
        estadoLbl(doc),
        (fs.filter(function (f) { return f.firma; }).length + (doc.firmaSpacio ? 1 : 0)) + " de " + (fs.length + 1),
        ultima ? F().fmtDateTime(ultima) : "—",
        doc.certificado || "—",
        doc.estado === "firmado" ? fileName(doc) : "—",
        path.slice(0, 4).join(" / "),
        doc.motivo || "",
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
      ["Nombre", "Gabriel Asturias Moreira", "Nombre tal como fue firmado"],
      ["Correo", "gabriel@ejemplo.com", "Correo del enlace de firma"],
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

  /* Escritura automática (requiere el Web App de Apps Script con
     acceso a la hoja y a la carpeta). Sin endpoint no falla: avisa. */
  function push(accion, doc) {
    var url = endpoint();
    if (!url) return Promise.resolve({ ok: false, pending: true, reason: "sin_endpoint" });
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: accion, sheetId: SHEET_ID, folderId: FOLDER_ID,
        contrato: CONTRATOS.row(doc), firmas: FIRMAS.rows(doc),
        archivo: fileName(doc), carpeta: drivePath(doc).slice(0, 4),
      }),
    }).then(function (r) { return r.json(); }).catch(function (e) { return { ok: false, error: String(e) }; });
  }

  window.SpacioSync = {
    SHEET_ID: SHEET_ID, FOLDER_ID: FOLDER_ID,
    SHEET_URL: "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit",
    FOLDER_URL: "https://drive.google.com/drive/folders/" + FOLDER_ID,
    HOJAS: [CONTRATOS, FIRMAS], CONTRATOS: CONTRATOS, FIRMAS: FIRMAS,
    tabla: tabla, toCSV: toCSV, toTSV: toTSV, download: download, push: push,
    fileName: fileName, drivePath: drivePath,
    endpoint: endpoint, setEndpoint: setEndpoint,
  };
})();
