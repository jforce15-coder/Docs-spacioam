/* Notificaciones del generador de contratos → centro de notificaciones.
   Fuentes reales: documentos enviados a firma, sin respuesta, firmados
   por archivar y estado de la escritura automática en la hoja.        */
(function () {
  "use strict";
  function build(opts) {
    var o = opts || {};
    var F = window.Docs, S = window.SpacioSync;
    var docs = F.all();
    var out = [];
    var dias = function (iso) { return (Date.now() - new Date(iso).getTime()) / 86400000; };

    docs.forEach(function (d) {
      var pend = (d.firmantes || []).filter(function (f) { return !f.firma; });
      if (["enviado", "visto", "parcial"].indexOf(d.estado) >= 0) {
        var viejo = dias(d.enviado) >= 5;
        out.push({
          id: "firma-" + d.id,
          tipo: viejo ? "alerta" : "accion",
          subcat: viejo ? "Sin respuesta" : "Firmas pendientes",
          texto: viejo
            ? d.tipoLabel + " sin firmar desde hace " + Math.round(dias(d.enviado)) + " días"
            : d.tipoLabel + " esperando firma",
          contexto: d.folio + " · " + pend.map(function (f) { return f.nombre; }).join(" y "),
          ts: new Date(d.enviado).getTime(),
          abrir: function () { o.abrirDoc && o.abrirDoc(d); },
        });
      }
      if (d.estado === "firmado" && !d.archivado) {
        out.push({
          id: "archivar-" + d.id,
          tipo: "accion",
          subcat: "Listos para archivar",
          texto: "Copia firmada lista: " + d.tipoLabel,
          contexto: d.folio + " · descárgala y súbela a la carpeta de contratos",
          ts: new Date((d.firmaSpacio && d.firmaSpacio.ts) || d.enviado).getTime(),
          abrir: function () { o.abrirDoc && o.abrirDoc(d); },
        });
      }
    });

    if (docs.length && S && !S.endpoint()) {
      out.push({
        id: "sync-endpoint",
        tipo: "alerta",
        subcat: "Base de datos",
        texto: "La hoja de contratos no se está actualizando sola",
        contexto: "Falta conectar el Web App de Apps Script en Base de datos",
        ts: Date.now(),
        abrir: function () { o.abrirDB && o.abrirDB(); },
      });
    }
    return out;
  }
  window.SpacioNotis = { build: build };
})();
